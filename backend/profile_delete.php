<?php
require __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/bootstrap.php';

if (!isset($_SESSION['user']))
    exit;

$id = $_SESSION['user']['id'];
$pdo->prepare("DELETE FROM users WHERE id=?")->execute([$id]);

session_destroy();
echo json_encode(['deleted' => true]);
