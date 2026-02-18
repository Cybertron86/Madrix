// ====================================================================================================================================
//  SECURITY UTILITIES
//
//  Shared logic for:
//   - XSS prevention (HTML escaping)
//   - Input validation (Username/Password rules mirroring server-side)
//   - CSRF token fetching
//   - Common error handling (Rate limiting)
// ====================================================================================================================================

/**
 * Escapes HTML characters in a string to prevent XSS.
 * Safe to use on any user-supplied content before rendering it to the DOM.
 * 
 * @param {string} str - Raw string
 * @returns {string} - HTML-safe string
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Fetches a fresh CSRF token from the backend.
 * 
 * @returns {Promise<string>} - The CSRF token string
 * @throws {Error} - If fetch fails or token is missing
 */
async function fetchCsrfToken() {
  const response = await fetch("/api/csrf-token.php", {
    method: "GET",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CSRF token: ${response.status}`);
  }

  const data = await response.json();
  if (!data.csrf_token) {
    throw new Error("CSRF token missing in server response");
  }

  return data.csrf_token;
}

// ==========================
// VALIDATION LOGIC
// ==========================

const VAL_RULES = {
  username_min: 3,
  username_max: 30,
  password_min: 12, // Parity with backend
  password_max: 128,
};

/**
 * Validates a username against strict allowlist rules.
 * 
 * Rules:
 * - 3-30 chars
 * - Alphanumeric, hyphen, underscore only
 * 
 * @param {HTMLInputElement} input 
 * @param {HTMLElement} errorDiv 
 * @returns {boolean} - Valid or not
 */
function validateUsername(input, errorDiv) {
  const value = input.value.trim();
  
  // Reset state
  input.classList.remove("error", "success");
  errorDiv.classList.remove("show");

  if (value === "") return false;

  if (value.length < VAL_RULES.username_min) {
    showError(input, errorDiv, `Username must be at least ${VAL_RULES.username_min} characters`);
    return false;
  }

  if (value.length > VAL_RULES.username_max) {
    showError(input, errorDiv, `Username must not exceed ${VAL_RULES.username_max} characters`);
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    showError(input, errorDiv, "Only letters, numbers, - and _ allowed");
    return false;
  }

  input.classList.add("success");
  return true;
}

/**
 * Validates password strength and updates UI indicators.
 * 
 * Rules:
 * - 12-128 chars
 * - Upper, Lower, Digit, Special char required
 * 
 * @param {HTMLInputElement} input 
 * @param {HTMLElement} errorDiv 
 * @param {NodeListOf<Element>} strengthBars - Optional UI bars
 * @returns {boolean}
 */
function validatePassword(input, errorDiv, strengthBars = null) {
  const value = input.value;

  // Reset state
  input.classList.remove("error", "success");
  if (errorDiv) errorDiv.classList.remove("show");
  if (strengthBars) {
    strengthBars.forEach(bar => bar.classList.remove("active", "weak", "medium", "strong"));
  }

  if (value === "") return false;

  // 1. Length Min
  if (value.length < VAL_RULES.password_min) {
    showError(input, errorDiv, `Password must be at least ${VAL_RULES.password_min} characters`);
    updateStrength(strengthBars, 1, "weak");
    return false;
  }

  // 2. Length Max
  if (value.length > VAL_RULES.password_max) {
    showError(input, errorDiv, `Password must not exceed ${VAL_RULES.password_max} characters`);
    updateStrength(strengthBars, 1, "weak");
    return false;
  }

  // 3. Uppercase
  if (!/[A-Z]/.test(value)) {
    showError(input, errorDiv, "Password must contain an uppercase letter");
    updateStrength(strengthBars, 1, "weak");
    return false;
  }

  // 4. Lowercase
  if (!/[a-z]/.test(value)) {
    showError(input, errorDiv, "Password must contain a lowercase letter");
    updateStrength(strengthBars, 2, "weak");
    return false;
  }

  // 5. Digit
  if (!/[0-9]/.test(value)) {
    showError(input, errorDiv, "Password must contain a number");
    updateStrength(strengthBars, 2, "medium");
    return false;
  }

  // 6. Special Char
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?\/\\|`~]/.test(value)) {
    showError(input, errorDiv, "Password must contain a special character");
    updateStrength(strengthBars, 3, "medium");
    return false;
  }

  // Valid
  input.classList.add("success");
  updateStrength(strengthBars, 4, "strong");
  return true;
}

// Helper: Show error on input
function showError(input, errorDiv, msg) {
  input.classList.add("error");
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.add("show");
  }
}

// Helper: Update strength bars
function updateStrength(bars, count, level) {
  if (!bars) return;
  for (let i = 0; i < count; i++) {
    bars[i].classList.add("active", level);
  }
}

// Expose to global scope for non-module scripts
window.SecurityUtils = {
  escapeHtml,
  fetchCsrfToken,
  validateUsername,
  validatePassword,
  showError
};
