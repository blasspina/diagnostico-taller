/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Main Application Bootstrap & Orchestrator
 * Compatible con ejecución directa local (file://) con doble clic desde Windows
 */

class App {
  constructor() {
    this.graphEngine = null;
    this.runnerView = null;
    this.matrixView = null;
    this.reportModal = null;
    this.editorModal = null;
    this.quickSearch = null;
  }

  init() {
    // 1. Check for recoverable session BEFORE initial tree load so it is not overwritten
    const recoverableSession = stateManager.getRecoverableSession();

    // 2. Initialize Views and Modals
    const runnerContainer = document.getElementById('runner-container');
    const graphContainer = document.getElementById('graph-container');
    const matrixContainer = document.getElementById('matrix-container');

    this.runnerView = new RunnerView(runnerContainer);
    this.graphEngine = new GraphEngine(graphContainer);
    this.matrixView = new MatrixView(matrixContainer);
    this.reportModal = new ReportModal();
    this.editorModal = new EditorModal();
    this.quickSearch = new QuickSearch();

    // 3. Setup Presets Selector Dropdown
    this._setupPresetSelector();

    // 4. Setup Navigation & View Modes
    this._setupViewModes();

    // 5. Setup Global Action Buttons
    this._setupGlobalActions();

    // 6. Load Initial Tree (with skipSave=true if a recoverable session is pending confirmation)
    if (recoverableSession) {
      stateManager.loadTree(PRESET_TREES[0], null, true);
      this._showSessionRecoveryModal(recoverableSession);
    } else {
      stateManager.loadTree(PRESET_TREES[0], null, false);
    }

    // 7. Handle Window Resizes for Graph
    window.addEventListener('resize', () => {
      if (this.graphEngine) {
        this.graphEngine.fitToScreen();
      }
    });

    console.log('⚡ Hardware Diagnostic Decision Matrix & Flow Engine PRO Loaded (file:// Ready).');
  }

  _setupPresetSelector() {
    const selector = document.getElementById('preset-selector');
    if (!selector) return;

    selector.innerHTML = PRESET_TREES.map((tree, idx) => `
      <option value="${tree.id}" ${idx === 0 ? 'selected' : ''}>
        ${tree.name}
      </option>
    `).join('');

    selector.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const found = PRESET_TREES.find(t => t.id === selectedId);
      if (found) {
        stateManager.loadTree(found);
      }
    });

    stateManager.on('treeLoaded', ({ tree }) => {
      if (selector.value !== tree.id) {
        let opt = selector.querySelector(`option[value="${tree.id}"]`);
        if (!opt) {
          opt = document.createElement('option');
          opt.value = tree.id;
          opt.textContent = `[Custom] ${tree.name}`;
          selector.appendChild(opt);
        }
        selector.value = tree.id;
      }
    });
  }

  _setupViewModes() {
    const mainWorkspace = document.getElementById('main-workspace');
    const runnerPane = document.getElementById('runner-pane');
    const graphPane = document.getElementById('graph-pane');
    const matrixPane = document.getElementById('matrix-pane');

    const modeButtons = {
      split: document.getElementById('btn-mode-split'),
      runner: document.getElementById('btn-mode-runner'),
      graph: document.getElementById('btn-mode-graph'),
      matrix: document.getElementById('btn-mode-matrix')
    };

    const mobileButtons = {
      runner: document.getElementById('btn-mob-runner'),
      graph: document.getElementById('btn-mob-graph'),
      matrix: document.getElementById('btn-mob-matrix')
    };

    const updateViewLayout = (mode) => {
      // 1. Update Desktop Header Mode Switcher
      Object.entries(modeButtons).forEach(([m, btn]) => {
        if (!btn) return;
        if (m === mode) {
          btn.className = 'px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/80 transition-all';
        } else {
          btn.className = 'px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 transition-all';
        }
      });

      // 2. Update Mobile Bottom Navigation Tabs
      const activeMobTab = (mode === 'split' || mode === 'runner') ? 'runner' : mode;
      Object.entries(mobileButtons).forEach(([m, btn]) => {
        if (!btn) return;
        if (m === activeMobTab) {
          btn.className = 'flex-1 h-full flex flex-col items-center justify-center gap-0.5 text-cyan-400 border-t-2 border-cyan-400 bg-cyan-950/25 font-semibold text-[11px] transition-all';
        } else {
          btn.className = 'flex-1 h-full flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-slate-200 border-t-2 border-transparent font-medium text-[11px] transition-all';
        }
      });

      // 3. Apply Pane Visibility & Layout
      if (mode === 'split') {
        mainWorkspace.classList.remove('hidden');
        matrixPane.classList.add('hidden');
        runnerPane.classList.remove('hidden', 'w-full');
        runnerPane.classList.add('w-full', 'lg:w-[46%]', 'xl:w-[42%]');
        graphPane.classList.remove('flex', 'w-full', 'h-full');
        graphPane.classList.add('hidden', 'lg:flex', 'flex-1');
        setTimeout(() => this.graphEngine?.fitToScreen(), 100);
      } else if (mode === 'runner') {
        mainWorkspace.classList.remove('hidden');
        matrixPane.classList.add('hidden');
        runnerPane.classList.remove('hidden', 'lg:w-[46%]', 'xl:w-[42%]');
        runnerPane.classList.add('w-full');
        graphPane.classList.remove('flex', 'lg:flex', 'w-full', 'h-full');
        graphPane.classList.add('hidden');
      } else if (mode === 'graph') {
        mainWorkspace.classList.remove('hidden');
        matrixPane.classList.add('hidden');
        runnerPane.classList.add('hidden');
        graphPane.classList.remove('hidden', 'lg:flex', 'flex-1');
        graphPane.classList.add('flex', 'w-full', 'h-full');
        setTimeout(() => {
          this.graphEngine?.fitToScreen();
          this.graphEngine?.focusActiveNode();
        }, 80);
      } else if (mode === 'matrix') {
        mainWorkspace.classList.add('hidden');
        matrixPane.classList.remove('hidden');
        this.matrixView?.render();
      }
    };

    Object.entries(modeButtons).forEach(([mode, btn]) => {
      btn?.addEventListener('click', () => {
        stateManager.setViewMode(mode);
      });
    });

    // Mobile Bottom Navigation Listeners
    mobileButtons.runner?.addEventListener('click', () => {
      stateManager.setViewMode(window.innerWidth < 1024 ? 'runner' : 'split');
    });
    mobileButtons.graph?.addEventListener('click', () => {
      stateManager.setViewMode('graph');
    });
    mobileButtons.matrix?.addEventListener('click', () => {
      stateManager.setViewMode('matrix');
    });

    stateManager.on('viewModeChanged', ({ mode }) => updateViewLayout(mode));
  }

  _setupGlobalActions() {
    const btnSound = document.getElementById('btn-toggle-sound');
    const updateSoundIcon = () => {
      if (!btnSound) return;
      if (audioEngine.isMuted) {
        btnSound.innerHTML = `
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
          <span class="hidden lg:inline text-slate-500">Silenciado</span>
        `;
        btnSound.title = 'Activar Sonidos de Laboratorio (Multímetro / Alarmas)';
      } else {
        btnSound.innerHTML = `
          <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
          <span class="hidden lg:inline text-slate-300">Audio</span>
        `;
        btnSound.title = 'Desactivar Sonidos';
      }
    };
    updateSoundIcon();

    btnSound?.addEventListener('click', () => {
      audioEngine.toggleMute();
      updateSoundIcon();
      if (!audioEngine.isMuted) {
        audioEngine.playContinuityBeep();
      }
    });

    document.getElementById('btn-global-reset')?.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar la sesión de diagnóstico actual?')) {
        stateManager.resetDiagnostic(true);
      }
    });

    document.getElementById('btn-open-calc')?.addEventListener('click', () => {
      this._openVoltageCalcModal();
    });

    document.getElementById('btn-open-report')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-report-modal'));
    });

    document.getElementById('btn-open-editor')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-editor-modal'));
    });
  }

  /**
   * Calculadora Rápida de Inyección de Tensión para Líneas en Corto
   * Permite seleccionar tensiones típicas (1.2V, 1.8V, 3.8V, 4.2V, etc.), ajustar amperaje
   * y calcular la potencia disipada (Watts) para proteger las pistas y el PCB.
   */
  _openVoltageCalcModal() {
    const existing = document.getElementById('voltage-calc-modal');
    if (existing) {
      existing.classList.remove('hidden');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'voltage-calc-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm';

    const railPresets = [
      { v: 0.8, a: 1.2, name: '0.8V', rail: 'VCORE / CPU' },
      { v: 1.2, a: 1.0, name: '1.2V', rail: 'VDDQ / LDO' },
      { v: 1.8, a: 1.0, name: '1.8V', rail: 'VIO / I2C' },
      { v: 3.3, a: 1.2, name: '3.3V', rail: '3V3 / PCH' },
      { v: 3.8, a: 1.5, name: '3.8V', rail: 'VBAT' },
      { v: 4.2, a: 1.5, name: '4.2V', rail: 'VPH_PWR' },
      { v: 5.0, a: 1.5, name: '5.0V', rail: 'VBUS USB' }
    ];

    const currentPresets = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

    modal.innerHTML = `
      <div class="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        <!-- Header -->
        <div class="p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-white leading-tight">
                Calculadora de Inyección de Tensión
              </h3>
              <p class="text-[11px] text-amber-300/80 font-mono-tech">
                Control de Potencia Disipada (P = V × I) en Cortos
              </p>
            </div>
          </div>
          <button id="btn-close-calc" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-4 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <!-- 1. Tensión de la Línea (Presets Rápidos) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                1. Tensión Nominal de la Línea (V)
              </label>
              <span id="calc-rail-badge" class="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                VPH_PWR (4.2V)
              </span>
            </div>
            <div class="grid grid-cols-4 sm:grid-cols-7 gap-1.5" id="calc-v-presets">
              ${railPresets.map(p => `
                <button type="button" data-v="${p.v}" data-a="${p.a}" data-rail="${p.rail}" class="calc-v-btn py-2 px-1 rounded-xl border border-slate-700/80 bg-slate-950 hover:border-cyan-500 text-center transition-all flex flex-col items-center justify-center">
                  <span class="font-mono-tech font-bold text-xs text-cyan-300">${p.name}</span>
                  <span class="text-[9px] text-slate-400 truncate w-full">${p.rail.split(' ')[0]}</span>
                </button>
              `).join('')}
            </div>
            <div class="flex items-center gap-3 pt-1">
              <input type="range" id="calc-v-slider" min="0.5" max="12.0" step="0.1" value="4.2" class="flex-1 accent-cyan-500 cursor-pointer">
              <div class="relative w-24">
                <input type="number" id="calc-v-input" min="0.5" max="24.0" step="0.1" value="4.2" class="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 pr-6 text-right font-mono-tech font-bold text-sm text-cyan-300 focus:outline-none">
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-mono-tech text-xs">V</span>
              </div>
            </div>
          </div>

          <!-- 2. Límite de Amperaje de Fuente (I) -->
          <div class="space-y-2 pt-2 border-t border-slate-800/80">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                2. Límite de Corriente en Fuente (A)
              </label>
              <span class="text-[10px] font-mono-tech text-slate-400">Corriente CC</span>
            </div>
            <div class="grid grid-cols-6 gap-1.5" id="calc-a-presets">
              ${currentPresets.map(amp => `
                <button type="button" data-a="${amp}" class="calc-a-btn py-1.5 px-1 rounded-lg border border-slate-700/80 bg-slate-950 hover:border-amber-500 font-mono-tech font-bold text-xs text-amber-300 transition-all">
                  ${amp.toFixed(1)}A
                </button>
              `).join('')}
            </div>
            <div class="flex items-center gap-3 pt-1">
              <input type="range" id="calc-a-slider" min="0.1" max="5.0" step="0.1" value="1.5" class="flex-1 accent-amber-500 cursor-pointer">
              <div class="relative w-24">
                <input type="number" id="calc-a-input" min="0.1" max="10.0" step="0.1" value="1.5" class="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 pr-6 text-right font-mono-tech font-bold text-sm text-amber-300 focus:outline-none">
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-mono-tech text-xs">A</span>
              </div>
            </div>
          </div>

          <!-- 3. Resultado de Potencia Disipada y Seguridad Térmica -->
          <div class="digital-readout rounded-xl p-3.5 border border-slate-800 space-y-2.5">
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90">
                <div class="text-[10px] uppercase text-slate-400 font-mono-tech">Potencia Disipada (P)</div>
                <div id="calc-power-out" class="text-xl font-bold text-emerald-400 font-mono-tech mt-0.5">
                  6.30 W
                </div>
                <div id="calc-mw-out" class="text-[10px] text-slate-500 font-mono-tech">6300 mW</div>
              </div>
              <div class="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90">
                <div class="text-[10px] uppercase text-slate-400 font-mono-tech">Resistencia Corto (R)</div>
                <div id="calc-res-out" class="text-xl font-bold text-cyan-300 font-mono-tech mt-0.5">
                  2.80 Ω
                </div>
                <div id="calc-method-out" class="text-[10px] text-slate-400 font-mono-tech">Ley de Ohm (V/I)</div>
              </div>
            </div>

            <!-- Semáforo de Seguridad para la Placa -->
            <div id="calc-safety-box" class="p-2.5 rounded-lg border text-xs leading-relaxed">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
          <button type="button" id="btn-calc-copy-to-case" class="px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span>Anotar en Medición del Caso</span>
          </button>
          <button type="button" id="btn-close-calc-footer" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const vSlider = modal.querySelector('#calc-v-slider');
    const vInput = modal.querySelector('#calc-v-input');
    const aSlider = modal.querySelector('#calc-a-slider');
    const aInput = modal.querySelector('#calc-a-input');
    const railBadge = modal.querySelector('#calc-rail-badge');
    const powerOut = modal.querySelector('#calc-power-out');
    const mwOut = modal.querySelector('#calc-mw-out');
    const resOut = modal.querySelector('#calc-res-out');
    const safetyBox = modal.querySelector('#calc-safety-box');
    const vBtns = modal.querySelectorAll('.calc-v-btn');
    const aBtns = modal.querySelectorAll('.calc-a-btn');

    let currentRailName = 'VPH_PWR / VCC_MAIN';

    const recalculate = () => {
      const v = Math.max(0.1, parseFloat(vInput.value) || 0);
      const a = Math.max(0.05, parseFloat(aInput.value) || 0);
      const power = v * a;
      const resistance = v / a;

      powerOut.textContent = `${power.toFixed(2)} W`;
      mwOut.textContent = `${Math.round(power * 1000)} mW`;
      resOut.textContent = resistance < 1
        ? `${Math.round(resistance * 1000)} mΩ`
        : `${resistance.toFixed(2)} Ω`;

      railBadge.textContent = `${currentRailName} (${v.toFixed(1)}V)`;

      // Highlight matching preset buttons
      vBtns.forEach(btn => {
        const btnV = parseFloat(btn.getAttribute('data-v'));
        if (Math.abs(btnV - v) < 0.05) {
          btn.className = 'calc-v-btn py-2 px-1 rounded-xl border border-cyan-400 bg-cyan-950/60 text-center transition-all flex flex-col items-center justify-center shadow-md shadow-cyan-950/50';
        } else {
          btn.className = 'calc-v-btn py-2 px-1 rounded-xl border border-slate-700/80 bg-slate-950 hover:border-cyan-500 text-center transition-all flex flex-col items-center justify-center';
        }
      });

      aBtns.forEach(btn => {
        const btnA = parseFloat(btn.getAttribute('data-a'));
        if (Math.abs(btnA - a) < 0.05) {
          btn.className = 'calc-a-btn py-1.5 px-1 rounded-lg border border-amber-400 bg-amber-950/60 font-mono-tech font-bold text-xs text-amber-200 transition-all';
        } else {
          btn.className = 'calc-a-btn py-1.5 px-1 rounded-lg border border-slate-700/80 bg-slate-950 hover:border-amber-500 font-mono-tech font-bold text-xs text-amber-300 transition-all';
        }
      });

      // Thermal safety evaluation
      if (power <= 1.8) {
        powerOut.className = 'text-xl font-bold text-emerald-400 font-mono-tech mt-0.5';
        safetyBox.className = 'p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-[11px] leading-relaxed';
        safetyBox.innerHTML = `
          <span class="font-bold text-emerald-400 uppercase block mb-0.5">🟢 Disipación Segura (< 1.8 W)</span>
          Baja carga térmica sobre pistas internas. Ideal para líneas lógicas sensibles (1.2V / 1.8V) e inspección con <strong>Cámara Térmica</strong> o rocío fino de alcohol isopropílico.
        `;
      } else if (power <= 4.8) {
        powerOut.className = 'text-xl font-bold text-amber-400 font-mono-tech mt-0.5';
        safetyBox.className = 'p-2.5 rounded-lg border border-amber-500/40 bg-amber-950/30 text-amber-100 text-[11px] leading-relaxed';
        safetyBox.innerHTML = `
          <span class="font-bold text-amber-400 uppercase block mb-0.5">🟡 Zona Óptima para Rosin / Alcohol (1.8 W – 4.8 W)</span>
          Calentamiento localizado evidente para fundir humo de <strong>Colofonia (Rosin)</strong> en capacitores SMD en corto. Inyectar en pulsos de <strong>2 a 4 segundos</strong>.
        `;
      } else {
        powerOut.className = 'text-xl font-bold text-rose-400 font-mono-tech mt-0.5';
        safetyBox.className = 'p-2.5 rounded-lg border border-rose-500/50 bg-rose-950/40 text-rose-200 text-[11px] leading-relaxed';
        safetyBox.innerHTML = `
          <span class="font-bold text-rose-400 uppercase block mb-0.5">🔴 ¡Precaución! Alta Potencia Térmica (> 4.8 W)</span>
          Riesgo de delaminar pistas internas de cobre o carbonizar capas del PCB si el corto es interno. Aplicá <strong>pulsos breves (< 1.5 seg)</strong> con puntas gruesas o reducí la corriente.
        `;
      }
    };

    vBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const v = parseFloat(btn.getAttribute('data-v'));
        const a = parseFloat(btn.getAttribute('data-a'));
        currentRailName = btn.getAttribute('data-rail') || 'Línea';
        vInput.value = v.toFixed(1);
        vSlider.value = v;
        aInput.value = a.toFixed(1);
        aSlider.value = a;
        recalculate();
      });
    });

    aBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const a = parseFloat(btn.getAttribute('data-a'));
        aInput.value = a.toFixed(1);
        aSlider.value = a;
        recalculate();
      });
    });

    vSlider.addEventListener('input', (e) => {
      vInput.value = parseFloat(e.target.value).toFixed(1);
      currentRailName = 'Personalizado';
      recalculate();
    });

    vInput.addEventListener('input', (e) => {
      vSlider.value = e.target.value;
      currentRailName = 'Personalizado';
      recalculate();
    });

    aSlider.addEventListener('input', (e) => {
      aInput.value = parseFloat(e.target.value).toFixed(1);
      recalculate();
    });

    aInput.addEventListener('input', (e) => {
      aSlider.value = e.target.value;
      recalculate();
    });

    const closeModal = () => modal.classList.add('hidden');
    modal.querySelector('#btn-close-calc')?.addEventListener('click', closeModal);
    modal.querySelector('#btn-close-calc-footer')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#btn-calc-copy-to-case')?.addEventListener('click', () => {
      const v = (parseFloat(vInput.value) || 0).toFixed(1);
      const a = (parseFloat(aInput.value) || 0).toFixed(1);
      const p = ((parseFloat(vInput.value) || 0) * (parseFloat(aInput.value) || 0)).toFixed(2);
      const existingMeasured = stateManager.reportData?.measuredValues || '';
      const injectionNote = `Inyección ${currentRailName}: ${v}V @ ${a}A (${p}W)`;
      const updated = existingMeasured ? `${existingMeasured} | ${injectionNote}` : injectionNote;
      stateManager.updateReportData({ measuredValues: updated }, 'calc');
      const copyBtn = modal.querySelector('#btn-calc-copy-to-case span');
      if (copyBtn) {
        copyBtn.textContent = '¡Anotado en el Caso!';
        setTimeout(() => { copyBtn.textContent = 'Anotar en Medición del Caso'; }, 1800);
      }
    });

    recalculate();
  }

  /**
   * Muestra un modal de confirmación para retomar una sesión guardada en localStorage.
   */
  _showSessionRecoveryModal(savedSession) {
    const existing = document.getElementById('session-recovery-modal');
    if (existing) existing.remove();

    const stepNum = (savedSession.history?.length || 0) + 1;
    const savedDateStr = savedSession.savedAt
      ? new Date(savedSession.savedAt).toLocaleString('es-AR')
      : 'Sesión reciente';
    const notesPreview = savedSession.sessionNotes || savedSession.reportData?.observations || '';
    const devicePreview = savedSession.reportData?.deviceModel || '';
    const clientPreview = savedSession.reportData?.clientName || '';
    const measuredPreview = savedSession.reportData?.measuredValues || '';

    const modal = document.createElement('div');
    modal.id = 'session-recovery-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm';

    modal.innerHTML = `
      <div class="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200 animate-fade-in">
        <!-- Header -->
        <div class="p-4 md:p-5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <span class="text-[10px] font-mono-tech uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Recuperación Automática (localStorage)
            </span>
            <h3 class="text-base md:text-lg font-bold text-white mt-0.5">
              ¿Deseás retomar el diagnóstico donde quedaste?
            </h3>
          </div>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-3.5 text-xs">
          <p class="text-slate-300 leading-relaxed">
            Se detectó una sesión de diagnóstico en curso guardada el <span class="text-cyan-300 font-mono-tech font-semibold">${savedDateStr}</span>:
          </p>

          <div class="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 font-mono-tech">
            <div class="flex items-start justify-between gap-2">
              <span class="text-slate-500 uppercase text-[10px]">Protocolo / Preset:</span>
              <span class="text-cyan-300 font-bold text-right">${savedSession.resolvedTree?.name || 'Árbol Técnico'}</span>
            </div>
            <div class="flex items-start justify-between gap-2 border-t border-slate-800/80 pt-1.5">
              <span class="text-slate-500 uppercase text-[10px]">Paso Alcanzado:</span>
              <span class="text-emerald-400 font-bold text-right">Paso #${stepNum}: ${savedSession.resolvedNode?.title || ''}</span>
            </div>
            <div class="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-1.5">
              <span class="text-slate-500 uppercase text-[10px]">Decisiones Registradas:</span>
              <span class="text-slate-200 font-semibold">${savedSession.history?.length || 0} pasos en el historial</span>
            </div>
            ${(devicePreview || clientPreview || measuredPreview) ? `
              <div class="border-t border-slate-800/80 pt-1.5 text-[11px] text-slate-300 space-y-0.5">
                ${clientPreview ? `<div><span class="text-slate-500">Cliente:</span> ${clientPreview}</div>` : ''}
                ${devicePreview ? `<div><span class="text-slate-500">Equipo:</span> ${devicePreview}</div>` : ''}
                ${measuredPreview ? `<div><span class="text-slate-500">Medición:</span> <span class="text-cyan-300">${measuredPreview}</span></div>` : ''}
              </div>
            ` : ''}
            ${notesPreview ? `
              <div class="border-t border-slate-800/80 pt-1.5 text-[11px] text-amber-200/90 font-sans">
                <span class="font-mono-tech text-[10px] uppercase text-slate-500 block">Notas guardadas:</span>
                "${notesPreview}"
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
          <button id="btn-discard-session" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-700 transition-colors">
            Descartar e Iniciar Nuevo
          </button>
          <button id="btn-restore-session" class="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 flex items-center gap-1.5 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <span>Sí, Retomar Diagnóstico</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-restore-session')?.addEventListener('click', () => {
      stateManager.restoreSession(savedSession);
      setTimeout(() => this.graphEngine?.focusActiveNode(), 120);
      modal.remove();
    });

    modal.querySelector('#btn-discard-session')?.addEventListener('click', () => {
      stateManager.clearSavedSession();
      stateManager.resetDiagnostic(true);
      stateManager.saveSessionToStorage();
      modal.remove();
    });
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.DiagApp.instance = app;
});
