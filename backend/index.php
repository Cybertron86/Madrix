<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "config/database.php";

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::connect();

    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);

    if ($path === '/api/health' || $path === '/api/health/') {
        echo json_encode(["status" => "healthy", "database" => "connected"]);
        exit;
    }

    if ($path == '/api/structured_output' || $path == '/api/structured_output/') {
        $stmt = $db->query("SELECT * FROM messages");
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            echo "Message ID: " . $row['id'] . "\n";
            echo "Content: " . $row['content'] . "\n";
            echo "-----------------------\n";
        }
    }

    if ($method === "GET") {
        $stmt = $db->query("SELECT * FROM messages");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    if ($method === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['content']) || empty($data['content'])) {
            throw new Exception("Invalid input");
        }

        $stmt = $db->prepare("INSERT INTO messages (content) VALUES (?)");
        $stmt->execute([$data['content']]);

        echo json_encode(["success" => true]);
        exit;
    }

    throw new Exception("Method not allowed");

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
