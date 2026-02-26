<?php
require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');

// ==========================
// Admin Auth Check - Must be implemented for production
// ==========================
/*
if (empty($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}
*/

if (!isset($_SESSION['user'])) {
    echo json_encode(['role' => 'guest']);
    exit;
}

echo json_encode($_SESSION['user']);
