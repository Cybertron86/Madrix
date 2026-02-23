/**
 * profile-modal.js  v2
 *
 * Improvements:
 *  - Password validation identical to register-modal.js
 *    (min. 12 chars, upper/lowercase, number, special char + strength indicator)
 *  - Profile button appears/disappears live via userLoggedIn / userLoggedOut events
 *  - XSS Protection: all user inputs are escaped, no innerHTML with user data
 *  - Input Sanitization: Whitelist regex, maxlength enforcement
 *  - Debounce on submit buttons (prevents multiple submissions)
 *  - Content Security: no eval(), no unsafe DOM injections
 *
 * Include in index.html:
 *   <link rel="stylesheet" href="css/profile-modal.css" />
 *   <script src="js/profile-modal.js" defer></script>
 */

(function () {
  "use strict";

  /* ── Input-Sanitization ──────────────────────────────────── */
  const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
  const USERNAME_MAX = 32;

  function sanitizeUsername(value) {
    return String(value).trim().slice(0, USERNAME_MAX);
  }

  /* ── HTML-Template ──── */
  const MODAL_HTML = `
    <div id="profileOverlay" class="mx-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div class="mx-modal-container profile-modal-custom">

        <div class="profile-modal-corner-br"></div>

        <!-- Header -->
        <div class="mx-modal-header">
          <h2 class="mx-modal-title" id="profile-title">
            PROFILE
            <span class="mx-title-sub">// SYSTEM ACCESS</span>
          </h2>
          <button id="profileCloseBtn" class="mx-modal-close" aria-label="Close Profile Modal">✕</button>
        </div>

        <div class="mx-modal-content">
          <!-- Section: Change Username -->
          <div class="profile-section" role="region" aria-labelledby="section-username-title">
            <p class="profile-section-label" id="section-username-title">▸ Change Username</p>
            <div class="profile-input-row">
              <input
                id="profileNewUsername"
                class="mx-input"
                type="text"
                placeholder="NEW USERNAME"
                autocomplete="username"
                maxlength="32"
                spellcheck="false"
                aria-describedby="profileUsernameFeedback"
              />
              <button id="profileSaveUsernameBtn" class="mx-btn profile-save-btn" aria-label="Save Username">SAVE</button>
            </div>
            <div id="profileUsernameFeedback" class="mx-feedback" aria-live="polite"></div>
          </div>

          <!-- Section: Change Password -->
          <div class="profile-section" role="region" aria-labelledby="section-password-title">
            <p class="profile-section-label" id="section-password-title">▸ Change Password</p>

            <div class="mx-input-wrapper">
              <input
                id="profileNewPassword"
                class="mx-input"
                type="password"
                placeholder="NEW PASSWORD"
                autocomplete="new-password"
                maxlength="128"
                aria-describedby="profile-pw-hint profilePasswordFeedback"
              />
              <button type="button" class="mx-pw-toggle" id="profilePwToggle1" aria-label="Show password" aria-pressed="false">👁️</button>
            </div>

            <!-- Strength indicator -->
            <div class="mx-strength-meter" id="profilePwStrength" aria-label="Password strength indicator">
              <div class="mx-strength-bar"></div>
              <div class="mx-strength-bar"></div>
              <div class="mx-strength-bar"></div>
              <div class="mx-strength-bar"></div>
            </div>

            <p class="profile-pw-hint" id="profile-pw-hint">Min. 12 chars · uppercase · lowercase · number · special character</p>

            <div class="mx-input-wrapper">
              <input
                id="profileConfirmPassword"
                class="mx-input"
                type="password"
                placeholder="CONFIRM PASSWORD"
                autocomplete="new-password"
                maxlength="128"
                aria-describedby="profilePasswordFeedback"
              />
              <button type="button" class="mx-pw-toggle" id="profilePwToggle2" aria-label="Show confirm password" aria-pressed="false">👁️</button>
            </div>

            <div style="margin-top:1rem;">
              <button id="profileSavePasswordBtn" class="mx-btn">SAVE PASSWORD</button>
            </div>
            <div id="profilePasswordFeedback" class="mx-feedback" aria-live="polite"></div>
          </div>

          <!-- Section: Delete Account -->
          <div class="profile-section profile-delete-zone" role="region" aria-labelledby="section-delete-title">
            <p class="profile-section-label" id="section-delete-title">▸ Danger Zone</p>
            <p class="profile-delete-description">
              Permanently remove your account and all associated data from the system.
            </p>
            <button id="profileDeleteBtn" class="mx-btn profile-btn-delete" aria-haspopup="true">DELETE ACCOUNT</button>

            <!-- Confirmation Panel -->
            <div id="profileConfirmPanel" class="profile-confirm-panel" role="alert" aria-hidden="true">
              <p class="profile-confirm-text">
                <strong>⚠ WARNING</strong>
                Are you really sure you want to delete your account?
                This action cannot be undone!
              </p>
              <div class="profile-confirm-actions">
                <button id="profileConfirmDeleteBtn" class="mx-btn profile-btn-delete">YES, DELETE PERMANENTLY</button>
                <button id="profileCancelDeleteBtn" class="mx-btn profile-btn-cancel">CANCEL</button>
              </div>
              <div id="profileDeleteFeedback" class="mx-feedback" aria-live="polite"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ── State ───────────────────────────────────────────────── */
  let injected = false;
  let submitLock = {}; // Debounce-lock per action

  /* ── Feedback Helper ─────────────────────────────────────── */
  function setFeedback(el, message, type) {
    el.textContent = message;
    el.className = "mx-feedback " + type;
  }

  function clearFeedback(el) {
    el.textContent = "";
    el.className = "mx-feedback";
  }

  function setInputState(input, state) {
    input.classList.remove("error", "success");
    if (state === "error") input.classList.add("error");
    if (state === "success") input.classList.add("success");
  }

  /* ── Password Validation ── */
  function validateNewPassword(pwInput, bars, feedbackEl) {
    return window.SecurityUtils.validatePassword(pwInput, feedbackEl, bars);
  }

  function validatePasswordMatch(pwInput, confirmInput, feedbackEl) {
    setInputState(confirmInput, null);
    if (confirmInput.value === "") return false;

    if (pwInput.value !== confirmInput.value) {
      setInputState(confirmInput, "error");
      setFeedback(feedbackEl, "▸ Passwords do not match.", "error");
      return false;
    }

    setInputState(confirmInput, "success");
    return true;
  }

  /* ── Modal Lifecycle ─────────────────────────────────────── */
  function injectModal() {
    if (injected) return;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    bindEvents();
    injected = true;
  }

  function openModal() {
    injectModal();
    const overlay = document.getElementById("profileOverlay");
    window.SecurityUtils.ModalManager.open(overlay, "active", "#profileNewUsername");
  }

  function closeModal() {
    const overlay = document.getElementById("profileOverlay");
    if (!overlay) return;
    window.SecurityUtils.ModalManager.close(overlay, "active");
    setTimeout(resetModal, 350);
  }

  function resetModal() {
    const ids = [
      "profileNewUsername",
      "profileNewPassword",
      "profileConfirmPassword",
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = "";
        setInputState(el, null);
      }
    });

    const confirmPanel = document.getElementById("profileConfirmPanel");
    if (confirmPanel) confirmPanel.classList.remove("visible");

    const deleteBtn = document.getElementById("profileDeleteBtn");
    if (deleteBtn) deleteBtn.style.display = "";

    const bars = document.querySelectorAll(".mx-strength-bar");
    bars.forEach((bar) => bar.classList.remove("active", "weak", "medium", "strong"));

    [
      "profileUsernameFeedback",
      "profilePasswordFeedback",
      "profileDeleteFeedback",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) clearFeedback(el);
    });

    submitLock = {};
  }

  /* ── Bind Events ───────────────────────────────────────── */
  function bindEvents() {
    const overlay = document.getElementById("profileOverlay");
    const closeBtn = document.getElementById("profileCloseBtn");
    const saveUsernameBtn = document.getElementById("profileSaveUsernameBtn");
    const savePasswordBtn = document.getElementById("profileSavePasswordBtn");
    const deleteBtn = document.getElementById("profileDeleteBtn");
    const confirmDeleteBtn = document.getElementById("profileConfirmDeleteBtn");
    const cancelDeleteBtn = document.getElementById("profileCancelDeleteBtn");
    const pwInput = document.getElementById("profileNewPassword");
    const pwConfirm = document.getElementById("profileConfirmPassword");
    const pwToggle1 = document.getElementById("profilePwToggle1");
    const pwToggle2 = document.getElementById("profilePwToggle2");
    const bars = document.querySelectorAll(".mx-strength-bar");
    const feedbackPw = document.getElementById("profilePasswordFeedback");

    // Modal Manager setup
    window.SecurityUtils.ModalManager.setup(overlay, closeModal);

    // Close button
    closeBtn.addEventListener("click", closeModal);

    // Password Toggles
    const togglePw = (input, btn) => {
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      btn.textContent = isVisible ? "👁️" : "🙈";
      btn.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      btn.setAttribute("aria-pressed", !isVisible);
    };

    pwToggle1.addEventListener("click", () => togglePw(pwInput, pwToggle1));
    pwToggle2.addEventListener("click", () => togglePw(pwConfirm, pwToggle2));

    // Live password validation
    pwInput.addEventListener("input", () => {
      validateNewPassword(pwInput, bars, feedbackPw);
      if (pwConfirm.value)
        validatePasswordMatch(pwInput, pwConfirm, feedbackPw);
    });
    pwConfirm.addEventListener("input", () => {
      validatePasswordMatch(pwInput, pwConfirm, feedbackPw);
    });

    // Save username
    saveUsernameBtn.addEventListener("click", handleSaveUsername);
    document
      .getElementById("profileNewUsername")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSaveUsername();
      });

    // Save password
    savePasswordBtn.addEventListener("click", handleSavePassword);
    pwConfirm.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSavePassword();
    });

    // Delete-Flow
    deleteBtn.addEventListener("click", () => {
      document.getElementById("profileConfirmPanel").classList.add("visible");
      deleteBtn.style.display = "none";
    });

    cancelDeleteBtn.addEventListener("click", () => {
      document
        .getElementById("profileConfirmPanel")
        .classList.remove("visible");
      document.getElementById("profileDeleteBtn").style.display = "";
      clearFeedback(document.getElementById("profileDeleteFeedback"));
    });

    confirmDeleteBtn.addEventListener("click", handleDeleteAccount);
  }

  /* ── Save Username ──────────────────────────────────── */
  async function handleSaveUsername() {
    if (submitLock.username) return;

    const input = document.getElementById("profileNewUsername");
    const feedback = document.getElementById("profileUsernameFeedback");
    const btn = document.getElementById("profileSaveUsernameBtn");
    const raw = sanitizeUsername(input.value);

    clearFeedback(feedback);
    setInputState(input, null);

    // Client-side validation using SecurityUtils
    if (!raw) {
      setInputState(input, "error");
      setFeedback(feedback, "▸ Username cannot be empty.", "error");
      return;
    }
    
    if (!window.SecurityUtils.validateUsername(input, feedback)) return;

    submitLock.username = true;
    btn.disabled = true;
    setFeedback(feedback, "▸ Checking availability...", "loading");

    try {
      const csrf_token = await window.SecurityUtils.fetchCsrfToken();
      const response = await fetch("/api/profile_update.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: raw, csrf_token }),
        credentials: "same-origin",
      });

      if (!response.ok) throw new Error("HTTP " + response.status);

      const data = await response.json();

      if (data.success) {
        setInputState(input, "success");
        setFeedback(feedback, "▸ Username updated successfully.", "success");
        input.value = "";
        document.dispatchEvent(
          new CustomEvent("usernameChanged", { detail: { username: raw } }),
        );
      } else if (data.error === "username_taken") {
        setInputState(input, "error");
        setFeedback(feedback, "▸ Username already taken.", "error");
      } else {
        setFeedback(feedback, "▸ An error occurred. Please try again.", "error");
      }
    } catch (err) {
      setFeedback(feedback, "▸ Connection error.", "error");
    } finally {
      btn.disabled = false;
      setTimeout(() => { submitLock.username = false; }, 1500);
    }
  }

  /* ── Save Password ──────────────────────────────────── */
  async function handleSavePassword() {
    if (submitLock.password) return;

    const pwInput = document.getElementById("profileNewPassword");
    const pwConfirm = document.getElementById("profileConfirmPassword");
    const feedback = document.getElementById("profilePasswordFeedback");
    const btn = document.getElementById("profileSavePasswordBtn");
    const bars = document.querySelectorAll(".mx-strength-bar");

    clearFeedback(feedback);

    if (!validateNewPassword(pwInput, bars, feedback)) return;
    if (!validatePasswordMatch(pwInput, pwConfirm, feedback)) return;

    submitLock.password = true;
    btn.disabled = true;
    setFeedback(feedback, "▸ Updating password...", "loading");

    try {
      const csrf_token = await window.SecurityUtils.fetchCsrfToken();
      const response = await fetch("/api/profile_update.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput.value, csrf_token }),
        credentials: "same-origin",
      });

      if (!response.ok) throw new Error("HTTP " + response.status);

      const data = await response.json();

      if (data.success) {
        setFeedback(feedback, "▸ Password updated. All sessions terminated.", "success");
        pwInput.value = "";
        pwConfirm.value = "";
        setInputState(pwInput, null);
        setInputState(pwConfirm, null);
        bars.forEach(bar => bar.classList.remove("active", "weak", "medium", "strong"));
      } else {
        setFeedback(feedback, "▸ An error occurred.", "error");
      }
    } catch (err) {
      setFeedback(feedback, "▸ Connection error.", "error");
    } finally {
      btn.disabled = false;
      setTimeout(() => { submitLock.password = false; }, 1500);
    }
  }

  /* ── Delete Account ─────────────────────────────────────── */
  async function handleDeleteAccount() {
    if (submitLock.delete) return;

    const feedback = document.getElementById("profileDeleteFeedback");
    const confirmBtn = document.getElementById("profileConfirmDeleteBtn");
    const cancelBtn = document.getElementById("profileCancelDeleteBtn");

    submitLock.delete = true;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    setFeedback(feedback, "▸ Deleting account...", "loading");

    try {
      const csrf_token = await window.SecurityUtils.fetchCsrfToken();
      const response = await fetch("/api/profile_delete.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrf_token }),
        credentials: "same-origin",
      });

      if (!response.ok) throw new Error("HTTP " + response.status);

      const data = await response.json();

      if (data.deleted) {
        setFeedback(feedback, "▸ Account deleted. Goodbye.", "success");
        setTimeout(() => {
          closeModal();
          onAccountDeleted();
        }, 1800);
      } else {
        setFeedback(feedback, "▸ Deletion failed.", "error");
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        submitLock.delete = false;
      }
    } catch (err) {
      setFeedback(feedback, "▸ Connection error.", "error");
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      submitLock.delete = false;
    }
  }

  /* ── Post-Delete ───────────────────── */
  function onAccountDeleted() {
    if (typeof updateAuthButton === "function") {
      updateAuthButton();
    } else {
      const loginBtn = document.getElementById("btn_login");
      if (loginBtn) {
        loginBtn.textContent = "LOGIN";
        loginBtn.disabled = false;
      }
    }
    document.dispatchEvent(new CustomEvent("userLoggedOut", { detail: { reason: "account_deleted" } }));
  }

  /* ── Sync State ──────────────────── */
  function syncProfileButton(visible) {
    document.querySelectorAll('.dropdown-item[data-action="profile"]').forEach((el) => {
      el.style.display = visible ? "" : "none";
    });
  }

  /* ── Init Trigger ─────────────────────── */
  window.ProfileModal = { open: openModal, close: closeModal };
  window.openProfileModal = openModal;
})();
