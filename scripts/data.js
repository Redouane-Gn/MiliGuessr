// Chargement des données du quiz depuis les fichiers JSON (scripts/categories.json,
// scripts/countries.json, scripts/vehicles.json). Ces fichiers sont aussi ceux que
// l'éditeur (editor.html) lit et modifie directement sur le disque.
// Nécessite un serveur local (voir README.md) : fetch() est bloqué en ouverture file://.

let CATEGORIES = [];
let COUNTRIES = [];
let VEHICLES = [];
let dataReady = false;

function onDataReady(callback) {
  if (dataReady) {
    callback();
  } else {
    document.addEventListener("data-ready", callback, { once: true });
  }
}

async function loadData() {
  const [categories, countries, vehicles] = await Promise.all([
    fetch("scripts/categories.json").then((r) => r.json()),
    fetch("scripts/countries.json").then((r) => r.json()),
    fetch("scripts/vehicles.json").then((r) => r.json()),
  ]);
  CATEGORIES = categories;
  COUNTRIES = countries;
  VEHICLES = vehicles;
  dataReady = true;
  document.dispatchEvent(new Event("data-ready"));
}

loadData();
