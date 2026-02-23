// ====================================================================================================================================
// Luxurious gloss effect at intervals
// ====================================================================================================================================
function initLuxBar() {
  const sparkle = document.querySelector(".lux-sparkle");
  if (!sparkle) return;

  function triggerSparkle() {
    sparkle.style.animation = "none";
    void sparkle.offsetWidth;
    sparkle.style.animation = "luxShine 15s ease-in-out";
  }

  setTimeout(triggerSparkle, 1000);
  setInterval(() => {
    triggerSparkle();
  }, Math.floor(Math.random() * 6000) + 9000);
}

window.initLuxBar = initLuxBar;
