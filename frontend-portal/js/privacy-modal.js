// ====================================================================================================================================
//  PRIVACY MODAL MODULE
// ====================================================================================================================================

let privacyModal = null;

function createPrivacyModal() {
  if (privacyModal) return;

  privacyModal = document.createElement("div");
  privacyModal.className = "footer-modal";
  privacyModal.id = "modal-privacy";
  privacyModal.setAttribute("role", "dialog");
  privacyModal.setAttribute("aria-modal", "true");
  privacyModal.setAttribute("aria-labelledby", "privacy-title");
  privacyModal.innerHTML = `
      <div class="footer-modal-container">
        <button class="footer-modal-close" aria-label="Close Privacy Policy">×</button>
        <h2 class="footer-modal-title" id="privacy-title">Privacy Policy</h2>
        <div class="footer-modal-content">
            <h3>General Information</h3>
            <p>The following notes provide a simple overview of what happens to your personal data when you visit this website. Personal data is all data with which you can be personally identified.</p>
            
            <h3>Data Collection on this Website</h3>
            <p><strong>Who is responsible for data collection on this website?</strong></p>
            <p>The data processing on this website is carried out by the website operator. You can find their contact details in the Legal Notice of this website.</p>

            <h3>How do we collect your data?</h3>
            <p>On the one hand, your data is collected when you communicate it to us. This may, for example, be data that you enter in a contact form.</p>
            <p>Other data is collected automatically or with your consent by our IT systems when you visit the website. This is primarily technical data (e.g., internet browser, operating system, or time of the page view). This data is collected automatically as soon as you enter this website.</p>

            <h3>Your Rights</h3>
            <p>You have the right to receive information about the origin, recipient, and purpose of your stored personal data free of charge at any time. You also have the right to request the correction or deletion of this data. If you have given your consent to data processing, you can revoke this consent at any time for the future.</p>
            
            <h3>Hosting</h3>
            <p>This project is hosted internally purely for demonstration purposes.</p>
        </div>
      </div>
    `;

  document.body.appendChild(privacyModal);

  // Close button event
  const closeBtn = privacyModal.querySelector(".footer-modal-close");
  closeBtn.addEventListener("click", closePrivacyModal);

  // Click outside to close
  privacyModal.addEventListener("click", (e) => {
    if (e.target === privacyModal) {
      closePrivacyModal();
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && privacyModal.classList.contains("active")) {
      closePrivacyModal();
    }
  });
}

function openPrivacyModal(e) {
  if(e) e.preventDefault();
  createPrivacyModal();
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    privacyModal.classList.add("active");
  }, 10);
}

function closePrivacyModal() {
  if (!privacyModal) return;
  privacyModal.classList.remove("active");
  document.body.style.overflow = '';
}

// Init listener
const privacyBtn = document.getElementById("footer-btn-privacy");
if (privacyBtn) {
    privacyBtn.addEventListener("click", openPrivacyModal);
}
