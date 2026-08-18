/**
 * NutriVision AI - Central State & Navigation Router
 */

const AppState = {
  activeTab: 'scanner',
  apiKey: localStorage.getItem('nutrivision_gemini_key') || '',
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

// Toast notification system
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

// Tab Switching
function switchTab(tabId) {
  AppState.activeTab = tabId;

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

// API Fetch Helper
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

// API Key Modal Management
function openApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  const input = document.getElementById('apiKeyInput');
  if (input) input.value = AppState.apiKey;
  if (modal) modal.classList.add('show');
}

function closeApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  if (modal) modal.classList.remove('show');
}

function saveApiKey() {
  const input = document.getElementById('apiKeyInput');
  if (input) {
    AppState.apiKey = input.value.trim();
    localStorage.setItem('nutrivision_gemini_key', AppState.apiKey);
    showToast('Gemini Vision API Key updated successfully!', 'success');
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

// Local Storage Persistence
function loadStoredState() {
  const savedProfile = localStorage.getItem('nutrivision_client_profile');
  if (savedProfile) {
    try {
      AppState.clientProfile = JSON.parse(savedProfile);
    } catch (e) {}
  }

  const savedTargets = localStorage.getItem('nutrivision_daily_targets');
  if (savedTargets) {
    try {
      AppState.dailyTargets = JSON.parse(savedTargets);
    } catch (e) {}
  }

  const savedConsumed = localStorage.getItem('nutrivision_daily_consumed');
  if (savedConsumed) {
    try {
      AppState.dailyConsumed = JSON.parse(savedConsumed);
    } catch (e) {}
  }
}

function saveConsumedState() {
  localStorage.setItem('nutrivision_daily_consumed', JSON.stringify(AppState.dailyConsumed));
}

// Init App on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  loadStoredState();
  updateApiStatusBadge();

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

  showToast('NutriVision AI ready: Vision detection & Leftover tracker online', 'success');
});
