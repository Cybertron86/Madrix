/**
 * register-modal.js
 * 
 * Lazy-initialised on first open; exposes openRegisterModal and closeRegisterModal
 * globally so other modules (e.g. login modal) can trigger them directly.
 */
(function () {
  "use strict";

  let registerModal = null;

  // Inject HTML, wire up all inputs and events — runs only once
  function createRegisterModal() {
    if (registerModal) return;

    registerModal = document.createElement("div");
    registerModal.className = "register-modal mx-modal-overlay";
    registerModal.setAttribute("role", "dialog");
    registerModal.setAttribute("aria-modal", "true");
    registerModal.setAttribute("aria-labelledby", "register-title");
    registerModal.innerHTML = `
        <div class="mx-modal-container">
          <button class="mx-modal-close" aria-label="Close Registration Modal">×</button>
          <h2 class="mx-modal-title" id="register-title">REGISTER</h2>
          
          <div class="mx-modal-content">
            <form class="mx-form" id="registerForm" novalidate>
              <!-- Username Field -->
              <div class="mx-form-group">
                <label for="register-username" class="mx-label">Username</label>
                <div class="mx-input-wrapper">
                  <input 
                    type="text" 
                    id="register-username" 
                    class="mx-input" 
                    placeholder="Choose username"
                    autocomplete="username"
                    required
                    aria-describedby="register-username-error"
                  >
                </div>
                <div class="mx-error-message" id="register-username-error" data-error="username" aria-live="polite"></div>
              </div>

              <!-- Password Field -->
              <div class="mx-form-group">
                <label for="register-password" class="mx-label">Password</label>
                <div class="mx-input-wrapper">
                  <input 
                    type="password" 
                    id="register-password" 
                    class="mx-input" 
                    placeholder="Create password"
                    autocomplete="new-password"
                    required
                    aria-describedby="register-password-strength register-password-error"
                  >
                  <button type="button" class="mx-pw-toggle" id="regPwToggle" aria-label="Show password" aria-pressed="false">
                    👁️
                  </button>
                </div>
                <div class="mx-strength-meter" id="register-password-strength" aria-label="Password strength indicator">
                  <div class="mx-strength-bar"></div>
                  <div class="mx-strength-bar"></div>
                  <div class="mx-strength-bar"></div>
                  <div class="mx-strength-bar"></div>
                </div>
                <div class="mx-error-message" id="register-password-error" data-error="password" aria-live="polite"></div>
              </div>

              <!-- Confirm Password Field -->
              <div class="mx-form-group">
                <label for="register-password-confirm" class="mx-label">Confirm Password</label>
                <div class="mx-input-wrapper">
                  <input 
                    type="password" 
                    id="register-password-confirm" 
                    class="mx-input" 
                    placeholder="Confirm password"
                    autocomplete="new-password"
                    required
                    aria-describedby="register-password-confirm-error"
                  >
                  <button type="button" class="mx-pw-toggle" id="regPwConfirmToggle" aria-label="Show confirm password" aria-pressed="false">
                    👁️
                  </button>
                </div>
                <div class="mx-error-message" id="register-password-confirm-error" data-error="password-confirm" aria-live="polite"></div>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="mx-btn">
                Register
              </button>
            </form>

            <!-- Login Link -->
            <div class="register-login-link">
              Already have an account?
              <button type="button" class="register-login-btn" aria-label="Switch to login">
                👉 Login here 👈
              </button>
            </div>
          </div>
        </div>
      `;

    document.body.appendChild(registerModal);

    const closeBtn = registerModal.querySelector(".mx-modal-close");
    const form = registerModal.querySelector("#registerForm");
    const usernameInput = registerModal.querySelector("#register-username");
    const passwordInput = registerModal.querySelector("#register-password");
    const passwordConfirmInput = registerModal.querySelector("#register-password-confirm");
    const passwordToggle = registerModal.querySelector("#regPwToggle");
    const passwordToggleConfirm = registerModal.querySelector("#regPwConfirmToggle");
    const loginBtn = registerModal.querySelector(".register-login-btn");

    // Wire up close/keyboard/overlay-click via ModalManager
    window.SecurityUtils.ModalManager.setup(registerModal, closeRegisterModal);
    closeBtn.addEventListener("click", closeRegisterModal);

    // Toggle between password/text and swap the eye icon accordingly
    const toggleVisibility = (input, btn) => {
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      btn.textContent = isVisible ? "👁️" : "🙈";
      btn.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      btn.setAttribute("aria-pressed", !isVisible);
    };

    passwordToggle.addEventListener("click", () => toggleVisibility(passwordInput, passwordToggle));
    passwordToggleConfirm.addEventListener("click", () => toggleVisibility(passwordConfirmInput, passwordToggleConfirm));

    // Re-check match on every password keystroke so the confirm error stays in sync
    usernameInput.addEventListener("input", () => validateRegisterUsername(usernameInput));
    passwordInput.addEventListener("input", () => {
      validateRegisterPassword(passwordInput);
      validatePasswordMatch(passwordInput, passwordConfirmInput);
    });
    passwordConfirmInput.addEventListener("input", () => validatePasswordMatch(passwordInput, passwordConfirmInput));

    form.addEventListener("submit", handleRegisterSubmit);

    // Delay opening login so the close animation can finish first
    loginBtn.addEventListener("click", () => {
      closeRegisterModal();
      setTimeout(() => {
        if (typeof window.openLoginModal === "function") window.openLoginModal();
      }, 400);
    });
  }

  function openRegisterModal() {
    createRegisterModal();
    window.SecurityUtils.ModalManager.open(registerModal, "active", "#register-username");
  }

  function closeRegisterModal() {
    if (!registerModal) return;
    window.SecurityUtils.ModalManager.close(registerModal, "active");
    // Reset form and clear visual validation state on every close
    const form = registerModal.querySelector("#registerForm");
    if (form) {
      form.reset();
      clearRegisterValidationErrors();
    }
  }

  function validateRegisterUsername(input) {
    const errorDiv = registerModal.querySelector('[data-error="username"]');
    return window.SecurityUtils.validateUsername(input, errorDiv);
  }

  function validateRegisterPassword(input) {
    const errorDiv = registerModal.querySelector('[data-error="password"]');
    const strengthBars = registerModal.querySelectorAll(".mx-strength-bar");
    return window.SecurityUtils.validatePassword(input, errorDiv, strengthBars);
  }

  function validatePasswordMatch(passwordInput, confirmInput) {
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const errorDiv = registerModal.querySelector('[data-error="password-confirm"]');

    confirmInput.classList.remove("error", "success");
    errorDiv.classList.remove("show");

    if (confirm === "") return false; // skip until the user starts typing
    if (password !== confirm) {
      window.SecurityUtils.showError(confirmInput, errorDiv, "Passwords do not match");
      return false;
    }

    confirmInput.classList.add("success");
    return true;
  }

  function clearRegisterValidationErrors() {
    const inputs = registerModal.querySelectorAll(".mx-input");
    const errors = registerModal.querySelectorAll(".mx-error-message");
    const strengthBars = registerModal.querySelectorAll(".mx-strength-bar");
    inputs.forEach((input) => input.classList.remove("error", "success"));
    errors.forEach((error) => error.classList.remove("show"));
    strengthBars.forEach((bar) => bar.classList.remove("active", "weak", "medium", "strong"));
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();

    const usernameInput = registerModal.querySelector("#register-username");
    const passwordInput = registerModal.querySelector("#register-password");
    const passwordConfirmInput = registerModal.querySelector("#register-password-confirm");

    // Bail early if any field is invalid — errors are shown by each validator
    if (
      !validateRegisterUsername(usernameInput) ||
      !validateRegisterPassword(passwordInput) ||
      !validatePasswordMatch(passwordInput, passwordConfirmInput)
    ) return;

    const username = usernameInput.value.trim();

    try {
      const csrfToken = await window.SecurityUtils.fetchCsrfToken();
      const response = await fetch("/api/register.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: passwordInput.value,
          remember: true,
          csrf_token: csrfToken,
          device: navigator.userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API may return a single error string or an array — normalise to string
        const errorMessage = Array.isArray(data.error) ? data.error[0] : data.error || "Registration failed";
        window.SecurityUtils.showError(usernameInput, registerModal.querySelector('[data-error="username"]'), errorMessage);
        return;
      }

      closeRegisterModal();
      if (typeof window.updateAuthButton === "function") window.updateAuthButton();
      if (typeof window.showToast === "function") window.showToast(`Registration successful. Welcome ${username}!`, "success");
    } catch (err) {
      console.error("Register error:", err);
      window.SecurityUtils.showError(usernameInput, registerModal.querySelector('[data-error="username"]'), "Server not reachable");
    }
  }

  // Expose globally so login modal and other modules can open/close this modal
  window.openRegisterModal = openRegisterModal;
  window.closeRegisterModal = closeRegisterModal;
})();