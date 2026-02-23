/**
 * admin-modal.js
 *
 * Admin Panel modal for user and session management.
 * Only accessible to users with role === 'admin'.
 */

(function () {
  "use strict";

  /* ── HTML Template ──────────────────────────────────────── */
  const MODAL_HTML = `
    <div id="adminOverlay" class="mx-modal-overlay">
      <div class="mx-modal-container admin-modal-custom">
        <div class="admin-modal-corner-br"></div>

        <div class="mx-modal-header">
          <h2 class="mx-modal-title">
            ADMIN PANEL
            <span class="mx-subtitle">// SYSTEM CONTROL</span>
          </h2>
          <button id="adminCloseBtn" class="mx-modal-close" aria-label="Close Admin Modal">✕</button>
        </div>

        <div class="mx-modal-content">
          <div class="mx-tabs" role="tablist">
            <button class="mx-tab active" data-tab="users" role="tab" aria-selected="true" aria-controls="adminPanelUsers" id="tab-users">USERS</button>
            <button class="mx-tab" data-tab="tokens" role="tab" aria-selected="false" aria-controls="adminPanelTokens" id="tab-tokens">SESSIONS</button>
          </div>

          <div id="adminPanelUsers" class="mx-tab-panel active" data-panel="users" role="tabpanel" aria-labelledby="tab-users">
            <div class="admin-section-header">
              <p class="admin-section-label">▸ Registered Users</p>
              <span id="adminUserCount" class="admin-count"></span>
              <button id="adminRefreshUsers" class="admin-btn-refresh">REFRESH</button>
            </div>
            <div class="admin-table-wrap">
              <div id="adminUsersBody"></div>
            </div>
          </div>

          <div id="adminPanelTokens" class="mx-tab-panel" data-panel="tokens" role="tabpanel" aria-labelledby="tab-tokens">
            <div class="admin-section-header">
              <p class="admin-section-label">▸ Active Sessions</p>
              <span id="adminTokenCount" class="admin-count"></span>
              <button id="adminRefreshTokens" class="admin-btn-refresh">REFRESH</button>
            </div>
            <div class="admin-table-wrap">
              <div id="adminTokensBody"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  let injected = false;
  let currentUserId = null;

  function fmtDate(str) {
    if (!str) return "—";
    const d = new Date(str);
    if (isNaN(d)) return window.SecurityUtils.escapeHtml(str);
    return d.toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function truncate(str, max) {
    if (!str) return "—";
    return str.length > max ? str.slice(0, max) + "…" : str;
  }

  function renderUsers(users) {
    const wrap = document.getElementById("adminUsersBody");
    const count = document.getElementById("adminUserCount");
    const esc = window.SecurityUtils.escapeHtml;
    count.textContent = `(${users.length})`;

    if (users.length === 0) {
      wrap.innerHTML = '<p class="mx-status-msg">No users found.</p>';
      return;
    }

    let html = `<table class="admin-table">
      <thead><tr><th>ID</th><th>USERNAME</th><th>ROLE</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody>`;

    for (const u of users) {
      const isSelf = parseInt(u.id) === currentUserId;
      const roleClass = u.role === "admin" ? "role-admin" : "role-user";
      html += `<tr>
        <td>${esc(String(u.id))}</td>
        <td>${esc(u.username)}</td>
        <td><span class="admin-role-badge ${roleClass}">${esc(u.role)}</span></td>
        <td>${fmtDate(u.created_at)}</td>
        <td>
          <button class="admin-btn-delete" data-action="delete-user" data-id="${u.id}" ${isSelf ? "disabled" : ""}>DELETE</button>
        </td>
      </tr>`;
    }
    html += "</tbody></table>";
    wrap.innerHTML = html;
  }

  function renderTokens(tokens) {
    const wrap = document.getElementById("adminTokensBody");
    const count = document.getElementById("adminTokenCount");
    const esc = window.SecurityUtils.escapeHtml;
    count.textContent = `(${tokens.length})`;

    if (tokens.length === 0) {
      wrap.innerHTML = '<p class="mx-status-msg">No active sessions.</p>';
      return;
    }

    let html = `<table class="admin-table">
      <thead><tr><th>ID</th><th>USER</th><th>DEVICE</th><th>EXPIRES</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody>`;

    for (const t of tokens) {
      html += `<tr>
        <td>${esc(String(t.id))}</td>
        <td>${esc(t.username)}</td>
        <td title="${esc(t.user_agent || "")}">${esc(truncate(t.user_agent, 30))}</td>
        <td>${fmtDate(t.expires_at)}</td>
        <td>${fmtDate(t.created_at)}</td>
        <td><button class="admin-btn-delete" data-action="revoke-token" data-id="${t.id}">REVOKE</button></td>
      </tr>`;
    }
    html += "</tbody></table>";
    wrap.innerHTML = html;
  }

  async function loadData() {
    const usersBody = document.getElementById("adminUsersBody");
    const tokensBody = document.getElementById("adminTokensBody");
    usersBody.innerHTML = '<p class="mx-status-msg loading">▸ Loading users...</p>';
    tokensBody.innerHTML = '<p class="mx-status-msg loading">▸ Loading sessions...</p>';

    try {
      const res = await fetch("/api/admin.php", { credentials: "same-origin" });
      if (res.status === 403) {
        usersBody.innerHTML = '<p class="mx-status-msg error">▸ Access denied.</p>';
        return;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      currentUserId = data.currentUserId || null;
      renderUsers(data.users || []);
      renderTokens(data.tokens || []);
    } catch (err) {
      console.error("Admin panel load error:", err);
      usersBody.innerHTML = '<p class="mx-status-msg error">▸ Failed to load data.</p>';
    }
  }

  async function handleAction(actionType, id) {
    const endpoint = actionType === "delete-user"
        ? `/api/admin.php?action=user&id=${id}`
        : `/api/admin.php?action=token&id=${id}`;

    try {
      const res = await fetch(endpoint, { method: "DELETE", credentials: "same-origin" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (window.showToast) window.showToast(data.error || "Action failed", "error");
        return;
      }
      await loadData();
      if (window.showToast) window.showToast(actionType === "delete-user" ? "User deleted." : "Session revoked.", "success");
    } catch (err) {
      if (window.showToast) window.showToast("Connection error.", "error");
    }
  }

  function injectModal() {
    if (injected) return;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    const overlay = document.getElementById("adminOverlay");
    window.SecurityUtils.ModalManager.setup(overlay, closeModal);
    bindEvents();
    injected = true;
  }

  function openModal() {
    injectModal();
    const overlay = document.getElementById("adminOverlay");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    loadData();
  }

  function closeModal() {
    const overlay = document.getElementById("adminOverlay");
    if (overlay) {
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  function bindEvents() {
    const overlay = document.getElementById("adminOverlay");

    // Tabs
    overlay.addEventListener("click", (e) => {
      const tab = e.target.closest(".mx-tab");
      if (!tab) return;
      const tabName = tab.dataset.tab;
      overlay.querySelectorAll(".mx-tab").forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", isActive);
      });
      overlay.querySelectorAll(".mx-tab-panel").forEach((p) => {
        p.classList.toggle("active", p.dataset.panel === tabName);
      });
    });

    document.getElementById("adminRefreshUsers").addEventListener("click", loadData);
    document.getElementById("adminRefreshTokens").addEventListener("click", loadData);

    overlay.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn || btn.disabled) return;
      handleAction(btn.dataset.action, btn.dataset.id);
    });
  }

  window.AdminModal = { open: openModal, close: closeModal };
  window.openAdminModal = openModal;
})();
