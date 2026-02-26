/**
 * footer-init.js
 *
 * Manages the initialization of footer-related functionality.
 * Handles dynamic content (copyright year) and modal trigger bindings.
 */

// ====================================================================================================================================
//  FOOTER INITIALIZATION
// ====================================================================================================================================

/**
 * Initializes all footer elements.
 * Sets the current year and attaches event listeners to legal and contact modal buttons.
 */
async function initFooter() {
  // 1. Update Copyright Year (Auto-syncs with server-provided current time context)
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  // 2. Initialize Modal Triggers (Defined in respective modal modules)
  try {
    const { initImpressumTrigger } = await import("./impressum-modal.js");
    if (typeof initImpressumTrigger === "function") await initImpressumTrigger();
  } catch (e) {
    console.warn("Could not load impressum modal trigger module:", e);
  }

  try {
    const { initPrivacyTrigger } = await import("./privacy-modal.js");
    if (typeof initPrivacyTrigger === "function") await initPrivacyTrigger();
  } catch (e) {
    console.warn("Could not load privacy modal trigger module:", e);
  }

  try {
    const { initContactTrigger } = await import("./contact-modal.js");
    if (typeof initContactTrigger === "function") await initContactTrigger();
  } catch (e) {
    console.warn("Could not load contact modal trigger module:", e);
  }
}

// ====================================================================================================================================
//  GLOBAL EXPORTS
// ====================================================================================================================================

export  { initFooter };
