<?php
declare(strict_types = 1)
;

/**
 * register.php
 *
 * Rate limiting uses APCu when available.
 * If APCu is not available in the FPM context, falls back to a database
 * table (rate_limits) so the endpoint never crashes with "undefined function".
 *
 * This makes the root cause of any APCu FPM issue immediately visible:
 * the response will work either way, and the PHP error log will show
 * "APCu not available in FPM" as a clear diagnostic message.
 */

require_once __DIR__ . '/config/bootstrap.php';

// $pdo and $isHttps are provided by bootstrap.php

// ==========================
// Security Response Headers
// ==========================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // only for development. for dev allow only neccessary origins
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()');
header("Content-Security-Policy: default-src 'none'");

if ($isHttps) {
    header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ==========================
// Input Size Cap
// ==========================
$rawInput = file_get_contents('php://input');

if (strlen($rawInput) > 2048) {
    http_response_code(413);
    echo json_encode(['error' => 'Request body too large']);
    exit;
}

$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// ==========================
// CSRF Token Validation
// ==========================
$submittedCsrfToken = (string)($data['csrf_token'] ?? '');

if (
empty($_SESSION['csrf_token']) ||
!hash_equals((string)$_SESSION['csrf_token'], $submittedCsrfToken)
) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid or missing CSRF token']);
    exit;
}

$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// ==========================
// Rate Limiting
//
// Tries APCu first. If APCu functions are not available in this runtime
// context (PHP-FPM), falls back to a database-based rate limiter.
//
// Why APCu might be unavailable in FPM even when `php -m` shows it:
//   - apc.enabled=0 in the ini read by FPM (different ini path than CLI)
//   - extension loaded but disabled via ini override
//   - The 00-apcu.ini was not created correctly during the Docker build
//
// The fallback ensures the endpoint always works while the Docker/ini
// issue is being diagnosed. Check PHP-FPM error logs for:
//   "[register.php] APCu not available in FPM context"
// ==========================
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash = hash('sha256', $ip);
$rateLimitKey = 'register_rl_' . $ipHash;
$rateLimit = 5;
$ratePeriod = 3600;

// Check whether APCu functions actually work in THIS runtime context (FPM).
// extension_loaded('apcu') can return true even when apc.enabled=0 —
// in that case the functions exist but immediately return false/null.
// apcu_enabled() is the reliable check: returns true only when APCu is
// fully functional including the enabled ini setting.
$apcuAvailable = function_exists('apcu_enabled') && apcu_enabled();

if ($apcuAvailable) {
    // ----- APCu rate limiting -----
    $attempts = apcu_fetch($rateLimitKey, $exists);

    if ($exists && (int)$attempts >= $rateLimit) {
        http_response_code(429);
        header('Retry-After: ' . $ratePeriod);
        echo json_encode(['error' => 'Too many registration attempts. Please try again in 1 hour.']);
        exit;
    }

    if ($exists) {
        apcu_inc($rateLimitKey);
    }
    else {
        apcu_store($rateLimitKey, 1, $ratePeriod);
    }

}
else {
    // ----- Database fallback rate limiting -----
    // APCu is not functional in this FPM context.
    // Log this so the Docker/ini issue is visible in error logs.
    error_log('[register.php] APCu not available in FPM context — using DB rate limit fallback. Check /usr/local/etc/php/conf.d/00-apcu.ini and apc.enabled in phpinfo().');

    try {
        // Clean up expired entries first
        $pdo->prepare("DELETE FROM rate_limits WHERE reset_at < NOW()")->execute();

        // Check current attempt count for this IP
        $stmt = $pdo->prepare("
            SELECT attempts FROM rate_limits
            WHERE ip_hash = :ip_hash AND action = 'register'
        ");
        $stmt->execute([':ip_hash' => $ipHash]);
        $row = $stmt->fetch();

        if ($row && (int)$row['attempts'] >= $rateLimit) {
            http_response_code(429);
            header('Retry-After: ' . $ratePeriod);
            echo json_encode(['error' => 'Too many registration attempts. Please try again in 1 hour.']);
            exit;
        }

        // Upsert: insert first attempt or increment existing counter
        $pdo->prepare("
            INSERT INTO rate_limits (ip_hash, action, attempts, reset_at)
            VALUES (:ip_hash, 'register', 1, DATE_ADD(NOW(), INTERVAL 1 HOUR))
            ON DUPLICATE KEY UPDATE attempts = attempts + 1
        ")->execute([':ip_hash' => $ipHash]);

    }
    catch (PDOException $e) {
        // If the rate_limits table doesn't exist yet, log and continue.
        // Rate limiting is a protection layer, not a hard dependency.
        // See the SQL below to create the table.
        error_log('[register.php] DB rate limit error: ' . $e->getMessage());
    }
}

// ==========================
// Input Extraction
// ==========================
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');
$remember = !empty($data['remember']);
$clientUserAgent = substr(
    trim((string)($data['device'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '')),
    0,
    512
);

// ==========================
// Validation
// ==========================
$errors = [];

if (strlen($username) < 3 || strlen($username) > 30) {
    $errors[] = 'Username must be between 3 and 30 characters';
}
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
    $errors[] = 'Username may only contain letters, numbers, underscores, and hyphens';
}
if (strlen($password) < 12) {
    $errors[] = 'Password must be at least 12 characters long';
}
if (strlen($password) > 128) {
    $errors[] = 'Password must not exceed 128 characters';
}
if (!preg_match('/[A-Z]/', $password)) {
    $errors[] = 'Password must contain at least one uppercase letter';
}
if (!preg_match('/[a-z]/', $password)) {
    $errors[] = 'Password must contain at least one lowercase letter';
}
if (!preg_match('/[0-9]/', $password)) {
    $errors[] = 'Password must contain at least one digit';
}
if (!preg_match('/[!@#$%^&*()\-_=+\[\]{};:\'",.<>?\/\\\\|`~]/', $password)) {
    $errors[] = 'Password must contain at least one special character';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['error' => $errors]);
    exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO users (username, password_hash)
        VALUES (:username, :password_hash)
    ");
    $stmt->execute([
        ':username' => $username,
        ':password_hash' => $passwordHash,
    ]);
    $userId = (int)$pdo->lastInsertId();

    if ($remember) {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expires = date('Y-m-d H:i:s', time() + REMEMBER_LIFETIME);

        $stmt = $pdo->prepare("
            INSERT INTO remember_tokens (user_id, token_hash, user_agent, expires_at)
            VALUES (:user_id, :token_hash, :user_agent, :expires_at)
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':token_hash' => $tokenHash,
            ':user_agent' => $clientUserAgent,
            ':expires_at' => $expires,
        ]);

        setcookie(REMEMBER_COOKIE, $token, [
            'expires' => time() + REMEMBER_LIFETIME,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }

    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id' => $userId,
        'username' => $username,
        'role' => 'user',
        'ua_hash' => hash('sha256', $clientUserAgent),
        'ip' => $ip,
    ];

    $pdo->commit();

    unset($_SESSION['csrf_token']);

    echo json_encode(['success' => true]);
    exit;

}
catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(sprintf(
        '[register.php] PDOException | SQLSTATE: %s | Message: %s | IP: %s | Time: %s',
        $e->getCode(),
        $e->getMessage(),
        $ip,
        date('Y-m-d H:i:s')
    ));

    $userMessage = 'Registration failed. Please try again later.';
    if ((int)$e->getCode() === 23000) {
        $userMessage = 'This username is already taken. Please choose a different one.';
    }

    http_response_code(500);
    echo json_encode(['error' => $userMessage]);
    exit;
}