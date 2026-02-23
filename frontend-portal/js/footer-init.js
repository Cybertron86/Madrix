/**
 * footer-init.js
 * 
 * Handles initialization of footer elements (dynamic year, modal triggers).
 */
(function() {
  "use strict";

  function initFooter() {
    // 1. Update Copyright Year
    const yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }

    // 2. Initialize Modal Triggers
    if (typeof window.initImpressumTrigger === "function") window.initImpressumTrigger();
    if (typeof window.initPrivacyTrigger === "function") window.initPrivacyTrigger();
    if (typeof window.initContactTrigger === "function") window.initContactTrigger();
  }

  // Export to global scope
  window.initFooter = initFooter;

})();
