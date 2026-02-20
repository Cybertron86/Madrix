/**
 * admin-modal.js
 *
 * Admin Panel modal for user and session management.
 * Only accessible to users with role === 'admin'.
 * Follows the same patterns as profile-modal.js.
 */

(function () {
  "use strict";

  /* ── HTML Template ──────────────────────────────────────── */
  const MODAL_HTML = `
    <div id="adminOverlay" class="admin-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <div class="admin-modal">

        <div class="admin-modal-corner-br"></div>

        <!-- Header -->
        <div class="admin-modal-header">
          <h2 class="admin-modal-title" id="admin-title">
            ADMIN PANEL
            <span>// SYSTEM CONTROL</span>
          </h2>
          <button id="adminCloseBtn" class="admin-close-btn" aria-label="Close Admin Modal">✕</button>
        </div>

        <!-- Tabs -->
        <div class="admin-tabs" role="tablist">
          <button class="admin-tab active" data-tab="users" role="tab" aria-selected="true" aria-controls="adminPanelUsers" id="tab-users">USERS</button>
          <button class="admin-tab" data-tab="tokens" role="tab" aria-selected="false" aria-controls="adminPanelTokens" id="tab-tokens">SESSIONS</button>
        </div>

        <!-- Users Panel -->
        <div id="adminPanelUsers" class="admin-tab-panel active" data-panel="users" role="tabpanel" aria-labelledby="tab-users">
          <div class="admin-section-header">
            <p class="admin-section-label">▸ Registered Users</p>
            <span id="adminUserCount" class="admin-count"></span>
            <button id="adminRefreshUsers" class="admin-btn-refresh" aria-label="Refresh Users List">REFRESH</button>
          </div>
          <div class="admin-table-wrap">
            <div id="adminUsersBody"></div>
          </div>
        </div>

        <!-- Tokens Panel -->
        <div id="adminPanelTokens" class="admin-tab-panel" data-panel="tokens" role="tabpanel" aria-labelledby="tab-tokens">
          <div class="admin-section-header">
            <p class="admin-section-label">▸ Active Sessions</p>
            <span id="adminTokenCount" class="admin-count"></span>
            <button id="adminRefreshTokens" class="admin-btn-refresh" aria-label="Refresh Sessions List">REFRESH</button>
          </div>
          <div class="admin-table-wrap">
            <div id="adminTokensBody"></div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ── State ───────────────────────────────────────────────── */
  let injected = false;

  /* ── XSS Safety ─────────────────────────────────────────── */
  function esc(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  /* ── Date Formatter ─────────────────────────────────────── */
  function fmtDate(str) {
    if (!str) return "—";
    const d = new Date(str);
    if (isNaN(d)) return esc(str);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* ── Truncate long strings ──────────────────────────────── */
  function truncate(str, max) {
    if (!str) return "—";
    return str.length > max ? str.slice(0, max) + "…" : str;
  }

  /* ── Render Users Table ─────────────────────────────────── */
  function renderUsers(users) {
    const wrap = document.getElementById("adminUsersBody");
    const count = document.getElementById("adminUserCount");
    count.textContent = `(${users.length})`;

    if (users.length === 0) {
      wrap.innerHTML = '<p class="admin-status-msg">No users found.</p>';
      return;
    }

    let html = `<table class="admin-table">
      <thead><tr>
        <th>ID</th>
        <th>USERNAME</th>
        <th>ROLE</th>
        <th>CREATED</th>
        <th>ACTION</th>
      </tr></thead><tbody>`;

    for (const u of users) {
      const roleClass = u.role === "admin" ? "role-admin" : "role-user";
      html += `<tr>
        <td>${esc(String(u.id))}</td>
        <td>${esc(u.username)}</td>
        <td><span class="admin-role-badge ${roleClass}">${esc(u.role)}</span></td>
        <td>${fmtDate(u.created_at)}</td>
        <td>
          <button class="admin-btn-delete" data-action="delete-user" data-id="${u.id}"
            ${u.role === "admin" ? "disabled title='Cannot delete admin'" : ""}>
            DELETE
          </button>
        </td>
      </tr>`;
    }

    html += "</tbody></table>";
    wrap.innerHTML = html;
  }

  /* ── Render Tokens Table ────────────────────────────────── */
  function renderTokens(tokens) {
    const wrap = document.getElementById("adminTokensBody");
    const count = document.getElementById("adminTokenCount");
    count.textContent = `(${tokens.length})`;

    if (tokens.length === 0) {
      wrap.innerHTML = '<p class="admin-status-msg">No active sessions.</p>';
      return;
    }

    let html = `<table class="admin-table">
      <thead><tr>
        <th>ID</th>
        <th>USER</th>
        <th>DEVICE</th>
        <th>EXPIRES</th>
        <th>CREATED</th>
        <th>ACTION</th>
      </tr></thead><tbody>`;

    for (const t of tokens) {
      html += `<tr>
        <td>${esc(String(t.id))}</td>
        <td>${esc(t.username)}</td>
        <td title="${esc(t.user_agent || "")}">${esc(truncate(t.user_agent, 30))}</td>
        <td>${fmtDate(t.expires_at)}</td>
        <td>${fmtDate(t.created_at)}</td>
        <td>
          <button class="admin-btn-delete" data-action="revoke-token" data-id="${t.id}">
            REVOKE
          </button>
        </td>
      </tr>`;
    }

    html += "</tbody></table>";
    wrap.innerHTML = html;
  }

  /* ── Fetch Data ─────────────────────────────────────────── */
  async function loadData() {
    const usersBody = document.getElementById("adminUsersBody");
    const tokensBody = document.getElementById("adminTokensBody");

    usersBody.innerHTML =
      '<p class="admin-status-msg loading">▸ Loading users...</p>';
    tokensBody.innerHTML =
      '<p class="admin-status-msg loading">▸ Loading sessions...</p>';

    try {
      const res = await fetch("/api/admin.php", {
        credentials: "same-origin",
      });

      if (res.status === 403) {
        usersBody.innerHTML =
          '<p class="admin-status-msg error">▸ Access denied.</p>';
        tokensBody.innerHTML =
          '<p class="admin-status-msg error">▸ Access denied.</p>';
        return;
      }

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      renderUsers(data.users || []);
      renderTokens(data.tokens || []);
    } catch (err) {
      console.error("Admin panel load error:", err);
      usersBody.innerHTML =
        '<p class="admin-status-msg error">▸ Failed to load data.</p>';
      tokensBody.innerHTML =
        '<p class="admin-status-msg error">▸ Failed to load data.</p>';
    }
  }

  /* ── Delete / Revoke Actions ────────────────────────────── */
  async function handleAction(actionType, id) {
    const endpoint =
      actionType === "delete-user"
        ? `/api/admin.php?action=user&id=${id}`
        : `/api/admin.php?action=token&id=${id}`;

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || "Action failed";
        if (typeof showToast === "function") {
          showToast(msg, "error");
        }
        return;
      }

      // Reload the data
      await loadData();

      if (typeof showToast === "function") {
        const msg =
          actionType === "delete-user" ? "User deleted." : "Session revoked.";
        showToast(msg, "success");
      }
    } catch (err) {
      console.error("Admin action error:", err);
      if (typeof showToast === "function") {
        showToast("Connection error.", "error");
      }
    }
  }

  /* ── Modal Lifecycle ────────────────────────────────────── */
  function injectModal() {
    if (injected) return;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    bindEvents();
    injected = true;
  }

  function openModal() {
    injectModal();
    const overlay = document.getElementById("adminOverlay");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    loadData();
  }

  function closeModal() {
    const overlay = document.getElementById("adminOverlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ── Event Binding ──────────────────────────────────────── */
  function bindEvents() {
    const overlay = document.getElementById("adminOverlay");
    const closeBtn = document.getElementById("adminCloseBtn");

    // Close
    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const ov = document.getElementById("adminOverlay");
        if (ov && ov.classList.contains("open")) closeModal();
      }
    });

    // Tabs
    overlay.addEventListener("click", (e) => {
      const tab = e.target.closest(".admin-tab");
      if (!tab) return;

      const tabName = tab.dataset.tab;

      overlay
        .querySelectorAll(".admin-tab")
        .forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle("active", isActive);
          t.setAttribute("aria-selected", isActive);
        });

      overlay.querySelectorAll(".admin-tab-panel").forEach((p) => {
        p.classList.toggle("active", p.dataset.panel === tabName);
      });
    });

    // Refresh buttons
    document
      .getElementById("adminRefreshUsers")
      .addEventListener("click", loadData);
    document
      .getElementById("adminRefreshTokens")
      .addEventListener("click", loadData);

    // Delegated action clicks (delete user / revoke token)
    overlay.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn || btn.disabled) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "delete-user" || action === "revoke-token") {
        btn.disabled = true;
        handleAction(action, id);
      }
    });
  }

  /* ── Dropdown Trigger ───────────────────────────────────── */
  function initTrigger() {
    document.addEventListener("click", (e) => {
      const item = e.target.closest('.dropdown-item[data-action="admin"]');
      if (item) {
        e.preventDefault();
        openModal();
      }
    });
  }

  /* ── Public API ─────────────────────────────────────────── */
  window.AdminModal = {
    open: openModal,
    close: closeModal,
  };

  window.openAdminModal = openModal;

  /* ── Init ───────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrigger);
  } else {
    initTrigger();
  }
})();
