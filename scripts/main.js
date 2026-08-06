// Bascule entre les écrans (menu / jeu / fin de partie).

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("screen--active");
    s.classList.add("hidden");
  });
  const target = document.getElementById("screen-" + name);
  target.classList.remove("hidden");
  target.classList.add("screen--active");
}

document.addEventListener("DOMContentLoaded", () => {
  showScreen("menu");

  document.getElementById("btn-restart").addEventListener("click", () => {
    if (state.pool.length) {
      startGame(state.pool, state.mode);
    } else {
      showScreen("menu");
    }
  });

  document.getElementById("btn-menu-return").addEventListener("click", () => {
    showScreen("menu");
  });
});
