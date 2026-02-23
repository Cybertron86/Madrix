/**
 * auth-state.js
 * 
 * Handles client-side authentication state synchronization.
 * Updates navigation elements and restricted menu items based on session data.
 */
(function() {
  "use strict";

  // ====================================================================================================================================
  //  AUTHENTICATION STATE MANAGEMENT
  // ====================================================================================================================================

  /**
   * Syncs the UI with the current session state.
   * Fetches user data, updates the login/logout button, and toggles restricted menu items (Admin/Profile).
   * 
   * @async
   * @returns {Promise<void>}
   */
  async function updateAuthButton() {
    try {
      // 1. Fetch current user session data
      const res = await fetch("/api/me.php");
      if (!res.ok) throw new Error("Failed to fetch user session data");
      
      const user = await res.json();

      const btn = document.getElementById("btn_login");
      const adminItem = document.getElementById("adminMenuItem");
      
      // Locate profile items for multiple responsive viewports
      const profileItems = document.querySelectorAll('.dropdown-item[data-action="profile"], .nav-profile');
      
      if (!btn) return;

      // 2. Handle GUEST state
      if (user.role === "guest") {
        btn.textContent = "LOGIN";
        btn.onclick = window.openLoginModal;
        if (adminItem) adminItem.style.display = "none";
        profileItems.forEach(el => el.style.display = "none");
      } 
      // 3. Handle AUTHENTICATED state (User/Admin)
      else {
        btn.textContent = "LOGOUT";
        btn.onclick = async () => {
          await fetch("/api/logout.php", { method: "POST" });
          updateAuthButton();
          if (window.SecurityUtils && window.SecurityUtils.showToast) {
            window.SecurityUtils.showToast("You are now logged out.", "info");
          }
        };

        // Show Admin menu only for admin role
        if (adminItem) {
          adminItem.style.display = user.role === "admin" ? "" : "none";
        }
        
        // Show Profile items for all authenticated users
        profileItems.forEach(el => el.style.display = "");
      }
    } catch (err) {
      console.error("Auth sync error:", err);
    }
  }

  // ====================================================================================================================================
  //  GLOBAL EXPORTS
  // ====================================================================================================================================

  window.updateAuthButton = updateAuthButton;

})();
