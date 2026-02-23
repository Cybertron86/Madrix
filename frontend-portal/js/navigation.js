/**
 * navigation.js
 * 
 * Handles the main dropdown navigation menu and its actions.
 */
(function() {
  "use strict";

  function initNavigation() {
    const menuBtn = document.getElementById("btn_menu");
    const dropdownMenu = document.getElementById("dropdown_menu");

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
              if (typeof window.openAboutModal === "function") window.openAboutModal();
              break;
            case "gallery":
              if (typeof window.openGalleryModal === "function") window.openGalleryModal();
              break;
            case "profile":
              if (typeof window.openProfileModal === "function") window.openProfileModal();
              break;
            case "admin":
              if (typeof window.openAdminModal === "function") window.openAdminModal();
              break;
          }
          
          dropdownMenu.classList.remove("open");
          menuBtn.classList.remove("active");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  window.initNavigation = initNavigation;
})();
