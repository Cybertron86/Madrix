<?php
declare(strict_types = 1)
;

require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');

// Remember Token löschen
if (!empty($_COOKIE[REMEMBER_COOKIE])) {

    $tokenHash = hash('sha256', $_COOKIE[REMEMBER_COOKIE]);

    $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE token_hash = ?");
    $stmt->execute([$tokenHash]);

    setcookie(REMEMBER_COOKIE, '', time() - 3600, '/');
}

// Session zerstören
session_unset();
session_destroy();

echo json_encode(['success' => true]);
