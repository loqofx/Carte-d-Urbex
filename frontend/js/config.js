// ============================================================
// CONFIGURATION
// ============================================================
// Aucune clé API n'est requise : les fonds de carte utilisés
// (OpenStreetMap et Esri World Imagery) sont libres d'accès.
// ============================================================
const CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000",
  DEFAULT_CENTER: [46.2276, 2.2137], // [lat, lng] — Centre de la France
  DEFAULT_ZOOM: 5,

  TILE_LAYERS: {
    plan: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
      },
    },
  },
};
