<?php
/**
 * ==========================================================================
 * SHARED BACKEND UTILITIES
 * ==========================================================================
 * Consolidates common logic for:
 *  - JSON Responses
 *  - CSRF Validation
 *  - Rate Limiting (APCu with DB Fallback)
 *  - Input Validation
 */

require_once __DIR__ . '/config/bootstrap.php';

class Response
{
    /**
     * Sends a JSON response and exits.
     * @param mixed $data
     * @param int $status HTTP Status Code
     */
    public static function json($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }
}

class Security
{
    /**
     * Validates CSRF token from request data.
     * @param array $data
     */
    public static function validateCsrf($data)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $token = $data['csrf_token'] ?? '';
        if (empty($token) || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
            Response::json(['error' => 'Invalid or expired CSRF security token. Please reload.'], 403);
        }
    }

    /**
     * Checks rate limit for a given action.
     * Attempts APCu first, falls back to DB if provided.
     * @param string $action Action name (e.g. 'login', 'register')
     * @param int $limit Max requests
     * @param int $period Time in seconds
     * @param PDO|null $pdo Optional PDO instance for DB fallback
     */
    public static function checkRateLimit($action, $limit, $period, $pdo = null)
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ipHash = hash('sha256', $ip);
        $apcuKey = $action . '_rl_' . $ipHash;

        // 1. Try APCu
        if (function_exists('apcu_enabled') && apcu_enabled()) {
            $attempts = apcu_fetch($apcuKey, $exists);
            if ($exists && (int)$attempts >= $limit) {
                header('Retry-After: ' . $period);
                Response::json(['error' => "Too many attempts for $action. Please try again later."], 429);
            }
            if ($exists) {
                apcu_inc($apcuKey);
            }
            else {
                apcu_store($apcuKey, 1, $period);
            }
            return;
        }

        // 2. Fallback to Database
        if ($pdo) {
            try {
                // Cleanup expired entries
                $pdo->prepare("DELETE FROM rate_limits WHERE reset_at < NOW()")->execute();

                // Check current attempts
                $stmt = $pdo->prepare("SELECT attempts FROM rate_limits WHERE ip_hash = :ip_hash AND action = :action");
                $stmt->execute([':ip_hash' => $ipHash, ':action' => $action]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($row && (int)$row['attempts'] >= $limit) {
                    header('Retry-After: ' . $period);
                    Response::json(['error' => "Rate limit exceeded for $action. Please wait."], 429);
                }

                // Upsert
                $stmt = $pdo->prepare("
                    INSERT INTO rate_limits (ip_hash, action, attempts, reset_at)
                    VALUES (:ip_hash, :action, 1, DATE_ADD(NOW(), INTERVAL :period SECOND))
                    ON DUPLICATE KEY UPDATE attempts = attempts + 1
                ");
                $stmt->execute([
                    ':ip_hash' => $ipHash,
                    ':action' => $action,
                    ':period' => $period
                ]);
            }
            catch (PDOException $e) {
            // Fail open for UX, but log in production
            }
        }
    }
}

class Validator
{
    /**
     * Validates a username.
     * @param string $username
     * @return string|null Error message or null if valid
     */
    public static function validateUsername($username)
    {
        $username = trim((string)$username);
        if ($username === '')
            return 'Username is required';
        if (strlen($username) < 3 || strlen($username) > 30)
            return 'Username must be 3-30 characters';
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username))
            return 'Username contains invalid characters';
        return null;
    }

    /**
     * Validates a password against system requirements.
     * @param string $password
     * @return array Array of error messages
     */
    public static function validatePassword($password)
    {
        $errors = [];
        if (strlen($password) < 12)
            $errors[] = 'Password must be at least 12 characters long';
        if (!preg_match('/[A-Z]/', $password))
            $errors[] = 'Password must contain at least one uppercase letter';
        if (!preg_match('/[a-z]/', $password))
            $errors[] = 'Password must contain at least one lowercase letter';
        if (!preg_match('/[0-9]/', $password))
            $errors[] = 'Password must contain at least one number';
        if (!preg_match('/[!@#$%^&*()\-_=+\[\]{};:\'",.<>?\/\\|`~]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }
        return $errors;
    }
}
