# MiliGuessr

Quiz de reconnaissance de matériel militaire : une photo s'affiche, il faut trouver le véhicule. Plus de 200 véhicules répartis en 13 catégories (chars, VBCI, VBTT, reconnaissance, artillerie, LRM, anti-char, génie, avions, hélicoptères, drones, anti-aérien, armement léger) et 10 pays.

**Jouer en ligne : https://redouane-gn.github.io/MiliGuessr/**

Site statique HTML/CSS/JS : pas de build, pas de framework, pas de backend.

---

## Sommaire

1. [Lancer le site en local](#lancer-le-site-en-local)
2. [Comment jouer](#comment-jouer)
3. [Gérer les véhicules](#gérer-les-véhicules)
4. [Mettre en ligne](#mettre-en-ligne)
5. [Structure du projet](#structure-du-projet)
6. [Dépannage](#dépannage)

---

## Lancer le site en local

Un serveur local est obligatoire : les données (`scripts/*.json`) sont chargées avec `fetch()`, qui ne fonctionne pas si on ouvre `index.html` par un double-clic.

**1. Récupérer le projet** (une seule fois)

```bash
git clone https://github.com/Redouane-Gn/MiliGuessr.git
cd MiliGuessr
```

**2. Démarrer le serveur** depuis le dossier du projet

| Système | Commande |
|---|---|
| macOS / Linux | `python3 -m http.server 8000` |
| Windows | `powershell -File scripts\serve.ps1` (ou `python -m http.server 8000`) |

**3. Ouvrir** http://localhost:8000 dans le navigateur. `Ctrl + C` dans le terminal arrête le serveur.

> Si une modification n'apparaît pas, le navigateur affiche une version en cache : rechargez avec `Cmd + Shift + R` (Mac) ou `Ctrl + Shift + R` (Windows), ou ouvrez une fenêtre de navigation privée.

---

## Comment jouer

L'écran d'accueil propose deux modes de jeu, chacun avec son propre panneau de réglages juste en dessous.

### Partie classique — bouton « Jouer »

Sans réglage, la partie porte sur **tous les véhicules**, en **QCM**, **sans chronomètre**, sur **20 questions**. Le panneau **« Personnaliser la partie »** permet de changer :

| Réglage | Choix |
|---|---|
| Mode de sélection | **Catégorie / Pays** (cases à cocher) ou **Véhicule par véhicule** (liste avec recherche) |
| Mode de réponse | **QCM** (4 choix) ou **Réponse écrite** |
| Chronomètre | **Sans temps** ou **Avec temps** (5 à 60 s par question, 15 s par défaut) |
| Nombre de véhicules | 10 à 100 questions (20 par défaut) |

Le nombre de véhicules retenus s'affiche en direct. Le jeu refuse de démarrer si la sélection est trop petite : il faut au moins 4 véhicules en QCM, au moins 1 en réponse écrite.

### Mode CEITO — bouton « Mode CEITO »

Une liste fixe de **123 véhicules** à connaître, sans avoir à cocher quoi que ce soit. Le panneau **« Personnaliser le Mode CEITO »** ne contient que trois réglages :

| Réglage | Choix |
|---|---|
| Mode de réponse | **QCM** ou **Réponse écrite** |
| Chronomètre | **Sans temps** ou **Avec temps** (5 à 60 s) |
| Nombre de photos | 10 à 100, ou **123 (toute la liste)** : chaque véhicule de la liste passe une fois |

Les deux panneaux sont indépendants : régler la partie classique ne change rien au Mode CEITO, et inversement.

### Déroulement d'une partie

- **Tirage** : chaque question prend un véhicule pas encore vu, puis une de ses photos au hasard. Aucun véhicule ne revient tant que la sélection en contient assez.
- **QCM** : les 4 propositions sont de la même catégorie (pas d'avion parmi des chars). Après la réponse, la bonne s'affiche en vert et la mauvaise en rouge.
- **Réponse écrite** : on peut taper le nom ou un de ses alias. Les majuscules, les accents et les espaces en trop sont ignorés, et un tiret compte comme un espace : « t 72 b3 » vaut « T-72 B3 ». Une écriture collée (« T72 ») n'est acceptée que si elle est déclarée en alias.
- **Chronomètre** : quand la barre arrive au bout, la manche est perdue et la bonne réponse s'affiche.
- La bonne réponse reste affichée jusqu'au clic sur **« Suivant »**.

### Résultats

En fin de partie : le score, le pourcentage et une appréciation (Excellent ≥ 90 %, Très bien ≥ 70 %, Passable ≥ 50 %, Insuffisant ≥ 25 %, Raté en dessous). S'y ajoutent la réussite **par catégorie** et **par pays**, affichées seulement si la sélection en comprenait plusieurs. **« Rejouer »** relance une partie avec les mêmes réglages, **« Menu »** ramène à l'accueil.

---

## Gérer les véhicules

### Avec l'éditeur (recommandé)

L'éditeur ajoute, modifie et supprime des véhicules en écrivant directement dans les fichiers du projet. **Il ne fonctionne qu'en local, dans Chrome ou Edge**, et n'est jamais publié en ligne.

1. Lancez le site en local (voir plus haut) et cliquez sur **🛠️ Éditer les véhicules** en bas de l'accueil, ou ouvrez http://localhost:8000/editor.html.
2. Cliquez sur **« Connecter le dossier IDENTIF »** et sélectionnez **le dossier du projet** : `MiliGuessr`, celui qui contient `index.html`, `scripts/` et `img/`. Le navigateur demande l'autorisation de le modifier.
3. Ajoutez, modifiez ou supprimez des véhicules. La répartition par catégorie et par pays en haut de la page montre vite ce qui manque.
4. Vérifiez sur l'accueil, puis [mettez en ligne](#mettre-en-ligne).

Ce que fait l'éditeur pour vous :
- les photos ajoutées sont copiées dans `img/<categorie>/` et renommées d'après l'identifiant (`leclerc.jpg`, puis `leclerc-2.jpg`, `leclerc-3.png`…), en gardant leur format d'origine ;
- changer la catégorie ou l'identifiant d'un véhicule déplace et renomme ses photos ;
- supprimer un véhicule **ne supprime pas** ses photos du disque.

### À la main

Ajoutez la ou les photos dans `img/<categorie>/`, puis une entrée dans `scripts/vehicles.json` :

```json
{
  "id": "leclerc",
  "name": "LECLERC",
  "category": "chars",
  "country": "france",
  "images": ["img/chars/leclerc.jpg", "img/chars/leclerc-2.jpg"],
  "aliases": ["AMX-56"]
}
```

| Champ | Description |
|---|---|
| `id` | Identifiant unique en minuscules avec tirets ; sert aussi de base au nom des photos |
| `name` | Nom affiché dans le QCM et réponse acceptée en mode écrit |
| `category` | Doit exister dans `scripts/categories.json` |
| `country` | Doit exister dans `scripts/countries.json` |
| `images` | Chemins des photos ; une est tirée au hasard à chaque passage du véhicule |
| `aliases` | *(optionnel)* autres réponses acceptées en mode écrit |

**Conseils pour les alias** : ajoutez les écritures courantes (« T72 », « AH1 », surnom OTAN comme « HIND »). Évitez les fragments trop courts ou trop génériques (« K », « A1 », « RIG »), qui font accepter des réponses vagues.

Une photo introuvable est remplacée par une image par défaut (`img/placeholder.svg`) sans bloquer la partie.

### Catégories et pays

Ajoutez une entrée `{ "id": "...", "label": "..." }` dans `scripts/categories.json` ou `scripts/countries.json` : les cases à cocher de l'accueil se génèrent automatiquement. Une catégorie qui n'a encore aucun véhicule (comme « Autres ») reste disponible dans l'éditeur mais n'apparaît pas sur l'accueil.

> Les photos des catégories anti-char, anti-aérien, LRM et drones sont historiquement rangées dans `img/autres/`. Ça fonctionne car c'est le chemin inscrit dans `vehicles.json` qui compte. Les nouvelles photos ajoutées par l'éditeur vont dans le dossier de leur catégorie.

### Liste du Mode CEITO

La liste est définie dans `scripts/nav.js`, dans le tableau `CEITO_VEHICLE_IDS` (un identifiant de `vehicles.json` par ligne). Si vous ajoutez ou retirez un véhicule de cette liste, mettez aussi à jour l'option **« 123 (toute la liste) »** de `index.html` (sélecteur `ceito-vehicle-count`) avec le nouveau total.

---

## Mettre en ligne

Le site public est mis à jour automatiquement à **chaque push sur la branche `master`** :

```bash
git add -A
git commit -m "Description de la modification"
git push
```

Le workflow `.github/workflows/deploy.yml` copie le site **sans l'éditeur** (`editor.html`, `scripts/editor.js`, `style/editor.css` et le lien de l'accueil sont retirés), puis le publie sur la branche `gh-pages`. Le suivi se fait dans l'onglet **Actions** du dépôt. Le site est à jour 1 à 2 minutes après la fin du run, parfois jusqu'à 10 minutes à cause du cache de GitHub.

> GitHub Pages n'a ni backend ni authentification : c'est l'exclusion de l'éditeur au moment de la publication qui le garde réservé à l'administrateur.

**Configuration initiale** (déjà faite, à refaire seulement pour un nouveau dépôt) : sur GitHub, **Settings → Pages → Source : Deploy from a branch**, branche **`gh-pages`**, dossier **`/ (root)`**. La branche `gh-pages` est créée par le premier run du workflow.

---

## Structure du projet

```
MiliGuessr/
├── index.html              Accueil, écran de jeu et écran de résultats
├── editor.html             Éditeur de véhicules (local uniquement)
├── scripts/
│   ├── vehicles.json       Les véhicules (nom, catégorie, pays, photos, alias)
│   ├── categories.json     Les catégories
│   ├── countries.json      Les pays
│   ├── data.js             Chargement des trois fichiers JSON
│   ├── nav.js              Accueil : réglages, bouton Jouer, Mode CEITO et sa liste
│   ├── game.js             Déroulement d'une partie : tirage, QCM, chrono, score, résultats
│   ├── utils.js            Comparaison des réponses écrites, mélange aléatoire
│   ├── main.js             Navigation entre les écrans
│   ├── editor.js           Éditeur de véhicules
│   └── serve.ps1           Serveur local pour Windows
├── style/
│   ├── style.css           Thème du site
│   └── editor.css          Thème de l'éditeur
├── img/
│   ├── <categorie>/        Photos des véhicules
│   ├── credits/            Écusson PRD-1RS
│   └── placeholder.svg     Image affichée si une photo est introuvable
└── .github/workflows/
    └── deploy.yml          Publication automatique sur GitHub Pages
```

---

## Dépannage

| Problème | Solution |
|---|---|
| Le bouton reste sur « Chargement… » ou la page est vide | Le site a été ouvert par un double-clic sur `index.html`. Lancez-le avec un [serveur local](#lancer-le-site-en-local). |
| Une modification n'apparaît pas | Cache du navigateur : rechargez avec `Cmd + Shift + R` / `Ctrl + Shift + R` ou utilisez une fenêtre privée. En ligne, attendez jusqu'à 10 minutes après le déploiement. |
| L'éditeur affiche « Ton navigateur ne supporte pas l'accès direct au dossier » | Utilisez Chrome ou Edge, et ouvrez l'éditeur via `http://localhost:8000/editor.html`. |
| L'éditeur affiche « Dossier invalide » | Le mauvais dossier a été choisi : sélectionnez le dossier racine `MiliGuessr`, pas `scripts/` ni `img/`. |
| Une photo est remplacée par l'image par défaut | Le chemin dans `vehicles.json` ne correspond à aucun fichier : vérifiez le nom et l'extension (`.jpg`, `.png`, `.webp`…). |
| Le site en ligne n'est pas mis à jour | Vérifiez dans l'onglet **Actions** que le run « Déploiement GitHub Pages » est passé (coche verte). |

---

Powered by PRD-1RS.
