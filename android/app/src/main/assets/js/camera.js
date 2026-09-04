/**
 * ThaalTatva AI - Holographic Camera Stream & Plate Capture Controller
 */

const CameraModule = {
  videoStream: null,
  isCameraActive: false,
  currentPresetId: 'indian_thali_pre',
  facingMode: 'environment',

  init() {
    this.bindEvents();
    this.loadPresets();
  },

  bindEvents() {
    const startCamBtn = document.getElementById('startCameraBtn');
    const toggleLiveCamBtn = document.getElementById('toggleLiveCamBtn');
    const livePhotoCaptureBtn = document.getElementById('livePhotoCaptureBtn');
    const mobileSnapBtn = document.getElementById('mobileSnapBtn');
    const shutterBtn = document.getElementById('shutterBtn');
    const switchCamBtn = document.getElementById('switchCameraBtn');
    const uploadInput = document.getElementById('plateFileInput');
    const uploadTrigger = document.getElementById('uploadTriggerBtn');

    if (startCamBtn) {
      startCamBtn.addEventListener('click', () => {
        playAudioFx('click');
        this.toggleCamera();
      });
    }

    if (toggleLiveCamBtn) {
      toggleLiveCamBtn.addEventListener('click', () => {
        playAudioFx('click');
        this.toggleCamera();
      });
    }

    if (livePhotoCaptureBtn) {
      livePhotoCaptureBtn.addEventListener('click', async () => {
        playAudioFx('click');
        if (!this.isCameraActive) {
          await this.startCamera();
        } else {
          this.captureSnapshot();
        }
      });
    }

    if (mobileSnapBtn && uploadInput) {
      mobileSnapBtn.addEventListener('click', () => {
        playAudioFx('click');
        uploadInput.click();
      });
    }

    if (shutterBtn) {
      shutterBtn.addEventListener('click', async () => {
        playAudioFx('shutter');
        if (!this.isCameraActive) {
          showToast('Activating live camera... Tap shutter again to snap!', 'info');
          const started = await this.startCamera();
          if (!started && uploadInput) {
            uploadInput.click();
          }
        } else {
          this.captureSnapshot();
        }
      });
    }

    if (switchCamBtn) {
      switchCamBtn.addEventListener('click', () => {
        playAudioFx('toggle');
        this.switchFacingMode();
      });
    }

    if (uploadTrigger && uploadInput) {
      uploadTrigger.addEventListener('click', () => {
        playAudioFx('click');
        uploadInput.click();
      });
      uploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }
  },

  async toggleCamera() {
    if (this.isCameraActive) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  },

  async startCamera() {
    const video = document.getElementById('cameraVideo');
    const imgDisplay = document.getElementById('plateImageDisplay');
    const startCamBtn = document.getElementById('startCameraBtn');
    const toggleLiveCamBtn = document.getElementById('toggleLiveCamBtn');
    const livePhotoCaptureBtn = document.getElementById('livePhotoCaptureBtn');
    const shutterBtn = document.getElementById('shutterBtn');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Live camera API not supported on this browser. Launching device camera...', 'warning');
      const uploadInput = document.getElementById('plateFileInput');
      if (uploadInput) uploadInput.click();
      return false;
    }

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      video.srcObject = this.videoStream;
      await video.play();
      video.style.display = 'block';
      imgDisplay.style.display = 'none';

      this.isCameraActive = true;
      if (startCamBtn) startCamBtn.classList.add('active');
      if (toggleLiveCamBtn) toggleLiveCamBtn.innerHTML = '<span>⏹️</span> Stop Camera';
      if (livePhotoCaptureBtn) livePhotoCaptureBtn.innerHTML = '<span>⚡</span> Snap Live Frame';
      if (shutterBtn) shutterBtn.classList.add('camera-live');

      showToast('Live Realtime Camera Feed Active — Tap shutter to snap photo!', 'success');

      const telemetry = document.getElementById('telemetryFeedText');
      if (telemetry) telemetry.textContent = 'Realtime HD video stream online • Auto-focusing plate centroid • Ready to snap';
      return true;
    } catch (err) {
      console.warn('Camera access error:', err);
      showToast('Camera access unavailable or denied. Opening device camera picker...', 'warning');
      const uploadInput = document.getElementById('plateFileInput');
      if (uploadInput) uploadInput.click();
      return false;
    }
  },

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    const video = document.getElementById('cameraVideo');
    const imgDisplay = document.getElementById('plateImageDisplay');
    const startCamBtn = document.getElementById('startCameraBtn');
    const toggleLiveCamBtn = document.getElementById('toggleLiveCamBtn');
    const livePhotoCaptureBtn = document.getElementById('livePhotoCaptureBtn');
    const shutterBtn = document.getElementById('shutterBtn');

    if (video) video.style.display = 'none';
    if (imgDisplay) imgDisplay.style.display = 'block';
    this.isCameraActive = false;
    if (startCamBtn) startCamBtn.classList.remove('active');
    if (toggleLiveCamBtn) toggleLiveCamBtn.innerHTML = '<span>📷</span> Start Live Camera';
    if (livePhotoCaptureBtn) livePhotoCaptureBtn.innerHTML = '<span>📸</span> Realtime Photo';
    if (shutterBtn) shutterBtn.classList.remove('camera-live');
  },

  async switchFacingMode() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    if (this.isCameraActive) {
      this.stopCamera();
      await this.startCamera();
    }
  },

  captureSnapshot() {
    const video = document.getElementById('cameraVideo');
    const imgDisplay = document.getElementById('plateImageDisplay');

    if (this.isCameraActive && video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 800;
      canvas.height = video.videoHeight || 800;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      this.stopCamera();
      imgDisplay.src = dataUrl;
      imgDisplay.style.display = 'block';

      showToast('📸 Realtime photo captured! Running Pancha-Tatva vision analysis...', 'success');
      playAudioFx('celebrate');
      this.processPlateImage(dataUrl);
    } else {
      // If camera was inactive, prompt camera start or process current view
      if (imgDisplay && imgDisplay.src) {
        showToast('Analyzing active plate photo...', 'info');
        this.processPlateImage(imgDisplay.src);
      }
    }
  },

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const imgDisplay = document.getElementById('plateImageDisplay');
      if (imgDisplay) {
        imgDisplay.src = dataUrl;
        imgDisplay.style.display = 'block';
      }
      this.stopCamera();
      this.processPlateImage(dataUrl);
    };
    reader.readAsDataURL(file);
  },

  async loadPresets() {
    try {
      const data = await apiRequest('presets');
      const carousel = document.getElementById('presetCarousel');
      if (!carousel) return;

      carousel.innerHTML = '';
      data.presets.forEach((preset) => {
        const card = document.createElement('div');
        card.className = `preset-thumb-card ${preset.id === this.currentPresetId ? 'active' : ''}`;
        card.dataset.presetId = preset.id;
        card.dataset.type = preset.type;
        card.innerHTML = `
          <img src="${preset.image_url}" alt="${preset.title}" loading="lazy" />
          <p>${preset.title}</p>
          <span>${preset.cuisine} • ${preset.diet_type}</span>
        `;
        card.addEventListener('click', () => {
          playAudioFx('click');
          this.selectPreset(preset);
        });
        carousel.appendChild(card);
      });

      // Automatically load the first preset plate
      if (data.presets.length > 0) {
        this.selectPreset(data.presets[0]);
      }
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  },

  async selectPreset(preset) {
    this.currentPresetId = preset.id;
    this.stopCamera();

    document.querySelectorAll('.preset-thumb-card').forEach(c => {
      c.classList.toggle('active', c.dataset.presetId === preset.id);
    });

    const imgDisplay = document.getElementById('plateImageDisplay');
    if (imgDisplay) {
      imgDisplay.src = preset.image_url;
      imgDisplay.style.display = 'block';
    }

    await this.processPlateImage(preset.id);
  },

  async processPlateImage(imageInput) {
    const scanBeam = document.getElementById('scanBeam');
    if (scanBeam) scanBeam.classList.add('active');

    const telemetry = document.getElementById('telemetryFeedText');
    if (telemetry) telemetry.textContent = 'Scanning plate • Isolating distinct food regions & estimating grams...';
    playAudioFx('scan');

    try {
      const payload = {
        image: imageInput,
        api_key: AppState.apiKey || null
      };

      const response = await apiRequest('analyze-plate', 'POST', payload);
      if (response && response.data) {
        AppState.currentPlateAnalysis = response.data;
        VisualizerModule.renderAnalysis(response.data);
        showToast(`Detected: ${response.data.meal_name} (${Math.round(response.data.totals.calories)} kcal)`, 'success');
      }
    } catch (err) {
      showToast('Plate analysis failed. Please try again.', 'error');
      if (telemetry) telemetry.textContent = 'Vision analysis timeout. Using heuristic CV database fallback.';
    } finally {
      if (scanBeam) scanBeam.classList.remove('active');
    }
  }
};
