// Écran d'accueil : cases catégories/pays, mode de réponse, chronomètre, nombre de véhicules, bouton JOUER.

function renderCheckboxList(listEl, items, groupName) {
  clearChildren(listEl);
  items.forEach((item) => {
    const li = document.createElement("li");
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.dataset.group = groupName;
    input.dataset.value = item.id;
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + item.label));
    li.appendChild(label);
    listEl.appendChild(li);
  });
}

function getCheckedValues(listEl) {
  return Array.from(listEl.querySelectorAll("input[type=checkbox]:checked")).map(
    (cb) => cb.dataset.value
  );
}

function setAllChecked(listEl, checked) {
  listEl.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = checked));
}

function getSelectedAnswerMode() {
  return document.querySelector('input[name="answer-mode"]:checked').value;
}

function getSelectedTimeMode() {
  return document.querySelector('input[name="time-mode"]:checked').value;
}

function syncTimeSecondsVisibility() {
  const timed = getSelectedTimeMode() === "timed";
  document.getElementById("time-seconds-wrapper").classList.toggle("hidden", !timed);
}

function showMenuWarning(message) {
  const el = document.getElementById("menu-warning");
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideMenuWarning() {
  document.getElementById("menu-warning").classList.add("hidden");
}

function initNav() {
  const categoryList = document.getElementById("category-list");
  const countryList = document.getElementById("country-list");
  const playBtn = document.getElementById("btn-play");

  playBtn.disabled = true;
  playBtn.textContent = "Chargement…";
  onDataReady(() => {
    renderCheckboxList(categoryList, CATEGORIES, "category");
    renderCheckboxList(countryList, COUNTRIES, "country");
    playBtn.disabled = false;
    playBtn.textContent = "JOUER !";
  });

  document.getElementById("btn-check-all-cat").addEventListener("click", () => setAllChecked(categoryList, true));
  document.getElementById("btn-uncheck-all-cat").addEventListener("click", () => setAllChecked(categoryList, false));
  document.getElementById("btn-check-all-country").addEventListener("click", () => setAllChecked(countryList, true));
  document.getElementById("btn-uncheck-all-country").addEventListener("click", () => setAllChecked(countryList, false));

  document.querySelectorAll('input[name="time-mode"]').forEach((radio) => {
    radio.addEventListener("change", syncTimeSecondsVisibility);
  });
  syncTimeSecondsVisibility();

  document.getElementById("btn-play").addEventListener("click", () => {
    const checkedCategories = getCheckedValues(categoryList);
    const checkedCountries = getCheckedValues(countryList);
    const mode = getSelectedAnswerMode();
    const timeMode = getSelectedTimeMode();
    const seconds = parseInt(document.getElementById("time-seconds").value, 10);
    const totalRounds = parseInt(document.getElementById("vehicle-count").value, 10);

    const pool = VEHICLES.filter(
      (v) => checkedCategories.includes(v.category) && checkedCountries.includes(v.country)
    );

    const minRequired = mode === "qcm" ? 4 : 1;
    if (pool.length < minRequired) {
      showMenuWarning(
        mode === "qcm"
          ? "Sélection trop restreinte : il faut au moins 4 véhicules pour le mode QCM."
          : "Sélection trop restreinte : choisissez au moins une catégorie et un pays avec des véhicules."
      );
      return;
    }
    hideMenuWarning();

    state.timed = timeMode === "timed";
    state.timeLimit = seconds * 1000;
    state.totalRounds = totalRounds;

    startGame(pool, mode);
  });
}

document.addEventListener("DOMContentLoaded", initNav);
