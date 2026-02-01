// ====================================================================================================================================
// ====================================================================================================================================
// 🎯 SINGLE PAGE APPLICATION - APP.JS
// ====================================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
  const navBar = document.getElementById("navigationbar");

  if (!navBar) return;

  const hasEntered = sessionStorage.getItem("portalEntered");

  if (hasEntered === "true") {
    navBar.style.visibility = "visible";
    navBar.style.opacity = "1";
    navBar.style.pointerEvents = "auto";
  }
});
// ====================================================================================================================================
// ====================================================================================================================================
// 1️⃣ INITIALIZATION & STATE MANAGEMENT
// ====================================================================================================================================
// ====================================================================================================================================

const hasVisited = sessionStorage.getItem("portalEntered") === "true";

// DOM Elements
const portalOverlay = document.getElementById("portalOverlay");
const mainContent = document.getElementById("mainContent");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const soundBtn = document.getElementById("soundBtn");
const ambientBtn = document.getElementById("ambientBtn");

// ====================================================================================================================================
// ====================================================================================================================================
// 2️⃣ AUDIO SETUP
// ====================================================================================================================================
// ====================================================================================================================================

const introSound0 = new Audio("resources/sounds/glitch-effect_88bpm.mp3");
introSound0.preload = "none";

const introSound1 = new Audio(
  "resources/sounds/sisters-and-brothers_C_major.mp3",
);
introSound1.preload = "none";

const introSound3 = new Audio("resources/sounds/welcome-to-my-world.mp3");
introSound3.preload = "none";

const ambientSound = new Audio(
  "resources/sounds/respect-to-all-colors_C_minor.mp3",
);
ambientSound.preload = "none";

const music = new Audio(
  "resources/sounds/glitchy-distorted-flute-lead_125bpm_C_major.mp3",
);
music.loop = true;
music.preload = "none";

let ambientEnabled = true;
let musicEnabled = false;

// ====================================================================================================================================
// ====================================================================================================================================
// 3️⃣ MATRIX BACKGROUND SETUP
// ====================================================================================================================================
// ====================================================================================================================================

const isEdge = /Edg\//.test(navigator.userAgent);
const isChrome =
  /Chrome/.test(navigator.userAgent) && !/Edg\//.test(navigator.userAgent);
const isBrave = navigator.brave !== undefined;
const isFirefox = /Firefox/.test(navigator.userAgent);

if (isEdge) document.body.classList.add("edge-browser");
if (isChrome || isBrave) document.body.classList.add("chrome-browser");
if (isFirefox) document.body.classList.add("firefox-browser");

const canvas = document.getElementById("matrixGlitch");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars =
  "Aアァイ0ィウエカ1キクケコ2サシスセ3ソハミヒ4イウシ5ナモニサ6ワツオリ7アホテマ8ケメエカ9キムXユラセYネスタZヌヘAアァイ0ィウエカ1キクケコ2サシスセ3ソハミヒ4イウシ5ナモニサ6ワツオリ7アホテマ8ケメエカ9キムXユラセYネスタZヌヘ";
const warningChar = "\u26A0";
const fullCharSet = chars + warningChar;

const fontSize = 16;
let columns;
let drops;

function initMatrix() {
  // Reduziere Spalten für bessere Performance auf Chrome/Brave
  let effectiveFontSize = fontSize;
  if ((isChrome || isBrave) && canvas.width > 1920) {
    effectiveFontSize = fontSize * 1.5; // Weniger Spalten auf großen Displays
  }

  columns = Math.floor(canvas.width / effectiveFontSize);
  drops = Array(columns).fill(1);
}

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 150);
});

let frame = 0;
const frameSkip = isChrome || isBrave ? 2 : isEdge ? 1.5 : 1.15;
let initialRowsDrawn = false;

function drawInitialRows() {
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = fontSize + "px monospace";

  // Text-Rendering Optimierung
  ctx.textBaseline = "top";
  ctx.textRendering = "optimizeSpeed";

  for (let i = 0; i < columns; i++) {
    for (let row = 0; row < 2; row++) {
      const char = fullCharSet.charAt(
        Math.floor(Math.random() * fullCharSet.length),
      );
      const x = i * fontSize;
      const y = (row + 1) * fontSize;
      ctx.fillStyle = "rgba(0, 255, 70, 1)";
      ctx.fillText(char, x, y);
    }
  }
}

function drawMatrix() {
  const glitchSettings = {
    frequency: isChrome || isBrave ? 0.05 : isEdge ? 0.08 : 0.3,
    stripes: isChrome || isBrave ? 1 : isEdge ? 2 : 3,
    offsetMax: isChrome || isBrave ? 40 : isEdge ? 50 : 80,
    alpha: isChrome || isBrave ? 0.3 : isEdge ? 0.4 : 0.8,
  };

  if (!initialRowsDrawn) {
    drawInitialRows();
    initialRowsDrawn = true;
  }

  frame++;
  if (frame % Math.floor(frameSkip) !== 0) {
    requestAnimationFrame(drawMatrix);
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const char = fullCharSet.charAt(
      Math.floor(Math.random() * fullCharSet.length),
    );
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    if (Math.random() < 0.04) continue;

    if (char === warningChar && frame > 60) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.95)";
    } else {
      ctx.fillStyle = "rgba(0, 255, 70, 1)";
    }

    ctx.fillText(char, x, y);

    // Weniger RGB-Split für Chrome/Brave
    if (Math.random() < (isChrome || isBrave ? 0.03 : 0.1)) {
      const offset = 4 + Math.random() * 2;
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.fillText(char, x - offset, y);
      ctx.fillStyle = "rgba(0,0,255,0.3)";
      ctx.fillText(char, x + offset, y);
    }

    if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }

  if (Math.random() < glitchSettings.frequency) {
    applyGlitch(glitchSettings);
  }

  requestAnimationFrame(drawMatrix);
}

// Cache für temporäre Canvas-Elemente (Performance)
const glitchCanvasCache = [];
function getGlitchCanvas(width, height) {
  const cached = glitchCanvasCache.find(
    (c) => c.width === width && c.height === height,
  );
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  glitchCanvasCache.push(canvas);

  // Max 5 gecachte Canvas
  if (glitchCanvasCache.length > 5) glitchCanvasCache.shift();

  return canvas;
}

function applyGlitch({ stripes, offsetMax, alpha }) {
  for (let g = 0; g < stripes; g++) {
    const sliceHeight = Math.floor(Math.random() * 5 + 2);
    const y = Math.floor(Math.random() * canvas.height);
    const offset = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * offsetMax);

    // Verwende gecachtes Canvas
    const tmpCanvas = getGlitchCanvas(canvas.width, sliceHeight);
    const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });

    // Kopiere Slice direkt ohne getImageData (schneller)
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

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initMatrix();
  initialRowsDrawn = false;
}

// ====================================================================================================================================
// ====================================================================================================================================
// 4️⃣ AUDIO CONTROL FUNCTIONS
// ====================================================================================================================================
// ====================================================================================================================================

function playRandomAmbient() {
  if (!ambientEnabled) return;
  ambientSound.currentTime = 0;
  ambientSound.play().catch(console.warn);
  ambientSound.onended = () => {
    if (ambientEnabled) {
      const delay = Math.random() * 30000 + 15000;
      setTimeout(playRandomAmbient, delay);
    }
  };
}

function startAllSounds() {
  // Background Music
  music.play().catch(console.warn);
  musicEnabled = true;
  soundBtn.textContent = "🔊";

  // Intro Sounds mit Verzögerung
  setTimeout(() => {
    introSound0.play().catch(console.warn);
  }, 200);

  setTimeout(() => {
    introSound1.play().catch(console.warn);
  }, 2000);

  setTimeout(() => {
    introSound3.play().catch(console.warn);
  }, 5000);

  // Ambient Sound
  setTimeout(() => {
    playRandomAmbient();
  }, 8000);
}

// Sound Button Toggle
soundBtn.addEventListener("click", () => {
  if (musicEnabled) {
    music.pause();
    soundBtn.textContent = "🔇";
  } else {
    music.play().catch(console.warn);
    soundBtn.textContent = "🔊";
  }
  musicEnabled = !musicEnabled;
});

// Ambient Button Toggle
ambientBtn.addEventListener("click", () => {
  ambientEnabled = !ambientEnabled;
  ambientBtn.textContent = ambientEnabled ? "🔊" : "🔇";
  if (ambientEnabled) {
    playRandomAmbient();
  } else {
    ambientSound.pause();
    ambientSound.currentTime = 0;
  }
});

// ====================================================================================================================================
// ====================================================================================================================================
// 5️⃣ INTRO PORTAL LOGIC
// ====================================================================================================================================
// ====================================================================================================================================

function showMainContent() {
  // Fade out Portal Overlay
  portalOverlay.style.animation = "portalFadeOut 0.8s ease forwards";

  setTimeout(() => {
    portalOverlay.remove();
    mainContent.classList.add("visible");
  }, 800);
}

// NO Button - Shake Animation
if (noBtn) {
  noBtn.addEventListener("click", () => {
    yesBtn.disabled = true;
    noBtn.disabled = true;
    noBtn.classList.add("shake");

    setTimeout(() => {
      noBtn.classList.remove("shake");
      noBtn.classList.add("fall");
    }, 500);

    setTimeout(() => {
      yesBtn.disabled = false;
      noBtn.disabled = false;
    }, 1000);
  });
}

// YES Button - Enter Portal
if (yesBtn) {
  yesBtn.addEventListener("click", () => {
    sessionStorage.setItem("portalEntered", "true");

    yesBtn.disabled = true;
    noBtn.disabled = true;

    // Falling Letter Animation
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
      span.style.marginLeft = "0.5em";
      span.style.marginTop = "1em";
      span.style.animationDelay = `${i * 0.15}s`;
      document.body.appendChild(span);
    });

    const totalDuration = text.length * 150 + 1200;

    // Make Navigation Bar Visible
    const navBar = document.getElementById("navigationbar");

    setTimeout(() => {
      if (!navBar) {
        console.error("Navbar nicht gefunden");
        return;
      }

      navBar.style.visibility = "visible";
      navBar.style.opacity = "1";
      navBar.style.pointerEvents = "auto";
    }, totalDuration + 500);

    // Start Sounds
    startAllSounds();

    // Show Main Content
    setTimeout(() => {
      showMainContent();
    }, totalDuration);
  });
}

// ====================================================================================================================================
// ====================================================================================================================================
// 6️⃣ CHECK IF ALREADY VISITED
// ====================================================================================================================================
// ====================================================================================================================================

if (hasVisited) {
  // User hat bereits besucht - zeige direkt Main Content
  if (portalOverlay) {
    portalOverlay.style.display = "none";
  }
  mainContent.classList.add("visible");
  soundBtn.textContent = "🔇";
} else {
  // Erste Besuch - zeige Intro
  if (portalOverlay) {
    portalOverlay.style.display = "flex";
  }
}

// ====================================================================================================================================
// ====================================================================================================================================
// 7️⃣ SHAKE EFFECT FOR CANVAS
// ====================================================================================================================================
// ====================================================================================================================================

function triggerShake() {
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 300);
  const nextShake = Math.random() * 5000 + 10000;
  setTimeout(triggerShake, nextShake);
}

// ====================================================================================================================================
// ====================================================================================================================================
// 8️⃣ START MATRIX ANIMATION
// ====================================================================================================================================
// ====================================================================================================================================

resizeCanvas();
drawMatrix();
triggerShake(); // ← Shake-Effekt starten

// ====================================================================================================================================
// ====================================================================================================================================
// END OF APP.JS
// ====================================================================================================================================
// ====================================================================================================================================

// ====================================================================================================================================
// ====================================================================================================================================
// 9️⃣ DROPDOWN MENU LOGIC
// ====================================================================================================================================
// ====================================================================================================================================

const menuBtn = document.getElementById("btn_menu");
const dropdownMenu = document.getElementById("dropdown_menu");

if (menuBtn && dropdownMenu) {
  // Toggle Menu on Button Click
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("open");
    menuBtn.classList.toggle("active");
  });

  // Close Menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove("open");
      menuBtn.classList.remove("active");
    }
  });

  // Close Menu when clicking on a menu item
  const dropdownItems = dropdownMenu.querySelectorAll(".dropdown-item");
  dropdownItems.forEach((item) => {
    item.addEventListener("click", () => {
      dropdownMenu.classList.remove("open");
      menuBtn.classList.remove("active");
    });
  });
}
