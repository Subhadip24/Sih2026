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
  }
}

// ==================== API FETCH HELPER ====================
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`/api/${endpoint}`, options);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'API Request Failed');
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    showToast(err.message, 'error');
    throw err;
  }
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

  showToast('ThaalTatva AI online: Pancha-Tatva Vision Scanner active', 'success');
});
