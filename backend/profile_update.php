<?php
require __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/bootstrap.php';

if (!isset($_SESSION['user']))
    exit;

$data = json_decode(file_get_contents("php://input"), true);
$id = $_SESSION['user']['id'];

if (!empty($data['username'])) {
    $pdo->prepare("
        UPDATE users SET username=? WHERE id=?
    ")->execute([$data['username'], $id]);
    $_SESSION['user']['username'] = $data['username'];
}

if (!empty($data['password'])) {
    $hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $pdo->prepare("
        UPDATE users SET password_hash=? WHERE id=?
    ")->execute([$hash, $id]);

    // alle Geräte ausloggen
    $pdo->prepare("
        DELETE FROM remember_tokens WHERE user_id=?
    ")->execute([$id]);
}

echo json_encode(['success' => true]);
