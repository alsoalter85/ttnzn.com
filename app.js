const alien = document.querySelector(".alien");
const shoutButton = document.querySelector("#shout-button");
const quietButton = document.querySelector("#quiet-button");
const liveShout = document.querySelector("#live-shout");
const randomShouts = document.querySelector("#random-shouts");

let closeTimer;
let lastManualShout = 0;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const shoutLabels = ["attenzione", "attento", "ttn zn"];
const labelColors = ["#ffd238", "#e64b3c", "#6ab7ff", "#f9f2e2", "#9be7c2"];
const alienVoicePresets = [
  { rate: 0.58, pitch: 0.25 },
  { rate: 0.72, pitch: 0.35 },
  { rate: 0.82, pitch: 1.55 },
  { rate: 1.08, pitch: 0.55 },
  { rate: 1.22, pitch: 1.85 },
];
const maxExtraVoiceEs = 20;

function preventPageZoom(event) {
  event.preventDefault();
}

document.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  },
  { passive: false },
);

document.addEventListener("gesturestart", preventPageZoom, { passive: false });
document.addEventListener("gesturechange", preventPageZoom, { passive: false });
document.addEventListener("gestureend", preventPageZoom, { passive: false });

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function spawnRandomShout() {
  const label = document.createElement("span");

  label.className = "random-shout";
  label.textContent = shoutLabels[Math.floor(Math.random() * shoutLabels.length)];
  label.style.setProperty("--x", `${randomBetween(16, 84)}vw`);
  label.style.setProperty("--y", `${randomBetween(12, 84)}vh`);
  label.style.setProperty("--label-size", `${randomBetween(28, 78)}px`);
  label.style.setProperty("--label-rotation", `${randomBetween(-12, 12)}deg`);
  label.style.setProperty("--label-color", labelColors[Math.floor(Math.random() * labelColors.length)]);

  randomShouts.append(label);
}

function pickItalianVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith("it"));
}

function pickRandomVoice() {
  if (!("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const italianVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("it"));
  const voicePool = italianVoices.length ? italianVoices : voices;

  return voicePool.length ? randomItem(voicePool) : null;
}

function buildAttentionSpeech() {
  let extraEs = 0;

  while (extraEs < maxExtraVoiceEs && Math.random() < 0.5) {
    extraEs += 1;
  }

  return `attenzione${"e".repeat(extraEs)}`;
}

function speakAttention() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(buildAttentionSpeech());
  const randomVoice = pickRandomVoice();
  const voicePreset = randomItem(alienVoicePresets);

  utterance.lang = "it-IT";
  utterance.rate = voicePreset.rate;
  utterance.pitch = voicePreset.pitch;
  utterance.volume = 1;

  if (randomVoice) {
    utterance.voice = randomVoice;
  }

  window.speechSynthesis.speak(utterance);
}

function closeMouth() {
  window.clearTimeout(closeTimer);
  alien.classList.remove("is-shouting");
  alien.setAttribute("aria-pressed", "false");
  liveShout.textContent = "";
}

function shout({ voice = true, burst = true } = {}) {
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

  if (burst) {
    spawnRandomShout();
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
    shout({ voice: false, burst: false });
  }
}, 8500);
