// ============================================================
// APP — Bootstrap, état global, câblage des événements
// ============================================================
window.AppState = {
  allSpots: [],
  pickingLocation: false,
};

const App = {
  async init() {
    AppUI.initTheme();
    MapModule.init();
    this._wireGlobalEvents();
    MapModule.map.whenReady(async () => {
      await this.refreshSpots();
    });
  },

  async refreshSpots() {
    const spots = await API.listSpots();
    window.AppState.allSpots = spots;
    MapModule.renderMarkers(spots);
    return spots;
  },

  _wireGlobalEvents() {
    document.getElementById("btn-diary").onclick = () => AppUI.openDiary();
    document.getElementById("close-drawer-diary").onclick = () => AppUI.closeDiary();

    document.getElementById("btn-ranking").onclick = () => AppUI.openRanking();
    document.getElementById("close-ranking").onclick = () => AppUI.closeRanking();

    document.getElementById("btn-stats").onclick = () => AppUI.openStats();
    document.getElementById("close-stats").onclick = () => AppUI.closeStats();

    document.getElementById("btn-theme").onclick = () => AppUI.toggleTheme();

    document.getElementById("btn-add-spot").onclick = () => AppUI.openAddSpotModal();
    document.getElementById("close-add-spot").onclick = () => AppUI.closeAddSpotModal();

    document.getElementById("close-drawer-spot").onclick = () => AppUI.closeSpotDetail();

    document.getElementById("lightbox").onclick = () => AppUI.closeLightbox();

    // Fermeture des modales en cliquant sur le fond
    ["modal-ranking", "modal-stats", "modal-add-spot"].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener("click", (e) => {
        if (e.target === el) el.classList.remove("open");
      });
    });

    // Fermeture au clavier (Échap)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      AppUI.closeLightbox();
      AppUI.closeSpotDetail();
      AppUI.closeDiary();
      document.getElementById("modal-ranking").classList.remove("open");
      document.getElementById("modal-stats").classList.remove("open");
    });
  },
};

window.App = App;
window.AppUI = AppUI;
window.MapModule = MapModule;

document.addEventListener("DOMContentLoaded", () => App.init());
