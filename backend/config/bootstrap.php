<?php

/**
 * bootstrap.php
 *
 * Central entry point included by every API endpoint.
 *
 * Responsibilities (in order):
 *   1. Include database.php (constants + Database class)
 *   2. Detect HTTPS
 *   3. Configure all session settings via ini_set()
 *   4. Set the session name
 *   5. Start the session (exactly once)
 *   6. Create the PDO connection
 *
 * Why bootstrap.php owns session startup:
 *   Session settings configured via ini_set() and session_name() are only
 *   effective if called BEFORE session_start(). Every endpoint includes
 *   this file first, centralising session startup here guarantees the correct
 *   order regardless of which endpoint is called.
 */

require_once __DIR__ . '/database.php';


// ==========================
// HTTPS Detection
//
// $_SERVER['HTTPS'] is set by PHP-FPM when the upstream connection was TLS.
// When nginx terminates SSL and proxies to PHP-FPM via FastCGI, nginx must
// forward this signal. Add to the fastcgi_params file or the location block:
//
//   fastcgi_param HTTPS on;
//
// Without this, $_SERVER['HTTPS'] will be empty even on production HTTPS,
// and the HTTP-safe (less strict) session settings will be used — still
// functional but not maximally hardened.
// ==========================
$isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';


// ==========================
// Session Configuration
//
// All ini_set() calls and session_name() MUST come before session_start().
//
// session.cookie_httponly:
//   Adds HttpOnly flag to the session cookie. Prevents JavaScript from
//   reading it via document.cookie — mitigates XSS-based session theft.
//
// session.cookie_samesite Strict:
//   Session cookie is not sent with any cross-site request.
//   Provides CSRF protection at the cookie layer, complementing the token.
//
// session.use_strict_mode:
//   Server rejects session IDs it did not issue. Prevents session fixation
//   where an attacker plants a known session ID for the victim to adopt.
//
// session.sid_length / sid_bits_per_character:
//   Increases session ID entropy above PHP defaults (26 chars → 48 chars,
//   using a 64-character alphabet for maximum bits per character).
//
// session.gc_maxlifetime:
//   Hint to PHP's garbage collector to purge sessions idle > 30 minutes.
//   Note: this alone does not guarantee timeout — the explicit check in
//   each endpoint provides the reliable enforcement.
//
// session.use_only_cookies:
//   Disallows session IDs in the URL (?PHPSESSID=...).
//   Prevents IDs from appearing in server logs, Referer headers, or history.
//
// HTTPS-only settings:
//
//   session.cookie_secure:
//     Adds the Secure flag — cookie is only sent over HTTPS.
//     Must be 0 on HTTP (local dev): browsers silently discard Secure cookies
//     on HTTP, destroying the session between requests and breaking CSRF.
//
//   session_name() with __Host- prefix:
//     __Host- enforces: Secure flag required + no Domain attribute + Path=/.
//     Prevents subdomain-based session fixation / cookie injection.
//     __Host- cookies are rejected by browsers over HTTP — use plain 'SESSID'
//     on HTTP to allow the cookie to be stored at all.
// ==========================
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', '1');
ini_set('session.sid_length', '48');
ini_set('session.sid_bits_per_character', '6');
ini_set('session.gc_maxlifetime', '1800');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_secure', $isHttps ? '1' : '0');

session_name($isHttps ? '__Host-SESSID' : 'SESSID');


// ==========================
// Session Start (exactly once)
//
// session_status() check prevents "session already started" warnings if
// bootstrap.php is accidentally included more than once in the same request.
// ==========================
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


// ==========================
// Database Connection
// ==========================
$pdo = Database::connect();

// ==========================
// Session Inactivity Timeout
// ==========================
$sessionTimeout = 1800; // 30 minutes

if (isset($_SESSION['last_activity'])) {
    if ((time() - (int)$_SESSION['last_activity']) > $sessionTimeout) {
        $remember = $_COOKIE[REMEMBER_COOKIE] ?? null;
        session_unset();
        session_destroy();
        session_start();
        session_regenerate_id(true);
        if ($remember)
            $_COOKIE[REMEMBER_COOKIE] = $remember;
    }
}
$_SESSION['last_activity'] = time();

// ==========================
// Session Restoration (Remember Me)
// ==========================
if (empty($_SESSION['user']) && !empty($_COOKIE[REMEMBER_COOKIE])) {
    try {
        $tokenHash = hash('sha256', $_COOKIE[REMEMBER_COOKIE]);
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.role
            FROM remember_tokens rt
            JOIN users u ON u.id = rt.user_id
            WHERE rt.token_hash = ?
              AND rt.expires_at > NOW()
            LIMIT 1
        ");
        $stmt->execute([$tokenHash]);

        if ($user = $stmt->fetch()) {
            $_SESSION['user'] = [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'ua_hash' => hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? ''),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ];
        }
        else {
            setcookie(REMEMBER_COOKIE, '', time() - 3600, '/');
        }
    }
    catch (PDOException $e) {
        error_log('[bootstrap.php] Restoration error: ' . $e->getMessage());
    }
}


// ==========================
// Global Security Headers
// ==========================
// Prevent MIME-type sniffing
header('X-Content-Type-Options: nosniff');

// Prevent clickjacking (deny rendering in iframes)
header('X-Frame-Options: DENY');

// Strict Transport Security (HSTS) - enforce HTTPS for 1 year
if ($isHttps) {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// Content Security Policy (CSP)
// Aligned with Nginx config to allow:
// - Google Fonts (style-src, font-src)
// - HTTPS images (img-src https:)
// - Inline styles for JS modals (style-src 'unsafe-inline')
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://picsum.photos https:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");