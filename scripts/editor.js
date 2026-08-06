// Éditeur de véhicules : lit/écrit directement scripts/*.json et img/ via la File System Access API.
// Chaque véhicule a un tableau `images` (chemins relatifs) ; le jeu en tire une au hasard à chaque question.

let dirHandle = null;
let categories = [];
let countries = [];
let vehicles = [];
let editingId = null;
let pickedImageFiles = [];

const filters = { search: "", category: "", country: "" };

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueId(baseId, excludeId) {
  let candidate = baseId;
  let n = 2;
  while (vehicles.some((v) => v.id === candidate && v.id !== excludeId)) {
    candidate = baseId + "-" + n;
    n += 1;
  }
  return candidate;
}

function showFeedback(message, kind) {
  const el = document.getElementById("editor-feedback");
  el.textContent = message;
  el.className = "feedback " + (kind ? "feedback--" + kind : "");
  el.classList.remove("hidden");
}

// --- Accès disque ---------------------------------------------------------

async function ensureDir(base, name) {
  return base.getDirectoryHandle(name, { create: true });
}

async function readJsonFile(dir, name) {
  const fileHandle = await dir.getFileHandle(name);
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

async function writeJsonFile(dir, name, data) {
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2) + "\n");
  await writable.close();
}

async function persistVehicles() {
  const scriptsDir = await dirHandle.getDirectoryHandle("scripts");
  await writeJsonFile(scriptsDir, "vehicles.json", vehicles);
}

// Résout un chemin relatif (ex. "img/chars/leclerc.jpg") vers son dossier + handle de fichier.
async function resolvePath(relativePath) {
  const parts = relativePath.split("/").filter(Boolean);
  let dir = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i]);
  }
  return { dir, filename: parts[parts.length - 1] };
}

async function readImageUrl(relativePath) {
  try {
    const { dir, filename } = await resolvePath(relativePath);
    const file = await (await dir.getFileHandle(filename)).getFile();
    return URL.createObjectURL(file);
  } catch (err) {
    return null;
  }
}

async function deleteImageFile(relativePath) {
  try {
    const { dir, filename } = await resolvePath(relativePath);
    await dir.removeEntry(filename);
  } catch (err) {
    // fichier déjà absent, on ignore
  }
}

function imageFilename(id, indexInSequence, ext) {
  return indexInSequence === 0 ? id + "." + ext : id + "-" + (indexInSequence + 1) + "." + ext;
}

async function saveImageAt(category, id, file, indexInSequence) {
  const imgDir = await ensureDir(dirHandle, "img");
  const catDir = await ensureDir(imgDir, category);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const filename = imageFilename(id, indexInSequence, ext);
  const fileHandle = await catDir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return "img/" + category + "/" + filename;
}

// Déplace toutes les images existantes d'un véhicule quand sa catégorie ou son id change.
async function moveImages(images, oldCategory, newCategory, newId) {
  const imgDir = await ensureDir(dirHandle, "img");
  const catDir = await ensureDir(imgDir, newCategory);
  const newPaths = [];
  for (let i = 0; i < images.length; i++) {
    let file;
    let ext;
    try {
      const { dir, filename } = await resolvePath(images[i]);
      file = await (await dir.getFileHandle(filename)).getFile();
      ext = filename.split(".").pop();
      const newFilename = imageFilename(newId, i, ext);
      const newHandle = await catDir.getFileHandle(newFilename, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(file);
      await writable.close();
      if (oldCategory !== newCategory || filename !== newFilename) {
        try {
          await dir.removeEntry(filename);
        } catch (err) {
          // ignore
        }
      }
      newPaths.push("img/" + newCategory + "/" + newFilename);
    } catch (err) {
      // fichier introuvable sur le disque, on laisse tomber cette image
    }
  }
  return newPaths;
}

// --- Connexion au dossier -------------------------------------------------

async function connectFolder() {
  if (!window.showDirectoryPicker) {
    showFeedback("Ton navigateur ne supporte pas l'accès direct au dossier. Utilise Chrome ou Edge, via http://localhost.", "error");
    return;
  }
  let handle;
  try {
    handle = await window.showDirectoryPicker({ mode: "readwrite" });
  } catch (err) {
    return; // annulé par l'utilisateur
  }
  try {
    const scriptsDir = await handle.getDirectoryHandle("scripts");
    categories = await readJsonFile(scriptsDir, "categories.json");
    countries = await readJsonFile(scriptsDir, "countries.json");
    vehicles = await readJsonFile(scriptsDir, "vehicles.json");
  } catch (err) {
    showFeedback("Dossier invalide : sélectionne le dossier IDENTIF (celui qui contient index.html, scripts/ et img/).", "error");
    return;
  }
  dirHandle = handle;
  document.getElementById("connect-panel").classList.add("hidden");
  document.getElementById("editor-body").classList.remove("hidden");
  populateSelect(document.getElementById("field-category"), categories);
  populateSelect(document.getElementById("field-country"), countries);
  populateSelect(document.getElementById("filter-category"), categories, "Toutes les catégories");
  populateSelect(document.getElementById("filter-country"), countries, "Tous les pays");
  showFeedback("Dossier connecté (" + vehicles.length + " véhicules).", "success");
  renderAll();
}

function populateSelect(selectEl, list, allLabel) {
  clearChildren(selectEl);
  if (allLabel !== undefined) {
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = allLabel;
    selectEl.appendChild(allOpt);
  }
  list.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.label;
    selectEl.appendChild(opt);
  });
}

// --- Rendu -----------------------------------------------------------------

function labelFor(list, id) {
  const found = list.find((item) => item.id === id);
  return found ? found.label : id;
}

function computeCounts(key, refList) {
  const map = new Map();
  refList.forEach((r) => map.set(r.id, 0));
  vehicles.forEach((v) => {
    map.set(v[key], (map.get(v[key]) || 0) + 1);
  });
  return refList.map((r) => ({ label: r.label, count: map.get(r.id) || 0 }));
}

function renderCountBars(containerId, stats) {
  const container = document.getElementById(containerId);
  clearChildren(container);
  const max = Math.max(1, ...stats.map((s) => s.count));
  stats.forEach((s) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = s.label;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    const tier = s.count === 0 ? "weakness" : s.count < 3 ? "neutral" : "strength";
    fill.className = "bar-fill bar-fill--" + tier;
    fill.style.width = Math.max(4, (s.count / max) * 100) + "%";
    track.appendChild(fill);

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = String(s.count);

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    container.appendChild(row);
  });
}

function filteredVehicles() {
  const search = normalize(filters.search);
  return vehicles
    .filter((v) => !filters.category || v.category === filters.category)
    .filter((v) => !filters.country || v.country === filters.country)
    .filter((v) => {
      if (!search) return true;
      const haystack = normalize([v.name, v.id, ...(v.aliases || [])].join(" "));
      return haystack.includes(search);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function renderVehicleList() {
  const container = document.getElementById("vehicle-list");
  const emptyState = document.getElementById("empty-state");
  const list = filteredVehicles();
  clearChildren(container);

  if (!list.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  for (const vehicle of list) {
    const images = vehicle.images || [];
    const card = document.createElement("div");
    card.className = "vehicle-card";

    const thumb = document.createElement("img");
    thumb.className = "vehicle-thumb";
    thumb.alt = vehicle.name;
    thumb.src = "img/placeholder.svg";
    card.appendChild(thumb);

    const info = document.createElement("div");
    info.className = "vehicle-info";
    const name = document.createElement("div");
    name.className = "vehicle-name";
    name.textContent = vehicle.name + (images.length > 1 ? " 🖼×" + images.length : "");
    const meta = document.createElement("div");
    meta.className = "vehicle-meta";
    meta.textContent = labelFor(categories, vehicle.category) + " · " + labelFor(countries, vehicle.country) + (vehicle.aliases && vehicle.aliases.length ? " · " + vehicle.aliases.join(", ") : "");
    info.appendChild(name);
    info.appendChild(meta);
    card.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "vehicle-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Modifier";
    editBtn.addEventListener("click", () => openEditForm(vehicle));
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "Supprimer";
    deleteBtn.addEventListener("click", () => deleteVehicle(vehicle));
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    container.appendChild(card);

    if (images[0]) {
      readImageUrl(images[0]).then((url) => {
        if (url) thumb.src = url;
      });
    }
  }
}

function renderAll() {
  renderCountBars("category-count-bars", computeCounts("category", categories));
  renderCountBars("country-count-bars", computeCounts("country", countries));
  renderVehicleList();
}

// --- Galerie d'images dans le formulaire -----------------------------------

function renderNewImagePreviews() {
  const container = document.getElementById("new-image-previews");
  clearChildren(container);
  pickedImageFiles.forEach((file) => {
    const wrap = document.createElement("div");
    wrap.className = "gallery-thumb gallery-thumb--pending";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    const tag = document.createElement("span");
    tag.className = "gallery-thumb__tag";
    tag.textContent = "nouvelle";
    wrap.appendChild(img);
    wrap.appendChild(tag);
    container.appendChild(wrap);
  });
}

async function renderExistingImageGallery(vehicle) {
  const container = document.getElementById("existing-image-gallery");
  clearChildren(container);
  const images = vehicle.images || [];
  for (const path of images) {
    const wrap = document.createElement("div");
    wrap.className = "gallery-thumb";
    const img = document.createElement("img");
    img.alt = vehicle.name;
    img.src = "img/placeholder.svg";
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "gallery-thumb__remove";
    removeBtn.textContent = "×";
    removeBtn.title = "Supprimer cette photo";
    removeBtn.addEventListener("click", () => removeExistingImage(vehicle, path));
    wrap.appendChild(img);
    wrap.appendChild(removeBtn);
    container.appendChild(wrap);

    readImageUrl(path).then((url) => {
      if (url) img.src = url;
    });
  }
}

async function removeExistingImage(vehicle, path) {
  if (!confirm("Supprimer cette photo ?")) return;
  await deleteImageFile(path);
  const updated = { ...vehicle, images: (vehicle.images || []).filter((p) => p !== path) };
  vehicles = vehicles.map((v) => (v.id === vehicle.id ? updated : v));
  try {
    await persistVehicles();
  } catch (err) {
    showFeedback("Erreur lors de l'enregistrement : " + err.message, "error");
    return;
  }
  showFeedback("Photo supprimée.", "success");
  renderExistingImageGallery(updated);
  renderAll();
}

// --- Formulaire ajout/édition ----------------------------------------------

function resetImagePicker() {
  pickedImageFiles = [];
  document.getElementById("field-image").value = "";
  clearChildren(document.getElementById("new-image-previews"));
}

function openAddForm() {
  editingId = null;
  resetImagePicker();
  document.getElementById("form-title").textContent = "Ajouter un véhicule";
  document.getElementById("btn-submit-form").textContent = "Ajouter le véhicule";
  document.getElementById("btn-cancel-form").classList.add("hidden");
  document.getElementById("field-name").value = "";
  document.getElementById("field-id").value = "";
  document.getElementById("field-category").value = categories[0] ? categories[0].id : "";
  document.getElementById("field-country").value = countries[0] ? countries[0].id : "";
  document.getElementById("field-aliases").value = "";
  clearChildren(document.getElementById("existing-image-gallery"));
  document.getElementById("vehicle-form").classList.remove("hidden");
  document.getElementById("field-name").focus();
}

function openEditForm(vehicle) {
  editingId = vehicle.id;
  resetImagePicker();
  document.getElementById("form-title").textContent = "Modifier « " + vehicle.name + " »";
  document.getElementById("btn-submit-form").textContent = "Enregistrer les modifications";
  document.getElementById("btn-cancel-form").classList.remove("hidden");
  document.getElementById("field-name").value = vehicle.name;
  document.getElementById("field-id").value = vehicle.id;
  document.getElementById("field-category").value = vehicle.category;
  document.getElementById("field-country").value = vehicle.country;
  document.getElementById("field-aliases").value = (vehicle.aliases || []).join(", ");
  renderExistingImageGallery(vehicle);
  document.getElementById("vehicle-form").classList.remove("hidden");
  document.getElementById("vehicle-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeForm() {
  editingId = null;
  resetImagePicker();
  document.getElementById("vehicle-form").classList.add("hidden");
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("field-name").value.trim();
  let id = slugify(document.getElementById("field-id").value.trim() || name);
  const category = document.getElementById("field-category").value;
  const country = document.getElementById("field-country").value;
  const aliases = document
    .getElementById("field-aliases")
    .value.split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (!name || !id) {
    showFeedback("Le nom et l'identifiant sont obligatoires.", "error");
    return;
  }
  id = uniqueId(id, editingId);

  const previous = editingId ? vehicles.find((v) => v.id === editingId) : null;
  let images = previous ? [...(previous.images || [])] : [];

  try {
    if (previous && (previous.category !== category || previous.id !== id)) {
      images = await moveImages(images, previous.category, category, id);
    }
    for (const file of pickedImageFiles) {
      images.push(await saveImageAt(category, id, file, images.length));
    }
    if (!images.length) {
      images = ["img/" + category + "/" + id + ".jpg"];
    }
  } catch (err) {
    showFeedback("Erreur lors de l'enregistrement des images : " + err.message, "error");
    return;
  }

  const vehicle = { id, name, category, country, images };
  if (aliases.length) vehicle.aliases = aliases;

  if (previous) {
    vehicles = vehicles.map((v) => (v.id === editingId ? vehicle : v));
  } else {
    vehicles.push(vehicle);
  }

  try {
    await persistVehicles();
  } catch (err) {
    showFeedback("Erreur lors de l'enregistrement de vehicles.json : " + err.message, "error");
    return;
  }

  showFeedback((previous ? "Véhicule modifié : " : "Véhicule ajouté : ") + name + " (" + images.length + " photo" + (images.length > 1 ? "s" : "") + ")", "success");
  closeForm();
  renderAll();
}

async function deleteVehicle(vehicle) {
  if (!confirm('Supprimer "' + vehicle.name + '" ? (les images sur le disque ne sont pas supprimées)')) return;
  vehicles = vehicles.filter((v) => v.id !== vehicle.id);
  try {
    await persistVehicles();
  } catch (err) {
    showFeedback("Erreur lors de l'enregistrement : " + err.message, "error");
    return;
  }
  showFeedback("Véhicule supprimé : " + vehicle.name, "success");
  renderAll();
}

// --- Câblage -----------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-connect").addEventListener("click", connectFolder);
  document.getElementById("btn-add-new").addEventListener("click", openAddForm);
  document.getElementById("btn-cancel-form").addEventListener("click", closeForm);
  document.getElementById("vehicle-form").addEventListener("submit", handleFormSubmit);

  document.getElementById("btn-generate-id").addEventListener("click", () => {
    document.getElementById("field-id").value = slugify(document.getElementById("field-name").value);
  });

  document.getElementById("field-image").addEventListener("change", (event) => {
    pickedImageFiles = Array.from(event.target.files || []);
    renderNewImagePreviews();
  });

  document.getElementById("filter-search").addEventListener("input", (event) => {
    filters.search = event.target.value;
    renderVehicleList();
  });
  document.getElementById("filter-category").addEventListener("change", (event) => {
    filters.category = event.target.value;
    renderVehicleList();
  });
  document.getElementById("filter-country").addEventListener("change", (event) => {
    filters.country = event.target.value;
    renderVehicleList();
  });
});
