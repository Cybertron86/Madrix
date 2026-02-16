// ====================================================================================================================================
//   GALLERY MODAL MODULE
// ====================================================================================================================================

let galleryModal = null;
let galleryProjects = null;

function createGalleryModal() {
  if (galleryModal) return;

  // Create modal structure
  galleryModal = document.createElement("div");
  galleryModal.className = "gallery-modal";
  galleryModal.innerHTML = `
      <div class="gallery-modal-container">
        <button class="gallery-modal-close" aria-label="Close Gallery">×</button>
        <h2 class="gallery-modal-title">PROJECT GALLERY</h2>
        <div class="gallery-modal-content">
          <div class="gallery-loading">LOADING PROJECTS...</div>
        </div>
      </div>
    `;

  document.body.appendChild(galleryModal);

  // Close button event
  const closeBtn = galleryModal.querySelector(".gallery-modal-close");
  closeBtn.addEventListener("click", closeGalleryModal);

  // Click outside to close
  galleryModal.addEventListener("click", (e) => {
    if (e.target === galleryModal) {
      closeGalleryModal(footerBar);
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && galleryModal.classList.contains("active")) {
      closeGalleryModal(footerBar);
    }
  });
}

async function openGalleryModal(footerBar) {
  createGalleryModal();
  footerBar = document.getElementById("site-footer");
  if (window.matchMedia("(max-width: 480px)").matches) {
    footerBar.style.visibility = "visible";
    footerBar.style.opacity = "1";
  } else {
    footerBar.style.visibility = "hidden";
    footerBar.style.opacity = "0";
  }
  // Show modal
  setTimeout(() => {
    galleryModal.classList.add("active");
  }, 10);

  // Load projects if not already loaded
  if (!galleryProjects) {
    try {
      await loadGalleryProjects();
    } catch (error) {
      console.error("Failed to load gallery projects:", error);
      showGalleryError();
    }
  } else {
    renderGalleryGrid();
  }
}

function closeGalleryModal(footerBar) {
  if (!galleryModal) return;
  galleryModal.classList.remove("active");

  footerBar = document.getElementById("site-footer");
  if (!window.matchMedia("(max-width: 480px)").matches) {
    footerBar.style.visibility = "visible";
    footerBar.style.opacity = "1";
  }
}

async function loadGalleryProjects() {
  const contentDiv = galleryModal.querySelector(".gallery-modal-content");
  contentDiv.innerHTML =
    '<div class="gallery-loading">LOADING PROJECTS...</div>';

  try {
    // Fetch carousel data
    const response = await fetch("../resources/jsons/carousel-data.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    galleryProjects = Array.isArray(data) ? data : data.data || [];

    if (galleryProjects.length === 0) {
      throw new Error("No projects found");
    }

    renderGalleryGrid();
  } catch (error) {
    console.error("Error loading gallery:", error);
    showGalleryError();
  }
}

function renderGalleryGrid() {
  const contentDiv = galleryModal.querySelector(".gallery-modal-content");

  const gridHTML = `
      <div class="gallery-grid">
        ${galleryProjects
          .map(
            (project, index) => `
          <div class="gallery-item" data-project-id="${project.id}" data-project-index="${index}">
            <img src="${escapeHtml(project.mainImage)}" 
                 alt="${escapeHtml(project.title)}" 
                 class="gallery-item-image">
            <div class="gallery-item-overlay">
              <h3 class="gallery-item-title">${escapeHtml(project.title)}</h3>
              <span class="gallery-item-date">${escapeHtml(project.date)}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

  contentDiv.innerHTML = gridHTML;

  // Add click events to gallery items
  contentDiv.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      const projectIndex = parseInt(item.dataset.projectIndex);
      openProjectDetail(projectIndex);
    });
  });
}

function openProjectDetail(projectIndex) {
  setTimeout(() => {
    // Check if hologram carousel exists
    if (
      window.hologramCarousel &&
      typeof window.hologramCarousel.openOverlay === "function"
    ) {
      window.hologramCarousel.openOverlay(projectIndex);
    } else {
      console.error("Hologram carousel not found");
      // Fallback: try to create overlay manually
      createProjectOverlay(galleryProjects[projectIndex]);
    }
  }, 400);
}

function createProjectOverlay(project) {
  // Fallback function if hologram carousel is not available
  let overlay = document.querySelector(".holo-carousel-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "holo-carousel-overlay";
    document.body.appendChild(overlay);
  }

  let html = `
      <div class="holo-carousel-content">
        <button class="holo-carousel-close" aria-label="Close">×</button>
        <div class="holo-carousel-content-inner">
          <h2 class="holo-carousel-content-title">${escapeHtml(project.title)}</h2>
          <span class="holo-carousel-content-date">DATE: ${escapeHtml(project.date)}</span>
          <p class="holo-carousel-content-description">${escapeHtml(project.description)}</p>
          <a href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="holo-carousel-content-github">
            &gt; VIEW ON GITHUB &lt;
          </a>
    `;

  if (project.additionalImages && project.additionalImages.length > 0) {
    html += '<div class="holo-carousel-content-images">';
    project.additionalImages.forEach((imgUrl) => {
      html += `<img src="${escapeHtml(imgUrl)}" alt="Project screenshot" class="holo-carousel-content-image">`;
    });
    html += "</div>";
  }

  html += "</div></div>";
  overlay.innerHTML = html;

  overlay.classList.add("holo-carousel-active");

  // Close button
  const closeBtn = overlay.querySelector(".holo-carousel-close");
  closeBtn.addEventListener("click", () => {
    overlay.classList.remove("holo-carousel-active");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("holo-carousel-active");
    }
  });
}

function showGalleryError() {
  const contentDiv = galleryModal.querySelector(".gallery-modal-content");
  contentDiv.innerHTML = `
      <div class="gallery-error">
        ERROR: FAILED TO LOAD PROJECTS<br>
        <small style="font-size: 0.8em; opacity: 0.7;">Check console for details</small>
      </div>
    `;
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
