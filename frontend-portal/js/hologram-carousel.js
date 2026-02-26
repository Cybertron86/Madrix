/**
 * hologram-carousel.js
 *
 * Implements a high-end 3D "Holographic" carousel.
 * Features spherical item positioning, momentum-based rotation,
 * randomized visual glitches, and integration with the UltimateMatrixEye.
 */

// ====================================================================================================================================
//  HOLOGRAM CAROUSEL CLASS
// ====================================================================================================================================

class HologramCarousel {
  /**
   * @param {Object} options - Configuration overrides.
   */
  constructor(options = {}) {
    // 1. Configuration Constants
    this.config = {
      dataUrl: options.dataUrl || "./carousel-data.json",
      containerSelector: options.containerSelector || ".holo-carousel-wrapper",
      autoPlayDelay: options.autoPlayDelay || 15000,
      autoPlayMinInterval: options.autoPlayMinInterval || 10000,
      autoPlayMaxInterval: options.autoPlayMaxInterval || 20000,
      glitchMinInterval: options.glitchMinInterval || 10000,
      glitchMaxInterval: options.glitchMaxInterval || 20000,
      glitchDuration: options.glitchDuration || 600,
      transitionDuration: options.transitionDuration || 600,
      ...options,
    };

    // 2. Engine State
    this.items = [];
    this.currentIndex = 0;
    this.virtualIndex = 0; // Continuous index to prevent "rotation resets"
    this.isAnimating = false;
    this.autoPlayTimeout = null;
    this.glitchInterval = null;

    // Interaction State
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragDistance = 0;

    // 3. Component References
    this.container = null;
    this.sphere = null;
    this.overlay = null;
    this.matrixEye = null;

    this.init();
  }

  /**
   * Bootstrap sequence: Load data -> Build DOM -> Attach Events.
   */
  async init() {
    try {
      await this.loadProjectData();
      this.setupDOM();

      // Initialize internal Matrix Eye sub-component
      const sphereContainer = this.container.querySelector(
        ".holo-carousel-container",
      );
      if (sphereContainer && typeof UltimateMatrixEye !== "undefined") {
        this.matrixEye = new UltimateMatrixEye(sphereContainer);
      }

      this.setupEvents();
      this.startAutoPlay();
      this.startGlitchEffects();

      console.log(
        `✅ Hologram Carousel initialized with ${this.items.length} projects`,
      );
    } catch (error) {
      console.error("❌ Carousel initialization failed:", error);
    }
  }

  // ====================================================================================================================================
  //  DATA FETCHING
  // ====================================================================================================================================

  /**
   * Fetches project metadata from the defined JSON/API source.
   */
  async loadProjectData() {
    try {
      const response = await fetch(this.config.dataUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      // Support both API response wrappers and direct arrays
      if (result.success && result.data) {
        this.items = result.data;
      } else if (Array.isArray(result)) {
        this.items = result;
      } else {
        throw new Error("Invalid format");
      }

      if (this.items.length === 0) throw new Error("Empty project list");
    } catch (error) {
      console.warn("⚠️ Data fetch failed. Falling back to internal mock data.");
      this.items = this.getFallbackData();
    }
  }

  /**
   * Provides mock data if the JSON source is unavailable.
   */
  getFallbackData() {
    return Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      title: `Project ${i + 1}`,
      description: "Secure data node containing encrypted project blueprints.",
      date: "2024.01.01",
      githubUrl: "#",
      mainImage: `https://picsum.photos/800/600?random=${i + 1}`,
      additionalImages: [
        `https://picsum.photos/800/600?random=${i + 1}1`,
        `https://picsum.photos/800/600?random=${i + 1}2`,
      ],
    }));
  }

  // ====================================================================================================================================
  //  DOM CONSTRUCTION
  // ====================================================================================================================================

  /**
   * Creates and mounts the carousel structural elements.
   */
  setupDOM() {
    this.container = document.querySelector(this.config.containerSelector);
    if (!this.container) return;

    // 1. Sphere Surface
    const sphereContainer = document.createElement("div");
    sphereContainer.className = "holo-carousel-container";
    sphereContainer.setAttribute("role", "region");
    sphereContainer.setAttribute("aria-label", "Holographic Project Carousel");

    this.sphere = document.createElement("div");
    this.sphere.className = "holo-carousel-sphere";
    this.sphere.setAttribute("role", "list");

    // 2. Project Items
    this.items.forEach((item, index) => {
      const carouselItem = this.createCarouselItem(item, index);
      this.sphere.appendChild(carouselItem);
    });

    sphereContainer.appendChild(this.sphere);
    this.container.appendChild(sphereContainer);

    // 3. Modal Overlay
    this.createOverlay();

    // 4. Initial Layout Calculation
    this.updatePositions();
  }

  /**
   * Builds an individual carousel card with its reflection.
   */
  createCarouselItem(item, index) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "holo-carousel-item";
    itemDiv.dataset.index = index;
    itemDiv.setAttribute("role", "listitem");
    itemDiv.setAttribute("tabindex", "0");
    itemDiv.setAttribute("aria-label", `Project: ${item.title}`);

    const inner = document.createElement("div");
    inner.className = "holo-carousel-item-inner";

    // Main Glitch Layer
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "holo-carousel-image-wrapper";

    const img = document.createElement("img");
    img.src = item.mainImage;
    img.className = "holo-carousel-image";
    img.draggable = false;

    imageWrapper.appendChild(img);
    inner.appendChild(imageWrapper);

    // Reflection Layer
    const reflection = document.createElement("div");
    reflection.className = "holo-carousel-reflection";
    const reflectionImg = img.cloneNode();
    reflectionImg.className = "holo-carousel-reflection-image";
    reflection.appendChild(reflectionImg);

    inner.appendChild(reflection);
    itemDiv.appendChild(inner);

    return itemDiv;
  }

  /**
   * Builds the detail modal (Details view).
   */
  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "holo-carousel-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");

    const content = document.createElement("div");
    content.className = "holo-carousel-content";

    const closeBtn = document.createElement("button");
    closeBtn.className = "holo-carousel-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close");

    const contentInner = document.createElement("div");
    contentInner.className = "holo-carousel-content-inner";

    content.appendChild(closeBtn);
    content.appendChild(contentInner);
    this.overlay.appendChild(content);
    document.body.appendChild(this.overlay);

    // Bind basic local events
    closeBtn.addEventListener("click", () => this.closeOverlay());
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.closeOverlay();
    });
  }

  // ====================================================================================================================================
  //  EVENT HANDLING
  // ====================================================================================================================================

  /**
   * Attaches mouse, touch, and keyboard listeners to the carousel.
   */
  setupEvents() {
    const allItems = this.sphere.querySelectorAll(".holo-carousel-item");

    // Card Clicks
    allItems.forEach((item, index) => {
      item.addEventListener("click", () => {
        if (!this.isDragging) {
          if (index === this.currentIndex) this.openOverlay(index);
          else this.goTo(index);
        }
      });
    });

    // Drag/Touch Handlers
    this.container.addEventListener("mousedown", (e) =>
      this.handleMouseDown(e),
    );
    this.container.addEventListener("mousemove", (e) =>
      this.handleMouseMove(e),
    );
    window.addEventListener("mouseup", (e) => this.handleMouseUp(e));

    this.container.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: true },
    );
    this.container.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: true,
    });

    // Keyboard & Pause
    this.container.addEventListener("mouseenter", () => this.pauseAutoPlay());
    this.container.addEventListener("mouseleave", () => this.resumeAutoPlay());

    document.addEventListener("keydown", (e) => this.handleKeydown(e));
  }

  /** @param {KeyboardEvent} e */
  handleKeydown(e) {
    if (this.overlay.classList.contains("holo-carousel-active")) {
      if (e.key === "Escape") this.closeOverlay();
    } else {
      if (e.key === "ArrowLeft") this.prev();
      if (e.key === "ArrowRight") this.next();
    }
  }

  // Core Interaction Primitives (MouseDown/Move/Up, TouchStart/End)
  handleMouseDown(e) {
    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.pauseAutoPlay();
  }
  handleMouseMove(e) {
    if (this.dragStartX !== 0 && Math.abs(e.clientX - this.dragStartX) > 10)
      this.isDragging = true;
  }
  handleMouseUp(e) {
    if (this.isDragging && this.dragStartX !== 0) {
      const delta = e.clientX - this.dragStartX;
      if (Math.abs(delta) > 50) delta > 0 ? this.prev() : this.next();
    }
    this.isDragging = false;
    this.dragStartX = 0;
    this.resumeAutoPlay();
  }
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.pauseAutoPlay();
  }
  handleTouchEnd(e) {
    if (this.touchStartX !== 0) {
      const delta = e.changedTouches[0].clientX - this.touchStartX;
      if (Math.abs(delta) > 40) delta > 0 ? this.prev() : this.next();
    }
    this.touchStartX = 0;
    this.resumeAutoPlay();
  }

  // ====================================================================================================================================
  //  ROTATION & POSITIONING ENGINE
  // ====================================================================================================================================

  /**
   * Rotates the sphere in the specified direction.
   *
   * @param {-1|1} direction - Rotation direction.
   */
  navigate(direction) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Increment virtual index for continuous CSS rotation (prevents 359->0 snap)
    this.virtualIndex -= direction;

    const total = this.items.length;
    this.currentIndex = (this.currentIndex - direction + total) % total;

    this.sphere.classList.add("holo-carousel-transitioning");
    this.updatePositions();

    setTimeout(() => {
      this.sphere.classList.remove("holo-carousel-transitioning");
      this.isAnimating = false;
    }, this.config.transitionDuration);

    this.resetAutoPlay();
  }

  /**
   * Calculates and applies 3D transforms for all items on the spherical surface.
   */
  updatePositions() {
    const items = this.sphere.querySelectorAll(".holo-carousel-item");
    const total = items.length;
    const angleStep = (2 * Math.PI) / total;
    const radius = 600; // Layout distance

    items.forEach((item, index) => {
      // Use continuous virtual angle for smooth infinite rotation
      const continuousAngle = (index - this.virtualIndex) * angleStep;

      const x = Math.sin(continuousAngle) * radius;
      const z = Math.cos(continuousAngle) * radius - radius;
      const rotationY = (continuousAngle * 180) / Math.PI;

      // Visual Hierarchy: Fade and scale items based on proximity to center
      const relativeIndex = (index - this.currentIndex + total) % total;
      let opacity = 1;
      let scale = 1;

      if (relativeIndex === 0) {
        item.classList.add("holo-carousel-center");
        scale = 1.1;
      } else {
        item.classList.remove("holo-carousel-center");
        const dist = Math.abs(
          relativeIndex > total / 2 ? total - relativeIndex : relativeIndex,
        );
        opacity = Math.max(0.3, 1 - dist * 0.25);
        scale = Math.max(0.7, 1 - dist * 0.15);
      }

      item.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${rotationY}deg) scale(${scale})`;
      item.style.opacity = opacity;
      item.style.zIndex = Math.round(1000 - Math.abs(z));
    });
  }

  // ====================================================================================================================================
  //  AUTO-PLAY & VISUAL EFFECTS
  // ====================================================================================================================================

  startAutoPlay() {
    this.resetAutoPlay();
  }

  resetAutoPlay() {
    this.pauseAutoPlay();
    const delay = this.getRandomInt(
      this.config.autoPlayMinInterval,
      this.config.autoPlayMaxInterval,
    );
    this.autoPlayTimeout = setTimeout(() => this.navigate(1), delay);
  }

  pauseAutoPlay() {
    clearTimeout(this.autoPlayTimeout);
    this.autoPlayTimeout = null;
  }
  resumeAutoPlay() {
    if (!this.overlay.classList.contains("holo-carousel-active"))
      this.resetAutoPlay();
  }

  /**
   * Procedural glitch loop. Targets item textures randomly.
   */
  startGlitchEffects() {
    const trigger = () => {
      this.applyRandomGlitch();
      setTimeout(
        trigger,
        this.getRandomInt(
          this.config.glitchMinInterval,
          this.config.glitchMaxInterval,
        ),
      );
    };
    setTimeout(trigger, 5000);
  }

  applyRandomGlitch() {
    const items = this.sphere.querySelectorAll(".holo-carousel-item");
    const type = ["rgb-split", "scanline", "pixelate", "brightness"][
      Math.floor(Math.random() * 4)
    ];

    items.forEach((item) => {
      const wrapper = item.querySelector(".holo-carousel-image-wrapper");
      const img = item.querySelector(".holo-carousel-image");

      // Apply class based on randomized selection
      if (type === "rgb-split")
        wrapper.classList.add("holo-carousel-glitch-rgb-split");
      if (type === "scanline")
        item.classList.add("holo-carousel-glitch-active");
      if (type === "pixelate") img.classList.add("holo-carousel-pixelate");
      if (type === "brightness")
        img.classList.add("holo-carousel-brightness-glitch");

      // Flash timeout
      setTimeout(() => {
        wrapper.classList.remove("holo-carousel-glitch-rgb-split");
        item.classList.remove("holo-carousel-glitch-active");
        img.classList.remove(
          "holo-carousel-pixelate",
          "holo-carousel-brightness-glitch",
        );
      }, this.config.glitchDuration);
    });
  }

  // ====================================================================================================================================
  //  OVERLAY & DETAILS VIEW
  // ====================================================================================================================================

  /**
   * Opens the detail view for a specific project.
   *
   * @param {number} index - Index in the this.items array.
   */
  openOverlay(index) {
    const item = this.items[index];
    const contentInner = this.overlay.querySelector(
      ".holo-carousel-content-inner",
    );

    // Render content with basic protection
    let html = `
        <h2 class="holo-carousel-content-title" id="carousel-overlay-title">${this.escapeHtml(item.title)}</h2>
        <span class="holo-carousel-content-date">ACCESS_DATE: ${this.escapeHtml(item.date)}</span>
        <p class="holo-carousel-content-description">${this.escapeHtml(item.description)}</p>
        <a href="${this.escapeHtml(item.githubUrl)}" target="_blank" class="holo-carousel-content-github">
          &gt; Github Link &lt;
        </a>
      `;

    if (item.additionalImages?.length) {
      html += '<div class="holo-carousel-content-images">';
      item.additionalImages.forEach((src) => {
        html += `<img src="${this.escapeHtml(src)}" alt="System Snap" class="holo-carousel-content-image">`;
      });
      html += "</div>";
    }

    contentInner.innerHTML = html;
    this.overlay.classList.add("holo-carousel-active");

    // Flash entry effect
    const content = this.overlay.querySelector(".holo-carousel-content");
    content.style.animation = "holo-carousel-glitch-rgb 0.3s ease";
    setTimeout(() => (content.style.animation = ""), 300);

    this.pauseAutoPlay();
  }

  closeOverlay() {
    this.overlay.classList.remove("holo-carousel-active");
    this.resumeAutoPlay();
  }

  // ====================================================================================================================================
  //  UTILITIES
  // ====================================================================================================================================

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.toString().replace(/[&<>"']/g, (m) => map[m]);
  }

  goTo(index) {
    if (index >= 0 && index < this.items.length)
      this.navigate(index - this.currentIndex);
  }
  next() {
    this.navigate(-1);
  }
  prev() {
    this.navigate(1);
  }

  /**
   * Destruction logic for clean module swapping.
   */
  destroy() {
    this.pauseAutoPlay();
    if (this.overlay?.parentNode)
      this.overlay.parentNode.removeChild(this.overlay);
    if (this.container) this.container.innerHTML = "";
  }
}

// ====================================================================================================================================
//  GLOBAL INITIALIZATION
// ====================================================================================================================================

/**
 * Main factory function to initialize the carousel on the portal page.
 */
async function initHologramCarousel() {
  if (document.querySelector(".holo-carousel-wrapper")) {
    hologramCarouselInstance = new HologramCarousel({
      dataUrl: "../resources/jsons/carousel-data.json",
    });
  }
}
// Module-scoped reference to the active carousel instance
let hologramCarouselInstance = null;
async function getHologramCarousel() {
  return hologramCarouselInstance;
}

export { initHologramCarousel, getHologramCarousel };
