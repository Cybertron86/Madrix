/**
 * footer-init.js
 * 
 * Manages the initialization of footer-related functionality.
 * Handles dynamic content (copyright year) and modal trigger bindings.
 */
(function() {
  "use strict";

  // ====================================================================================================================================
  //  FOOTER INITIALIZATION
  // ====================================================================================================================================

  /**
   * Initializes all footer elements.
   * Sets the current year and attaches event listeners to legal and contact modal buttons.
   */
  function initFooter() {
    // 1. Update Copyright Year (Auto-syncs with server-provided current time context)
    const yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear().toString();
    }

    // 2. Initialize Modal Triggers (Defined in respective modal modules)
    if (typeof window.initImpressumTrigger === "function") window.initImpressumTrigger();
    if (typeof window.initPrivacyTrigger === "function") window.initPrivacyTrigger();
    if (typeof window.initContactTrigger === "function") window.initContactTrigger();
  }

  // ====================================================================================================================================
  //  GLOBAL EXPORTS
  // ====================================================================================================================================

  window.initFooter = initFooter;

})();
