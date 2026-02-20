import { startAllSounds } from "./audio.js";
// ====================================================================================================================================
//  SINGLE PAGE APPLICATION - APP.JS
// ====================================================================================================================================

// ====================================================================================================================================
//  TOAST NOTIFICATION SYSTEM
// ====================================================================================================================================

/**
 * showToast(message, type, duration)
 * @param {string} message  - Text to display
 * @param {'success'|'info'|'error'} type - Visual variant (maps to CSS class)
 * @param {number} duration - Auto-dismiss time in ms (default 3500)
 */
function showToast(message, type = "success", duration = 3500) {
  // Remove any existing toast
  const existing = document.getElementById("app-toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = "app-toast";
  toast.textContent = message;
  toast.classList.add(`toast--${type}`);
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  document.body.appendChild(toast);

  // Trigger enter transition on next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("toast--visible");
    });
  });

  // Trigger exit transition then remove
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, duration);
}

// ====================================================================================================================================
//  AUTH BUTTON
// ====================================================================================================================================

async function updateAuthButton() {
  const res = await fetch("/api/me.php");
  const user = await res.json();

  const btn = document.getElementById("btn_login");
  const adminItem = document.getElementById("adminMenuItem");
  if (!btn) return;

  if (user.role === "guest") {
    btn.textContent = "LOGIN";
    btn.onclick = openLoginModal;
    if (adminItem) adminItem.style.display = "none";
  } else {
    btn.textContent = "LOGOUT";
    btn.onclick = async () => {
      await fetch("/api/logout.php", { method: "POST" });
      updateAuthButton();
      showToast("You are now logged out.", "info");
    };
    if (adminItem) {
      adminItem.style.display = user.role === "admin" ? "" : "none";
    }
  }
}

// ====================================================================================================================================
//  GLOBAL EXPORTS
//  Exposed on window so non-module scripts (register-modal.js, login-modal.js)
//  can call these functions.
// ====================================================================================================================================
window.showToast = showToast;
window.updateAuthButton = updateAuthButton;

// ====================================================================================================================================
//  MAIN
// ====================================================================================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ====================================================================================================================================
  //  DOM CACHE
  // ====================================================================================================================================

  updateAuthButton();

  try {
    const el = document.getElementById("year");
    if (!el) throw new Error("Year element missing");
    el.textContent = new Date().getFullYear().toString();
  } catch (err) {
    console.error("Footer Year Error:", err);
  }

  const navBar = document.getElementById("navigationbar");
  const footerBar = document.getElementById("site-footer");
  const luxBar = document.getElementById("lux-bar");
  const portalOverlay = document.getElementById("portalOverlay");
  const mainContent = document.getElementById("mainContent");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const menuBtn = document.getElementById("btn_menu");
  const dropdownMenu = document.getElementById("dropdown_menu");

  // Restore visible state if user already passed the portal
  if (sessionStorage.getItem("portalEntered") === "true") {
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
  }

  // ====================================================================================================================================
  //  STATE
  // ====================================================================================================================================
  const hasVisited = sessionStorage.getItem("portalEntered") === "true";

  // ====================================================================================================================================
  //  PORTAL MODULE
  // ====================================================================================================================================

  function showMainContent() {
    portalOverlay.style.animation = "portalFadeOut 0.8s ease forwards";
    setTimeout(() => {
      portalOverlay.remove();
      mainContent.classList.add("visible");
    }, 800);
  }

  noBtn?.addEventListener("click", () => {
    yesBtn.disabled = noBtn.disabled = true;
    noBtn.classList.add("shake");
    setTimeout(() => noBtn.classList.replace("shake", "fall"), 500);
    setTimeout(() => (yesBtn.disabled = noBtn.disabled = false), 1000);
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

    startAllSounds();
    setTimeout(showMainContent, totalDuration);
  });

  if (hasVisited) {
    portalOverlay?.remove();
    mainContent.classList.add("visible");
  }

  // ====================================================================================================================================
  //  DROPDOWN MODULE
  // ====================================================================================================================================

  if (menuBtn && dropdownMenu) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.toggle("open");
      menuBtn.classList.toggle("active");
      menuBtn.setAttribute("aria-expanded", isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove("open");
        menuBtn.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });

    dropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const action = e.target.getAttribute("data-action");
        switch (action) {
          case "about":
            openAboutModal();
            break;
          case "gallery":
            openGalleryModal(footerBar);
            break;
          case "profile":
            console.log("Profil clicked");
            break;
          case "admin":
            if (typeof openAdminModal === "function") openAdminModal();
            break;
        }
        dropdownMenu.classList.remove("open");
        menuBtn.classList.remove("active");
      });
    });
  }
});
