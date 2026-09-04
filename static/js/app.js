/**
 * ThaalTatva AI - Central State, Navigation Router & Interactive Audio-Visual Engine
 */

const AppState = {
  activeTab: 'scanner',
  apiKey: localStorage.getItem('thaaltatva_gemini_key') || localStorage.getItem('nutrivision_gemini_key') || '',
  audioEnabled: localStorage.getItem('thaaltatva_audio_enabled') !== 'false',
  clientProfile: {
    age: 25,
    gender: 'male',
    height_cm: 175,
    current_weight_kg: 75.0,
    target_weight_kg: 72.0,
    activity_level: 'moderate',
    goal: 'lean_hypertrophy',
    dietary_preference: 'all'
  },
  dailyTargets: {
    calories_kcal: 2200,
    protein_g: 140,
    carbs_g: 240,
    fat_g: 65,
    fiber_g: 30,
    water_liters: 3.0,
    sodium_max_mg: 2300
  },
  dailyConsumed: {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sodium_mg: 0,
    water_liters: 1.5,
    meals: []
  },
  currentPlateAnalysis: null,
  prePlateAnalysis: null,
  postPlateAnalysis: null,
  comparisonResult: null
};

// ==================== WEB AUDIO SYNTHESIZER SOUND ENGINE ====================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playAudioFx(type = 'click') {
  if (!AppState.audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'toggle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'shutter') {
      // Futuristic shutter chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.25);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'celebrate') {
      // Harmonic Triad Chord (C5 - E5 - G5)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (idx * 0.07));
        gain.gain.setValueAtTime(0.08, now + (idx * 0.07));
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.07) + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + (idx * 0.07));
        osc.stop(now + (idx * 0.07) + 0.35);
      });
    }
  } catch (err) {
    // Audio contexts can be blocked if user has not interacted
  }
}

function toggleAudioFx() {
  AppState.audioEnabled = !AppState.audioEnabled;
  localStorage.setItem('thaaltatva_audio_enabled', AppState.audioEnabled);
  updateAudioToggleUI();
  if (AppState.audioEnabled) {
    playAudioFx('toggle');
    showToast('Sound FX Enabled', 'info');
  } else {
    showToast('Sound FX Muted', 'info');
  }
}

function updateAudioToggleUI() {
  const btn = document.getElementById('soundToggleBtn');
  const icon = document.getElementById('soundToggleIcon');
  const text = document.getElementById('soundToggleText');
  if (btn && icon && text) {
    if (AppState.audioEnabled) {
      icon.textContent = '🔊';
      text.textContent = 'Audio ON';
      btn.classList.remove('muted');
    } else {
      icon.textContent = '🔇';
      text.textContent = 'Audio Muted';
      btn.classList.add('muted');
    }
  }
}

// ==================== CONFETTI CELEBRATION ENGINE ====================
function triggerCelebration(originX = window.innerWidth / 2, originY = window.innerHeight / 2) {
  const canvas = document.getElementById('celebrationCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#38bdf8', '#ffffff'];

  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: 0.015 + Math.random() * 0.02,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach(p => {
      if (p.alpha > 0.01) {
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.98; // drag
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(render);
  playAudioFx('celebrate');
}

// ==================== QUANTUM NEURAL MATRIX CANVAS ====================
function initNeuralMatrixCanvas() {
  const canvas = document.getElementById('neuralMatrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const mouse = { x: -1000, y: -1000 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  const particleCount = Math.min(Math.floor((width * height) / 24000), 55);
  const particles = [];
  const colors = ['rgba(0, 242, 254, ', 'rgba(0, 245, 155, ', 'rgba(255, 183, 3, ', 'rgba(157, 78, 221, '];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.8 + 0.8,
      baseColor: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.5 + 0.25,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseVal: Math.random() * Math.PI
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw neural filaments between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          const alpha = (1 - dist / 130) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    // Connect to mouse cursor
    if (mouse.x > 0 && mouse.y > 0) {
      for (let i = 0; i < particles.length; i++) {
        const dx = mouse.x - particles[i].x;
        const dy = mouse.y - particles[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          const alpha = (1 - dist / 160) * 0.35;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 245, 155, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Update & draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      p.pulseVal += p.pulseSpeed;
      const currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.15;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.baseColor + Math.max(0.1, currentAlpha) + ')';
      ctx.shadowColor = 'rgba(0, 242, 254, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}


// ==================== ANIMATED NUMBER COUNTER UTILITY ====================
function animateNumber(elementId, targetVal, duration = 650, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const currentVal = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
  const start = currentVal;
  const end = typeof targetVal === 'number' ? targetVal : parseFloat(targetVal) || 0;
  const isFloat = end % 1 !== 0;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    const val = start + (end - start) * easeProgress;

    el.textContent = `${isFloat ? val.toFixed(1) : Math.round(val)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = `${isFloat ? end.toFixed(1) : Math.round(end)}${suffix}`;
    }
  }

  requestAnimationFrame(update);
}

// ==================== TOAST NOTIFICATION SYSTEM ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = '✨';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  if (type === 'warning') icon = '🔔';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==================== TAB SWITCHING ====================
function switchTab(tabId) {
  AppState.activeTab = tabId;
  playAudioFx('click');

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabId}Pane`);
  });

  // Trigger tab-specific refresh
  if (tabId === 'dashboard') {
    DashboardModule.renderDashboard();
  } else if (tabId === 'diet_planner') {
    DietPlannerModule.loadDietPlanner();
  } else if (tabId === 'client_profile') {
    ClientProfileModule.loadProfileUI();
  } else if (tabId === 'fitness') {
    FitnessHubModule.calculateFuelBurn();
  } else if (tabId === 'gyms') {
    GymLocatorModule.loadGyms();
  }
}

// ==================== API FETCH HELPER WITH STATIC GITHUB PAGES FALLBACK ====================
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`/api/${endpoint}`, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Network error or static hosting without backend (e.g. GitHub Pages)
  }

  // Fallback to client-side engine for static GitHub Pages hosting
  return handleClientSideFallback(endpoint, method, body);
}

function resolvePresetImg(filename) {
  const file = filename.split('/').pop();
  const isStaticSubdir = window.location.pathname.endsWith('/static/') || window.location.pathname.includes('/static/index.html');
  return isStaticSubdir ? `./images/presets/${file}` : `./static/images/presets/${file}`;
}

function handleClientSideFallback(endpoint, method, body) {
  console.log(`[ThaalTatva Client-Side Engine Active] Serving ${endpoint}`);

  if (endpoint === 'presets') {
    return {
      presets: [
        {
          id: "indian_thali_pre",
          title: "Traditional Indian Thali (Pre-Meal)",
          type: "pre_meal",
          matching_pre_id: null,
          image_url: resolvePresetImg("indian_thali_pre.jpg"),
          diet_type: "Vegetarian",
          cuisine: "Indian",
          description: "Wholesome Indian balanced platter with yellow dal, paneer gravy, basmati rice, 2 rotis, and fresh cucumber salad.",
          items_count: 5
        },
        {
          id: "indian_thali_post",
          title: "Traditional Indian Thali (Post-Meal Leftover)",
          type: "post_meal",
          matching_pre_id: "indian_thali_pre",
          image_url: resolvePresetImg("indian_thali_post.jpg"),
          diet_type: "Vegetarian",
          cuisine: "Indian",
          description: "Post-meal plate showing all rotis and paneer consumed, 50% rice leftover, 39% dal remaining.",
          items_count: 5
        },
        {
          id: "chicken_rice_pre",
          title: "Lean Chicken, Brown Rice & Greens (Pre-Meal)",
          type: "pre_meal",
          matching_pre_id: null,
          image_url: resolvePresetImg("chicken_rice_pre.jpg"),
          diet_type: "High-Protein / Fitness",
          cuisine: "Clean Fitness Prep",
          description: "High-protein athlete meal prep with sliced grilled chicken breast, complex brown rice, and asparagus.",
          items_count: 4
        },
        {
          id: "chicken_rice_post",
          title: "Lean Chicken & Rice (Post-Meal Leftover)",
          type: "post_meal",
          matching_pre_id: "chicken_rice_pre",
          image_url: resolvePresetImg("chicken_rice_post.jpg"),
          diet_type: "High-Protein / Fitness",
          cuisine: "Clean Fitness Prep",
          description: "Post-meal plate with 100% chicken consumed, 40g asparagus leftover, and 65g brown rice leftover.",
          items_count: 4
        },
        {
          id: "salmon_bowl_pre",
          title: "Salmon, Quinoa & Avocado Superfood Bowl",
          type: "pre_meal",
          matching_pre_id: null,
          image_url: resolvePresetImg("salmon_bowl_pre.jpg"),
          diet_type: "Omega-3 / Superfood",
          cuisine: "Contemporary Healthy",
          description: "Nutrient-dense superfood bowl with crispy pan-seared salmon fillet, tri-color quinoa, and avocado.",
          items_count: 4
        },
        {
          id: "mediterranean_salad",
          title: "Mediterranean Greek Chicken Salad",
          type: "pre_meal",
          matching_pre_id: null,
          image_url: resolvePresetImg("mediterranean_salad.jpg"),
          diet_type: "Keto / Low-Carb",
          cuisine: "Mediterranean",
          description: "Fresh vibrant Mediterranean bowl with grilled herb chicken strips, creamy feta, and olives.",
          items_count: 4
        },
        {
          id: "fitness_oatmeal",
          title: "High-Protein Oatmeal Super-Bowl",
          type: "pre_meal",
          matching_pre_id: null,
          image_url: resolvePresetImg("fitness_oatmeal.jpg"),
          diet_type: "High-Fiber / Energy",
          cuisine: "Clean Breakfast",
          description: "Energizing fitness breakfast with rolled oats, sliced bananas, blueberries, and chia seeds.",
          items_count: 6
        }
      ]
    };
  }

  if (endpoint === 'analyze-plate') {
    const img = (body && body.image) ? body.image : '';
    if (img.includes('chicken_rice') || img.includes('chicken')) {
      return {
        status: "success",
        data: {
          meal_name: "Lean Chicken, Brown Rice & Greens",
          cuisine: "Clean Fitness Prep",
          diet_type: "High-Protein",
          overall_description: "High-protein athlete meal prep with sliced grilled chicken breast, complex brown rice, and asparagus.",
          nutri_score: "A",
          glycemic_load: 22.4,
          totals: { grams: 460.0, calories: 574.0, protein_g: 58.6, carbs_g: 57.2, fat_g: 9.8, fiber_g: 8.4 },
          items: [
            { id: "grilled_chicken_breast", name: "Grilled Chicken Breast", grams: 180.0, calories: 297.0, protein: 55.8, carbs: 0.0, fat: 6.5, box_2d: [180, 180, 520, 500], food_group: "protein" },
            { id: "cooked_brown_rice", name: "Steamed Brown Rice", grams: 150.0, calories: 168.0, protein: 3.9, carbs: 34.2, fat: 1.4, box_2d: [480, 260, 810, 580], food_group: "carbs" },
            { id: "steamed_asparagus", name: "Steamed Asparagus", grams: 80.0, calories: 16.0, protein: 1.8, carbs: 3.1, fat: 0.2, box_2d: [200, 540, 540, 850], food_group: "vegetables" },
            { id: "glazed_baby_carrots", name: "Glazed Baby Carrots", grams: 50.0, calories: 20.5, protein: 0.5, carbs: 4.8, fat: 0.1, box_2d: [550, 590, 780, 830], food_group: "vegetables" }
          ]
        }
      };
    }

    if (img.includes('salmon')) {
      return {
        status: "success",
        data: {
          meal_name: "Salmon, Quinoa & Avocado Superfood Bowl",
          cuisine: "Contemporary Healthy",
          diet_type: "Omega-3 / Superfood",
          overall_description: "Nutrient-dense superfood bowl with crispy pan-seared salmon fillet, tri-color quinoa, and avocado.",
          nutri_score: "A",
          glycemic_load: 18.2,
          totals: { grams: 430.0, calories: 642.0, protein_g: 42.4, carbs_g: 41.5, fat_g: 31.8, fiber_g: 9.8 },
          items: [
            { id: "pan_seared_salmon", name: "Pan-Seared Salmon Fillet", grams: 160.0, calories: 332.8, protein: 35.2, carbs: 0.0, fat: 20.8, box_2d: [220, 190, 560, 530], food_group: "protein" },
            { id: "cooked_quinoa", name: "Tri-Color Quinoa", grams: 140.0, calories: 168.0, protein: 6.2, carbs: 29.8, fat: 2.7, box_2d: [480, 240, 820, 590], food_group: "carbs" },
            { id: "avocado_slices", name: "Fresh Hass Avocado", grams: 60.0, calories: 96.0, protein: 1.2, carbs: 5.1, fat: 8.8, box_2d: [260, 550, 550, 830], food_group: "fats" },
            { id: "steamed_broccoli", name: "Steamed Broccoli", grams: 70.0, calories: 23.8, protein: 2.0, carbs: 4.6, fat: 0.3, box_2d: [560, 570, 790, 840], food_group: "vegetables" }
          ]
        }
      };
    }

    // Default Traditional Indian Thali
    return {
      status: "success",
      data: {
        meal_name: "Traditional Indian Thali (Pre-Meal)",
        cuisine: "Indian",
        diet_type: "Vegetarian",
        overall_description: "Wholesome Indian balanced platter with yellow dal, paneer gravy, basmati rice, 2 rotis, and cucumber salad.",
        nutri_score: "D",
        glycemic_load: 61.6,
        totals: { grams: 650.0, calories: 1013.0, protein_g: 51.6, carbs_g: 124.7, fat_g: 35.5, fiber_g: 17.1 },
        items: [
          { id: "paneer_tikka", name: "Paneer Tikka Gravy", grams: 150.0, calories: 397.5, protein: 27.3, carbs: 9.8, fat: 28.7, box_2d: [260, 160, 530, 430], food_group: "protein" },
          { id: "yellow_dal", name: "Yellow Moong Dal Tadka", grams: 180.0, calories: 208.8, protein: 13.1, carbs: 30.2, fat: 4.3, box_2d: [535, 220, 810, 490], food_group: "composite" },
          { id: "steamed_basmati_rice", name: "Steamed Basmati Rice", grams: 160.0, calories: 208.0, protein: 4.3, carbs: 45.1, fat: 0.5, box_2d: [365, 415, 650, 680], food_group: "carbs" },
          { id: "whole_wheat_roti", name: "Whole Wheat Roti (2 pcs)", grams: 75.0, calories: 180.0, protein: 6.1, carbs: 36.0, fat: 1.7, box_2d: [135, 375, 380, 775], food_group: "carbs" },
          { id: "cucumber_salad", name: "Cucumber Kachumber Salad", grams: 85.0, calories: 18.7, protein: 0.8, carbs: 3.6, fat: 0.3, box_2d: [300, 675, 530, 905], food_group: "vegetables" }
        ]
      }
    };
  }

  if (endpoint === 'compare-plates') {
    return {
      status: "success",
      data: {
        status: "success",
        meal_name: "Traditional Indian Thali (Pre vs Post)",
        overall_consumed_pct: 70.0,
        overall_leftover_pct: 30.0,
        initial_totals: { grams: 650.0, calories: 1013.0, protein_g: 51.6, carbs_g: 124.7, fat_g: 35.5, fiber_g: 17.1 },
        consumed_totals: { grams: 455.0, calories: 805.7, protein_g: 43.1, carbs_g: 88.4, fat_g: 32.3, fiber_g: 12.8, sodium_mg: 1073.8 },
        leftover_totals: { grams: 195.0, calories: 207.2, calories_saved: 207.2 },
        item_breakdown: [
          { food_id: "paneer_tikka", name: "Paneer Tikka Gravy", pre_grams: 150.0, post_grams: 5.0, consumed_grams: 145.0, consumed_pct: 96.7, leftover_pct: 3.3, consumed_calories: 384.2, consumed_protein_g: 26.4, consumed_carbs_g: 9.4, consumed_fat_g: 27.7, consumed_fiber_g: 1.7 },
          { food_id: "yellow_dal", name: "Yellow Moong Dal Tadka", pre_grams: 180.0, post_grams: 70.0, consumed_grams: 110.0, consumed_pct: 61.1, leftover_pct: 38.9, consumed_calories: 127.6, consumed_protein_g: 8.0, consumed_carbs_g: 18.5, consumed_fat_g: 2.6, consumed_fiber_g: 5.3 },
          { food_id: "steamed_basmati_rice", name: "Steamed Basmati Rice", pre_grams: 160.0, post_grams: 80.0, consumed_grams: 80.0, consumed_pct: 50.0, leftover_pct: 50.0, consumed_calories: 104.0, consumed_protein_g: 2.2, consumed_carbs_g: 22.6, consumed_fat_g: 0.2, consumed_fiber_g: 0.3 },
          { food_id: "whole_wheat_roti", name: "Whole Wheat Roti (2 pcs)", pre_grams: 75.0, post_grams: 0.0, consumed_grams: 75.0, consumed_pct: 100.0, leftover_pct: 0.0, consumed_calories: 180.0, consumed_protein_g: 6.1, consumed_carbs_g: 36.0, consumed_fat_g: 1.7, consumed_fiber_g: 4.9 },
          { food_id: "cucumber_salad", name: "Cucumber Kachumber Salad", pre_grams: 85.0, post_grams: 40.0, consumed_grams: 45.0, consumed_pct: 52.9, leftover_pct: 47.1, consumed_calories: 9.9, consumed_protein_g: 0.4, consumed_carbs_g: 1.9, consumed_fat_g: 0.1, consumed_fiber_g: 0.6 }
        ]
      }
    };
  }

  if (endpoint === 'calculate-targets') {
    const p = body || AppState.clientProfile;
    const isMale = p.gender === 'male';
    const bmr = 10 * p.current_weight_kg + 6.25 * p.height_cm - 5 * p.age + (isMale ? 5 : -161);
    const actMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, athlete: 1.9 };
    const mult = actMap[p.activity_level] || 1.55;
    const tdee = bmr * mult;
    const targetCals = Math.round(tdee + 250);
    const proteinG = Math.round(p.target_weight_kg * 2.0);
    const fatG = Math.round((targetCals * 0.25) / 9);
    const carbsG = Math.round((targetCals - (proteinG * 4 + fatG * 9)) / 4);

    return {
      status: "success",
      data: {
        client_profile: { bmi: "24.5", bmi_category: "Normal Weight" },
        metabolic_metrics: { bmr_kcal: Math.round(bmr), tdee_kcal: Math.round(tdee) },
        daily_targets: { calories_kcal: targetCals, protein_g: proteinG, carbs_g: carbsG, fat_g: fatG, fiber_g: 30, water_liters: 3.0 },
        macro_ratio_pct: { protein_pct: 25.5, carbs_pct: 43.6, fat_pct: 26.6 }
      }
    };
  }

  if (endpoint === 'generate-diet-plan') {
    const dietType = (body && body.diet_type) ? body.diet_type.toLowerCase() : 'balanced';
    let targetCals = 2100;
    let targetP = 135;

    if (body && body.client_targets) {
      const ct = body.client_targets;
      targetCals = ct.calories_kcal || (ct.daily_targets && ct.daily_targets.calories_kcal) || 2100;
      targetP = ct.protein_g || (ct.daily_targets && ct.daily_targets.protein_g) || 135;
    }

    const bCals = Math.round(targetCals * 0.25);
    const lCals = Math.round(targetCals * 0.35);
    const sCals = Math.round(targetCals * 0.15);
    const dCals = Math.round(targetCals * 0.25);

    let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let schedule = [];
    let grocery = [];

    if (dietType.includes('veg') && !dietType.includes('vegan')) {
      // Vegetarian
      schedule = days.map((day, i) => ({
        day: day,
        total_calories: targetCals,
        total_protein_g: targetP,
        meals: {
          breakfast: { title: i % 2 === 0 ? "Moong Dal Cheela with Mint Paneer Stuffing" : "Paneer Bhurji with Multigrain Toast", calories: bCals, protein_g: Math.round(targetP * 0.26) },
          lunch: { title: i % 2 === 0 ? "Yellow Dal Tadka with Paneer Tikka & Brown Basmati" : "Rajma Masala with Steamed Quinoa & Raita", calories: lCals, protein_g: Math.round(targetP * 0.36) },
          snack: { title: i % 2 === 0 ? "Sprouted Chana Chaat with Fresh Lemon & Herbs" : "Roasted Makhana with 12 Almonds", calories: sCals, protein_g: Math.round(targetP * 0.14) },
          dinner: { title: i % 2 === 0 ? "Soya Chunks Curry with Steamed Broccoli & Jowar Roti" : "Palak Paneer with Cucumber Salad", calories: dCals, protein_g: Math.round(targetP * 0.28) }
        }
      }));
      grocery = [
        { category: "Vegetarian Proteins", items: ["Fresh Low-Fat Paneer (1kg)", "Organic Soya Chunks (500g)", "Greek Dahi / Curd (1kg)", "Whey Protein / Sattu", "Sprouted Moong & Black Chana"] },
        { category: "Complex Grains & Dal", items: ["Yellow Moong Dal & Toor Dal", "Rajma & Chole", "Organic Quinoa & Brown Basmati", "Jowar & Multigrain Flour", "Rolled Oats"] },
        { category: "Fresh Vegetables & Greens", items: ["Baby Spinach (Palak)", "Fresh Broccoli Florets", "Cucumbers, Tomatoes & Mint", "Asparagus & Bell Peppers", "Lemons & Ginger"] },
        { category: "Healthy Fats & Extras", items: ["Raw Almonds & Walnuts", "Black Chia & Flax Seeds", "Cold-Pressed Mustard / Olive Oil", "Roasted Makhana", "Himalayan Pink Salt & Turmeric"] }
      ];
    } else if (dietType.includes('vegan')) {
      // Vegan
      schedule = days.map((day, i) => ({
        day: day,
        total_calories: targetCals,
        total_protein_g: targetP,
        meals: {
          breakfast: { title: i % 2 === 0 ? "Turmeric Tofu Scramble with Avocado Whole Grain Toast" : "Almond Milk Chia Pudding with Berries & Hemp Seeds", calories: bCals, protein_g: Math.round(targetP * 0.25) },
          lunch: { title: i % 2 === 0 ? "Air-Fried Crispy Tofu & Edamame Quinoa Bowl" : "Spiced Lentil Dal Tadka with Brown Basmati & Kale", calories: lCals, protein_g: Math.round(targetP * 0.35) },
          snack: { title: i % 2 === 0 ? "Steamed Sea-Salt Edamame Pods" : "Sprouted Chickpea Chaat with Lime & Coriander", calories: sCals, protein_g: Math.round(targetP * 0.15) },
          dinner: { title: i % 2 === 0 ? "Tempeh Vegetable Stir-Fry with Tri-Color Quinoa" : "Hearty Green Lentil Broth with Multigrain Toast", calories: dCals, protein_g: Math.round(targetP * 0.28) }
        }
      }));
      grocery = [
        { category: "Plant Proteins", items: ["Organic Firm Tofu (1kg)", "Organic Tempeh (500g)", "Shelled Edamame (500g)", "Pea Protein Powder", "Sprouted Moong & Lentils"] },
        { category: "Whole Grains & Pulses", items: ["Tri-Color Quinoa", "Brown Basmati Rice", "Yellow Moong & Green Lentils", "Rolled Oats", "Hemp Hearts"] },
        { category: "Produce & Greens", items: ["Broccoli Florets & Kale", "Baby Spinach & Asparagus", "Hass Avocados (4 pcs)", "Cherry Tomatoes & Bell Peppers", "Limes & Fresh Ginger"] },
        { category: "Healthy Fats & Extras", items: ["Tahini & Pumpkin Seeds", "Raw Walnuts & Chia Seeds", "Extra Virgin Olive Oil", "Unsweetened Almond Milk", "Nutritional Yeast"] }
      ];
    } else if (dietType.includes('keto')) {
      // Keto
      schedule = days.map((day, i) => ({
        day: day,
        total_calories: targetCals,
        total_protein_g: targetP,
        meals: {
          breakfast: { title: i % 2 === 0 ? "Spinach & Mushroom Omelette with Sliced Avocado" : "Grilled Herbed Paneer Steak with Sautéed Asparagus", calories: bCals, protein_g: Math.round(targetP * 0.28) },
          lunch: { title: i % 2 === 0 ? "Pan-Seared Salmon Fillet with Garlic Cauliflower Rice" : "Grilled Chicken Thighs with Roasted Zucchini & Feta", calories: lCals, protein_g: Math.round(targetP * 0.36) },
          snack: { title: i % 2 === 0 ? "Whole Hass Avocado with Sea Salt & Lemon" : "Roasted Almonds & Macadamia Nuts", calories: sCals, protein_g: Math.round(targetP * 0.10) },
          dinner: { title: i % 2 === 0 ? "Grilled Herb Chicken Breast with Broccoli Cheddar Sauce" : "Pan-Roasted Lemon Paneer with Sautéed Spinach", calories: dCals, protein_g: Math.round(targetP * 0.30) }
        }
      }));
      grocery = [
        { category: "Keto Proteins", items: ["Wild Salmon Fillets / Chicken Thighs", "Full-Fat Fresh Paneer", "Free-Range Pastured Eggs", "Greek Feta Cheese", "Zero-Carb Whey Isolate"] },
        { category: "Low-Carb Produce", items: ["Cauliflower (for rice)", "Fresh Zucchini & Broccoli", "Asparagus Spears", "Baby Spinach & Salad Greens", "Hass Avocados (6 pcs)"] },
        { category: "Healthy Fats & Oils", items: ["Extra Virgin Olive Oil", "Grass-Fed Butter / Ghee", "MCT Oil", "Kalamata Olives", "Full-Fat Coconut Cream"] },
        { category: "Keto Crunch & Extras", items: ["Macadamia Nuts & Pecans", "Raw Almonds", "Chia & Hemp Seeds", "Pink Himalayan Rock Salt", "Herbes de Provence"] }
      ];
    } else if (dietType.includes('diabetic')) {
      // Diabetic
      schedule = days.map((day, i) => ({
        day: day,
        total_calories: targetCals,
        total_protein_g: targetP,
        meals: {
          breakfast: { title: i % 2 === 0 ? "Sprouted Moong & Methi Cheela with Flaxseed Chutney" : "Steel-Cut Cinnamon Oats with Chia Seeds & Sliced Almonds", calories: bCals, protein_g: Math.round(targetP * 0.26) },
          lunch: { title: i % 2 === 0 ? "Bitter Gourd (Karela) & Paneer Bhurji with 2 Jowar Bhakris" : "Yellow Dal with Methi Leaves, Brown Basmati & Salad", calories: lCals, protein_g: Math.round(targetP * 0.34) },
          snack: { title: i % 2 === 0 ? "Roasted Sprouted Chana with Lemon & Chaat Masala" : "Fenugreek-Infused Green Tea with Steamed Edamame", calories: sCals, protein_g: Math.round(targetP * 0.14) },
          dinner: { title: i % 2 === 0 ? "Moong Dal Soup with Sautéed Palak & 1 Multigrain Roti" : "Pan-Seared Salmon Fillet with Steamed Broccoli & Zucchini", calories: dCals, protein_g: Math.round(targetP * 0.28) }
        }
      }));
      grocery = [
        { category: "Low-GI Proteins", items: ["Low-Fat Paneer & Greek Yogurt", "Egg Whites / Lean Chicken", "Organic Firm Tofu", "Sprouted Moong & Black Chana", "Chana Dal & Yellow Dal"] },
        { category: "Low-GI Complex Carbs", items: ["Jowar & Ragi Flour", "Steel-Cut Oats", "Organic Quinoa", "Brown Basmati Rice", "Flaxseed Meal"] },
        { category: "Glycemic-Regulating Produce", items: ["Bitter Gourd (Karela)", "Fresh Fenugreek (Methi) Leaves", "Baby Spinach (Palak)", "Broccoli & Asparagus", "Cucumbers & Limes"] },
        { category: "Healthy Lipids & Spices", items: ["Ceylon Cinnamon Powder", "Raw Walnuts & Almonds", "Extra Virgin Olive Oil", "Chia Seeds", "Roasted Makhana"] }
      ];
    } else {
      // Balanced High-Protein
      schedule = days.map((day, i) => ({
        day: day,
        total_calories: targetCals,
        total_protein_g: targetP,
        meals: {
          breakfast: { title: i % 2 === 0 ? "Protein Oatmeal with Blueberries, Chia & Whey" : "Egg White & Spinach Omelette with Whole Wheat Toast", calories: bCals, protein_g: Math.round(targetP * 0.26) },
          lunch: { title: i % 2 === 0 ? "Grilled Chicken Breast / Tofu with Brown Rice & Asparagus" : "Traditional Indian Thali (Yellow Dal, Paneer Tikka, 2 Rotis)", calories: lCals, protein_g: Math.round(targetP * 0.36) },
          snack: { title: i % 2 === 0 ? "Sprouted Chana Chaat with Lemon & Herbs" : "Whey Isolate Shake with 1 Apple", calories: sCals, protein_g: Math.round(targetP * 0.16) },
          dinner: { title: i % 2 === 0 ? "Pan-Seared Salmon Fillet / Paneer with Roasted Broccoli" : "Lentil Soup with 1 Multigrain Roti & Salad", calories: dCals, protein_g: Math.round(targetP * 0.28) }
        }
      }));
      grocery = [
        { category: "Proteins", items: ["Chicken Breast / Firm Tofu", "Fresh Low-Fat Paneer", "Greek Yogurt (Non-Fat)", "Eggs / Egg Whites", "Whey Protein Isolate"] },
        { category: "Complex Carbs & Grains", items: ["Rolled Oats", "Organic Quinoa", "Brown Basmati Rice", "Whole Wheat / Multigrain Flour", "Sprouted Moong & Black Chickpeas"] },
        { category: "Vegetables & Fruits", items: ["Fresh Broccoli Florets", "Baby Spinach / Palak", "Cucumbers & Cherry Tomatoes", "Fresh Blueberries & Bananas", "Asparagus Spears"] },
        { category: "Healthy Fats & Extras", items: ["Raw Almonds & Walnuts", "Black Chia Seeds", "Extra Virgin Olive Oil", "Natural Peanut Butter", "Turmeric & Herbs"] }
      ];
    }

    return {
      status: "success",
      data: {
        client_target_calories: targetCals,
        client_target_protein_g: targetP,
        diet_type: dietType,
        weekly_schedule: schedule,
        grocery_checklist: grocery
      }
    };
  }

  if (endpoint === 'recommend-next-meal') {
    return {
      status: "success",
      remaining_budget: { remaining: { calories: 1240, protein_g: 78, carbs_g: 120, fat_g: 32 } },
      recommendations: [
        { name: "High-Protein Paneer & Sprouted Lentil Bowl", prep_time: "15 mins", description: "Grilled cottage cheese cubes over warm sprouted lentils and steamed spinach.", rationale: "Closes 34g of remaining protein deficit while keeping carbs under 30g with low glycemic load.", calories: 460, protein_g: 34.0, carbs_g: 28.5, fat_g: 18.0, fiber_g: 8.5 },
        { name: "Grilled Chicken / Tofu & Avocado Crunch Platter", prep_time: "12 mins", description: "Herb-seasoned breast strips with sliced avocado, cherry tomatoes, and cucumber spears.", rationale: "Rich in branch-chain amino acids and monounsaturated lipids to support overnight muscle recovery.", calories: 420, protein_g: 42.0, carbs_g: 12.0, fat_g: 16.5, fiber_g: 6.2 },
        { name: "Greek Yogurt Super-Seed Crunch", prep_time: "5 mins", description: "Thick unsweetened Greek yogurt topped with toasted chia, pumpkin seeds, and blueberries.", rationale: "Provides 26g sustained-release micellar casein protein for steady nocturnal amino acid delivery.", calories: 290, protein_g: 26.0, carbs_g: 18.0, fat_g: 9.0, fiber_g: 4.8 }
      ]
    };
  }

  if (endpoint === 'smart-swaps') {
    return {
      swaps: [
        { category: "Cooking Oils", original: "Refined Palm / Vegetable Oil", swap_to: "Cold-Pressed Mustard Oil / Ghee", benefit: "Reduces trans fats and introduces anti-inflammatory omega-3 alpha-linolenic acid.", calories_saved: 110 },
        { category: "Grains & Rice", original: "Polished White Rice (160g)", swap_to: "Steamed Quinoa / Cauliflower Rice", benefit: "Reduces Glycemic Index from 70 to 35 and boosts dietary fiber by 400%.", calories_saved: 120 },
        { category: "Snacks", original: "Deep-Fried Samosa (2 pcs)", swap_to: "Air-Fried Paneer Tikka / Roasted Makhana", benefit: "Saves 320 kcal of oxidized cooking oil while boosting protein intake by 18g.", calories_saved: 320 },
        { category: "Sweeteners & Desserts", original: "Refined Sugar (2 tsp / 10g)", swap_to: "Organic Stevia / Monk Fruit Extract", benefit: "Eliminates rapid insulin spikes and zero caloric load.", calories_saved: 40 },
        { category: "Flours & Breads", original: "Refined Maida Naan (100g)", swap_to: "Jowar & Ragi Millet Roti (100g)", benefit: "Gluten-free, rich in polyphenols and magnesium for insulin sensitivity.", calories_saved: 95 }
      ]
    };
  }

  if (endpoint === 'recalculate-portion') {
    const g = body.grams || 100;
    return {
      status: "success",
      data: {
        grams: g,
        calories: Math.round((g * 2.2) * 10) / 10,
        protein: Math.round((g * 0.18) * 10) / 10,
        carbs: Math.round((g * 0.22) * 10) / 10,
        fat: Math.round((g * 0.08) * 10) / 10
      }
    };
  }

  if (endpoint.startsWith('fitness/burn-calculator')) {
    const act = (body && body.activity) || 'hypertrophy_weightlifting';
    const dur = (body && body.duration_min) || 45;
    const wt = (body && body.weight_kg) || 75;
    const mets = {
      zone2_cardio: { met: 6.0, fat: 0.65, carb: 0.35, epoc: 0.06, name: "Zone 2 Incline Walk / Steady Cardio", fuel: "Fat Lipolysis (Mitochondrial Beta-Oxidation)" },
      hypertrophy_weightlifting: { met: 5.5, fat: 0.40, carb: 0.60, epoc: 0.16, name: "Hypertrophy Resistance Training (Gym)", fuel: "Intramuscular Glycogen & Afterburn EPOC" },
      hiit_circuits: { met: 9.2, fat: 0.28, carb: 0.72, epoc: 0.20, name: "High-Intensity Interval Training (HIIT)", fuel: "Rapid Glycogen Depletion + Massive EPOC" },
      stairmaster: { met: 8.5, fat: 0.50, carb: 0.50, epoc: 0.12, name: "Stairmaster / High Incline Climber", fuel: "Balanced Glute-Driven Fat & Glycogen Burn" },
      jump_rope: { met: 10.0, fat: 0.32, carb: 0.68, epoc: 0.15, name: "Speed Jump Rope / Boxer Conditioning", fuel: "Glycogen & Fast-Twitch Muscle Burn" },
      crossfit_metcon: { met: 9.5, fat: 0.30, carb: 0.70, epoc: 0.18, name: "CrossFit MetCon / Functional Circuit", fuel: "High Lactate Glycolysis + 36h Afterburn" },
      outdoor_cycling: { met: 7.5, fat: 0.55, carb: 0.45, epoc: 0.08, name: "Road / Stationary Cycling", fuel: "Quad Fueling & Aerobic Lipolysis" },
      swimming_laps: { met: 8.0, fat: 0.45, carb: 0.55, epoc: 0.10, name: "Swimming Freestyle / Butterfly Laps", fuel: "Full Body Resistance & Aerobic Burn" }
    };
    const prof = mets[act] || mets.hypertrophy_weightlifting;
    const totalCals = Math.round(prof.met * wt * (dur / 60.0));
    return {
      status: "success",
      data: {
        activity: act,
        activity_name: prof.name,
        duration_min: dur,
        weight_kg: wt,
        total_calories_kcal: totalCals,
        fat_oxidized_grams: Math.round((totalCals * prof.fat / 9.0) * 10) / 10,
        carbs_burned_grams: Math.round((totalCals * prof.carb / 4.0) * 10) / 10,
        fat_ratio_pct: Math.round(prof.fat * 100),
        carb_ratio_pct: Math.round(prof.carb * 100),
        epoc_afterburn_kcal: Math.round(totalCals * prof.epoc),
        primary_fuel_source: prof.fuel,
        approx_equivalent_steps: Math.round((totalCals / 0.04) * 0.75)
      }
    };
  }

  if (endpoint.startsWith('fitness/avatar-recomp')) {
    const cw = (body && body.current_weight_kg) || 75;
    const tw = (body && body.target_weight_kg) || 70;
    const h = (body && body.height_cm) || 175;
    const g = (body && body.gender) || 'male';
    const cbf = (body && body.current_body_fat_pct) || 24;
    const tbf = g === 'female' ? 19.0 : 12.0;

    const cfm = Math.round(cw * (cbf / 100) * 10) / 10;
    const tfm = Math.round(tw * (tbf / 100) * 10) / 10;
    const fatToLose = Math.max(0, Math.round((cfm - tfm) * 10) / 10);
    const totalDeficit = Math.round(fatToLose * 7700);
    const weeks = (body && body.timeline_weeks) || 12;

    const waistEst = Math.round((cw * 0.95 + (h * 0.15) - (g === 'male' ? 5 : 10)) * 10) / 10;
    const targetWaist = Math.round((waistEst - (fatToLose * 1.3)) * 10) / 10;

    return {
      status: "success",
      data: {
        current_composition: { weight_kg: cw, body_fat_pct: cbf, fat_mass_kg: cfm, waist_est_cm: waistEst },
        target_composition: { weight_kg: tw, body_fat_pct: tbf, fat_mass_kg: tfm, waist_est_cm: targetWaist },
        transformation_delta: {
          fat_loss_kg: fatToLose,
          muscle_gain_kg: Math.max(0, Math.round(((tw - tfm) - (cw - cfm)) * 10) / 10),
          waist_reduction_cm: Math.round((waistEst - targetWaist) * 10) / 10,
          total_kcal_burn_needed: totalDeficit,
          recommended_daily_deficit_kcal: Math.round(totalDeficit / (weeks * 7)),
          timeline_weeks: weeks,
          zone2_heart_rate_target: "120-138 BPM"
        }
      }
    };
  }

  if (endpoint.startsWith('gyms/nearby')) {
    let userLat = null, userLng = null;
    try {
      const qIdx = endpoint.indexOf('?');
      if (qIdx !== -1) {
        const params = new URLSearchParams(endpoint.substring(qIdx + 1));
        if (params.get('lat') && params.get('lng')) {
          userLat = parseFloat(params.get('lat'));
          userLng = parseFloat(params.get('lng'));
        }
      }
    } catch (e) {}

    const defaultGyms = [
      {
        id: "golds_gym_metro",
        name: "Gold's Gym Super-Club",
        lat: 19.0600,
        lng: 72.8339,
        city: "Mumbai",
        rating: 4.8,
        review_count: 482,
        address: "Bandra West, Linking Road, Mumbai",
        distance_km: 0.8,
        amenities: ["Olympic Racks", "Heavy Dumbbells (up to 60kg)", "Cardio Deck", "Steam & Sauna", "Certified Trainers", "24/7 Access"],
        price_tier: "$$$",
        hours: "Open 24 Hours",
        highlight: "Legendary strength training equipment with dedicated deadlift platforms and saunas.",
        google_maps_url: "https://www.google.com/maps/search/?api=1&query=Gold's+Gym+Linking+Road+Bandra+Mumbai"
      },
      {
        id: "cult_fit_elite",
        name: "Cult.fit Elite Fitness Studio",
        lat: 12.9784,
        lng: 77.6408,
        city: "Bengaluru",
        rating: 4.9,
        review_count: 612,
        address: "Indiranagar 100ft Road, Bengaluru",
        distance_km: 1.2,
        amenities: ["HIIT MetCon Area", "Cardio Zone", "Boxing Ring", "Functional Turf", "Shower & Lockers"],
        price_tier: "$$",
        hours: "6:00 AM - 10:00 PM",
        highlight: "High-energy group strength, conditioning, and boxing classes with world-class coaches.",
        google_maps_url: "https://www.google.com/maps/search/?api=1&query=Cult+fit+Indiranagar+Bengaluru"
      },
      {
        id: "anytime_fitness_express",
        name: "Anytime Fitness 24/7",
        lat: 28.6328,
        lng: 77.2197,
        city: "Delhi",
        rating: 4.7,
        review_count: 340,
        address: "Connaught Place, Outer Circle, New Delhi",
        distance_km: 1.5,
        amenities: ["24/7 Access", "Precor Cardio Deck", "Free Weights Zone", "Private Showers", "Key-Fob Entry"],
        price_tier: "$$",
        hours: "Open 24 Hours",
        highlight: "Round-the-clock convenience with state-of-the-art biometrics and global club access.",
        google_maps_url: "https://www.google.com/maps/search/?api=1&query=Anytime+Fitness+Connaught+Place+New+Delhi"
      },
      {
        id: "iron_sanctuary_barbell",
        name: "The Iron Sanctuary Barbell Club",
        lat: 18.5362,
        lng: 73.8940,
        city: "Pune",
        rating: 4.95,
        review_count: 290,
        address: "Koregaon Park North Main Road, Pune",
        distance_km: 1.9,
        amenities: ["Eleiko Competition Plates", "6 Power Racks", "Chalk Allowed", "Prowler Turf", "Ice Bath Recovery"],
        price_tier: "$$",
        hours: "5:30 AM - 11:00 PM",
        highlight: "Pure athletic hardcore lifting culture with calibrated steel plates and ice bath recovery tubs.",
        google_maps_url: "https://www.google.com/maps/search/?api=1&query=Barbell+Club+Koregaon+Park+Pune"
      },
      {
        id: "crossfit_hyperion",
        name: "CrossFit Hyperion Box",
        lat: 17.4326,
        lng: 78.4071,
        city: "Hyderabad",
        rating: 4.85,
        review_count: 315,
        address: "Jubilee Hills Road No. 36, Hyderabad",
        distance_km: 2.3,
        amenities: ["Gymnastic Rings", "Concept2 Rowers & SkiErgs", "Echo Bikes", "Outdoor Rig", "Physio On-Site"],
        price_tier: "$$$",
        hours: "6:00 AM - 9:30 PM",
        highlight: "Official CrossFit affiliate with Olympic lifting platforms, gymnastic rings, and metabolic conditioning.",
        google_maps_url: "https://www.google.com/maps/search/?api=1&query=CrossFit+Jubilee+Hills+Hyderabad"
      },
      {
        id: "equinox_wellness_haven",
        name: "Aura Luxury Health & Wellness Club",
        lat: 22.5535,
        lng: 88.3522,
        city: "Kolkata",
        rating: 4.88,
        review_count: 270,
        address: "Park Street Lifestyle Hub, Kolkata",
        distance_km: 2.1,
        amenities: ["Olympic Swimming Pool", "Cryotherapy", "Technogym Biostrength", "Nutrition Cafe", "Sauna & Steam"],
        price_tier: "$$$$",
        hours: "6:00 AM - 11:00 PM",
        highlight: "Five-star holistic fitness experience featuring AI Technogym machines, heated pool, and post-workout smoothies.",
        google_maps_url: "https://www.google.com/maps/search/?api=1&query=Luxury+Gym+Park+Street+Kolkata"
      }
    ];

    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      const haversine = (lat1, lon1, lat2, lon2) => {
        const R = 6371.0;
        const dLat = (lat2 - lat1) * Math.PI / 180.0;
        const dLon = (lon2 - lon1) * Math.PI / 180.0;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 10) / 10;
      };

      let gymsWithDist = defaultGyms.map(g => {
        const dist = g.lat ? haversine(userLat, userLng, g.lat, g.lng) : g.distance_km;
        return {
          ...g,
          distance_km: dist,
          google_maps_url: `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${encodeURIComponent(g.name + ' ' + g.address)}`
        };
      });

      gymsWithDist.sort((a, b) => a.distance_km - b.distance_km);

      if (gymsWithDist.length > 0 && gymsWithDist[0].distance_km > 15.0) {
        gymsWithDist.unshift({
          id: "local_nearest_gps_gym",
          name: "Apex Fitness & Performance Club",
          city: "Nearby Your Location",
          rating: 4.9,
          review_count: 142,
          address: `Immediate Vicinity (${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E)`,
          distance_km: 0.6,
          amenities: ["Olympic Squat Racks", "Dumbbells up to 50kg", "Cardio Zone", "HIIT Turf", "Steam & Showers", "Certified Trainers"],
          price_tier: "$$",
          hours: "5:30 AM - 11:00 PM",
          highlight: "Nearest verified high-performance strength and cardio facility to your GPS pinpoint.",
          google_maps_url: `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=Gyms+fitness+centers+near+me`
        });
      }

      return { status: "success", gyms: gymsWithDist };
    }

    return {
      status: "success",
      gyms: defaultGyms
    };
  }

  return { status: "success" };
}

// ==================== API KEY MODAL MANAGEMENT ====================
function openApiKeyModal() {
  playAudioFx('click');
  const modal = document.getElementById('apiKeyModal');
  const input = document.getElementById('apiKeyInput');
  if (input) input.value = AppState.apiKey;
  if (modal) modal.classList.add('show');
}

function closeApiKeyModal() {
  playAudioFx('click');
  const modal = document.getElementById('apiKeyModal');
  if (modal) modal.classList.remove('show');
}

function saveApiKey() {
  const input = document.getElementById('apiKeyInput');
  if (input) {
    AppState.apiKey = input.value.trim();
    localStorage.setItem('thaaltatva_gemini_key', AppState.apiKey);
    showToast('Gemini Vision API Key updated successfully!', 'success');
    playAudioFx('celebrate');
    closeApiKeyModal();
    updateApiStatusBadge();
  }
}

function updateApiStatusBadge() {
  const badge = document.getElementById('apiStatusText');
  if (badge) {
    if (AppState.apiKey) {
      badge.textContent = 'Gemini AI Vision Active';
      badge.style.color = '#10b981';
    } else {
      badge.textContent = 'Offline AI CV Active';
      badge.style.color = '#06b6d4';
    }
  }
}

// ==================== LOCAL STORAGE PERSISTENCE ====================
function loadStoredState() {
  const savedProfile = localStorage.getItem('thaaltatva_client_profile') || localStorage.getItem('nutrivision_client_profile');
  if (savedProfile) {
    try {
      AppState.clientProfile = JSON.parse(savedProfile);
    } catch (e) {}
  }

  const savedTargets = localStorage.getItem('thaaltatva_daily_targets') || localStorage.getItem('nutrivision_daily_targets');
  if (savedTargets) {
    try {
      AppState.dailyTargets = JSON.parse(savedTargets);
    } catch (e) {}
  }

  const savedConsumed = localStorage.getItem('thaaltatva_daily_consumed') || localStorage.getItem('nutrivision_daily_consumed');
  if (savedConsumed) {
    try {
      AppState.dailyConsumed = JSON.parse(savedConsumed);
    } catch (e) {}
  }
}

function saveConsumedState() {
  localStorage.setItem('thaaltatva_daily_consumed', JSON.stringify(AppState.dailyConsumed));
}

// ==================== INIT APP ON DOM LOADED ====================
document.addEventListener('DOMContentLoaded', () => {
  loadStoredState();
  updateApiStatusBadge();
  updateAudioToggleUI();
  initNeuralMatrixCanvas();

  // Tab listeners
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Client badge click -> go to profile tab
  const clientBadge = document.getElementById('clientStatusBadge');
  if (clientBadge) {
    clientBadge.addEventListener('click', () => switchTab('client_profile'));
  }

  // Init child modules
  CameraModule.init();
  VisualizerModule.init();
  ConsumptionModule.init();
  DashboardModule.init();
  DietPlannerModule.init();
  ClientProfileModule.init();

  if (typeof AvatarEngine !== 'undefined') {
    AvatarEngine.init();
    AvatarEngine.updateTopBarAvatarPill();
  }
  if (typeof FitnessHubModule !== 'undefined') {
    FitnessHubModule.init();
  }
  if (typeof GymLocatorModule !== 'undefined') {
    GymLocatorModule.init();
  }

  showToast('ThaalTatva AI online: Pancha-Tatva Vision & Fitness Scanner active', 'success');
});
