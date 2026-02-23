<?php

require_once __DIR__ . '/utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::json(['error' => 'Method not allowed'], 405);
}

if (!isset($_SESSION['user_id'])) {
    Response::json(['error' => 'Unauthorized'], 401);
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    Response::json(['error' => 'Invalid input'], 400);
}

Security::validateCsrf($data);
$id = (int)$_SESSION['user_id'];

// 1. Update Username
if (!empty($data['username'])) {
    $username = trim((string)$data['username']);

    $err = Validator::validateUsername($username);
    if ($err)
        Response::json(['error' => $err], 400);

    // Check availability
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $id]);

    if ($stmt->fetch()) {
        Response::json(['error' => 'username_taken'], 409);
    }

    $pdo->prepare("UPDATE users SET username=? WHERE id=?")->execute([$username, $id]);
    $_SESSION['username'] = $username;
}

// 2. Update Password
if (!empty($data['password'])) {
    $password = (string)$data['password'];

    $errors = Validator::validatePassword($password);
    if (!empty($errors)) {
        Response::json(['error' => $errors], 400);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password_hash=? WHERE id=?")->execute([$hash, $id]);

    // Terminate other sessions
    $pdo->prepare("DELETE FROM remember_tokens WHERE user_id=?")->execute([$id]);
}

Response::json(['success' => true]);