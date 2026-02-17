<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight Request (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Nur POST erlaubt
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ==========================
// Rate Limiting
// ==========================

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$cacheKey = "register_attempts_$ip";

if (!isset($_SESSION[$cacheKey])) {
    $_SESSION[$cacheKey] = [
        'count' => 0,
        'reset_time' => time() + 3600
    ];
}

if (time() > $_SESSION[$cacheKey]['reset_time']) {
    $_SESSION[$cacheKey] = [
        'count' => 0,
        'reset_time' => time() + 3600
    ];
}

if ($_SESSION[$cacheKey]['count'] >= 5) {
    http_response_code(429);
    echo json_encode([
        'error' => 'Zu viele Registrierungsversuche. Bitte später erneut versuchen.'
    ]);
    exit;
}

$_SESSION[$cacheKey]['count']++;

// ==========================
// Input lesen & validieren
// ==========================

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$remember = !empty($data['remember']);

$errors = [];

// Username Validierung
if (strlen($username) < 3 || strlen($username) > 30) {
    $errors[] = 'Username muss zwischen 3 und 30 Zeichen lang sein';
}

if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
    $errors[] = 'Username darf nur Buchstaben, Zahlen, Unterstrich und Bindestrich enthalten';
}

// Passwort Validierung
if (strlen($password) < 8) {
    $errors[] = 'Passwort muss mindestens 8 Zeichen lang sein';
}

if (!preg_match('/[A-Z]/', $password)) {
    $errors[] = 'Passwort muss mindestens einen Großbuchstaben enthalten';
}

if (!preg_match('/[a-z]/', $password)) {
    $errors[] = 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
}

if (!preg_match('/[0-9]/', $password)) {
    $errors[] = 'Passwort muss mindestens eine Ziffer enthalten';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['error' => $errors]);
    exit;
}

// Passwort sicher hashen
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {

    // ==========================
    // TRANSACTION START
    // ==========================
    $pdo->beginTransaction();

    // User speichern
    $stmt = $pdo->prepare("
        INSERT INTO users (username, password_hash)
        VALUES (:username, :password_hash)
    ");

    $stmt->execute([
        ':username' => $username,
        ':password_hash' => $passwordHash
    ]);

    $userId = (int) $pdo->lastInsertId();

    // ==========================
    // Remember Me Token (optional)
    // ==========================
    if ($remember) {

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);

        $expires = date(
            'Y-m-d H:i:s',
            time() + REMEMBER_LIFETIME
        );

        $stmt = $pdo->prepare("
            INSERT INTO remember_tokens
            (user_id, token_hash, user_agent, expires_at)
            VALUES (:user_id, :token_hash, :user_agent, :expires_at)
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':token_hash' => $tokenHash,
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            ':expires_at' => $expires
        ]);

        // Secure Cookie setzen
        setcookie(
            REMEMBER_COOKIE,
            $token,
            [
                'expires' => time() + REMEMBER_LIFETIME,
                'path' => '/',
                'secure' => isset($_SERVER['HTTPS']), // nur HTTPS
                'httponly' => true,
                'samesite' => 'Strict'
            ]
        );
    }

    // ==========================
    // Session Sicherheit
    // ==========================
    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id' => $userId,
        'username' => $username,
        'role' => 'user'
    ];

    // ==========================
    // TRANSACTION COMMIT
    // ==========================
    $pdo->commit();

    echo json_encode([
        'success' => true
    ]);

    exit;

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);

    exit;
}


