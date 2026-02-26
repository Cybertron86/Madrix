/**
 * privacy-modal.js
 *
 * Lazy-initialised on first open; exposes openPrivacyModal globally
 * so other modules (e.g. cookie banner) can trigger it directly.
 */
import { ModalManager } from "./security-utils.js";

let privacyModal = null;

const MODAL_HTML = `
    <div id="privacyOverlay" class="mx-modal-overlay">
      <div class="mx-modal-container footer-modal-custom">
        <button class="mx-modal-close" id="privacyCloseBtn" aria-label="Close Privacy Policy">×</button>
        <h2 class="mx-modal-title">PRIVACY POLICY</h2>
        <div class="mx-modal-content">
            <h3 class="footer-modal-h3">General Information</h3>
            <p>The following notes provide a simple overview of what happens to your personal data when you visit this website. Personal data is all data with which you can be personally identified.</p>
            
            <h3 class="footer-modal-h3">Data Collection on this Website</h3>
            <p><strong>Who is responsible for data collection on this website?</strong></p>
            <p>The data processing on this website is carried out by the website operator. You can find their contact details in the Legal Notice of this website.</p>
            <h3 class="footer-modal-h3">How do we collect your data?</h3>
            <p>On the one hand, your data is collected when you communicate it to us. This may, for example, be data that you enter in a contact form.</p>
            <p>Other data is collected automatically or with your consent by our IT systems when you visit the website. This is primarily technical data (e.g., internet browser, operating system, or time of the page view). This data is collected automatically as soon as you enter this website.</p>
            <h3 class="footer-modal-h3">Your Rights</h3>
            <p>You have the right to receive information about the origin, recipient, and purpose of your stored personal data free of charge at any time. You also have the right to request the correction or deletion of this data. If you have given your consent to data processing, you can revoke this consent at any time for the future.</p>
            
            <h3 class="footer-modal-h3">Hosting</h3>
            <p>This project is hosted internally purely for demonstration purposes.</p>
        </div>
      </div>
    </div>
  `;

// Inject HTML once and wire up close/keyboard/overlay-click via ModalManager
function createPrivacyModal() {
  if (privacyModal) return;
  document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
  privacyModal = document.getElementById("privacyOverlay");
  ModalManager.setup(privacyModal, closePrivacyModal);
}

function openPrivacyModal(e) {
  if (e) e.preventDefault();
  createPrivacyModal();
  privacyModal.classList.add("active");
  document.body.style.overflow = "hidden"; // prevent background scroll
}

function closePrivacyModal() {
  if (!privacyModal) return;
  privacyModal.classList.remove("active");
  document.body.style.overflow = "";
}

// Expose open so other modules (e.g. cookie banner) can trigger it
// Export the modal opener and trigger initializer
export { openPrivacyModal };

export async function initPrivacyTrigger() {
  const privacyBtn = document.getElementById("footer-btn-privacy");
  if (privacyBtn) privacyBtn.addEventListener("click", openPrivacyModal);
}
