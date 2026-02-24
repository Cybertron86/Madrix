/**
 * Legal Notice (Impressum) modal.
 * Lazy-initialised on first open; exposes initImpressumTrigger globally
 * so it can be called after the DOM is ready.
 */
import { ModalManager } from "./security-utils.js";

let impressumModal = null;

const MODAL_HTML = `
    <div id="impressumOverlay" class="mx-modal-overlay">
      <div class="mx-modal-container footer-modal-custom">
        <button class="mx-modal-close" id="impressumCloseBtn" aria-label="Close Legal Notice">×</button>
        <h2 class="mx-modal-title">LEGAL NOTICE</h2>
        <div class="mx-modal-content">
          <h3 class="footer-modal-h3">Information according to § 5 TMG</h3>
          <p>
            <strong>Benjamin Tron</strong><br>
            Cybertron Systems<br>
            Rheinstraße 102<br>
            76185 Karlsruhe<br>
          `;

// Inject HTML once and wire up close/keyboard/overlay-click via ModalManager
function createImpressumModal() {
  if (impressumModal) return;
  document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
  impressumModal = document.getElementById("impressumOverlay");
  ModalManager.setup(impressumModal, closeImpressumModal);
}

function openImpressumModal(e) {
  if (e) e.preventDefault();
  createImpressumModal();
  impressumModal.classList.add("active");
  document.body.style.overflow = "hidden"; // prevent background scroll
}

function closeImpressumModal() {
  if (!impressumModal) return;
  impressumModal.classList.remove("active");
  document.body.style.overflow = "";
}

// Export the modal opener and trigger initializer
export { openImpressumModal };

export function initImpressumTrigger() {
  const impressumBtn = document.getElementById("footer-btn-impressum");
  if (impressumBtn) impressumBtn.addEventListener("click", openImpressumModal);
}
