/**
 * navigation.js
 * 
 * Manages the main site navigation and dropdown menu behavior.
 * Handles toggle animations, accessibility attributes, and menu action routing.
 */
(function() {
  "use strict";

  // ====================================================================================================================================
  //  NAVIGATION INITIALIZATION
  // ====================================================================================================================================

  /**
   * Initializes the primary navigation menu.
   * Sets up click listeners for the menu toggle and dropdown items.
   */
  function initNavigation() {
    const menuBtn = document.getElementById("btn_menu");
    const dropdownMenu = document.getElementById("dropdown_menu");

    if (menuBtn && dropdownMenu) {
      // 1. Toggle Menu Visibility
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.toggle("open");
        menuBtn.classList.toggle("active");
        
        // Accessibility: Update ARIA expanded state
        menuBtn.setAttribute("aria-expanded", isOpen);
      });

      // 2. Click Outside to Close
      document.addEventListener("click", (e) => {
        if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.classList.remove("open");
          menuBtn.classList.remove("active");
          menuBtn.setAttribute("aria-expanded", "false");
        }
      });

      // 3. Handle Menu Item Actions
      dropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          const action = e.target.getAttribute("data-action");
          
          // Route action to respective modal module
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
          
          // Auto-close menu after selection
          dropdownMenu.classList.remove("open");
          menuBtn.classList.remove("active");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  // ====================================================================================================================================
  //  GLOBAL EXPORTS
  // ====================================================================================================================================

  window.initNavigation = initNavigation;

})();
