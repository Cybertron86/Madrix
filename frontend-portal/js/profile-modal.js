/**
 * profile-modal.js  v2
 *
 * Verbesserungen:
 *  - Passwort-Validierung identisch zu register-modal.js
 *    (min. 12 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen + Stärkeanzeige)
 *  - Profil-Button erscheint/verschwindet live via userLoggedIn / userLoggedOut Events
 *  - XSS-Schutz: alle User-Inputs werden escaped, kein innerHTML mit User-Daten
 *  - Input-Sanitization: Whitelist-Regex, maxlength enforcement
 *  - Debounce auf Submit-Buttons (verhindert mehrfaches Abschicken)
 *  - Content-Security: keine eval(), keine unsicheren DOM-Injektionen
 *
 * Einbinden in index.html:
 *   <link rel="stylesheet" href="css/profile-modal.css" />
 *   <script src="js/profile-modal.js" defer></script>
 */

(function () {
  "use strict";

  /* ── Sicherheit: XSS-Escape ──────────────────────────────── */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  /* ── Input-Sanitization ──────────────────────────────────── */
  const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
  const USERNAME_MAX = 32;
  const PASSWORD_MIN = 12;

  function sanitizeUsername(value) {
    // Trim + auf erlaubte Zeichen begrenzen + maxlength
    return String(value).trim().slice(0, USERNAME_MAX);
  }

  /* ── HTML-Template (statisch – kein User-Input darin) ──── */
  const MODAL_HTML = `
    <div id="profileOverlay" class="profile-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div class="profile-modal">

        <div class="profile-modal-corner-br"></div>

        <!-- Header -->
        <div class="profile-modal-header">
          <h2 class="profile-modal-title" id="profile-title">
            PROFILE
            <span>// SYSTEM ACCESS</span>
          </h2>
          <button id="profileCloseBtn" class="profile-close-btn" aria-label="Close Profile Modal">✕</button>
        </div>

        <!-- Section: Change Username -->
        <div class="profile-section" role="region" aria-labelledby="section-username-title">
          <p class="profile-section-label" id="section-username-title">▸ Change Username</p>
          <div class="profile-input-row">
            <input
              id="profileNewUsername"
              class="profile-input"
              type="text"
              placeholder="NEW USERNAME"
              autocomplete="username"
              maxlength="32"
              spellcheck="false"
              aria-describedby="profileUsernameFeedback"
            />
            <button id="profileSaveUsernameBtn" class="profile-btn" aria-label="Save Username">SAVE</button>
          </div>
          <div id="profileUsernameFeedback" class="profile-feedback" aria-live="polite"></div>
        </div>

        <!-- Section: Change Password -->
        <div class="profile-section" role="region" aria-labelledby="section-password-title">
          <p class="profile-section-label" id="section-password-title">▸ Change Password</p>

          <div class="profile-pw-wrapper">
            <input
              id="profileNewPassword"
              class="profile-input"
              type="password"
              placeholder="NEW PASSWORD"
              autocomplete="new-password"
              maxlength="128"
              aria-describedby="profile-pw-hint profilePasswordFeedback"
            />
            <button type="button" class="profile-pw-toggle" id="profilePwToggle1" aria-label="Show password" aria-pressed="false">👁️</button>
          </div>

          <!-- Stärkeanzeige -->
          <div class="profile-pw-strength" id="profilePwStrength" aria-label="Password strength indicator">
            <div class="profile-pw-strength-bar" data-bar="0"></div>
            <div class="profile-pw-strength-bar" data-bar="1"></div>
            <div class="profile-pw-strength-bar" data-bar="2"></div>
            <div class="profile-pw-strength-bar" data-bar="3"></div>
          </div>

          <p class="profile-pw-hint" id="profile-pw-hint">Min. 12 chars · uppercase · lowercase · number · special character</p>

          <div class="profile-pw-wrapper">
            <input
              id="profileConfirmPassword"
              class="profile-input"
              type="password"
              placeholder="CONFIRM PASSWORD"
              autocomplete="new-password"
              maxlength="128"
              aria-describedby="profilePasswordFeedback"
            />
            <button type="button" class="profile-pw-toggle" id="profilePwToggle2" aria-label="Show confirm password" aria-pressed="false">👁️</button>
          </div>

          <div style="margin-top:0.6rem;">
            <button id="profileSavePasswordBtn" class="profile-btn">SAVE PASSWORD</button>
          </div>
          <div id="profilePasswordFeedback" class="profile-feedback" aria-live="polite"></div>
        </div>

        <!-- Section: Delete Account -->
        <div class="profile-section profile-delete-zone" role="region" aria-labelledby="section-delete-title">
          <p class="profile-section-label" id="section-delete-title">▸ Danger Zone</p>
          <p class="profile-delete-description">
            Permanently remove your account and all associated data from the system.
          </p>
          <button id="profileDeleteBtn" class="profile-btn-delete" aria-haspopup="true">DELETE ACCOUNT</button>

          <!-- Bestätigungs-Panel -->
          <div id="profileConfirmPanel" class="profile-confirm-panel" role="alert" aria-hidden="true">
            <p class="profile-confirm-text">
              <strong>⚠ WARNING</strong>
              Are you really sure you want to delete your account?
              This action cannot be undone!
            </p>
            <div class="profile-confirm-actions">
              <button id="profileConfirmDeleteBtn" class="profile-btn-delete">YES, DELETE PERMANENTLY</button>
              <button id="profileCancelDeleteBtn" class="profile-btn-cancel">CANCEL</button>
            </div>
            <div id="profileDeleteFeedback" class="profile-feedback" aria-live="polite"></div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ── State ───────────────────────────────────────────────── */
  let injected = false;
  let submitLock = {}; // Debounce-Lock pro Aktion

  /* ── Feedback-Helfer ─────────────────────────────────────── */
  function setFeedback(el, message, type) {
    // message ist immer ein fester String – kein User-Input → kein escapeHtml nötig
    el.textContent = message;
    el.className = "profile-feedback " + type;
  }

  function clearFeedback(el) {
    el.textContent = "";
    el.className = "profile-feedback";
  }

  function setInputState(input, state) {
    input.classList.remove("input-error", "input-success");
    if (state === "error") input.classList.add("input-error");
    if (state === "success") input.classList.add("input-success");
  }

  /* ── Passwort-Stärke ─────────────────────────────────────── */
  function updatePasswordStrength(bars, count, strength) {
    bars.forEach((bar) => bar.classList.remove("weak", "medium", "strong"));
    for (let i = 0; i < count; i++) {
      bars[i].classList.add(strength);
    }
  }

  function resetPasswordStrength(bars) {
    bars.forEach((bar) => bar.classList.remove("weak", "medium", "strong"));
  }

  /* ── Passwort-Validierung (gleiche Regeln wie register-modal.js) ── */
  function validateNewPassword(pwInput, bars, feedbackEl) {
    const value = pwInput.value;

    setInputState(pwInput, null);
    clearFeedback(feedbackEl);
    resetPasswordStrength(bars);

    if (value === "") return false;

    if (value.length < PASSWORD_MIN) {
      setInputState(pwInput, "error");
      setFeedback(
        feedbackEl,
        `▸ Password must be at least ${PASSWORD_MIN} characters.`,
        "error",
      );
      updatePasswordStrength(bars, 1, "weak");
      return false;
    }
    if (!/[A-Z]/.test(value)) {
      setInputState(pwInput, "error");
      setFeedback(
        feedbackEl,
        "▸ Password must contain an uppercase letter.",
        "error",
      );
      updatePasswordStrength(bars, 1, "weak");
      return false;
    }
    if (!/[a-z]/.test(value)) {
      setInputState(pwInput, "error");
      setFeedback(
        feedbackEl,
        "▸ Password must contain a lowercase letter.",
        "error",
      );
      updatePasswordStrength(bars, 2, "weak");
      return false;
    }
    if (!/[0-9]/.test(value)) {
      setInputState(pwInput, "error");
      setFeedback(feedbackEl, "▸ Password must contain a number.", "error");
      updatePasswordStrength(bars, 2, "medium");
      return false;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(value)) {
      setInputState(pwInput, "error");
      setFeedback(
        feedbackEl,
        "▸ Password must contain a special character.",
        "error",
      );
      updatePasswordStrength(bars, 3, "medium");
      return false;
    }

    setInputState(pwInput, "success");
    updatePasswordStrength(bars, 4, "strong");
    return true;
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

  /* ── Modal-Lifecycle ─────────────────────────────────────── */
  function injectModal() {
    if (injected) return;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    bindEvents();
    injected = true;
  }

  function openModal() {
    injectModal();
    const overlay = document.getElementById("profileOverlay");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      const firstInput = overlay.querySelector(".profile-input");
      if (firstInput) firstInput.focus();
    }, 350);
  }

  function closeModal() {
    const overlay = document.getElementById("profileOverlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
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

    const bars = document.querySelectorAll(".profile-pw-strength-bar");
    resetPasswordStrength([...bars]);

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

  /* ── Events binden ───────────────────────────────────────── */
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
    const bars = [...document.querySelectorAll(".profile-pw-strength-bar")];
    const feedbackPw = document.getElementById("profilePasswordFeedback");

    // Schließen
    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", handleKeydown);

    // Passwort-Toggles
    pwToggle1.addEventListener("click", () =>
      togglePwVisibility(pwInput, pwToggle1),
    );
    pwToggle2.addEventListener("click", () =>
      togglePwVisibility(pwConfirm, pwToggle2),
    );

    // Live-Validierung Passwort
    pwInput.addEventListener("input", () => {
      validateNewPassword(pwInput, bars, feedbackPw);
      if (pwConfirm.value)
        validatePasswordMatch(pwInput, pwConfirm, feedbackPw);
    });
    pwConfirm.addEventListener("input", () => {
      validatePasswordMatch(pwInput, pwConfirm, feedbackPw);
    });

    // Username speichern
    saveUsernameBtn.addEventListener("click", handleSaveUsername);
    document
      .getElementById("profileNewUsername")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSaveUsername();
      });

    // Passwort speichern
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

  function handleKeydown(e) {
    if (e.key === "Escape") {
      const overlay = document.getElementById("profileOverlay");
      if (overlay && overlay.classList.contains("open")) closeModal();
    }
  }

  function togglePwVisibility(input, btn) {
    const isVisible = input.type === "text";
    input.type = isVisible ? "password" : "text";
    btn.textContent = isVisible ? "👁️" : "🙈";
    btn.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
    btn.setAttribute("aria-pressed", !isVisible);
  }

  /* ── Username speichern ──────────────────────────────────── */
  async function handleSaveUsername() {
    if (submitLock.username) return;

    const input = document.getElementById("profileNewUsername");
    const feedback = document.getElementById("profileUsernameFeedback");
    const btn = document.getElementById("profileSaveUsernameBtn");
    const raw = sanitizeUsername(input.value);

    clearFeedback(feedback);
    setInputState(input, null);

    // Client-side Validierung
    if (!raw) {
      setInputState(input, "error");
      setFeedback(feedback, "▸ Username cannot be empty.", "error");
      return;
    }
    if (raw.length < 3) {
      setInputState(input, "error");
      setFeedback(
        feedback,
        "▸ Username must be at least 3 characters.",
        "error",
      );
      return;
    }
    if (!USERNAME_REGEX.test(raw)) {
      setInputState(input, "error");
      setFeedback(
        feedback,
        "▸ Only letters, numbers, - and _ allowed.",
        "error",
      );
      return;
    }

    // Debounce
    submitLock.username = true;
    btn.disabled = true;
    setFeedback(feedback, "▸ Checking availability...", "loading");

    try {
      const response = await fetch("/api/profile_update.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sanitizerter Wert wird gesendet – kein Raw-HTML
        body: JSON.stringify({ username: raw }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      if (data.success) {
        setInputState(input, "success");
        setFeedback(feedback, "▸ Username updated successfully.", "success");
        input.value = "";
        // Dispatch Event für andere Module
        document.dispatchEvent(
          new CustomEvent("usernameChanged", { detail: { username: raw } }),
        );
      } else if (data.error === "username_taken") {
        setInputState(input, "error");
        setFeedback(
          feedback,
          "▸ Username already taken. Choose another.",
          "error",
        );
      } else {
        setFeedback(
          feedback,
          "▸ An error occurred. Please try again.",
          "error",
        );
      }
    } catch (err) {
      setFeedback(feedback, "▸ Connection error. Please try again.", "error");
    } finally {
      btn.disabled = false;
      // Lock nach kurzer Abklingzeit aufheben
      setTimeout(() => {
        submitLock.username = false;
      }, 1500);
    }
  }

  /* ── Passwort speichern ──────────────────────────────────── */
  async function handleSavePassword() {
    if (submitLock.password) return;

    const pwInput = document.getElementById("profileNewPassword");
    const pwConfirm = document.getElementById("profileConfirmPassword");
    const feedback = document.getElementById("profilePasswordFeedback");
    const btn = document.getElementById("profileSavePasswordBtn");
    const bars = [...document.querySelectorAll(".profile-pw-strength-bar")];

    clearFeedback(feedback);

    // Vollständige Validierung vor dem Request
    const isPwValid = validateNewPassword(pwInput, bars, feedback);
    if (!isPwValid) return;

    const isMatchValid = validatePasswordMatch(pwInput, pwConfirm, feedback);
    if (!isMatchValid) return;

    // Debounce
    submitLock.password = true;
    btn.disabled = true;
    setFeedback(feedback, "▸ Updating password...", "loading");

    try {
      const response = await fetch("/api/profile_update.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Passwort wird als plain string gesendet – kein escapen nötig (JSON.stringify macht das)
        body: JSON.stringify({ password: pwInput.value }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      if (data.success) {
        setFeedback(
          feedback,
          "▸ Password updated. All sessions terminated.",
          "success",
        );
        pwInput.value = "";
        pwConfirm.value = "";
        setInputState(pwInput, null);
        setInputState(pwConfirm, null);
        resetPasswordStrength(bars);
      } else {
        setFeedback(
          feedback,
          "▸ An error occurred. Please try again.",
          "error",
        );
      }
    } catch (err) {
      setFeedback(feedback, "▸ Connection error. Please try again.", "error");
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        submitLock.password = false;
      }, 1500);
    }
  }

  /* ── Account löschen ─────────────────────────────────────── */
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
      const response = await fetch("/api/profile_delete.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      if (data.deleted) {
        setFeedback(feedback, "▸ Account deleted. Goodbye.", "success");
        setTimeout(() => {
          closeModal();
          onAccountDeleted();
        }, 1800);
      } else {
        setFeedback(feedback, "▸ Deletion failed. Please try again.", "error");
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        submitLock.delete = false;
      }
    } catch (err) {
      setFeedback(feedback, "▸ Connection error. Please try again.", "error");
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      submitLock.delete = false;
    }
  }

  /* ── Post-Delete: UI-Reset ohne Reload ───────────────────── */
  function onAccountDeleted() {
    // Login-Button sofort auf "LOGIN" zurücksetzen – identisch zu login-modal.js
    if (typeof updateAuthButton === "function") {
      updateAuthButton();
    } else {
      // Fallback falls updateAuthButton noch nicht geladen ist
      const loginBtn = document.getElementById("btn_login");
      if (loginBtn) {
        loginBtn.textContent = "LOGIN";
        loginBtn.disabled = false;
      }
    }

    // Custom Event für alle anderen Module (z.B. profile-modal syncProfileButton)
    document.dispatchEvent(
      new CustomEvent("userLoggedOut", {
        detail: { reason: "account_deleted" },
      }),
    );
  }

  /* ── Login/Logout-State-Synchronisation ──────────────────── */
  function syncProfileButton(visible) {
    document
      .querySelectorAll('.dropdown-item[data-action="profile"]')
      .forEach((el) => {
        el.style.display = visible ? "" : "none";
      });
  }

  /* ── Dropdown-Item "Profil" triggern ─────────────────────── */
  function initTrigger() {
    // Delegierter Click-Listener (funktioniert für dynamisch gerenderte Elemente)
    document.addEventListener("click", (e) => {
      const item = e.target.closest('.dropdown-item[data-action="profile"]');
      if (item) {
        e.preventDefault();
        openModal();
      }
    });

    // Auf Login-Events reagieren (gefeuert von app.js / login-modal.js)
    document.addEventListener("userLoggedIn", () => {
      syncProfileButton(true);
    });

    // Auf Logout-Events reagieren
    document.addEventListener("userLoggedOut", () => {
      syncProfileButton(false);
      // Falls Modal offen ist: schließen
      const overlay = document.getElementById("profileOverlay");
      if (overlay && overlay.classList.contains("open")) closeModal();
    });

    // Initial-State: Profilbutton nur zeigen wenn Session aktiv
    // Prüfe ob btn_login "LOGOUT" anzeigt als Heuristik
    // (sauberer: ein data-Attribut oder eine session-Variable vom Server)
    const loginBtn = document.getElementById("btn_login");
    if (loginBtn) {
      const isLoggedIn = loginBtn.textContent.trim().toUpperCase() === "LOGOUT";
      syncProfileButton(isLoggedIn);

      // MutationObserver auf den Login-Button-Text für zuverlässige Synchronisation
      const observer = new MutationObserver(() => {
        const loggedIn = loginBtn.textContent.trim().toUpperCase() === "LOGOUT";
        syncProfileButton(loggedIn);
      });
      observer.observe(loginBtn, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  /* ── Öffentliche API ─────────────────────────────────────── */
  window.ProfileModal = {
    open: openModal,
    close: closeModal,
  };

  /* ── Init ────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrigger);
  } else {
    initTrigger();
  }
})();
