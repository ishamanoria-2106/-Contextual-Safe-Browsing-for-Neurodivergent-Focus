let paused = false;
let timerInterval;

// INIT
chrome.storage.sync.get(null, (config) => {
  if (!config.focusActive) return;

  const intentWords = (config.intent || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  startFiltering(config, intentWords);
});

// 🚀 START FILTERING (FIXED)
function startFiltering(config, intentWords) {
  runFilter(config, intentWords);
  detectAndRemoveNavbar();

  let throttleTimeout = null;

  const observer = new MutationObserver(() => {
    if (throttleTimeout) return;

    throttleTimeout = setTimeout(() => {
      runFilter(config, intentWords);
      throttleTimeout = null;
    }, 200);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  createControlPanel(config);

  if (config.mode === "timer" && config.endTime) {
    startTimer(config.endTime);
  }
}

// 🎯 BETTER ELEMENT SELECTION (IMPORTANT)
function getCandidateElements() {
  return Array.from(
    document.querySelectorAll("ytd-rich-item-renderer, article, section, div")
  ).filter(el =>
    el.innerText &&
    el.innerText.length > 40 &&
    el.offsetParent !== null &&
    !el.closest("nav, header, [role='navigation'], [role='search'], form")
  );
}
// 🧠 STRONG RELEVANCE LOGIC
function isRelevant(text, intentWords) {
  let score = 0;

  intentWords.forEach(word => {
    if (text.includes(word)) score += 3;
  });

  const fullIntent = intentWords.join(" ");
  if (text.includes(fullIntent)) score += 5;

  const distractors = [
    "meme", "funny", "viral", "prank", "shorts",
    "celebrity", "gossip", "drama", "reaction"
  ];

  distractors.forEach(word => {
    if (text.includes(word)) score -= 4;
  });

  if (text.length < 40) score -= 2;

  return score >= 3;
}

// 📦 SMART CONTAINER
function getContentContainer(el) {
  const container =
    el.closest("ytd-rich-item-renderer") ||
    el.closest("article") ||
    el.closest("[role='article']") ||
    el.closest("section") ||
    el;

  // 🚫 Prevent selecting navbar accidentally
  if (
    container.closest("nav, header, [role='navigation'], [role='search'], form")
  ) {
    return null;
  }

  return container;
}
// 🚀 MAIN FILTER (CRITICAL FIX)
function runFilter(config, intentWords) {
  if (paused) return;

  const elements = getCandidateElements();

  elements.forEach(el => {
    const container = getContentContainer(el);
    if (!container) return;

    const text = el.innerText.toLowerCase();

    if (config.level === "basic") {
      if (isRelevant(text, intentWords)) {
        removeBlur(container);
      } else {
        applyBlur(container);
      }
    } else {
      // fallback if AI fails
      if (isRelevant(text, intentWords)) {
        removeBlur(container);
      } else {
        applyBlur(container);
      }
    }
  });
}

// 🌫️ BLUR
function applyBlur(el) {
  if (!el) return;

  // 🚫 Skip navbar or anything inside it
  if (el.closest("nav, header, [role='navigation'], [role='search'], form")) {
    return;
  }

  el.classList.add("fg-blur");
}
// 🔓 REMOVE BLUR
function removeBlur(el) {
  if (!el) return;
  el.classList.remove("fg-blur");
}

// 🎮 CONTROL PANEL
function createControlPanel(config) {
  const panel = document.createElement("div");
  panel.className = "fg-control-panel";

  const timerText = document.createElement("span");
  timerText.innerText = "⏱ --:--";

  const pauseBtn = document.createElement("button");
  pauseBtn.className = "fg-btn";
  pauseBtn.innerText = "⏸";

  pauseBtn.onclick = () => {
    paused = !paused;
    pauseBtn.innerText = paused ? "▶" : "⏸";
  };

  const stopBtn = document.createElement("button");
  stopBtn.className = "fg-btn";
  stopBtn.innerText = "X";

  stopBtn.onclick = () => {
    chrome.storage.sync.set({ focusActive: false }, () => {
      location.reload();
    });
  };

  panel.appendChild(timerText);
  panel.appendChild(pauseBtn);
  panel.appendChild(stopBtn);

  document.body.appendChild(panel);
  panel.timerText = timerText;
}

// ⏱️ TIMER
function startTimer(endTime) {
  const panel = document.querySelector(".fg-control-panel");
  const timerText = panel?.timerText;

  timerInterval = setInterval(() => {
    if (paused) return;

    const rem = endTime - Date.now();

    if (rem <= 0) {
      clearInterval(timerInterval);
      if (timerText) timerText.innerText = "⏰ Done!";
      return;
    }

    const m = Math.floor(rem / 60000);
    const s = Math.floor((rem % 60000) / 1000);

    if (timerText) {
      timerText.innerText = `⏱ ${m}:${s.toString().padStart(2, "0")}`;
    }

  }, 1000);
}
// 🚫 NAVBAR REMOVAL
function detectAndRemoveNavbar() {
  document.querySelectorAll("nav, header").forEach(el => {
    el.style.display = "none";
  });
}
function disableYouTubeHoverAutoplay() {
  const style = document.createElement("style");

  style.innerHTML = `
    /* Remove hover preview */
    ytd-moving-thumbnail-renderer {
      display: none !important;
    }

    /* Reduce hover effects without breaking clicks */
    ytd-thumbnail:hover {
      transform: none !important;
    }
  `;

  document.head.appendChild(style);
}
