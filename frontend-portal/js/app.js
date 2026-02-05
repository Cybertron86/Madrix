// ====================================================================================================================================
// 🎯 SINGLE PAGE APPLICATION - APP.JS
// ====================================================================================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ====================================================================================================================================
  // 1️⃣ DOM CACHE
  // ====================================================================================================================================

  const navBar = document.getElementById("navigationbar");
  const portalOverlay = document.getElementById("portalOverlay");
  const mainContent = document.getElementById("mainContent");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const soundBtn = document.getElementById("soundBtn");
  const ambientBtn = document.getElementById("ambientBtn");
  const menuBtn = document.getElementById("btn_menu");
  const dropdownMenu = document.getElementById("dropdown_menu");
  const canvas = document.getElementById("matrixGlitch");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Navbar if already entered
  if (sessionStorage.getItem("portalEntered") === "true" && navBar) {
    navBar.style.visibility = "visible";
    navBar.style.opacity = "1";
    navBar.style.pointerEvents = "auto";
  }

  // ====================================================================================================================================
  // 2️⃣ STATE
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
  // 4️⃣ MATRIX MODULE (FULL GLITCH + BROWSER OPTIMIZATIONS)
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
    "Aアァイ0ィウエカ1キクケコ2サシスセ3ソハミヒ4イウシ5ナモニサ6ワツオリ7アホテマ8ケメエカ9キムXユラセYネスタZヌヘAアァイ0ィウエカ1キクケコ2サシスセ3ソハミヒ4イウシ5ナモニサ6ワツオリ7アホテマ8ケメエカ9キムXユラセYネスタZヌヘ";
  const warningChar = "\u26A0";
  const fullCharSet = chars + warningChar;
  const fontSize = 16;
  let columns, drops;

  function initMatrix() {
    let effectiveFontSize = fontSize;
    if ((isChrome || isBrave) && canvas.width > 1920)
      effectiveFontSize = fontSize * 1.5;
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
  const frameSkip = isChrome || isBrave ? 2 : isEdge ? 1.1 : 1.15;

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

    if (Math.random() < (isChrome || isBrave ? 0.05 : isEdge ? 0.08 : 0.3)) {
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
  // 5️⃣ PORTAL + DROPDOWN MODULE
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
    }, totalDuration + 500);

    startAllSounds();
    setTimeout(showMainContent, totalDuration);
  });

  if (hasVisited) {
    portalOverlay?.remove();
    mainContent.classList.add("visible");
    if (soundBtn) soundBtn.textContent = "🔇";
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

    dropdownMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", () => {
        dropdownMenu.classList.remove("open");
        menuBtn.classList.remove("active");
      });
    });
  }
});
