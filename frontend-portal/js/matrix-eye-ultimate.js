/**
 * ULTIMATE MATRIX EYE for HOLO CAROUSEL
 *
 * Features:
 * Aggressive staring, glitch effects, intense matrix rain
 */

class UltimateMatrixEye {
  constructor(container) {
    this.container = container;
    this.eyeElement = null;
    this.irisContainer = null;
    this.matrixColumns = [];

    this.currentFocusState = "normal";
    this.isGlitching = false;

    this.init();
  }

  init() {
    this.createEye();
    this.startAnimations();
  }

  createEye() {
    // Main eye container
    this.eyeElement = document.createElement("div");
    this.eyeElement.className = "holo-carousel-matrix-eye";

    // Container with perspective
    const eyeContainer = document.createElement("div");
    eyeContainer.className = "holo-carousel-eye-container";

    // Glow rings (3 layers)
    for (let i = 0; i < 3; i++) {
      const glowRing = document.createElement("div");
      glowRing.className = "holo-carousel-eye-glow-ring";
      eyeContainer.appendChild(glowRing);
    }

    // Outer eye shape
    const eyeOuter = document.createElement("div");
    eyeOuter.className = "holo-carousel-eye-outer";

    // Sclera (eye white)
    const eyeSclera = document.createElement("div");
    eyeSclera.className = "holo-carousel-eye-sclera";

    // INTENSE Matrix rain container - VERTICAL
    const matrixRain = document.createElement("div");
    matrixRain.className = "holo-carousel-eye-matrix-rain";

    // Create 20 dense matrix columns
    for (let i = 0; i < 20; i++) {
      const column = document.createElement("div");
      column.className = "holo-carousel-matrix-column";
      column.textContent = this.generateMatrixCode(25); // More characters
      matrixRain.appendChild(column);
      this.matrixColumns.push(column);
    }

    eyeSclera.appendChild(matrixRain);

    // Matrix glitch overlay
    const matrixGlitch = document.createElement("div");
    matrixGlitch.className = "holo-carousel-eye-matrix-glitch";
    eyeSclera.appendChild(matrixGlitch);

    // Scanlines
    const scanlines = document.createElement("div");
    scanlines.className = "holo-carousel-eye-scanlines";
    eyeSclera.appendChild(scanlines);

    // Vertical scanline
    const scanlineVert = document.createElement("div");
    scanlineVert.className = "holo-carousel-eye-scanline-vert";
    eyeSclera.appendChild(scanlineVert);

    // Veins/circuits
    const veins = document.createElement("div");
    veins.className = "holo-carousel-eye-veins";
    eyeSclera.appendChild(veins);

    // Iris container (moves for looking, scales for focus)
    this.irisContainer = document.createElement("div");
    this.irisContainer.className = "holo-carousel-eye-iris-container";

    // Outer iris ring with segments
    const irisOuterRing = document.createElement("div");
    irisOuterRing.className = "holo-carousel-eye-iris-outer-ring";

    // Main iris
    const iris = document.createElement("div");
    iris.className = "holo-carousel-eye-iris";

    // Iris fibers (detailed texture)
    const irisFibers = document.createElement("div");
    irisFibers.className = "holo-carousel-eye-iris-fibers";
    iris.appendChild(irisFibers);

    // Inner iris ring
    const irisInnerRing = document.createElement("div");
    irisInnerRing.className = "holo-carousel-eye-iris-inner-ring";
    iris.appendChild(irisInnerRing);

    // Data orbit around pupil
    const dataOrbit = document.createElement("div");
    dataOrbit.className = "holo-carousel-eye-data-orbit";
    iris.appendChild(dataOrbit);

    // Pupil
    const pupil = document.createElement("div");
    pupil.className = "holo-carousel-eye-pupil";
    iris.appendChild(pupil);

    // Assemble iris structure
    this.irisContainer.appendChild(irisOuterRing);
    this.irisContainer.appendChild(iris);
    eyeSclera.appendChild(this.irisContainer);

    // Fade mask for smooth blending
    const fadeMask = document.createElement("div");
    fadeMask.className = "holo-carousel-eye-fade-mask";

    // Horizontal scanline
    const scanlineHoriz = document.createElement("div");
    scanlineHoriz.className = "holo-carousel-eye-scanline-horiz";

    // Glitch overlay
    const glitchOverlay = document.createElement("div");
    glitchOverlay.className = "holo-carousel-eye-glitch-overlay";

    // Assemble eye
    eyeOuter.appendChild(eyeSclera);
    eyeOuter.appendChild(fadeMask);
    eyeOuter.appendChild(scanlineHoriz);
    eyeOuter.appendChild(glitchOverlay);

    eyeContainer.appendChild(eyeOuter);
    this.eyeElement.appendChild(eyeContainer);

    // Add to DOM
    this.container.appendChild(this.eyeElement);
  }

  generateMatrixCode(length) {
    // Mix of binary and katakana
    const chars =
      "01010110アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length)) + "\n";
    }
    return code;
  }

  startAnimations() {
    // Update matrix code frequently for intense rain
    setInterval(() => {
      this.matrixColumns.forEach((column) => {
        if (Math.random() > 0.4) {
          // More frequent updates
          column.textContent = this.generateMatrixCode(25);
        }
      });
    }, 1500); // Faster updates

    // AGGRESSIVE looking around
    this.startAggressiveLooking();

    // Random focus changes
    this.startFocusChanges();

    // Random glitch effects
    this.startGlitchEffects();
  }

  startAggressiveLooking() {
    const aggressiveLook = () => {
      const actions = [
        // Quick snaps
        { x: -30, y: 0, duration: 150 }, // SNAP left
        { x: 30, y: 0, duration: 150 }, // SNAP right
        { x: 0, y: 0, duration: 200 }, // SNAP center
        { x: -25, y: -12, duration: 180 }, // Quick up-left
        { x: 25, y: -12, duration: 180 }, // Quick up-right

        // Aggressive sequences
        { x: -30, y: 0, duration: 100, then: { x: 30, y: 0, duration: 100 } }, // Left SNAP right
        { x: 30, y: 0, duration: 100, then: { x: -30, y: 0, duration: 100 } }, // Right SNAP left
        { x: 0, y: -15, duration: 120, then: { x: 0, y: 0, duration: 120 } }, // Up SNAP center

        // Triple aggressive moves
        {
          x: -30,
          y: 0,
          duration: 90,
          then: {
            x: 0,
            y: 0,
            duration: 90,
            final: { x: 30, y: 0, duration: 90 },
          },
        },
        {
          x: 30,
          y: 0,
          duration: 90,
          then: {
            x: 0,
            y: -12,
            duration: 90,
            final: { x: -30, y: 0, duration: 90 },
          },
        },

        // Jittery stare
        {
          x: -2,
          y: 0,
          duration: 80,
          then: {
            x: 2,
            y: 0,
            duration: 80,
            final: { x: 0, y: 0, duration: 80 },
          },
        },

        // Slow menacing turn
        { x: -35, y: 0, duration: 400, then: { x: 0, y: 0, duration: 300 } },
        { x: 35, y: 0, duration: 400, then: { x: 0, y: 0, duration: 300 } },
      ];

      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      // First movement - FAST
      this.moveEyeFast(
        randomAction.x,
        randomAction.y,
        randomAction.duration || 150,
      );

      // Second movement if defined
      if (randomAction.then) {
        setTimeout(() => {
          this.moveEyeFast(
            randomAction.then.x,
            randomAction.then.y,
            randomAction.then.duration || 150,
          );

          // Third movement if defined
          if (randomAction.final) {
            setTimeout(() => {
              this.moveEyeFast(
                randomAction.final.x,
                randomAction.final.y,
                randomAction.final.duration || 150,
              );
            }, randomAction.then.duration || 150);
          }
        }, randomAction.duration || 150);
      }

      // Schedule next look - MORE FREQUENT
      const nextDelay = this.getRandomInt(800, 2500); // Much faster
      setTimeout(aggressiveLook, nextDelay);
    };

    setTimeout(aggressiveLook, 1000);
  }

  startFocusChanges() {
    const changeFocus = () => {
      const focusStates = [
        "focused",
        "normal",
        "unfocused",
        "normal",
        "focused",
      ];
      const randomState =
        focusStates[Math.floor(Math.random() * focusStates.length)];

      this.setFocus(randomState);

      // Faster focus changes
      const nextDelay = this.getRandomInt(2500, 5500);
      setTimeout(changeFocus, nextDelay);
    };

    setTimeout(changeFocus, 2000);
  }

  startGlitchEffects() {
    const triggerGlitch = () => {
      if (!this.isGlitching) {
        this.isGlitching = true;

        // Random glitch type
        const glitchType = Math.random();

        if (glitchType > 0.7) {
          // RGB split glitch
          this.eyeElement.style.filter =
            "drop-shadow(0 0 50px rgba(0, 255, 136, 0.9)) " +
            "drop-shadow(4px 0 rgba(255, 0, 100, 0.9)) " +
            "drop-shadow(-4px 0 rgba(0, 212, 255, 0.9))";

          setTimeout(() => {
            this.eyeElement.style.filter = "";
            this.isGlitching = false;
          }, 80);
        } else if (glitchType > 0.4) {
          // Position jitter
          const origTransform = this.eyeElement.style.transform;
          this.eyeElement.style.transform =
            "translate(-50%, -50%) translate(3px, -2px)";

          setTimeout(() => {
            this.eyeElement.style.transform =
              "translate(-50%, -50%) translate(-2px, 1px)";

            setTimeout(() => {
              this.eyeElement.style.transform =
                origTransform || "translate(-50%, -50%)";
              this.isGlitching = false;
            }, 60);
          }, 60);
        } else {
          // Brightness flicker
          this.eyeElement.style.filter = "brightness(1.5) contrast(1.3)";

          setTimeout(() => {
            this.eyeElement.style.filter = "brightness(0.7)";

            setTimeout(() => {
              this.eyeElement.style.filter = "";
              this.isGlitching = false;
            }, 50);
          }, 50);
        }
      }

      // Random glitch timing
      const nextDelay = this.getRandomInt(4000, 12000);
      setTimeout(triggerGlitch, nextDelay);
    };

    setTimeout(triggerGlitch, 5000);
  }

  moveEyeFast(x, y, duration = 150) {
    if (this.irisContainer) {
      // Get current scale
      const currentTransform = this.irisContainer.style.transform;
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      const currentScale = scaleMatch ? scaleMatch[1] : "1";

      // Override transition for fast movement
      this.irisContainer.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

      this.irisContainer.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${currentScale})`;
    }
  }

  setFocus(state) {
    if (this.currentFocusState === state) return;

    this.currentFocusState = state;

    // Remove all focus classes
    this.eyeElement.classList.remove(
      "holo-carousel-eye-focused",
      "holo-carousel-eye-unfocused",
    );

    // Add appropriate class
    if (state === "focused") {
      this.eyeElement.classList.add("holo-carousel-eye-focused");
    } else if (state === "unfocused") {
      this.eyeElement.classList.add("holo-carousel-eye-unfocused");
    }

    // Update transform
    if (this.irisContainer) {
      const currentTransform = this.irisContainer.style.transform;
      const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
      const currentTranslate = translateMatch
        ? translateMatch[1]
        : "calc(-50% + 0px), calc(-50% + 0px)";

      let scale = 1;
      if (state === "focused") scale = 1.35;
      else if (state === "unfocused") scale = 0.8;

      this.irisContainer.style.transform = `translate(${currentTranslate}) scale(${scale})`;
    }
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  destroy() {
    if (this.eyeElement && this.eyeElement.parentNode) {
      this.eyeElement.parentNode.removeChild(this.eyeElement);
    }
  }
}
