<?php

/**
 * database.php
 *
 * Responsibilities:
 *   - Define application-wide constants (cookie name, lifetime)
 *   - Provide the Database class for PDO connection
 *
 * What was removed compared to the previous version:
 *   - session_set_cookie_params()  ← moved to bootstrap.php
 *   - session_start()              ← moved to bootstrap.php
 *
 * Why this separation matters:
 *   PHP session settings (ini_set, session_name, session_set_cookie_params)
 *   MUST be configured before session_start() is called — and they must be
 *   configured in ONE place. Having session_start() here meant that any
 *   script that needed to configure session settings before including
 *   bootstrap.php was silently overridden. Centralising session startup
 *   in bootstrap.php fixes this for every endpoint at once.
 */

// ==========================
// Application Constants
// ==========================

// Name of the "remember me" cookie stored in the browser.
define('REMEMBER_COOKIE', 'madrix_remember');

// Lifetime of the "remember me" cookie and token: 30 days in seconds.
define('REMEMBER_LIFETIME', 60 * 60 * 24 * 30);


// ==========================
// Database Class
// ==========================
class Database
{
    /**
     * Creates and returns a PDO connection using environment variables.
     *
     * Environment variables are set via the .env file and passed into
     * the PHP container via env_file in docker-compose.yml.
     *
     * PDO::ATTR_ERRMODE => ERRMODE_EXCEPTION:
     *   Throws PDOException on errors instead of silently returning false.
     *   This allows the calling code to catch exceptions and handle them
     *   properly (e.g. rollback transactions, log errors, return safe messages).
     *
     * Error handling:
     *   Connection failures return a generic JSON error to avoid leaking
     *   database host, name, or credentials in the response body.
     */
    public static function connect(): PDO
    {
        try {
            return new PDO(
                'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4',
                getenv('DB_USER'),
                getenv('DB_PASS'),
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_EMULATE_PREPARES => false, // Use real prepared statements
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            // Log the real error internally — never expose DB details to the client
            error_log('[database.php] Connection failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
}