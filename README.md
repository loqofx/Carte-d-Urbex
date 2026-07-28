# Urbex Map & Dashboard

Application locale de suivi de spots d'exploration urbaine : carte interactive Mapbox, fiches détaillées, journal des visites, classement/filtres et mini-stats.

- **Backend** : FastAPI (Python) + SQLite
- **Frontend** : HTML / Tailwind CSS / JavaScript vanilla + Mapbox GL JS

---

## 1. Prérequis

- Python 3.11 ou plus récent
- Un navigateur récent (Chrome, Firefox, Edge…)
- Aucune clé API n'est nécessaire : la carte utilise **Leaflet** avec deux fonds gratuits — **OpenStreetMap** (vue Rue) et **Esri World Imagery** (vue Satellite).

## 2. Installer et lancer le backend

```bash
cd backend
pip install -r requirements.txt --break-system-packages   # ou dans un venv, sans ce flag
uvicorn main:app --reload --port 8000
```

Le backend tourne alors sur **http://127.0.0.1:8000**.
Une base `urbex.db` (SQLite) est créée automatiquement au premier lancement, ainsi qu'un dossier `backend/media/` pour stocker les photos.

Tu peux vérifier que ça fonctionne en ouvrant http://127.0.0.1:8000/api/health — tu dois voir `{"status":"ok"}`.

La documentation interactive de l'API est disponible sur http://127.0.0.1:8000/docs.

## 3. Configurer le frontend (optionnel)

Rien n'est requis par défaut. Si ton backend tourne sur un autre port/host, adapte `API_BASE_URL` dans `frontend/js/config.js`.

## 4. Lancer le frontend

Comme le frontend fait des appels `fetch()` vers le backend, il vaut mieux le servir via un petit serveur HTTP plutôt que d'ouvrir le fichier directement (certains navigateurs bloquent les requêtes en `file://`).

Le plus simple, avec Python déjà installé :

```bash
cd frontend
python -m http.server 5500
```

Puis ouvre **http://127.0.0.1:5500** dans ton navigateur.

## 5. Utilisation

- **Carte plein écran** : clique sur un marqueur pour ouvrir la fiche du spot.
- **Bouton "+"** (bas droite) : ajoute un nouveau spot (clique sur la carte ou saisis les coordonnées GPS, note l'état/sécurité/intérêt, ajoute des avertissements et des photos par glisser-déposer).
- **Icône 📖** : journal chronologique de toutes tes visites.
- **Icône 🏆** : classement des spots avec filtres (catégorie, statut, année, note).
- **Icône 📊** : statistiques globales (total, répartition par catégorie, année la plus active…).
- **Icône 🎨** : bascule entre mode sombre et mode clair.
- **🗺️ / 🛰️** (en haut à gauche de la carte) : basculer entre vue Rue (OpenStreetMap) et vue Satellite (Esri World Imagery).

## 6. Structure du projet

```
urbex-map/
├── backend/
│   ├── main.py            # Point d'entrée FastAPI
│   ├── database.py        # Connexion SQLite / SQLAlchemy
│   ├── models.py          # Modèles Spot / Visit / Photo
│   ├── schemas.py         # Schémas Pydantic
│   ├── routers/
│   │   ├── spots.py       # CRUD spots + filtres
│   │   ├── media.py       # Upload/suppression photos
│   │   └── stats.py       # Statistiques globales
│   ├── media/              # Photos uploadées (créé automatiquement)
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── config.js       # URL de l'API + fonds de carte (OSM / Esri)
        ├── api.js          # Appels vers le backend
        ├── map.js          # Logique Mapbox GL
        ├── ui.js           # Drawers, modales, formulaires
        └── app.js          # Bootstrap de l'application
```

## 7. Pistes d'évolution possibles

- Authentification (si tu veux héberger ça au-delà de ton PC).
- Export/partage d'une fiche spot en PDF.
- Historique des modifications (qui a changé quoi, si usage multi-utilisateur).
- Import de spots depuis un fichier GPX/KML.
