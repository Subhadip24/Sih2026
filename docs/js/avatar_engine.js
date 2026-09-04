/**
 * ThaalTatva AI - 3D/SVG Procedural Avatar & Morphing Recomposition Engine
 * Generates dynamic human physique silhouettes (current vs aesthetic fit self)
 * and animates the transformation with physiological metrics.
 */

const AvatarEngine = {
  currentMorphProgress: 0, // 0 = Current, 1 = Fit
  recompData: null,

  init() {
    this.bindEvents();
    // Check if user has visited or completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('thaaltatva_onboarding_done');
    if (!hasCompletedOnboarding) {
      // Show onboarding on first visit after slight delay
      setTimeout(() => {
        this.openModal(true);
      }, 900);
    }
  },

  bindEvents() {
    // Top bar & sidebar avatar modal trigger buttons
    const triggerBtns = document.querySelectorAll('.open-avatar-modal-btn');
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal(false);
      });
    });

    const closeBtn = document.getElementById('closeAvatarModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    const modalBackdrop = document.getElementById('avatarModalBackdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeModal();
      });
    }

    // Interactive Morph Slider
    const morphSlider = document.getElementById('avatarMorphSlider');
    if (morphSlider) {
      morphSlider.addEventListener('input', (e) => {
        this.currentMorphProgress = parseFloat(e.target.value) / 100.0;
        this.renderAvatar();
        this.updateMorphTelemetry();
      });
    }

    // Toggle Before / After quick buttons
    const btnCurrent = document.getElementById('btnViewCurrentAvatar');
    const btnFit = document.getElementById('btnViewFitAvatar');
    if (btnCurrent && btnFit && morphSlider) {
      btnCurrent.addEventListener('click', () => {
        playAudioFx('toggle');
        morphSlider.value = 0;
        this.currentMorphProgress = 0;
        this.renderAvatar();
        this.updateMorphTelemetry();
      });
      btnFit.addEventListener('click', () => {
        playAudioFx('celebrate');
        morphSlider.value = 100;
        this.currentMorphProgress = 1.0;
        this.renderAvatar();
        this.updateMorphTelemetry();
      });
    }

    // Form inputs auto-refresh
    ['intakeName', 'intakeGender', 'intakeAge', 'intakeHeight', 'intakeWeight', 'intakeTargetWeight', 'intakeBodyFat', 'intakeGoal', 'intakeWeeks'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          this.recalculateRecomp();
        });
        el.addEventListener('change', () => {
          playAudioFx('click');
          this.recalculateRecomp();
        });
      }
    });

    // Animate morph button
    const playMorphBtn = document.getElementById('playMorphAnimationBtn');
    if (playMorphBtn) {
      playMorphBtn.addEventListener('click', () => {
        this.playTransformationSequence();
      });
    }

    // Commit & Apply Protocol Button
    const applyBtn = document.getElementById('applyTransformationProtocolBtn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyProtocolToApp();
      });
    }
  },

  openModal(isOnboarding = false) {
    playAudioFx('shutter');
    const modal = document.getElementById('avatarModal');
    const titleEl = document.getElementById('avatarModalTitle');
    const subtitleEl = document.getElementById('avatarModalSubtitle');

    if (titleEl && subtitleEl) {
      if (isOnboarding) {
        titleEl.textContent = 'Welcome to ThaalTatva AI: Personalized Body Assessment';
        subtitleEl.textContent = 'Enter your stats to sculpt your customized aesthetic avatar and metabolic blueprint';
      } else {
        titleEl.textContent = '🧬 3D Body Recomposition & Avatar Transformation';
        subtitleEl.textContent = 'Visualize your physique transformation and calibrate your fat-burning calorie budget';
      }
    }

    // Populate current values from AppState
    this.populateFormFromState();
    this.recalculateRecomp();

    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal() {
    playAudioFx('click');
    const modal = document.getElementById('avatarModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  populateFormFromState() {
    const p = AppState.clientProfile;
    const nameEl = document.getElementById('intakeName');
    const genderEl = document.getElementById('intakeGender');
    const ageEl = document.getElementById('intakeAge');
    const heightEl = document.getElementById('intakeHeight');
    const weightEl = document.getElementById('intakeWeight');
    const targetWeightEl = document.getElementById('intakeTargetWeight');
    const goalEl = document.getElementById('intakeGoal');

    if (nameEl && !nameEl.value) nameEl.value = 'Aesthetic Athlete';
    if (genderEl) genderEl.value = p.gender || 'male';
    if (ageEl) ageEl.value = p.age || 25;
    if (heightEl) heightEl.value = p.height_cm || 175;
    if (weightEl) weightEl.value = p.current_weight_kg || 75;
    if (targetWeightEl) targetWeightEl.value = p.target_weight_kg || 70;
    if (goalEl) goalEl.value = p.goal || 'lean_hypertrophy';
  },

  async recalculateRecomp() {
    const gender = document.getElementById('intakeGender')?.value || 'male';
    const age = parseInt(document.getElementById('intakeAge')?.value || 25);
    const height_cm = parseFloat(document.getElementById('intakeHeight')?.value || 175);
    const current_weight_kg = parseFloat(document.getElementById('intakeWeight')?.value || 75);
    const target_weight_kg = parseFloat(document.getElementById('intakeTargetWeight')?.value || 70);
    const current_body_fat_pct = parseFloat(document.getElementById('intakeBodyFat')?.value || 24);
    const goal = document.getElementById('intakeGoal')?.value || 'lean_hypertrophy';
    const timeline_weeks = parseInt(document.getElementById('intakeWeeks')?.value || 12);

    const payload = {
      current_weight_kg,
      target_weight_kg,
      height_cm,
      gender,
      current_body_fat_pct,
      goal,
      timeline_weeks
    };

    try {
      const res = await apiRequest('fitness/avatar-recomp', 'POST', payload);
      if (res && res.data) {
        this.recompData = res.data;
        this.renderAvatar();
        this.updateMorphTelemetry();
      }
    } catch (e) {
      console.error('Recomp calculation error:', e);
    }
  },

  playTransformationSequence() {
    playAudioFx('scan');
    const slider = document.getElementById('avatarMorphSlider');
    let startVal = 0;
    const duration = 1800; // ms
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // Smooth easeInOutCubic
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.currentMorphProgress = eased;
      if (slider) slider.value = Math.round(eased * 100);
      this.renderAvatar();
      this.updateMorphTelemetry();

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        playAudioFx('celebrate');
        triggerCelebration();
      }
    };

    requestAnimationFrame(animate);
  },

  renderAvatar() {
    const canvas = document.getElementById('avatarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const t = this.currentMorphProgress; // 0 = current, 1 = fit
    const gender = document.getElementById('intakeGender')?.value || 'male';

    // Base body scales interpolated between Current and Target
    let waistScale, shoulderScale, chestScale, quadScale, postureOffset, absAlpha;

    if (gender === 'female') {
      // Female aesthetic Hourglass morph
      waistScale = (1.25 - (t * 0.45));     // Cinches waist
      shoulderScale = (0.95 + (t * 0.15));  // Toned delts
      chestScale = (0.90 + (t * 0.15));     // Posture & lift
      quadScale = (1.0 + (t * 0.35));       // Sculpted glutes & quads
      postureOffset = (1.0 - t) * 6;        // Slouch vs erect posture
      absAlpha = t * 0.85;                  // Visible abdominal tone
    } else {
      // Male aesthetic V-Taper morph
      waistScale = (1.30 - (t * 0.50));     // Dramatic waist reduction
      shoulderScale = (1.0 + (t * 0.32));   // Broad cap deltoids & lats
      chestScale = (0.85 + (t * 0.35));     // Upper chest fullness
      quadScale = (0.95 + (t * 0.30));      // Teardrop quad definition
      postureOffset = (1.0 - t) * 8;
      absAlpha = t * 0.95;                  // Six-pack definition
    }

    const cx = w / 2;
    const cy = h / 2 + 10;

    // Background Hologram Grid & Radial Glow
    const bgGlow = ctx.createRadialGradient(cx, cy - 30, 20, cx, cy, 180);
    if (t > 0.6) {
      bgGlow.addColorStop(0, 'rgba(0, 245, 155, 0.22)');
      bgGlow.addColorStop(0.6, 'rgba(0, 242, 254, 0.12)');
      bgGlow.addColorStop(1, 'transparent');
    } else {
      bgGlow.addColorStop(0, 'rgba(255, 183, 3, 0.16)');
      bgGlow.addColorStop(0.6, 'rgba(255, 0, 127, 0.08)');
      bgGlow.addColorStop(1, 'transparent');
    }
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, w, h);

    // Anatomical Silhouette Gradient
    const bodyGrad = ctx.createLinearGradient(0, 40, 0, h - 30);
    if (t > 0.5) {
      bodyGrad.addColorStop(0, '#00f2fe');
      bodyGrad.addColorStop(0.4, '#00f59b');
      bodyGrad.addColorStop(1, '#0575e6');
    } else {
      bodyGrad.addColorStop(0, '#ffb703');
      bodyGrad.addColorStop(0.5, '#fb8500');
      bodyGrad.addColorStop(1, '#d90429');
    }

    ctx.save();
    ctx.translate(0, postureOffset);

    // Draw Head
    ctx.beginPath();
    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = t > 0.5 ? '#00f59b' : '#ffb703';
    ctx.shadowBlur = 15;
    ctx.ellipse(cx, 60, 24, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Neck
    ctx.beginPath();
    ctx.rect(cx - 10, 85, 20, 22);
    ctx.fill();

    // Draw Torso & Shoulders
    ctx.beginPath();
    const shoulderW = 55 * shoulderScale;
    const chestW = 50 * chestScale;
    const waistW = 38 * waistScale;
    const hipW = gender === 'female' ? (48 * quadScale) : (38 + t * 4);

    // Shoulders
    ctx.moveTo(cx - shoulderW, 115);
    // Upper chest
    ctx.quadraticCurveTo(cx - chestW, 150, cx - waistW, 195);
    // Hips
    ctx.quadraticCurveTo(cx - hipW, 235, cx - (hipW - 8), 260);
    // Inseam crotch
    ctx.lineTo(cx, 268);
    // Right Hips
    ctx.lineTo(cx + (hipW - 8), 260);
    ctx.quadraticCurveTo(cx + hipW, 235, cx + waistW, 195);
    // Right Upper Chest
    ctx.quadraticCurveTo(cx + chestW, 150, cx + shoulderW, 115);
    // Traps / Clavicle
    ctx.lineTo(cx + 12, 107);
    ctx.lineTo(cx - 12, 107);
    ctx.closePath();
    ctx.fill();

    // Arms
    const armW = 14 + (t * 6);
    // Left Arm
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW, 115);
    ctx.quadraticCurveTo(cx - shoulderW - armW, 180, cx - shoulderW - 10, 250);
    ctx.lineTo(cx - shoulderW - 2, 250);
    ctx.quadraticCurveTo(cx - shoulderW + 6, 180, cx - shoulderW + 8, 125);
    ctx.closePath();
    ctx.fill();

    // Right Arm
    ctx.beginPath();
    ctx.moveTo(cx + shoulderW, 115);
    ctx.quadraticCurveTo(cx + shoulderW + armW, 180, cx + shoulderW + 10, 250);
    ctx.lineTo(cx + shoulderW + 2, 250);
    ctx.quadraticCurveTo(cx + shoulderW - 6, 180, cx + shoulderW - 8, 125);
    ctx.closePath();
    ctx.fill();

    // Legs (Thighs & Calves)
    const thighW = (18 * quadScale);
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(cx - (hipW - 8), 260);
    ctx.quadraticCurveTo(cx - thighW - 14, 330, cx - 18, 385);
    ctx.lineTo(cx - 8, 385);
    ctx.quadraticCurveTo(cx - 6, 330, cx - 2, 268);
    ctx.closePath();
    ctx.fill();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(cx + (hipW - 8), 260);
    ctx.quadraticCurveTo(cx + thighW + 14, 330, cx + 18, 385);
    ctx.lineTo(cx + 8, 385);
    ctx.quadraticCurveTo(cx + 6, 330, cx + 2, 268);
    ctx.closePath();
    ctx.fill();

    // Anatomical Muscle Grooves & Core Definition (when morphing towards fit)
    if (absAlpha > 0.05) {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00f2fe';
      ctx.strokeStyle = `rgba(255, 255, 255, ${absAlpha * 0.75})`;
      ctx.lineWidth = 1.8;

      // Clavicles
      ctx.beginPath();
      ctx.moveTo(cx - 30 * shoulderScale, 118);
      ctx.lineTo(cx, 124);
      ctx.lineTo(cx + 30 * shoulderScale, 118);
      ctx.stroke();

      // Pectoral / Chest Underlines
      ctx.beginPath();
      ctx.moveTo(cx - 32 * chestScale, 150);
      ctx.quadraticCurveTo(cx - 15, 158, cx - 2, 154);
      ctx.moveTo(cx + 32 * chestScale, 150);
      ctx.quadraticCurveTo(cx + 15, 158, cx + 2, 154);
      ctx.stroke();

      // Linea Alba (Center Abs Line)
      ctx.beginPath();
      ctx.moveTo(cx, 155);
      ctx.lineTo(cx, 225);
      ctx.stroke();

      // Six-Pack Transverse Lines
      [172, 189, 207].forEach(y => {
        const span = 14 * waistScale;
        ctx.beginPath();
        ctx.moveTo(cx - span, y);
        ctx.lineTo(cx + span, y);
        ctx.stroke();
      });

      // V-Taper Iliac Crest / Apollo's Belt Lines
      ctx.beginPath();
      ctx.moveTo(cx - 24, 218);
      ctx.lineTo(cx - 4, 245);
      ctx.moveTo(cx + 24, 218);
      ctx.lineTo(cx + 4, 245);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();

    // Status Hologram Pill Overlay
    ctx.save();
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillStyle = t > 0.5 ? '#00f59b' : '#ffd166';
    ctx.textAlign = 'center';
    const label = t === 0 ? 'CURRENT PHYSIQUE' : (t === 1 ? 'FUTURE AESTHETIC SHRED' : `TRANSFORMING (${Math.round(t * 100)}%)`);
    ctx.fillText(label, cx, 28);
    ctx.restore();
  },

  updateMorphTelemetry() {
    if (!this.recompData) return;

    const t = this.currentMorphProgress;
    const delta = this.recompData.transformation_delta;
    const curr = this.recompData.current_composition;
    const target = this.recompData.target_composition;

    // Interpolated metrics based on slider progress
    const interpWeight = (curr.weight_kg - (t * (curr.weight_kg - target.weight_kg))).toFixed(1);
    const interpBF = (curr.body_fat_pct - (t * (curr.body_fat_pct - target.body_fat_pct))).toFixed(1);
    const interpWaist = (curr.waist_est_cm - (t * delta.waist_reduction_cm)).toFixed(1);

    const weightEl = document.getElementById('morphDisplayWeight');
    const bfEl = document.getElementById('morphDisplayBF');
    const waistEl = document.getElementById('morphDisplayWaist');
    const fatToLoseEl = document.getElementById('morphDisplayFatToLose');
    const kcalDeficitEl = document.getElementById('morphDisplayKcalDeficit');
    const dailyDeficitEl = document.getElementById('morphDisplayDailyDeficit');
    const zone2El = document.getElementById('morphDisplayZone2');

    if (weightEl) weightEl.textContent = `${interpWeight} kg`;
    if (bfEl) bfEl.textContent = `${interpBF}%`;
    if (waistEl) waistEl.textContent = `${interpWaist} cm`;
    if (fatToLoseEl) fatToLoseEl.textContent = `-${delta.fat_loss_kg} kg Pure Fat`;
    if (kcalDeficitEl) kcalDeficitEl.textContent = `${delta.total_kcal_burn_needed.toLocaleString()} kcal`;
    if (dailyDeficitEl) dailyDeficitEl.textContent = `-${delta.recommended_daily_deficit_kcal} kcal/day`;
    if (zone2El) zone2El.textContent = delta.zone2_heart_rate_target;
  },

  async applyProtocolToApp() {
    playAudioFx('celebrate');
    triggerCelebration();

    const name = document.getElementById('intakeName')?.value || 'Aesthetic Athlete';
    const gender = document.getElementById('intakeGender')?.value || 'male';
    const age = parseInt(document.getElementById('intakeAge')?.value || 25);
    const height_cm = parseFloat(document.getElementById('intakeHeight')?.value || 175);
    const current_weight_kg = parseFloat(document.getElementById('intakeWeight')?.value || 75);
    const target_weight_kg = parseFloat(document.getElementById('intakeTargetWeight')?.value || 70);
    const goal = document.getElementById('intakeGoal')?.value || 'lean_hypertrophy';

    // Update AppState
    AppState.clientProfile = {
      ...AppState.clientProfile,
      name,
      gender,
      age,
      height_cm,
      current_weight_kg,
      target_weight_kg,
      goal
    };

    localStorage.setItem('thaaltatva_client_profile', JSON.stringify(AppState.clientProfile));
    localStorage.setItem('thaaltatva_onboarding_done', 'true');

    // Recalculate targets
    try {
      const res = await apiRequest('calculate-targets', 'POST', AppState.clientProfile);
      if (res && res.data) {
        AppState.dailyTargets = res.data.daily_targets;
        localStorage.setItem('thaaltatva_daily_targets', JSON.stringify(AppState.dailyTargets));
      }
    } catch (e) {}

    // Update Header Pill
    if (ClientProfileModule && ClientProfileModule.updateHeaderBadge) {
      ClientProfileModule.updateHeaderBadge();
    }
    this.updateTopBarAvatarPill();

    showToast(`⚡ Transformation Protocol Activated for ${name}!`, 'success');
    this.closeModal();

    // Switch to Dashboard
    if (typeof switchTab === 'function') {
      switchTab('dashboard');
    }
  },

  updateTopBarAvatarPill() {
    const pillName = document.getElementById('headerAvatarName');
    const pillStats = document.getElementById('headerAvatarStats');
    if (pillName && AppState.clientProfile) {
      pillName.textContent = AppState.clientProfile.name || 'Athlete';
    }
    if (pillStats && AppState.clientProfile) {
      const p = AppState.clientProfile;
      pillStats.textContent = `${p.current_weight_kg}kg ➔ ${p.target_weight_kg}kg (${p.gender === 'female' ? '♀' : '♂'})`;
    }
  }
};
