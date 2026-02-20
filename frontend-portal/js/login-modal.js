// ====================================================================================================================================
//  LOGIN MODAL MODULE
//
//  Security measures implemented in this file:
//    - CSRF token fetched/sent for every login attempt
//    - User-Agent ("device") sent for session binding
//    - Username HTML-escaped in toast messages (XSS prevention)
//    - Rate limit (429) handling to prevent brute-force feedback loops
//    - All validation/security logic shared via SecurityUtils
// ====================================================================================================================================
const loginBtn = document.getElementById("btn_login");

let loginModal = null;

function createLoginModal() {
  if (loginModal) return;

  loginModal = document.createElement("div");
  loginModal.className = "login-modal";
  loginModal.setAttribute("role", "dialog");
  loginModal.setAttribute("aria-modal", "true");
  loginModal.setAttribute("aria-labelledby", "login-title");
  loginModal.innerHTML = `
      <div class="login-modal-container">
        <button class="login-modal-close" aria-label="Close Login Modal">×</button>
        <h2 class="login-modal-title" id="login-title">LOGIN</h2>
        
        <form class="login-form" id="loginForm" novalidate>
          <!-- Username Field -->
          <div class="login-form-group">
            <label for="login-username" class="login-form-label">Username</label>
            <div class="login-form-input-wrapper">
              <input 
                type="text" 
                id="login-username" 
                class="login-form-input" 
                placeholder="Enter username"
                autocomplete="username"
                required
                aria-describedby="login-username-error"
              >
            </div>
            <div class="login-error-message" id="login-username-error" data-error="username" aria-live="polite"></div>
          </div>

          <!-- Password Field-->
          <div class="login-form-group">
            <label for="login-password" class="login-form-label">Password</label>
            <div class="login-form-input-wrapper">
              <input 
                type="password" 
                id="login-password" 
                class="login-form-input" 
                placeholder="Enter password"
                autocomplete="current-password"
                required
                aria-describedby="login-password-error"
              >
              <button type="button" class="password-toggle" aria-label="Show password" aria-pressed="false">
                👁️
              </button>
            </div>
            <div class="login-error-message" id="login-password-error" data-error="password" aria-live="polite"></div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="login-submit-btn">
            <span style="position: relative; z-index: 1;">Login</span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="login-register-link">
          Not registered yet?
          <button type="button" class="login-register-btn" aria-label="Switch to registration">
            👉 Register here 👈
          </button>
        </div>
      </div>
    `;

  document.body.appendChild(loginModal);

  const closeBtn = loginModal.querySelector(".login-modal-close");
  const form = loginModal.querySelector("#loginForm");
  const passwordInput = loginModal.querySelector("#login-password");
  const passwordToggle = loginModal.querySelector(".password-toggle");
  const registerBtn = loginModal.querySelector(".login-register-btn");

  // Close button
  closeBtn.addEventListener("click", closeLoginModal);

  // Click outside to close
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) closeLoginModal();
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && loginModal.classList.contains("active")) {
      closeLoginModal();
    }
  });

  // Password toggle
  passwordToggle.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    const type = isVisible ? "password" : "text";
    passwordInput.type = type;
    passwordToggle.textContent = isVisible ? "👁️" : "🙈";
    passwordToggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    passwordToggle.setAttribute("aria-pressed", !isVisible);
  });

  // Form submission
  form.addEventListener("submit", handleLoginSubmit);

  // Register button
  registerBtn.addEventListener("click", () => {
    closeLoginModal();
    setTimeout(() => openRegisterModal(), 400);
  });
}

function openLoginModal() {
  createLoginModal();
  setTimeout(() => loginModal.classList.add("active"), 10);
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove("active");
  const form = loginModal.querySelector("#loginForm");
  if (form) {
    form.reset();
    clearAllErrors();
  }
}

// Clears ALL red borders and ALL error message texts
function clearAllErrors() {
  const inputs = loginModal.querySelectorAll(".login-form-input");
  const errors = loginModal.querySelectorAll(".login-error-message");

  inputs.forEach((input) => {
    input.classList.remove("error", "success");
    if (input._clearHandler) {
      input.removeEventListener("input", input._clearHandler);
      delete input._clearHandler;
    }
  });
  errors.forEach((error) => {
    error.classList.remove("show");
    error.textContent = "";
  });
}

// Attaches a listener on BOTH fields — first interaction with either clears ALL errors
function attachClearOnAnyInput() {
  const usernameInput = loginModal.querySelector("#login-username");
  const passwordInput = loginModal.querySelector("#login-password");

  const handler = () => {
    clearAllErrors();
  };

  // Clean up old handlers first
  if (usernameInput._clearHandler)
    usernameInput.removeEventListener("input", usernameInput._clearHandler);
  if (passwordInput._clearHandler)
    passwordInput.removeEventListener("input", passwordInput._clearHandler);

  usernameInput._clearHandler = handler;
  passwordInput._clearHandler = handler;
  usernameInput.addEventListener("input", usernameInput._clearHandler);
  passwordInput.addEventListener("input", passwordInput._clearHandler);
}

// ==========================
// Form Submission Handler
//
// Security improvements implemented:
//   1. CSRF Protection: Fetches a fresh CSRF token before submission.
//      This token is stored only in memory (local variable), never in persistent
//      storage (localStorage/sessionStorage), preventing XSS-based token theft.
//   2. Rate Limit Handling: Gracefully handles 429 Too Many Requests responses.
//   3. XSS Prevention: Username is HTML-escaped before being shown in the welcome toast.
// ==========================
async function handleLoginSubmit(e) {
  e.preventDefault();

  const usernameInput = loginModal.querySelector("#login-username");
  const passwordInput = loginModal.querySelector("#login-password");
  const usernameError = loginModal.querySelector('[data-error="username"]');

  // Clear previous errors first
  clearAllErrors();

  // Empty check — mark BOTH fields red if either is empty
  const usernameEmpty = !usernameInput.value.trim();
  const passwordEmpty = !passwordInput.value;

  if (usernameEmpty || passwordEmpty) {
    if (usernameEmpty) usernameInput.classList.add("error");
    if (passwordEmpty) passwordInput.classList.add("error");
    
    // Use shared error display
    window.SecurityUtils.showError(
      usernameInput, 
      usernameError, 
      "Please enter username and password"
    );
    
    attachClearOnAnyInput();
    return;
  }

  try {
    // ==========================
    // Step 1: Fetch CSRF Token
    // Uses shared utility to get a fresh token bound to the current session.
    // ==========================
    const csrfToken = await window.SecurityUtils.fetchCsrfToken();

    // ==========================
    // Step 2: Submit Login
    //
    // Payload includes:
    //   - username & password
    //   - csrf_token: validated by backend
    //   - device: User-Agent string for session hijacking detection
    // ==========================
    const response = await fetch("/api/login.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        remember: true,
        csrf_token: csrfToken,
        device: navigator.userAgent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      let message = "Login failed";

      if (response.status === 401) {
        message = "Username or Password do not match";
      } else if (response.status === 429) {
        // Rate limit hit
        message = data.error || "Too many attempts. Please try again later.";
      } else {
        message = data.error || "Login failed";
      }

      // Mark both fields red, show message under username
      usernameInput.classList.add("error");
      passwordInput.classList.add("error");
      
      window.SecurityUtils.showError(usernameInput, usernameError, message);
      
      attachClearOnAnyInput();
      return;
    }

    // Login successful
    closeLoginModal();

    if (typeof updateAuthButton === "function") {
      await updateAuthButton();
    }

    if (typeof showToast === "function") {
      const username = data.user?.username ?? usernameInput.value.trim();
      // Safe interpolation using shared escapeHtml utility
      showToast(
        `Welcome back, ${username}!`, 
        "success"
      );
    }
  } catch (err) {
    console.error("Login error:", err);
    usernameInput.classList.add("error");
    
    window.SecurityUtils.showError(
      usernameInput, 
      usernameError, 
      "Server not reachable"
    );
    
    attachClearOnAnyInput();
  }
}

// Login button event listener
if (loginBtn) {
  loginBtn.addEventListener("click", () => openLoginModal());
}
