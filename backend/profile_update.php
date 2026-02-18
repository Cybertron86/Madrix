<?php
require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $_SESSION['user']['id'];

if (!empty($data['username'])) {
    $username = trim($data['username']);

    // Whitelist-Validierung (gleiche Regeln wie JS)
    if (!preg_match('/^[a-zA-Z0-9_-]{3,32}$/', $username)) {
        http_response_code(400);
        echo json_encode(['error' => 'invalid_username']);
        exit;
    }

    // Prüfen ob Username bereits von anderem User belegt
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $id]);

    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'username_taken']);
        exit;
    }

    $pdo->prepare("UPDATE users SET username=? WHERE id=?")
        ->execute([$username, $id]);
    $_SESSION['user']['username'] = $username;
}

if (!empty($data['password'])) {
    $password = $data['password'];

    // Server-side password validation (same rules as register.php)
    $errors = [];
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

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password_hash=? WHERE id=?")
        ->execute([$hash, $id]);

    // Alle anderen Geräte ausloggen
    $pdo->prepare("DELETE FROM remember_tokens WHERE user_id=?")
        ->execute([$id]);
}

echo json_encode(['success' => true]);