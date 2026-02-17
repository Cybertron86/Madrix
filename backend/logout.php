<?php
session_start();
require __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/bootstrap.php';

// Remember Token löschen
if (!empty($_COOKIE[REMEMBER_COOKIE])) {

    $tokenHash = hash('sha256', $_COOKIE[REMEMBER_COOKIE]);

    $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE token_hash = ?");
    $stmt->execute([$tokenHash]);

    setcookie(REMEMBER_COOKIE, '', time() - 3600, '/');
}

// Session zerstören
session_destroy();

echo json_encode(['success' => true]);
