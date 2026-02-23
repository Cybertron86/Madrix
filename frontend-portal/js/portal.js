/**
 * portal.js
 * 
 * Orchestrates the "Terminal Entrance" experience.
 * Handles the interactive overlay, glitch transitions, and sound triggering on enter.
 */
(function() {
  "use strict";

  // ====================================================================================================================================
  //  PORTAL INITIALIZATION
  // ====================================================================================================================================

  /**
   * Initializes the portal entry logic and UI state restoration.
   */
  function initPortal() {
    const portalOverlay = document.getElementById("portalOverlay");
    const mainContent = document.getElementById("mainContent");
    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");
    const soundBtn = document.getElementById("soundBtn");
    const navBar = document.getElementById("navigationbar");
    const footerBar = document.getElementById("site-footer");
    const luxBar = document.getElementById("lux-bar");

    // 1. Session Continuity: Skip portal if user already passed it in this session
    if (sessionStorage.getItem("portalEntered") === "true") {
      portalOverlay?.remove();
      mainContent?.classList.add("visible");
      
      // Force UI element visibility
      if (navBar) {
        navBar.style.visibility = "visible";
        navBar.style.opacity = "1";
        navBar.style.pointerEvents = "auto";
      }
      if (footerBar) {
        footerBar.style.visibility = "visible";
        footerBar.style.opacity = "1";
        footerBar.style.pointerEvents = "auto";
      }
      if (luxBar) {
        luxBar.style.visibility = "visible";
        luxBar.style.opacity = "1";
      }
      if (soundBtn) {
        soundBtn.style.visibility = "visible";
        soundBtn.style.opacity = "1";
      }
      return;
    }

    /**
     * Executes the final fade-out of the overlay to reveal the main content.
     */
    function showMainContent() {
      if (!portalOverlay) return;
      portalOverlay.style.animation = "portalFadeOut 0.8s ease forwards";
      setTimeout(() => {
        portalOverlay.remove();
        mainContent?.classList.add("visible");
      }, 800);
    }

    // 2. Interaction: "NO" Button (Playful refusal animation)
    noBtn?.addEventListener("click", () => {
      yesBtn.disabled = noBtn.disabled = true;
      noBtn.classList.add("shake");
      setTimeout(() => noBtn.classList.replace("shake", "fall"), 500);
      setTimeout(() => {
        yesBtn.disabled = noBtn.disabled = false;
      }, 1000);
    });

    // 3. Interaction: "YES" Button (Entrance sequence)
    yesBtn?.addEventListener("click", () => {
      sessionStorage.setItem("portalEntered", "true");
      yesBtn.disabled = noBtn.disabled = true;

      // Letter-falling glitch effect
      const text = yesBtn.textContent.trim();
      yesBtn.textContent = "";

      [...text].forEach((char, i) => {
        const span = document.createElement("span");
        span.textContent = char;
        span.classList.add("falling-char");
        const rect = yesBtn.getBoundingClientRect();
        span.style.position = "absolute";
        span.style.left = `${rect.left + i * 16}px`;
        span.style.top = `${rect.top}px`;
        span.style.animationDelay = `${i * 0.15}s`;
        document.body.appendChild(span);
      });

      const totalDuration = text.length * 150 + 1200;

      // Gradually show main UI elements
      setTimeout(() => {
        if (navBar) {
          navBar.style.visibility = "visible";
          navBar.style.opacity = "1";
          navBar.style.pointerEvents = "auto";
        }
        if (footerBar) {
          footerBar.style.visibility = "visible";
          footerBar.style.opacity = "1";
          footerBar.style.pointerEvents = "auto";
        }
        if (luxBar) {
          luxBar.style.visibility = "visible";
          luxBar.style.opacity = "1";
        }
        if (soundBtn) {
          soundBtn.style.visibility = "visible";
          soundBtn.style.opacity = "1";
        }
      }, totalDuration + 500);

      // Trigger high-level sound sequence
      if (typeof window.startAllSounds === "function") {
        window.startAllSounds();
      }
      
      // Final reveal
      setTimeout(showMainContent, totalDuration);
    });
  }

  // ====================================================================================================================================
  //  GLOBAL EXPORTS
  // ====================================================================================================================================

  window.initPortal = initPortal;

})();
