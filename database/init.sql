
-- =========================================
-- DATABASE INITIALIZATION SCRIPT
-- =========================================

-- Optional: Datenbank neu erstellen
-- CREATE DATABASE IF NOT EXISTS your_database
-- CHARACTER SET utf8mb4
-- COLLATE utf8mb4_unicode_ci;
--
-- USE your_database;

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- =========================================
-- DROP EXISTING TABLES (SAFE RESET)
-- =========================================

DROP TABLE IF EXISTS remember_tokens;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS rate_limits;

SET foreign_key_checks = 1;

-- =========================================
-- USERS TABLE
-- =========================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_username (username)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================
-- REMEMBER TOKENS TABLE
-- =========================================

CREATE TABLE remember_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    user_agent VARCHAR(255),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires (expires_at),

    CONSTRAINT fk_remember_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =========================================
-- MESSAGES TABLE (TEST / CHAT)
-- =========================================

CREATE TABLE messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_created (created_at)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



-- ==============================================================================
-- Add this table to database/init.sql
--
-- Used as fallback rate limiter when APCu is not available in PHP-FPM.
-- When APCu works correctly this table is never written to.
-- ==============================================================================

CREATE TABLE rate_limits (
    ip_hash    CHAR(64)     NOT NULL,          -- SHA-256 hex of the client IP
    action     VARCHAR(32)  NOT NULL,          -- e.g. 'register', 'login'
    attempts   INT UNSIGNED NOT NULL DEFAULT 1,
    reset_at   DATETIME     NOT NULL,          -- when the counter expires
    PRIMARY KEY (ip_hash, action),
    INDEX idx_reset_at (reset_at)              -- for fast cleanup of expired rows
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================
-- OPTIONAL ADMIN USER (REMOVE IF NOT NEEDED)
-- Password: Admin123
-- =========================================

-- INSERT INTO users (username, password_hash, role)
-- VALUES (
--     'admin',
--     '$2y$10$wH0Z8xYp4nQKz8rW4y6zUOeV9lY9S1xk1x1x1x1x1x1x1x1x1x1x1',
--     'admin'
-- );

-- =========================================
-- DONE
-- =========================================

