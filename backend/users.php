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
    $method = $_SERVER['REQUEST_METHOD'];

    // GET: List all users
    if ($method === 'GET') {
        $stmt = $pdo->query("
            SELECT id, username, created_at 
            FROM users 
            ORDER BY created_at DESC
        ");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'count' => count($users),
            'users' => $users
        ]);
        exit;
    }

    // DELETE individual user: DELETE /api/users.php?id=1
    if ($method === 'DELETE' && isset($_GET['id'])) {
        $userId = (int)$_GET['id'];

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);

        echo json_encode([
            'success' => true,
            'message' => "User $userId deleted"
        ]);
        exit;
    }

    // DELETE: Delete all users (for development)
    if ($method === 'DELETE') {
        $pdo->exec("DELETE FROM users");
        $pdo->exec("DELETE FROM remember_tokens");

        echo json_encode([
            'success' => true,
            'message' => 'All users deleted'
        ]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

}
catch (PDOException $e) {
    error_log('[users.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}