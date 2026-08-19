/**
 * ThaalTatva AI - Client Fitness Profile & Metabolic Target Manager
 */

const ClientProfileModule = {
  init() {
    this.bindEvents();
    this.syncProfileTargets();
  },

  bindEvents() {
    const form = document.getElementById('clientProfileForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfileFromForm();
      });
    }

    // Dynamic auto-calculate on change with audio feedback
    ['profileAge', 'profileGender', 'profileHeight', 'profileWeight', 'profileTargetWeight', 'profileActivity', 'profileGoal', 'profileDietPref'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          playAudioFx('toggle');
          this.previewTargets();
        });
      }
    });
  },

  loadProfileUI() {
    const p = AppState.clientProfile;
    this.setVal('profileAge', p.age);
    this.setVal('profileGender', p.gender);
    this.setVal('profileHeight', p.height_cm);
    this.setVal('profileWeight', p.current_weight_kg);
    this.setVal('profileTargetWeight', p.target_weight_kg);
    this.setVal('profileActivity', p.activity_level);
    this.setVal('profileGoal', p.goal);
    this.setVal('profileDietPref', p.dietary_preference || 'all');

    this.previewTargets();
  },

  setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  },

  async previewTargets() {
    const payload = {
      age: parseInt(document.getElementById('profileAge')?.value || 25),
      gender: document.getElementById('profileGender')?.value || 'male',
      height_cm: parseFloat(document.getElementById('profileHeight')?.value || 175),
      current_weight_kg: parseFloat(document.getElementById('profileWeight')?.value || 75),
      target_weight_kg: parseFloat(document.getElementById('profileTargetWeight')?.value || 72),
      activity_level: document.getElementById('profileActivity')?.value || 'moderate',
      goal: document.getElementById('profileGoal')?.value || 'lean_hypertrophy',
      dietary_preference: document.getElementById('profileDietPref')?.value || 'all'
    };

    try {
      const res = await apiRequest('calculate-targets', 'POST', payload);
      if (res && res.data) {
        this.renderTargetMetrics(res.data);
      }
    } catch (e) {
      console.error('Target preview error:', e);
    }
  },

  renderTargetMetrics(data) {
    const bmrEl = document.getElementById('metricBMR');
    const tdeeEl = document.getElementById('metricTDEE');
    const bmiEl = document.getElementById('metricBMI');
    const bmiCatEl = document.getElementById('metricBMICat');
    const targetCalsEl = document.getElementById('metricTargetCals');

    const targetPEl = document.getElementById('metricTargetProtein');
    const targetCEl = document.getElementById('metricTargetCarbs');
    const targetFEl = document.getElementById('metricTargetFat');
    const targetFibEl = document.getElementById('metricTargetFiber');
    const targetWEl = document.getElementById('metricTargetWater');

    if (bmrEl) bmrEl.textContent = `${data.metabolic_metrics.bmr_kcal} kcal`;
    if (tdeeEl) tdeeEl.textContent = `${data.metabolic_metrics.tdee_kcal} kcal`;
    if (bmiEl) bmiEl.textContent = data.client_profile.bmi;
    if (bmiCatEl) bmiCatEl.textContent = data.client_profile.bmi_category;
    if (targetCalsEl) targetCalsEl.textContent = `${data.daily_targets.calories_kcal} kcal / day`;

    const dt = data.daily_targets;
    if (targetPEl) targetPEl.textContent = `${dt.protein_g}g (${data.macro_ratio_pct.protein_pct}%)`;
    if (targetCEl) targetCEl.textContent = `${dt.carbs_g}g (${data.macro_ratio_pct.carbs_pct}%)`;
    if (targetFEl) targetFEl.textContent = `${dt.fat_g}g (${data.macro_ratio_pct.fat_pct}%)`;
    if (targetFibEl) targetFibEl.textContent = `${dt.fiber_g}g`;
    if (targetWEl) targetWEl.textContent = `${dt.water_liters} L`;
  },

  async saveProfileFromForm() {
    const payload = {
      age: parseInt(document.getElementById('profileAge')?.value || 25),
      gender: document.getElementById('profileGender')?.value || 'male',
      height_cm: parseFloat(document.getElementById('profileHeight')?.value || 175),
      current_weight_kg: parseFloat(document.getElementById('profileWeight')?.value || 75),
      target_weight_kg: parseFloat(document.getElementById('profileTargetWeight')?.value || 72),
      activity_level: document.getElementById('profileActivity')?.value || 'moderate',
      goal: document.getElementById('profileGoal')?.value || 'lean_hypertrophy',
      dietary_preference: document.getElementById('profileDietPref')?.value || 'all'
    };

    try {
      const res = await apiRequest('calculate-targets', 'POST', payload);
      if (res && res.data) {
        AppState.clientProfile = res.data.client_profile;
        AppState.dailyTargets = res.data.daily_targets;

        localStorage.setItem('thaaltatva_client_profile', JSON.stringify(AppState.clientProfile));
        localStorage.setItem('thaaltatva_daily_targets', JSON.stringify(AppState.dailyTargets));

        this.updateHeaderBadge();
        playAudioFx('celebrate');
        triggerCelebration();
        showToast('Client Profile & Pancha-Tatva Targets Recalculated!', 'success');
        setTimeout(() => switchTab('dashboard'), 600);
      }
    } catch (e) {
      showToast('Failed to update profile', 'error');
    }
  },

  async syncProfileTargets() {
    try {
      const res = await apiRequest('calculate-targets', 'POST', AppState.clientProfile);
      if (res && res.data) {
        AppState.dailyTargets = res.data.daily_targets;
        this.updateHeaderBadge();
      }
    } catch (e) {}
  },

  updateHeaderBadge() {
    const badge = document.getElementById('headerClientGoalText');
    if (badge) {
      const p = AppState.clientProfile;
      const goalFormatted = p.goal.replace(/_/g, ' ').toUpperCase();
      badge.textContent = `${p.current_weight_kg}kg • ${goalFormatted} (${AppState.dailyTargets.calories_kcal} kcal)`;
    }
  }
};
