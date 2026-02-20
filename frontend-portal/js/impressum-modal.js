// ====================================================================================================================================
//  IMPRESSUM MODAL MODULE
// ====================================================================================================================================

let impressumModal = null;

function createImpressumModal() {
  if (impressumModal) return;

  impressumModal = document.createElement("div");
  impressumModal.className = "footer-modal";
  impressumModal.id = "modal-impressum";
  impressumModal.setAttribute("role", "dialog");
  impressumModal.setAttribute("aria-modal", "true");
  impressumModal.setAttribute("aria-labelledby", "impressum-title");
  impressumModal.innerHTML = `
      <div class="footer-modal-container">
        <button class="footer-modal-close" aria-label="Close Legal Notice">×</button>
        <h2 class="footer-modal-title" id="impressum-title">Legal Notice</h2>
        <div class="footer-modal-content">
          <h3>Information according to § 5 TMG</h3>
          <p>
            <strong>Benjamin Tron</strong><br>
            Cybertron Systems<br>
            Rheinstraße 102<br>
            76185 Karlsruhe<br>
            Germany
          </p>

          <h3>Contact</h3>
          <p>
            Phone: +49 1575 2605349<br>
            Email: <a href="mailto:[EMAIL_ADDRESS]">[EMAIL_ADDRESS]</a>
          </p>

          <h3>Responsible for content according to § 55 Abs. 2 RStV</h3>
          <p>
            Benjamin Tron<br>
            Rheinstraße 102<br>
            76185 Karlsruhe
          </p>
          
          <p><em>This is a private portfolio project.</em></p>
        </div>
      </div>
    `;

  document.body.appendChild(impressumModal);

  // Close button event
  const closeBtn = impressumModal.querySelector(".footer-modal-close");
  closeBtn.addEventListener("click", closeImpressumModal);

  // Click outside to close
  impressumModal.addEventListener("click", (e) => {
    if (e.target === impressumModal) {
      closeImpressumModal();
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && impressumModal.classList.contains("active")) {
      closeImpressumModal();
    }
  });
}

function openImpressumModal(e) {
  if(e) e.preventDefault();
  createImpressumModal();
  
  // Submit existing scroll to prevent body scroll
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    impressumModal.classList.add("active");
  }, 10);
}

function closeImpressumModal() {
  if (!impressumModal) return;
  impressumModal.classList.remove("active");
  document.body.style.overflow = '';
}

// Init listener
const impressumBtn = document.getElementById("footer-btn-impressum");
if (impressumBtn) {
    impressumBtn.addEventListener("click", openImpressumModal);
}
