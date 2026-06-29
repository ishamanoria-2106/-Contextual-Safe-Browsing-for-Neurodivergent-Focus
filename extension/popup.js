const modeSelect = document.getElementById("modeSelect");
const timerContainer = document.getElementById("timerContainer");

const startBtn = document.getElementById("startBtn");
const focusToggle = document.getElementById("focusToggle");

// SHOW / HIDE TIMER INPUT
modeSelect.addEventListener("change", () => {
  timerContainer.style.display =
    modeSelect.value === "timer" ? "block" : "none";
});

// 🚀 LOAD PREVIOUS SETTINGS (IMPORTANT UX FIX)
chrome.storage.sync.get(null, (config) => {
  if (!config) return;

  focusToggle.checked = config.focusActive || false;
  modeSelect.value = config.mode || "normal";
  document.getElementById("levelSelect").value = config.level || "basic";
  document.getElementById("intentInput").value = config.intent || "";

  if (config.mode === "timer") {
    timerContainer.style.display = "block";
  }
});

// START FOCUS
startBtn.onclick = () => {
  const intentValue = document.getElementById("intentInput").value.trim();

  // ❌ Prevent empty intent (IMPORTANT FIX)
  if (!intentValue) {
    alert("Please enter your focus intent.");
    return;
  }

  const config = {
    focusActive: focusToggle.checked,
    mode: modeSelect.value,
    level: document.getElementById("levelSelect").value,
    intent: intentValue.toLowerCase(),
    endTime: null
  };

  // ⏱ TIMER MODE
  if (config.mode === "timer") {
    const time = parseInt(document.getElementById("timerInput").value);

    if (!time || time <= 0) {
      alert("Please enter a valid time in minutes.");
      return;
    }

    config.endTime = Date.now() + time * 60000;
  }

  // 💾 SAVE CONFIG
  chrome.storage.sync.set(config, () => {
    reloadTab();
  });
};

// 🔁 AUTO STOP WHEN TOGGLE OFF
focusToggle.addEventListener("change", () => {
  if (!focusToggle.checked) {
    chrome.storage.sync.set({ focusActive: false }, () => {
      reloadTab();
    });
  }
});

// 🔄 RELOAD CURRENT TAB (SAFE)
function reloadTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length && tabs[0].id) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}
if (location.hostname.includes("youtube.com")) {
  disableYouTubeHoverAutoplay();
}