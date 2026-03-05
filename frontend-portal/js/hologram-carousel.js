/**
 * hologram-carousel.js
 *
 * Implements a 3D "Holographic" carousel.
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
      autoPlayMinInterval: options.autoPlayMinInterval || 6000,
      autoPlayMaxInterval: options.autoPlayMaxInterval || 11000,
      glitchMinInterval: options.glitchMinInterval || 2000,
      glitchMaxInterval: options.glitchMaxInterval || 5000,
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
    this.sphereFx = null; // Visible fx overlay for sphere glitch effects
    this.overlay = null;
    this.matrixEye = null;

    /**
     * Shared mutex between the card glitch loop and the sphere glitch loop.
     * When true, whichever system acquired the lock is mid-animation;
     * the other system will skip its current cycle and retry on its next timer tick.
     *
     * Only one visual "glitch layer" fires at a time, keeping sphere effects
     * visually distinct from card effects and preventing them from fighting
     * each other's CSS classes or filter stacks.
     */
    this._glitchLock = false;

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
      this.startSphereGlitchEffects();

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
      date: "2026.01.01",
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

    // Inject visible fx overlay — this is what actually shows sphere glitch effects.
    // The sphere itself is a transparent 3D container, so filters on it are invisible.
    this.sphereFx = document.createElement("div");
    this.sphereFx.className = "holo-carousel-sphere-fx";
    sphereContainer.appendChild(this.sphereFx);

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

    // Scanline on the image — clipped + rounded by image-wrapper's overflow:hidden & border-radius
    const scanlineImg = document.createElement("div");
    scanlineImg.className = "holo-carousel-scanline";
    imageWrapper.appendChild(scanlineImg);

    inner.appendChild(imageWrapper);

    // Reflection Layer
    const reflection = document.createElement("div");
    reflection.className = "holo-carousel-reflection";
    const reflectionImg = img.cloneNode();
    reflectionImg.className = "holo-carousel-reflection-image";
    reflection.appendChild(reflectionImg);

    // Scanline on the reflection — clipped + rounded by reflection's overflow:hidden & border-radius
    const scanlineRef = document.createElement("div");
    scanlineRef.className = "holo-carousel-scanline";
    reflection.appendChild(scanlineRef);

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
    if (this.isAnimating) {
        this.resetAutoPlay(); // ✅ Keep the chain alive even when skipping
        return;
    }
    this.isAnimating = true;

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
   *
   * Checks _glitchLock before firing — if the sphere glitch system is
   * currently mid-animation, this cycle is skipped entirely. The next
   * scheduled tick will try again.
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
    // Sphere glitch is active — skip this card-glitch cycle entirely.
    if (this._glitchLock) return;

    const items = this.sphere.querySelectorAll(".holo-carousel-item");

    // Full effect catalogue
    const allTypes = [
      // Original
      "rgb-split", "scanline", "pixelate", "brightness",
      // Prev batch
      "ghost", "error-screen", "wave", "hologram-flicker", "static", "plasma",
      // Eye-reveal
      "venetian", "pixel-dissolve", "slice-tear", "vortex",
      "scan-wipe", "rain-wash", "corrupt-blocks", "edge-erosion", "iris", "data-bleed",
    ];

    // Per-effect cleanup durations (must match CSS animation lengths)
    const effectDurations = {
      "rgb-split":        600,
      "scanline":         600,
      "pixelate":         600,
      "brightness":       600,
      "ghost":            900,
      "wave":             700,
      "hologram-flicker": 700,
      "static":           600,
      "plasma":           750,
      // Eye-reveal — durations match their keyframe lengths
      "venetian":         1200,
      "pixel-dissolve":   1300,
      "slice-tear":       1000,
      "vortex":           1500,
      "scan-wipe":        1400,
      "rain-wash":        1600,
      "corrupt-blocks":   1500,
      "edge-erosion":     1700,
      "iris":             1300,
      "data-bleed":       2100,
    };

    const type = allTypes[Math.floor(Math.random() * allTypes.length)];

    // Heavy / long effects hit only a random subset so not all cards reveal at once
    const heavyEffects = [
      "error-screen", "plasma", "hologram-flicker", "wave",
      "vortex", "iris", "data-bleed", "edge-erosion",
      "venetian", "pixel-dissolve", "slice-tear", "rain-wash",
      "corrupt-blocks", "scan-wipe",
    ];
    const isHeavy = heavyEffects.includes(type);

    // Limit to max 2 cards affected per glitch fire (70% chance of just 1)
    const allItemsArr = Array.from(items);
    const maxAffected = Math.random() < 0.7 ? 1 : 2;
    const shuffled = allItemsArr.sort(() => Math.random() - 0.5).slice(0, maxAffected);

    // Determine the longest animation that will actually run this cycle,
    // then hold the lock for exactly that duration.
    let maxDuration = 0;

    shuffled.forEach((item) => {
      if (isHeavy && Math.random() < 0.4) return;

      const wrapper = item.querySelector(".holo-carousel-image-wrapper");
      const img = item.querySelector(".holo-carousel-image");
      const duration = effectDurations[type] || this.config.glitchDuration;

      if (duration > maxDuration) maxDuration = duration;

      // ── Apply ─────────────────────────────────────────────────────────
      switch (type) {
        case "rgb-split":
          wrapper.classList.add("holo-carousel-glitch-rgb-split");
          break;
        case "scanline":
          item.classList.add("holo-carousel-glitch-active");
          break;
        case "pixelate":
          img.classList.add("holo-carousel-pixelate");
          break;
        case "brightness":
          img.classList.add("holo-carousel-brightness-glitch");
          break;
        case "ghost":
          item.classList.add("holo-carousel-ghost");
          break;
        case "error-screen":
          this.applyErrorScreen(item, wrapper);
          return;
        case "wave":
          item.classList.add("holo-carousel-wave");
          break;
        case "hologram-flicker":
          item.classList.add("holo-carousel-hologram-flicker");
          break;
        case "static":
          item.classList.add("holo-carousel-static");
          break;
        case "plasma":
          item.classList.add("holo-carousel-plasma");
          break;
        case "venetian":
          item.classList.add("holo-carousel-venetian");
          break;
        case "pixel-dissolve":
          item.classList.add("holo-carousel-pixel-dissolve");
          break;
        case "slice-tear":
          item.classList.add("holo-carousel-slice-tear");
          break;
        case "vortex":
          item.classList.add("holo-carousel-vortex");
          break;
        case "scan-wipe":
          this.applyScanWipe(item, wrapper, duration);
          return;
        case "rain-wash":
          item.classList.add("holo-carousel-rain-wash");
          break;
        case "corrupt-blocks":
          item.classList.add("holo-carousel-corrupt-blocks");
          break;
        case "edge-erosion":
          item.classList.add("holo-carousel-edge-erosion");
          break;
        case "iris":
          item.classList.add("holo-carousel-iris");
          break;
        case "data-bleed":
          item.classList.add("holo-carousel-data-bleed");
          break;
      }

      // ── Cleanup after exact animation duration ─────────────────────────
      setTimeout(() => {
        wrapper.classList.remove("holo-carousel-glitch-rgb-split");
        item.classList.remove(
          "holo-carousel-glitch-active",
          "holo-carousel-ghost",
          "holo-carousel-wave",
          "holo-carousel-hologram-flicker",
          "holo-carousel-static",
          "holo-carousel-plasma",
          "holo-carousel-venetian",
          "holo-carousel-pixel-dissolve",
          "holo-carousel-slice-tear",
          "holo-carousel-vortex",
          "holo-carousel-rain-wash",
          "holo-carousel-corrupt-blocks",
          "holo-carousel-edge-erosion",
          "holo-carousel-iris",
          "holo-carousel-data-bleed",
        );
        img.classList.remove(
          "holo-carousel-pixelate",
          "holo-carousel-brightness-glitch",
        );
      }, duration);
    });

    // Acquire lock for the lifetime of the longest-running card effect.
    // If nothing actually ran (all skipped by isHeavy check), don't lock.
    if (maxDuration > 0) {
      this._glitchLock = true;
      setTimeout(() => { this._glitchLock = false; }, maxDuration);
    }
  }

  /**
   * Scan-wipe reveal: injects an animated glowing line that sweeps the image
   * transparent from top to bottom, fully revealing the eye, then restores.
   */
  applyScanWipe(item, wrapper, duration = 1400) {
    const line = document.createElement("div");
    line.className = "holo-carousel-scan-wipe-line";
    wrapper.appendChild(line);
    item.classList.add("holo-carousel-scan-wipe");

    setTimeout(() => {
      item.classList.remove("holo-carousel-scan-wipe");
      if (line.parentNode) line.parentNode.removeChild(line);
    }, duration);
  }

  /**
   * Injects a red error message overlay into the image card,
   * blacks out the image, then auto-removes after glitchDuration.
   *
   * @param {HTMLElement} item    - The carousel item element.
   * @param {HTMLElement} wrapper - The image-wrapper inside the item.
   */
  applyErrorScreen(item, wrapper) {
    const errorMessages = [
      "SYSTEM BREACH DETECTED",
      "MEMORY CORRUPTION ERROR",
      "CRITICAL FAILURE: SEGFAULT",
      "NEURAL LINK SEVERED",
      "DATA STREAM CORRUPTED",
      "FIREWALL BREACHED",
      "UNAUTHORIZED ACCESS",
      "KERNEL PANIC: NULL PTR DEREF",
      "BUFFER OVERFLOW: STACK DUMP",
      "ENCRYPTION KEY INVALID",
    ];

    const code = `ERR_0x${Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0")}`;
    const msg = errorMessages[Math.floor(Math.random() * errorMessages.length)];

    const overlay = document.createElement("div");
    overlay.className = "holo-carousel-error-overlay";
    overlay.innerHTML = `
      <span class="holo-carousel-error-code">${code}</span>
      <span class="holo-carousel-error-msg">${msg}</span>
      <span class="holo-carousel-error-blink">■ ■ ■</span>
    `;

    wrapper.appendChild(overlay);
    item.classList.add("holo-carousel-error-screen");

    setTimeout(() => {
      item.classList.remove("holo-carousel-error-screen");
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, this.config.glitchDuration);
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

  // ====================================================================================================================================
  //  SPHERE GLITCH EFFECTS
  // ====================================================================================================================================

  /**
   * Fires randomised horizontal glitch effects on the injected .holo-carousel-sphere-fx
   * overlay element — runs independently from the card glitch loop.
   *
   * Checks _glitchLock before firing — if a card glitch is currently
   * mid-animation, this cycle is skipped entirely. The next scheduled
   * tick will try again.
   */
  startSphereGlitchEffects() {
    const EFFECTS = [
      { cls: "sphere-glitch-band-tear",      duration: 1050 },
      { cls: "sphere-glitch-grey-crush",     duration: 900  },
      { cls: "sphere-glitch-red-bleed",      duration: 750  },
      { cls: "sphere-glitch-blue-green",     duration: 550  },
      { cls: "sphere-glitch-gamma-wave",     duration: 750  },
      { cls: "sphere-glitch-alpha-dropout",  duration: 1450 },
      { cls: "sphere-glitch-interlace",      duration: 650  },
      { cls: "sphere-glitch-black-pulse",    duration: 1150 },
      { cls: "sphere-glitch-chroma-shear",   duration: 900  },
      { cls: "sphere-glitch-signal-dropout", duration: 1600 },
      { cls: "sphere-glitch-h-bars",         duration: 950  },
{ cls: "sphere-glitch-v-bars",         duration: 800  },
{ cls: "sphere-glitch-grey-static",    duration: 1250 },
{ cls: "sphere-glitch-blackout-stutter", duration: 1350 },
{ cls: "sphere-glitch-v-shear",        duration: 1000 },
{ cls: "sphere-glitch-grey-strobe",    duration: 700  },
    ];

    const trigger = () => {
      this.applySphereGlitch(EFFECTS);
      setTimeout(trigger, this.getRandomInt(10000, 22000));
    };

    setTimeout(trigger, 9000); // let page fully render first
  }

  /**
   * Picks a random sphere glitch, applies it to the sphereFx overlay,
   * then removes the class once the animation completes.
   *
   * Acquires _glitchLock for the duration of the effect so the card
   * glitch system stays idle while the sphere effect is running.
   *
   * @param {Array} effects
   */
  applySphereGlitch(effects) {
    if (!this.sphereFx) return;
    if (this.overlay?.classList.contains("holo-carousel-active")) return;

    // Card glitch is active — skip this sphere-glitch cycle entirely.
    if (this._glitchLock) return;

    // Don't stack — only fire if no sphere glitch class currently active
    if (this.sphereFx.className !== "holo-carousel-sphere-fx") return;

    const effect = effects[Math.floor(Math.random() * effects.length)];

    // Acquire the shared lock for the lifetime of this sphere effect.
    this._glitchLock = true;
    this.sphereFx.classList.add(effect.cls);

    setTimeout(() => {
      this.sphereFx.classList.remove(effect.cls);
      this._glitchLock = false;
    }, effect.duration + 100);
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
//  INITIALIZATION
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
  return await hologramCarouselInstance;
}

// ====================================================================================================================================
//  EXPORTS
// ====================================================================================================================================

export { initHologramCarousel, getHologramCarousel };