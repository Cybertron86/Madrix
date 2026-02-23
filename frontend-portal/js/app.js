/**
 * app.js
 * 
 * Main orchestration layer for the frontend application.
 * Coordinates initialization of background effects, navigation, sound, and auth state sync.
 */
(function() {
  "use strict";

  // ====================================================================================================================================
  //  APPLICATION INITIALIZATION
  // ====================================================================================================================================

  /**
   * Main entry point triggered on DOM Content Loaded.
   * Ensures all modular components are initialized in the correct order.
   */
  document.addEventListener("DOMContentLoaded", async () => {
    // 1. Core Component Initializations (Defined in separate modules)
    if (typeof window.initPortal === "function") window.initPortal();
    if (typeof window.initNavigation === "function") window.initNavigation();
    if (typeof window.initAudio === "function") window.initAudio();
    if (typeof window.initMatrixRain === "function") window.initMatrixRain();
    if (typeof window.initLuxBar === "function") window.initLuxBar();
    if (typeof window.initHologramCarousel === "function") window.initHologramCarousel();
    
    // 2. Footer Initialization (Shared logic for dynamic year and Modal triggers)
    if (typeof window.initFooter === "function") window.initFooter();

    // 3. Global Auth State Sync (Updates buttons and visibility based on session)
    if (typeof window.updateAuthButton === "function") {
      await window.updateAuthButton();
    }
  });
})();
