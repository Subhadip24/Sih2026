/**
 * NutriVision AI - AI Dietitian, Adaptive Meal Recommender & 7-Day Plan Generator
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
      refreshRecsBtn.addEventListener('click', () => this.fetchNextMealRecommendations());
    }

    if (genPlanBtn) {
      genPlanBtn.addEventListener('click', () => this.fetch7DayPlan());
    }

    if (printReportBtn) {
      printReportBtn.addEventListener('click', () => window.print());
    }

    if (dietTypeSelect) {
      dietTypeSelect.addEventListener('change', () => this.fetch7DayPlan());
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

    container.innerHTML = '<div style="color: var(--text-muted); padding: 10px;">Computing optimal next meal based on remaining macros...</div>';

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

    recommendations.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'recommend-card';
      card.innerHTML = `
        <div class="recommend-card-header">
          <h4>${rec.name}</h4>
          <span class="prep-badge">⏱️ ${rec.prep_time}</span>
        </div>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">${rec.description}</p>
        <div class="recommend-rationale">💡 <strong>Dietitian Rationale:</strong> ${rec.rationale}</div>
        <div style="display: flex; gap: 12px; font-size: 11px; margin-top: 8px;">
          <span style="color: #34d399; font-weight: 700;">🔥 ${rec.calories} kcal</span>
          <span style="color: #22d3ee; font-weight: 600;">🥩 ${rec.protein_g}g Protein</span>
          <span style="color: #fbbf24; font-weight: 600;">🌾 ${rec.carbs_g}g Carbs</span>
          <span style="color: #fb7185; font-weight: 600;">🥑 ${rec.fat_g}g Fat</span>
          <span style="color: #a78bfa; font-weight: 600;">🌿 ${rec.fiber_g}g Fiber</span>
        </div>
      `;
      container.appendChild(card);
    });
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
          <div style="font-size: 10px; color: #34d399; font-weight: 600; margin-top: 4px;">${day.total_calories} kcal</div>
          <div style="font-size: 10px; color: #22d3ee;">${day.total_protein_g}g Protein</div>
        </td>
        <td>
          <div class="meal-cell-title">${day.meals.breakfast.title}</div>
          <div class="meal-cell-meta">${day.meals.breakfast.calories} kcal • ${day.meals.breakfast.protein_g}g P</div>
        </td>
        <td>
          <div class="meal-cell-title">${day.meals.lunch.title}</div>
          <div class="meal-cell-meta">${day.meals.lunch.calories} kcal • ${day.meals.lunch.protein_g}g P</div>
        </td>
        <td>
          <div class="meal-cell-title">${day.meals.snack.title}</div>
          <div class="meal-cell-meta">${day.meals.snack.calories} kcal • ${day.meals.snack.protein_g}g P</div>
        </td>
        <td>
          <div class="meal-cell-title">${day.meals.dinner.title}</div>
          <div class="meal-cell-meta">${day.meals.dinner.calories} kcal • ${day.meals.dinner.protein_g}g P</div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderGroceryList(checklist) {
    const container = document.getElementById('groceryChecklistContainer');
    if (!container) return;

    container.innerHTML = '';
    checklist.forEach(cat => {
      const col = document.createElement('div');
      col.className = 'glass-card';
      col.style.padding = '14px';

      const itemsHtml = cat.items.map(it => `
        <li style="margin-bottom: 6px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-primary);">
          <input type="checkbox" style="accent-color: var(--emerald); cursor: pointer;" />
          <span>${it}</span>
        </li>
      `).join('');

      col.innerHTML = `
        <h4 style="font-size: 13px; font-weight: 700; color: #67e8f9; margin-bottom: 10px; border-bottom: 1px solid var(--border-glass); padding-bottom: 6px;">
          ${cat.category}
        </h4>
        <ul style="list-style: none;">${itemsHtml}</ul>
      `;
      container.appendChild(col);
    });
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
          <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">${s.category}</span>
          <div class="swap-from">${s.original}</div>
          <div class="swap-to">➡️ ${s.swap_to}</div>
          <div class="swap-benefit">${s.benefit}</div>
          <div style="font-size: 11px; font-weight: 700; color: #34d399; margin-top: 6px;">Save ~${s.calories_saved} kcal per meal</div>
        `;
        container.appendChild(card);
      });
    } catch (e) {
      console.error('Failed to load smart swaps:', e);
    }
  }
};
