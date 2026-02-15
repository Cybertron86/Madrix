// ====================================================================================================================================
//  SINGLE PAGE APPLICATION - APP.JS
// ====================================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
  // ====================================================================================================================================
  //  DOM CACHE
  // ====================================================================================================================================

  try {
    const el = document.getElementById("year");
    if (!el) throw new Error("Year element missing");
    el.textContent = new Date().getFullYear().toString();
  } catch (err) {
    console.error("Footer Year Error:", err);
  }

  const navBar = document.getElementById("navigationbar");
  const footerBar = document.getElementById("site-footer");
  const luxBar = document.getElementById("lux-bar");
  const portalOverlay = document.getElementById("portalOverlay");
  const mainContent = document.getElementById("mainContent");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const soundBtn = document.getElementById("soundBtn");
  const ambientBtn = document.getElementById("ambientBtn");
  const menuBtn = document.getElementById("btn_menu");
  const dropdownMenu = document.getElementById("dropdown_menu");
  const loginBtn = document.getElementById("btn_login");
  const canvas = document.getElementById("matrixGlitch");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Navbar, Footer, Luxbar & Buttons if already entered
  if (sessionStorage.getItem("portalEntered") === "true") {
    if (navBar) {
      navBar.style.visibility = "visible";
      navBar.style.opacity = "1";
      navBar.style.pointerEvents = "auto";
    }
    if (footerBar) {
      footerBar.style.visibility = "visible";
      footerBar.style.opacity = "1";
      footerBar.style.pointerEvents = "auto";
    }
    if (soundBtn) {
      soundBtn.style.visibility = "visible";
      soundBtn.style.opacity = "1";
    }
    if (luxBar) {
      luxBar.style.visibility = "visible";
      luxBar.style.opacity = "1";
    }
  }

  // ====================================================================================================================================
  // STATE
  // ====================================================================================================================================
  const hasVisited = sessionStorage.getItem("portalEntered") === "true";
  let musicEnabled = false;
  let ambientEnabled = localStorage.getItem("ambientEnabled") !== "false";
  let audioUnlocked = false;

  // ====================================================================================================================================
  // 3️⃣ AUDIO MODULE
  // ====================================================================================================================================

  const introSound0 = new Audio("resources/sounds/glitch-effect_88bpm.mp3");
  const introSound1 = new Audio(
    "resources/sounds/sisters-and-brothers_C_major.mp3",
  );
  const introSound3 = new Audio("resources/sounds/welcome-to-my-world.mp3");

  const music = new Audio(
    "resources/sounds/glitchy-distorted-flute-lead_125bpm_C_major.mp3",
  );
  music.loop = true;

  const ambientSources = [
    "resources/sounds/respect-to-all-colors_C_minor.mp3",
    "resources/sounds/glossy-fx-unique-crash-leak.mp3",
    "resources/sounds/rpg-sounds-wrong-game-buzz-fx.mp3",
    "resources/sounds/phone-glitch.mp3",
    "resources/sounds/sound-effect-one-shot-beeping_F_.mp3",
    "resources/sounds/turn-off-sfx-glitchy-electronic-sound.mp3",
    "resources/sounds/light-switch-on-or-off-sfx.mp3",
    "resources/sounds/electric-chippy-fx-clicky-error.mp3",
    "resources/sounds/crash-synthetic-obscure-chip.mp3",
  ];

  const ambientPool = ambientSources.map((src) => {
    const a = new Audio(src);
    a.preload = "none";
    return a;
  });

  let currentAmbient = null;
  let ambientTimeout = null;

  function scheduleNextAmbient() {
    if (!ambientEnabled) return;
    const delay = Math.random() * 40000 + 20000;
    ambientTimeout = setTimeout(playRandomAmbient, delay);
  }

  function playRandomAmbient() {
    if (!ambientEnabled) return;

    if (currentAmbient) {
      currentAmbient.pause();
      currentAmbient.currentTime = 0;
    }

    currentAmbient =
      ambientPool[Math.floor(Math.random() * ambientPool.length)];
    currentAmbient.volume = 0.6;
    currentAmbient.play().catch(console.warn);
    currentAmbient.onended = scheduleNextAmbient;
  }

  function startAllSounds() {
    music.play().catch(console.warn);
    musicEnabled = true;
    if (soundBtn) soundBtn.textContent = "🔊";

    setTimeout(() => introSound0.play().catch(console.warn), 200);
    setTimeout(() => introSound1.play().catch(console.warn), 5000);
    setTimeout(() => introSound3.play().catch(console.warn), 8000);
    setTimeout(playRandomAmbient, 10500);
  }

  function unlockAudioOnce() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    const dummy = new Audio();
    dummy.play().catch(() => {});

    if (musicEnabled) music.play().catch(console.warn);
    if (ambientEnabled) playRandomAmbient();

    ["click", "touchstart", "keydown", "scroll"].forEach((e) =>
      window.removeEventListener(e, unlockAudioOnce),
    );
  }

  ["click", "touchstart", "keydown", "scroll"].forEach((e) =>
    window.addEventListener(e, unlockAudioOnce),
  );

  soundBtn?.addEventListener("click", () => {
    musicEnabled ? music.pause() : music.play().catch(console.warn);
    soundBtn.textContent = musicEnabled ? "🔇" : "🔊";
    musicEnabled = !musicEnabled;
  });

  ambientBtn?.addEventListener("click", () => {
    ambientEnabled = !ambientEnabled;
    localStorage.setItem("ambientEnabled", ambientEnabled);
    ambientBtn.textContent = ambientEnabled ? "🔊" : "🔇";

    if (ambientEnabled) playRandomAmbient();
    else {
      if (currentAmbient) currentAmbient.pause();
      clearTimeout(ambientTimeout);
    }
  });

  // ====================================================================================================================================
  //  MATRIX_RAIN MODULE (FULL GLITCH EFFECTS + BROWSER OPTIMIZATIONS)
  // ====================================================================================================================================

  const isEdge = /Edg\//.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && !isEdge;
  const isBrave = navigator.brave !== undefined;
  const isFirefox = /Firefox/.test(navigator.userAgent);

  if (isEdge) document.body.classList.add("edge-browser");
  if (isChrome || isBrave) document.body.classList.add("chrome-browser");
  if (isFirefox) document.body.classList.add("firefox-browser");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars =
    "AアァィゥィウエカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲンAアァィゥィウエカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲン";
  const warningChar = "\u26A0";
  const fullCharSet = chars + warningChar;
  const fontSize = 16;
  let columns, drops;

  function initMatrix() {
    let effectiveFontSize = fontSize;
    if ((isChrome || isBrave || isEdge || isFirefox) && canvas.width > 1920)
      effectiveFontSize = fontSize * 1.8;
    columns = Math.floor(canvas.width / effectiveFontSize);
    drops = Array(columns).fill(1);
  }

  const glitchCanvasCache = [];

  function getGlitchCanvas(width, height) {
    const cached = glitchCanvasCache.find(
      (c) => c.width === width && c.height === height,
    );
    if (cached) return cached;

    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    glitchCanvasCache.push(c);
    if (glitchCanvasCache.length > 5) glitchCanvasCache.shift();
    return c;
  }

  function applyGlitch({ stripes, offsetMax, alpha }) {
    for (let g = 0; g < stripes; g++) {
      const sliceHeight = Math.floor(Math.random() * 5 + 2);
      const y = Math.floor(Math.random() * canvas.height);
      const offset =
        (Math.random() < 0.5 ? -1 : 1) * (Math.random() * offsetMax);

      const tmpCanvas = getGlitchCanvas(canvas.width, sliceHeight);
      const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });

      tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
      tmpCtx.drawImage(
        canvas,
        0,
        y,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );

      ctx.clearRect(0, y, canvas.width, sliceHeight);
      ctx.globalAlpha = alpha;
      ctx.drawImage(tmpCanvas, offset, y);
      ctx.globalAlpha = 1;
    }
  }

  let frame = 0;
  const frameSkip = isChrome || isBrave ? 2 : isEdge ? 1.6 : 1.8;

  function drawMatrix() {
    frame++;
    if (frame % Math.floor(frameSkip) !== 0) {
      requestAnimationFrame(drawMatrix);
      return;
    }

    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const char = fullCharSet[Math.floor(Math.random() * fullCharSet.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      ctx.fillStyle =
        char === warningChar ? "rgba(255,0,0,0.95)" : "rgba(0,255,70,1)";
      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }

    if (Math.random() < (isChrome || isBrave ? 0.02 : isEdge ? 0.15 : 0.08)) {
      applyGlitch({ stripes: 2, offsetMax: 60, alpha: 0.5 });
    }

    requestAnimationFrame(drawMatrix);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initMatrix();
  }

  window.addEventListener("resize", resizeCanvas);

  function triggerShake() {
    canvas.classList.add("shake");
    setTimeout(() => canvas.classList.remove("shake"), 300);
    setTimeout(triggerShake, Math.random() * 5000 + 10000);
  }

  resizeCanvas();
  drawMatrix();
  triggerShake();

  // ====================================================================================================================================
  //   PORTAL + DROPDOWN MODULE
  // ====================================================================================================================================

  function showMainContent() {
    portalOverlay.style.animation = "portalFadeOut 0.8s ease forwards";
    setTimeout(() => {
      portalOverlay.remove();
      mainContent.classList.add("visible");
    }, 800);
  }

  noBtn?.addEventListener("click", () => {
    yesBtn.disabled = noBtn.disabled = true;
    noBtn.classList.add("shake");
    setTimeout(() => noBtn.classList.replace("shake", "fall"), 500);
    setTimeout(() => (yesBtn.disabled = noBtn.disabled = false), 1000);
  });

  yesBtn?.addEventListener("click", () => {
    sessionStorage.setItem("portalEntered", "true");
    yesBtn.disabled = noBtn.disabled = true;

    const text = yesBtn.textContent.trim();
    yesBtn.textContent = "";

    [...text].forEach((char, i) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.classList.add("falling-char");
      const rect = yesBtn.getBoundingClientRect();
      span.style.position = "absolute";
      span.style.left = `${rect.left + i * 16}px`;
      span.style.top = `${rect.top}px`;
      span.style.animationDelay = `${i * 0.15}s`;
      document.body.appendChild(span);
    });

    const totalDuration = text.length * 150 + 1200;

    setTimeout(() => {
      if (navBar) {
        navBar.style.visibility = "visible";
        navBar.style.opacity = "1";
        navBar.style.pointerEvents = "auto";
      }
      if (footerBar) {
        footerBar.style.visibility = "visible";
        footerBar.style.opacity = "1";
        footerBar.style.pointerEvents = "auto";
      }
      if (soundBtn) {
        soundBtn.style.visibility = "visible";
        soundBtn.style.opacity = "1";
      }
      if (luxBar) {
        luxBar.style.visibility = "visible";
        luxBar.style.opacity = "1";
      }
    }, totalDuration + 500);

    startAllSounds();
    setTimeout(showMainContent, totalDuration);
  });

  if (hasVisited) {
    portalOverlay?.remove();
    mainContent.classList.add("visible");
    if (soundBtn) {
      soundBtn.textContent = "🔇";
      soundBtn.style.visibility = "visible";
      soundBtn.style.opacity = "1";
    }
  }

  if (menuBtn && dropdownMenu) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("open");
      menuBtn.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove("open");
        menuBtn.classList.remove("active");
      }
    });

    // Event Listener für Dropdown-Buttons
    dropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const action = e.target.getAttribute("data-action");

        switch (action) {
          case "about":
            console.log("About me clicked");
            openAboutModal();
            break;
          case "gallery":
            console.log("Gallery clicked");
            openGalleryModal(footerBar);
            break;
          case "profile":
            console.log("Profil clicked");
            break;
        }

        // Dropdown schließen nach Klick
        dropdownMenu.classList.remove("open");
        menuBtn.classList.remove("active");
      });
    });
  }

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

  // ====================================================================================================================================
  //  ABOUT ME MODAL MODULE
  // ====================================================================================================================================

  let aboutModal = null;

  function createAboutModal() {
    if (aboutModal) return;

    aboutModal = document.createElement("div");
    aboutModal.className = "about-modal";
    aboutModal.innerHTML = `
      <div class="about-modal-container">
        <button class="about-modal-close" aria-label="Close About">×</button>
        <h2 class="about-modal-title">ABOUT ME</h2>
        <div class="about-modal-content">
          <div class="about-modal-text">
            <!-- Typewriter text will be injected here -->
          </div>
        </div>
        <button class="about-scroll-bottom" aria-label="Scroll to bottom"></button>
      </div>
    `;

    document.body.appendChild(aboutModal);

    // Close button event
    const closeBtn = aboutModal.querySelector(".about-modal-close");
    closeBtn.addEventListener("click", closeAboutModal);

    // Click outside to close
    aboutModal.addEventListener("click", (e) => {
      if (e.target === aboutModal) {
        closeAboutModal();
      }
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && aboutModal.classList.contains("active")) {
        closeAboutModal();
      }
    });

    // Scroll to bottom button
    const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");
    scrollBottomBtn.addEventListener("click", () => {
      const contentContainer = aboutModal.querySelector(".about-modal-content");
      contentContainer.scrollTo({
        top: contentContainer.scrollHeight,
        behavior: "smooth",
      });
      // Re-enable auto-scroll
      window.aboutAutoScroll = true;
    });
  }

  function openAboutModal() {
    createAboutModal();

    setTimeout(() => {
      aboutModal.classList.add("active");
      // Start typewriter effect after modal animation
      setTimeout(() => {
        startTypewriter();
      }, 300);
    }, 10);
  }

  function closeAboutModal() {
    if (!aboutModal) return;
    aboutModal.classList.remove("active");
  }

  function startTypewriter() {
    const textContainer = aboutModal.querySelector(".about-modal-text");
    const contentContainer = aboutModal.querySelector(".about-modal-content");
    const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");

    const paragraphs = [
      "Hello <strong>stranger</strong>,",

      "My name is <strong>Benjamin Tron</strong>, a software and web developer based in Karlsruhe, Germany. My professional journey began in a hands-on world: from 2002 to 2006, I trained as an industrial mechanic, learning precision, structure, and how complex systems truly work beneath the surface.",

      "Years later, curiosity pulled me deeper into the digital realm. Between 2022 and 2024, I completed a 24-month career transition and earned an IHK qualification as a Computer Science Expert, specializing in software development. To further sharpen my skills, I pursued an intensive 10-month web development program from 2025 to 2026.",

      "Today, I'm passionate about full-stack development, building software that connects logic and creativity, backend robustness and frontend experience. I enjoy understanding how things work end to end, from databases and APIs to clean interfaces and thoughtful user interactions.",

      "I'm driven by curiosity, continuous learning, and a quiet fascination with solving problems that aren't always obvious at first glance. Some details reveal themselves instantly, others only after you look a little closer.",
    ];

    // Clear existing content
    textContainer.innerHTML = "";
    textContainer.classList.add("typing");

    // Auto-scroll control
    window.aboutAutoScroll = true;
    let isTyping = true;

    // Check if user is at bottom
    function isAtBottom() {
      const threshold = 50; // pixels from bottom
      return (
        contentContainer.scrollHeight -
          contentContainer.scrollTop -
          contentContainer.clientHeight <
        threshold
      );
    }

    // Scroll event listener - detect manual scroll
    contentContainer.addEventListener("scroll", () => {
      if (!isTyping) return;

      if (isAtBottom()) {
        window.aboutAutoScroll = true;
        scrollBottomBtn.classList.remove("visible");
      } else {
        window.aboutAutoScroll = false;
        scrollBottomBtn.classList.add("visible", "pulse");
      }
    });

    let currentParagraph = 0;
    let currentChar = 0;
    let currentP = null;

    function typeNextChar() {
      // Check if modal is still open
      if (!aboutModal.classList.contains("active")) {
        textContainer.classList.remove("typing");
        isTyping = false;
        scrollBottomBtn.classList.remove("visible", "pulse");
        return;
      }

      // Start new paragraph
      if (currentChar === 0) {
        currentP = document.createElement("p");
        currentP.style.opacity = "1";
        textContainer.appendChild(currentP);
      }

      const fullText = paragraphs[currentParagraph];

      // Type character by character
      if (currentChar < fullText.length) {
        // Handle HTML tags
        if (fullText[currentChar] === "<") {
          const closingTag = fullText.indexOf(">", currentChar);
          const tag = fullText.substring(currentChar, closingTag + 1);
          currentP.innerHTML += tag;
          currentChar = closingTag + 1;
        } else {
          currentP.innerHTML += fullText[currentChar];
          currentChar++;
        }

        // Auto-scroll to bottom only if enabled
        if (window.aboutAutoScroll) {
          contentContainer.scrollTop = contentContainer.scrollHeight;
        }

        // Continue typing
        setTimeout(typeNextChar, 25);
      } else {
        // Move to next paragraph
        currentParagraph++;
        currentChar = 0;

        if (currentParagraph < paragraphs.length) {
          setTimeout(typeNextChar, 200);
        } else {
          // Finished typing all paragraphs
          textContainer.classList.remove("typing");
          isTyping = false;
          scrollBottomBtn.classList.remove("pulse");

          // Hide button if at bottom
          if (isAtBottom()) {
            scrollBottomBtn.classList.remove("visible");
          }
        }
      }
    }

    typeNextChar();
  }

  // ====================================================================================================================================
  //  LOGIN MODAL MODULE
  // ====================================================================================================================================

  let loginModal = null;

  function createLoginModal() {
    if (loginModal) return;

    loginModal = document.createElement("div");
    loginModal.className = "login-modal";
    loginModal.innerHTML = `
      <div class="login-modal-container">
        <button class="login-modal-close" aria-label="Close Login">×</button>
        <h2 class="login-modal-title">LOGIN</h2>
        
        <form class="login-form" id="loginForm" novalidate>
          <!-- Username Field -->
          <div class="login-form-group">
            <label for="login-username" class="login-form-label">Username</label>
            <div class="login-form-input-wrapper">
              <input 
                type="text" 
                id="login-username" 
                class="login-form-input" 
                placeholder="Enter username"
                autocomplete="username"
                required
              >
            </div>
            <div class="login-error-message" data-error="username"></div>
          </div>

          <!-- Password Field-->
          <div class="login-form-group">
            <label for="login-password" class="login-form-label">Password</label>
            <div class="login-form-input-wrapper">
              <input 
                type="password" 
                id="login-password" 
                class="login-form-input" 
                placeholder="Enter password"
                autocomplete="current-password"
                required
              >
              <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>
            <div class="password-strength">
              <div class="password-strength-bar"></div>
              <div class="password-strength-bar"></div>
              <div class="password-strength-bar"></div>
              <div class="password-strength-bar"></div>
            </div>
            <div class="login-error-message" data-error="password"></div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="login-submit-btn">
            <span style="position: relative; z-index: 1;">Login</span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="login-register-link">
          Not registered yet?
          <button type="button" class="login-register-btn">
            👉 Register here 👈
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(loginModal);

    // Get elements
    const closeBtn = loginModal.querySelector(".login-modal-close");
    const form = loginModal.querySelector("#loginForm");
    const usernameInput = loginModal.querySelector("#login-username");
    const passwordInput = loginModal.querySelector("#login-password");
    const passwordToggle = loginModal.querySelector(".password-toggle");
    const registerBtn = loginModal.querySelector(".login-register-btn");

    // Close button
    closeBtn.addEventListener("click", closeLoginModal);

    // Click outside to close
    loginModal.addEventListener("click", (e) => {
      if (e.target === loginModal) {
        closeLoginModal();
      }
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && loginModal.classList.contains("active")) {
        closeLoginModal();
      }
    });

    // Password toggle
    passwordToggle.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      passwordToggle.textContent = type === "password" ? "👁️" : "🙈";
    });

    // Real-time validation
    usernameInput.addEventListener("input", () =>
      validateUsername(usernameInput),
    );
    passwordInput.addEventListener("input", () =>
      validatePassword(passwordInput),
    );

    // Form submission
    form.addEventListener("submit", handleLoginSubmit);

    // Register button
    // Register button
    registerBtn.addEventListener("click", () => {
      closeLoginModal();
      setTimeout(() => {
        openRegisterModal();
      }, 400);
    });
  }

  function openLoginModal() {
    createLoginModal();

    setTimeout(() => {
      loginModal.classList.add("active");
    }, 10);
  }

  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.classList.remove("active");

    // Reset form
    const form = loginModal.querySelector("#loginForm");
    if (form) {
      form.reset();
      clearValidationErrors();
    }
  }

  function validateUsername(input) {
    const value = input.value.trim();
    const errorDiv = loginModal.querySelector('[data-error="username"]');

    // Clear previous state
    input.classList.remove("error", "success");
    errorDiv.classList.remove("show");

    if (value === "") {
      return false;
    }

    if (value.length < 3) {
      showError(input, errorDiv, "Username must be at least 3 characters");
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      showError(input, errorDiv, "Only letters, numbers, - and _ allowed");
      return false;
    }

    input.classList.add("success");
    return true;
  }

  function validatePassword(input) {
    const value = input.value;
    const errorDiv = loginModal.querySelector('[data-error="password"]');
    const strengthBars = loginModal.querySelectorAll(".password-strength-bar");

    // Clear previous state
    input.classList.remove("error", "success");
    errorDiv.classList.remove("show");
    strengthBars.forEach((bar) => {
      bar.classList.remove("active", "weak", "medium", "strong");
    });

    if (value === "") {
      return false;
    }

    // Check length
    if (value.length < 12) {
      showError(input, errorDiv, "Password must be at least 12 characters");
      updatePasswordStrength(strengthBars, 1, "weak");
      return false;
    }

    // Check for uppercase
    if (!/[A-Z]/.test(value)) {
      showError(input, errorDiv, "Password must contain an uppercase letter");
      updatePasswordStrength(strengthBars, 1, "weak");
      return false;
    }

    // Check for lowercase
    if (!/[a-z]/.test(value)) {
      showError(input, errorDiv, "Password must contain a lowercase letter");
      updatePasswordStrength(strengthBars, 2, "weak");
      return false;
    }

    // Check for number
    if (!/[0-9]/.test(value)) {
      showError(input, errorDiv, "Password must contain a number");
      updatePasswordStrength(strengthBars, 2, "medium");
      return false;
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      showError(input, errorDiv, "Password must contain a special character");
      updatePasswordStrength(strengthBars, 3, "medium");
      return false;
    }

    // All checks passed
    input.classList.add("success");
    updatePasswordStrength(strengthBars, 4, "strong");
    return true;
  }

  function showError(input, errorDiv, message) {
    input.classList.add("error");
    errorDiv.textContent = message;
    errorDiv.classList.add("show");
  }

  function updatePasswordStrength(bars, count, strength) {
    for (let i = 0; i < count; i++) {
      bars[i].classList.add("active", strength);
    }
  }

  function clearValidationErrors() {
    const inputs = loginModal.querySelectorAll(".login-form-input");
    const errors = loginModal.querySelectorAll(".login-error-message");
    const strengthBars = loginModal.querySelectorAll(".password-strength-bar");

    inputs.forEach((input) => input.classList.remove("error", "success"));
    errors.forEach((error) => error.classList.remove("show"));
    strengthBars.forEach((bar) =>
      bar.classList.remove("active", "weak", "medium", "strong"),
    );
  }

  function handleLoginSubmit(e) {
    e.preventDefault();

    const usernameInput = loginModal.querySelector("#login-username");
    const passwordInput = loginModal.querySelector("#login-password");

    const isUsernameValid = validateUsername(usernameInput);
    const isPasswordValid = validatePassword(passwordInput);

    if (isUsernameValid && isPasswordValid) {
      console.log("Login successful!");
      console.log("Username:", usernameInput.value);
      console.log("Password:", passwordInput.value);

      // TODO: Send to backend API
      // Example:
      // fetch('/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     username: usernameInput.value,
      //     password: passwordInput.value
      //   })
      // });

      closeLoginModal();
    } else {
      console.log("Validation failed");
    }
  }

  // Login button event listener
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      openLoginModal();
    });
  }

  // ====================================================================================================================================
  //  REGISTER MODAL MODULE
  // ====================================================================================================================================

  let registerModal = null;

  function createRegisterModal() {
    if (registerModal) return;

    registerModal = document.createElement("div");
    registerModal.className = "register-modal";
    registerModal.innerHTML = `
      <div class="register-modal-container">
        <button class="register-modal-close" aria-label="Close Register">×</button>
        <h2 class="register-modal-title">REGISTER</h2>
        
        <form class="register-form" id="registerForm" novalidate>
          <!-- Username Field -->
          <div class="register-form-group">
            <label for="register-username" class="register-form-label">Username</label>
            <div class="register-form-input-wrapper">
              <input 
                type="text" 
                id="register-username" 
                class="register-form-input" 
                placeholder="Choose username"
                autocomplete="username"
                required
              >
            </div>
            <div class="register-error-message" data-error="username"></div>
          </div>

          <!-- Password Field -->
          <div class="register-form-group">
            <label for="register-password" class="register-form-label">Password</label>
            <div class="register-form-input-wrapper">
              <input 
                type="password" 
                id="register-password" 
                class="register-form-input" 
                placeholder="Create password"
                autocomplete="new-password"
                required
              >
              <button type="button" class="register-password-toggle" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>
            <div class="register-password-strength">
              <div class="register-password-strength-bar"></div>
              <div class="register-password-strength-bar"></div>
              <div class="register-password-strength-bar"></div>
              <div class="register-password-strength-bar"></div>
            </div>
            <div class="register-error-message" data-error="password"></div>
          </div>

          <!-- Confirm Password Field -->
          <div class="register-form-group">
            <label for="register-password-confirm" class="register-form-label">Confirm Password</label>
            <div class="register-form-input-wrapper">
              <input 
                type="password" 
                id="register-password-confirm" 
                class="register-form-input" 
                placeholder="Confirm password"
                autocomplete="new-password"
                required
              >
              <button type="button" class="register-password-toggle-confirm" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>
            <div class="register-error-message" data-error="password-confirm"></div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="register-submit-btn">
            <span style="position: relative; z-index: 1;">Register</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="register-login-link">
          Already have an account?
          <button type="button" class="register-login-btn">
            👉 Login here 👈
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(registerModal);

    // Get elements
    const closeBtn = registerModal.querySelector(".register-modal-close");
    const form = registerModal.querySelector("#registerForm");
    const usernameInput = registerModal.querySelector("#register-username");
    const passwordInput = registerModal.querySelector("#register-password");
    const passwordConfirmInput = registerModal.querySelector(
      "#register-password-confirm",
    );
    const passwordToggle = registerModal.querySelector(
      ".register-password-toggle",
    );
    const passwordToggleConfirm = registerModal.querySelector(
      ".register-password-toggle-confirm",
    );
    const loginBtn = registerModal.querySelector(".register-login-btn");

    // Close button
    closeBtn.addEventListener("click", closeRegisterModal);

    // Click outside to close
    registerModal.addEventListener("click", (e) => {
      if (e.target === registerModal) {
        closeRegisterModal();
      }
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && registerModal.classList.contains("active")) {
        closeRegisterModal();
      }
    });

    // Password toggles
    passwordToggle.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      passwordToggle.textContent = type === "password" ? "👁️" : "🙈";
    });

    passwordToggleConfirm.addEventListener("click", () => {
      const type =
        passwordConfirmInput.type === "password" ? "text" : "password";
      passwordConfirmInput.type = type;
      passwordToggleConfirm.textContent = type === "password" ? "👁️" : "🙈";
    });

    // Real-time validation
    usernameInput.addEventListener("input", () =>
      validateRegisterUsername(usernameInput),
    );
    passwordInput.addEventListener("input", () => {
      validateRegisterPassword(passwordInput);
      validatePasswordMatch(passwordInput, passwordConfirmInput);
    });
    passwordConfirmInput.addEventListener("input", () =>
      validatePasswordMatch(passwordInput, passwordConfirmInput),
    );

    // Form submission
    form.addEventListener("submit", handleRegisterSubmit);

    // Login button
    loginBtn.addEventListener("click", () => {
      closeRegisterModal();
      setTimeout(() => {
        openLoginModal();
      }, 400);
    });
  }

  function openRegisterModal() {
    createRegisterModal();

    setTimeout(() => {
      registerModal.classList.add("active");
    }, 10);
  }

  function closeRegisterModal() {
    if (!registerModal) return;
    registerModal.classList.remove("active");

    // Reset form
    const form = registerModal.querySelector("#registerForm");
    if (form) {
      form.reset();
      clearRegisterValidationErrors();
    }
  }

  function validateRegisterUsername(input) {
    const value = input.value.trim();
    const errorDiv = registerModal.querySelector('[data-error="username"]');

    input.classList.remove("error", "success");
    errorDiv.classList.remove("show");

    if (value === "") {
      return false;
    }

    if (value.length < 3) {
      showRegisterError(
        input,
        errorDiv,
        "Username must be at least 3 characters",
      );
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      showRegisterError(
        input,
        errorDiv,
        "Only letters, numbers, - and _ allowed",
      );
      return false;
    }

    input.classList.add("success");
    return true;
  }

  function validateRegisterPassword(input) {
    const value = input.value;
    const errorDiv = registerModal.querySelector('[data-error="password"]');
    const strengthBars = registerModal.querySelectorAll(
      ".register-password-strength-bar",
    );

    input.classList.remove("error", "success");
    errorDiv.classList.remove("show");
    strengthBars.forEach((bar) => {
      bar.classList.remove("active", "weak", "medium", "strong");
    });

    if (value === "") {
      return false;
    }

    if (value.length < 12) {
      showRegisterError(
        input,
        errorDiv,
        "Password must be at least 12 characters",
      );
      updateRegisterPasswordStrength(strengthBars, 1, "weak");
      return false;
    }

    if (!/[A-Z]/.test(value)) {
      showRegisterError(
        input,
        errorDiv,
        "Password must contain an uppercase letter",
      );
      updateRegisterPasswordStrength(strengthBars, 1, "weak");
      return false;
    }

    if (!/[a-z]/.test(value)) {
      showRegisterError(
        input,
        errorDiv,
        "Password must contain a lowercase letter",
      );
      updateRegisterPasswordStrength(strengthBars, 2, "weak");
      return false;
    }

    if (!/[0-9]/.test(value)) {
      showRegisterError(input, errorDiv, "Password must contain a number");
      updateRegisterPasswordStrength(strengthBars, 2, "medium");
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      showRegisterError(
        input,
        errorDiv,
        "Password must contain a special character",
      );
      updateRegisterPasswordStrength(strengthBars, 3, "medium");
      return false;
    }

    input.classList.add("success");
    updateRegisterPasswordStrength(strengthBars, 4, "strong");
    return true;
  }

  function validatePasswordMatch(passwordInput, confirmInput) {
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const errorDiv = registerModal.querySelector(
      '[data-error="password-confirm"]',
    );

    confirmInput.classList.remove("error", "success");
    errorDiv.classList.remove("show");

    if (confirm === "") {
      return false;
    }

    if (password !== confirm) {
      showRegisterError(confirmInput, errorDiv, "Passwords do not match");
      return false;
    }

    confirmInput.classList.add("success");
    return true;
  }

  function showRegisterError(input, errorDiv, message) {
    input.classList.add("error");
    errorDiv.textContent = message;
    errorDiv.classList.add("show");
  }

  function updateRegisterPasswordStrength(bars, count, strength) {
    for (let i = 0; i < count; i++) {
      bars[i].classList.add("active", strength);
    }
  }

  function clearRegisterValidationErrors() {
    const inputs = registerModal.querySelectorAll(".register-form-input");
    const errors = registerModal.querySelectorAll(".register-error-message");
    const strengthBars = registerModal.querySelectorAll(
      ".register-password-strength-bar",
    );

    inputs.forEach((input) => input.classList.remove("error", "success"));
    errors.forEach((error) => error.classList.remove("show"));
    strengthBars.forEach((bar) =>
      bar.classList.remove("active", "weak", "medium", "strong"),
    );
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();

    const usernameInput = registerModal.querySelector("#register-username");
    const passwordInput = registerModal.querySelector("#register-password");
    const passwordConfirmInput = registerModal.querySelector(
      "#register-password-confirm",
    );

    const isUsernameValid = validateRegisterUsername(usernameInput);
    const isPasswordValid = validateRegisterPassword(passwordInput);
    const isPasswordMatchValid = validatePasswordMatch(
      passwordInput,
      passwordConfirmInput,
    );

    if (isUsernameValid && isPasswordValid && isPasswordMatchValid) {
      console.log("Registration successful!");
      console.log("Username:", usernameInput.value);
      console.log("Password:", passwordInput.value);

      // TODO: Send to backend API
      // Example:
      // fetch('/api/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     username: usernameInput.value,
      //     password: passwordInput.value
      //   })
      // });

      closeRegisterModal();
    } else {
      console.log("Validation failed");
    }
  }
});
