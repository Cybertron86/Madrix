/**
 * login-modal.js
 *
 * Lazy-initialised on first open; exposes openLoginModal and closeLoginModal
 * globally so other modules (e.g. register modal) can trigger them directly.
 */
import {
  ModalManager,
  showError,
  fetchCsrfToken,
  showToast,
} from "./security-utils.js";
import { openRegisterModal } from "./register-modal.js";
import { updateAuthButton } from "./auth-state.js";

("use strict");

const loginBtn = document.getElementById("btn_login");
let loginModal = null;

// Inject HTML, wire up all inputs and events — runs only once
function createLoginModal() {
  if (loginModal) return;

  loginModal = document.createElement("div");
  loginModal.className = "login-modal mx-modal-overlay";
  loginModal.setAttribute("role", "dialog");
  loginModal.setAttribute("aria-modal", "true");
  loginModal.setAttribute("aria-labelledby", "login-title");
  loginModal.innerHTML = `
        <div class="mx-modal-container">
          <button class="mx-modal-close" aria-label="Close Login Modal">×</button>
          <h2 class="mx-modal-title" id="login-title">LOGIN</h2>
          
          <div class="mx-modal-content">
            <form class="mx-form" id="loginForm" novalidate>
              <!-- Username Field -->
              <div class="mx-form-group">
                <label for="login-username" class="mx-label">Username</label>
                <div class="mx-input-wrapper">
                  <input 
                    type="text" 
                    id="login-username" 
                    class="mx-input" 
                    placeholder="Enter username"
                    autocomplete="username"
                    required
                    aria-describedby="login-username-error"
                  >
                </div>
                <div class="mx-error-message" id="login-username-error" data-error="username" aria-live="polite"></div>
              </div>

              <!-- Password Field-->
              <div class="mx-form-group">
                <label for="login-password" class="mx-label">Password</label>
                <div class="mx-input-wrapper">
                  <input 
                    type="password" 
                    id="login-password" 
                    class="mx-input" 
                    placeholder="Enter password"
                    autocomplete="current-password"
                    required
                    aria-describedby="login-password-error"
                  >
                  <button type="button" class="mx-pw-toggle" aria-label="Show password" aria-pressed="false">
                    👁️
                  </button>
                </div>
                <div class="mx-error-message" id="login-password-error" data-error="password" aria-live="polite"></div>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="mx-btn">
                Login
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
        </div>
      `;

  document.body.appendChild(loginModal);

  const closeBtn = loginModal.querySelector(".mx-modal-close");
  const form = loginModal.querySelector("#loginForm");
  const passwordInput = loginModal.querySelector("#login-password");
  const passwordToggle = loginModal.querySelector(".mx-pw-toggle");
  const registerBtn = loginModal.querySelector(".login-register-btn");

  // Wire up close/keyboard/overlay-click via ModalManager
  ModalManager.setup(loginModal, closeLoginModal);
  closeBtn.addEventListener("click", closeLoginModal);

  // Toggle between password/text and swap the eye icon accordingly
  passwordToggle.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    passwordToggle.textContent = isVisible ? "👁️" : "🙈";
    passwordToggle.setAttribute(
      "aria-label",
      isVisible ? "Show password" : "Hide password",
    );
    passwordToggle.setAttribute("aria-pressed", !isVisible);
  });

  form.addEventListener("submit", handleLoginSubmit);

  // Delay opening register so the close animation can finish first
  registerBtn.addEventListener("click", () => {
    closeLoginModal();
    setTimeout(() => {
      if (typeof openRegisterModal === "function") openRegisterModal();
    }, 400);
  });
}

export function openLoginModal() {
  createLoginModal();
  ModalManager.open(loginModal, "active", "#login-username");
}

export function closeLoginModal() {
  if (!loginModal) return;
  ModalManager.close(loginModal, "active");
  // Reset form and clear visual validation state on every close
  const form = loginModal.querySelector("#loginForm");
  if (form) {
    form.reset();
    clearAllErrors();
  }
}

// Removes all red/green borders, error texts, and any lingering clear handlers
function clearAllErrors() {
  const inputs = loginModal.querySelectorAll(".mx-input");
  const errors = loginModal.querySelectorAll(".mx-error-message");

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

// First keystroke in either field after a failed attempt wipes all errors at once
function attachClearOnAnyInput() {
  const usernameInput = loginModal.querySelector("#login-username");
  const passwordInput = loginModal.querySelector("#login-password");

  const handler = () => clearAllErrors();

  // Remove stale handlers before attaching fresh ones to avoid duplicates
  if (usernameInput._clearHandler)
    usernameInput.removeEventListener("input", usernameInput._clearHandler);
  if (passwordInput._clearHandler)
    passwordInput.removeEventListener("input", passwordInput._clearHandler);

  usernameInput._clearHandler = handler;
  passwordInput._clearHandler = handler;
  usernameInput.addEventListener("input", usernameInput._clearHandler);
  passwordInput.addEventListener("input", passwordInput._clearHandler);
}

async function handleLoginSubmit(e) {
  e.preventDefault();

  const usernameInput = loginModal.querySelector("#login-username");
  const passwordInput = loginModal.querySelector("#login-password");
  const usernameError = loginModal.querySelector('[data-error="username"]');

  clearAllErrors();

  // Mark both fields red if either is empty — single error message covers both
  const usernameEmpty = !usernameInput.value.trim();
  const passwordEmpty = !passwordInput.value;

  if (usernameEmpty || passwordEmpty) {
    if (usernameEmpty) usernameInput.classList.add("error");
    if (passwordEmpty) passwordInput.classList.add("error");
    showError(
      usernameInput,
      usernameError,
      "Please enter username and password",
    );
    attachClearOnAnyInput();
    return;
  }

  try {
    const csrfToken = await fetchCsrfToken();
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
      // Map HTTP status to a user-facing message; fall back to the API's own error string
      let message = "Login failed";
      if (response.status === 401) {
        message = "Username or Password do not match";
      } else if (response.status === 429) {
        message = data.error || "Too many attempts. Please try again later.";
      } else {
        message = data.error || "Login failed";
      }

      usernameInput.classList.add("error");
      passwordInput.classList.add("error");
      showError(usernameInput, usernameError, message);
      attachClearOnAnyInput();
      return;
    }

    closeLoginModal();
    if (typeof updateAuthButton === "function") await updateAuthButton();

    // Prefer module-local showToast but fall back to window for compatibility
    if (typeof showToast === "function") {
      const username = data.user?.username ?? usernameInput.value.trim();
      showToast(`Welcome back, ${username}!`, "success");
    }
  } catch (err) {
    console.error("Login error:", err);
    usernameInput.classList.add("error");
    showError(usernameInput, usernameError, "Server not reachable");
    attachClearOnAnyInput();
  }
}
