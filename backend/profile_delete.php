<?php

require_once __DIR__ . '/utils.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::json(['error' => 'Method not allowed'], 405);
}

if (!isset($_SESSION['user_id'])) {
    Response::json(['error' => 'Unauthorized'], 401);
}

$data = json_decode(file_get_contents("php://input"), true);
Security::validateCsrf($data);

$id = (int)$_SESSION['user_id'];

// 1. Delete Remember Tokens
if (!empty($_COOKIE[REMEMBER_COOKIE])) {
    $tokenHash = hash('sha256', (string)$_COOKIE[REMEMBER_COOKIE]);
    $pdo->prepare("DELETE FROM remember_tokens WHERE token = ?")->execute([$tokenHash]);
    setcookie(REMEMBER_COOKIE, '', time() - 3600, '/');
}

// 2. Delete User Account
$pdo->prepare("DELETE FROM users WHERE id=?")->execute([$id]);

// 3. Cleanup Session
session_unset();
session_destroy();

Response::json(['deleted' => true]);
