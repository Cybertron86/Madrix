// ====================================================================================================================================
//  security-utils.js
//
//  SECURITY UTILITIES
//
//  Centralized logic for security-sensitive operations:
//   - XSS prevention via HTML escaping
//   - Input validation (Username/Password rules mirroring server-side)
//   - CSRF token acquisition
//   - Toast notification system
//   - Modal lifecycle management
// ====================================================================================================================================

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 *
 * @param {string} str - The raw input string to escape.
 * @returns {string} - The safely escaped HTML string.
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Fetches a fresh CSRF token from the backend for use in POST/PUT/DELETE requests.
 *
 * @returns {Promise<string>} - A promise that resolves to the CSRF token string.
 * @throws {Error} - Rethrows errors if the server response is invalid or missing the token.
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

// ====================================================================================================================================
//  TOAST NOTIFICATION SYSTEM
// ====================================================================================================================================

/**
 * Displays a non-intrusive toast notification to the user.
 *
 * @param {string} message  - The localized message to display.
 * @param {'success'|'info'|'error'} type - The visual variant (controls CSS class).
 * @param {number} duration - Auto-dismiss delay in milliseconds (default: 3500).
 */
function showToast(message, type = "success", duration = 3500) {
  // Clear any active toast to prevent stacking overlaps
  const existing = document.getElementById("app-toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = "app-toast";
  toast.textContent = message;
  toast.classList.add(`toast--${type}`);
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  document.body.appendChild(toast);

  // Trigger CSS transitions via double requestAnimationFrame for stability
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("toast--visible");
    });
  });

  // Schedule removal based on duration
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, duration);
}

// ====================================================================================================================================
//  VALIDATION LOGIC
// ====================================================================================================================================

/** @constant {Object} Validation constraints shared with backend logic */
const VAL_RULES = {
  username_min: 3,
  username_max: 30,
  password_min: 12,
  password_max: 128,
};

/**
 * Validates a username input field against strict alphanumeric and length rules.
 *
 * @param {HTMLInputElement} input - The input element containing the username.
 * @param {HTMLElement} errorDiv - The display element for validation errors.
 * @returns {boolean} - True if the username is valid, false otherwise.
 */
function validateUsername(input, errorDiv) {
  const value = input.value.trim();

  // Clear previous validation states
  input.classList.remove("error", "success");
  errorDiv.classList.remove("show");

  if (value === "") return false;

  if (value.length < VAL_RULES.username_min) {
    showError(
      input,
      errorDiv,
      `Username must be at least ${VAL_RULES.username_min} characters`,
    );
    return false;
  }

  if (value.length > VAL_RULES.username_max) {
    showError(
      input,
      errorDiv,
      `Username must not exceed ${VAL_RULES.username_max} characters`,
    );
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    showError(
      input,
      errorDiv,
      "Only letters, numbers, hyphens and underscores allowed",
    );
    return false;
  }

  input.classList.add("success");
  return true;
}

/**
 * Validates password complexity requirements and updates strength indicators.
 *
 * Complexity rules:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 *
 * @param {HTMLInputElement} input - The input element containing the password.
 * @param {HTMLElement} errorDiv - The display element for validation errors.
 * @param {NodeListOf<Element>} strengthBars - Optional list of bars for visual strength feedback.
 * @returns {boolean} - True if the password meets all requirements.
 */
function validatePassword(input, errorDiv, strengthBars = null) {
  const value = input.value;

  // Reset UI states
  input.classList.remove("error", "success");
  if (errorDiv) errorDiv.classList.remove("show");
  if (strengthBars) {
    strengthBars.forEach((bar) =>
      bar.classList.remove("active", "weak", "medium", "strong"),
    );
  }

  if (value === "") return false;

  // 1. Minimum Length Check
  if (value.length < VAL_RULES.password_min) {
    showError(
      input,
      errorDiv,
      `Password must be at least ${VAL_RULES.password_min} characters`,
    );
    updateStrength(strengthBars, 1, "weak");
    return false;
  }

  // 2. Maximum Length Check
  if (value.length > VAL_RULES.password_max) {
    showError(
      input,
      errorDiv,
      `Password must not exceed ${VAL_RULES.password_max} characters`,
    );
    updateStrength(strengthBars, 1, "weak");
    return false;
  }

  // 3. Uppercase Presence
  if (!/[A-Z]/.test(value)) {
    showError(
      input,
      errorDiv,
      "Password must contain at least one uppercase letter",
    );
    updateStrength(strengthBars, 1, "weak");
    return false;
  }

  // 4. Lowercase Presence
  if (!/[a-z]/.test(value)) {
    showError(
      input,
      errorDiv,
      "Password must contain at least one lowercase letter",
    );
    updateStrength(strengthBars, 2, "weak");
    return false;
  }

  // 5. Digit Presence
  if (!/[0-9]/.test(value)) {
    showError(input, errorDiv, "Password must contain at least one number");
    updateStrength(strengthBars, 2, "medium");
    return false;
  }

  // 6. Special Character Presence
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?\/\\|`~]/.test(value)) {
    showError(
      input,
      errorDiv,
      "Password must contain at least one special character",
    );
    updateStrength(strengthBars, 3, "medium");
    return false;
  }

  // Final Valid State
  input.classList.add("success");
  updateStrength(strengthBars, 4, "strong");
  return true;
}

/**
 * Helper: Applies error styling and message to an input field.
 *
 * @param {HTMLInputElement} input - Target input element.
 * @param {HTMLElement} errorDiv - Target error message container.
 * @param {string} msg - The error message to display.
 */
function showError(input, errorDiv, msg) {
  input.classList.add("error");
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.add("show");
  }
}

/**
 * Helper: Updates visual strength bar UI.
 *
 * @param {NodeListOf<Element>} bars - List of bar elements.
 * @param {number} count - How many bars to activate.
 * @param {string} level - CSS class defining the strength color (weak, medium, strong).
 */
function updateStrength(bars, count, level) {
  if (!bars) return;
  for (let i = 0; i < count; i++) {
    bars[i].classList.add("active", level);
  }
}

// ====================================================================================================================================
//  MODAL MANAGER
// ====================================================================================================================================

/**
 * Provides generic lifecycle management for application modals.
 */
const ModalManager = {
  /**
   * Orchestrates standard modal listeners (Close button, ESC key, Click-outside).
   *
   * @param {HTMLElement|string} overlayOrId - The modal overlay element or its ID.
   * @param {Function} closeFn - The callback function to invoke for closing.
   * @param {string} activeClass - The class toggled for visibility (default: 'active').
   * @returns {Function} - A cleanup function to remove global listeners.
   */
  setup(overlayOrId, closeFn, activeClass = "active") {
    const overlay =
      typeof overlayOrId === "string"
        ? document.getElementById(overlayOrId)
        : overlayOrId;
    if (!overlay) return;

    // Locate and bind the internal close button
    const closeBtn = overlay.querySelector(".mx-modal-close");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        closeFn();
      };
    }

    // Dismiss on clicking the background (dimmed) area
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeFn();
    });

    // Global Escape key listener for accessibility
    const escHandler = (e) => {
      if (e.key === "Escape" && overlay.classList.contains(activeClass)) {
        closeFn();
      }
    };
    document.addEventListener("keydown", escHandler);

    return () => document.removeEventListener("keydown", escHandler);
  },

  /**
   * Opens a modal and sets initial focus for accessibility.
   *
   * @param {HTMLElement} overlay - Modal overlay element.
   * @param {string} activeClass - Visibility class.
   * @param {string|null} focusSelector - Optional CSS selector to auto-focus.
   */
  open(overlay, activeClass = "active", focusSelector = null) {
    if (!overlay) return;
    overlay.classList.add(activeClass);
    if (focusSelector) {
      setTimeout(() => {
        const el = overlay.querySelector(focusSelector);
        if (el) el.focus();
      }, 100);
    }
  },

  /**
   * Closes a modal by removing its visibility class.
   *
   * @param {HTMLElement} overlay - Modal overlay element.
   * @param {string} activeClass - Visibility class.
   */
  close(overlay, activeClass = "active") {
    if (!overlay) return;
    overlay.classList.remove(activeClass);
  },
};

// ====================================================================================================================================
//  GLOBAL EXPORTS
// ====================================================================================================================================

// ====================================================================================================================================
//  MODULE EXPORTS
// ====================================================================================================================================

// Named exports for ES module consumers
export {
  escapeHtml,
  fetchCsrfToken,
  validateUsername,
  validatePassword,
  showError,
  showToast,
  ModalManager,
};

// NOTE: We intentionally do not rely on attaching to `window` here. Consumers
// should import the required helpers using ES module imports. Keep the code
// compatible with legacy callers by optionally attaching a helper object to
// `window` only when explicitly requested elsewhere during a migration.
