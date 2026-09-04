/**
 * ThaalTatva AI - Fitness, Gym & Aesthetic Shred Protocol Engine
 * Science-backed fuel oxidation mechanics (Carbs vs Fats vs EPOC),
 * Aesthetic proportion blueprints, and interactive exercise burn simulator.
 */

const FitnessHubModule = {
  init() {
    this.bindEvents();
    this.calculateFuelBurn();
  },

  bindEvents() {
    // Activity Select
    const actSelect = document.getElementById('burnActivitySelect');
    if (actSelect) {
      actSelect.addEventListener('change', () => {
        playAudioFx('click');
        this.calculateFuelBurn();
      });
    }

    // Duration slider
    const durSlider = document.getElementById('burnDurationSlider');
    const durVal = document.getElementById('burnDurationVal');
    if (durSlider && durVal) {
      durSlider.addEventListener('input', (e) => {
        durVal.textContent = `${e.target.value} mins`;
        this.calculateFuelBurn();
      });
    }

    // Intensity selector pills
    const intensityBtns = document.querySelectorAll('.intensity-pill-btn');
    intensityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playAudioFx('toggle');
        intensityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.calculateFuelBurn();
      });
    });

    // Workout routine tab selector
    const routineTabs = document.querySelectorAll('.routine-tab-btn');
    routineTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        playAudioFx('click');
        routineTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const routineId = btn.dataset.routine;
        this.switchRoutineView(routineId);
      });
    });

    // Log workout burn to today's diary
    const logBurnBtn = document.getElementById('logWorkoutBurnToDiaryBtn');
    if (logBurnBtn) {
      logBurnBtn.addEventListener('click', () => {
        this.logWorkoutToDailyBudget();
      });
    }
  },

  getActiveIntensity() {
    const active = document.querySelector('.intensity-pill-btn.active');
    return active ? active.dataset.intensity : 'moderate';
  },

  async calculateFuelBurn() {
    const activity = document.getElementById('burnActivitySelect')?.value || 'hypertrophy_weightlifting';
    const duration = parseFloat(document.getElementById('burnDurationSlider')?.value || 45);
    const intensity = this.getActiveIntensity();
    const weight = AppState.clientProfile?.current_weight_kg || 75.0;

    const payload = {
      activity,
      duration_min: duration,
      weight_kg: weight,
      intensity
    };

    try {
      const res = await apiRequest('fitness/burn-calculator', 'POST', payload);
      if (res && res.data) {
        this.renderBurnTelemetry(res.data);
      }
    } catch (e) {
      console.error('Burn calculation error:', e);
    }
  },

  renderBurnTelemetry(data) {
    this.latestBurnData = data;

    const totalCalsEl = document.getElementById('burnTotalCals');
    const fatGramsEl = document.getElementById('burnFatGrams');
    const carbsGramsEl = document.getElementById('burnCarbsGrams');
    const epocEl = document.getElementById('burnEpocBonus');
    const fuelSourceEl = document.getElementById('burnPrimaryFuelSource');
    const fatBarEl = document.getElementById('burnFatRatioBar');
    const carbBarEl = document.getElementById('burnCarbRatioBar');
    const fatPctEl = document.getElementById('burnFatRatioPct');
    const carbPctEl = document.getElementById('burnCarbRatioPct');
    const stepsEl = document.getElementById('burnEquivalentSteps');

    if (totalCalsEl) totalCalsEl.textContent = `${Math.round(data.total_calories_kcal)} kcal`;
    if (fatGramsEl) fatGramsEl.textContent = `${data.fat_oxidized_grams}g`;
    if (carbsGramsEl) carbsGramsEl.textContent = `${data.carbs_burned_grams}g`;
    if (epocEl) epocEl.textContent = `+${Math.round(data.epoc_afterburn_kcal)} kcal EPOC`;
    if (fuelSourceEl) fuelSourceEl.textContent = data.primary_fuel_source;

    if (fatBarEl) fatBarEl.style.width = `${data.fat_ratio_pct}%`;
    if (carbBarEl) carbBarEl.style.width = `${data.carb_ratio_pct}%`;
    if (fatPctEl) fatPctEl.textContent = `Fats: ${data.fat_ratio_pct}%`;
    if (carbPctEl) carbPctEl.textContent = `Carbs: ${data.carb_ratio_pct}%`;

    if (stepsEl) stepsEl.textContent = `~${data.approx_equivalent_steps.toLocaleString()} steps`;
  },

  switchRoutineView(routineId) {
    document.querySelectorAll('.workout-routine-card').forEach(card => {
      card.classList.toggle('active', card.id === `routine_${routineId}`);
    });
  },

  logWorkoutToDailyBudget() {
    if (!this.latestBurnData) return;
    playAudioFx('celebrate');
    triggerCelebration();

    const burned = Math.round(this.latestBurnData.total_calories_kcal);
    const actName = this.latestBurnData.activity_name;

    // Credit calories into daily tracker as a negative consumption meal or activity burn
    AppState.dailyConsumed.meals.push({
      name: `🔥 Workout: ${actName}`,
      calories: -burned,
      protein: 0,
      carbs: 0,
      fat: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isExercise: true
    });

    // Reduce consumed or increase remaining
    AppState.dailyConsumed.calories = Math.max(0, AppState.dailyConsumed.calories - burned);

    if (typeof DashboardModule !== 'undefined' && DashboardModule.renderDashboard) {
      DashboardModule.renderDashboard();
    }

    showToast(`Logged ${burned} kcal exercise burn to your daily budget!`, 'success');
  }
};
