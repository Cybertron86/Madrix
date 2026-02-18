<?php
declare(strict_types=1);

/**
 * csrf-token.php
 *
 * Issues a CSRF token bound to the current session.
 * The frontend calls GET /api/csrf-token.php before displaying any form,
 * stores the token in a local JS variable, and sends it as "csrf_token"
 * in the JSON body of the subsequent POST (e.g. register.php).
 *
 * Session is started and configured by bootstrap.php.
 */

require_once __DIR__ . '/config/bootstrap.php';

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Generate a fresh token if none exists in the session.
// bin2hex(random_bytes(32)) = 64-character hex string with 256-bit entropy.
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

echo json_encode(['csrf_token' => $_SESSION['csrf_token']]);