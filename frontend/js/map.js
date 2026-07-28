// ============================================================
// MAP — Initialisation Leaflet, gestion des marqueurs et des
// fonds de carte (OpenStreetMap / Esri World Imagery), sans
// clé API.
// ============================================================
const MapModule = {
  map: null,
  markers: {}, // spot_id -> L.Marker
  currentStyle: "plan",
  tileLayer: null,
  toastTimeout: null,

  init() {
    this.map = L.map("map", {
      center: CONFIG.DEFAULT_CENTER,
      zoom: CONFIG.DEFAULT_ZOOM,
      zoomControl: false,
    });

    this.tileLayer = L.tileLayer(
      CONFIG.TILE_LAYERS.plan.url,
      CONFIG.TILE_LAYERS.plan.options
    ).addTo(this.map);

    L.control.zoom({ position: "bottomleft" }).addTo(this.map);
    this._addStyleSwitcher();

    this.map.on("click", (e) => {
      if (window.AppState && window.AppState.pickingLocation) {
        window.AppUI.onMapPicked(e.latlng.lng, e.latlng.lat);
      }
    });

    // Écouteur Clic Molette (clic milieu) pour copier les coordonnées GPS
    this.map.getContainer().addEventListener("auxclick", (e) => {
      if (e.button === 1) { // 1 = clic molette
        e.preventDefault();
        const point = this.map.mouseEventToLatLng(e);
        const coordsText = `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;

        navigator.clipboard.writeText(coordsText).then(() => {
          this.showToast(`Coordonnées copiées : ${coordsText}`);
        }).catch(err => {
          console.error("Erreur de copie dans le presse-papier :", err);
        });
      }
    });
  },

  _addStyleSwitcher() {
    const Switcher = L.Control.extend({
      options: { position: "bottomleft" },
      onAdd: () => {
        const el = L.DomUtil.create("div", "leaflet-bar map-style-switcher");
        el.innerHTML = `
          <a href="#" title="Vue Rue (OpenStreetMap)" data-style="plan">🗺️</a>
          <a href="#" title="Vue Satellite (Esri)" data-style="satellite">🛰️</a>
        `;
        L.DomEvent.disableClickPropagation(el);
        el.querySelectorAll("a").forEach((a) => {
          a.onclick = (ev) => {
            ev.preventDefault();
            this.setStyle(a.dataset.style);
            el.querySelectorAll("a").forEach((x) => x.classList.remove("active"));
            a.classList.add("active");
          };
        });
        el.querySelector('[data-style="plan"]').classList.add("active");
        return el;
      },
    });
    this.map.addControl(new Switcher());
  },

  setStyle(name) {
    if (this.currentStyle === name || !CONFIG.TILE_LAYERS[name]) return;
    this.currentStyle = name;
    this.map.removeLayer(this.tileLayer);
    const cfg = CONFIG.TILE_LAYERS[name];
    this.tileLayer = L.tileLayer(cfg.url, cfg.options).addTo(this.map);
  },

  clearMarkers() {
    Object.values(this.markers).forEach((m) => this.map.removeLayer(m));
    this.markers = {};
  },

  renderMarkers(spots) {
    this.clearMarkers();
    spots.forEach((spot) => {
      const cover = spot.photos.find((p) => p.is_cover) || spot.photos[0];
      const bgStyle = cover
        ? `background-image:url(${API.mediaUrl(cover.filename)});`
        : "";
      const icon = L.divIcon({
        className: "spot-marker-wrapper",
        html: `<div class="spot-marker" style="${bgStyle}">${cover ? "" : (spot.emoji || "📍")}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(this.map);
      marker.on("click", () => window.AppUI.openSpotDetail(spot.id, true));
      this.markers[spot.id] = marker;
    });
  },

  flyTo(lng, lat) {
    this.map.flyTo([lat, lng], 16, { duration: 1.1 });
  },

  showToast(message) {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-notification";
      toast.style.cssText = `
        position: fixed;
        bottom: 90px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(36, 30, 26, 0.9);
        color: #ece5dd;
        border: 1px solid rgba(236, 229, 221, 0.2);
        padding: 10px 18px;
        border-radius: 12px;
        font-size: 14px;
        font-family: sans-serif;
        backdrop-filter: blur(8px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        z-index: 2000;
        transition: opacity 0.3s ease;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = "0";
    }, 2500);
  },
};