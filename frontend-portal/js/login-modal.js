// ====================================================================================================================================
//  LOGIN MODAL MODULE
// ====================================================================================================================================
const loginBtn = document.getElementById("btn_login");

let loginModal = null;

function createLoginModal() {
  if (loginModal) return;

  loginModal = document.createElement("div");
  loginModal.className = "login-modal";
  loginModal.innerHTML = `
      <div class="login-modal-container">
        <button class="login-modal-close" aria-label="Close Login">×</button>
        <h2 class="login-modal-title">LOGIN</h2>
        
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
              >
            </div>
            <div class="login-error-message" data-error="username"></div>
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
              >
              <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>
            <div class="password-strength">
              <div class="password-strength-bar"></div>
              <div class="password-strength-bar"></div>
              <div class="password-strength-bar"></div>
              <div class="password-strength-bar"></div>
            </div>
            <div class="login-error-message" data-error="password"></div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="login-submit-btn">
            <span style="position: relative; z-index: 1;">Login</span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="login-register-link">
          Not registered yet?
          <button type="button" class="login-register-btn">
            👉 Register here 👈
          </button>
        </div>
      </div>
    `;

  document.body.appendChild(loginModal);

  // Get elements
  const closeBtn = loginModal.querySelector(".login-modal-close");
  const form = loginModal.querySelector("#loginForm");
  const usernameInput = loginModal.querySelector("#login-username");
  const passwordInput = loginModal.querySelector("#login-password");
  const passwordToggle = loginModal.querySelector(".password-toggle");
  const registerBtn = loginModal.querySelector(".login-register-btn");

  // Close button
  closeBtn.addEventListener("click", closeLoginModal);

  // Click outside to close
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      closeLoginModal();
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && loginModal.classList.contains("active")) {
      closeLoginModal();
    }
  });

  // Password toggle
  passwordToggle.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    passwordToggle.textContent = type === "password" ? "👁️" : "🙈";
  });

  // Real-time validation
  usernameInput.addEventListener("input", () =>
    validateUsername(usernameInput),
  );
  passwordInput.addEventListener("input", () =>
    validatePassword(passwordInput),
  );

  // Form submission
  form.addEventListener("submit", handleLoginSubmit);

  // Register button
  // Register button
  registerBtn.addEventListener("click", () => {
    closeLoginModal();
    setTimeout(() => {
      openRegisterModal();
    }, 400);
  });
}

function openLoginModal() {
  createLoginModal();

  setTimeout(() => {
    loginModal.classList.add("active");
  }, 10);
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove("active");

  // Reset form
  const form = loginModal.querySelector("#loginForm");
  if (form) {
    form.reset();
    clearValidationErrors();
  }
}

function validateUsername(input) {
  const value = input.value.trim();
  const errorDiv = loginModal.querySelector('[data-error="username"]');

  // Clear previous state
  input.classList.remove("error", "success");
  errorDiv.classList.remove("show");

  if (value === "") {
    return false;
  }

  if (value.length < 3) {
    showError(input, errorDiv, "Username must be at least 3 characters");
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    showError(input, errorDiv, "Only letters, numbers, - and _ allowed");
    return false;
  }

  input.classList.add("success");
  return true;
}

function validatePassword(input) {
  const value = input.value;
  const errorDiv = loginModal.querySelector('[data-error="password"]');
  const strengthBars = loginModal.querySelectorAll(".password-strength-bar");

  // Clear previous state
  input.classList.remove("error", "success");
  errorDiv.classList.remove("show");
  strengthBars.forEach((bar) => {
    bar.classList.remove("active", "weak", "medium", "strong");
  });

  if (value === "") {
    return false;
  }

  // Check length
  if (value.length < 12) {
    showError(input, errorDiv, "Password must be at least 12 characters");
    updatePasswordStrength(strengthBars, 1, "weak");
    return false;
  }

  // Check for uppercase
  if (!/[A-Z]/.test(value)) {
    showError(input, errorDiv, "Password must contain an uppercase letter");
    updatePasswordStrength(strengthBars, 1, "weak");
    return false;
  }

  // Check for lowercase
  if (!/[a-z]/.test(value)) {
    showError(input, errorDiv, "Password must contain a lowercase letter");
    updatePasswordStrength(strengthBars, 2, "weak");
    return false;
  }

  // Check for number
  if (!/[0-9]/.test(value)) {
    showError(input, errorDiv, "Password must contain a number");
    updatePasswordStrength(strengthBars, 2, "medium");
    return false;
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    showError(input, errorDiv, "Password must contain a special character");
    updatePasswordStrength(strengthBars, 3, "medium");
    return false;
  }

  // All checks passed
  input.classList.add("success");
  updatePasswordStrength(strengthBars, 4, "strong");
  return true;
}

function showError(input, errorDiv, message) {
  input.classList.add("error");
  errorDiv.textContent = message;
  errorDiv.classList.add("show");
}

function updatePasswordStrength(bars, count, strength) {
  for (let i = 0; i < count; i++) {
    bars[i].classList.add("active", strength);
  }
}

function clearValidationErrors() {
  const inputs = loginModal.querySelectorAll(".login-form-input");
  const errors = loginModal.querySelectorAll(".login-error-message");
  const strengthBars = loginModal.querySelectorAll(".password-strength-bar");

  inputs.forEach((input) => input.classList.remove("error", "success"));
  errors.forEach((error) => error.classList.remove("show"));
  strengthBars.forEach((bar) =>
    bar.classList.remove("active", "weak", "medium", "strong"),
  );
}

async function handleLoginSubmit(e) {
  e.preventDefault();

  const usernameInput = loginModal.querySelector("#login-username");
  const passwordInput = loginModal.querySelector("#login-password");

  const isUsernameValid = validateUsername(usernameInput);
  const isPasswordValid = validatePassword(passwordInput);

  if (!isUsernameValid || !isPasswordValid) {
    return;
  }

  try {
    const response = await fetch("/api/login.php", {
      // Korrigierter Pfad
      method: "POST",
      credentials: "same-origin", // Session-Cookie mitsenden
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        remember: true,
        device: navigator.userAgent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(
        usernameInput,
        loginModal.querySelector('[data-error="username"]'),
        data.error || "Login failed",
      );
      return;
    }

    // Login erfolgreich - Modal schliessen
    closeLoginModal();

    // Navbar: LOGIN to LOGOUT
    if (typeof updateAuthButton === "function") {
      await updateAuthButton();
    }

    // Toast Willkommensnachricht
    if (typeof showToast === "function") {
      const username = data.user?.username ?? usernameInput.value.trim();
      showToast(`Welcome back, ${username}!`, "success");
    }
  } catch (err) {
    console.error("Login error:", err);
    showError(
      usernameInput,
      loginModal.querySelector('[data-error="username"]'),
      "Server not reachable",
    );
  }
}

// Login button event listener
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    openLoginModal();
  });
}
