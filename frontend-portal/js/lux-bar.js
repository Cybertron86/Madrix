// ====================================================================================================================================
//  Luxuriöser Glanzeffekt in Intervallen
// ====================================================================================================================================
document.addEventListener("DOMContentLoaded", () => {
  const sparkle = document.querySelector(".lux-sparkle");

  function triggerSparkle() {
    sparkle.style.animation = "none"; // reset
    void sparkle.offsetWidth; // reflow for restart
    sparkle.style.animation = "luxShine 15s ease-in-out"; // trigger animation
  }

  // Initialstart nach kurzer Verzögerung
  setTimeout(triggerSparkle, 1000);

  setInterval(
    () => {
      triggerSparkle();
    },
    Math.floor(Math.random() * 6000) + 9000,
  );
});
