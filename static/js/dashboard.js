/**
 * NutriVision AI - Daily Nutrition, Macro Budget & Diary Dashboard
 */

const DashboardModule = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const resetBtn = document.getElementById('resetDiaryBtn');
    const addWaterBtn = document.getElementById('addWaterBtn');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetDailyDiary());
    }

    if (addWaterBtn) {
      addWaterBtn.addEventListener('click', () => {
        AppState.dailyConsumed.water_liters += 0.25;
        saveConsumedState();
        this.renderDashboard();
        showToast('Logged +250ml water hydration', 'info');
      });
    }
  },

  renderDashboard() {
    const targets = AppState.dailyTargets;
    const consumed = AppState.dailyConsumed;

    // Calories Ring
    this.updateRadialRing('calRing', consumed.calories, targets.calories_kcal);
    const calVal = document.getElementById('dashCalVal');
    const calSub = document.getElementById('dashCalSub');
    if (calVal) calVal.textContent = Math.round(consumed.calories);
    if (calSub) calSub.textContent = `of ${targets.calories_kcal} kcal (${Math.max(0, targets.calories_kcal - Math.round(consumed.calories))} left)`;

    // Protein Ring
    this.updateRadialRing('proteinRing', consumed.protein_g, targets.protein_g);
    const pVal = document.getElementById('dashProteinVal');
    const pSub = document.getElementById('dashProteinSub');
    if (pVal) pVal.textContent = `${Math.round(consumed.protein_g)}g`;
    if (pSub) pSub.textContent = `of ${targets.protein_g}g (${Math.max(0, targets.protein_g - Math.round(consumed.protein_g))}g left)`;

    // Carbs Ring
    this.updateRadialRing('carbsRing', consumed.carbs_g, targets.carbs_g);
    const cVal = document.getElementById('dashCarbsVal');
    const cSub = document.getElementById('dashCarbsSub');
    if (cVal) cVal.textContent = `${Math.round(consumed.carbs_g)}g`;
    if (cSub) cSub.textContent = `of ${targets.carbs_g}g (${Math.max(0, targets.carbs_g - Math.round(consumed.carbs_g))}g left)`;

    // Fat Ring
    this.updateRadialRing('fatRing', consumed.fat_g, targets.fat_g);
    const fVal = document.getElementById('dashFatVal');
    const fSub = document.getElementById('dashFatSub');
    if (fVal) fVal.textContent = `${Math.round(consumed.fat_g)}g`;
    if (fSub) fSub.textContent = `of ${targets.fat_g}g (${Math.max(0, targets.fat_g - Math.round(consumed.fat_g))}g left)`;

    // Fiber Ring
    this.updateRadialRing('fiberRing', consumed.fiber_g, targets.fiber_g);
    const fibVal = document.getElementById('dashFiberVal');
    const fibSub = document.getElementById('dashFiberSub');
    if (fibVal) fibVal.textContent = `${Math.round(consumed.fiber_g)}g`;
    if (fibSub) fibSub.textContent = `of ${targets.fiber_g}g (${Math.max(0, targets.fiber_g - Math.round(consumed.fiber_g))}g left)`;

    // Water
    const wVal = document.getElementById('dashWaterVal');
    const wSub = document.getElementById('dashWaterSub');
    if (wVal) wVal.textContent = `${(consumed.water_liters || 0).toFixed(1)}L`;
    if (wSub) wSub.textContent = `Target: ${targets.water_liters}L / day`;

    // Render Timeline Meals
    this.renderMealTimeline();
  },

  updateRadialRing(elementId, current, maxVal) {
    const ring = document.getElementById(elementId);
    if (!ring) return;

    const radius = 38;
    const circumference = 2 * Math.PI * radius; // ~238.76
    ring.style.strokeDasharray = `${circumference} ${circumference}`;

    const pct = Math.min(Math.max((current / (maxVal || 1)), 0), 1.0);
    const offset = circumference - (pct * circumference);
    ring.style.strokeDashoffset = offset;
  },

  renderMealTimeline() {
    const container = document.getElementById('dailyMealTimeline');
    if (!container) return;

    const meals = AppState.dailyConsumed.meals || [];
    if (meals.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🍽️</div>
          <p>No meals logged yet today.</p>
          <p style="font-size: 11px;">Use the Plate Scanner or Leftover Comparator to log your pre/post meals.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    meals.forEach((m, idx) => {
      const item = document.createElement('div');
      item.className = 'timeline-item';

      let icon = '🥗';
      if (m.type === 'Breakfast') icon = '🍳';
      if (m.type === 'Lunch') icon = '🍛';
      if (m.type === 'Snack' || m.type === 'Snacks') icon = '🥜';
      if (m.type === 'Dinner') icon = '🍲';

      item.innerHTML = `
        <div class="timeline-icon">${icon}</div>
        <div class="timeline-details">
          <div class="timeline-header">
            <h4>${m.type}: ${m.title}</h4>
            <span class="timeline-time">${m.time}</span>
          </div>
          <div class="timeline-macros">
            <span style="color: #34d399; font-weight: 600;">🔥 ${Math.round(m.calories)} kcal</span>
            <span style="color: #22d3ee;">🥩 ${m.protein_g}g Protein</span>
            <span style="color: #fbbf24;">🌾 ${m.carbs_g}g Carbs</span>
            <span style="color: #fb7185;">🥑 ${m.fat_g}g Fat</span>
          </div>
          ${m.items && m.items.length ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${m.items.join(' • ')}</div>` : ''}
        </div>
      `;
      container.appendChild(item);
    });
  },

  resetDailyDiary() {
    if (confirm('Reset today\'s logged nutrition entries?')) {
      AppState.dailyConsumed = {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sodium_mg: 0,
        water_liters: 0.5,
        meals: []
      };
      saveConsumedState();
      this.renderDashboard();
      showToast('Daily nutrition diary reset', 'info');
    }
  }
};
