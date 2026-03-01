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

require_once __DIR__ . '/utils.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::json(['error' => 'Method not allowed'], 405);
}

// ==========================
// Input Handling
// ==========================
$rawInput = file_get_contents('php://input');
if (strlen($rawInput) > 2048) {
    Response::json(['error' => 'Request body too large'], 413);
}

$data = json_decode($rawInput, true);
if (!is_array($data)) {
    Response::json(['error' => 'Invalid JSON input'], 400);
}

// ==========================
// CSRF & Rate Limiting
// ==========================
Security::validateCsrf($data);

// Rotate token
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

Security::checkRateLimit('register', 5, 3600, $pdo);

// ==========================
// Input Extraction & Validation
// ==========================
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');
$remember = !empty($data['remember']);
$clientUserAgent = substr(trim((string)($data['device'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 512);

$errors = [];
$userErr = Validator::validateUsername($username);
if ($userErr)
    $errors[] = $userErr;

$pwErrors = Validator::validatePassword($password);
$errors = array_merge($errors, $pwErrors);

if (!empty($errors)) {
    Response::json(['error' => $errors], 400);
}

try {
    $pdo->beginTransaction();

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
    $stmt->execute([$username, $passwordHash]);
    $userId = (int)$pdo->lastInsertId();

    if ($remember) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + REMEMBER_LIFETIME);

        $stmt = $pdo->prepare("
            INSERT INTO remember_tokens (token_hash, user_id, user_agent, expires_at)
            VALUES (:token, :user_id, :user_agent, :expires_at)
        ");
        $stmt->execute([
            ':token' => hash('sha256', $token),
            ':user_id' => $userId,
            ':user_agent' => $clientUserAgent,
            ':expires_at' => $expires
        ]);

        setcookie(REMEMBER_COOKIE, $token, [
            'expires' => time() + REMEMBER_LIFETIME,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    }

    // Session binding
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['role'] = 'user';
    $_SESSION['last_regen'] = time();
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? '';
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $pdo->commit();

    Response::json(['success' => true]);

}
catch (PDOException $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();

    error_log('[register.php] ' . $e->getMessage());
    $msg = ($e->getCode() == 23000) ? 'Username already taken.' : 'Registration failed.';
    Response::json(['error' => $msg], 500);
}