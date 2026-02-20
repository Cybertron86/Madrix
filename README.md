# MADRIX - The Ultimate Cyber Portfolio

Welcome to the **Madrix Portal**, a high-performance web experience inspired by the Matrix/Tron aesthetic. This project combines modern frontend visuals with a robust, secure PHP backend, all orchestrated via Docker.

---

## Key Features

*   **Matrix Eye Ultimate**: A sophisticated, multi-layered visual center with 3D perspective, matrix rain, and glow effects.
*   **Hologram Carousel**: An immersive 3D carousel for showcasing content with a futuristic glassmorphic UI.
*   **Secure Authentication**: Comprehensive security measures including CSRF protection, rate limiting, and encrypted sessions.
*   **Admin Dashboard**: Real-time management of users and application state.
*   **Responsive Excellence**: Perfectly optimized for all devices, from ultra-wide monitors to mobile screens.

---

## Tech Stack

*   **Backend**: PHP 8.2 (FPM)
*   **Database**: MariaDB 11.x
*   **Frontend**: Vanilla JavaScript (ES6+), Modern CSS3 (Grid, Flexbox, Variables)
*   **Infrastructure**: Docker, Nginx
*   **Security**: CSRF protection, APCu-backed Rate Limiting, PDO prepared statements.

---

## Getting Started

### Prerequisites
*   Docker & Docker Compose installed on your system.

### Build and Launch
1.  Clone the repository and navigate to the root directory.
2.  Launch the containers:
    ```bash
    docker compose up --build -d
    ```
3.  **Access the Application**:
    *   **Frontend**: [http://localhost](http://localhost)
    *   **Admin API**: [http://localhost/api/health](http://localhost/api/health)

---

## Database Management

You can interact with the database directly through the MariaDB container.

### Access SQL Shell
```bash
docker exec -it mariadb mariadb -u appuser -paddpassword appdb
```

### Useful SQL Commands
```sql
-- Check existing users
SELECT id, username, role, created_at FROM users;

-- View active remember-me tokens
SELECT * FROM remember_tokens;

-- View rate limit logs
SELECT * FROM rate_limits;
```

---

## API Interaction (Curl Cheat Sheet)

The backend uses JSON for communication and requires a valid CSRF token for state-changing operations (POST, DELETE).

### 1. Initialize Session & Get CSRF Token
```bash
curl -c cookies.txt http://localhost/api/csrf-token.php
```
*Stores the session cookie in `cookies.txt` and returns the `csrf_token`.*

### 2. Register a New Account
```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost/api/register.php \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Neo",
    "password": "Trinity123!Safe",
    "csrf_token": "YOUR_TOKEN_HERE"
  }'
```

### 3. Log In
```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost/api/login.php \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Neo",
    "password": "Trinity123!Safe",
    "csrf_token": "YOUR_TOKEN_HERE"
  }'
```

### 4. Admin Actions (Requires Admin Role)
```bash
-- List all users
curl -b cookies.txt http://localhost/api/users.php

-- Delete a user by ID
curl -b cookies.txt -X DELETE "http://localhost/api/users.php?id=123"
```

---

## Project Structure

*   **/backend**: Core PHP logic, API endpoints, and configuration.
*   **/frontend-portal**: HTML, CSS, JavaScript, and static resources.
*   **/database**: Initialization scripts (`init.sql`).
*   **/docker**: PHP container definitions.
*   **/nginx**: Router configuration.

---

## Security & Best Practices

This project strictly follows modern security standards:
- **No In-line Scripts**: All logic is served from modular JS files.
- **CSRF Protection**: Every state-changing request is validated against a session-bound token.
- **Rate Limiting**: Protection against brute-force attacks via APCu and DB fallbacks.
- **Strict Typing**: PHP backend uses `declare(strict_types=1)` for reliable execution.
- **CSS Variable Design**: Global theme colors are managed centrally in `variables.css`.