/**
 * matrix-eye-ultimate.js
 *
 * Defines the UltimateMatrixEye class - a complex, multi-layered visual component
 * featured in the Holo Carousel. Combines CSS animations, dynamic Matrix rain,
 * and procedural "looking around" behaviors to simulate a sentient AI eye.
 */

// ====================================================================================================================================
//  ULTIMATE MATRIX EYE CLASS
// ====================================================================================================================================

class UltimateMatrixEye {
  /**
   * @param {HTMLElement} container - Parent element to host the eye component.
   */
  constructor(container) {
    this.container = container;
    this.eyeElement = null;
    this.irisContainer = null;
    this.matrixColumns = [];

    this.currentFocusState = "normal";
    this.isGlitching = false;

    this.init();
  }

  /**
   * Main initialization sequence.
   */
  init() {
    this.createEye();
    this.startAnimations();
  }

  // ====================================================================================================================================
  //  DOM CONSTRUCTION
  // ====================================================================================================================================

  /**
   * Programmatically builds the complex nested DOM structure of the eye.
   * Includes rings, sclera, iris, matrix rain columns, and multiple FX overlays.
   */
  createEye() {
    // 1. Root Component
    this.eyeElement = document.createElement("div");
    this.eyeElement.className = "holo-carousel-matrix-eye";

    // 2. Perspective Container
    const eyeContainer = document.createElement("div");
    eyeContainer.className = "holo-carousel-eye-container";

    // 3. Ambient Glow Rings (Multi-layered depth)
    for (let i = 0; i < 3; i++) {
      const glowRing = document.createElement("div");
      glowRing.className = "holo-carousel-eye-glow-ring";
      eyeContainer.appendChild(glowRing);
    }

    // 4. Outer Eye Shell
    const eyeOuter = document.createElement("div");
    eyeOuter.className = "holo-carousel-eye-outer";

    // 5. Sclera (Hosts the background Matrix stream)
    const eyeSclera = document.createElement("div");
    eyeSclera.className = "holo-carousel-eye-sclera";

    // 6. Dense Matrix Rain (Vertical Columns)
    const matrixRain = document.createElement("div");
    matrixRain.className = "holo-carousel-eye-matrix-rain";

    // Generate 20 high-density code streams
    for (let i = 0; i < 20; i++) {
      const column = document.createElement("div");
      column.className = "holo-carousel-matrix-column";
      // Initial content - rapidly cycling
      column.textContent = this.generateMatrixCode(25);
      matrixRain.appendChild(column);
      this.matrixColumns.push(column);
    }
    eyeSclera.appendChild(matrixRain);

    // 7. Visual FX Overlays
    const matrixGlitch = document.createElement("div");
    matrixGlitch.className = "holo-carousel-eye-matrix-glitch";
    eyeSclera.appendChild(matrixGlitch);

    const scanlines = document.createElement("div");
    scanlines.className = "holo-carousel-eye-scanlines";
    eyeSclera.appendChild(scanlines);

    const scanlineVert = document.createElement("div");
    scanlineVert.className = "holo-carousel-eye-scanline-vert";
    eyeSclera.appendChild(scanlineVert);

    const veins = document.createElement("div");
    veins.className = "holo-carousel-eye-veins";
    eyeSclera.appendChild(veins);

    // 8. Iris & Pupil Sub-system
    this.irisContainer = document.createElement("div");
    this.irisContainer.className = "holo-carousel-eye-iris-container";

    const irisOuterRing = document.createElement("div");
    irisOuterRing.className = "holo-carousel-eye-iris-outer-ring";

    const iris = document.createElement("div");
    iris.className = "holo-carousel-eye-iris";

    const irisFibers = document.createElement("div");
    irisFibers.className = "holo-carousel-eye-iris-fibers";
    iris.appendChild(irisFibers);

    const irisInnerRing = document.createElement("div");
    irisInnerRing.className = "holo-carousel-eye-iris-inner-ring";
    iris.appendChild(irisInnerRing);

    const dataOrbit = document.createElement("div");
    dataOrbit.className = "holo-carousel-eye-data-orbit";
    iris.appendChild(dataOrbit);

    const pupil = document.createElement("div");
    pupil.className = "holo-carousel-eye-pupil";
    iris.appendChild(pupil);

    this.irisContainer.appendChild(irisOuterRing);
    this.irisContainer.appendChild(iris);
    eyeSclera.appendChild(this.irisContainer);

    // 9. Post-processing Overlays
    const fadeMask = document.createElement("div");
    fadeMask.className = "holo-carousel-eye-fade-mask";

    const scanlineHoriz = document.createElement("div");
    scanlineHoriz.className = "holo-carousel-eye-scanline-horiz";

    const glitchOverlay = document.createElement("div");
    glitchOverlay.className = "holo-carousel-eye-glitch-overlay";

    // 10. Final Assembly
    eyeOuter.appendChild(eyeSclera);
    eyeOuter.appendChild(fadeMask);
    eyeOuter.appendChild(scanlineHoriz);
    eyeOuter.appendChild(glitchOverlay);

    eyeContainer.appendChild(eyeOuter);
    this.eyeElement.appendChild(eyeContainer);

    // Mount to host
    this.container.appendChild(this.eyeElement);
  }

  /**
   * Generates a vertical string of random Matrix-style characters.
   *
   * @param {number} length - Number of characters to generate.
   * @returns {string} - Line-broken character stream.
   */
  generateMatrixCode(length) {
    // Mixture of binary (logic) and Katakana (aesthetic)
    const chars =
      "01010110アイウエオカキクケコサシスセソタチツテトナニヌネハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const charsLength = chars.length;
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * charsLength)] + "\n";
    }
    return code;
  }

  // ====================================================================================================================================
  //  ANIMATION CONTROLLERS
  // ====================================================================================================================================

  /**
   * Starts all asynchronous animation cycles (Matrix rain, focus, glitch, eye movement).
   */
  startAnimations() {
    // 1. High-frequency Matrix Rain update
    setInterval(() => {
      this.matrixColumns.forEach((column) => {
        // Stochastic update to keep it feeling organic rather than mechanical
        if (Math.random() > 0.4) {
          column.textContent = this.generateMatrixCode(25);
        }
      });
    }, 1500);

    // 2. Behavioral cycles
    this.startAggressiveLooking();
    this.startFocusChanges();
    this.startGlitchEffects();
  }

  /**
   * Procedurally generates "aggressive" looking around behaviors.
   * Simulates a scanning AI by combining quick snaps and jittery stares.
   */
  startAggressiveLooking() {
    const aggressiveLook = () => {
      // Define a set of potential movement patterns
      const actions = [
        // Directional snaps
        { x: -30, y: 0, duration: 150 }, // SNAP left
        { x: 30, y: 0, duration: 150 }, // SNAP right
        { x: 0, y: 0, duration: 200 }, // SNAP center
        { x: -25, y: -12, duration: 180 },
        { x: 25, y: -12, duration: 180 },

        // Complex sequences (linked transforms)
        { x: -30, y: 0, duration: 100, then: { x: 30, y: 0, duration: 100 } },
        { x: 30, y: 0, duration: 100, then: { x: -30, y: 0, duration: 100 } },

        // Triple snap chains
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

        // Micro-jitter stare
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
      ];

      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      // Execute sequence
      this.moveEyeFast(
        randomAction.x,
        randomAction.y,
        randomAction.duration || 150,
      );

      if (randomAction.then) {
        setTimeout(() => {
          this.moveEyeFast(
            randomAction.then.x,
            randomAction.then.y,
            randomAction.then.duration || 150,
          );

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

      // Schedule next sequence with randomized interval
      const nextDelay = this.getRandomInt(800, 2500);
      setTimeout(aggressiveLook, nextDelay);
    };

    setTimeout(aggressiveLook, 1000);
  }

  /**
   * Randomly cycles the eye through different focus depth states.
   */
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

      const nextDelay = this.getRandomInt(2500, 5500);
      setTimeout(changeFocus, nextDelay);
    };

    setTimeout(changeFocus, 2000);
  }

  /**
   * Triggers randomized visual "malfunctions" (RGB splitting, jitters, flickering).
   */
  startGlitchEffects() {
    const triggerGlitch = () => {
      if (!this.isGlitching) {
        this.isGlitching = true;
        const glitchType = Math.random();

        // 1. RGB Split Glitch (Chromatic Aberration)
        if (glitchType > 0.7) {
          this.eyeElement.style.filter =
            "drop-shadow(0 0 50px rgba(0, 255, 136, 0.9)) " +
            "drop-shadow(4px 0 rgba(255, 0, 100, 0.9)) " +
            "drop-shadow(-4px 0 rgba(0, 212, 255, 0.9))";

          setTimeout(() => {
            this.eyeElement.style.filter = "";
            this.isGlitching = false;
          }, 80);
        }
        // 2. Geometric Jitter
        else if (glitchType > 0.4) {
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
        }
        // 3. Brightness/Contrast Flicker
        else {
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

      const nextDelay = this.getRandomInt(4000, 12000);
      setTimeout(triggerGlitch, nextDelay);
    };

    setTimeout(triggerGlitch, 5000);
  }

  // ====================================================================================================================================
  //  PUBLIC UTILITIES
  // ====================================================================================================================================

  /**
   * Rapidly moves the iris to a target coordinate.
   *
   * @param {number} x - Horizontal offset in pixels.
   * @param {number} y - Vertical offset in pixels.
   * @param {number} duration - Transition speed in ms.
   */
  moveEyeFast(x, y, duration = 150) {
    if (this.irisContainer) {
      // Preserve current scale (focus level) while translating
      const currentTransform = this.irisContainer.style.transform;
      const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
      const currentScale = scaleMatch ? scaleMatch[1] : "1";

      this.irisContainer.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      this.irisContainer.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${currentScale})`;
    }
  }

  /**
   * Updates the eye's class and scale based on focus state.
   *
   * @param {'focused'|'normal'|'unfocused'} state - The target focus depth.
   */
  setFocus(state) {
    if (this.currentFocusState === state) return;

    this.currentFocusState = state;

    this.eyeElement.classList.remove(
      "holo-carousel-eye-focused",
      "holo-carousel-eye-unfocused",
    );

    if (state === "focused") {
      this.eyeElement.classList.add("holo-carousel-eye-focused");
    } else if (state === "unfocused") {
      this.eyeElement.classList.add("holo-carousel-eye-unfocused");
    }

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

  /**
   * Standard random integer generator.
   */
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Cleanly removes the component from the DOM.
   */
  destroy() {
    if (this.eyeElement && this.eyeElement.parentNode) {
      this.eyeElement.parentNode.removeChild(this.eyeElement);
    }
  }
}

// ====================================================================================================================================
//  EXPORTS
// ====================================================================================================================================

export default UltimateMatrixEye;
