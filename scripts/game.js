// Boucle de jeu : sélection des questions, minuteur, score, QCM, validation des réponses.

const state = {
  pool: [],
  mode: "qcm",
  score: 0,
  round: 0,
  totalRounds: 10,
  timed: true,
  timeLimit: 15000,
  timeRemaining: 15000,
  currentVehicle: null,
  currentImage: null,
  deck: [],
  deckPos: 0,
  timerId: null,
  answers: [],
};

// Une "carte" = un véhicule + une de ses photos. Tant qu'il reste assez de cartes distinctes
// pour couvrir le nombre de manches demandé, aucune photo ne peut être vue deux fois dans le
// même test : on pioche sans remise dans un paquet mélangé, reconstitué seulement s'il s'épuise.
function buildDeck(pool) {
  const cards = [];
  pool.forEach((vehicle) => {
    const images = vehicle.images && vehicle.images.length ? vehicle.images : ["img/placeholder.svg"];
    images.forEach((image) => cards.push({ vehicle, image }));
  });
  return shuffle(cards);
}

function drawCard() {
  if (state.deckPos >= state.deck.length) {
    const previousLastCard = state.deck[state.deck.length - 1];
    state.deck = buildDeck(state.pool);
    state.deckPos = 0;
    // Évite qu'une nouvelle pioche recommence immédiatement par la carte qu'on vient de montrer.
    if (previousLastCard && state.deck.length > 1) {
      const sameFirst = (c) => c.vehicle.id === previousLastCard.vehicle.id && c.image === previousLastCard.image;
      if (sameFirst(state.deck[0])) {
        [state.deck[0], state.deck[1]] = [state.deck[1], state.deck[0]];
      }
    }
  }
  const card = state.deck[state.deckPos];
  state.deckPos += 1;
  return card;
}

function dedupeByName(list) {
  const seen = new Set();
  const result = [];
  shuffle(list).forEach((v) => {
    if (!seen.has(v.name)) {
      seen.add(v.name);
      result.push(v);
    }
  });
  return result;
}

function buildQcmOptions(correctVehicle, poolVehicles) {
  // Les mauvaises réponses viennent uniquement de la même catégorie que le véhicule à deviner
  // (plus cohérent : pas d'avion mélangé à des chars).
  // Plusieurs véhicules du même nom existent pour différents pays (ex. "AH-64 Apache") : on
  // déduplique par nom pour ne jamais afficher deux fois le même intitulé.
  const fromPool = dedupeByName(
    poolVehicles.filter((v) => v.category === correctVehicle.category && v.name !== correctVehicle.name)
  );
  let distractors = fromPool.slice(0, 3);
  if (distractors.length < 3) {
    // Sélection trop restreinte (ex. un seul véhicule coché par catégorie en mode
    // "véhicule par véhicule") : on complète avec d'autres véhicules de la même catégorie
    // pris dans la base complète, pour garder un vrai QCM à 4 propositions.
    const usedNames = new Set([correctVehicle.name, ...distractors.map((v) => v.name)]);
    const fromFullSet = dedupeByName(
      VEHICLES.filter((v) => v.category === correctVehicle.category && !usedNames.has(v.name))
    );
    distractors = distractors.concat(fromFullSet.slice(0, 3 - distractors.length));
  }
  return shuffle([correctVehicle, ...distractors]);
}

function startGame(pool, mode) {
  state.pool = pool;
  state.mode = mode;
  state.score = 0;
  state.round = 0;
  state.deck = buildDeck(pool);
  state.deckPos = 0;
  state.answers = [];
  updateHud();
  showScreen("game");
  nextRound();
}

function nextRound() {
  state.round += 1;
  const card = drawCard();
  state.currentVehicle = card.vehicle;
  state.currentImage = card.image;
  updateHud();
  setFeedback("", "");
  setQuestionImage(document.getElementById("question-image"), state.currentImage, state.currentVehicle);
  renderAnswerArea();
  if (state.timed) {
    document.getElementById("timer-bar-track").classList.remove("hidden");
    startTimer();
  } else {
    clearInterval(state.timerId);
    document.getElementById("timer-bar-track").classList.add("hidden");
  }
}

function setQuestionImage(imgEl, image, vehicle) {
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = "img/placeholder.svg";
    imgEl.alt = "Image manquante : " + vehicle.name;
  };
  imgEl.alt = "Véhicule à identifier";
  imgEl.src = image;
}

function renderAnswerArea() {
  const qcmArea = document.getElementById("answer-qcm");
  const textArea = document.getElementById("answer-text-form");

  if (state.mode === "qcm") {
    textArea.classList.add("hidden");
    qcmArea.classList.remove("hidden");
    clearChildren(qcmArea);
    const options = buildQcmOptions(state.currentVehicle, state.pool);
    options.forEach((vehicle) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qcm-option";
      btn.textContent = vehicle.name;
      btn.dataset.vehicleId = vehicle.id;
      btn.addEventListener("click", () => onAnswer(vehicle.id === state.currentVehicle.id, false, btn));
      qcmArea.appendChild(btn);
    });
  } else {
    qcmArea.classList.add("hidden");
    textArea.classList.remove("hidden");
    const input = document.getElementById("answer-text-input");
    const submitBtn = document.querySelector("#answer-text-form button[type=submit]");
    input.disabled = false;
    input.value = "";
    submitBtn.disabled = true;
    input.focus();
  }
}

function startTimer() {
  clearInterval(state.timerId);
  state.timeRemaining = state.timeLimit;
  updateTimerBar();
  state.timerId = setInterval(() => {
    state.timeRemaining -= 100;
    updateTimerBar();
    if (state.timeRemaining <= 0) {
      clearInterval(state.timerId);
      onAnswer(false, true, null);
    }
  }, 100);
}

function updateTimerBar() {
  const pct = Math.max(0, (state.timeRemaining / state.timeLimit) * 100);
  document.getElementById("timer-bar-fill").style.width = pct + "%";
}

function onAnswer(correct, timedOut, btnEl) {
  clearInterval(state.timerId);
  lockAnswerArea(correct, btnEl);
  state.answers.push({
    category: state.currentVehicle.category,
    country: state.currentVehicle.country,
    correct: correct,
  });
  if (correct) {
    state.score += 10;
  }
  if (state.mode === "qcm") {
    // En QCM, la couleur des boutons (bonne réponse en vert, mauvaise sélectionnée en rouge)
    // suffit à indiquer le résultat : pas besoin du message "Correct !" / "Faux — c'était...".
    setFeedback("", "");
  } else if (correct) {
    setFeedback("Correct !", "success");
  } else {
    const message = timedOut ? "Temps écoulé !" : "Faux — c'était " + state.currentVehicle.name;
    setFeedback(message, "error");
  }
  updateHud();
  showNextButton();
}

function lockAnswerArea(correct, btnEl) {
  const qcmArea = document.getElementById("answer-qcm");
  if (!qcmArea.classList.contains("hidden")) {
    const buttons = qcmArea.querySelectorAll(".qcm-option");
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.dataset.vehicleId === state.currentVehicle.id) {
        b.classList.add("qcm-option--correct");
      }
    });
    if (!correct && btnEl) {
      btnEl.classList.add("qcm-option--wrong");
    }
  } else {
    document.getElementById("answer-text-input").disabled = true;
    document.querySelector("#answer-text-form button[type=submit]").disabled = true;
  }
}

function showNextButton() {
  const btn = document.getElementById("btn-next");
  btn.textContent = state.round >= state.totalRounds ? "Voir le résultat" : "Suivant";
  btn.classList.remove("hidden");
}

function computeGroupStats(key, referenceList) {
  const map = new Map();
  state.answers.forEach((a) => {
    const id = a[key];
    if (!map.has(id)) map.set(id, { id: id, correct: 0, total: 0 });
    const entry = map.get(id);
    entry.total += 1;
    if (a.correct) entry.correct += 1;
  });
  return Array.from(map.values()).map((entry) => {
    const ref = referenceList.find((item) => item.id === entry.id);
    return {
      label: ref ? ref.label : entry.id,
      correct: entry.correct,
      total: entry.total,
      accuracy: Math.round((entry.correct / entry.total) * 100),
    };
  });
}

function renderResultBars(containerId, stats, show) {
  const container = document.getElementById(containerId);
  const wrapper = container.closest(".result-stats-group");
  clearChildren(container);
  if (!show || !stats.length) {
    wrapper.classList.add("hidden");
    return;
  }
  wrapper.classList.remove("hidden");
  stats.forEach((s) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = s.label;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    const tier = s.accuracy >= 70 ? "strength" : s.accuracy < 50 ? "weakness" : "neutral";
    fill.className = "bar-fill bar-fill--" + tier;
    fill.style.width = s.accuracy + "%";
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = s.accuracy + "%";

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    container.appendChild(row);
  });
}

function commentFor(accuracy) {
  if (accuracy >= 90) return { text: "Excellent !", tier: "great" };
  if (accuracy >= 70) return { text: "Très bien !", tier: "great" };
  if (accuracy >= 50) return { text: "Passable", tier: "mid" };
  if (accuracy >= 25) return { text: "Insuffisant", tier: "bad" };
  return { text: "Raté !", tier: "bad" };
}

function endGame() {
  const correctCount = Math.round(state.score / 10);
  const accuracy = state.totalRounds > 0 ? Math.round((correctCount / state.totalRounds) * 100) : 0;
  document.getElementById("final-score").textContent = correctCount + " / " + state.totalRounds;

  const comment = commentFor(accuracy);

  const ring = document.getElementById("result-ring");
  ring.style.setProperty("--pct", accuracy);
  ring.className = "result-ring result-ring--" + comment.tier;
  document.getElementById("result-percent").textContent = accuracy + "%";

  const badge = document.getElementById("result-badge");
  badge.textContent = comment.text;
  badge.className = "result-badge result-badge--" + comment.tier;

  const categoryStats = computeGroupStats("category", CATEGORIES).sort((a, b) => b.accuracy - a.accuracy);
  const countryStats = computeGroupStats("country", COUNTRIES).sort((a, b) => b.accuracy - a.accuracy);

  const distinctCategoriesInPool = new Set(state.pool.map((v) => v.category)).size;
  const distinctCountriesInPool = new Set(state.pool.map((v) => v.country)).size;

  renderResultBars("result-category-bars", categoryStats, distinctCategoriesInPool > 1);
  renderResultBars("result-country-bars", countryStats, distinctCountriesInPool > 1);

  showScreen("gameover");
}

function updateHud() {
  document.getElementById("hud-round").textContent = state.round;
  document.getElementById("hud-total-rounds").textContent = state.totalRounds;
}

function setFeedback(message, kind) {
  const el = document.getElementById("feedback-message");
  el.textContent = message;
  el.className = kind ? "feedback feedback--" + kind : "feedback";
  el.classList.toggle("hidden", !message);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("answer-text-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("answer-text-input");
    if (!input.value.trim()) return;
    onAnswer(isCorrectAnswer(input.value, state.currentVehicle));
  });

  document.getElementById("answer-text-input").addEventListener("input", (event) => {
    document.querySelector("#answer-text-form button[type=submit]").disabled = !event.target.value.trim();
  });

  document.getElementById("btn-next").addEventListener("click", () => {
    document.getElementById("btn-next").classList.add("hidden");
    if (state.round >= state.totalRounds) {
      endGame();
    } else {
      nextRound();
    }
  });
});
