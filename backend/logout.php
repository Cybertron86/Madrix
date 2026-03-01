<?php
declare(strict_types = 1)
;

require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Delete Remember Token
if (!empty($_COOKIE[REMEMBER_COOKIE])) {

    $tokenHash = hash('sha256', $_COOKIE[REMEMBER_COOKIE]);

    $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE token_hash = ?");
    $stmt->execute([$tokenHash]);

    setcookie(REMEMBER_COOKIE, '', time() - 3600, '/');
}

// Destroy session
session_unset();
session_destroy();

echo json_encode(['success' => true]);
