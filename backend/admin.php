<?php
declare(strict_types = 1)
;

/**
 * admin.php
 *
 * Admin-only endpoint for user and session management.
 *
 * GET  — Returns all users and remember tokens
 * DELETE ?action=user&id=X   — Delete a user by ID
 * DELETE ?action=token&id=X  — Revoke a remember token by ID
 */

require_once __DIR__ . '/config/bootstrap.php';

header('Content-Type: application/json');

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

$method = $_SERVER['REQUEST_METHOD'];

try {

    // ==========================
    // GET — List all users and tokens
    // ==========================
    if ($method === 'GET') {
        $usersStmt = $pdo->query("
            SELECT id, username, role, created_at
            FROM users
            ORDER BY created_at DESC
        ");

        $tokensStmt = $pdo->query("
            SELECT r.id, u.username, r.user_agent, r.expires_at, r.created_at
            FROM remember_tokens r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        ");

        echo json_encode([
            'success' => true,
            'users' => $usersStmt->fetchAll(PDO::FETCH_ASSOC),
            'tokens' => $tokensStmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
        exit;
    }

    // ==========================
    // DELETE — Remove a user or revoke a token
    // ==========================
    if ($method === 'DELETE') {
        $action = $_GET['action'] ?? '';
        $id = (int)($_GET['id'] ?? 0);

        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing or invalid id']);
            exit;
        }

        if ($action === 'user') {
            // Prevent admin from deleting themselves
            if ($id === (int)$_SESSION['user']['id']) {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot delete your own account']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => "User $id deleted"
            ]);
            exit;
        }

        if ($action === 'token') {
            $stmt = $pdo->prepare("DELETE FROM remember_tokens WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => "Token $id revoked"
            ]);
            exit;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Invalid action. Use action=user or action=token']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

}
catch (PDOException $e) {
    error_log('[admin.php] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
