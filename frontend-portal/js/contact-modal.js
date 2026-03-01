/**
 * Contact modal.
 * Lazy-initialised on first open; exposes initContactTrigger globally
 * so it can be called after the DOM is ready.
 */
import { ModalManager, showToast } from "./security-utils.js";

("use strict");

let contactModal = null;

const MODAL_HTML = `
    <div id="contactOverlay" class="mx-modal-overlay">
      <div class="mx-modal-container contact-modal-custom">
        <button class="mx-modal-close" id="contactCloseBtn" aria-label="Close Contact Modal">×</button>
        <h2 class="mx-modal-title">CONTACT</h2>
        <div class="mx-modal-content">
          <p>Interested in collaboration or just want to connect? I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions.</p>
          
          <h3 class="footer-modal-h3">Get in Touch</h3>
          <p>
            <strong>Email:</strong> <a href="mailto:contact@cybertron.sys" class="footer-link">contact@cybertron.sys</a><br>
            <strong>GitHub:</strong> <a href="https://github.com/cybertron86" target="_blank" class="footer-link">github.com/cybertron86</a><br>
          </p>
          <h3 class="footer-modal-h3">Location</h3>
          <p>Karlsruhe, Germany / Remote</p>
          
          <form id="contact-form" class="footer-contact-form" aria-label="Contact Form">
            <input type="text" class="mx-input" placeholder="NAME / ALIAS" required aria-label="Your Name or Alias">
            <input type="email" class="mx-input" placeholder="EMAIL ADDRESS" required aria-label="Your Email Address">
            <textarea class="mx-input" placeholder="YOUR MESSAGE" rows="5" required aria-label="Your Message"></textarea>
            <button type="button" class="mx-btn" id="contact-submit-btn">INITIATE TRANSMISSION</button>
          </form>
        </div>
      </div>
    </div>
  `;

// Inject HTML once and wire up close/keyboard/overlay-click via ModalManager
function createContactModal() {
  if (contactModal) return;
  document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
  contactModal = document.getElementById("contactOverlay");
  ModalManager.setup(contactModal, closeContactModal);

  // Form submission is simulated — no real API call yet
  const submitBtn = contactModal.querySelector("#contact-submit-btn");
  submitBtn.addEventListener("click", () => {
    if (typeof showToast === "function")
      showToast("Message transmission simulated. End of line.", "success");
    else alert("Message transmission simulated. End of line.");
    closeContactModal();
  });
}

function openContactModal(e) {
  if (e) e.preventDefault();
  createContactModal();
  contactModal.classList.add("active");
  document.body.style.overflow = "hidden"; // prevent background scroll
}

function closeContactModal() {
  if (!contactModal) return;
  contactModal.classList.remove("active");
  document.body.style.overflow = "";
}



// ====================================================================================================================================
//  EXPORTS
// ====================================================================================================================================

// Bind the footer link; called after DOM is ready
export async function initContactTrigger() {
  const contactBtn = document.getElementById("footer-btn-contact");
  if (contactBtn) contactBtn.addEventListener("click", openContactModal);
}

export { openContactModal };