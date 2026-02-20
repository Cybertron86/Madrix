// ====================================================================================================================================
//  CONTACT MODAL MODULE
// ====================================================================================================================================

let contactModal = null;

function createContactModal() {
  if (contactModal) return;

  contactModal = document.createElement("div");
  contactModal.className = "footer-modal";
  contactModal.id = "modal-contact";
  contactModal.setAttribute("role", "dialog");
  contactModal.setAttribute("aria-modal", "true");
  contactModal.setAttribute("aria-labelledby", "contact-title");
  contactModal.innerHTML = `
      <div class="footer-modal-container">
        <button class="footer-modal-close" aria-label="Close Contact Modal">×</button>
        <h2 class="footer-modal-title" id="contact-title">Contact</h2>
        <div class="footer-modal-content">
          <p>Interested in collaboration or just want to connect? I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions.</p>
          
          <h3>Get in Touch</h3>
          <p>
            <strong>Email:</strong> <a href="mailto:[EMAIL_ADDRESS]">[EMAIL_ADDRESS]</a><br>
            <strong>GitHub:</strong> <a href="https://github.com/cybertron86" target="_blank">github.com/cybertron86</a><br>
          </p>

          <h3>Location</h3>
          <p>Karlsruhe, Germany / Remote</p>
          
          <form id="contact-form" style="display: flex; flex-direction: column; margin-top: 2rem;" aria-label="Contact Form">
             <input type="text" placeholder="NAME / ALIAS" required aria-label="Your Name or Alias">
             <input type="email" placeholder="EMAIL ADDRESS" required aria-label="Your Email Address">
             <textarea placeholder="YOUR MESSAGE" rows="5" required aria-label="Your Message"></textarea>
             <button type="button" id="contact-submit-btn">INITIATE TRANSMISSION</button>
          </form>
        </div>
      </div>
    `;

  document.body.appendChild(contactModal);

  // Close button event
  const closeBtn = contactModal.querySelector(".footer-modal-close");
  closeBtn.addEventListener("click", closeContactModal);

  // Click outside to close
  contactModal.addEventListener("click", (e) => {
    if (e.target === contactModal) {
      closeContactModal();
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && contactModal.classList.contains("active")) {
      closeContactModal();
    }
  });
  
  // Mock Submit
  const submitBtn = contactModal.querySelector("#contact-submit-btn");
  submitBtn.addEventListener("click", () => {
      // Here you would normally send the form data
      alert("Message transmission simulated. End of line.");
      closeContactModal();
  });
}

function openContactModal(e) {
  if(e) e.preventDefault();
  createContactModal();
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    contactModal.classList.add("active");
  }, 10);
}

function closeContactModal() {
  if (!contactModal) return;
  contactModal.classList.remove("active");
  document.body.style.overflow = '';
}

// Init listener
const contactBtn = document.getElementById("footer-btn-contact");
if (contactBtn) {
    contactBtn.addEventListener("click", openContactModal);
}
