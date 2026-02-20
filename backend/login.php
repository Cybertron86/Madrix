<?php
declare(strict_types = 1)
;

require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
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
    echo json_encode(['error' => 'Invalid JSON']);
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

// Rotate token on use to prevent replay attacks
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// ==========================
// Rate Limiting
//
// Shared logic with register.php: tries APCu first, falls back to DB.
// Key: login_rl_IP
// Limit: 10 attempts per 15 minutes
// ==========================
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash = hash('sha256', $ip);
$rateLimitKey = 'login_rl_' . $ipHash;
$rateLimit = 10;
$ratePeriod = 900; // 15 minutes

$apcuAvailable = function_exists('apcu_enabled') && apcu_enabled();

if ($apcuAvailable) {
    // APCu Path
    $attempts = apcu_fetch($rateLimitKey, $exists);

    if ($exists && (int)$attempts >= $rateLimit) {
        http_response_code(429);
        header('Retry-After: ' . $ratePeriod);
        echo json_encode(['error' => 'Too many login attempts. Please try again in 15 minutes.']);
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
    // Database Fallback Path
    try {
        // Clean up expired
        $pdo->prepare("DELETE FROM rate_limits WHERE reset_at < NOW()")->execute();

        // Check attempts
        $stmt = $pdo->prepare("
            SELECT attempts FROM rate_limits
            WHERE ip_hash = :ip_hash AND action = 'login'
        ");
        $stmt->execute([':ip_hash' => $ipHash]);
        $row = $stmt->fetch();

        if ($row && (int)$row['attempts'] >= $rateLimit) {
            http_response_code(429);
            header('Retry-After: ' . $ratePeriod);
            echo json_encode(['error' => 'Too many login attempts. Please try again in 15 minutes.']);
            exit;
        }

        // Upsert
        $pdo->prepare("
            INSERT INTO rate_limits (ip_hash, action, attempts, reset_at)
            VALUES (:ip_hash, 'login', 1, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
            ON DUPLICATE KEY UPDATE attempts = attempts + 1
        ")->execute([':ip_hash' => $ipHash]);

    }
    catch (PDOException $e) {
        // Fail open if rate limit DB is down, but log it
        error_log('[login.php] DB rate limit error: ' . $e->getMessage());
    }
}

// ==========================
// Input Extraction
// ==========================
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');
$remember = !empty($data['remember']);

// Basic validation to fail fast
if (strlen($username) > 30 || strlen($password) > 128) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input length']);
    exit;
}

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing credentials']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT id, username, password_hash, role
        FROM users
        WHERE username = :username
        LIMIT 1
    ");

    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    // ==========================
    // Session Security
    // ==========================
    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'ua_hash' => hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? ''),
        'ip' => $ip
    ];

    // ==========================
    // Remember Me
    // ==========================
    if ($remember) {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expires = date('Y-m-d H:i:s', time() + REMEMBER_LIFETIME);

        $stmt = $pdo->prepare("
            INSERT INTO remember_tokens
            (user_id, token_hash, user_agent, expires_at)
            VALUES (:user_id, :token_hash, :user_agent, :expires_at)
        ");

        $stmt->execute([
            ':user_id' => $_SESSION['user']['id'],
            ':token_hash' => $tokenHash,
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            ':expires_at' => $expires
        ]);

        setcookie(
            REMEMBER_COOKIE,
            $token,
        [
            'expires' => time() + REMEMBER_LIFETIME,
            'path' => '/',
            'secure' => $isHttps, // from bootstrap.php
            'httponly' => true,
            'samesite' => 'Strict'
        ]
        );
    }

    // Clear CSRF after successful login (session regenerated)
    unset($_SESSION['csrf_token']);

    echo json_encode([
        'success' => true,
        'user' => [
            'username' => $user['username'],
            'role' => $user['role']
        ]
    ]);

    exit;

}
catch (PDOException $e) {
    error_log('[login.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
    exit;
}
