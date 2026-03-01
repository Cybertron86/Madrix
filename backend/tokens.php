<?php
require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================
// Admin Auth Check
// ==========================
if (empty($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

try {
    $stmt = $pdo->query("
        SELECT r.id, u.username, r.token_hash, r.user_agent, r.expires_at, r.created_at
        FROM remember_tokens r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    ");

    echo json_encode([
        'success' => true,
        'tokens' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);
}
catch (PDOException $e) {
    error_log('[tokens.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}