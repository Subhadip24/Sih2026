/**
 * ThaalTatva AI - Plate Canvas Overlay Visualizer & Holographic Portion Adjuster
 */

const VisualizerModule = {
  canvas: null,
  ctx: null,
  activeHoverItemIndex: -1,
  colorPalette: {
    protein: { stroke: '#00f2fe', fill: 'rgba(0, 242, 254, 0.18)', text: '#70f7ff', glow: 'rgba(0, 242, 254, 0.6)' },
    carbs: { stroke: '#ffb703', fill: 'rgba(255, 183, 3, 0.18)', text: '#ffd166', glow: 'rgba(255, 183, 3, 0.6)' },
    vegetables: { stroke: '#00f59b', fill: 'rgba(0, 245, 155, 0.18)', text: '#57ffbe', glow: 'rgba(0, 245, 155, 0.6)' },
    fats: { stroke: '#ff007f', fill: 'rgba(255, 0, 127, 0.18)', text: '#ff54a4', glow: 'rgba(255, 0, 127, 0.6)' },
    dairy: { stroke: '#9d4edd', fill: 'rgba(157, 78, 221, 0.18)', text: '#c77dff', glow: 'rgba(157, 78, 221, 0.6)' },
    fruits: { stroke: '#ff007f', fill: 'rgba(255, 0, 127, 0.18)', text: '#ff54a4', glow: 'rgba(255, 0, 127, 0.6)' },
    composite: { stroke: '#00f59b', fill: 'rgba(0, 245, 155, 0.18)', text: '#57ffbe', glow: 'rgba(0, 245, 155, 0.6)' }
  },

  init() {
    this.canvas = document.getElementById('detectionCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      window.addEventListener('resize', () => this.resizeCanvas());
      const imgDisplay = document.getElementById('plateImageDisplay');
      if (imgDisplay) {
        imgDisplay.addEventListener('load', () => {
          this.resizeCanvas();
          this.redrawOverlay();
        });
      }
      this.bindCanvasInteractions();
    }
  },

  getImageRenderBounds() {
    const img = document.getElementById('plateImageDisplay');
    const video = document.getElementById('cameraVideo');
    const activeMedia = (video && video.style.display !== 'none') ? video : img;

    if (!this.canvas) return { x: 0, y: 0, w: 600, h: 440 };

    const containerW = this.canvas.width;
    const containerH = this.canvas.height;

    let naturalW = 0;
    let naturalH = 0;

    if (activeMedia === video) {
      naturalW = video.videoWidth || 1280;
      naturalH = video.videoHeight || 720;
    } else if (img) {
      naturalW = img.naturalWidth || img.clientWidth || containerW;
      naturalH = img.naturalHeight || img.clientHeight || containerH;
    }

    if (!naturalW || !naturalH) {
      return { x: 0, y: 0, w: containerW, h: containerH };
    }

    const imgAspect = naturalW / naturalH;
    const containerAspect = containerW / containerH;

    let renderW, renderH, renderX, renderY;

    if (imgAspect > containerAspect) {
      renderW = containerW;
      renderH = containerW / imgAspect;
      renderX = 0;
      renderY = (containerH - renderH) / 2;
    } else {
      renderH = containerH;
      renderW = containerH * imgAspect;
      renderX = (containerW - renderW) / 2;
      renderY = 0;
    }

    return { x: renderX, y: renderY, w: renderW, h: renderH };
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
      const bounds = this.getImageRenderBounds();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (clickX < bounds.x || clickX > bounds.x + bounds.w ||
          clickY < bounds.y || clickY > bounds.y + bounds.h) {
        if (this.activeHoverItemIndex !== -1) {
          this.activeHoverItemIndex = -1;
          this.redrawOverlay();
        }
        return;
      }

      const mouseX = ((clickX - bounds.x) / bounds.w) * 1000;
      const mouseY = ((clickY - bounds.y) / bounds.h) * 1000;

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

    const bounds = this.getImageRenderBounds();
    const scaleX = bounds.w / 1000;
    const scaleY = bounds.h / 1000;

    analysis.items.forEach((item, index) => {
      const isHovered = (index === this.activeHoverItemIndex);
      const [ymin, xmin, ymax, xmax] = item.box_2d;
      const x = bounds.x + (xmin * scaleX);
      const y = bounds.y + (ymin * scaleY);
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
