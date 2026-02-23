/**
 * app.js
 * 
 * Main entry point. Handles core state and global initializations.
 */
(function() {
  "use strict";

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
    
    // 2. Footer Initialization (Dynamic year and Modal triggers)
    if (typeof window.initFooter === "function") window.initFooter();

    // 3. Auth State Sync
    if (typeof window.updateAuthButton === "function") {
      await window.updateAuthButton();
    }
  });
})();
