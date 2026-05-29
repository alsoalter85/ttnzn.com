const alien = document.querySelector(".alien");
const shoutButton = document.querySelector("#shout-button");
const quietButton = document.querySelector("#quiet-button");
const liveShout = document.querySelector("#live-shout");
const randomShouts = document.querySelector("#random-shouts");
const animatedMarks = Array.from(document.querySelectorAll(".attento-mark"));

let closeTimer;
let lastManualShout = 0;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const markStates = animatedMarks
  .map((mark) => {
    const eyes = mark.querySelector(".attento-eyes");
    const eyePaths = Array.from(mark.querySelectorAll(".attento-eye")).map((path) => {
      const fallbackOrigin = path.classList.contains("attento-eye-left")
        ? { x: 96, y: 383 }
        : { x: 349, y: 393 };

      try {
        const box = path.getBBox();
        return {
          path,
          origin: {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
          },
        };
      } catch {
        return { path, origin: fallbackOrigin };
      }
    });

    if (!eyes || !eyePaths.length) {
      return null;
    }

    return {
      mark,
      eyes,
      eyePaths,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      lid: 1,
      targetLid: 1,
    };
  })
  .filter(Boolean);
let gazeFrame = 0;
let blinkTimer;
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

function requestAttentoGazeTick() {
  if (prefersReducedMotion || gazeFrame) {
    return;
  }

  gazeFrame = window.requestAnimationFrame(tickAttentoGaze);
}

function tickAttentoGaze() {
  gazeFrame = 0;
  let shouldContinue = false;

  markStates.forEach((state) => {
    state.x += (state.targetX - state.x) * 0.16;
    state.y += (state.targetY - state.y) * 0.16;
    state.lid += (state.targetLid - state.lid) * 0.56;

    if (
      Math.abs(state.targetX - state.x) > 0.02 ||
      Math.abs(state.targetY - state.y) > 0.02 ||
      Math.abs(state.targetLid - state.lid) > 0.004
    ) {
      shouldContinue = true;
    }

    state.mark.style.setProperty("--gaze-x", `${state.x.toFixed(3)}px`);
    state.mark.style.setProperty("--gaze-y", `${state.y.toFixed(3)}px`);
    state.mark.style.setProperty("--lid-scale", state.lid.toFixed(3));
    state.eyes.setAttribute("transform", `translate(${state.x.toFixed(3)} ${state.y.toFixed(3)})`);

    state.eyePaths.forEach(({ path, origin }) => {
      const x = origin.x.toFixed(3);
      const y = origin.y.toFixed(3);
      path.setAttribute(
        "transform",
        `translate(${x} ${y}) scale(1 ${state.lid.toFixed(3)}) translate(${-origin.x} ${-origin.y})`,
      );
    });
  });

  if (shouldContinue) {
    requestAttentoGazeTick();
  }
}

function updateAttentoGaze(event) {
  markStates.forEach((state) => {
    const rect = state.mark.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    const ratio = distance / (distance + 320);
    const angle = Math.atan2(dy, dx);
    const gazeRange = state.mark.classList.contains("attento-mark-wordmark") ? 18 : 22;

    state.targetX = Math.cos(angle) * gazeRange * ratio;
    state.targetY = Math.sin(angle) * gazeRange * ratio * 0.55;
  });

  requestAttentoGazeTick();
}

function resetAttentoGaze() {
  markStates.forEach((state) => {
    state.targetX = 0;
    state.targetY = 0;
  });

  requestAttentoGazeTick();
}

function scheduleAttentoBlink(delay = 1600) {
  if (prefersReducedMotion || !animatedMarks.length) {
    return;
  }

  window.clearTimeout(blinkTimer);
  blinkTimer = window.setTimeout(() => {
    markStates.forEach((state) => {
      state.mark.classList.add("is-blinking");
      state.targetLid = 0.04;
    });
    requestAttentoGazeTick();

    window.setTimeout(() => {
      markStates.forEach((state) => {
        state.mark.classList.remove("is-blinking");
        state.targetLid = 1;
      });
      requestAttentoGazeTick();
      scheduleAttentoBlink(3500 + Math.random() * 3500);
    }, 110);
  }, delay);
}

requestAttentoGazeTick();

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

if (!prefersReducedMotion) {
  window.addEventListener("pointermove", updateAttentoGaze, { passive: true });
  window.addEventListener("blur", resetAttentoGaze);
  document.addEventListener("pointerleave", resetAttentoGaze);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetAttentoGaze();
    }
  });
  scheduleAttentoBlink();
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
