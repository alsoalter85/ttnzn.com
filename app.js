const alien = document.querySelector(".alien");
const shoutButton = document.querySelector("#shout-button");
const autoClickerButton = document.querySelector("#auto-clicker-button");
const autoClickerLabel = document.querySelector("#auto-clicker-label");
const quietButton = document.querySelector("#quiet-button");
const guideButton = document.querySelector("#guide-button");
const probabilityGuide = document.querySelector("#probability-guide");
const guideCloseButton = document.querySelector("#guide-close-button");
const liveShout = document.querySelector("#live-shout");
const randomShouts = document.querySelector("#random-shouts");
const pronunciationRecord = document.querySelector("#pronunciation-record");
const pronunciationRecordValue = document.querySelector("#pronunciation-record-value");
const recordOddsValue = document.querySelector("#record-odds-value");
const recordOddsFact = document.querySelector("#record-odds-fact");
const recordWord = document.querySelector("#record-word");
const clickTotal = document.querySelector("#click-total");
const clickTotalValue = document.querySelector("#click-total-value");
const confetti = document.querySelector("#confetti");
const animatedMarks = Array.from(document.querySelectorAll(".attento-mark"));

let closeTimer;
let lastManualShout = 0;
let highestExtraEs = -1;
let totalClicks = 0;
let autoClickerRunning = false;
let autoClickerVisualTick = 0;

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
const confettiColors = ["#ffd238", "#e64b3c", "#6ab7ff", "#9be7c2", "#f9f2e2"];
const alienVoicePresets = [
  { rate: 0.58, pitch: 0.25 },
  { rate: 0.72, pitch: 0.35 },
  { rate: 0.82, pitch: 1.55 },
  { rate: 1.08, pitch: 0.55 },
  { rate: 1.22, pitch: 1.85 },
];
const maxExtraVoiceEs = 100;
const autoClickerFrameMs = 16;
const autoClickerFrameBudgetMs = 6;
const autoClickerMaxAttemptsPerFrame = 5000;
const numberFormatter = new Intl.NumberFormat("en-US");
const compactNumberUnits = [
  { value: 1_000_000_000_000, suffix: "T" },
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
];
const oddsFactsByLevel = {
  1: [
    "Same as calling heads on one fair coin flip.",
    "About like guessing whether one computer bit is 0 or 1.",
    "Like picking Phobos or Deimos, one of Mars's two moons.",
    "Like choosing one of Earth's two geographic poles.",
    "Roughly the split between male and female births in humans.",
  ],
  2: [
    "Like naming one of DNA's four letters: A, C, G, or T.",
    "Like picking one of Jupiter's four Galilean moons.",
    "Like choosing one of the four Beatles.",
    "Like guessing one exact suit in a deck of cards.",
    "Like pointing to one cardinal direction on a compass.",
  ],
  3: [
    "Like picking one planet from the classic eight planets.",
    "Like choosing one arm on an octopus.",
    "Like picking one leg on a spider.",
    "Like naming one of the eight major Moon phases.",
    "Same as calling 3 coin flips correctly in a row.",
  ],
  4: [
    "Like choosing one of the 16 chess pieces on one side.",
    "Like choosing one exact ounce from a pound.",
    "Like selecting one team from the Sweet Sixteen.",
    "About like choosing one cell in a 16-cell early embryo.",
    "Same as calling 4 coin flips correctly in a row.",
  ],
  5: [
    "Like choosing one piece from all pieces on a chessboard at the start.",
    "Like picking one tooth from an adult human mouth.",
    "Like selecting one team from the NFL.",
    "Like naming one point on a 32-point mariner's compass.",
    "Same as calling 5 coin flips correctly in a row.",
  ],
  6: [
    "Like picking one exact square on a chessboard.",
    "Like naming one codon from the genetic code.",
    "Like choosing one hexagram from the I Ching.",
    "Like opening one crayon from a classic 64-count Crayola box.",
    "Same as calling 6 coin flips correctly in a row.",
  ],
  7: [
    "Like guessing one code from the original 128 ASCII characters.",
    "Like choosing one MIDI note number from 0 to 127.",
    "About like picking one chemical element from the periodic table.",
    "About like choosing one of the original 151 Pokemon.",
    "About like naming one U.S. senator from the 100-seat Senate.",
  ],
  8: [
    "Like guessing one exact byte value in computer memory.",
    "Like choosing one shade value from a single 8-bit color channel.",
    "Like landing on Pac-Man's famous level 256 kill screen.",
    "About like picking one country from the world's countries.",
    "About like choosing one bone from an adult human skeleton.",
  ],
  9: [
    "About like choosing one member of the 535-seat U.S. Congress.",
    "Like picking one cubelet in an 8 by 8 by 8 science cube.",
    "Like choosing one old-school 512-byte disk sector.",
    "About like picking one card from ten shuffled decks.",
    "Same as calling 9 coin flips correctly in a row.",
  ],
  10: [
    "Like picking one byte from a binary kilobyte.",
    "Like choosing one pixel in a 32 by 32 app icon.",
    "Like picking one second in a 17-minute rocket countdown.",
    "About like picking one seat in a packed 1,000-seat theater.",
    "Same as calling 10 coin flips correctly in a row.",
  ],
  11: [
    "Like choosing one number from 1 to the 2048 game's winning tile.",
    "About like picking one year from two thousand years of history.",
    "Like choosing one pixel in a tiny 64 by 32 OLED screen.",
    "About like picking one seat in a packed Broadway-sized theater.",
    "Same as calling 11 coin flips correctly in a row.",
  ],
  12: [
    "Like choosing one possible value in a 12-bit sensor reading.",
    "About like picking one star visible to the naked eye under a dark sky.",
    "Like picking one pixel across a 4K cinema-wide row.",
    "Like choosing one day from 11 years of field notes.",
    "Same as calling 12 coin flips correctly in a row.",
  ],
  13: [
    "About like picking one meter along Mount Everest's height.",
    "About like choosing one species from the world's living bird species.",
    "Like choosing one sample from 8,192 old digital-audio levels.",
    "Like choosing one exact day from about 22 years.",
    "Same as calling 13 coin flips correctly in a row.",
  ],
  14: [
    "About like picking one line from Homer's Iliad.",
    "About like picking one described ant species.",
    "Like selecting one pixel across a 16K-wide image.",
    "Like choosing one exact day from about 45 years.",
    "Same as calling 14 coin flips correctly in a row.",
  ],
  15: [
    "About like choosing one fish species from the world's known fish species.",
    "About like picking one protein-coding gene from the human genome.",
    "About like picking one spectator in a full major-league ballpark.",
    "Like choosing one sample level in 15-bit digital audio.",
    "Like choosing one exact day from about 90 years.",
  ],
  16: [
    "Like choosing one Unicode code point in the Basic Multilingual Plane.",
    "Like choosing one possible color in old 16-bit color graphics.",
    "About like picking one seat in the ancient Colosseum at full crowd size.",
    "About like picking one tree species from the world's known tree species.",
    "Same as calling 16 coin flips correctly in a row.",
  ],
  17: [
    "About like picking one heartbeat from a full day of human heartbeats.",
    "About like choosing one word from a long novel.",
    "About like picking one seat from the largest college football stadiums.",
    "Like choosing one pixel in a 362 by 362 image.",
    "Like choosing one exact second from about 36 hours.",
  ],
  18: [
    "Like choosing one pixel in a 512 by 512 image.",
    "About like picking one year since early Homo sapiens appeared.",
    "About like choosing one species from the world's flowering plants.",
    "About like choosing one letter from a short novel manuscript.",
    "Same as calling 18 coin flips correctly in a row.",
  ],
  19: [
    "About like picking one word from War and Peace.",
    "About like picking one described beetle species.",
    "Like choosing one byte from half a binary megabyte.",
    "About like choosing one seat from two Indianapolis 500 crowds.",
    "Like choosing one exact second from about 6 days.",
  ],
  20: [
    "Like picking one byte from a binary megabyte.",
    "About like picking one person from a city of one million.",
    "Like choosing one square meter inside one square kilometer.",
    "About like naming one described insect species.",
    "Same as calling 20 coin flips correctly in a row.",
  ],
  21: [
    "About like picking one stone block from the Great Pyramid of Giza.",
    "About like picking one species from all described animal species.",
    "About like picking one pixel from a 2-megapixel photo.",
    "Like choosing one second from the Apollo 11 mission, repeated many times over.",
    "Like choosing one exact second from about 24 days.",
  ],
  22: [
    "Like choosing one pixel in a 2048 by 2048 image.",
    "About like picking one mile from the U.S. public road network.",
    "About like choosing one person from a city-sized crowd of four million.",
    "Like choosing one row from a 4-million-row fossil spreadsheet.",
    "Like choosing one exact second from about 49 days.",
  ],
  23: [
    "About like choosing one millimeter of Mount Everest's height.",
    "About like choosing one estimated eukaryote species on Earth.",
    "About like choosing one meter along the Moon's circumference.",
    "Like choosing one pixel in an 8-megapixel phone photo.",
    "Like choosing one exact second from about 97 days.",
  ],
  24: [
    "Like choosing one exact color in 24-bit RGB color.",
    "About like picking one person from a country-sized crowd of 17 million.",
    "Like picking one cell in a 256 by 256 by 256 cube.",
    "Like choosing one exact second from about 194 days.",
    "Same as calling 24 coin flips correctly in a row.",
  ],
  25: [
    "About like choosing one exact second from a year.",
    "About like choosing one book from one of the world's largest library collections.",
    "About like choosing one heartbeat from about a year of resting heartbeats.",
    "Like choosing one exact frame from about 6 days of 60 fps video.",
    "Same as calling 25 coin flips correctly in a row.",
  ],
  26: [
    "About like picking one year since the dinosaurs were wiped out.",
    "About like picking one year since the Chicxulub impact.",
    "Like choosing one exact second from about 2 years.",
    "Like choosing one byte from 64 MiB of computer memory.",
    "Same as calling 26 coin flips correctly in a row.",
  ],
  27: [
    "About like picking one rod photoreceptor from a human eye.",
    "About like picking one year from the rise of flowering plants.",
    "Like choosing one exact second from about 4 years.",
    "Like choosing one byte from 128 MiB of computer memory.",
    "Same as calling 27 coin flips correctly in a row.",
  ],
  28: [
    "About like picking one scent receptor from a dog's nose.",
    "About like picking one year from the age of the earliest dinosaurs.",
    "Like choosing one byte from 256 MiB of computer memory.",
    "About like picking one meter along the average Earth-Moon distance.",
    "Same as calling 28 coin flips correctly in a row.",
  ],
  29: [
    "About like picking one year from the Cambrian explosion.",
    "About like choosing one alveolus from both human lungs.",
    "About like picking one person from Latin America and the Caribbean.",
    "Like choosing one byte from 512 MiB of computer memory.",
    "Like choosing one exact second from about 17 years.",
  ],
  30: [
    "About like picking one person from a billion-person crowd.",
    "Like choosing one byte from 1 GiB of computer memory.",
    "About like choosing one exact second from 34 years.",
    "About like picking one base from a massive ancient-DNA database.",
    "Same as calling 30 coin flips correctly in a row.",
  ],
  31: [
    "About like picking one person from Earth's population in the late 1920s.",
    "Like guessing one positive signed 32-bit integer value.",
    "About like picking one year from the age of the Great Oxidation Event.",
    "About like picking one year from the age of the first eukaryotes.",
    "Same as calling 31 coin flips correctly in a row.",
  ],
  32: [
    "Like choosing one exact IPv4 address.",
    "About like picking one year from Earth's 4.54-billion-year age.",
    "About like choosing one base pair from a human haploid genome.",
    "About like picking one person from half of humanity.",
    "Same as calling 32 coin flips correctly in a row.",
  ],
  33: [
    "About like choosing one base pair from a human diploid genome.",
    "Like choosing one byte from 8 GiB of computer memory.",
    "About like choosing one exact second from 272 years.",
    "About like choosing one meter from the distance light travels in 29 seconds.",
    "Same as calling 33 coin flips correctly in a row.",
  ],
  34: [
    "About like choosing one neuron from the human cerebral cortex.",
    "Like choosing one byte from 16 GiB of computer memory.",
    "About like choosing one base pair from the bread wheat genome.",
    "About like choosing one exact second from 544 years.",
    "Same as calling 34 coin flips correctly in a row.",
  ],
  35: [
    "About like picking one base pair from an axolotl's giant genome.",
    "Like choosing one byte from 32 GiB of computer memory.",
    "About like choosing one exact second since the early Middle Ages.",
    "About like picking one neuron from several human brains at once.",
    "Same as calling 35 coin flips correctly in a row.",
  ],
  36: [
    "About like picking one neuron from the human brain.",
    "About like choosing one neuron from the human cerebellum.",
    "Like choosing one byte from 64 GiB of computer memory.",
    "About like choosing one exact second from the Roman Empire to today.",
    "Same as calling 36 coin flips correctly in a row.",
  ],
  37: [
    "About like choosing one human from everyone who has ever lived.",
    "About like choosing one star from the low-end estimates of the Milky Way.",
    "Like choosing one byte from 128 GiB of computer memory.",
    "About like choosing one exact second since the Great Pyramid was built.",
    "Same as calling 37 coin flips correctly in a row.",
  ],
  38: [
    "About like choosing one star from the Milky Way.",
    "About like choosing one tree from the Amazon's hundreds of billions of trees.",
    "Like choosing one byte from 256 GiB of computer memory.",
    "About like choosing one exact second since the beginning of agriculture.",
    "Same as calling 38 coin flips correctly in a row.",
  ],
  39: [
    "About like choosing one exact second from the age of Lascaux cave art.",
    "Like choosing one byte from 512 GiB of computer memory.",
    "About like picking one star from a giant spiral galaxy.",
    "About like choosing one tree from a whole continent of forests.",
    "Same as calling 39 coin flips correctly in a row.",
  ],
  40: [
    "About like choosing one star from the Andromeda galaxy.",
    "Like choosing one byte from 1 TiB of computer memory.",
    "About like choosing one exact second since famous Ice Age cave art was painted.",
    "Like guessing one possible 40-bit encryption key.",
    "Same as calling 40 coin flips correctly in a row.",
  ],
  41: [
    "About like choosing one tree from Earth's estimated trillions of trees.",
    "About like choosing one galaxy from high estimates of the observable universe.",
    "Like choosing one byte from 2 TiB of computer memory.",
    "About like choosing one exact second since humans began leaving Africa.",
    "Same as calling 41 coin flips correctly in a row.",
  ],
  42: [
    "About like choosing one kilometer from half a light-year.",
    "Like choosing one byte from 4 TiB of computer memory.",
    "About like choosing one exact second from the age of very early Homo sapiens fossils.",
    "About like picking one page from every book in thousands of giant libraries.",
    "Same as calling 42 coin flips correctly in a row.",
  ],
  43: [
    "About like choosing one kilometer from one light-year.",
    "Like choosing one byte from 8 TiB of computer memory.",
    "About like choosing one exact second from 279,000 years of human prehistory.",
    "About like picking one star from dozens of Milky Way-sized galaxies.",
    "Same as calling 43 coin flips correctly in a row.",
  ],
  44: [
    "About like choosing one red blood cell from a human body.",
    "Like choosing one byte from 16 TiB of computer memory.",
    "About like choosing one mile from three light-years.",
    "About like choosing one exact second from about 558,000 years.",
    "Same as calling 44 coin flips correctly in a row.",
  ],
  45: [
    "About like choosing one cell from the roughly 37 trillion cells in a human body.",
    "About like choosing one microbe from the bacteria living in and on a human body.",
    "Like choosing one byte from 32 TiB of computer memory.",
    "About like choosing one kilometer from the distance to Proxima Centauri.",
    "Same as calling 45 coin flips correctly in a row.",
  ],
  46: [
    "About like choosing one cell or microbe from the combined human-body ecosystem.",
    "Like choosing one byte from 64 TiB of computer memory.",
    "About like choosing one exact second from the age of early Homo fossils.",
    "About like choosing one meter from the distance light travels in about 3 days.",
    "Same as calling 46 coin flips correctly in a row.",
  ],
  47: [
    "About like choosing one synapse from the human brain.",
    "Like choosing one byte from 128 TiB of computer memory.",
    "About like choosing one exact second from the age of ancient hominin fossils.",
    "About like choosing one meter from the distance light travels in about 5 days.",
    "Same as calling 47 coin flips correctly in a row.",
  ],
  48: [
    "About like choosing one exact second from the time since humans and chimpanzees shared an ancestor.",
    "Like choosing one byte from 256 TiB of computer memory.",
    "About like choosing one meter from the distance light travels in about 11 days.",
    "About like choosing one synapse from multiple human brains together.",
    "Same as calling 48 coin flips correctly in a row.",
  ],
  49: [
    "About like choosing one meter from the distance light travels in about 22 days.",
    "Like choosing one byte from 512 TiB of computer memory.",
    "About like choosing one exact second from the middle of the Miocene epoch.",
    "About like choosing one star from thousands of Milky Way-sized galaxies.",
    "Same as calling 49 coin flips correctly in a row.",
  ],
  50: [
    "About like choosing one meter from the distance light travels in about 43 days.",
    "Like choosing one byte from 1 PiB of computer storage.",
    "About like choosing one exact second from about 35.7 million years.",
    "Like guessing one possible 50-bit computer key.",
    "Same as calling 50 coin flips correctly in a row.",
  ],
};
const overflowOddsFacts = [
  "Past the 50-level fact guide; rarer than calling 50 coin flips correctly.",
  "Past the chart; even the 1 PiB storage comparison is now too small.",
  "Past level 50; rarer than guessing a 50-bit computer key.",
  "Past the guide; deeper than choosing one meter from 43 light-days.",
  "Past the prepared facts; the exact odds number is now the main event.",
];

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

function formatWholeNumber(value) {
  return numberFormatter.format(value);
}

function formatCompactCount(value) {
  const absoluteValue = Math.abs(value);
  const unit = compactNumberUnits.find(({ value: unitValue }) => absoluteValue >= unitValue);

  if (!unit) {
    return formatWholeNumber(value);
  }

  return `${(value / unit.value).toFixed(2)}${unit.suffix}`;
}

function formatBigInt(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function buildAttentionText(extraEs) {
  return `ATTENZIONE${"E".repeat(Math.max(0, extraEs))}`;
}

function exactOddsDenominator(extraEs) {
  const exponent = extraEs >= maxExtraVoiceEs ? maxExtraVoiceEs : extraEs + 1;

  return 1n << BigInt(exponent);
}

function oddsLevelForExtraEs(extraEs) {
  return Math.max(1, extraEs + 1);
}

function pickOddsFact(extraEs) {
  const level = oddsLevelForExtraEs(extraEs);
  const facts = level > 50 ? overflowOddsFacts : oddsFactsByLevel[level];

  return randomItem(facts);
}

function updateRecordDetails(extraEs) {
  const visibleExtraEs = Math.max(0, extraEs);

  if (recordWord) {
    recordWord.textContent = buildAttentionText(visibleExtraEs);
  }

  if (recordOddsValue) {
    recordOddsValue.textContent = `one in ${formatBigInt(exactOddsDenominator(visibleExtraEs))}`;
  }

  if (recordOddsFact) {
    recordOddsFact.textContent = pickOddsFact(visibleExtraEs);
  }
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
  if (!randomShouts || !randomShouts.isConnected) {
    return;
  }

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

function clearRandomShouts() {
  if (randomShouts) {
    randomShouts.replaceChildren();
  }
}

function spawnConfettiBurst() {
  if (!confetti || !pronunciationRecord) {
    return;
  }

  const rect = pronunciationRecord.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const pieces = 36;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement("span");
    const angle = randomBetween(-Math.PI, 0);
    const distance = randomBetween(70, 220);

    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${originX}px`);
    piece.style.setProperty("--y", `${originY}px`);
    piece.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--ty", `${Math.sin(angle) * distance + randomBetween(30, 110)}px`);
    piece.style.setProperty("--spin", `${randomBetween(-720, 720)}deg`);
    piece.style.setProperty("--confetti-color", randomItem(confettiColors));
    piece.style.setProperty("--confetti-delay", `${randomBetween(0, 90)}ms`);
    piece.addEventListener("animationend", () => piece.remove(), { once: true });
    fragment.append(piece);
  }

  confetti.append(fragment);
}

function updatePronunciationRecord(extraEs) {
  if (extraEs <= highestExtraEs || !pronunciationRecord || !pronunciationRecordValue) {
    return;
  }

  highestExtraEs = extraEs;
  pronunciationRecordValue.textContent = String(extraEs);
  updateRecordDetails(extraEs);
  pronunciationRecord.classList.remove("is-record");
  void pronunciationRecord.offsetWidth;
  pronunciationRecord.classList.add("is-record");
  window.setTimeout(() => pronunciationRecord.classList.remove("is-record"), 900);
  spawnConfettiBurst();
}

function updateClickTotal(amount = 1, { animate = true } = {}) {
  if (!clickTotal || !clickTotalValue) {
    return;
  }

  totalClicks += amount;
  clickTotalValue.textContent = formatCompactCount(totalClicks);
  clickTotalValue.title = formatWholeNumber(totalClicks);
  clickTotal.setAttribute("aria-label", `${formatWholeNumber(totalClicks)} clicks total`);

  if (!animate) {
    return;
  }

  clickTotal.classList.remove("is-counted");
  void clickTotal.offsetWidth;
  clickTotal.classList.add("is-counted");
  window.setTimeout(() => clickTotal.classList.remove("is-counted"), 360);
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

function buildAttentionPronunciation() {
  let extraEs = 0;

  while (extraEs < maxExtraVoiceEs && Math.random() < 0.5) {
    extraEs += 1;
  }

  return {
    extraEs,
    text: `attenzione${"e".repeat(extraEs)}`,
  };
}

function speakAttention(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
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

function updateAutoClickerButton() {
  if (!autoClickerButton) {
    return;
  }

  autoClickerButton.setAttribute("aria-pressed", String(autoClickerRunning));

  if (autoClickerLabel) {
    autoClickerLabel.textContent = autoClickerRunning ? "stop" : "auto";
  }
}

function runAutoClickerBatch() {
  const start = performance.now();
  let attempts = 0;
  let bestExtraEs = highestExtraEs;

  while (
    attempts < autoClickerMaxAttemptsPerFrame &&
    performance.now() - start < autoClickerFrameBudgetMs
  ) {
    attempts += 1;
    bestExtraEs = Math.max(bestExtraEs, buildAttentionPronunciation().extraEs);
  }

  if (!attempts) {
    return;
  }

  lastManualShout = Date.now();
  updateClickTotal(attempts, { animate: false });

  if (bestExtraEs > highestExtraEs) {
    updatePronunciationRecord(bestExtraEs);
  }

  autoClickerVisualTick += 1;

  if (!prefersReducedMotion && autoClickerVisualTick % 8 === 0) {
    shout({ voice: false, burst: false });
  }
}

function stopAutoClicker() {
  window.clearInterval(window.ttnznAutoClicker);
  window.ttnznAutoClicker = 0;
  autoClickerRunning = false;
  updateAutoClickerButton();
}

function startAutoClicker() {
  stopAutoClicker();
  clearRandomShouts();

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  autoClickerRunning = true;
  autoClickerVisualTick = 0;
  window.ttnznAutoClicker = window.setInterval(runAutoClickerBatch, autoClickerFrameMs);
  updateAutoClickerButton();
}

function toggleAutoClicker() {
  if (autoClickerRunning) {
    stopAutoClicker();
    return;
  }

  startAutoClicker();
}

function openProbabilityGuide() {
  if (!probabilityGuide) {
    return;
  }

  if (typeof probabilityGuide.showModal === "function") {
    probabilityGuide.showModal();
    return;
  }

  probabilityGuide.setAttribute("open", "");
  probabilityGuide.classList.add("is-open");
}

function closeProbabilityGuide() {
  if (!probabilityGuide) {
    return;
  }

  if (typeof probabilityGuide.close === "function") {
    probabilityGuide.close();
    return;
  }

  probabilityGuide.removeAttribute("open");
  probabilityGuide.classList.remove("is-open");
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
    const pronunciation = buildAttentionPronunciation();
    lastManualShout = Date.now();
    updatePronunciationRecord(pronunciation.extraEs);
    speakAttention(pronunciation.text);
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

alien.addEventListener("click", () => {
  updateClickTotal();
  shout();
});
shoutButton.addEventListener("click", () => {
  updateClickTotal();
  shout();
});
quietButton.addEventListener("click", closeMouth);
autoClickerButton.addEventListener("click", toggleAutoClicker);
guideButton.addEventListener("click", openProbabilityGuide);
guideCloseButton.addEventListener("click", closeProbabilityGuide);
probabilityGuide.addEventListener("click", (event) => {
  if (event.target === probabilityGuide) {
    closeProbabilityGuide();
  }
});

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

  if (!autoClickerRunning && !document.hidden && enoughSilence && !alien.classList.contains("is-shouting")) {
    shout({ voice: false, burst: false });
  }
}, 8500);

updateRecordDetails(0);
