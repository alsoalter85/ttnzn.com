const alien = document.querySelector(".alien");
const shoutButton = document.querySelector("#shout-button");
const quietButton = document.querySelector("#quiet-button");
const liveShout = document.querySelector("#live-shout");

let closeTimer;
let lastManualShout = 0;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function pickItalianVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith("it"));
}

function speakAttention() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance("attenzione");
  const italianVoice = pickItalianVoice();

  utterance.lang = "it-IT";
  utterance.rate = 0.86;
  utterance.pitch = 0.7;
  utterance.volume = 1;

  if (italianVoice) {
    utterance.voice = italianVoice;
  }

  window.speechSynthesis.speak(utterance);
}

function closeMouth() {
  window.clearTimeout(closeTimer);
  alien.classList.remove("is-shouting");
  alien.setAttribute("aria-pressed", "false");
  liveShout.textContent = "";
}

function shout({ voice = true } = {}) {
  window.clearTimeout(closeTimer);
  alien.classList.remove("is-shouting");

  requestAnimationFrame(() => {
    alien.classList.add("is-shouting");
    alien.setAttribute("aria-pressed", "true");
    liveShout.textContent = "ATTENZIONE";
  });

  if (voice) {
    lastManualShout = Date.now();
    speakAttention();
  }

  closeTimer = window.setTimeout(closeMouth, prefersReducedMotion ? 1100 : 1850);
}

alien.addEventListener("click", () => shout());
shoutButton.addEventListener("click", () => shout());
quietButton.addEventListener("click", closeMouth);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMouth();
  }
});

if ("speechSynthesis" in window && "onvoiceschanged" in window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = pickItalianVoice;
}

window.setInterval(() => {
  const enoughSilence = Date.now() - lastManualShout > 6500;

  if (!document.hidden && enoughSilence && !alien.classList.contains("is-shouting")) {
    shout({ voice: false });
  }
}, 8500);
