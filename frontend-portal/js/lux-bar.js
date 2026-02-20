// ====================================================================================================================================
// Luxurious gloss effect at intervals
// ====================================================================================================================================
const sparkle = document.querySelector(".lux-sparkle");

function triggerSparkle() {
  sparkle.style.animation = "none"; // reset
  void sparkle.offsetWidth; // reflow for restart
  sparkle.style.animation = "luxShine 15s ease-in-out"; // trigger animation
}

// Initial start after a short delay
setTimeout(triggerSparkle, 1000);

setInterval(
  () => {
    triggerSparkle();
  },
  Math.floor(Math.random() * 6000) + 9000,
);
