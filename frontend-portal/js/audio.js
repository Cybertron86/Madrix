/**
 * audio.js
 * 
 * Manages background music and ambient glitch sound effects.
 * Handles audio context unlocking (browser policy compliance) and user controls.
 */


  // ====================================================================================================================================
  //  STATE & ASSETS
  // ====================================================================================================================================

  let musicEnabled = false;
  let ambientEnabled = localStorage.getItem("ambientEnabled") !== "false";
  let audioUnlocked = false;

  // Intro VO and SFX
  const introSound0 = new Audio("resources/sounds/glitch-effect_88bpm.mp3");
  const introSound1 = new Audio("resources/sounds/sisters-and-brothers_C_major.mp3");
  const introSound3 = new Audio("resources/sounds/welcome-to-my-world.mp3");

  // Main Background Music
  const music = new Audio("resources/sounds/glitchy-distorted-flute-lead_125bpm_C_major.mp3");
  music.loop = true;

  // Ambient Sound Pool
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
    a.preload = "none"; // Lazy load to save bandwidth
    return a;
  });

  let currentAmbient = null;
  let ambientTimeout = null;

  // ====================================================================================================================================
  //  ENGINE LOGIC
  // ====================================================================================================================================

  /**
   * Schedules the next randomized ambient sound trigger.
   */
  function scheduleNextAmbient() {
    if (!ambientEnabled) return;
    // Randomized delay between 20 and 60 seconds
    const delay = Math.random() * 40000 + 20000;
    ambientTimeout = setTimeout(playRandomAmbient, delay);
  }

  /**
   * Picks and plays a random sound from the ambient pool.
   */
  function playRandomAmbient() {
    if (!ambientEnabled) return;
    
    // Stop previous to avoid overlapping glitch textures
    if (currentAmbient) {
      currentAmbient.pause();
      currentAmbient.currentTime = 0;
    }
    
    currentAmbient = ambientPool[Math.floor(Math.random() * ambientPool.length)];
    currentAmbient.volume = 0.6;
    currentAmbient.play().catch(console.warn);
    
    // Chain next playback
    currentAmbient.onended = scheduleNextAmbient;
  }

  /**
   * Triggers the full audio intro sequence.
   * Called primarily when user enters the portal.
   */
  function startAllSounds() {
    music.play().catch(console.warn);
    musicEnabled = true;

    const soundBtn = document.getElementById("soundBtn");
    if (soundBtn) soundBtn.textContent = "🔊";

    // Orchestrated intro timing
    setTimeout(() => introSound0.play().catch(console.warn), 200);
    setTimeout(() => introSound1.play().catch(console.warn), 5000);
    setTimeout(() => introSound3.play().catch(console.warn), 8000);
    setTimeout(playRandomAmbient, 10500);
  }

  /**
   * Browser Workaround: Unlocks audio context on first user interaction.
   */
  function unlockAudioOnce() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    
    const dummy = new Audio();
    dummy.play().catch(() => {});
    
    if (musicEnabled) music.play().catch(console.warn);
    if (ambientEnabled) playRandomAmbient();
    
    // Cleanup listeners after first hit
    ["click", "touchstart", "keydown", "scroll"].forEach((e) =>
      window.removeEventListener(e, unlockAudioOnce)
    );
  }

  // ====================================================================================================================================
  //  INITIALIZATION & CONTROLS
  // ====================================================================================================================================

  /**
   * Main audio initialization. Attaches controls and unlock listeners.
   */
  async function initAudio() {
    const ambientBtn = document.getElementById("ambientBtn");
    const soundBtn = document.getElementById("soundBtn");

    // Bind interaction triggers for audio unlock
    ["click", "touchstart", "keydown", "scroll"].forEach((e) =>
      window.addEventListener(e, unlockAudioOnce)
    );

    // Toggle Music
    soundBtn?.addEventListener("click", () => {
      musicEnabled ? music.pause() : music.play().catch(console.warn);
      soundBtn.textContent = musicEnabled ? "🔇" : "🔊";
      musicEnabled = !musicEnabled;
    });

    // Toggle Ambient SFX
    ambientBtn?.addEventListener("click", () => {
      ambientEnabled = !ambientEnabled;
      localStorage.setItem("ambientEnabled", ambientEnabled);
      ambientBtn.textContent = ambientEnabled ? "🔊" : "🔇";
      
      if (ambientEnabled) {
        playRandomAmbient();
      } else {
        if (currentAmbient) currentAmbient.pause();
        clearTimeout(ambientTimeout);
      }
    });

  }

export { startAllSounds }
export { initAudio }