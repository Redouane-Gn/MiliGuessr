// Écran d'accueil : cases catégories/pays, mode de réponse, chronomètre, nombre de véhicules, bouton JOUER.

// Mode CEITO : sélection fixe de véhicules et paramètres figés (QCM, sans temps, tous les véhicules
// de la liste), sans passer par le panneau de personnalisation.
const CEITO_VEHICLE_IDS = [
  // Chars
  "t-55", "t-62", "t-64", "t-72", "t-72-b3", "t-80", "bmpt", "bmpt-2", "t-14", "t-15",
  "m1-abrams", "m60", "leopard-1", "leopard-2-a5-6", "chieftain", "challenger-2", "ariete",
  "ztz-98", "ztz-99", "type-10", "arjun", "k1", "k2", "merkava-3", "merkava-4",
  "ztd-05", "type-85-2",
  // Reconnaissance
  "brdm-2", "brm-1", "brm-3", "gaz-tigr", "scimitar", "humvee", "dingo",
  "wiesel-2", "cobra", "eagle-iv", "jackal", "fennek", "vec", "centauro", "ptl-02",
  // VBCI / VBTT
  "bmp-1", "bmp-2", "bmp-3", "mtlb", "bmd-1", "bmd-2", "bmd-3", "bmd-4",
  "marder", "puma", "bradley", "warrior", "kto-rosomak", "pandur", "pizzaro", "ulan",
  "btr-60", "btr-70", "btr-80", "btr-80a", "patria-xa180", "fuchs", "bmr-600", "piranha-3", "stryker", "m113",
  "boxer", "wz-551", "type-85", "aav7", "bmo-t",
  // Artillerie
  "l118-lightgun", "122d30", "130m46", "2a65", "fh70", "155m777",
  "2s1", "2s3", "2s5", "2s7", "as90", "pzh2000", "m109",
  "152d20", "2a36", "plz-07", "2s19", "2s35",
  // Génie
  "mdk-2", "pzm", "bat-2", "m9-ace", "dachs", "gmz-3", "imr-2",
  "mtu-72", "tmm-3", "tmm-6", "pts-02", "ribbon-bridge", "m3-amphibious-rig", "pmm-2", "wolverine",
  // Anti-char
  "spg9", "m1134-atgm", "2a45", "brdm-2-at5",
  // Anti-aérien
  "zu-23-2", "zsu-23-4", "sa-6-gainful", "sa-8-gecko",
  // Hélicoptères
  "ah-1-cobra", "ah-64-apache", "tigre", "a129-mangusta", "mi-24-hind", "mi-28-havoc", "ka-50", "mi-8-hip", "ch-47-chinook",
];

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
    const vehiclesInCat = vehicles
      .filter((v) => v.category === cat.id)
      .sort((a, b) => a.name.localeCompare(b.name));
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

function getCeitoAnswerMode() {
  return document.querySelector('input[name="ceito-answer-mode"]:checked').value;
}

function getCeitoTimeMode() {
  return document.querySelector('input[name="ceito-time-mode"]:checked').value;
}

function syncCeitoTimeSecondsVisibility() {
  const timed = getCeitoTimeMode() === "timed";
  document.getElementById("ceito-time-seconds-wrapper").classList.toggle("hidden", !timed);
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
  const ceitoBtn = document.getElementById("btn-ceito");

  function updateSelectionCount() {
    const count =
      getSelectedSelectionMode() === "vehicles"
        ? getCheckedValues(vehiclePickerList).length
        : VEHICLES.filter(
            (v) => getCheckedValues(categoryList).includes(v.category) && getCheckedValues(countryList).includes(v.country)
          ).length;
    document.getElementById("selection-count").textContent =
      count + (count > 1 ? " véhicules sélectionnés" : " véhicule sélectionné");
  }

  playBtn.disabled = true;
  playBtn.textContent = "Chargement…";
  ceitoBtn.disabled = true;
  onDataReady(() => {
    renderCheckboxList(categoryList, CATEGORIES, "category");
    renderCheckboxList(countryList, COUNTRIES, "country");
    renderVehiclePicker(vehiclePickerList, VEHICLES, CATEGORIES);
    playBtn.disabled = false;
    playBtn.textContent = "Jouer";
    ceitoBtn.disabled = false;
    updateSelectionCount();
  });

  categoryList.addEventListener("change", updateSelectionCount);
  countryList.addEventListener("change", updateSelectionCount);
  vehiclePickerList.addEventListener("change", updateSelectionCount);

  document.getElementById("btn-check-all-cat").addEventListener("click", () => { setAllChecked(categoryList, true); updateSelectionCount(); });
  document.getElementById("btn-uncheck-all-cat").addEventListener("click", () => { setAllChecked(categoryList, false); updateSelectionCount(); });
  document.getElementById("btn-check-all-country").addEventListener("click", () => { setAllChecked(countryList, true); updateSelectionCount(); });
  document.getElementById("btn-uncheck-all-country").addEventListener("click", () => { setAllChecked(countryList, false); updateSelectionCount(); });
  document.getElementById("btn-check-all-vehicles").addEventListener("click", () => { setAllChecked(vehiclePickerList, true); updateSelectionCount(); });
  document.getElementById("btn-uncheck-all-vehicles").addEventListener("click", () => { setAllChecked(vehiclePickerList, false); updateSelectionCount(); });

  document.getElementById("vehicle-search").addEventListener("input", (event) => {
    filterVehiclePicker(vehiclePickerList, event.target.value);
  });

  document.querySelectorAll('input[name="selection-mode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const useVehicles = getSelectedSelectionMode() === "vehicles";
      filtersPanel.classList.toggle("hidden", useVehicles);
      vehiclePickerPanel.classList.toggle("hidden", !useVehicles);
      updateSelectionCount();
    });
  });

  document.querySelectorAll('input[name="time-mode"]').forEach((radio) => {
    radio.addEventListener("change", syncTimeSecondsVisibility);
  });
  syncTimeSecondsVisibility();

  document.querySelectorAll('input[name="ceito-time-mode"]').forEach((radio) => {
    radio.addEventListener("change", syncCeitoTimeSecondsVisibility);
  });
  syncCeitoTimeSecondsVisibility();

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

  ceitoBtn.addEventListener("click", () => {
    const mode = getCeitoAnswerMode();
    const timeMode = getCeitoTimeMode();
    const seconds = parseInt(document.getElementById("ceito-time-seconds").value, 10);
    const totalRounds = parseInt(document.getElementById("ceito-vehicle-count").value, 10);

    const pool = VEHICLES.filter((v) => CEITO_VEHICLE_IDS.includes(v.id));

    state.timed = timeMode === "timed";
    state.timeLimit = seconds * 1000;
    state.totalRounds = totalRounds;

    startGame(pool, mode);
  });
}

document.addEventListener("DOMContentLoaded", initNav);
