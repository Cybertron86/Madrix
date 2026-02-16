// ====================================================================================================================================
//  MATRIX_RAIN MODULE (FULL GLITCH EFFECTS + BROWSER OPTIMIZATIONS)
// ====================================================================================================================================
const canvas = document.getElementById("matrixGlitch");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

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
    const offset = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * offsetMax);

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
