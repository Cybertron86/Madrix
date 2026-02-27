/**
 * matrix-rain-background.js
 * 
 * High-performance Matrix "Digital Rain" background.
 * Optimized with decoupled loops: 
 * - Smooth 60FPS+ fading for liquid trails.
 * - Classic 30FPS logic for the "steppy" Matrix look.
 */

// ====================================================================================================================================
//  CANVAS SETUP
// ====================================================================================================================================

const canvas = document.getElementById("matrixGlitch");
let ctx = null;
if (canvas) {
  ctx = canvas.getContext("2d");
}

// ====================================================================================================================================
//  RAIN CONFIGURATION & ATLAS
// ====================================================================================================================================

const chars = "Aアァィゥィウエカキクケコサシスセソタチツテトナニヌネハヒフヘホ마미무메모ヤユヨラリルレロワヲン";
const warningChar = "\u26A0"; 
const fullCharSet = (chars + warningChar).split("");
const fontSize = 16;
const atlasScale = 1.5; 

/** @type {HTMLCanvasElement} Offscreen canvas for pre-rendered characters */
let atlasCanvas = null;
const atlasMap = new Map();

/**
 * Pre-renders all characters in green and warning-red to an atlas.
 */
function createAtlas() {
  atlasCanvas = document.createElement("canvas");
  const atlasCtx = atlasCanvas.getContext("2d");
  
  const scaledSize = fontSize * atlasScale;
  atlasCanvas.width = fullCharSet.length * scaledSize;
  atlasCanvas.height = scaledSize * 2; 
  
  atlasCtx.font = scaledSize + "px monospace";
  atlasCtx.textBaseline = "top";
  
  fullCharSet.forEach((char, i) => {
    const x = i * scaledSize;
    atlasCtx.fillStyle = "rgba(0, 255, 70, 1)";
    atlasCtx.fillText(char, x, 0);
    atlasCtx.fillStyle = "rgba(255, 0, 0, 0.95)";
    atlasCtx.fillText(char, x, scaledSize);
    atlasMap.set(char, x);
  });
}

// ====================================================================================================================================
//  RAIN SYSTEM (Decoupled Logic)
// ====================================================================================================================================

let columns = 0;
let drops = [];

function initMatrix() {
  if (!canvas) return;
  
  // Calculate required columns based on visual width
  const newColumns = Math.ceil(canvas.width / fontSize) + 1;
  
  if (newColumns > columns) {
    // START SEQUENCE: New columns start at top (position 1) for the
    // classic cascading "boot-up" effect when the page first loads.
    // On resize/zoom-out, new columns also start near the top.
    for (let i = columns; i < newColumns; i++) {
       drops[i] = 1;
    }
    columns = newColumns;
  }
}

// ====================================================================================================================================
//  GLITCH SYSTEM
// ====================================================================================================================================

let activeGlitch = null;

function triggerAnalogGlitch() {
  activeGlitch = {
    y: Math.random() * canvas.height,
    height: 30 + Math.random() * 100,
    offset: (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 60),
    duration: 5 + Math.random() * 15
  };
}

// ====================================================================================================================================
//  RENDER LOOP (Decoupled Smoothness)
// ====================================================================================================================================

let lastLogicTime = 0;
const logicInterval = 1000 / 30; // 30 FPS for "steppy" movement

function drawMatrix(timestamp) {

  // This produces long, visible character chains..
    ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. STABLE LOGIC TICK (Character drawing & movement)
  const elapsedLogic = timestamp - lastLogicTime;

  if (elapsedLogic >= logicInterval) {
    lastLogicTime = timestamp - (elapsedLogic % logicInterval);

    const scaledSize = fontSize * atlasScale;

    for (let i = 0; i < columns; i++) {
      const charIndex = Math.floor(Math.random() * fullCharSet.length);
      const char = fullCharSet[charIndex];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Strict parity - only warningChar is red
      const atlasY = (char === warningChar) ? scaledSize : 0;
      const atlasX = atlasMap.get(char);

      // Apply glitch offset
      let drawX = x;
      if (activeGlitch && y > activeGlitch.y && y < activeGlitch.y + activeGlitch.height) {
        drawX += activeGlitch.offset;
      }

      ctx.drawImage(
        atlasCanvas,
        atlasX, atlasY, scaledSize, scaledSize,
        drawX, y, fontSize, fontSize
      );

      // "Steppy" movement logic
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    // Glitch lifecycle management
    if (activeGlitch) {
      activeGlitch.duration--;
      if (activeGlitch.duration <= 0) activeGlitch = null;
    }
    if (Math.random() < 0.02) triggerAnalogGlitch();
  }

  requestAnimationFrame(drawMatrix);
}

// ====================================================================================================================================
//  RESILIENCE & INIT
// ====================================================================================================================================

// resizeCanvas() — fix height scaling when width is capped
function resizeCanvas() {
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  initMatrix();
}

window.addEventListener("resize", resizeCanvas);

function triggerShake() {
  if (!canvas) return;
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 300);
  setTimeout(triggerShake, 10000 + Math.random() * 15000);
}

async function initMatrixRain() {
  if (!canvas || !ctx) return;
  createAtlas();
  resizeCanvas();
  requestAnimationFrame(drawMatrix);
  triggerShake();
}

export { initMatrixRain };
