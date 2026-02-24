/**
 * matrix-rain-background.js
 * 
 * High-performance Matrix "Digital Rain" background with glitch effects.
 * Includes browser-specific optimizations (Chrome/Brave vs Firefox/Edge) and 
 * Canvas-based memory caching for glitch slices.
 */

  // ====================================================================================================================================
  //  CANVAS SETUP & BROWSER DETECTION
  // ====================================================================================================================================

  const canvas = document.getElementById("matrixGlitch");
  let ctx = null;
  if (canvas) {
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  }

  // Detect browser environment for targeted performance tuning and styling
  const isEdge = /Edg\//.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && !isEdge;
  const isBrave = navigator.brave !== undefined;
  const isFirefox = /Firefox/.test(navigator.userAgent);

  if (isEdge) document.body.classList.add("edge-browser");
  if (isChrome || isBrave) document.body.classList.add("chrome-browser");
  if (isFirefox) document.body.classList.add("firefox-browser");

  // Initial dimensions
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // ====================================================================================================================================
  //  RAIN CONFIGURATION
  // ====================================================================================================================================

  const chars = "AアァィゥィウエカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲンAアァィゥィウエカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲン";
  const warningChar = "\u26A0"; // Diagnostic/Warning character randomly injected
  const fullCharSet = chars + warningChar;
  const fontSize = 16;
  let columns, drops;

  /**
   * Recalculates grid columns and drop states based on canvas width.
   * Handles DPI/Scaling for 4K+ displays on supported browsers.
   */
  function initMatrix() {
    let effectiveFontSize = fontSize;
    // Scale up for high-resolution displays
    if ((isChrome || isBrave || isEdge || isFirefox) && canvas.width > 1920) {
      effectiveFontSize = fontSize * 1.8;
    }
    columns = Math.floor(canvas.width / effectiveFontSize);
    drops = Array(columns).fill(1); // Starting Y-position for each column
  }

  // ====================================================================================================================================
  //  GLITCH SUBSYSTEM
  // ====================================================================================================================================

  /** @type {HTMLCanvasElement[]} Circular cache for reusable glitch slice canvases */
  const glitchCanvasCache = [];

  /**
   * Manages a small pool of canvases to reduce garbage collection during glitching.
   * 
   * @param {number} width 
   * @param {number} height 
   * @returns {HTMLCanvasElement}
   */
  function getGlitchCanvas(width, height) {
    const cached = glitchCanvasCache.find(
      (c) => c.width === width && c.height === height,
    );
    if (cached) return cached;

    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    glitchCanvasCache.push(c);
    
    // Maintain a max cache size of 5 slices
    if (glitchCanvasCache.length > 5) glitchCanvasCache.shift();
    return c;
  }

  /**
   * Applies horizontal "Analog Glitch" slices to the canvas.
   * 
   * @param {Object} config
   * @param {number} config.stripes - Number of glitch bands to render.
   * @param {number} config.offsetMax - Max horizontal displacement.
   * @param {number} config.alpha - Opacity of the glitch overlay.
   */
  function applyGlitch({ stripes, offsetMax, alpha }) {
    for (let g = 0; g < stripes; g++) {
      const sliceHeight = Math.floor(Math.random() * 5 + 2);
      const y = Math.floor(Math.random() * canvas.height);
      const offset = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * offsetMax);

      const tmpCanvas = getGlitchCanvas(canvas.width, sliceHeight);
      const tmpCtx = tmpCanvas.getContext("2d", { willReadFrequently: true });

      // Extract slice from main canvas
      tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
      tmpCtx.drawImage(
        canvas,
        0, y, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight
      );

      // Re-render slice with offset and transparency
      ctx.clearRect(0, y, canvas.width, sliceHeight);
      ctx.globalAlpha = alpha;
      ctx.drawImage(tmpCanvas, offset, y);
      ctx.globalAlpha = 1;
    }
  }

  // ====================================================================================================================================
  //  RENDER LOOP
  // ====================================================================================================================================

  let frame = 0;
  // Browser-specific frame skipping to manage CPU load on non-Blink engines
  const frameSkip = isChrome || isBrave ? 2 : isEdge ? 1.6 : 1.8;

  /**
   * Primary animation loop for the Digital Rain.
   */
  function drawMatrix() {
    frame++;
    // Performance: Throttle based on engine type
    if (frame % Math.floor(frameSkip) !== 0) {
      requestAnimationFrame(drawMatrix);
      return;
    }

    // Fading trail effect
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const char = fullCharSet[Math.floor(Math.random() * fullCharSet.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Color coding: Red for warnings, Matrix-green for standard stream
      ctx.fillStyle = (char === warningChar) ? "rgba(255,0,0,0.95)" : "rgba(0,255,70,1)";
      ctx.fillText(char, x, y);

      // Reset drop to top with randomized delay once it hits bottom
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    // Occasional random glitch pulse
    const glitchProbability = (isChrome || isBrave ? 0.02 : isEdge ? 0.15 : 0.08);
    if (Math.random() < glitchProbability) {
      applyGlitch({ stripes: 2, offsetMax: 60, alpha: 0.5 });
    }

    requestAnimationFrame(drawMatrix);
  }

  /**
   * Syncs canvas resolution to the viewport.
   */
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initMatrix();
  }

  window.addEventListener("resize", resizeCanvas);

  /**
   * Triggers a momentary screen shake effect.
   */
  function triggerShake() {
    if (!canvas) return;
    canvas.classList.add("shake");
    setTimeout(() => canvas.classList.remove("shake"), 300);
    
    // Reschedule randomized shake
    setTimeout(triggerShake, Math.random() * 5000 + 10000);
  }

  // ====================================================================================================================================
  //  INITIALIZATION
  // ====================================================================================================================================

  /**
   * Main entry point for the background effect.
   */
  function initMatrixRain() {
    if (!canvas || !ctx) return;
    resizeCanvas();
    drawMatrix();
    triggerShake();
  }

  // ====================================================================================================================================
  //  GLOBAL EXPORTS
  // ====================================================================================================================================


export { initMatrixRain }
