/**
 * ThaalTatva AI - Geolocation Gym Radar & Fitness Clubs Locator
 * Detects user coordinates, finds nearby verified gyms, filters amenities,
 * and launches one-click Google Maps turn-by-turn navigation.
 */

const GymLocatorModule = {
  currentCoords: null,
  activeFilter: 'all',
  selectedCity: '',

  init() {
    this.bindEvents();
    this.loadGyms();
  },

  bindEvents() {
    // Detect Location GPS button
    const gpsBtn = document.getElementById('detectGpsLocationBtn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        this.detectCurrentLocation();
      });
    }

    // City Selector
    const citySelect = document.getElementById('gymCitySelect');
    if (citySelect) {
      citySelect.addEventListener('change', (e) => {
        playAudioFx('click');
        this.selectedCity = e.target.value;
        this.currentCoords = null; // Clear GPS if manually picked city
        this.loadGyms();
      });
    }

    // Amenity filter pills
    const filterBtns = document.querySelectorAll('.gym-filter-pill');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playAudioFx('toggle');
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.loadGyms();
      });
    });

    // Custom search input
    const searchInput = document.getElementById('gymSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterGymsByText(e.target.value);
      });
    }
  },

  detectCurrentLocation() {
    const statusEl = document.getElementById('gpsStatusText');
    if (statusEl) statusEl.textContent = '🛰️ Triangulating GPS Satellites...';
    playAudioFx('scan');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          if (statusEl) {
            statusEl.textContent = `📍 Locked: ${this.currentCoords.lat.toFixed(4)}, ${this.currentCoords.lng.toFixed(4)}`;
          }
          playAudioFx('celebrate');
          showToast('GPS Location Verified! Sorting gyms by exact distance.', 'success');
          this.loadGyms();
        },
        (error) => {
          console.warn('Geolocation denied or unavailable:', error.message);
          if (statusEl) {
            statusEl.textContent = '📍 Geolocation permission denied. Showing top metro gyms.';
          }
          showToast('GPS access denied. Pick your city or browse verified gyms below.', 'warning');
          this.loadGyms();
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      if (statusEl) statusEl.textContent = 'Geolocation not supported by browser.';
      this.loadGyms();
    }
  },

  async loadGyms() {
    let endpoint = `gyms/nearby?filter_type=${this.activeFilter}`;
    if (this.currentCoords) {
      endpoint += `&lat=${this.currentCoords.lat}&lng=${this.currentCoords.lng}`;
    } else if (this.selectedCity) {
      endpoint += `&city=${encodeURIComponent(this.selectedCity)}`;
    }

    try {
      const res = await apiRequest(endpoint, 'GET');
      if (res && res.gyms) {
        this.allGyms = res.gyms;
        this.renderGymCards(res.gyms);
      }
    } catch (e) {
      console.error('Failed to load gyms:', e);
    }
  },

  filterGymsByText(text) {
    if (!this.allGyms) return;
    const query = text.toLowerCase().trim();
    if (!query) {
      this.renderGymCards(this.allGyms);
      return;
    }
    const filtered = this.allGyms.filter(g =>
      g.name.toLowerCase().includes(query) ||
      g.address.toLowerCase().includes(query) ||
      g.city.toLowerCase().includes(query) ||
      g.amenities.some(a => a.toLowerCase().includes(query))
    );
    this.renderGymCards(filtered);
  },

  renderGymCards(gyms) {
    const container = document.getElementById('nearbyGymsList');
    if (!container) return;

    if (!gyms || gyms.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
          <div style="font-size: 38px; margin-bottom: 12px;">🏋️</div>
          <h4 style="color: #fff; font-size: 18px; margin-bottom: 6px;">No Gyms Found Matching Filters</h4>
          <p style="color: var(--text-secondary); font-size: 13.5px;">Try clearing filters or switching your city location above.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = gyms.map(gym => {
      const amenitiesHtml = gym.amenities.map(a => `<span class="gym-amenity-chip">${a}</span>`).join('');
      const distFormatted = gym.distance_km < 1 ? `${Math.round(gym.distance_km * 1000)}m` : `${gym.distance_km.toFixed(1)} km`;

      return `
        <div class="gym-radar-card">
          <div class="gym-card-header">
            <div>
              <div class="gym-city-tag">${gym.city} • ${gym.price_tier}</div>
              <h3 class="gym-name">${gym.name}</h3>
              <div class="gym-address">📍 ${gym.address}</div>
            </div>
            <div class="gym-distance-badge">
              <span class="dist-val">${distFormatted}</span>
              <span class="dist-label">away</span>
            </div>
          </div>

          <p class="gym-highlight">${gym.highlight}</p>

          <div class="gym-amenities-row">
            ${amenitiesHtml}
          </div>

          <div class="gym-card-footer">
            <div class="gym-rating-block">
              <span class="star-rating">★ ${gym.rating}</span>
              <span class="review-count">(${gym.review_count} reviews)</span>
              <span class="gym-hours">• ${gym.hours}</span>
            </div>

            <a href="${gym.google_maps_url}" target="_blank" rel="noopener noreferrer" class="gym-directions-btn" onclick="playAudioFx('click')">
              <span>🗺️</span>
              <span>Get Directions</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
};
