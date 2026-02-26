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
            Germany
          </p>

          <h3 class="footer-modal-h3">Contact</h3>
          <p>
            Phone: +49 1575 2605349<br>
            Email: <a href="mailto:contact@cybertron.sys" class="footer-link">contact@cybertron.sys</a>
          </p>

          <h3 class="footer-modal-h3">Responsible for content according to § 55 Abs. 2 RStV</h3>
          <p>
            Benjamin Tron<br>
            Rheinstraße 102<br>
            76185 Karlsruhe
          </p>
          
          <p><em>This is a private portfolio project.</em></p>
        </div>
      </div>
    </div>
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

export async function initImpressumTrigger() {
  const impressumBtn = document.getElementById("footer-btn-impressum");
  if (impressumBtn) impressumBtn.addEventListener("click", openImpressumModal);
}
