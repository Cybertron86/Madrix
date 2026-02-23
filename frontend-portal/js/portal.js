/**
 * portal.js
 * 
 * Handles the initial portal entry overlay, animations, and sound triggers.
 */
(function() {
  "use strict";

  function initPortal() {
    const portalOverlay = document.getElementById("portalOverlay");
    const mainContent = document.getElementById("mainContent");
    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");
    const soundBtn = document.getElementById("soundBtn");
    const navBar = document.getElementById("navigationbar");
    const footerBar = document.getElementById("site-footer");
    const luxBar = document.getElementById("lux-bar");

    // Restore visible state if user already passed the portal
    if (sessionStorage.getItem("portalEntered") === "true") {
      portalOverlay?.remove();
      mainContent?.classList.add("visible");
      
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

    function showMainContent() {
      if (!portalOverlay) return;
      portalOverlay.style.animation = "portalFadeOut 0.8s ease forwards";
      setTimeout(() => {
        portalOverlay.remove();
        mainContent?.classList.add("visible");
      }, 800);
    }

    noBtn?.addEventListener("click", () => {
      yesBtn.disabled = noBtn.disabled = true;
      noBtn.classList.add("shake");
      setTimeout(() => noBtn.classList.replace("shake", "fall"), 500);
      setTimeout(() => {
        yesBtn.disabled = noBtn.disabled = false;
      }, 1000);
    });

    yesBtn?.addEventListener("click", () => {
      sessionStorage.setItem("portalEntered", "true");
      yesBtn.disabled = noBtn.disabled = true;

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

      if (typeof window.startAllSounds === "function") {
        window.startAllSounds();
      }
      setTimeout(showMainContent, totalDuration);
    });
  }

  window.initPortal = initPortal;
})();
