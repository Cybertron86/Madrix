<?php
require __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/bootstrap.php';

if (!isset($_SESSION['user'])) {
    echo json_encode(['role' => 'guest']);
    exit;
}

echo json_encode($_SESSION['user']);
