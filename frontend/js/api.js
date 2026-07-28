// ============================================================
// API — Wrapper fetch vers le backend FastAPI
// ============================================================
const API = {
  base: CONFIG.API_BASE_URL,

  async _handle(res) {
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).detail || detail; } catch (e) {}
      throw new Error(detail);
    }
    if (res.status === 204) return null;
    return res.json();
  },

  async listSpots(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status_filter", filters.status);
    if (filters.year) params.set("year", filters.year);
    if (filters.minRating) params.set("min_rating", filters.minRating);
    const res = await fetch(`${this.base}/api/spots?${params.toString()}`);
    return this._handle(res);
  },

  async getSpot(id) {
    const res = await fetch(`${this.base}/api/spots/${id}`);
    return this._handle(res);
  },

  async createSpot(payload) {
    const res = await fetch(`${this.base}/api/spots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return this._handle(res);
  },

  async updateSpot(id, payload) {
    const res = await fetch(`${this.base}/api/spots/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return this._handle(res);
  },

  async deleteSpot(id) {
    const res = await fetch(`${this.base}/api/spots/${id}`, { method: "DELETE" });
    return this._handle(res);
  },

  async addVisit(spotId, visitDate) {
    const res = await fetch(`${this.base}/api/spots/${spotId}/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visit_date: visitDate }),
    });
    return this._handle(res);
  },

  async deleteVisit(spotId, visitId) {
    const res = await fetch(`${this.base}/api/spots/${spotId}/visits/${visitId}`, { method: "DELETE" });
    return this._handle(res);
  },

  async uploadPhotos(spotId, files) {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    const res = await fetch(`${this.base}/api/spots/${spotId}/photos`, {
      method: "POST",
      body: form,
    });
    return this._handle(res);
  },

  async deletePhoto(photoId) {
    const res = await fetch(`${this.base}/api/photos/${photoId}`, { method: "DELETE" });
    return this._handle(res);
  },

  async setCoverPhoto(photoId) {
    const res = await fetch(`${this.base}/api/photos/${photoId}/cover`, { method: "PUT" });
    return this._handle(res);
  },

  async listCategories() {
    const res = await fetch(`${this.base}/api/spots/meta/categories`);
    return this._handle(res);
  },

  async listYears() {
    const res = await fetch(`${this.base}/api/spots/meta/years`);
    return this._handle(res);
  },

  async getStats() {
    const res = await fetch(`${this.base}/api/stats`);
    return this._handle(res);
  },

  mediaUrl(filename) {
    return `${this.base}/media/${filename}`;
  },
};
