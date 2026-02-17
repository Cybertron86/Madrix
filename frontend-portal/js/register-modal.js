// ====================================================================================================================================
//  REGISTER MODAL MODULE
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

  // Click outside to close
  registerModal.addEventListener("click", (e) => {
    if (e.target === registerModal) closeRegisterModal();
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && registerModal.classList.contains("active")) {
      closeRegisterModal();
    }
  });

  // Password toggles
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

  // Real-time validation
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

  // Form submission
  form.addEventListener("submit", handleRegisterSubmit);

  // Switch to login
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

function validateRegisterUsername(input) {
  const value = input.value.trim();
  const errorDiv = registerModal.querySelector('[data-error="username"]');

  input.classList.remove("error", "success");
  errorDiv.classList.remove("show");

  if (value === "") return false;

  if (value.length < 3) {
    showRegisterError(
      input,
      errorDiv,
      "Username must be at least 3 characters",
    );
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    showRegisterError(
      input,
      errorDiv,
      "Only letters, numbers, - and _ allowed",
    );
    return false;
  }

  input.classList.add("success");
  return true;
}

function validateRegisterPassword(input) {
  const value = input.value;
  const errorDiv = registerModal.querySelector('[data-error="password"]');
  const strengthBars = registerModal.querySelectorAll(
    ".register-password-strength-bar",
  );

  input.classList.remove("error", "success");
  errorDiv.classList.remove("show");
  strengthBars.forEach((bar) =>
    bar.classList.remove("active", "weak", "medium", "strong"),
  );

  if (value === "") return false;

  if (value.length < 12) {
    showRegisterError(
      input,
      errorDiv,
      "Password must be at least 12 characters",
    );
    updateRegisterPasswordStrength(strengthBars, 1, "weak");
    return false;
  }

  if (!/[A-Z]/.test(value)) {
    showRegisterError(
      input,
      errorDiv,
      "Password must contain an uppercase letter",
    );
    updateRegisterPasswordStrength(strengthBars, 1, "weak");
    return false;
  }

  if (!/[a-z]/.test(value)) {
    showRegisterError(
      input,
      errorDiv,
      "Password must contain a lowercase letter",
    );
    updateRegisterPasswordStrength(strengthBars, 2, "weak");
    return false;
  }

  if (!/[0-9]/.test(value)) {
    showRegisterError(input, errorDiv, "Password must contain a number");
    updateRegisterPasswordStrength(strengthBars, 2, "medium");
    return false;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    showRegisterError(
      input,
      errorDiv,
      "Password must contain a special character",
    );
    updateRegisterPasswordStrength(strengthBars, 3, "medium");
    return false;
  }

  input.classList.add("success");
  updateRegisterPasswordStrength(strengthBars, 4, "strong");
  return true;
}

function validatePasswordMatch(passwordInput, confirmInput) {
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  const errorDiv = registerModal.querySelector(
    '[data-error="password-confirm"]',
  );

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

function showRegisterError(input, errorDiv, message) {
  input.classList.add("error");
  errorDiv.textContent = message;
  errorDiv.classList.add("show");
}

function updateRegisterPasswordStrength(bars, count, strength) {
  for (let i = 0; i < count; i++) {
    bars[i].classList.add("active", strength);
  }
}

function clearRegisterValidationErrors() {
  const inputs = registerModal.querySelectorAll(".register-form-input");
  const errors = registerModal.querySelectorAll(".register-error-message");
  const strengthBars = registerModal.querySelectorAll(
    ".register-password-strength-bar",
  );

  inputs.forEach((input) => input.classList.remove("error", "success"));
  errors.forEach((error) => error.classList.remove("show"));
  strengthBars.forEach((bar) =>
    bar.classList.remove("active", "weak", "medium", "strong"),
  );
}

async function handleRegisterSubmit(e) {
  e.preventDefault();

  const usernameInput = registerModal.querySelector("#register-username");
  const passwordInput = registerModal.querySelector("#register-password");
  const passwordConfirmInput = registerModal.querySelector(
    "#register-password-confirm",
  );

  const isUsernameValid = validateRegisterUsername(usernameInput);
  const isPasswordValid = validateRegisterPassword(passwordInput);
  const isPasswordMatchValid = validatePasswordMatch(
    passwordInput,
    passwordConfirmInput,
  );

  if (!isUsernameValid || !isPasswordValid || !isPasswordMatchValid) return;

  const username = usernameInput.value.trim();

  try {
    const response = await fetch("/api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password: passwordInput.value,
        remember: true,
        device: navigator.userAgent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showRegisterError(
        usernameInput,
        registerModal.querySelector('[data-error="username"]'),
        data.error || "Registration failed",
      );
      return;
    }

    // ✅ Registrierung erfolgreich - Modal schließen
    closeRegisterModal();

    // 🔄 Navbar aktualisieren (LOGIN → LOGOUT)
    if (typeof updateAuthButton === "function") {
      updateAuthButton();
    }

    // 🎉 Willkommensnachricht anzeigen
    showToast(`Registration successful. Welcome ${username}!`, "success");
  } catch (err) {
    console.error("Register error:", err);
    showRegisterError(
      usernameInput,
      registerModal.querySelector('[data-error="username"]'),
      "Server not reachable",
    );
  }
}
