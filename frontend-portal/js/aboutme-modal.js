// ====================================================================================================================================
//  ABOUT ME MODAL MODULE
// ====================================================================================================================================

let aboutModal = null;

function createAboutModal() {
  if (aboutModal) return;

  aboutModal = document.createElement("div");
  aboutModal.className = "about-modal";
  aboutModal.innerHTML = `
      <div class="about-modal-container">
        <button class="about-modal-close" aria-label="Close About">×</button>
        <h2 class="about-modal-title">ABOUT ME</h2>
        <div class="about-modal-content">
          <div class="about-modal-text">
            <!-- Typewriter text will be injected here -->
          </div>
        </div>
        <button class="about-scroll-bottom" aria-label="Scroll to bottom"></button>
      </div>
    `;

  document.body.appendChild(aboutModal);

  // Close button event
  const closeBtn = aboutModal.querySelector(".about-modal-close");
  closeBtn.addEventListener("click", closeAboutModal);

  // Click outside to close
  aboutModal.addEventListener("click", (e) => {
    if (e.target === aboutModal) {
      closeAboutModal();
    }
  });

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aboutModal.classList.contains("active")) {
      closeAboutModal();
    }
  });

  // Scroll to bottom button
  const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");
  scrollBottomBtn.addEventListener("click", () => {
    const contentContainer = aboutModal.querySelector(".about-modal-content");
    contentContainer.scrollTo({
      top: contentContainer.scrollHeight,
      behavior: "smooth",
    });
    // Re-enable auto-scroll
    window.aboutAutoScroll = true;
  });
}

function openAboutModal() {
  createAboutModal();

  setTimeout(() => {
    aboutModal.classList.add("active");
    // Start typewriter effect after modal animation
    setTimeout(() => {
      startTypewriter();
    }, 300);
  }, 10);
}

function closeAboutModal() {
  if (!aboutModal) return;
  aboutModal.classList.remove("active");
}

function startTypewriter() {
  const textContainer = aboutModal.querySelector(".about-modal-text");
  const contentContainer = aboutModal.querySelector(".about-modal-content");
  const scrollBottomBtn = aboutModal.querySelector(".about-scroll-bottom");

  const paragraphs = [
    "Hello <strong>stranger</strong>,",

    "My name is <strong>Benjamin Tron</strong>, a software and web developer based in Karlsruhe, Germany. My professional journey began in a hands-on world: from 2002 to 2006, I trained as an industrial mechanic, learning precision, structure, and how complex systems truly work beneath the surface.",

    "Years later, curiosity pulled me deeper into the digital realm. Between 2022 and 2024, I completed a 24-month career transition and earned an IHK qualification as a Computer Science Expert, specializing in software development. To further sharpen my skills, I pursued an intensive 10-month web development program from 2025 to 2026.",

    "Today, I'm passionate about full-stack development, building software that connects logic and creativity, backend robustness and frontend experience. I enjoy understanding how things work end to end, from databases and APIs to clean interfaces and thoughtful user interactions.",

    "I'm driven by curiosity, continuous learning, and a quiet fascination with solving problems that aren't always obvious at first glance. Some details reveal themselves instantly, others only after you look a little closer.",
  ];

  // Clear existing content
  textContainer.innerHTML = "";
  textContainer.classList.add("typing");

  // Auto-scroll control
  window.aboutAutoScroll = true;
  let isTyping = true;

  // Check if user is at bottom
  function isAtBottom() {
    const threshold = 50; // pixels from bottom
    return (
      contentContainer.scrollHeight -
        contentContainer.scrollTop -
        contentContainer.clientHeight <
      threshold
    );
  }

  // Scroll event listener - detect manual scroll
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
    // Check if modal is still open
    if (!aboutModal.classList.contains("active")) {
      textContainer.classList.remove("typing");
      isTyping = false;
      scrollBottomBtn.classList.remove("visible", "pulse");
      return;
    }

    // Start new paragraph
    if (currentChar === 0) {
      currentP = document.createElement("p");
      currentP.style.opacity = "1";
      textContainer.appendChild(currentP);
    }

    const fullText = paragraphs[currentParagraph];

    // Type character by character
    if (currentChar < fullText.length) {
      // Handle HTML tags
      if (fullText[currentChar] === "<") {
        const closingTag = fullText.indexOf(">", currentChar);
        const tag = fullText.substring(currentChar, closingTag + 1);
        currentP.innerHTML += tag;
        currentChar = closingTag + 1;
      } else {
        currentP.innerHTML += fullText[currentChar];
        currentChar++;
      }

      // Auto-scroll to bottom only if enabled
      if (window.aboutAutoScroll) {
        contentContainer.scrollTop = contentContainer.scrollHeight;
      }

      // Continue typing
      setTimeout(typeNextChar, 25);
    } else {
      // Move to next paragraph
      currentParagraph++;
      currentChar = 0;

      if (currentParagraph < paragraphs.length) {
        setTimeout(typeNextChar, 200);
      } else {
        // Finished typing all paragraphs
        textContainer.classList.remove("typing");
        isTyping = false;
        scrollBottomBtn.classList.remove("pulse");

        // Hide button if at bottom
        if (isAtBottom()) {
          scrollBottomBtn.classList.remove("visible");
        }
      }
    }
  }

  typeNextChar();
}
