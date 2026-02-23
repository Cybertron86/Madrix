/**
 * profile-modal.js
 * 
 * Logic for the User Profile Management interface.
 * Handles username changes, secure password updates with strength detection,
 * and account deletion workflows.
 * 
 * Integrates with SecurityUtils for validation and CSRF protection.
 */
(function() {
  "use strict";

  // ====================================================================================================================================
  //  CONSTANTS & CONFIG
  // ====================================================================================================================================

  /** @type {RegExp} Valid characters for usernames. */
  const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
  const USERNAME_MAX = 32;

  /**
   * Simple sanitization for username inputs.
   * @param {string} value 
   */
  function sanitizeUsername(value) {
    return String(value).trim().slice(0, USERNAME_MAX);
  }

  // ====================================================================================================================================
  //  UI TEMPLATES
  // ====================================================================================================================================

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

  // ====================================================================================================================================
  //  MODULE STATE
  // ====================================================================================================================================

  let injected = false;
  let submitLock = {}; // Prevents double submissions

  // ====================================================================================================================================
  //  UI FEEDBACK HELPERS
  // ====================================================================================================================================

  /**
   * Sets the visual feedback for an input group.
   * @param {HTMLElement} el - Feedback element.
   * @param {string} message - Message to display.
   * @param {'error'|'success'|'loading'} type - Feedback type.
   */
  function setFeedback(el, message, type) {
    el.textContent = message;
    el.className = "mx-feedback " + type;
  }

  /**
   * Clears feedback text and classes.
   */
  function clearFeedback(el) {
    el.textContent = "";
    el.className = "mx-feedback";
  }

  /**
   * Updates the visual border state of an input.
   */
  function setInputState(input, state) {
    input.classList.remove("error", "success");
    if (state === "error") input.classList.add("error");
    if (state === "success") input.classList.add("success");
  }

  // ====================================================================================================================================
  //  VALIDATION LOGIC
  // ====================================================================================================================================

  /**
   * Wraps SecurityUtils password validation.
   */
  function validateNewPassword(pwInput, bars, feedbackEl) {
    return window.SecurityUtils?.validatePassword(pwInput, feedbackEl, bars);
  }

  /**
   * Checks if password confirmation matches.
   */
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

  // ====================================================================================================================================
  //  MODAL LIFECYCLE
  // ====================================================================================================================================

  /**
   * Injects structural HTML if not present.
   */
  function injectModal() {
    if (injected) return;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    bindLocalEvents();
    injected = true;
  }

  /**
   * Opens the profile modal with focus management.
   */
  function openModal() {
    injectModal();
    const overlay = document.getElementById("profileOverlay");
    window.SecurityUtils?.ModalManager?.open(overlay, "active", "#profileNewUsername");
  }

  /**
   * Closes the profile modal and triggers cleanup.
   */
  function closeModal() {
    const overlay = document.getElementById("profileOverlay");
    if (!overlay) return;
    window.SecurityUtils?.ModalManager?.close(overlay, "active");
    setTimeout(resetModalState, 350);
  }

  /**
   * Resets all inputs and feedback fields to their default state.
   */
  function resetModalState() {
    const ids = ["profileNewUsername", "profileNewPassword", "profileConfirmPassword"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ""; setInputState(el, null); }
    });

    const confirmPanel = document.getElementById("profileConfirmPanel");
    if (confirmPanel) confirmPanel.classList.remove("visible");

    const deleteBtn = document.getElementById("profileDeleteBtn");
    if (deleteBtn) deleteBtn.style.display = "";

    const bars = document.querySelectorAll(".mx-strength-bar");
    bars.forEach(bar => bar.className = "mx-strength-bar");

    ["profileUsernameFeedback", "profilePasswordFeedback", "profileDeleteFeedback"].forEach(id => {
      const el = document.getElementById(id);
      if (el) clearFeedback(el);
    });

    submitLock = {};
  }

  // ====================================================================================================================================
  //  EVENT BINDING
  // ====================================================================================================================================

  /**
   * Sets up internal listeners for inputs and buttons.
   */
  function bindLocalEvents() {
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

    // Modal Manager Integration
    window.SecurityUtils?.ModalManager?.setup(overlay, closeModal);

    // Header close
    closeBtn.addEventListener("click", closeModal);

    // Password Visibility Toggles
    const togglePw = (input, btn) => {
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      btn.textContent = isVisible ? "👁️" : "🙈";
      btn.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
      btn.setAttribute("aria-pressed", !isVisible);
    };

    pwToggle1.addEventListener("click", () => togglePw(pwInput, pwToggle1));
    pwToggle2.addEventListener("click", () => togglePw(pwConfirm, pwToggle2));

    // Dynamic Validation Listeners
    pwInput.addEventListener("input", () => {
      validateNewPassword(pwInput, bars, feedbackPw);
      if (pwConfirm.value) validatePasswordMatch(pwInput, pwConfirm, feedbackPw);
    });
    pwConfirm.addEventListener("input", () => {
      validatePasswordMatch(pwInput, pwConfirm, feedbackPw);
    });

    // Submission Handlers
    saveUsernameBtn.addEventListener("click", handleSaveUsername);
    document.getElementById("profileNewUsername").addEventListener("keydown", e => {
      if (e.key === "Enter") handleSaveUsername();
    });

    savePasswordBtn.addEventListener("click", handleSavePassword);
    pwConfirm.addEventListener("keydown", e => {
      if (e.key === "Enter") handleSavePassword();
    });

    // Account Deletion Workflow
    deleteBtn.addEventListener("click", () => {
      document.getElementById("profileConfirmPanel").classList.add("visible");
      deleteBtn.style.display = "none";
    });

    cancelDeleteBtn.addEventListener("click", () => {
      document.getElementById("profileConfirmPanel").classList.remove("visible");
      document.getElementById("profileDeleteBtn").style.display = "";
      clearFeedback(document.getElementById("profileDeleteFeedback"));
    });

    confirmDeleteBtn.addEventListener("click", handleDeleteAccount);
  }

  // ====================================================================================================================================
  //  FORM ACTIONS (XHR)
  // ====================================================================================================================================

  /**
   * Processes username update requests.
   */
  async function handleSaveUsername() {
    if (submitLock.username) return;

    const input = document.getElementById("profileNewUsername");
    const feedback = document.getElementById("profileUsernameFeedback");
    const btn = document.getElementById("profileSaveUsernameBtn");
    const raw = sanitizeUsername(input.value);

    clearFeedback(feedback);
    setInputState(input, null);

    if (!raw) {
      setInputState(input, "error");
      setFeedback(feedback, "▸ Username required.", "error");
      return;
    }
    
    if (!window.SecurityUtils?.validateUsername(input, feedback)) return;

    submitLock.username = true;
    btn.disabled = true;
    setFeedback(feedback, "▸ Verifying identity...", "loading");

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
        setFeedback(feedback, "▸ System ID updated.", "success");
        input.value = "";
        document.dispatchEvent(new CustomEvent("usernameChanged", { detail: { username: raw } }));
      } else if (data.error === "username_taken") {
        setInputState(input, "error");
        setFeedback(feedback, "▸ Identifier already in use.", "error");
      } else {
        setFeedback(feedback, "▸ Kernel rejection. Try again.", "error");
      }
    } catch (err) {
      setFeedback(feedback, "▸ Connection dropped.", "error");
    } finally {
      btn.disabled = false;
      setTimeout(() => { submitLock.username = false; }, 1500);
    }
  }

  /**
   * Processes password update requests.
   */
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
    setFeedback(feedback, "▸ Re-encrypting access keys...", "loading");

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
        setFeedback(feedback, "▸ Uplink secure. Sessions purged.", "success");
        pwInput.value = "";
        pwConfirm.value = "";
        setInputState(pwInput, null);
        setInputState(pwConfirm, null);
        bars.forEach(bar => bar.className = "mx-strength-bar");
      } else {
        setFeedback(feedback, "▸ Encryption failed.", "error");
      }
    } catch (err) {
      setFeedback(feedback, "▸ Network failure.", "error");
    } finally {
      btn.disabled = false;
      setTimeout(() => { submitLock.password = false; }, 1500);
    }
  }

  /**
   * Processes account termination requests.
   */
  async function handleDeleteAccount() {
    if (submitLock.delete) return;

    const feedback = document.getElementById("profileDeleteFeedback");
    const confirmBtn = document.getElementById("profileConfirmDeleteBtn");
    const cancelBtn = document.getElementById("profileCancelDeleteBtn");

    submitLock.delete = true;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    setFeedback(feedback, "▸ Initiating self-destruct...", "loading");

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
        setFeedback(feedback, "▸ Account purged. Connection lost.", "success");
        setTimeout(() => {
          closeModal();
          onAccountDeleted();
        }, 1800);
      } else {
        setFeedback(feedback, "▸ Deletion aborted.", "error");
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        submitLock.delete = false;
      }
    } catch (err) {
      setFeedback(feedback, "▸ Uplink error.", "error");
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      submitLock.delete = false;
    }
  }

  /**
   * Cleanup logic after successful deletion.
   */
  function onAccountDeleted() {
    if (typeof updateAuthButton === "function") {
      updateAuthButton();
    }
    document.dispatchEvent(new CustomEvent("userLoggedOut", { detail: { reason: "account_deleted" } }));
  }

  // ====================================================================================================================================
  //  EXPORTS
  // ====================================================================================================================================

  window.ProfileModal = { open: openModal, close: closeModal };
  window.openProfileModal = openModal;

})();
