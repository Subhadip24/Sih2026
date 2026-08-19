/**
 * ThaalTatva AI - Plate Canvas Overlay Visualizer & Holographic Portion Adjuster
 */

const VisualizerModule = {
  canvas: null,
  ctx: null,
  activeHoverItemIndex: -1,
  colorPalette: {
    protein: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.18)', text: '#22d3ee', glow: 'rgba(6, 182, 212, 0.4)' },
    carbs: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.18)', text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.4)' },
    vegetables: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.18)', text: '#34d399', glow: 'rgba(16, 185, 129, 0.4)' },
    fats: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.18)', text: '#fb7185', glow: 'rgba(244, 63, 94, 0.4)' },
    dairy: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.18)', text: '#a78bfa', glow: 'rgba(139, 92, 246, 0.4)' },
    fruits: { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.18)', text: '#f472b6', glow: 'rgba(236, 72, 153, 0.4)' },
    composite: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.18)', text: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.4)' }
  },

  init() {
    this.canvas = document.getElementById('detectionCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      window.addEventListener('resize', () => this.resizeCanvas());
      this.bindCanvasInteractions();
    }
  },

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
      this.redrawOverlay();
    }
  },

  bindCanvasInteractions() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / this.canvas.width) * 1000;
      const mouseY = ((e.clientY - rect.top) / this.canvas.height) * 1000;

      const analysis = AppState.currentPlateAnalysis;
      if (!analysis || !analysis.items) return;

      let foundIndex = -1;
      analysis.items.forEach((item, idx) => {
        const [ymin, xmin, ymax, xmax] = item.box_2d;
        if (mouseY >= ymin && mouseY <= ymax && mouseX >= xmin && mouseX <= xmax) {
          foundIndex = idx;
        }
      });

      if (foundIndex !== this.activeHoverItemIndex) {
        this.activeHoverItemIndex = foundIndex;
        if (foundIndex !== -1) playAudioFx('click');
        this.redrawOverlay();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.activeHoverItemIndex = -1;
      this.redrawOverlay();
    });
  },

  renderAnalysis(data) {
    this.resizeCanvas();
    this.updateSummaryHeader(data);
    this.renderFoodItemsList(data.items);
    this.redrawOverlay();

    const telemetry = document.getElementById('telemetryFeedText');
    if (telemetry) {
      telemetry.textContent = `Analyzed: ${data.meal_name} • ${data.items.length} clusters verified • Nutri-Score ${data.nutri_score || 'A'}`;
    }
  },

  updateSummaryHeader(data) {
    const mealTitle = document.getElementById('detectedMealTitle');
    const mealDesc = document.getElementById('detectedMealDesc');
    const nutriScoreBadge = document.getElementById('detectedNutriScore');
    const glyLoadText = document.getElementById('detectedGlycemicLoad');

    if (mealTitle) mealTitle.textContent = data.meal_name || 'Detected Meal Plate';
    if (mealDesc) mealDesc.textContent = `${data.cuisine} • ${data.diet_type} — ${data.overall_description || ''}`;

    if (nutriScoreBadge) {
      nutriScoreBadge.textContent = data.nutri_score || 'A';
      nutriScoreBadge.className = `nutri-score-badge ${data.nutri_score || 'A'}`;
    }

    if (glyLoadText) {
      glyLoadText.textContent = `Glycemic Load: ${data.glycemic_load} (${data.glycemic_load > 20 ? 'High' : data.glycemic_load > 10 ? 'Moderate' : 'Low'})`;
    }

    // Macro pills with smooth counter animation
    const t = data.totals;
    animateNumber('plateTotalCals', Math.round(t.calories));
    animateNumber('plateTotalProtein', t.protein_g, 650, 'g');
    animateNumber('plateTotalCarbs', t.carbs_g, 650, 'g');
    animateNumber('plateTotalFat', t.fat_g, 650, 'g');
  },

  redrawOverlay() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const analysis = AppState.currentPlateAnalysis;
    if (!analysis || !analysis.items) return;

    const scaleX = this.canvas.width / 1000;
    const scaleY = this.canvas.height / 1000;

    analysis.items.forEach((item, index) => {
      const isHovered = (index === this.activeHoverItemIndex);
      const [ymin, xmin, ymax, xmax] = item.box_2d;
      const x = xmin * scaleX;
      const y = ymin * scaleY;
      const w = (xmax - xmin) * scaleX;
      const h = (ymax - ymin) * scaleY;

      const group = item.food_group || 'composite';
      const colorScheme = this.colorPalette[group] || this.colorPalette.composite;

      this.ctx.save();

      // Bounding box fill & glow
      this.ctx.fillStyle = isHovered ? colorScheme.fill.replace('0.18', '0.35') : colorScheme.fill;
      this.ctx.strokeStyle = isHovered ? '#ffffff' : colorScheme.stroke;
      this.ctx.lineWidth = isHovered ? 2.5 : 1.5;
      this.ctx.shadowColor = isHovered ? '#ffffff' : colorScheme.glow;
      this.ctx.shadowBlur = isHovered ? 20 : 10;

      // Rounded rectangle
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, w, h, 8);
      this.ctx.fill();
      this.ctx.stroke();

      // Holographic corner reticles on the box [ + ]
      const bracketLen = Math.min(14, w / 4, h / 4);
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = isHovered ? '#ffffff' : colorScheme.text;

      // Top-Left
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + bracketLen);
      this.ctx.lineTo(x, y);
      this.ctx.lineTo(x + bracketLen, y);
      this.ctx.stroke();

      // Top-Right
      this.ctx.beginPath();
      this.ctx.moveTo(x + w - bracketLen, y);
      this.ctx.lineTo(x + w, y);
      this.ctx.lineTo(x + w, y + bracketLen);
      this.ctx.stroke();

      // Bottom-Left
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + h - bracketLen);
      this.ctx.lineTo(x, y + h);
      this.ctx.lineTo(x + bracketLen, y + h);
      this.ctx.stroke();

      // Bottom-Right
      this.ctx.beginPath();
      this.ctx.moveTo(x + w - bracketLen, y + h);
      this.ctx.lineTo(x + w, y + h);
      this.ctx.lineTo(x + w, y + h - bracketLen);
      this.ctx.stroke();

      // Floating Holographic Tag
      const labelText = `${item.name} • ${Math.round(item.grams || item.estimated_grams)}g (${Math.round(item.calories)} kcal)`;
      this.ctx.font = '700 11px Outfit, sans-serif';
      const textWidth = this.ctx.measureText(labelText).width;

      const tagY = y - 26 > 0 ? y - 26 : y + 6;
      this.ctx.fillStyle = 'rgba(6, 10, 20, 0.92)';
      this.ctx.beginPath();
      this.ctx.roundRect(x, tagY, textWidth + 18, 22, 6);
      this.ctx.fill();
      this.ctx.strokeStyle = isHovered ? '#38bdf8' : colorScheme.stroke;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.fillStyle = isHovered ? '#ffffff' : colorScheme.text;
      this.ctx.fillText(labelText, x + 9, tagY + 15);

      this.ctx.restore();
    });
  },

  renderFoodItemsList(items) {
    const listContainer = document.getElementById('plateFoodItemsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'food-item-row';
      row.dataset.index = index;

      row.innerHTML = `
        <div class="food-item-top">
          <div class="food-item-name">
            <span>●</span>
            <strong>${item.name}</strong>
          </div>
          <span class="food-item-tag">${item.protein}g प्रथिन (P) • ${item.carbs}g कार्बोज (C) • ${item.fat}g स्नेह (F)</span>
        </div>
        <div class="portion-slider-wrap">
          <input type="range" class="portion-slider" min="10" max="400" step="5" 
                 value="${Math.round(item.grams || item.estimated_grams)}" 
                 data-index="${index}" data-foodid="${item.id || item.food_id}" />
          <span class="portion-grams-label" id="portionLabel_${index}">
            ${Math.round(item.grams || item.estimated_grams)}g (${Math.round(item.calories)} kcal)
          </span>
        </div>
      `;

      // Hover link with canvas
      row.addEventListener('mouseenter', () => {
        this.activeHoverItemIndex = index;
        this.redrawOverlay();
      });
      row.addEventListener('mouseleave', () => {
        this.activeHoverItemIndex = -1;
        this.redrawOverlay();
      });

      // Portion adjustment slider listener
      const slider = row.querySelector('.portion-slider');
      slider.addEventListener('input', (e) => {
        playAudioFx('click');
        this.handlePortionChange(index, parseFloat(e.target.value));
      });

      listContainer.appendChild(row);
    });
  },

  async handlePortionChange(itemIndex, newGrams) {
    const analysis = AppState.currentPlateAnalysis;
    if (!analysis || !analysis.items[itemIndex]) return;

    const item = analysis.items[itemIndex];
    const foodId = item.id || item.food_id;

    try {
      const res = await apiRequest('recalculate-portion', 'POST', { food_id: foodId, grams: newGrams });
      if (res && res.data) {
        // Update item in local state
        Object.assign(item, res.data);

        // Update row text
        const label = document.getElementById(`portionLabel_${itemIndex}`);
        if (label) label.textContent = `${Math.round(item.grams)}g (${Math.round(item.calories)} kcal)`;

        // Recompute totals
        this.recalculateAllTotals();
        this.redrawOverlay();
      }
    } catch (e) {
      console.error('Failed to recalculate portion:', e);
    }
  },

  recalculateAllTotals() {
    const analysis = AppState.currentPlateAnalysis;
    if (!analysis || !analysis.items) return;

    let totCals = 0, totP = 0, totC = 0, totF = 0;
    analysis.items.forEach(it => {
      totCals += it.calories;
      totP += it.protein;
      totC += it.carbs;
      totF += it.fat;
    });

    analysis.totals.calories = totCals;
    analysis.totals.protein_g = Math.round(totP * 10) / 10;
    analysis.totals.carbs_g = Math.round(totC * 10) / 10;
    analysis.totals.fat_g = Math.round(totF * 10) / 10;

    this.updateSummaryHeader(analysis);
  }
};
