// ============================================================
// UI — Rendu des drawers, modales, formulaires
// ============================================================
const CATEGORIES = [
  { id: "chateau", label: "Château", emoji: "🏰" },
  { id: "usine", label: "Usine", emoji: "🏭" },
  { id: "grimpe_urbaine", label: "Grimpe Urbaine", emoji: "🧗" },
  { id: "maison", label: "Maison", emoji: "🏚️" },
  { id: "hotel", label: "Hôtel", emoji: "🏨" },
  { id: "ferme", label: "Ferme", emoji: "🌽" },
  { id: "hopital", label: "Hôpital | Sanatorium", emoji: "🏥" },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { id: "mine", label: "Mine", emoji: "⛏️" },
  { id: "site_militaire", label: "Site militaire", emoji: "🎖️" },
  { id: "immeuble", label: "Immeuble", emoji: "🏢" },
  { id: "eglise_couvent", label: "Église | Couvent", emoji: "⛪" },
  { id: "ecole", label: "École", emoji: "🏫" },
  { id: "village", label: "Village", emoji: "🏕️" },
  { id: "gare", label: "Gare", emoji: "🚉" },
  { id: "site_sportif", label: "Site sportif", emoji: "⛳" },
  { id: "bunker", label: "Bunker | Blockhaus", emoji: "🪨" },
  { id: "centrale", label: "Centrale nucléaire", emoji: "☢️" },
  { id: "parc_attraction", label: "Parc d'attraction", emoji: "🎢" },
  { id: "bateau", label: "Cimetière de bateau", emoji: "⚓" },
  { id: "centre_commercial", label: "Centre commercial", emoji: "🛍️" },
  { id: "prison", label: "Prison | Commissariat", emoji: "👮🏼" },
  { id: "maison_retraite", label: "Maison de retraite", emoji: "🏡" },
  { id: "voiture", label: "Cimetière de voiture", emoji: "🚗" },
  { id: "pont", label: "Pont", emoji: "🌉" },
  { id: "avion", label: "Cimetière d'avion", emoji: "✈️" },
  { id: "musee", label: "Musée", emoji: "🖼️" },
  { id: "banque", label: "Banque", emoji: "🏦" },
  { id: "cinema", label: "Cinéma", emoji: "📽️" },
  { id: "piscine", label: "Piscine", emoji: "🛟" },
  { id: "zoo", label: "Zoo", emoji: "🐊" },
  { id: "aquarium", label: "Aquarium", emoji: "🐠" },
  { id: "autoroute", label: "Autoroute", emoji: "🛣️" },
  { id: "boite_de_nuit", label: "Boîte de nuit", emoji: "🕺" },
];

const STATUSES = [
  { id: "abandon", label: "Toujours à l'abandon" },
  { id: "demoli", label: "Démoli" },
  { id: "renove", label: "Rénové" },
  { id: "travaux_en_cours", label: "Travaux en cours" },
];

// LISTE DISTINCTE : ÉQUIPEMENTS
const EQUIPMENT_TYPES = [
  { id: "lampe", label: "Lampe", emoji: "🔦" },
  { id: "echelle", label: "Échelle", emoji: "🪜" },
  { id: "corde", label: "Corde", emoji: "🪢" },
  { id: "tenue_adaptee", label: "Tenue adaptée", emoji: "🦺" },
];

// LISTE DISTINCTE : AVERTISSEMENTS & RISQUES
const HAZARD_TYPES = [
  { id: "cameras", label: "Caméras", emoji: "📹" },
  { id: "capteurs", label: "Capteurs", emoji: "🚨" },
  { id: "gardiens", label: "Gardiens", emoji: "👮" },
  { id: "voisinage", label: "Voisinage", emoji: "👁️" },
];

const ALL_TAG_TYPES = [...EQUIPMENT_TYPES, ...HAZARD_TYPES];

function categoryLabel(id) {
  const c = CATEGORIES.find((c) => c.id === id);
  return c ? `${c.emoji} ${c.label}` : id;
}
function statusLabel(id) {
  const s = STATUSES.find((s) => s.id === id);
  return s ? s.label : id;
}
function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

const AppUI = {
  editingSpotId: null,
  tempWarnings: [],
  pendingFiles: [],
  pendingLatLng: null,

  // ---------------- Thème ----------------
  initTheme() {
    const saved = localStorage.getItem("urbex-theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  },
  toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("urbex-theme", next);
  },

  // ---------------- Drawer spot ----------------
  async openSpotDetail(spotId, fly = false) {
    const spot = await API.getSpot(spotId);
    if (fly) MapModule.flyTo(spot.lng, spot.lat);
    document.getElementById("spot-detail-content").innerHTML = this.renderSpotDetail(spot);
    document.getElementById("drawer-spot").classList.add("open");
    this._wireSpotDetailEvents(spot);
  },
  closeSpotDetail() {
    document.getElementById("drawer-spot").classList.remove("open");
  },

  renderSpotDetail(spot) {
    const cover = spot.photos.find((p) => p.is_cover) || spot.photos[0];
    const coverUrl = cover ? API.mediaUrl(cover.filename) : null;
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;

    const ratingRow = (label, value, color) => `
      <div class="mb-2">
        <div class="flex justify-between text-sm mb-1">
          <span class="label-eyebrow">${label}</span>
          <span>${value}/10</span>
        </div>
        <div class="rating-track"><div class="rating-fill" style="width:${value * 10}%; background:${color};"></div></div>
      </div>`;

    const renderBadgeItem = (w, isEquipment) => {
      const def = ALL_TAG_TYPES.find((t) => t.id === w.type);
      const name = def ? `${def.emoji} ${def.label}` : w.type;
      const isRed = w.level === "rouge";
      
      let levelText = "";
      let badgeColor = "";

      if (isEquipment) {
        levelText = isRed ? "Obligatoire" : "Conseillé";
      } else {
        levelText = isRed ? "Danger" : "Prudence";
      }

      // 🟠 Orange pour Danger / Obligatoire (au lieu du rouge)
      // 🟡 Jaune pour Prudence / Conseillé
      badgeColor = isRed ? "#ee3317" : "#f1c40f";

      return `
        <div class="panel-card p-2 flex items-center justify-between" style="border-left: 4px solid ${badgeColor};">
          <span class="font-medium text-sm">${name}</span>
          <span class="badge" style="background:${badgeColor}; color:#000; font-weight:600; font-size: 0.75rem;">
            ${levelText}
          </span>
        </div>`;
    };

    const spotWarnings = spot.warnings || [];
    const equipList = spotWarnings.filter(w => EQUIPMENT_TYPES.some(e => e.id === w.type));
    const hazardList = spotWarnings.filter(w => HAZARD_TYPES.some(h => h.id === w.type));

    const equipBlock = equipList.length > 0 
      ? `<div class="mt-4">
           <div class="label-eyebrow mb-2">Équipements</div>
           <div class="flex flex-col gap-2">${equipList.map(w => renderBadgeItem(w, true)).join("")}</div>
         </div>`
      : "";

    const hazardBlock = hazardList.length > 0 
      ? `<div class="mt-4">
           <div class="label-eyebrow mb-2">Avertissements</div>
           <div class="flex flex-col gap-2">${hazardList.map(w => renderBadgeItem(w, false)).join("")}</div>
         </div>`
      : "";

    const visitsHtml = spot.visits.map((v) => {
      const dateVal = typeof v === 'object' ? v.visit_date : v;
      const isArrested = typeof v === 'object' && (v.was_arrested || v.arrested);
      return `
      <li class="flex justify-between items-center panel-card px-3 py-2" style="${isArrested ? 'border-left: 4px solid var(--danger, #ff4444);' : ''}">
        <span>📅 ${fmtDate(dateVal)}</span>
        ${isArrested ? '<span class="badge" style="background:var(--danger, #ff4444); color:#fff; font-size:0.75rem;">🚨 Arrêté</span>' : ''}
      </li>`;
    }).join("") || `<li class="text-sm" style="color:var(--text-dim)">Aucune visite enregistrée.</li>`;

    const photosHtml = spot.photos.map((p) => `
      <div class="relative group">
        <img src="${API.mediaUrl(p.filename)}" class="photo-thumb w-full" data-lightbox="${API.mediaUrl(p.filename)}" />
        ${p.is_cover ? '<span class="absolute top-1 left-1 text-xs">⭐</span>' : ""}
      </div>`).join("");

    return `
      ${coverUrl ? `<img src="${coverUrl}" class="w-full h-48 object-cover rounded-b-none" style="border-radius:0 0 12px 12px;" />` : `<div class="h-8"></div>`}
      <div class="pt-4">
        <div class="flex justify-between items-start gap-2">
          <div>
            <div class="label-eyebrow">${categoryLabel(spot.category)}</div>
            <h2 class="text-2xl m-0">${spot.emoji ? spot.emoji + " " : ""}${spot.name}</h2>
          </div>
          <span class="badge badge-${spot.status}">${statusLabel(spot.status)}</span>
        </div>

        <div class="flex gap-2 mt-3">
          <a href="${gmapsUrl}" target="urbex_gmaps" class="btn-primary flex-1 text-center no-underline flex items-center justify-center" style="text-decoration:none;">
            <img src="googlemaps.png" alt="Google Maps" style="width: 20px; height: 20px; object-fit: contain;">
          </a>
          <button class="btn-ghost" id="btn-edit-spot" data-id="${spot.id}">✏️</button>
          <button class="btn-ghost" id="btn-delete-spot" data-id="${spot.id}">🗑️</button>
        </div>

        <div class="mt-5 panel-card p-4">
          <div class="flex justify-between items-center mb-3">
            <span class="label-eyebrow">Note globale</span>
            <span class="text-xl font-display">${spot.rating_global}/10</span>
          </div>
          ${ratingRow("État", spot.rating_state, "var(--teal)")}
          ${ratingRow("Sécurité | Risque", spot.rating_safety, "var(--danger)")}
          ${ratingRow("Intérêt", spot.rating_interest, "var(--rust)")}
        </div>

        ${equipBlock}
        ${hazardBlock}

        <div class="mt-4">
          <div class="label-eyebrow mb-2">Visites (${spot.visits.length})</div>
          <ul class="flex flex-col gap-1 list-none p-0 m-0">${visitsHtml}</ul>
        </div>

        ${spot.notes && spot.notes.trim() ? `
          <div class="mt-4">
            <div class="label-eyebrow mb-2">Notes</div>
            <p class="panel-card p-3 text-sm" style="white-space:pre-wrap;">${spot.notes}</p>
          </div>` : ""}

        <div class="mt-4">
          <div class="label-eyebrow mb-2">Galerie photos</div>
          <div class="grid grid-cols-3 gap-2">${photosHtml || '<p class="text-sm" style="color:var(--text-dim)">Aucune photo.</p>'}</div>
        </div>
      </div>
    `;
  },

  _wireSpotDetailEvents(spot) {
    document.querySelectorAll("[data-lightbox]").forEach((img) => {
      img.onclick = () => this.openLightbox(img.dataset.lightbox);
    });

    const editBtn = document.getElementById("btn-edit-spot");
    if (editBtn) editBtn.onclick = () => this.openAddSpotModal(spot);

    const delBtn = document.getElementById("btn-delete-spot");
    if (delBtn) {
      delBtn.onclick = async () => {
        if (!confirm(`Supprimer définitivement "${spot.name}" ?`)) return;
        await API.deleteSpot(spot.id);
        this.closeSpotDetail();
        window.App.refreshSpots();
      };
    }
  },

  openLightbox(url) {
    document.getElementById("lightbox-img").src = url;
    document.getElementById("lightbox").classList.remove("hidden");
  },
  closeLightbox() {
    document.getElementById("lightbox").classList.add("hidden");
  },

  // ---------------- Diary (journal) ----------------
  openDiary() {
    this.renderDiary(window.AppState.allSpots);
    document.getElementById("drawer-diary").classList.add("open");
  },
  closeDiary() {
    document.getElementById("drawer-diary").classList.remove("open");
  },
  renderDiary(spots) {
    const rows = [];
    spots.forEach((spot) => {
      spot.visits.forEach((v) => rows.push({ spot, visit: v }));
    });
    rows.sort((a, b) => {
      const dateA = typeof a.visit === 'object' ? a.visit.visit_date : a.visit;
      const dateB = typeof b.visit === 'object' ? b.visit.visit_date : b.visit;
      return dateA < dateB ? 1 : -1;
    });

    const html = rows.map(({ spot, visit }) => {
      const cover = spot.photos.find((p) => p.is_cover) || spot.photos[0];
      const thumb = cover
        ? `<img src="${API.mediaUrl(cover.filename)}" class="w-12 h-12 object-cover rounded-md" />`
        : `<div class="w-12 h-12 flex items-center justify-center rounded-md panel-card text-xl">${spot.emoji || "📍"}</div>`;
      
      const vDate = typeof visit === 'object' ? visit.visit_date : visit;
      const isArrested = typeof visit === 'object' && (visit.was_arrested || visit.arrested);

      return `
        <button class="panel-card p-3 flex items-center gap-3 w-full text-left btn-ghost" data-diary-spot="${spot.id}">
          ${thumb}
          <div class="flex-1">
            <div class="font-medium">${spot.name}</div>
            <div class="text-sm" style="color:var(--text-dim)">
              ${fmtDate(vDate)} ${isArrested ? '🚨' : ''}
            </div>
          </div>
          <div class="font-display text-lg">${spot.rating_global}</div>
        </button>`;
    }).join("") || `<p style="color:var(--text-dim)">Aucune visite enregistrée pour le moment.</p>`;

    document.getElementById("diary-content").innerHTML =
      `<div class="flex flex-col gap-2">${html}</div>`;

    document.querySelectorAll("[data-diary-spot]").forEach((btn) => {
      btn.onclick = () => {
        this.closeDiary();
        this.openSpotDetail(parseInt(btn.dataset.diarySpot), true);
      };
    });
  },

  // ---------------- Classement & filtres ----------------
  currentFilters: {},

  async openRanking() {
    const [categories, years] = await Promise.all([API.listCategories(), API.listYears()]);
    document.getElementById("filters-bar").innerHTML = `
      <select id="filter-category">
        <option value="">Toutes catégories</option>
        ${categories.map((c) => `<option value="${c}">${categoryLabel(c)}</option>`).join("")}
      </select>
      <select id="filter-status">
        <option value="">Tous statuts</option>
        ${STATUSES.map((s) => `<option value="${s.id}">${s.label}</option>`).join("")}
      </select>
      <select id="filter-year">
        <option value="">Toutes années</option>
        ${years.map((y) => `<option value="${y}">${y}</option>`).join("")}
      </select>
      <select id="filter-rating">
        <option value="">Toute note</option>
        <option value="8">8+ / 10</option>
        <option value="6">6+ / 10</option>
        <option value="4">4+ / 10</option>
      </select>
    `;
    ["filter-category", "filter-status", "filter-year", "filter-rating"].forEach((id) => {
      document.getElementById(id).onchange = () => this.applyRankingFilters();
    });
    await this.applyRankingFilters();
    document.getElementById("modal-ranking").classList.add("open");
  },

  async applyRankingFilters() {
    const filters = {
      category: document.getElementById("filter-category")?.value || null,
      status: document.getElementById("filter-status")?.value || null,
      year: document.getElementById("filter-year")?.value || null,
      minRating: document.getElementById("filter-rating")?.value || null,
    };
    const spots = await API.listSpots(filters);
    spots.sort((a, b) => b.rating_global - a.rating_global);
    MapModule.renderMarkers(spots);

    document.getElementById("ranking-list").innerHTML = spots.map((spot) => `
      <button class="panel-card p-3 flex items-center gap-3 w-full text-left btn-ghost" data-rank-spot="${spot.id}">
        <span class="text-xl">${spot.emoji || "📍"}</span>
        <div class="flex-1">
          <div class="font-medium">${spot.name}</div>
          <div class="text-sm" style="color:var(--text-dim)">${categoryLabel(spot.category)}</div>
        </div>
        <span class="badge badge-${spot.status}">${statusLabel(spot.status)}</span>
        <span class="font-display text-lg">${spot.rating_global}</span>
      </button>
    `).join("") || `<p style="color:var(--text-dim)">Aucun lieu ne correspond à ces filtres.</p>`;

    document.querySelectorAll("[data-rank-spot]").forEach((btn) => {
      btn.onclick = () => {
        this.closeRanking();
        this.openSpotDetail(parseInt(btn.dataset.rankSpot), true);
      };
    });
  },
  closeRanking() {
    document.getElementById("modal-ranking").classList.remove("open");
    MapModule.renderMarkers(window.AppState.allSpots);
  },

  // ---------------- Mini-stats ----------------
  async openStats() {
    const stats = await API.getStats();
    const catRows = Object.entries(stats.by_category)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `
        <div class="flex justify-between items-center py-1">
          <span>${categoryLabel(cat)}</span>
          <span class="badge" style="background:var(--bg-elevated); color:var(--text);">${count}</span>
        </div>`).join("");

    const demoli = stats.by_status.demoli || 0;
    const incendie = stats.by_status.incendie || 0;
    const disparus = demoli + incendie;
    const deboutStatuses = ["abandon", "demoli", "renove"];
    const debout = deboutStatuses.reduce((acc, s) => acc + (stats.by_status[s] || 0), 0);

    document.getElementById("stats-content").innerHTML = `
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="panel-card p-4 text-center">
          <div class="text-3xl font-display">${stats.total_spots}</div>
          <div class="label-eyebrow mt-1">Spots explorés</div>
        </div>
        <div class="panel-card p-4 text-center">
          <div class="text-3xl font-display">${stats.most_active_year || "—"}</div>
          <div class="label-eyebrow mt-1">Année la + active</div>
        </div>
        <div class="panel-card p-4 text-center">
          <div class="text-3xl font-display" style="color:var(--danger)">${disparus}</div>
          <div class="label-eyebrow mt-1">Disparus / démolis</div>
        </div>
        <div class="panel-card p-4 text-center">
          <div class="text-3xl font-display" style="color:var(--ok)">${debout}</div>
          <div class="label-eyebrow mt-1">Toujours debout</div>
        </div>
      </div>
      <div class="label-eyebrow mb-2">Répartition par catégorie</div>
      <div class="panel-card p-3">${catRows || "Aucune donnée."}</div>
    `;
    document.getElementById("modal-stats").classList.add("open");
  },
  closeStats() {
    document.getElementById("modal-stats").classList.remove("open");
  },

  // ---------------- Formulaire Ajout / Édition spot ----------------
  visitDatesDraft: [],

  openAddSpotModal(spot = null) {
    this.editingSpotId = spot ? spot.id : null;
    this.tempWarnings = spot ? [...(spot.warnings || [])] : [];
    this.visitDatesDraft = spot && spot.visits 
      ? spot.visits.map((v) => typeof v === 'object' ? { date: v.visit_date, arrested: !!(v.was_arrested || v.arrested) } : { date: v, arrested: false }) 
      : [];
    this.pendingFiles = [];
    this.pendingLatLng = spot ? { lat: spot.lat, lng: spot.lng } : null;

    document.getElementById("add-spot-title").textContent = spot ? "ÉDITER LE LIEU" : "NOUVEAU LIEU";
    document.getElementById("form-spot").innerHTML = this.renderSpotForm(spot);
    this._wireSpotFormEvents(spot);
    document.getElementById("modal-add-spot").classList.add("open");
    this.closeSpotDetail();
  },
  closeAddSpotModal() {
    document.getElementById("modal-add-spot").classList.remove("open");
    window.AppState.pickingLocation = false;
  },

  renderSpotForm(spot) {
    const s = spot || {
      name: "", category: "chateau", emoji: "", status: "abandon",
      rating_state: 5, rating_safety: 5, rating_interest: 5, notes: "",
      lat: null, lng: null,
    };
    
    const coordsStr = (s.lat !== null && s.lng !== null) ? `${s.lat}, ${s.lng}` : "";
    const today = getTodayISO();

    return `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="label-eyebrow">Nom</label>
          <input type="text" id="f-name" required value="${s.name}" class="w-full" />
        </div>
        <div>
          <label class="label-eyebrow">Catégorie</label>
          <select id="f-category" class="w-full h-8 px-3">
            ${CATEGORIES.map((c) => `<option value="${c.id}" ${s.category === c.id ? "selected" : ""}>${c.emoji} ${c.label}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="label-eyebrow">Emoji personnalisé</label>
          <input type="text" id="f-emoji" maxlength="4" placeholder="" value="${s.emoji || ""}" class="w-full h-8 px-3" />
        </div>
        <div class="col-span-2">
          <label class="label-eyebrow">Statut du lieu</label>
          <select id="f-status" class="w-full h-8 px-3">
            ${STATUSES.map((st) => `<option value="${st.id}" ${s.status === st.id ? "selected" : ""}>${st.label}</option>`).join("")}
          </select>
        </div>

        <div class="col-span-2 panel-card p-3">
          <label class="label-eyebrow">Localisation (Coordonnées GPS)</label>
          <div class="flex gap-2 mt-1">
            <input type="text" id="f-coords" placeholder=" 48.858844, 2.294350" value="${coordsStr}" class="w-full" />
          </div>
          <button type="button" id="btn-pick-map" class="btn-ghost w-full mt-2">📍</button>
          <p id="pick-hint" class="text-sm mt-1 hidden" style="color:var(--rust)">Clique sur la carte pour placer le point…</p>
        </div>

        <div class="col-span-2">
          <label class="label-eyebrow">État : <span id="v-state">${s.rating_state}</span>/10</label>
          <input type="range" min="0" max="10" id="f-rating-state" value="${s.rating_state}" class="w-full" />
        </div>
        <div class="col-span-2">
          <label class="label-eyebrow">Sécurité | Risque : <span id="v-safety">${s.rating_safety}</span>/10</label>
          <input type="range" min="0" max="10" id="f-rating-safety" value="${s.rating_safety}" class="w-full" />
        </div>
        <div class="col-span-2">
          <label class="label-eyebrow">Intérêt : <span id="v-interest">${s.rating_interest}</span>/10</label>
          <input type="range" min="0" max="10" id="f-rating-interest" value="${s.rating_interest}" class="w-full" />
        </div>

        <!-- SÉLECTION ÉQUIPEMENTS -->
        <div class="col-span-2">
          <label class="label-eyebrow mb-1 block">Équipements</label>
          <div id="equipment-picker" class="flex flex-wrap gap-2"></div>
        </div>

        <!-- SÉLECTION AVERTISSEMENTS -->
        <div class="col-span-2">
          <label class="label-eyebrow mb-1 block">Avertissements</label>
          <div id="hazards-picker" class="flex flex-wrap gap-2"></div>
        </div>

        <!-- SELECTION DE DATES -->
        <div class="col-span-2">
          <label class="label-eyebrow">Date(s) de visite</label>
          <div class="flex gap-2 items-center mt-1 flex-wrap">
            <input type="date" id="f-visit-date" value="${today}" class="flex-1" style="padding: 8px 12px; border-radius: 6px; box-sizing: border-box;" />
            
            <label style="display:flex; align-items:center; gap:4px; font-size:0.85rem; cursor:pointer; background:var(--bg-elevated, #222); padding:8px; border-radius:6px;">
              <input type="checkbox" id="f-visit-arrested" /> 🚨 Arrêté
            </label>

            <button type="button" id="btn-add-visit-date" class="btn-ghost" style="padding: 8px 14px;">+ Ajouter</button>
          </div>
          <div id="visit-dates-list" class="visits-container mt-2"></div>
        </div>

        <div class="col-span-2">
          <label class="label-eyebrow">Notes (optionnel)</label>
          <textarea id="f-notes" rows="3" class="w-full">${s.notes || ""}</textarea>
        </div>

        <div class="col-span-2">
          <label class="label-eyebrow mb-1 block">Photos</label>
          <div class="dropzone" id="dropzone">
            <p class="m-0">Déposer ici | Parcourir</p>
            <input type="file" id="f-photos" multiple accept="image/*" class="hidden" />
          </div>
          <div id="pending-files-list" class="flex flex-wrap gap-2 mt-2"></div>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button type="submit" id="btn-submit-spot" class="btn-primary flex-1">${spot ? "Enregistrer" : "Créer"}</button>
        <button type="button" class="btn-ghost" id="btn-cancel-form">Annuler</button>
      </div>
    `;
  },

  _wireSpotFormEvents(spot) {
    this._renderTagPicker("equipment-picker", EQUIPMENT_TYPES);
    this._renderTagPicker("hazards-picker", HAZARD_TYPES);
    this._renderPendingFiles();
    this._renderVisitDatesDraft();

    const emojiInput = document.getElementById("f-emoji");
    if (emojiInput) {
      emojiInput.oninput = (e) => {
        const emojiRegex = /\p{Extended_Pictographic}/gu;
        const matches = e.target.value.match(emojiRegex);
        e.target.value = matches ? matches[0] : "";
      };
    }

    ["state", "safety", "interest"].forEach((key) => {
      const input = document.getElementById(`f-rating-${key}`);
      const out = document.getElementById(`v-${key}`);
      if (input && out) input.oninput = () => (out.textContent = input.value);
    });

    document.getElementById("btn-pick-map").onclick = () => {
      window.AppState.pickingLocation = true;
      document.getElementById("pick-hint").classList.remove("hidden");
      document.getElementById("modal-add-spot").classList.remove("open");
    };

    const dz = document.getElementById("dropzone");
    const fileInput = document.getElementById("f-photos");
    if (dz && fileInput) {
      dz.onclick = () => fileInput.click();
      fileInput.onchange = () => this._addPendingFiles(fileInput.files);
      dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dragover"); });
      dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
      dz.addEventListener("drop", (e) => {
        e.preventDefault();
        dz.classList.remove("dragover");
        this._addPendingFiles(e.dataTransfer.files);
      });
    }

    const addVisitBtn = document.getElementById("btn-add-visit-date");
    if (addVisitBtn) {
      addVisitBtn.onclick = () => {
        const dateVal = document.getElementById("f-visit-date").value;
        const arrestedVal = document.getElementById("f-visit-arrested").checked;
        
        if (!dateVal) return;

        const exists = this.visitDatesDraft.some(item => (typeof item === 'string' ? item : item.date) === dateVal);
        if (exists) return;

        this.visitDatesDraft.push({ date: dateVal, arrested: arrestedVal });
        
        document.getElementById("f-visit-arrested").checked = false;
        this._renderVisitDatesDraft();
      };
    }

    document.getElementById("btn-cancel-form").onclick = () => this.closeAddSpotModal();
    document.getElementById("form-spot").onsubmit = (e) => this._submitSpotForm(e, spot);
  },

  _renderVisitDatesDraft() {
    const list = document.getElementById("visit-dates-list");
    if (!list) return;

    list.innerHTML = this.visitDatesDraft.map((item, i) => {
      const d = typeof item === 'string' ? item : item.date;
      const isArrested = typeof item === 'object' && item.arrested;

      return `
        <div class="visit-chip" style="${isArrested ? 'border: 1px solid var(--danger, #ff4444); background: rgba(255, 68, 68, 0.15);' : ''}">
          <span>📅 ${fmtDate(d)} ${isArrested ? '🚨' : ''}</span>
          <button type="button" class="btn-del-visit" data-rm-date="${i}" title="Supprimer la date">✕</button>
        </div>
      `;
    }).join("");

    document.querySelectorAll("[data-rm-date]").forEach((btn) => {
      btn.onclick = () => {
        this.visitDatesDraft.splice(parseInt(btn.dataset.rmDate), 1);
        this._renderVisitDatesDraft();
      };
    });
  },

  _renderTagPicker(containerId, tagList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isEquipmentPicker = containerId === "equipment-picker";
    const yellowTooltip = isEquipmentPicker ? "Conseillé" : "Prudence";
    const redTooltip = isEquipmentPicker ? "Obligatoire" : "Danger / Élevé";

    container.innerHTML = tagList.map((w) => {
      const existing = this.tempWarnings.find((tw) => tw.type === w.id);
      const level = existing ? existing.level : null;
      return `
        <div class="panel-card warning-card p-2 flex flex-col items-center gap-1" style="width:105px;">
          <span>${w.emoji}</span>
          <span class="text-xs text-center font-medium" style="color:var(--text-dim); line-height:1.1;">${w.label}</span>
          <div class="flex gap-1 mt-1">
            <button type="button" data-w="${w.id}" data-lvl="jaune" class="btn-ghost" title="${yellowTooltip}" style="padding:2px 6px; ${level === "jaune" ? "background:var(--hazard-yellow);color:#000;" : ""}">🟨</button>
            <button type="button" data-w="${w.id}" data-lvl="rouge" class="btn-ghost" title="${redTooltip}" style="padding:2px 6px; ${level === "rouge" ? "background:var(--danger);color:#fff;" : ""}">🟥</button>
          </div>
        </div>`;
    }).join("");

    container.querySelectorAll("[data-w]").forEach((btn) => {
      btn.onclick = () => {
        const type = btn.dataset.w;
        const lvl = btn.dataset.lvl;
        const idx = this.tempWarnings.findIndex((tw) => tw.type === type);
        if (idx >= 0 && this.tempWarnings[idx].level === lvl) {
          this.tempWarnings.splice(idx, 1);
        } else if (idx >= 0) {
          this.tempWarnings[idx].level = lvl;
        } else {
          this.tempWarnings.push({ type, level: lvl });
        }
        this._renderTagPicker("equipment-picker", EQUIPMENT_TYPES);
        this._renderTagPicker("hazards-picker", HAZARD_TYPES);
      };
    });
  },

  _addPendingFiles(fileList) {
    this.pendingFiles.push(...Array.from(fileList));
    this._renderPendingFiles();
  },
  _renderPendingFiles() {
    document.getElementById("pending-files-list").innerHTML = this.pendingFiles.map((f, i) => `
      <span class="warn-chip warn-jaune">${f.name} <button type="button" data-rm-file="${i}" style="background:none;border:none;color:inherit;cursor:pointer;">✕</button></span>
    `).join("");
    document.querySelectorAll("[data-rm-file]").forEach((btn) => {
      btn.onclick = () => {
        this.pendingFiles.splice(parseInt(btn.dataset.rmFile), 1);
        this._renderPendingFiles();
      };
    });
  },

  onMapPicked(lng, lat) {
    window.AppState.pickingLocation = false;
    document.getElementById("modal-add-spot").classList.add("open");
    const coordsInput = document.getElementById("f-coords");
    if (coordsInput) {
      coordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    document.getElementById("pick-hint").classList.add("hidden");
  },

  async _submitSpotForm(e, existingSpot) {
    e.preventDefault();

    const submitBtn = document.getElementById("btn-submit-spot");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enregistrement en cours...";
    }

    try {
      const coordsRaw = document.getElementById("f-coords").value;
      const parts = coordsRaw.split(",").map((s) => s.trim());
      
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);

      if (isNaN(lat) || isNaN(lng) || parts.length < 2) {
        alert("Format de coordonnées invalide. Veuillez entrer au format : Latitude, Longitude (Ex: 48.858844, 2.294350)");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = existingSpot ? "Enregistrer" : "Créer";
        }
        return;
      }

      const emojiVal = document.getElementById("f-emoji").value.trim();

      const payload = {
        name: document.getElementById("f-name").value,
        category: document.getElementById("f-category").value,
        emoji: emojiVal || null,
        status: document.getElementById("f-status").value,
        lat, 
        lng,
        rating_state: parseInt(document.getElementById("f-rating-state").value) || 0,
        rating_safety: parseInt(document.getElementById("f-rating-safety").value) || 0,
        rating_interest: parseInt(document.getElementById("f-rating-interest").value) || 0,
        notes: document.getElementById("f-notes").value || null,
        warnings: this.tempWarnings || [],
      };

      let spotId;
      if (existingSpot) {
        await API.updateSpot(existingSpot.id, payload);
        spotId = existingSpot.id;

        if (this.visitDatesDraft && this.visitDatesDraft.length > 0) {
          const currentVisits = existingSpot.visits ? existingSpot.visits.map(v => typeof v === 'object' ? v.visit_date : v) : [];
          for (const item of this.visitDatesDraft) {
            const dateStr = typeof item === 'object' ? item.date : item;
            const isArrested = typeof item === 'object' ? !!item.arrested : false;
            if (dateStr && !currentVisits.includes(dateStr)) {
              await API.addVisit(spotId, dateStr, isArrested);
            }
          }
        }
      } else {
        const dateInput = document.getElementById("f-visit-date");
        const arrestedInput = document.getElementById("f-visit-arrested");
        if (this.visitDatesDraft.length === 0 && dateInput && dateInput.value) {
          this.visitDatesDraft.push({
            date: dateInput.value,
            arrested: arrestedInput ? arrestedInput.checked : false
          });
        }
        
        payload.visit_dates = this.visitDatesDraft.map(item => {
          if (typeof item === 'object') {
            return { visit_date: item.date, was_arrested: !!item.arrested };
          }
          return { visit_date: item, was_arrested: false };
        });

        const created = await API.createSpot(payload);
        spotId = created.id;
      }

      if (this.pendingFiles && this.pendingFiles.length) {
        await API.uploadPhotos(spotId, this.pendingFiles);
      }

      this.closeAddSpotModal();
      await window.App.refreshSpots();
      this.openSpotDetail(spotId, true);
    } catch (err) {
      alert("Une erreur est survenue lors de l'enregistrement : " + err.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = existingSpot ? "Enregistrer" : "Créer";
      }
    }
  },
};