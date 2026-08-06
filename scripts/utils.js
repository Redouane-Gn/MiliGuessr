// Fonctions utilitaires : normalisation de texte, mélange aléatoire.

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

function isCorrectAnswer(inputText, vehicle) {
  const norm = normalize(inputText);
  const accepted = [vehicle.name, ...(vehicle.aliases || [])].map(normalize);
  return accepted.includes(norm);
}

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
