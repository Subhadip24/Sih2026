/**
 * ThaalTatva AI - Panch-Tatva Macro Budget, FitForge Activity Tracker & Manual Food Intake Logger
 */

const FOODS_CATALOGUE = {
  "grilled_chicken_breast": { name: "Grilled Chicken Breast", icon: "🍗", cal_100g: 165, p_100g: 31.0, c_100g: 0.0, f_100g: 3.6, fib_100g: 0.0 },
  "steamed_basmati_rice": { name: "Steamed White Basmati Rice", icon: "🍚", cal_100g: 130, p_100g: 2.7, c_100g: 28.2, f_100g: 0.3, fib_100g: 0.4 },
  "brown_rice": { name: "Steamed Brown Rice", icon: "🌾", cal_100g: 111, p_100g: 2.6, c_100g: 23.0, f_100g: 0.9, fib_100g: 1.8 },
  "paneer_tikka": { name: "Paneer Tikka / Paneer Gravy", icon: "🧀", cal_100g: 265, p_100g: 18.2, c_100g: 6.5, f_100g: 19.1, fib_100g: 1.2 },
  "yellow_dal": { name: "Yellow Moong Dal Tadka", icon: "🥣", cal_100g: 116, p_100g: 7.3, c_100g: 16.8, f_100g: 2.4, fib_100g: 4.8 },
  "whole_wheat_roti": { name: "Whole Wheat Roti / Chapati", icon: "🫓", cal_100g: 240, p_100g: 8.1, c_100g: 48.0, f_100g: 2.2, fib_100g: 4.0 },
  "boiled_egg": { name: "Boiled Whole Eggs", icon: "🥚", cal_100g: 155, p_100g: 13.0, c_100g: 1.1, f_100g: 11.0, fib_100g: 0.0 },
  "egg_white": { name: "Egg Whites (Cooked)", icon: "🍳", cal_100g: 52, p_100g: 11.0, c_100g: 0.7, f_100g: 0.2, fib_100g: 0.0 },
  "whey_protein_shake": { name: "Whey Protein Isolate (1 Scoop in Water)", icon: "🥤", cal_100g: 375, p_100g: 80.0, c_100g: 6.0, f_100g: 3.5, fib_100g: 1.0 },
  "grilled_salmon": { name: "Pan-Seared Salmon Fillet", icon: "🐟", cal_100g: 208, p_100g: 22.0, c_100g: 0.0, f_100g: 13.0, fib_100g: 0.0 },
  "tofu_grilled": { name: "Firm Tofu (Grilled / Stir-Fried)", icon: "🧊", cal_100g: 144, p_100g: 17.3, c_100g: 2.8, f_100g: 8.7, fib_100g: 2.3 },
  "rolled_oats_cooked": { name: "High-Protein Rolled Oats", icon: "🥣", cal_100g: 71, p_100g: 2.5, c_100g: 12.0, f_100g: 1.5, fib_100g: 1.7 },
  "greek_yogurt": { name: "Non-Fat Plain Greek Yogurt", icon: "🥛", cal_100g: 97, p_100g: 10.0, c_100g: 3.6, f_100g: 5.0, fib_100g: 0.0 },
  "peanut_butter": { name: "Natural Roasted Peanut Butter", icon: "🥜", cal_100g: 588, p_100g: 25.0, c_100g: 20.0, f_100g: 50.0, fib_100g: 6.0 },
  "avocado_slices": { name: "Fresh Avocado", icon: "🥑", cal_100g: 160, p_100g: 2.0, c_100g: 8.5, f_100g: 14.7, fib_100g: 6.7 },
  "almonds_sliced": { name: "Raw California Almonds", icon: "🌰", cal_100g: 579, p_100g: 21.2, c_100g: 21.6, f_100g: 49.9, fib_100g: 12.5 },
  "chana_masala": { name: "Chana Masala (Chickpeas)", icon: "🍲", cal_100g: 138, p_100g: 6.8, c_100g: 18.4, f_100g: 4.5, fib_100g: 5.2 },
  "chicken_biryani": { name: "Chicken Dum Biryani", icon: "🍗", cal_100g: 185, p_100g: 11.5, c_100g: 21.0, f_100g: 6.2, fib_100g: 1.5 },
  "steamed_broccoli": { name: "Steamed Green Broccoli", icon: "🥦", cal_100g: 34, p_100g: 2.8, c_100g: 6.6, f_100g: 0.4, fib_100g: 2.6 },
  "cucumber_salad": { name: "Cucumber Kachumber Salad", icon: "🥗", cal_100g: 22, p_100g: 0.9, c_100g: 4.2, f_100g: 0.3, fib_100g: 1.0 },
  "sweet_potato": { name: "Steamed Sweet Potato", icon: "🍠", cal_100g: 86, p_100g: 1.6, c_100g: 20.1, f_100g: 0.1, fib_100g: 3.0 }
};

const DashboardModule = {
  currentPortionWeight: 150,
  currentMacroRatio: { p: 40, c: 40, f: 20 },
  activeRatioPreset: 'high_protein',
  batchItemsList: [],

  init() {
    this.bindEvents();
    this.initManualLogger();
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

    // Open/Close Manual Intake Modal
    const openManualLogBtns = document.querySelectorAll('.open-manual-log-btn');
    openManualLogBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openManualLogModal();
      });
    });

    const closeManualLogBtn = document.getElementById('closeManualLogModalBtn');
    if (closeManualLogBtn) {
      closeManualLogBtn.addEventListener('click', () => {
        this.closeManualLogModal();
      });
    }

    const manualLogBackdrop = document.getElementById('manualLogModal');
    if (manualLogBackdrop) {
      manualLogBackdrop.addEventListener('click', (e) => {
        if (e.target === manualLogBackdrop) this.closeManualLogModal();
      });
    }

    // Calendar day selector buttons
    const dayPills = document.querySelectorAll('.calendar-day-pill');
    dayPills.forEach(pill => {
      pill.addEventListener('click', () => {
        playAudioFx('toggle');
        dayPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const dayName = pill.dataset.day || 'Today';
        showToast(`Viewing Intake for ${dayName}`, 'info');
      });
    });
  },

  initManualLogger() {
    // Food Select Dropdown
    const foodSelect = document.getElementById('manualFoodSelect');
    if (foodSelect) {
      foodSelect.addEventListener('change', (e) => {
        playAudioFx('click');
        this.onFoodSelect(e.target.value);
      });
    }

    // Portion Weight Slider & Number Input
    const weightSlider = document.getElementById('manualWeightSlider');
    const weightInput = document.getElementById('manualWeightInput');
    if (weightSlider && weightInput) {
      weightSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 100;
        weightInput.value = val;
        this.currentPortionWeight = val;
        this.recalculateManualItem();
      });

      weightInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 100;
        weightSlider.value = val;
        this.currentPortionWeight = val;
        this.recalculateManualItem();
      });
    }

    // Quick weight chips
    const weightChips = document.querySelectorAll('.weight-chip-btn');
    weightChips.forEach(chip => {
      chip.addEventListener('click', () => {
        playAudioFx('toggle');
        weightChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const grams = parseFloat(chip.dataset.weight);
        if (weightSlider) weightSlider.value = grams;
        if (weightInput) weightInput.value = grams;
        this.currentPortionWeight = grams;
        this.recalculateManualItem();
      });
    });

    // Macro Ratio Preset Buttons
    const ratioPresets = document.querySelectorAll('.ratio-preset-btn');
    ratioPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        playAudioFx('click');
        ratioPresets.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeRatioPreset = btn.dataset.preset;
        this.applyRatioPreset(btn.dataset.preset);
      });
    });

    // Ratio Sliders
    ['ratioProteinSlider', 'ratioCarbsSlider', 'ratioFatSlider'].forEach(id => {
      const slider = document.getElementById(id);
      if (slider) {
        slider.addEventListener('input', () => {
          this.onManualRatioSliderInput();
        });
      }
    });

    // Add To Batch Button
    const addToBatchBtn = document.getElementById('addManualItemToBatchBtn');
    if (addToBatchBtn) {
      addToBatchBtn.addEventListener('click', () => {
        this.addItemToBatch();
      });
    }

    // Commit & Log Final Meals Button
    const commitIntakeBtn = document.getElementById('commitManualIntakeBtn');
    if (commitIntakeBtn) {
      commitIntakeBtn.addEventListener('click', () => {
        this.commitBatchToDiary();
      });
    }

    // Initialize with first food item
    this.onFoodSelect('grilled_chicken_breast');
  },

  openManualLogModal() {
    playAudioFx('shutter');
    const modal = document.getElementById('manualLogModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeManualLogModal() {
    playAudioFx('click');
    const modal = document.getElementById('manualLogModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  onFoodSelect(key) {
    const customGroup = document.getElementById('customFoodNameGroup');
    const customInput = document.getElementById('customFoodNameInput');

    if (key === 'custom') {
      if (customGroup) customGroup.style.display = 'block';
      this.selectedFoodData = {
        name: customInput?.value || 'Custom Prepared Meal',
        icon: '🍲',
        cal_100g: 180,
        p_100g: 15.0,
        c_100g: 18.0,
        f_100g: 5.0,
        fib_100g: 2.0
      };
    } else {
      if (customGroup) customGroup.style.display = 'none';
      const item = FOODS_CATALOGUE[key] || FOODS_CATALOGUE['grilled_chicken_breast'];
      this.selectedFoodData = { ...item };
    }

    this.recalculateManualItem();
  },

  applyRatioPreset(preset) {
    if (preset === 'high_protein') {
      this.currentMacroRatio = { p: 40, c: 40, f: 20 };
    } else if (preset === 'balanced') {
      this.currentMacroRatio = { p: 30, c: 50, f: 20 };
    } else if (preset === 'keto') {
      this.currentMacroRatio = { p: 25, c: 5, f: 70 };
    } else if (preset === 'shred') {
      this.currentMacroRatio = { p: 50, c: 30, f: 20 };
    }

    this.updateRatioSliderUI();
    this.recalculateManualItem();
  },

  updateRatioSliderUI() {
    const pEl = document.getElementById('ratioProteinSlider');
    const cEl = document.getElementById('ratioCarbsSlider');
    const fEl = document.getElementById('ratioFatSlider');
    const pVal = document.getElementById('ratioProteinVal');
    const cVal = document.getElementById('ratioCarbsVal');
    const fVal = document.getElementById('ratioFatVal');

    if (pEl) pEl.value = this.currentMacroRatio.p;
    if (cEl) cEl.value = this.currentMacroRatio.c;
    if (fEl) fEl.value = this.currentMacroRatio.f;

    if (pVal) pVal.textContent = `${this.currentMacroRatio.p}%`;
    if (cVal) cVal.textContent = `${this.currentMacroRatio.c}%`;
    if (fVal) fVal.textContent = `${this.currentMacroRatio.f}%`;
  },

  onManualRatioSliderInput() {
    const p = parseInt(document.getElementById('ratioProteinSlider')?.value || 40);
    const c = parseInt(document.getElementById('ratioCarbsSlider')?.value || 40);
    const f = parseInt(document.getElementById('ratioFatSlider')?.value || 20);

    const total = p + c + f;
    this.currentMacroRatio = { p, c, f };

    const pVal = document.getElementById('ratioProteinVal');
    const cVal = document.getElementById('ratioCarbsVal');
    const fVal = document.getElementById('ratioFatVal');
    if (pVal) pVal.textContent = `${p}%`;
    if (cVal) cVal.textContent = `${c}%`;
    if (fVal) fVal.textContent = `${f}%`;

    const totalEl = document.getElementById('ratioSumLabel');
    if (totalEl) {
      totalEl.textContent = `Total: ${total}% ${total === 100 ? '✓' : '(Should equal 100%)'}`;
      totalEl.style.color = total === 100 ? 'var(--tatva-emerald-bright)' : 'var(--tatva-gold)';
    }

    this.recalculateManualItem();
  },

  recalculateManualItem() {
    if (!this.selectedFoodData) return;

    const grams = this.currentPortionWeight || 150;
    const factor = grams / 100.0;

    let cals, p_g, c_g, f_g, fib_g;

    // If using custom macro ratio adjustment or custom food
    if (this.activeRatioPreset !== 'standard_db' && this.selectedFoodKey === 'custom') {
      // Calculate from total baseline calories distributed by ratio
      cals = Math.round(this.selectedFoodData.cal_100g * factor);
      p_g = Math.round(((cals * (this.currentMacroRatio.p / 100.0)) / 4.0) * 10) / 10;
      c_g = Math.round(((cals * (this.currentMacroRatio.c / 100.0)) / 4.0) * 10) / 10;
      f_g = Math.round(((cals * (this.currentMacroRatio.f / 100.0)) / 9.0) * 10) / 10;
      fib_g = Math.round((this.selectedFoodData.fib_100g * factor) * 10) / 10;
    } else {
      // Direct proportion from food DB
      cals = Math.round(this.selectedFoodData.cal_100g * factor);
      p_g = Math.round((this.selectedFoodData.p_100g * factor) * 10) / 10;
      c_g = Math.round((this.selectedFoodData.c_100g * factor) * 10) / 10;
      f_g = Math.round((this.selectedFoodData.f_100g * factor) * 10) / 10;
      fib_g = Math.round((this.selectedFoodData.fib_100g * factor) * 10) / 10;

      // Update the macro ratio preview to match the food's natural ratio
      const calFromP = p_g * 4;
      const calFromC = c_g * 4;
      const calFromF = f_g * 9;
      const totalNutrientCals = Math.max(1, calFromP + calFromC + calFromF);

      this.currentMacroRatio = {
        p: Math.round((calFromP / totalNutrientCals) * 100),
        c: Math.round((calFromC / totalNutrientCals) * 100),
        f: Math.round((calFromF / totalNutrientCals) * 100)
      };
      this.updateRatioSliderUI();
    }

    this.currentCalculatedItem = {
      name: this.selectedFoodData.name,
      icon: this.selectedFoodData.icon || '🥗',
      weight_g: grams,
      calories: cals,
      protein_g: p_g,
      carbs_g: c_g,
      fat_g: f_g,
      fiber_g: fib_g,
      ratio_p: this.currentMacroRatio.p,
      ratio_c: this.currentMacroRatio.c,
      ratio_f: this.currentMacroRatio.f
    };

    // Render Preview Box
    const previewCals = document.getElementById('manualPreviewCals');
    const previewP = document.getElementById('manualPreviewP');
    const previewC = document.getElementById('manualPreviewC');
    const previewF = document.getElementById('manualPreviewF');
    const previewFib = document.getElementById('manualPreviewFib');
    const previewRatioTag = document.getElementById('manualPreviewRatioTag');

    if (previewCals) previewCals.textContent = `${cals} kcal`;
    if (previewP) previewP.textContent = `${p_g}g`;
    if (previewC) previewC.textContent = `${c_g}g`;
    if (previewF) previewF.textContent = `${f_g}g`;
    if (previewFib) previewFib.textContent = `${fib_g}g`;
    if (previewRatioTag) previewRatioTag.textContent = `${this.currentMacroRatio.p}% P • ${this.currentMacroRatio.c}% C • ${this.currentMacroRatio.f}% F`;
  },

  addItemToBatch() {
    if (!this.currentCalculatedItem) return;
    playAudioFx('click');

    const mealCategory = document.getElementById('manualMealCategorySelect')?.value || 'Lunch';
    const itemToBatch = {
      ...this.currentCalculatedItem,
      category: mealCategory,
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
    };

    this.batchItemsList.push(itemToBatch);
    this.renderBatchItemsList();
    showToast(`Added ${itemToBatch.name} (${itemToBatch.weight_g}g) to batch!`, 'info');
  },

  renderBatchItemsList() {
    const listContainer = document.getElementById('manualBatchItemsList');
    const commitBtn = document.getElementById('commitManualIntakeBtn');

    if (!listContainer) return;

    if (this.batchItemsList.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 12px;">
          No food items added to current batch yet. Add item above or log directly.
        </div>
      `;
      if (commitBtn) commitBtn.textContent = '⚡ Log Single Item Directly';
      return;
    }

    if (commitBtn) commitBtn.textContent = `⚡ Log All ${this.batchItemsList.length} Items to Today's Intake`;

    listContainer.innerHTML = this.batchItemsList.map((item, idx) => `
      <div class="batch-item-row" style="display: flex; justify-content: space-between; align-items: center; background: rgba(14,24,52,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 14px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">${item.icon}</span>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 13.5px;">${item.name} <span class="tab-tag" style="font-size: 10px; margin-left: 6px;">${item.weight_g}g</span></div>
            <div style="font-size: 11px; color: var(--tatva-cyan-bright); font-family: var(--font-mono); margin-top: 2px;">
              ${item.category} • ${item.calories} kcal • P:${item.protein_g}g C:${item.carbs_g}g F:${item.fat_g}g (${item.ratio_p}/${item.ratio_c}/${item.ratio_f})
            </div>
          </div>
        </div>
        <button class="btn-icon" style="width: 28px; height: 28px; font-size: 12px;" onclick="DashboardModule.removeBatchItem(${idx})">✕</button>
      </div>
    `).join('');
  },

  removeBatchItem(index) {
    playAudioFx('click');
    this.batchItemsList.splice(index, 1);
    this.renderBatchItemsList();
  },

  commitBatchToDiary() {
    playAudioFx('celebrate');
    triggerCelebration();

    // If batch list is empty, commit current single calculated item
    const itemsToCommit = this.batchItemsList.length > 0 ? [...this.batchItemsList] : [{
      ...this.currentCalculatedItem,
      category: document.getElementById('manualMealCategorySelect')?.value || 'Lunch'
    }];

    itemsToCommit.forEach(item => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add to meals array
      AppState.dailyConsumed.meals.push({
        title: item.name,
        type: item.category,
        weight_g: item.weight_g,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        fiber_g: item.fiber_g,
        ratio_str: `${item.ratio_p}% P • ${item.ratio_c}% C • ${item.ratio_f}% F`,
        time: timeStr,
        items: [`Portion: ${item.weight_g}g`, `Ratio: ${item.ratio_p}%P/${item.ratio_c}%C/${item.ratio_f}%F`]
      });

      // Sum totals
      AppState.dailyConsumed.calories = Math.round((AppState.dailyConsumed.calories + item.calories) * 10) / 10;
      AppState.dailyConsumed.protein_g = Math.round((AppState.dailyConsumed.protein_g + item.protein_g) * 10) / 10;
      AppState.dailyConsumed.carbs_g = Math.round((AppState.dailyConsumed.carbs_g + item.carbs_g) * 10) / 10;
      AppState.dailyConsumed.fat_g = Math.round((AppState.dailyConsumed.fat_g + item.fat_g) * 10) / 10;
      AppState.dailyConsumed.fiber_g = Math.round((AppState.dailyConsumed.fiber_g + (item.fiber_g || 0)) * 10) / 10;
    });

    saveConsumedState();
    this.batchItemsList = [];
    this.renderBatchItemsList();
    this.renderDashboard();
    this.closeManualLogModal();

    showToast(`✓ Logged ${itemsToCommit.length} meal item(s) to Today's Intake!`, 'success');
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

    // FitForge Activity Overview Telemetry
    const overviewCals = document.getElementById('overviewConsumedCals');
    const overviewCalsTarget = document.getElementById('overviewTargetCals');
    const overviewDeficit = document.getElementById('overviewNetDeficit');
    const overviewDeficitSub = document.getElementById('overviewDeficitStatus');
    const overviewPctRing = document.getElementById('overviewDailyPctText');

    const pct = Math.min(100, Math.round((consumed.calories / (targets.calories_kcal || 1)) * 100));
    if (overviewCals) overviewCals.textContent = `${Math.round(consumed.calories)}`;
    if (overviewCalsTarget) overviewCalsTarget.textContent = `/ ${targets.calories_kcal} kcal`;
    if (overviewPctRing) overviewPctRing.textContent = `${pct}%`;

    const netBalance = Math.round(targets.calories_kcal - consumed.calories);
    if (overviewDeficit) overviewDeficit.textContent = `${netBalance >= 0 ? '-' : '+'}${Math.abs(netBalance)} kcal`;
    if (overviewDeficitSub) {
      overviewDeficitSub.textContent = netBalance >= 0 ? 'Fat Oxidation Deficit Active' : 'Caloric Surplus (Hypertrophy)';
      overviewDeficitSub.style.color = netBalance >= 0 ? 'var(--tatva-emerald-bright)' : 'var(--tatva-gold)';
    }

    // Header Status Ticker Update
    const headerStatus = document.getElementById('headerLiveStatus');
    if (headerStatus) {
      headerStatus.textContent = `${pct}% of Daily Intake Logged • ${Math.round(consumed.calories)}/${targets.calories_kcal} kcal • ${Math.round(consumed.protein_g)}g Protein`;
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
        <div style="text-align: center; padding: 42px 20px; color: var(--text-muted);">
          <div style="font-size: 42px; margin-bottom: 12px;">🍽️</div>
          <h4 style="font-weight: 700; color: #fff; font-size: 16px;">No Meals Logged Yet Today</h4>
          <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px; max-width: 440px; margin-left: auto; margin-right: auto;">
            Click <strong>"+ Log Manual Food Intake"</strong> above to add foods with custom grams and macro ratios, or scan a plate using the Plate Scanner.
          </p>
          <button class="btn-primary-glow open-manual-log-btn" style="margin: 18px auto 0; padding: 8px 20px; font-size: 12.5px;">
            <span>+</span> Add Your First Food Item
          </button>
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
      if (m.type === 'Pre/Post Workout' || m.type === 'Workout Fuel') icon = '⚡';
      if (m.isExercise) icon = '🔥';

      const weightBadge = m.weight_g ? `<span class="meal-weight-chip">⚖️ ${m.weight_g}g</span>` : '';
      const ratioBadge = m.ratio_str ? `<span class="meal-ratio-chip">📊 ${m.ratio_str}</span>` : '';

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
          <div class="meal-avatar-icon">${icon}</div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="meal-category-tag">${m.type}</span>
              <strong style="font-weight: 700; color: #fff; font-size: 15px;">${m.title}</strong>
              ${weightBadge}
              ${ratioBadge}
            </div>

            <div class="meal-macro-badges-row" style="display: flex; gap: 8px; font-size: 11.5px; margin-top: 6px; flex-wrap: wrap;">
              <span class="macro-badge-item cals">🔥 ${Math.round(m.calories)} kcal</span>
              <span class="macro-badge-item protein">🥩 ${m.protein_g}g Protein</span>
              <span class="macro-badge-item carbs">🌾 ${m.carbs_g}g Carbs</span>
              <span class="macro-badge-item fat">🥑 ${m.fat_g}g Fat</span>
              ${m.fiber_g ? `<span class="macro-badge-item fiber">🌿 ${m.fiber_g}g Fiber</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 11.5px; color: var(--text-muted); font-family: var(--font-mono);">${m.time || ''}</span>
          <button class="btn-icon" style="width: 32px; height: 32px; font-size: 13px;" title="Remove Entry" onclick="DashboardModule.removeMeal(${idx})">✕</button>
        </div>
      `;
      container.appendChild(item);
    });
  },

  removeMeal(index) {
    playAudioFx('click');
    const removed = AppState.dailyConsumed.meals.splice(index, 1)[0];
    if (removed) {
      AppState.dailyConsumed.calories = Math.max(0, Math.round((AppState.dailyConsumed.calories - removed.calories) * 10) / 10);
      AppState.dailyConsumed.protein_g = Math.max(0, Math.round((AppState.dailyConsumed.protein_g - removed.protein_g) * 10) / 10);
      AppState.dailyConsumed.carbs_g = Math.max(0, Math.round((AppState.dailyConsumed.carbs_g - removed.carbs_g) * 10) / 10);
      AppState.dailyConsumed.fat_g = Math.max(0, Math.round((AppState.dailyConsumed.fat_g - removed.fat_g) * 10) / 10);
      AppState.dailyConsumed.fiber_g = Math.max(0, Math.round((AppState.dailyConsumed.fiber_g - (removed.fiber_g || 0)) * 10) / 10);
      saveConsumedState();
      this.renderDashboard();
      showToast('Meal entry removed', 'info');
    }
  },

  resetDailyDiary() {
    if (confirm("Reset today's logged nutrition entries?")) {
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
