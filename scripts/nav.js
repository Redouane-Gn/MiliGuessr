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

function renderVehiclePicker(container, vehicles, categories) {
  clearChildren(container);
  categories.forEach((cat) => {
    const vehiclesInCat = vehicles.filter((v) => v.category === cat.id);
    if (!vehiclesInCat.length) return;

    const group = document.createElement("div");
    group.className = "vehicle-picker-group";

    const heading = document.createElement("h3");
    heading.className = "vehicle-picker-heading";
    heading.textContent = cat.label;
    group.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "checkbox-list";
    vehiclesInCat.forEach((v) => {
      const li = document.createElement("li");
      li.dataset.searchText = normalize(v.name);
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true;
      input.dataset.group = "vehicle";
      input.dataset.value = v.id;
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + v.name));
      li.appendChild(label);
      list.appendChild(li);
    });
    group.appendChild(list);
    container.appendChild(group);
  });
}

function filterVehiclePicker(container, query) {
  const norm = normalize(query);
  let anyVisibleTotal = false;
  container.querySelectorAll(".vehicle-picker-group").forEach((group) => {
    let anyVisible = false;
    group.querySelectorAll("li").forEach((li) => {
      const match = !norm || li.dataset.searchText.includes(norm);
      li.classList.toggle("hidden", !match);
      if (match) anyVisible = true;
    });
    group.classList.toggle("hidden", !anyVisible);
    if (anyVisible) anyVisibleTotal = true;
  });
  document.getElementById("vehicle-picker-empty").classList.toggle("hidden", anyVisibleTotal);
}

function getSelectedSelectionMode() {
  return document.querySelector('input[name="selection-mode"]:checked').value;
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
  document.getElementById("options-panel").open = true;
}

function hideMenuWarning() {
  document.getElementById("menu-warning").classList.add("hidden");
}

function initNav() {
  const categoryList = document.getElementById("category-list");
  const countryList = document.getElementById("country-list");
  const vehiclePickerList = document.getElementById("vehicle-picker-list");
  const filtersPanel = document.getElementById("filters-panel");
  const vehiclePickerPanel = document.getElementById("vehicle-picker-panel");
  const playBtn = document.getElementById("btn-play");

  playBtn.disabled = true;
  playBtn.textContent = "Chargement…";
  onDataReady(() => {
    renderCheckboxList(categoryList, CATEGORIES, "category");
    renderCheckboxList(countryList, COUNTRIES, "country");
    renderVehiclePicker(vehiclePickerList, VEHICLES, CATEGORIES);
    playBtn.disabled = false;
    playBtn.textContent = "Jouer";
  });

  document.getElementById("btn-check-all-cat").addEventListener("click", () => setAllChecked(categoryList, true));
  document.getElementById("btn-uncheck-all-cat").addEventListener("click", () => setAllChecked(categoryList, false));
  document.getElementById("btn-check-all-country").addEventListener("click", () => setAllChecked(countryList, true));
  document.getElementById("btn-uncheck-all-country").addEventListener("click", () => setAllChecked(countryList, false));
  document.getElementById("btn-check-all-vehicles").addEventListener("click", () => setAllChecked(vehiclePickerList, true));
  document.getElementById("btn-uncheck-all-vehicles").addEventListener("click", () => setAllChecked(vehiclePickerList, false));

  document.getElementById("vehicle-search").addEventListener("input", (event) => {
    filterVehiclePicker(vehiclePickerList, event.target.value);
  });

  document.querySelectorAll('input[name="selection-mode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const useVehicles = getSelectedSelectionMode() === "vehicles";
      filtersPanel.classList.toggle("hidden", useVehicles);
      vehiclePickerPanel.classList.toggle("hidden", !useVehicles);
    });
  });

  document.querySelectorAll('input[name="time-mode"]').forEach((radio) => {
    radio.addEventListener("change", syncTimeSecondsVisibility);
  });
  syncTimeSecondsVisibility();

  document.getElementById("btn-play").addEventListener("click", () => {
    const mode = getSelectedAnswerMode();
    const timeMode = getSelectedTimeMode();
    const seconds = parseInt(document.getElementById("time-seconds").value, 10);
    const totalRounds = parseInt(document.getElementById("vehicle-count").value, 10);

    const pool =
      getSelectedSelectionMode() === "vehicles"
        ? VEHICLES.filter((v) => getCheckedValues(vehiclePickerList).includes(v.id))
        : VEHICLES.filter(
            (v) => getCheckedValues(categoryList).includes(v.category) && getCheckedValues(countryList).includes(v.country)
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
