/**
 * ThaalTatva AI - Panch-Tatva Macro Budget & Diary Dashboard
 */

const DashboardModule = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const resetBtn = document.getElementById('resetDiaryBtn');
    const addWaterBtn = document.getElementById('addWaterBtn');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        playAudioFx('click');
        this.resetDailyDiary();
      });
    }

    if (addWaterBtn) {
      addWaterBtn.addEventListener('click', () => {
        playAudioFx('toggle');
        AppState.dailyConsumed.water_liters = Math.round(((AppState.dailyConsumed.water_liters || 0) + 0.25) * 100) / 100;
        saveConsumedState();
        this.renderDashboard();
        showToast('Logged +250ml Jal hydration', 'info');
      });
    }
  },

  renderDashboard() {
    const targets = AppState.dailyTargets;
    const consumed = AppState.dailyConsumed;

    // Agni / Calories Ring
    this.updateRadialRing('calRing', consumed.calories, targets.calories_kcal);
    animateNumber('dashCalVal', Math.round(consumed.calories));
    const calSub = document.getElementById('dashCalSub');
    if (calSub) calSub.textContent = `of ${targets.calories_kcal} kcal (${Math.max(0, targets.calories_kcal - Math.round(consumed.calories))} left)`;

    // Prithvi / Protein Ring
    this.updateRadialRing('proteinRing', consumed.protein_g, targets.protein_g);
    animateNumber('dashProteinVal', Math.round(consumed.protein_g), 600, 'g');
    const pSub = document.getElementById('dashProteinSub');
    if (pSub) pSub.textContent = `of ${targets.protein_g}g (${Math.max(0, Math.round(targets.protein_g - consumed.protein_g))}g left)`;

    // Vayu / Carbs Ring
    this.updateRadialRing('carbsRing', consumed.carbs_g, targets.carbs_g);
    animateNumber('dashCarbsVal', Math.round(consumed.carbs_g), 600, 'g');
    const cSub = document.getElementById('dashCarbsSub');
    if (cSub) cSub.textContent = `of ${targets.carbs_g}g (${Math.max(0, Math.round(targets.carbs_g - consumed.carbs_g))}g left)`;

    // Sneha / Fat Ring
    this.updateRadialRing('fatRing', consumed.fat_g, targets.fat_g);
    animateNumber('dashFatVal', Math.round(consumed.fat_g), 600, 'g');
    const fSub = document.getElementById('dashFatSub');
    if (fSub) fSub.textContent = `of ${targets.fat_g}g (${Math.max(0, Math.round(targets.fat_g - consumed.fat_g))}g left)`;

    // Prakriti / Fiber Ring
    this.updateRadialRing('fiberRing', consumed.fiber_g, targets.fiber_g);
    animateNumber('dashFiberVal', Math.round(consumed.fiber_g), 600, 'g');
    const fibSub = document.getElementById('dashFiberSub');
    if (fibSub) fibSub.textContent = `of ${targets.fiber_g}g (${Math.max(0, Math.round(targets.fiber_g - consumed.fiber_g))}g left)`;

    // Jal / Water
    const wVal = document.getElementById('dashWaterVal');
    const wSub = document.getElementById('dashWaterSub');
    if (wVal) wVal.textContent = `${(consumed.water_liters || 0).toFixed(1)}L`;
    if (wSub) wSub.textContent = `Target: ${targets.water_liters}L / day`;

    // Header Status Ticker Update
    const headerStatus = document.getElementById('headerLiveStatus');
    if (headerStatus) {
      const pct = Math.min(100, Math.round((consumed.calories / (targets.calories_kcal || 1)) * 100));
      headerStatus.textContent = `${pct}% of Daily Tatva Intake Met • ${Math.round(consumed.calories)}/${targets.calories_kcal} kcal`;
    }

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
        <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
          <div style="font-size: 38px; margin-bottom: 10px;">🍽️</div>
          <p style="font-weight: 600; color: var(--text-secondary);">No meals logged yet today.</p>
          <p style="font-size: 11.5px; margin-top: 4px;">Use the Plate Scanner or Leftover Comparator to log your pre/post meals.</p>
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
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="font-size: 24px;">${icon}</div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 14px;">${m.type}: ${m.title}</div>
            <div style="display: flex; gap: 12px; font-size: 11.5px; margin-top: 4px; flex-wrap: wrap;">
              <span style="color: #34d399; font-weight: 700;">🔥 ${Math.round(m.calories)} kcal ऊर्जा</span>
              <span style="color: #22d3ee; font-weight: 600;">🥩 ${m.protein_g}g प्रथिन (Protein)</span>
              <span style="color: #fbbf24; font-weight: 600;">🌾 ${m.carbs_g}g कार्बोज (Carbs)</span>
              <span style="color: #fb7185; font-weight: 600;">🥑 ${m.fat_g}g स्नेह (Fat)</span>
            </div>
            ${m.items && m.items.length ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">${m.items.join(' • ')}</div>` : ''}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 11px; color: var(--text-muted);">${m.time}</span>
          <button class="btn-icon" style="width: 28px; height: 28px; font-size: 12px;" title="Remove Entry" onclick="DashboardModule.removeMeal(${idx})">✕</button>
        </div>
      `;
      container.appendChild(item);
    });
  },

  removeMeal(index) {
    playAudioFx('click');
    const removed = AppState.dailyConsumed.meals.splice(index, 1)[0];
    if (removed) {
      AppState.dailyConsumed.calories = Math.max(0, AppState.dailyConsumed.calories - removed.calories);
      AppState.dailyConsumed.protein_g = Math.max(0, AppState.dailyConsumed.protein_g - removed.protein_g);
      AppState.dailyConsumed.carbs_g = Math.max(0, AppState.dailyConsumed.carbs_g - removed.carbs_g);
      AppState.dailyConsumed.fat_g = Math.max(0, AppState.dailyConsumed.fat_g - removed.fat_g);
      AppState.dailyConsumed.fiber_g = Math.max(0, AppState.dailyConsumed.fiber_g - (removed.fiber_g || 0));
      saveConsumedState();
      this.renderDashboard();
      showToast('Meal entry removed', 'info');
    }
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
