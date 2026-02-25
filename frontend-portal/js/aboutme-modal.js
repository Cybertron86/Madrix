/**
 * aboutme-modal.js
 * 
 * Logic for the "About Me" terminal-style modal.
 * Features a personalized typewriter effect, auto-scrolling terminal output,
 * and data fetching for the current user's name.
 */

  // ====================================================================================================================================
  //  UI TEMPLATES
  // ====================================================================================================================================

  /** @type {string} Structural HTML for the About terminal. */
  const MODAL_HTML = `
    <div id="aboutOverlay" class="mx-modal-overlay">
      <div class="mx-modal-container about-modal-custom">
        <button class="mx-modal-close" id="aboutCloseBtn" aria-label="Close About Modal">×</button>
        <h2 class="mx-modal-title">ABOUT ME</h2>
        <div class="mx-modal-content about-modal-scroll-area">
          <div class="about-modal-text">
            <!-- Terminal output stream -->
          </div>
        </div>
        <button class="about-scroll-bottom" aria-label="Scroll to bottom"></button>
      </div>
    </div>
  `;

  // ====================================================================================================================================
  //  MODULE STATE
  // ====================================================================================================================================

import { ModalManager, escapeHtml } from "./security-utils.js";

  let aboutModal = null;
// Module-scoped auto-scroll flag (replaces previous window.aboutAutoScroll)
let aboutAutoScroll = false;

  // ====================================================================================================================================
  //  MODAL LIFECYCLE
  // ====================================================================================================================================

  /**
   * Builds the modal structure and attaches basic UI listeners.
   */
  function createAboutModal() {
    if (aboutModal) return;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    aboutModal = document.getElementById("aboutOverlay");

  ModalManager.setup(aboutModal, closeAboutModal);

    // Terminal Scroll-to-Bottom Logic
    const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");
    scrollBottomBtn.addEventListener("click", () => {
      const contentContainer = aboutModal.querySelector(".mx-modal-content");
      contentContainer.scrollTo({
        top: contentContainer.scrollHeight,
        behavior: "smooth",
      });
    aboutAutoScroll = true;
    });
  }

  /**
   * Displays the terminal and initiates the boot sequence (typewriter).
   */
  function openAboutModal() {
    createAboutModal();
    aboutModal.classList.add("active");
    document.body.style.overflow = "hidden";
    
    // Clear terminal buffer immediately
    const textContainer = aboutModal.querySelector(".about-modal-text");
    if (textContainer) textContainer.innerHTML = "";
    
    // Slight delay to allow CSS transitions to finish
    setTimeout(() => {
      startTypewriterSequence();
    }, 300);
  }

  /**
   * Closes the terminal modal.
   */
  function closeAboutModal() {
    if (!aboutModal) return;
    aboutModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // ====================================================================================================================================
  //  TYPEWRITER ENGINE
  // ====================================================================================================================================

  /**
   * Runs the personalized terminal text animation.
   */
  async function startTypewriterSequence() {
    const textContainer = aboutModal.querySelector(".about-modal-text");
    const contentContainer = aboutModal.querySelector(".mx-modal-content");
    const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");

    // Phase 1: Identity Resolution
    let displayName = "stranger";
    try {
      const res = await fetch("/api/me.php");
      const user = await res.json();
      if (user?.username && user.role !== "guest") {
        displayName = user.username;
      }
    } catch (err) {
      console.warn("[ABOUT] Identity fetch failed, using fallback.");
    }

    // Phase 2: Content Definition
    const paragraphs = [
    `Hello <strong>${escapeHtml(displayName) || displayName}</strong>,`,
      "My name is <strong>Benjamin Tron</strong>, a software and web developer based in Karlsruhe, Germany. My professional journey began in a hands-on world: from 2002 to 2006, I trained as an industrial mechanic, learning precision, structure, and how complex systems truly work beneath the surface.",
      "Years later, curiosity pulled me deeper into the digital realm. Between 2022 and 2024, I completed a 24-month career transition and earned an IHK qualification as a Computer Science Expert, specializing in software development. To further sharpen my skills, I pursued an intensive 10-month web development program from 2025 to 2026.",
      "Today, I'm passionate about full-stack development, building software that connects logic and creativity, backend robustness and frontend experience. I enjoy understanding how things work end to end, from databases and APIs to clean interfaces and thoughtful user interactions.",
      "I'm driven by curiosity, continuous learning, and a quiet fascination with solving problems that aren't always obvious at first glance. Some details reveal themselves instantly, others only after you look a little closer.",
    ];

    // Initialization
    textContainer.innerHTML = "";
    textContainer.classList.add("typing");
  aboutAutoScroll = true;
    let isTyping = true;

    /**
     * Helper to check if the scroll viewport is capped at the bottom.
     */
    function isAtBottom() {
      const threshold = 50;
    return (
      contentContainer.scrollHeight -
        contentContainer.scrollTop -
        contentContainer.clientHeight <
      threshold
    );
    }

    // Scroll Interruption Logic
    contentContainer.addEventListener("scroll", () => {
      if (!isTyping) return;
      if (isAtBottom()) {
      aboutAutoScroll = true;
        scrollBottomBtn.classList.remove("visible");
      } else {
      aboutAutoScroll = false;
        scrollBottomBtn.classList.add("visible", "pulse");
      }
    });

    let currentParagraph = 0;
    let currentChar = 0;
    let currentP = null;

    /**
     * Recursive typewriter function. Handles HTML tags and auto-scrolling.
     */
    function typeNextChar() {
      // Abort if modal closed
      if (!aboutModal.classList.contains("active")) {
        textContainer.classList.remove("typing");
        isTyping = false;
        scrollBottomBtn.classList.remove("visible", "pulse");
        return;
      }

      // New paragraph setup
      if (currentChar === 0) {
        currentP = document.createElement("p");
        currentP.style.opacity = "1";
        textContainer.appendChild(currentP);
      }

      const fullText = paragraphs[currentParagraph];

      if (currentChar < fullText.length) {
        // Tag bypass logic (e.g. <strong>)
        if (fullText[currentChar] === "<") {
          const closingTag = fullText.indexOf(">", currentChar);
          const tag = fullText.substring(currentChar, closingTag + 1);
          currentP.innerHTML += tag;
          currentChar = closingTag + 1;
        } else {
          currentP.innerHTML += fullText[currentChar];
          currentChar++;
        }

        // Auto-scroll update
      if (aboutAutoScroll) {
          contentContainer.scrollTop = contentContainer.scrollHeight;
        }
        setTimeout(typeNextChar, 25);
      } else {
        // Line finish logic
        currentParagraph++;
        currentChar = 0;
        if (currentParagraph < paragraphs.length) {
          setTimeout(typeNextChar, 200);
        } else {
          // Sequence complete
          textContainer.classList.remove("typing");
          isTyping = false;
          scrollBottomBtn.classList.remove("pulse");
          if (isAtBottom()) scrollBottomBtn.classList.remove("visible");
        }
      }
    }

    typeNextChar();
  }

  // ====================================================================================================================================
  //  EXPORTS
  // ====================================================================================================================================

export { openAboutModal };
