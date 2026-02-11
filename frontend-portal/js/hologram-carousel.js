/**====================================================================================================================================
 * MATRIX HOLOGRAPHIC CAROUSEL 
 ====================================================================================================================================*/

class HologramCarousel {
  constructor(options = {}) {
    // Configuration
    this.config = {
      // OPTION 1: Direct JSON file path (recommended if no PHP server)
      dataUrl: options.dataUrl || "./carousel-data.json",

      // OPTION 2: PHP API endpoint (use if you have PHP server running)
      // dataUrl: options.dataUrl || "/backend/apiExample.php",

      containerSelector: options.containerSelector || ".holo-carousel-wrapper",
      autoPlayDelay: options.autoPlayDelay || 15000, // 15 seconds
      autoPlayMinInterval: options.autoPlayMinInterval || 10000, // 10 seconds
      autoPlayMaxInterval: options.autoPlayMaxInterval || 20000, // 20 seconds
      glitchMinInterval: options.glitchMinInterval || 10000, // 10 seconds
      glitchMaxInterval: options.glitchMaxInterval || 20000, // 20 seconds
      glitchDuration: options.glitchDuration || 600, // 600ms
      transitionDuration: options.transitionDuration || 600, // 600ms
      ...options,
    };

    // State
    this.items = [];
    this.currentIndex = 0;
    this.isAnimating = false;
    this.autoPlayTimeout = null;
    this.glitchInterval = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.touchStartY = 0;
    this.touchEndY = 0;
    this.touchStartTime = 0;
    this.hasMoved = false;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragDistance = 0;

    // DOM elements
    this.container = null;
    this.sphere = null;
    this.overlay = null;

    // Initialize
    this.init();
  }

  async init() {
    try {
      // Load data
      await this.loadDataJsonProjects();

      // Setup DOM
      this.setupDOM();

      // CREATE MATRIX EYE
      const sphereContainer = this.container.querySelector(
        ".holo-carousel-container",
      );
      if (sphereContainer && typeof UltimateMatrixEye !== "undefined") {
        this.matrixEye = new UltimateMatrixEye(sphereContainer);
      }

      // Setup events
      this.setupEvents();

      // Start auto-play
      this.startAutoPlay();

      // Start glitch effects
      this.startGlitchEffects();

      console.log("✅ Hologram Carousel initialized successfully");
      console.log(`📦 Loaded ${this.items.length} projects`);
    } catch (error) {
      console.error("❌ Failed to initialize Hologram Carousel:", error);
    }
  }

  async loadDataJsonProjects() {
    console.log("🔍 Trying to load from:", this.config.dataUrl);

    try {
      const response = await fetch(this.config.dataUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📦 Received data:", result);

      // Check if it's API format (with success property)
      if (result.success && result.data) {
        this.items = result.data;
        console.log(`✅ Loaded ${this.items.length} projects from API`);
      }
      // Or direct array format (JSON file)
      else if (Array.isArray(result)) {
        this.items = result;
        console.log(`✅ Loaded ${this.items.length} projects from JSON`);
      } else {
        throw new Error("Invalid data format");
      }

      // Validate data structure
      if (this.items.length === 0) {
        throw new Error("No projects found in data");
      }
    } catch (error) {
      console.error("❌ Failed to load data:", error);
      console.warn("⚠️ Using fallback data");
      this.items = this.getFallbackData();
    }
  }

  getFallbackData() {
    return Array.from({ length: 7 }, (_, i) => ({
      id: i + 1,
      title: `Project ${i + 1}`,
      description: "This is a placeholder project description.",
      date: "2024-01-01",
      githubUrl: "#",
      mainImage: `https://picsum.photos/800/600?random=${i + 1}`,
      additionalImages: [
        `https://picsum.photos/800/600?random=${i + 1}1`,
        `https://picsum.photos/800/600?random=${i + 1}2`,
        `https://picsum.photos/800/600?random=${i + 1}3`,
      ],
    }));
  }

  setupDOM() {
    this.container = document.querySelector(this.config.containerSelector);
    if (!this.container) {
      console.error("Container not found");
      return;
    }

    // Create sphere container
    const sphereContainer = document.createElement("div");
    sphereContainer.className = "holo-carousel-container";

    this.sphere = document.createElement("div");
    this.sphere.className = "holo-carousel-sphere";

    // Create carousel items
    this.items.forEach((item, index) => {
      const carouselItem = this.createCarouselItem(item, index);
      this.sphere.appendChild(carouselItem);
    });

    sphereContainer.appendChild(this.sphere);
    this.container.appendChild(sphereContainer);

    // Create overlay
    this.createOverlay();

    // Position items
    this.updatePositions();
  }

  createCarouselItem(item, index) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "holo-carousel-item";
    itemDiv.dataset.index = index;

    const inner = document.createElement("div");
    inner.className = "holo-carousel-item-inner";

    // Image wrapper
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "holo-carousel-image-wrapper";

    const img = document.createElement("img");
    img.src = item.mainImage;
    img.alt = item.title;
    img.className = "holo-carousel-image";
    img.draggable = false;

    imageWrapper.appendChild(img);
    inner.appendChild(imageWrapper);

    // Reflection
    const reflection = document.createElement("div");
    reflection.className = "holo-carousel-reflection";

    const reflectionImg = document.createElement("img");
    reflectionImg.src = item.mainImage;
    reflectionImg.alt = `${item.title} reflection`;
    reflectionImg.className = "holo-carousel-reflection-image";
    reflectionImg.draggable = false;

    reflection.appendChild(reflectionImg);
    inner.appendChild(reflection);

    itemDiv.appendChild(inner);

    return itemDiv;
  }

  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "holo-carousel-overlay";

    const content = document.createElement("div");
    content.className = "holo-carousel-content";

    const closeBtn = document.createElement("button");
    closeBtn.className = "holo-carousel-close";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close");

    closeBtn.style.lineHeight = "40px";

    const contentInner = document.createElement("div");
    contentInner.className = "holo-carousel-content-inner";

    content.appendChild(closeBtn);
    content.appendChild(contentInner);
    this.overlay.appendChild(content);
    document.body.appendChild(this.overlay);

    // Close button event
    closeBtn.addEventListener("click", () => this.closeOverlay());

    // Click outside to close
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.closeOverlay();
      }
    });
  }

  setupEvents() {
    const allItems = this.sphere.querySelectorAll(".holo-carousel-item");

    allItems.forEach((item, index) => {
      item.addEventListener("click", (e) => {
        if (!this.isDragging && index === this.currentIndex) {
          this.openOverlay(index);
        }
      });
    });

    // Touch events (mobile)
    this.container.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: true },
    );
    this.container.addEventListener(
      "touchmove",
      (e) => this.handleTouchMove(e),
      { passive: true },
    );
    this.container.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: true,
    });

    // Mouse events (desktop)
    this.container.addEventListener("mousedown", (e) =>
      this.handleMouseDown(e),
    );
    this.container.addEventListener("mousemove", (e) =>
      this.handleMouseMove(e),
    );
    this.container.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.container.addEventListener("mouseleave", (e) => this.handleMouseUp(e));

    // Hover pause for auto-play (desktop)
    this.container.addEventListener("mouseenter", () => this.pauseAutoPlay());
    this.container.addEventListener("mouseleave", () => this.resumeAutoPlay());

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (this.overlay.classList.contains("holo-carousel-active")) {
        if (e.key === "Escape") {
          this.closeOverlay();
        }
      } else {
        if (e.key === "ArrowLeft") {
          this.prev();
        } else if (e.key === "ArrowRight") {
          this.next();
        }
      }
    });
  }

  // Touch handlers
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
    this.hasMoved = false;
    this.pauseAutoPlay();
  }

  handleTouchMove(e) {
    this.hasMoved = true;
  }

  handleTouchEnd(e) {
    if (!this.hasMoved) {
      this.resumeAutoPlay();
      return;
    }

    this.touchEndX = e.changedTouches[0].clientX;
    this.touchEndY = e.changedTouches[0].clientY;

    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;

    // Check if horizontal swipe
    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > 50 &&
      deltaTime < 500
    ) {
      if (deltaX > 0) {
        this.prev();
      } else {
        this.next();
      }
    }

    this.resumeAutoPlay();
  }

  // Mouse handlers
  handleMouseDown(e) {
    this.isDragging = false;
    this.dragStartX = e.clientX;
    this.pauseAutoPlay();
  }

  handleMouseMove(e) {
    if (this.dragStartX !== 0) {
      const distance = Math.abs(e.clientX - this.dragStartX);
      if (distance > 5) {
        this.isDragging = true;
      }
    }
  }

  handleMouseUp(e) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.dragStartX;

      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0) {
          this.prev();
        } else {
          this.next();
        }
      }
    }

    this.isDragging = false;
    this.dragStartX = 0;
    this.resumeAutoPlay();
  }

  navigate(direction) {
    if (this.isAnimating) return;

    this.isAnimating = true;

    const totalItems = this.items.length;
    this.currentIndex =
      (this.currentIndex - direction + totalItems) % totalItems;

    // Add transition class
    this.sphere.classList.add("holo-carousel-transitioning");

    this.updatePositions();

    setTimeout(() => {
      this.sphere.classList.remove("holo-carousel-transitioning");
      this.isAnimating = false;
    }, this.config.transitionDuration);

    // Reset auto-play timer
    this.resetAutoPlay();
  }

  updatePositions() {
    const items = this.sphere.querySelectorAll(".holo-carousel-item");
    const totalItems = items.length;
    const angleStep = (2 * Math.PI) / totalItems;
    const radius = 600; // Distance from center

    items.forEach((item, index) => {
      const relativeIndex =
        (index - this.currentIndex + totalItems) % totalItems;
      const angle = relativeIndex * angleStep;

      // Calculate 3D position
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - radius;
      const y = 0; // Vertical offset

      // Calculate rotation
      const rotationY = (angle * 180) / Math.PI;

      // Calculate opacity and scale based on position
      let opacity = 1;
      let scale = 1;

      if (relativeIndex === 0) {
        // Center item
        item.classList.add("holo-carousel-center");
        opacity = 1;
        scale = 1.1;
      } else {
        item.classList.remove("holo-carousel-center");
        const distance = Math.abs(relativeIndex - totalItems / 2);
        opacity = Math.max(0.3, 1 - distance * 0.15);
        scale = Math.max(0.7, 1 - distance * 0.1);
      }

      // Apply transforms
      item.style.transform = `
        translate(-50%, -50%)
        translate3d(${x}px, ${y}px, ${z}px)
        rotateY(${rotationY}deg)
        scale(${scale})
      `;
      item.style.opacity = opacity;
      item.style.zIndex = Math.round(1000 - Math.abs(z));
    });
  }

  // Auto-play functionality
  startAutoPlay() {
    this.resetAutoPlay();
  }

  resetAutoPlay() {
    this.pauseAutoPlay();

    const randomDelay = this.getRandomInt(
      this.config.autoPlayMinInterval,
      this.config.autoPlayMaxInterval,
    );

    this.autoPlayTimeout = setTimeout(() => {
      this.autoNavigate();
    }, randomDelay);
  }

  autoNavigate() {
    // Always move forward by 1 for consistent order
    this.navigate(1);
  }

  pauseAutoPlay() {
    if (this.autoPlayTimeout) {
      clearTimeout(this.autoPlayTimeout);
      this.autoPlayTimeout = null;
    }
  }

  resumeAutoPlay() {
    this.resetAutoPlay();
  }

  // Glitch effects
  startGlitchEffects() {
    const triggerGlitch = () => {
      this.applyRandomGlitch();

      const nextDelay = this.getRandomInt(
        this.config.glitchMinInterval,
        this.config.glitchMaxInterval,
      );

      setTimeout(triggerGlitch, nextDelay);
    };

    const initialDelay = this.getRandomInt(5000, 10000);
    setTimeout(triggerGlitch, initialDelay);
  }

  applyRandomGlitch() {
    const items = this.sphere.querySelectorAll(".holo-carousel-item");
    const glitchTypes = [
      "rgb-split",
      "scanline",
      "pixelate",
      "brightness",
      "combined",
    ];

    const randomType =
      glitchTypes[Math.floor(Math.random() * glitchTypes.length)];

    items.forEach((item) => {
      const imageWrapper = item.querySelector(".holo-carousel-image-wrapper");
      const image = item.querySelector(".holo-carousel-image");

      // Remove all glitch classes
      item.classList.remove("holo-carousel-glitch-active");
      imageWrapper.classList.remove("holo-carousel-glitch-rgb-split");
      image.classList.remove(
        "holo-carousel-pixelate",
        "holo-carousel-brightness-glitch",
      );

      // Apply random glitch
      switch (randomType) {
        case "rgb-split":
          imageWrapper.classList.add("holo-carousel-glitch-rgb-split");
          break;
        case "scanline":
          item.classList.add("holo-carousel-glitch-active");
          break;
        case "pixelate":
          image.classList.add("holo-carousel-pixelate");
          break;
        case "brightness":
          image.classList.add("holo-carousel-brightness-glitch");
          break;
        case "combined":
          item.classList.add("holo-carousel-glitch-active");
          imageWrapper.classList.add("holo-carousel-glitch-rgb-split");
          if (Math.random() > 0.5) {
            image.classList.add("holo-carousel-pixelate");
          }
          break;
      }
    });

    // Remove glitch after duration
    setTimeout(() => {
      items.forEach((item) => {
        const imageWrapper = item.querySelector(".holo-carousel-image-wrapper");
        const image = item.querySelector(".holo-carousel-image");

        item.classList.remove("holo-carousel-glitch-active");
        imageWrapper.classList.remove("holo-carousel-glitch-rgb-split");
        image.classList.remove(
          "holo-carousel-pixelate",
          "holo-carousel-brightness-glitch",
        );
      });
    }, this.config.glitchDuration);
  }

  // Overlay methods
  openOverlay(index) {
    const item = this.items[index];
    const contentInner = this.overlay.querySelector(
      ".holo-carousel-content-inner",
    );

    // Build content HTML
    let html = `
      <h2 class="holo-carousel-content-title">${this.escapeHtml(item.title)}</h2>
      <span class="holo-carousel-content-date">DATE: ${this.escapeHtml(item.date)}</span>
      <p class="holo-carousel-content-description">${this.escapeHtml(item.description)}</p>
      <a href="${this.escapeHtml(item.githubUrl)}" target="_blank" rel="noopener noreferrer" class="holo-carousel-content-github">
        &gt; VIEW ON GITHUB &lt;
      </a>
    `;

    if (item.additionalImages && item.additionalImages.length > 0) {
      html += '<div class="holo-carousel-content-images">';
      item.additionalImages.forEach((imgUrl) => {
        html += `<img src="${this.escapeHtml(imgUrl)}" alt="Project screenshot" class="holo-carousel-content-image">`;
      });
      html += "</div>";
    }

    contentInner.innerHTML = html;

    // Show overlay with glitch animation
    this.overlay.classList.add("holo-carousel-active");
    this.applyOverlayGlitch();

    // Pause auto-play
    this.pauseAutoPlay();
  }

  closeOverlay() {
    this.overlay.classList.remove("holo-carousel-active");

    // Resume auto-play after short delay
    setTimeout(() => {
      this.resumeAutoPlay();
    }, 1000);
  }

  applyOverlayGlitch() {
    const content = this.overlay.querySelector(".holo-carousel-content");
    const title = this.overlay.querySelector(".holo-carousel-content-title");

    // Apply glitch class
    content.style.animation = "holo-carousel-glitch-rgb 0.3s ease";

    setTimeout(() => {
      content.style.animation = "";
    }, 300);
  }

  // Utility methods
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
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Public API for integration
  destroy() {
    this.pauseAutoPlay();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this.container) {
      this.container.innerHTML = "";
    }
  }

  goTo(index) {
    if (index >= 0 && index < this.items.length) {
      const direction = index - this.currentIndex;
      this.navigate(direction);
    }
  }

  next() {
    this.navigate(-1);
  }

  prev() {
    this.navigate(1);
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".holo-carousel-wrapper")) {
      window.hologramCarousel = new HologramCarousel({
        dataUrl: "../resources/jsons/carousel-data.json",
      });
    }
  });
} else {
  if (document.querySelector(".holo-carousel-wrapper")) {
    window.hologramCarousel = new HologramCarousel({
      dataUrl: "../resources/jsons/carousel-data.json",
    });
  }
}
