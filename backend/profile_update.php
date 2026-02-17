<?php
require __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/bootstrap.php';

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $_SESSION['user']['id'];

if (!empty($data['username'])) {
    $username = trim($data['username']);

    // Whitelist-Validierung (gleiche Regeln wie JS)
    if (!preg_match('/^[a-zA-Z0-9_-]{3,32}$/', $username)) {
        echo json_encode(['error' => 'invalid_username']);
        exit;
    }

    // Prüfen ob Username bereits von anderem User belegt
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $id]);

    if ($stmt->fetch()) {
        echo json_encode(['error' => 'username_taken']);
        exit;
    }

    $pdo->prepare("UPDATE users SET username=? WHERE id=?")
        ->execute([$username, $id]);
    $_SESSION['user']['username'] = $username;
}

if (!empty($data['password'])) {
    $hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password_hash=? WHERE id=?")
        ->execute([$hash, $id]);

    // Alle anderen Geräte ausloggen
    $pdo->prepare("DELETE FROM remember_tokens WHERE user_id=?")
        ->execute([$id]);
}

echo json_encode(['success' => true]);