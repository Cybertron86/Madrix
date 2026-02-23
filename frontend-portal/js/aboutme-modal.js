// ====================================================================================================================================
//  ABOUT ME MODAL MODULE
// ====================================================================================================================================

(function() {
  "use strict";

  let aboutModal = null;

  const MODAL_HTML = `
    <div id="aboutOverlay" class="mx-modal-overlay">
      <div class="mx-modal-container about-modal-custom">
        <button class="mx-modal-close" id="aboutCloseBtn" aria-label="Close About Modal">×</button>
        <h2 class="mx-modal-title">ABOUT ME</h2>
        <div class="mx-modal-content about-modal-scroll-area">
          <div class="about-modal-text">
            <!-- Typewriter text will be injected here -->
          </div>
        </div>
        <button class="about-scroll-bottom" aria-label="Scroll to bottom"></button>
      </div>
    </div>
  `;

  function createAboutModal() {
    if (aboutModal) return;
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    aboutModal = document.getElementById("aboutOverlay");

    window.SecurityUtils.ModalManager.setup(aboutModal, closeAboutModal);

    // Scroll to bottom button
    const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");
    scrollBottomBtn.addEventListener("click", () => {
      const contentContainer = aboutModal.querySelector(".mx-modal-content");
      contentContainer.scrollTo({
        top: contentContainer.scrollHeight,
        behavior: "smooth",
      });
      window.aboutAutoScroll = true;
    });
  }

  function openAboutModal() {
    createAboutModal();
    aboutModal.classList.add("active");
    document.body.style.overflow = "hidden";
    
    // Clear previous text immediately to prevent flicker
    const textContainer = aboutModal.querySelector(".about-modal-text");
    if (textContainer) textContainer.innerHTML = "";
    
    // Start typewriter effect after modal animation
    setTimeout(() => {
      startTypewriter();
    }, 300);
  }

  function closeAboutModal() {
    if (!aboutModal) return;
    aboutModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  async function startTypewriter() {
    const textContainer = aboutModal.querySelector(".about-modal-text");
    const contentContainer = aboutModal.querySelector(".mx-modal-content");
    const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");

    // Fetch user info to personalize greeting
    let displayName = "stranger";
    try {
      const res = await fetch("/api/me.php");
      const user = await res.json();
      if (user && user.username && user.role !== "guest") {
        displayName = user.username;
      }
    } catch (err) {
      console.warn("Could not fetch user info for typewriter:", err);
    }

    const paragraphs = [
      `Hello <strong>${window.SecurityUtils.escapeHtml(displayName)}</strong>,`,
      "My name is <strong>Benjamin Tron</strong>, a software and web developer based in Karlsruhe, Germany. My professional journey began in a hands-on world: from 2002 to 2006, I trained as an industrial mechanic, learning precision, structure, and how complex systems truly work beneath the surface.",
      "Years later, curiosity pulled me deeper into the digital realm. Between 2022 and 2024, I completed a 24-month career transition and earned an IHK qualification as a Computer Science Expert, specializing in software development. To further sharpen my skills, I pursued an intensive 10-month web development program from 2025 to 2026.",
      "Today, I'm passionate about full-stack development, building software that connects logic and creativity, backend robustness and frontend experience. I enjoy understanding how things work end to end, from databases and APIs to clean interfaces and thoughtful user interactions.",
      "I'm driven by curiosity, continuous learning, and a quiet fascination with solving problems that aren't always obvious at first glance. Some details reveal themselves instantly, others only after you look a little closer.",
    ];

    textContainer.innerHTML = "";
    textContainer.classList.add("typing");
    window.aboutAutoScroll = true;
    let isTyping = true;

    function isAtBottom() {
      const threshold = 50;
      return (contentContainer.scrollHeight - contentContainer.scrollTop - contentContainer.clientHeight < threshold);
    }

    contentContainer.addEventListener("scroll", () => {
      if (!isTyping) return;
      if (isAtBottom()) {
        window.aboutAutoScroll = true;
        scrollBottomBtn.classList.remove("visible");
      } else {
        window.aboutAutoScroll = false;
        scrollBottomBtn.classList.add("visible", "pulse");
      }
    });

    let currentParagraph = 0;
    let currentChar = 0;
    let currentP = null;

    function typeNextChar() {
      if (!aboutModal.classList.contains("active")) {
        textContainer.classList.remove("typing");
        isTyping = false;
        scrollBottomBtn.classList.remove("visible", "pulse");
        return;
      }

      if (currentChar === 0) {
        currentP = document.createElement("p");
        currentP.style.opacity = "1";
        textContainer.appendChild(currentP);
      }

      const fullText = paragraphs[currentParagraph];

      if (currentChar < fullText.length) {
        if (fullText[currentChar] === "<") {
          const closingTag = fullText.indexOf(">", currentChar);
          const tag = fullText.substring(currentChar, closingTag + 1);
          currentP.innerHTML += tag;
          currentChar = closingTag + 1;
        } else {
          currentP.innerHTML += fullText[currentChar];
          currentChar++;
        }

        if (window.aboutAutoScroll) {
          contentContainer.scrollTop = contentContainer.scrollHeight;
        }
        setTimeout(typeNextChar, 25);
      } else {
        currentParagraph++;
        currentChar = 0;
        if (currentParagraph < paragraphs.length) {
          setTimeout(typeNextChar, 200);
        } else {
          textContainer.classList.remove("typing");
          isTyping = false;
          scrollBottomBtn.classList.remove("pulse");
          if (isAtBottom()) scrollBottomBtn.classList.remove("visible");
        }
      }
    }

    typeNextChar();
  }

  window.openAboutModal = openAboutModal;
})();
