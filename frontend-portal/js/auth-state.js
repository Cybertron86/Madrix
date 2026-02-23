/**
 * auth-state.js
 * 
 * Handles the authentication state of the application and updates the UI accordingly.
 */
(function() {
  "use strict";

  /**
   * Fetches the current user state and updates the login/logout button
   * and visibility of restricted menu items.
   */
  async function updateAuthButton() {
    try {
      const res = await fetch("/api/me.php");
      if (!res.ok) throw new Error("Failed to fetch user state");
      
      const user = await res.json();

      const btn = document.getElementById("btn_login");
      const adminItem = document.getElementById("adminMenuItem");
      // Find ALL profile menu items (sometimes there are multiple in responsive views)
      const profileItems = document.querySelectorAll('.dropdown-item[data-action="profile"], .nav-profile');
      
      if (!btn) return;

      if (user.role === "guest") {
        btn.textContent = "LOGIN";
        btn.onclick = window.openLoginModal;
        if (adminItem) adminItem.style.display = "none";
        profileItems.forEach(el => el.style.display = "none");
      } else {
        btn.textContent = "LOGOUT";
        btn.onclick = async () => {
          await fetch("/api/logout.php", { method: "POST" });
          updateAuthButton();
          if (window.SecurityUtils && window.SecurityUtils.showToast) {
            window.SecurityUtils.showToast("You are now logged out.", "info");
          }
        };
        if (adminItem) {
          adminItem.style.display = user.role === "admin" ? "" : "none";
        }
        profileItems.forEach(el => el.style.display = "");
      }
    } catch (err) {
      console.error("Auth state update failed:", err);
    }
  }

  // Export to global scope
  window.updateAuthButton = updateAuthButton;

})();
