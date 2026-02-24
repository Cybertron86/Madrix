/**
 * lux-bar.js
 * 
 * Logic for the "Luxurious Gloss" sparkle effect on the header bar.
 * Triggers periodically with a randomized interval to create a premium feel.
 */

  // ====================================================================================================================================
  //  GLOSS EFFECT INITIALIZATION
  // ====================================================================================================================================

  /**
   * Initializes the header sparkle/gloss animation cycle.
   */
  function initLuxBar() {
    const sparkle = document.querySelector(".lux-sparkle");
    if (!sparkle) return;

    /**
     * Resets and triggers the shine animation.
     */
    function triggerSparkle() {
      // Force reflow to allow re-triggering the same animation
      sparkle.style.animation = "none";
      void sparkle.offsetWidth; 
      sparkle.style.animation = "luxShine 15s ease-in-out";
    }

    // Initial trigger after short delay
    setTimeout(triggerSparkle, 1000);

    // Randomized periodic repetition (approx every 9-15 seconds)
    setInterval(() => {
      triggerSparkle();
    }, Math.floor(Math.random() * 6000) + 9000);
  }

export { initLuxBar }