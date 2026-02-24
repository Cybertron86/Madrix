/**
 * app.js
 *
 * Main orchestration layer for the frontend application.
 * Coordinates initialization of background effects, navigation, sound, and auth state sync.
 */

import { initPortal } from "./portal.js";
import { initNavigation } from "./navigation.js";
import { initAudio } from "./audio.js";
import { initMatrixRain } from "./matrix-rain-background.js";
import { initLuxBar } from "./lux-bar.js";
import { initHologramCarousel } from "./hologram-carousel.js";
import { initFooter } from "./footer-init.js";
import { updateAuthButton } from "./auth-state.js";
import UltimateMatrixEye from "./matrix-eye-ultimate.js"; // Import default class for direct instantiation

(function () {
  "use strict";

  // ====================================================================================================================================
  //  APPLICATION INITIALIZATION
  // ====================================================================================================================================

  /**
   * Main entry point triggered on DOM Content Loaded.
   * Ensures all modular components are initialized in the correct order.
   */
  document.addEventListener("DOMContentLoaded", async () => {
    let matrixEyeInstance;
    try {
      const carouselWrapper = document.querySelector(".holo-carousel-wrapper");
      const mountTarget = carouselWrapper || document.body;
      matrixEyeInstance = new UltimateMatrixEye(mountTarget);
      console.log("Matrix Eye Ultimate initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Matrix Eye Ultimate:", error);
    }
    initPortal();
    initNavigation();
    initAudio();
    initMatrixRain();
    initLuxBar();
    initHologramCarousel();
    initFooter();

    await updateAuthButton();
    console.log("All modules initialized");
  });
})();
