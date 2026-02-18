// ====================================================================================================================================
//  REGISTER MODAL MODULE
//
//  Security measures implemented in this file:
//    - CSRF token is fetched from /api/csrf-token.php and included in every submission
//    - navigator.userAgent is sent as "device" for server-side UA binding (session hijack detection)
//    - Username is HTML-escaped before being interpolated into the toast message (XSS prevention)
//    - Password validation mirrors server-side rules exactly (12 chars min + special character)
//    - CSRF token is stored only in memory (a local variable), never in localStorage/sessionStorage
// ====================================================================================================================================

let registerModal = null;

function createRegisterModal() {
  if (registerModal) return;

  registerModal = document.createElement("div");
  registerModal.className = "register-modal";
  registerModal.innerHTML = `
      <div class="register-modal-container">
        <button class="register-modal-close" aria-label="Close Register">×</button>
        <h2 class="register-modal-title">REGISTER</h2>
        
        <form class="register-form" id="registerForm" novalidate>
          <!-- Username Field -->
          <div class="register-form-group">
            <label for="register-username" class="register-form-label">Username</label>
            <div class="register-form-input-wrapper">
              <input 
                type="text" 
                id="register-username" 
                class="register-form-input" 
                placeholder="Choose username"
                autocomplete="username"
                required
              >
            </div>
            <div class="register-error-message" data-error="username"></div>
          </div>

          <!-- Password Field -->
          <div class="register-form-group">
            <label for="register-password" class="register-form-label">Password</label>
            <div class="register-form-input-wrapper">
              <input 
                type="password" 
                id="register-password" 
                class="register-form-input" 
                placeholder="Create password"
                autocomplete="new-password"
                required
              >
              <button type="button" class="register-password-toggle" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>
            <div class="register-password-strength">
              <div class="register-password-strength-bar"></div>
              <div class="register-password-strength-bar"></div>
              <div class="register-password-strength-bar"></div>
              <div class="register-password-strength-bar"></div>
            </div>
            <div class="register-error-message" data-error="password"></div>
          </div>

          <!-- Confirm Password Field -->
          <div class="register-form-group">
            <label for="register-password-confirm" class="register-form-label">Confirm Password</label>
            <div class="register-form-input-wrapper">
              <input 
                type="password" 
                id="register-password-confirm" 
                class="register-form-input" 
                placeholder="Confirm password"
                autocomplete="new-password"
                required
              >
              <button type="button" class="register-password-toggle-confirm" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>
            <div class="register-error-message" data-error="password-confirm"></div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="register-submit-btn">
            <span style="position: relative; z-index: 1;">Register</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="register-login-link">
          Already have an account?
          <button type="button" class="register-login-btn">
            👉 Login here 👈
          </button>
        </div>
      </div>
    `;

  document.body.appendChild(registerModal);

  // Get elements
  const closeBtn = registerModal.querySelector(".register-modal-close");
  const form = registerModal.querySelector("#registerForm");
  const usernameInput = registerModal.querySelector("#register-username");
  const passwordInput = registerModal.querySelector("#register-password");
  const passwordConfirmInput = registerModal.querySelector(
    "#register-password-confirm",
  );
  const passwordToggle = registerModal.querySelector(
    ".register-password-toggle",
  );
  const passwordToggleConfirm = registerModal.querySelector(
    ".register-password-toggle-confirm",
  );
  const loginBtn = registerModal.querySelector(".register-login-btn");

  // Close button
  closeBtn.addEventListener("click", closeRegisterModal);

  // Click outside the modal container to close
  registerModal.addEventListener("click", (e) => {
    if (e.target === registerModal) closeRegisterModal();
  });

  // ESC key closes the modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && registerModal.classList.contains("active")) {
      closeRegisterModal();
    }
  });

  // Password visibility toggles for both password fields
  passwordToggle.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    passwordToggle.textContent = type === "password" ? "👁️" : "🙈";
  });

  passwordToggleConfirm.addEventListener("click", () => {
    const type = passwordConfirmInput.type === "password" ? "text" : "password";
    passwordConfirmInput.type = type;
    passwordToggleConfirm.textContent = type === "password" ? "👁️" : "🙈";
  });

  // Real-time inline validation on input events
  usernameInput.addEventListener("input", () =>
    validateRegisterUsername(usernameInput),
  );

  passwordInput.addEventListener("input", () => {
    validateRegisterPassword(passwordInput);
    validatePasswordMatch(passwordInput, passwordConfirmInput);
  });

  passwordConfirmInput.addEventListener("input", () =>
    validatePasswordMatch(passwordInput, passwordConfirmInput),
  );

  // Form submission handler
  form.addEventListener("submit", handleRegisterSubmit);

  // Switch to login modal
  loginBtn.addEventListener("click", () => {
    closeRegisterModal();
    setTimeout(() => openLoginModal(), 400);
  });
}

function openRegisterModal() {
  createRegisterModal();
  setTimeout(() => registerModal.classList.add("active"), 10);
}

function closeRegisterModal() {
  if (!registerModal) return;
  registerModal.classList.remove("active");

  const form = registerModal.querySelector("#registerForm");
  if (form) {
    form.reset();
    clearRegisterValidationErrors();
  }
}

// ==========================
// XSS Prevention Utility
//
// Shared utility now loaded from security-utils.js
// ==========================

// ==========================
// Username Validation
// Uses shared SecurityUtils
// ==========================
function validateRegisterUsername(input) {
  const errorDiv = registerModal.querySelector('[data-error="username"]');
  return window.SecurityUtils.validateUsername(input, errorDiv);
}

// ==========================
// Password Validation
// Uses shared SecurityUtils
// ==========================
function validateRegisterPassword(input) {
  const errorDiv = registerModal.querySelector('[data-error="password"]');
  const strengthBars = registerModal.querySelectorAll(".register-password-strength-bar");
  return window.SecurityUtils.validatePassword(input, errorDiv, strengthBars);
}

// ==========================
// Password Confirmation Validation
// ==========================
function validatePasswordMatch(passwordInput, confirmInput) {
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  const errorDiv = registerModal.querySelector('[data-error="password-confirm"]');

  // Reset state
  confirmInput.classList.remove("error", "success");
  errorDiv.classList.remove("show");

  if (confirm === "") return false;

  if (password !== confirm) {
    showRegisterError(confirmInput, errorDiv, "Passwords do not match");
    return false;
  }

  confirmInput.classList.add("success");
  return true;
}

// Attaches error state styling and message to an input field
function showRegisterError(input, errorDiv, message) {
  window.SecurityUtils.showError(input, errorDiv, message);
}

// Clears all validation error states and strength indicator after modal close/reset
function clearRegisterValidationErrors() {
  const inputs = registerModal.querySelectorAll(".register-form-input");
  const errors = registerModal.querySelectorAll(".register-error-message");
  const strengthBars = registerModal.querySelectorAll(".register-password-strength-bar");

  inputs.forEach((input) => input.classList.remove("error", "success"));
  errors.forEach((error) => error.classList.remove("show"));
  strengthBars.forEach((bar) =>
    bar.classList.remove("active", "weak", "medium", "strong"),
  );
}

// ==========================
// Form Submission Handler
//
// Flow:
//   1. Run all client-side validations — abort early if any fail.
//   2. Fetch a fresh CSRF token from /api/csrf-token.php.
//      The token is stored in a local variable only — never in localStorage or
//      sessionStorage, which are accessible to any script on the same origin
//      and therefore vulnerable to XSS-based token theft.
//   3. POST the registration payload including the CSRF token and the client
//      User-Agent (navigator.userAgent) as "device".
//      The server uses "device" for UA-binding in the session and remember token,
//      which helps detect session hijacking if the UA changes mid-session.
//   4. Handle success/failure and update the UI accordingly.
// ==========================
async function handleRegisterSubmit(e) {
  e.preventDefault();

  const usernameInput = registerModal.querySelector("#register-username");
  const passwordInput = registerModal.querySelector("#register-password");
  const passwordConfirmInput = registerModal.querySelector(
    "#register-password-confirm",
  );

  // Run all validators — all must pass before we attempt a server request
  const isUsernameValid = validateRegisterUsername(usernameInput);
  const isPasswordValid = validateRegisterPassword(passwordInput);
  const isPasswordMatchValid = validatePasswordMatch(
    passwordInput,
    passwordConfirmInput,
  );

  if (!isUsernameValid || !isPasswordValid || !isPasswordMatchValid) return;

  const username = usernameInput.value.trim();

  try {
    // ==========================
    // Step 1: Fetch CSRF Token
    // Uses shared utility
    // ==========================
    const csrfToken = await window.SecurityUtils.fetchCsrfToken();

    // ==========================
    // Step 2: Submit Registration
    //
    // Included in the payload:
    //   - username: trimmed, validated
    //   - password: validated (not logged anywhere)
    //   - remember: hardcoded true (persistent session)
    //   - csrf_token: the single-use token fetched above
    //   - device: navigator.userAgent — the exact browser string as reported by JS.
    //     The server stores a hash of this for session hijacking detection.
    //     Using the JS-supplied value (rather than relying solely on the HTTP header)
    //     ensures consistency between what is stored in the remember_tokens table
    //     and what the session validation logic compares against.
    // ==========================
    const response = await fetch("/api/register.php", {
      method: "POST",
      credentials: "same-origin", // Required: sends the session cookie for CSRF validation
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password: passwordInput.value,
        remember: true,
        csrf_token: csrfToken, // Single-use CSRF token — rotated by server after use
        device: navigator.userAgent, // Client User-Agent for server-side UA binding
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Surface the first error from the server's error array, or fall back to a generic message
      const errorMessage = Array.isArray(data.error)
        ? data.error[0]
        : data.error || "Registration failed";

      showRegisterError(
        usernameInput,
        registerModal.querySelector('[data-error="username"]'),
        errorMessage,
      );
      return;
    }

    // Registration successful — close modal and update UI
    closeRegisterModal();

    // Update navbar auth button state (LOGIN → LOGOUT) if the function exists
    if (typeof updateAuthButton === "function") {
      updateAuthButton();
    }

    // ==========================
    // XSS-Safe Welcome Toast
    // Uses shared utility
    // ==========================
    showToast(
      `Registration successful. Welcome ${window.SecurityUtils.escapeHtml(username)}!`,
      "success",
    );
  } catch (err) {
    // Catch network errors, CSRF fetch failures, and unexpected exceptions
    console.error("Register error:", err);

    showRegisterError(
      usernameInput,
      registerModal.querySelector('[data-error="username"]'),
      "Server not reachable. Please try again.",
    );
  }
}
