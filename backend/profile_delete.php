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

$id = $_SESSION['user']['id'];

// Remember Token löschen
if (!empty($_COOKIE[REMEMBER_COOKIE])) {
    $tokenHash = hash('sha256', $_COOKIE[REMEMBER_COOKIE]);
    $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE token_hash = ?");
    $stmt->execute([$tokenHash]);
    setcookie(REMEMBER_COOKIE, '', time() - 3600, '/');
}

// User löschen
$pdo->prepare("DELETE FROM users WHERE id=?")->execute([$id]);

// Session zerstören
session_unset();
session_destroy();

echo json_encode(['deleted' => true]);
