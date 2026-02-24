/**
 * gallery-modal.js
 * Project Gallery modal.
 * Lazy-initialised on first open; fetches project data once and caches it
 * for subsequent opens. Exposes openGalleryModal globally.
 */
import { ModalManager, escapeHtml } from "./security-utils.js";
import { getHologramCarousel } from "./hologram-carousel.js";

("use strict");

let galleryModal = null;
let galleryProjects = null; // cached after first successful fetch

const MODAL_HTML = `
    <div id="galleryOverlay" class="mx-modal-overlay">
      <div class="mx-modal-container gallery-modal-custom">
        <button class="mx-modal-close" id="galleryCloseBtn" aria-label="Close Project Gallery Modal">×</button>
        <h2 class="mx-modal-title">PROJECT GALLERY</h2>
        <div class="mx-modal-content">
          <div class="gallery-loading" role="status" aria-live="polite">LOADING PROJECTS...</div>
        </div>
      </div>
    </div>
  `;

// Inject HTML once and wire up close/keyboard/overlay-click via ModalManager
function createGalleryModal() {
  if (galleryModal) return;
  document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
  galleryModal = document.getElementById("galleryOverlay");
  ModalManager.setup(galleryModal, closeGalleryModal);
}

export async function openGalleryModal() {
  createGalleryModal();

  // Footer overlaps the modal on mobile — hide it on larger screens only
  const footerBar = document.getElementById("site-footer");
  if (window.matchMedia("(max-width: 480px)").matches) {
    footerBar.style.visibility = "visible";
    footerBar.style.opacity = "1";
  } else {
    footerBar.style.visibility = "hidden";
    footerBar.style.opacity = "0";
  }

  galleryModal.classList.add("active");
  document.body.style.overflow = "hidden"; // prevent background scroll

  // Skip the fetch if projects are already cached from a previous open
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

function closeGalleryModal() {
  if (!galleryModal) return;
  galleryModal.classList.remove("active");
  document.body.style.overflow = "";

  // Restore footer visibility on close — only needed above mobile breakpoint
  const footerBar = document.getElementById("site-footer");
  if (!window.matchMedia("(max-width: 480px)").matches) {
    footerBar.style.visibility = "visible";
    footerBar.style.opacity = "1";
  }
}

async function loadGalleryProjects() {
  const contentDiv = galleryModal.querySelector(".mx-modal-content");
  contentDiv.innerHTML =
    '<div class="mx-status-msg loading">LOADING PROJECTS...</div>';

  try {
    const response = await fetch("../resources/jsons/carousel-data.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    // API may return a bare array or a wrapped { data: [] } shape
    galleryProjects = Array.isArray(data) ? data : data.data || [];

    if (galleryProjects.length === 0) throw new Error("No projects found");

    renderGalleryGrid();
  } catch (error) {
    console.error("Error loading gallery:", error);
    showGalleryError();
  }
}

function renderGalleryGrid() {
  const contentDiv = galleryModal.querySelector(".mx-modal-content");
  const esc = escapeHtml;

  const gridHTML = `
      <div class="gallery-grid" role="list">
        ${galleryProjects
          .map(
            (project, index) => `
          <div class="gallery-item mx-hoverglow" 
               data-project-id="${project.id}" 
               data-project-index="${index}" 
               role="listitem" 
               tabindex="0" 
               aria-label="View details for ${esc(project.title)}">
            <img src="${esc(project.mainImage)}" 
                 alt="${esc(project.title)}" 
                 class="gallery-item-image">
            <div class="gallery-item-overlay">
              <h3 class="gallery-item-title">${esc(project.title)}</h3>
              <span class="gallery-item-date">${esc(project.date)}</span>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

  contentDiv.innerHTML = gridHTML;

  // Attach click and keyboard handlers so items are accessible without a mouse
  contentDiv.querySelectorAll(".gallery-item").forEach((item) => {
    const openDetail = () =>
      openProjectDetail(parseInt(item.dataset.projectIndex));
    item.addEventListener("click", openDetail);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail();
      }
    });
  });
}

function openProjectDetail(projectIndex) {
  // Delay so the gallery close animation finishes before the detail overlay opens
  setTimeout(() => {
    const carousel = getHologramCarousel();
    if (carousel && typeof carousel.openOverlay === "function") {
      carousel.openOverlay(projectIndex);
    } else {
      // Fallback if the carousel component hasn't initialised yet
      createProjectOverlay(galleryProjects[projectIndex]);
    }
  }, 400);
}

function createProjectOverlay(project) {
  // Reuse an existing overlay element if one is already in the DOM
  let overlay = document.querySelector(".holo-carousel-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "holo-carousel-overlay";
    document.body.appendChild(overlay);
  }

  const esc = escapeHtml;
  let html = `
      <div class="holo-carousel-content">
        <button class="holo-carousel-close" aria-label="Close">×</button>
        <div class="holo-carousel-content-inner">
          <h2 class="holo-carousel-content-title">${esc(project.title)}</h2>
          <span class="holo-carousel-content-date">DATE: ${esc(project.date)}</span>
          <p class="holo-carousel-content-description">${esc(project.description)}</p>
          <a href="${esc(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="holo-carousel-content-github">
            &gt; VIEW ON GITHUB &lt;
          </a>
    `;

  if (project.additionalImages && project.additionalImages.length > 0) {
    html += '<div class="holo-carousel-content-images">';
    project.additionalImages.forEach((imgUrl) => {
      html += `<img src="${esc(imgUrl)}" alt="Project screenshot" class="holo-carousel-content-image">`;
    });
    html += "</div>";
  }

  html += "</div></div>";
  overlay.innerHTML = html;
  overlay.classList.add("holo-carousel-active");

  // Close on button click or backdrop click
  const close = () => overlay.classList.remove("holo-carousel-active");
  overlay
    .querySelector(".holo-carousel-close")
    .addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

function showGalleryError() {
  const contentDiv = galleryModal.querySelector(".mx-modal-content");
  contentDiv.innerHTML = `
      <div class="mx-status-msg error">
        ERROR: FAILED TO LOAD PROJECTS<br>
        <small style="font-size: 0.8em; opacity: 0.7;">Check console for details</small>
      </div>
    `;
}

// (named export is provided on the function declaration above)
