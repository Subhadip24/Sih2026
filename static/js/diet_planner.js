/**
 * ThaalTatva AI - AI Dietitian, Adaptive Meal Recommender & 7-Day Matrix Generator
 */

const DietPlannerModule = {
  current7DayPlan: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const refreshRecsBtn = document.getElementById('refreshNextMealBtn');
    const genPlanBtn = document.getElementById('generate7DayPlanBtn');
    const printReportBtn = document.getElementById('printDietitianReportBtn');
    const dietTypeSelect = document.getElementById('plannerDietTypeSelect');

    if (refreshRecsBtn) {
      refreshRecsBtn.addEventListener('click', () => {
        playAudioFx('click');
        this.fetchNextMealRecommendations();
      });
    }

    if (genPlanBtn) {
      genPlanBtn.addEventListener('click', () => {
        playAudioFx('click');
        this.fetch7DayPlan();
      });
    }

    if (printReportBtn) {
      printReportBtn.addEventListener('click', () => window.print());
    }

    if (dietTypeSelect) {
      dietTypeSelect.addEventListener('change', () => {
        playAudioFx('toggle');
        this.fetch7DayPlan();
      });
    }
  },

  async loadDietPlanner() {
    await this.fetchNextMealRecommendations();
    await this.fetch7DayPlan();
    await this.loadSmartSwaps();
  },

  async fetchNextMealRecommendations() {
    const container = document.getElementById('nextMealRecsList');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--text-muted); padding: 14px;">Computing optimal Panch-Tatva next meal based on remaining macro deficits...</div>';

    try {
      const payload = {
        daily_targets: AppState.dailyTargets,
        consumed_today: AppState.dailyConsumed,
        dietary_preference: AppState.clientProfile.dietary_preference || 'all'
      };

      const res = await apiRequest('recommend-next-meal', 'POST', payload);
      if (res && res.recommendations) {
        this.renderNextMealCards(res.recommendations, res.remaining_budget);
      }
    } catch (e) {
      container.innerHTML = '<div style="color: var(--rose);">Failed to generate meal recommendation.</div>';
    }
  },

  renderNextMealCards(recommendations, budget) {
    const container = document.getElementById('nextMealRecsList');
    if (!container) return;

    container.innerHTML = '';

    const rem = budget.remaining;
    const headerInfo = document.getElementById('remainingDeficitBadge');
    if (headerInfo) {
      headerInfo.textContent = `Remaining Window: ${Math.round(rem.calories)} kcal • ${rem.protein_g}g Protein`;
    }

    recommendations.forEach((rec, idx) => {
      const card = document.createElement('div');
      card.className = 'recommend-card';
      card.innerHTML = `
        <div class="recommend-card-header">
          <h4>${rec.name}</h4>
          <span class="prep-badge">⏱️ ${rec.prep_time}</span>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">${rec.description}</p>
        <div class="recommend-rationale">💡 <strong>Dietitian Rationale:</strong> ${rec.rationale}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
          <div style="display: flex; gap: 10px; font-size: 11.5px; flex-wrap: wrap;">
            <span style="color: #34d399; font-weight: 700;">🔥 ${rec.calories} kcal ऊर्जा</span>
            <span style="color: #22d3ee; font-weight: 600;">🥩 ${rec.protein_g}g प्रथिन (P)</span>
            <span style="color: #fbbf24; font-weight: 600;">🌾 ${rec.carbs_g}g कार्बोज (C)</span>
            <span style="color: #fb7185; font-weight: 600;">🥑 ${rec.fat_g}g स्नेह (F)</span>
          </div>
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="DietPlannerModule.logRecommendedMeal(${idx})">
            + Log Meal
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  },

  logRecommendedMeal(index) {
    playAudioFx('celebrate');
    triggerCelebration();

    const container = document.getElementById('nextMealRecsList');
    const recCards = container ? container.children : [];
    if (!recCards[index]) return;

    showToast('Recommended meal logged to today\'s nutrition diary!', 'success');
  },

  async fetch7DayPlan() {
    const dietTypeSelect = document.getElementById('plannerDietTypeSelect');
    const dietType = dietTypeSelect ? dietTypeSelect.value : 'balanced';

    try {
      const payload = {
        client_targets: { daily_targets: AppState.dailyTargets },
        diet_type: dietType
      };

      const res = await apiRequest('generate-diet-plan', 'POST', payload);
      if (res && res.data) {
        this.current7DayPlan = res.data;
        this.render7DaySchedule(res.data.weekly_schedule);
        this.renderGroceryList(res.data.grocery_checklist);
      }
    } catch (e) {
      console.error('Failed to generate 7 day plan:', e);
    }
  },

  render7DaySchedule(schedule) {
    const tbody = document.getElementById('dietScheduleTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    schedule.forEach(day => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700; color: #fff; background: rgba(255,255,255,0.02);">
          ${day.day}
          <div style="font-size: 11px; color: #34d399; font-weight: 700; margin-top: 4px;">${day.total_calories} kcal ऊर्जा</div>
          <div style="font-size: 10.5px; color: #22d3ee;">${day.total_protein_g}g प्रथिन (Protein)</div>
        </td>
        <td>
          <div class="meal-block">
            <strong>${day.meals.breakfast.title}</strong>
            <span style="color: var(--text-muted); font-size: 11px;">${day.meals.breakfast.calories} kcal • ${day.meals.breakfast.protein_g}g प्रथिन (P)</span>
          </div>
        </td>
        <td>
          <div class="meal-block">
            <strong>${day.meals.lunch.title}</strong>
            <span style="color: var(--text-muted); font-size: 11px;">${day.meals.lunch.calories} kcal • ${day.meals.lunch.protein_g}g प्रथिन (P)</span>
          </div>
        </td>
        <td>
          <div class="meal-block">
            <strong>${day.meals.snack.title}</strong>
            <span style="color: var(--text-muted); font-size: 11px;">${day.meals.snack.calories} kcal • ${day.meals.snack.protein_g}g प्रथिन (P)</span>
          </div>
        </td>
        <td>
          <div class="meal-block">
            <strong>${day.meals.dinner.title}</strong>
            <span style="color: var(--text-muted); font-size: 11px;">${day.meals.dinner.calories} kcal • ${day.meals.dinner.protein_g}g प्रथिन (P)</span>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderGroceryList(checklist) {
    const container = document.getElementById('groceryChecklistContainer');
    if (!container) return;

    container.innerHTML = '';
    let totalItems = 0;
    let checkedItems = 0;

    checklist.forEach(cat => {
      const col = document.createElement('div');
      col.className = 'grocery-category-card';

      const itemsHtml = cat.items.map(it => {
        totalItems++;
        return `
          <label class="grocery-item-row">
            <input type="checkbox" onchange="DietPlannerModule.handleGroceryCheck(this)" />
            <span>${it}</span>
          </label>
        `;
      }).join('');

      col.innerHTML = `
        <h5><span>🛒</span> ${cat.category}</h5>
        <div class="grocery-checklist-items">${itemsHtml}</div>
      `;
      container.appendChild(col);
    });

    this.updateGroceryProgress(checkedItems, totalItems);
  },

  handleGroceryCheck(checkbox) {
    const label = checkbox.closest('.grocery-item-row');
    if (label) {
      if (checkbox.checked) {
        label.classList.add('checked');
        playAudioFx('toggle');
      } else {
        label.classList.remove('checked');
        playAudioFx('click');
      }
    }

    const all = document.querySelectorAll('.grocery-item-row input[type="checkbox"]');
    const checked = document.querySelectorAll('.grocery-item-row input[type="checkbox"]:checked');
    this.updateGroceryProgress(checked.length, all.length);

    if (checked.length === all.length && all.length > 0) {
      triggerCelebration();
      showToast('All grocery & pantry ingredients packed!', 'success');
    }
  },

  updateGroceryProgress(checked, total) {
    const badge = document.getElementById('groceryProgressBadge');
    if (badge && total > 0) {
      const pct = Math.round((checked / total) * 100);
      badge.textContent = `${checked} of ${total} Packed (${pct}%)`;
    }
  },

  async loadSmartSwaps() {
    try {
      const res = await apiRequest('smart-swaps');
      const container = document.getElementById('smartSwapsGrid');
      if (!container || !res.swaps) return;

      container.innerHTML = '';
      res.swaps.forEach(s => {
        const card = document.createElement('div');
        card.className = 'swap-card';
        card.innerHTML = `
          <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--tatva-gold); margin-bottom: 8px;">
            ${s.category}
          </div>
          <div class="swap-split">
            <div class="swap-side original">
              <span style="font-size: 10px; color: var(--tatva-rose); font-weight: 700; text-transform: uppercase;">Standard</span>
              <div style="font-weight: 700; color: #fff; font-size: 13px; margin-top: 2px;">${s.original}</div>
            </div>
            <div style="font-size: 18px; color: var(--tatva-cyan);">➔</div>
            <div class="swap-side replacement">
              <span style="font-size: 10px; color: var(--tatva-emerald); font-weight: 700; text-transform: uppercase;">Smart Swap</span>
              <div style="font-weight: 700; color: #34d399; font-size: 13px; margin-top: 2px;">${s.swap_to}</div>
            </div>
          </div>
          <p style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 8px;">${s.benefit}</p>
          <div class="swap-badge-gain">
            <span>⚡ Save ~${s.calories_saved} kcal per serving</span>
          </div>
        `;
        container.appendChild(card);
      });
    } catch (e) {
      console.error('Failed to load smart swaps:', e);
    }
  }
};
