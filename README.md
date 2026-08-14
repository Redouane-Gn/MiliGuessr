# MiliGuessr

Quiz de reconnaissance de matériel militaire (chars, VBCI, VBTT, reconnaissance, artillerie, LRM, génie, avions, hélicoptères, drones, armement léger) par pays. Site statique HTML/CSS/JS — sans build, sans framework, sans backend.

## Démarrage rapide

```
powershell -File scripts\serve.ps1
```

Puis ouvrez `http://localhost:8000`. Un serveur local est nécessaire : les données (`scripts/*.json`) sont chargées via `fetch()`, bloqué en ouverture directe `file://`. (`python -m http.server` fonctionne aussi.)

## Jouer

- Sélection de la partie **par catégorie et pays** (cases à cocher) ou **véhicule par véhicule** (recherche + sélection individuelle) ; le nombre de véhicules retenus s'affiche en direct.
- **QCM** ou **réponse écrite** (accents/casse/tirets ignorés dans la comparaison).
- **Chronométré** (5 à 60 s/question) ou **libre**.
- **10 à 100 véhicules** par partie, aucune photo répétée tant qu'il y en a assez pour couvrir la partie.
- Après chaque réponse, la bonne réponse reste affichée jusqu'au clic sur "Suivant". Le score final inclut une répartition par catégorie et par pays.

## Ajouter des véhicules

**Avec l'éditeur (recommandé)** — bouton **🛠️ Éditer les véhicules** sur l'écran d'accueil, ou `http://localhost:8000/editor.html`. Chrome/Edge uniquement.

1. **Connecter le dossier IDENTIF** (celui avec `index.html`, `scripts/`, `img/`).
2. Ajouter/modifier/supprimer un véhicule : nom, catégorie, pays, alias, une ou plusieurs photos.
3. Tout s'enregistre directement sur le disque (`scripts/vehicles.json` + `img/<categorie>/`), sans étape manuelle.

La répartition par catégorie/pays en haut de l'éditeur repère vite ce qui manque.

> **L'éditeur est un outil local, réservé à l'administrateur.** Il n'est jamais publié en ligne (voir Déploiement) — éditez en local, vérifiez, puis `git push` pour mettre à jour le site public.

**Manuellement** — ajoutez l'image dans `img/<categorie>/<slug>.jpg` (`-2.jpg`, `-3.jpg`... pour les photos suivantes), puis une entrée dans `scripts/vehicles.json` :

```json
{ "id": "mon-slug", "name": "Nom affiché", "category": "chars", "country": "france", "images": ["img/chars/mon-slug.jpg"] }
```

| Champ | Description |
|---|---|
| `id` | Slug unique, sert aussi de base au nom de fichier image |
| `name` | Nom affiché, réponse acceptée en mode texte |
| `category` / `country` | Doivent exister dans `scripts/categories.json` / `countries.json` |
| `images` | Chemins d'image ; une est tirée au hasard à chaque question |
| `aliases` | *(optionnel)* autres réponses acceptées en mode texte |

Pour une nouvelle catégorie/pays : ajoutez une entrée `{ id, label }` dans `scripts/categories.json` ou `countries.json` — les cases à cocher du menu se génèrent automatiquement. Une image introuvable retombe sur `img/placeholder.svg` sans planter la partie.

## Déployer sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` publie le site à chaque push sur `master`, **sans l'éditeur** (`editor.html`, `scripts/editor.js`, `style/editor.css` et son lien sont exclus du build — ils restent dans le dépôt local). GitHub Pages n'a pas de backend/authentification ; c'est cette exclusion, pas un mot de passe contournable, qui garde l'éditeur réservé à l'administrateur.

1. `git add . && git commit -m "Site initial"`
2. `git remote add origin https://github.com/<compte>/<repo>.git && git push -u origin master`
3. Sur GitHub : **Settings → Pages → Source: Deploy from a branch**, puis choisissez la branche **`gh-pages`** (dossier `/root`). Cette branche est créée automatiquement par le workflow après le premier push — si elle n'apparaît pas encore dans la liste, attendez la fin du premier run dans l'onglet **Actions**, puis rafraîchissez.
4. Le site sera en ligne sur `https://<compte>.github.io/<repo>/`.

## Structure du projet

```
IDENTIF/
├── index.html            Écran de jeu
├── editor.html           Éditeur (local uniquement)
├── scripts/
│   ├── data.js            Charge categories/countries/vehicles.json
│   ├── categories.json    Liste des catégories
│   ├── countries.json     Liste des pays
│   ├── vehicles.json      Liste des véhicules
│   ├── nav.js              Écran d'accueil
│   ├── game.js             Boucle de jeu
│   ├── editor.js           Éditeur
│   ├── utils.js             Fonctions partagées
│   ├── main.js               Navigation entre écrans
│   └── serve.ps1              Serveur local
├── style/                 CSS (thème sombre)
├── img/<categorie>/       Photos des véhicules
└── .github/workflows/     Déploiement GitHub Pages
```
