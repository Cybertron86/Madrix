// ====================================================================================================================================
// 3️⃣ AUDIO MODULE
// ====================================================================================================================================
let musicEnabled = false;
let ambientBtn = document.getElementById("ambientBtn");
let soundBtn = document.getElementById("soundBtn");

let ambientEnabled = localStorage.getItem("ambientEnabled") !== "false";
let audioUnlocked = false;

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

  currentAmbient = ambientPool[Math.floor(Math.random() * ambientPool.length)];
  currentAmbient.volume = 0.6;
  currentAmbient.play().catch(console.warn);
  currentAmbient.onended = scheduleNextAmbient;
}

export function startAllSounds() {
  music.play().catch(console.warn);
  musicEnabled = true;
  console.log("Audio started");

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
