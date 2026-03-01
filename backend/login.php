<?php
declare(strict_types = 1)
;

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
    Response::json(['error' => 'Invalid JSON'], 400);
}

// ==========================
// CSRF & Rate Limiting
// ==========================
Security::validateCsrf($data);

// Rotate token
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

Security::checkRateLimit('login', 10, 900, $pdo);

// ==========================
// Input Extraction
// ==========================
$username = trim((string)($data['username'] ?? ''));
$password = (string)($data['password'] ?? '');
$remember = !empty($data['remember']);

// Basic validation to fail fast
if (strlen($username) > 30 || strlen($password) > 128) {
    Response::json(['error' => 'Invalid input length'], 400);
}

if ($username === '' || $password === '') {
    Response::json(['error' => 'Missing credentials'], 400);
}

try {
    // 1. Fetch User Record
    $stmt = $pdo->prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        Response::json(['error' => 'Invalid username or password'], 401);
    }

    // 2. Successful Login: Bind to Session
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['last_regen'] = time();

    // Bind session to browser fingerprint & IP
    $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? '';
    $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';

    // 3. Optional Remember Token
    if ($remember) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + REMEMBER_LIFETIME);

        $stmt = $pdo->prepare("
            INSERT INTO remember_tokens (token_hash, user_id, user_agent, expires_at)
            VALUES (:token, :user_id, :user_agent, :expires_at)
        ");
        $stmt->execute([
            ':token' => hash('sha256', $token),
            ':user_id' => $user['id'],
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            ':expires_at' => $expires
        ]);

        setcookie(REMEMBER_COOKIE, $token, [
            'expires' => time() + REMEMBER_LIFETIME,
            'path' => '/',
            'secure' => true, // Enforce HTTPS
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    }

    // Success Response
    Response::json([
        'success' => true,
        'user' => [
            'username' => $user['username'],
            'role' => $user['role']
        ]
    ]);

}
catch (PDOException $e) {
    error_log('[login.php] ' . $e->getMessage());
    Response::json(['error' => 'Internal server error'], 500);
}
