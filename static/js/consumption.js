/**
 * NutriVision AI - Pre vs Post Plate Leftover Consumption Comparator
 */

const ConsumptionModule = {
  selectedPreImage: '/static/images/presets/indian_thali_pre.jpg',
  selectedPostImage: '/static/images/presets/indian_thali_post.jpg',

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const compareBtn = document.getElementById('runComparisonBtn');
    const logMealBtn = document.getElementById('logConsumedMealBtn');
    const preSelector = document.getElementById('preMealPresetSelect');
    const postSelector = document.getElementById('postMealPresetSelect');

    if (compareBtn) {
      compareBtn.addEventListener('click', () => this.runComparison());
    }

    if (logMealBtn) {
      logMealBtn.addEventListener('click', () => this.logConsumedMealToDiary());
    }

    if (preSelector) {
      preSelector.addEventListener('change', (e) => {
        this.selectedPreImage = e.target.value;
        const img = document.getElementById('preMealViewImg');
        if (img) img.src = this.selectedPreImage;
      });
    }

    if (postSelector) {
      postSelector.addEventListener('change', (e) => {
        this.selectedPostImage = e.target.value;
        const img = document.getElementById('postMealViewImg');
        if (img) img.src = this.selectedPostImage;
      });
    }

    // Auto run comparison on load
    setTimeout(() => this.runComparison(), 600);
  },

  async runComparison() {
    try {
      const payload = {
        pre_image: this.selectedPreImage,
        post_image: this.selectedPostImage,
        api_key: AppState.apiKey || null
      };

      const res = await apiRequest('compare-plates', 'POST', payload);
      if (res && res.data) {
        AppState.comparisonResult = res.data;
        this.renderComparisonUI(res.data);
        showToast(`Leftover analysis complete: ${res.data.overall_consumed_pct}% consumed`, 'success');
      }
    } catch (e) {
      showToast('Plate comparison failed. Check images and try again.', 'error');
    }
  },

  renderComparisonUI(data) {
    // Stat meters
    const consumedPctEl = document.getElementById('consumedPctStat');
    const leftoverPctEl = document.getElementById('leftoverPctStat');
    const consumedCalsEl = document.getElementById('consumedCalsStat');
    const initialCalsEl = document.getElementById('initialCalsStat');
    const savedCalsEl = document.getElementById('savedCalsStat');

    if (consumedPctEl) consumedPctEl.textContent = `${data.overall_consumed_pct}%`;
    if (leftoverPctEl) leftoverPctEl.textContent = `${data.overall_leftover_pct}%`;
    if (consumedCalsEl) consumedCalsEl.textContent = `${Math.round(data.consumed_totals.calories)} kcal`;
    if (initialCalsEl) initialCalsEl.textContent = `${Math.round(data.initial_totals.calories)} kcal`;
    if (savedCalsEl) savedCalsEl.textContent = `${Math.round(data.leftover_totals.calories_saved)} kcal`;

    // Consumed Macros
    const elP = document.getElementById('consumedProteinStat');
    const elC = document.getElementById('consumedCarbsStat');
    const elF = document.getElementById('consumedFatStat');
    const elFib = document.getElementById('consumedFiberStat');

    if (elP) elP.textContent = `${data.consumed_totals.protein_g}g`;
    if (elC) elC.textContent = `${data.consumed_totals.carbs_g}g`;
    if (elF) elF.textContent = `${data.consumed_totals.fat_g}g`;
    if (elFib) elFib.textContent = `${data.consumed_totals.fiber_g}g`;

    // Delta Table
    const tableBody = document.getElementById('consumedDeltaTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    data.item_breakdown.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong style="color: #fff;">${item.name}</strong>
          <div class="delta-bar-bg">
            <div class="delta-bar-fill" style="width: ${item.consumed_pct}%;"></div>
          </div>
        </td>
        <td>${item.pre_grams}g</td>
        <td style="color: #f59e0b;">${item.post_grams}g (${item.leftover_pct}%)</td>
        <td style="color: #10b981; font-weight: 700;">${item.consumed_grams}g (${item.consumed_pct}%)</td>
        <td style="color: #38bdf8; font-weight: 600;">${item.consumed_calories} kcal</td>
        <td>${item.consumed_protein_g}g P • ${item.consumed_carbs_g}g C • ${item.consumed_fat_g}g F</td>
      `;
      tableBody.appendChild(tr);
    });
  },

  logConsumedMealToDiary() {
    const comp = AppState.comparisonResult;
    if (!comp) {
      showToast('No comparison data available to log', 'warning');
      return;
    }

    const mealTypeSelect = document.getElementById('logMealTypeSelect');
    const mealType = mealTypeSelect ? mealTypeSelect.value : 'Lunch';

    const mealRecord = {
      id: `meal_${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: mealType,
      title: `${comp.meal_name} (${comp.overall_consumed_pct}% Eaten)`,
      calories: comp.consumed_totals.calories,
      protein_g: comp.consumed_totals.protein_g,
      carbs_g: comp.consumed_totals.carbs_g,
      fat_g: comp.consumed_totals.fat_g,
      fiber_g: comp.consumed_totals.fiber_g,
      sodium_mg: comp.consumed_totals.sodium_mg,
      items: comp.item_breakdown.map(it => `${it.name}: ${it.consumed_grams}g (${it.consumed_pct}%)`)
    };

    // Update AppState consumed totals
    AppState.dailyConsumed.calories += mealRecord.calories;
    AppState.dailyConsumed.protein_g += mealRecord.protein_g;
    AppState.dailyConsumed.carbs_g += mealRecord.carbs_g;
    AppState.dailyConsumed.fat_g += mealRecord.fat_g;
    AppState.dailyConsumed.fiber_g += mealRecord.fiber_g;
    AppState.dailyConsumed.sodium_mg += mealRecord.sodium_mg;
    AppState.dailyConsumed.meals.unshift(mealRecord);

    saveConsumedState();
    showToast(`Logged ${Math.round(mealRecord.calories)} kcal to today's ${mealType}!`, 'success');
    switchTab('dashboard');
  }
};
