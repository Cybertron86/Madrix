/**
 * app.js
 * 
 * Main entry point. Handles core state and global initializations.
 */
(function() {
  "use strict";

  // ====================================================================================================================================
  //  AUTH STATE
  // ====================================================================================================================================

  async function updateAuthButton() {
    const res = await fetch("/api/me.php");
    const user = await res.json();

    const btn = document.getElementById("btn_login");
    const adminItem = document.getElementById("adminMenuItem");
    // Find ALL profile menu items (sometimes there are multiple in responsive views)
    const profileItems = document.querySelectorAll('.dropdown-item[data-action="profile"], .nav-profile');
    
    if (!btn) return;

    if (user.role === "guest") {
      btn.textContent = "LOGIN";
      btn.onclick = window.openLoginModal;
      if (adminItem) adminItem.style.display = "none";
      profileItems.forEach(el => el.style.display = "none");
    } else {
      btn.textContent = "LOGOUT";
      btn.onclick = async () => {
        await fetch("/api/logout.php", { method: "POST" });
        updateAuthButton();
        if (window.SecurityUtils && window.SecurityUtils.showToast) {
          window.SecurityUtils.showToast("You are now logged out.", "info");
        }
      };
      if (adminItem) {
        adminItem.style.display = user.role === "admin" ? "" : "none";
      }
      profileItems.forEach(el => el.style.display = "");
    }
  }

  // ====================================================================================================================================
  //  GLOBAL EXPORTS
  // ====================================================================================================================================
  window.updateAuthButton = updateAuthButton;

  // ====================================================================================================================================
  //  MAIN INIT
  // ====================================================================================================================================

  document.addEventListener("DOMContentLoaded", async () => {
    // 1. Core Component Initializations
    if (typeof window.initPortal === "function") window.initPortal();
    if (typeof window.initNavigation === "function") window.initNavigation();
    if (typeof window.initAudio === "function") window.initAudio();
    if (typeof window.initMatrixRain === "function") window.initMatrixRain();
    if (typeof window.initLuxBar === "function") window.initLuxBar();
    if (typeof window.initHologramCarousel === "function") window.initHologramCarousel();
    
    // 2. Footer Triggers (Modals)
    if (typeof window.initImpressumTrigger === "function") window.initImpressumTrigger();
    if (typeof window.initPrivacyTrigger === "function") window.initPrivacyTrigger();
    if (typeof window.initContactTrigger === "function") window.initContactTrigger();

    // 3. Auth State Sync
    await updateAuthButton();

    // 4. Footer Year
    const yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }
  });
})();
