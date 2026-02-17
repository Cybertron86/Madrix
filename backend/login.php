<?php
declare(strict_types=1);

require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
// Input lesen
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

    $stmt->execute([
        ':username' => $username
    ]);

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
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'role' => $user['role']
    ];

    // ==========================
    // Remember Me
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
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => true,
                'samesite' => 'Strict'
            ]
        );
    }

    echo json_encode([
        'success' => true,
        'user' => $_SESSION['user']
    ]);

    exit;

} catch (PDOException $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'error' => 'Server error'
    ]);

    exit;
}

