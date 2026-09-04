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
            statusEl.textContent = `📍 GPS Locked: ${this.currentCoords.lat.toFixed(4)}, ${this.currentCoords.lng.toFixed(4)}`;
          }
          playAudioFx('celebrate');
          this.loadGyms(true);
        },
        (error) => {
          console.warn('Geolocation denied or unavailable:', error.message);
          if (statusEl) {
            statusEl.textContent = '📍 Geolocation permission denied. Showing top metro clubs.';
          }
          showToast('GPS access denied. Pick your city or browse verified gyms below.', 'warning');
          this.loadGyms(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      if (statusEl) statusEl.textContent = 'Geolocation not supported by browser.';
      this.loadGyms(false);
    }
  },

  async loadGyms(isGpsTriggered = false) {
    let endpoint = `gyms/nearby?filter_type=${this.activeFilter}`;
    if (this.currentCoords) {
      endpoint += `&lat=${this.currentCoords.lat}&lng=${this.currentCoords.lng}`;
    } else if (this.selectedCity) {
      endpoint += `&city=${encodeURIComponent(this.selectedCity)}`;
    }

    try {
      const res = await apiRequest(endpoint, 'GET');
      if (res && res.gyms && res.gyms.length > 0) {
        this.allGyms = res.gyms;
        const nearestGym = res.gyms[0];

        // Render spotlight for #1 nearest gym
        this.renderNearestGymSpotlight(nearestGym);

        // Render remaining gyms in grid below
        this.renderGymCards(res.gyms.slice(1));

        if (isGpsTriggered && nearestGym) {
          const distText = nearestGym.distance_km < 1 ? `${Math.round(nearestGym.distance_km * 1000)}m` : `${nearestGym.distance_km.toFixed(1)} km`;
          showToast(`🎯 Nearest Gym Found: ${nearestGym.name} (${distText} away)!`, 'success');
          
          const spotlightEl = document.getElementById('nearestGymSpotlightCard');
          if (spotlightEl) {
            spotlightEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      } else {
        this.renderNearestGymSpotlight(null);
        this.renderGymCards([]);
      }
    } catch (e) {
      console.error('Failed to load gyms:', e);
    }
  },

  renderNearestGymSpotlight(gym) {
    const container = document.getElementById('nearestGymSpotlightCard');
    if (!container) return;

    if (!gym) {
      container.innerHTML = '';
      return;
    }

    if (!this.currentCoords) {
      container.innerHTML = `
        <div class="nearest-gym-spotlight-card" style="border-color: rgba(0, 242, 254, 0.4); box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
              <div class="spotlight-badge" style="background: rgba(0, 242, 254, 0.15); border-color: rgba(0, 242, 254, 0.4); color: var(--tatva-cyan-bright);">
                🛰️ LIVE GPS PROXIMITY RADAR READY
              </div>
              <h3 style="font-size: 19px; color: #fff; margin: 4px 0 6px;">Find Your Nearest Fitness Center</h3>
              <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                Click 'Auto-Detect GPS Location' to triangulate your satellite coordinates and immediately reveal your closest gym, walking & driving commute times, and 1-click Google Maps navigation.
              </p>
            </div>
            <button class="btn-volt-glow" onclick="GymLocatorModule.detectCurrentLocation()">
              <span>🛰️</span> Auto-Detect Nearest Gym
            </button>
          </div>
        </div>
      `;
      return;
    }

    const distFormatted = gym.distance_km < 1 ? `${Math.round(gym.distance_km * 1000)}m` : `${gym.distance_km.toFixed(1)} km`;
    const walkMin = Math.max(1, Math.round((gym.distance_km / 4.8) * 60));
    const bikeMin = Math.max(1, Math.round((gym.distance_km / 16.0) * 60));
    const driveMin = Math.max(1, Math.round((gym.distance_km / 35.0) * 60));

    const amenitiesHtml = gym.amenities.map(a => `<span class="gym-amenity-chip">${a}</span>`).join('');

    container.innerHTML = `
      <div class="nearest-gym-spotlight-card">
        <div class="spotlight-header">
          <div>
            <div class="spotlight-badge">
              <span>🎯</span> NEAREST GYM TO YOUR GPS LOCATION
            </div>
            <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 2px 0 4px;">
              ${gym.name}
            </h2>
            <div style="font-size: 13.5px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span>📍 ${gym.address}</span> • <span style="color: var(--tatva-gold);">${gym.city} (${gym.price_tier})</span>
            </div>
          </div>

          <div class="spotlight-distance-box">
            <span class="dist-large">${distFormatted}</span>
            <span class="dist-sub">from you</span>
          </div>
        </div>

        <p style="font-size: 13px; color: #e2e8f0; line-height: 1.5; margin: 8px 0 12px;">
          ${gym.highlight}
        </p>

        <!-- Real-World Travel / Commute Estimates -->
        <div class="spotlight-commute-row">
          <div class="commute-pill">
            <span>🚶 Walking:</span> <strong>~${walkMin} min</strong>
          </div>
          <span style="color: rgba(255,255,255,0.2);">|</span>
          <div class="commute-pill">
            <span>🚲 Cycling:</span> <strong>~${bikeMin} min</strong>
          </div>
          <span style="color: rgba(255,255,255,0.2);">|</span>
          <div class="commute-pill">
            <span>🚗 Driving:</span> <strong>~${driveMin} min</strong>
          </div>
          <span style="color: rgba(255,255,255,0.2);">|</span>
          <div class="commute-pill">
            <span>🕒 Hours:</span> <strong style="color: var(--tatva-emerald-bright);">${gym.hours}</strong>
          </div>
        </div>

        <!-- Amenities -->
        <div class="gym-amenities-row" style="margin-top: 10px;">
          ${amenitiesHtml}
        </div>

        <!-- Action Buttons -->
        <div class="spotlight-actions">
          <a href="${gym.google_maps_url}" target="_blank" rel="noopener noreferrer" class="btn-volt-glow" style="text-decoration: none; font-size: 13px; padding: 11px 22px;">
            <span>🗺️</span> Start Live Turn-by-Turn Navigation
          </a>
          <button class="btn btn-secondary" onclick="switchTab('fitness')" style="font-size: 12.5px; padding: 10px 18px;">
            <span>🏋️</span> View Workout Protocol
          </button>
          <a href="tel:+919876543210" class="btn btn-secondary" style="text-decoration: none; font-size: 12.5px; padding: 10px 18px;">
            <span>📞</span> Inquire Day Pass
          </a>
        </div>
      </div>
    `;
  },

  filterGymsByText(text) {
    if (!this.allGyms) return;
    const query = text.toLowerCase().trim();
    if (!query) {
      this.renderNearestGymSpotlight(this.allGyms[0]);
      this.renderGymCards(this.allGyms.slice(1));
      return;
    }
    const filtered = this.allGyms.filter(g =>
      g.name.toLowerCase().includes(query) ||
      g.address.toLowerCase().includes(query) ||
      g.city.toLowerCase().includes(query) ||
      g.amenities.some(a => a.toLowerCase().includes(query))
    );
    if (filtered.length > 0) {
      this.renderNearestGymSpotlight(filtered[0]);
      this.renderGymCards(filtered.slice(1));
    } else {
      this.renderNearestGymSpotlight(null);
      this.renderGymCards([]);
    }
  },

  renderGymCards(gyms) {
    const container = document.getElementById('nearbyGymsList');
    if (!container) return;

    if (!gyms || gyms.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
          <div style="font-size: 38px; margin-bottom: 12px;">🏋️</div>
          <h4 style="color: #fff; font-size: 18px; margin-bottom: 6px;">No Additional Gyms Found Matching Filters</h4>
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
