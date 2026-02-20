<?php

require_once __DIR__ . '/../config/bootstrap.php';


if (empty($_SESSION['user']) && !empty($_COOKIE[REMEMBER_COOKIE])) {

    $tokenHash = hash('sha256', $_COOKIE[REMEMBER_COOKIE]);

    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.role
        FROM remember_tokens rt
        JOIN users u ON u.id = rt.user_id
        WHERE rt.token_hash = ?
          AND rt.expires_at > NOW()
        LIMIT 1
    ");
    $stmt->execute([$tokenHash]);

    if ($user = $stmt->fetch()) {

        // 🔐 Restore session
        $_SESSION['user'] = [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ];

    }
    else {
        // invalid cookie → delete
        setcookie(REMEMBER_COOKIE, '', time() - 3600, '/');
    }
}
