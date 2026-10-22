/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Interactive Diagnostic Simulator Runner View
 * Incluye Bitácora Rápida de Notas y Mediciones con Persistencia en localStorage
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

class RunnerView {
  constructor(containerElement) {
    this.container = containerElement;
    this._init();
  }

  _init() {
    stateManager.on('nodeChanged', ({ node, history }) => this.render(node, history));
    stateManager.on('historyChanged', ({ history }) => {
      const node = stateManager.getCurrentNode();
      this.render(node, history);
    });
    stateManager.on('notesChanged', ({ reportData, source }) => {
      if (source !== 'runner') {
        this._syncNoteInputs(reportData);
      }
    });

    // Keyboard shortcut support (keys 1-9 to pick option, 'u' to undo)
    window.addEventListener('keydown', (e) => {
      // Ignore if typing inside input, select or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const currentNode = stateManager.getCurrentNode();
      if (!currentNode || !Array.isArray(currentNode.options)) return;

      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= currentNode.options.length) {
        e.preventDefault();
        stateManager.selectOption(keyNum - 1);
      } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'u') {
        if (stateManager.history.length > 0) {
          e.preventDefault();
          stateManager.backtrack();
        }
      }
    });
  }

  _syncNoteInputs(reportData) {
    if (!this.container || !reportData) return;
    const modelEl = this.container.querySelector('#runner-device-model');
    const measuredEl = this.container.querySelector('#runner-measured-values');
    const notesEl = this.container.querySelector('#runner-session-notes');

    if (modelEl && modelEl.value !== (reportData.deviceModel || '')) {
      modelEl.value = reportData.deviceModel || '';
    }
    if (measuredEl && measuredEl.value !== (reportData.measuredValues || '')) {
      measuredEl.value = reportData.measuredValues || '';
    }
    if (notesEl && notesEl.value !== (reportData.observations || '')) {
      notesEl.value = reportData.observations || '';
    }
  }

  _escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  render(node, history = []) {
    if (!node) {
      this.container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
          <svg class="w-12 h-12 mb-3 stroke-current opacity-40" viewBox="0 0 24 24" fill="none"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <p class="text-sm">Selecciona o carga un árbol de decisión para iniciar el diagnóstico.</p>
        </div>
      `;
      return;
    }

    const catInfo = CATEGORIES[node.category] || CATEGORIES.action;
    const isVerdict = node.category === 'verdict';
    const stepNumber = history.length + 1;
    const reportData = stateManager.reportData || {};
    const isDesktop = window.innerWidth >= 1024;
    const defaultAccordionOpen = isDesktop ? 'open' : '';
    const hasSavedNotes = Boolean(reportData.deviceModel || reportData.measuredValues || reportData.observations);
    const notesAccordionOpen = (isDesktop || hasSavedNotes) ? 'open' : '';

    // Render breadcrumbs
    const breadcrumbHtml = history.map((step, idx) => `
      <button data-history-idx="${idx}" class="breadcrumb-item flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800/60 max-w-[140px] truncate" title="${this._escapeAttr(step.nodeTitle)}">
        <span class="w-1.5 h-1.5 rounded-full ${BADGE_COLORS[step.badgeColor]?.dot || 'bg-slate-500'}"></span>
        <span class="truncate">${step.nodeTitle}</span>
      </button>
      <span class="text-slate-600 text-xs">/</span>
    `).join('');

    // Compact quick-glance nominal summary bar (always visible above decision buttons)
    const quickNominalSummaryHtml = (node.measurements && node.measurements.length > 0) ? `
      <div class="flex flex-wrap items-center gap-2 pt-1">
        ${node.measurements.map((m) => `
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-900/60 text-xs font-mono-tech">
            <span class="text-cyan-400 font-semibold">⚡ ${m.tool}:</span>
            <span class="text-emerald-400 font-bold">${m.expected}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    // Render options / branches (Placed high for single-thumb tap in mobile workshop use)
    const optionsHtml = (node.options && node.options.length > 0) ? `
      <div class="space-y-2.5 pt-1">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>
            Selecciona la Condición Medida (${node.options.length})
          </h4>
          <span class="text-[11px] text-slate-500 hidden sm:inline-block">Atajos: [1]..[${node.options.length}]</span>
        </div>

        <div class="grid grid-cols-1 gap-2.5">
          ${node.options.map((opt, idx) => {
            const colorCfg = BADGE_COLORS[opt.badgeColor] || BADGE_COLORS.blue;
            return `
              <button data-option-idx="${idx}" class="option-button group w-full text-left p-3.5 md:p-4 min-h-[54px] rounded-xl border ${colorCfg.border} ${colorCfg.bg} transition-all duration-150 transform active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-lg ${colorCfg.glow} flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 font-mono-tech text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500 group-hover:text-cyan-300">
                    ${idx + 1}
                  </span>
                  <span class="text-sm font-semibold ${colorCfg.text} group-hover:text-white transition-colors leading-snug">
                    ${opt.label}
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="w-2.5 h-2.5 rounded-full ${colorCfg.dot} animate-pulse"></span>
                  <svg class="w-4 h-4 text-slate-400 group-hover:text-white transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    // Render verdict screen
    const verdictHtml = isVerdict ? `
      <div class="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 p-5 md:p-6 shadow-2xl relative overflow-hidden">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <svg class="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <span class="text-[11px] font-mono-tech uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              Veredicto Final Alcanzado
            </span>
            <h3 class="text-base md:text-lg font-bold text-white mt-1">
              ${node.title}
            </h3>
          </div>
        </div>

        <div class="space-y-4 my-4 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-b border-slate-800 py-4">
          <p>${node.description}</p>
        </div>

        <div class="flex flex-wrap gap-2.5 mt-5">
          <button id="btn-generate-report" class="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-emerald-950/60 transition-all transform hover:-translate-y-0.5">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Abrir Reporte / Exportar WhatsApp & Planilla
          </button>
          <button id="btn-restart-from-verdict" class="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs md:text-sm font-semibold border border-slate-700 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Nuevo Diagnóstico
          </button>
        </div>
      </div>
    ` : '';

    // Collapsible Accordion: Measurements & Expected Reference Values (Open on Desktop, Collapsed on Mobile)
    const measurementsHtml = (node.measurements && node.measurements.length > 0) ? `
      <details class="diag-accordion rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden" ${defaultAccordionOpen}>
        <summary class="cursor-pointer select-none px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800/80 flex items-center justify-between gap-2 transition-colors">
          <div class="flex items-center gap-2 min-w-0">
            <svg class="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
            <span class="text-xs font-semibold text-slate-200 uppercase tracking-wider truncate">
              Parámetros y Valores de Referencia (${node.measurements.length})
            </span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800/70">
              Diodo / V / mA
            </span>
            <svg class="accordion-chevron w-4 h-4 text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </summary>

        <div class="p-3.5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3">
          ${node.measurements.map((m, idx) => `
            <div class="glass-panel-subtle rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <span class="p-1 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                    ⚡
                  </span>
                  ${m.tool}
                </span>
                <span class="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                  TEST #${idx + 1}
                </span>
              </div>

              <div class="digital-readout rounded-lg p-2.5 my-1 text-center">
                <div class="text-[10px] uppercase text-slate-500 font-mono-tech tracking-wider">Lectura Nominal Esperada</div>
                <div class="text-base md:text-lg font-bold text-emerald-400 font-mono-tech mt-0.5 tracking-wide">
                  ${m.expected}
                </div>
              </div>

              <div class="text-[11px] text-slate-400 mt-2 flex items-start gap-1.5 pt-1.5 border-t border-slate-800/60">
                <span class="text-slate-500 font-semibold">Tolerancia:</span>
                <span class="text-slate-300">${m.tolerance}</span>
              </div>

              ${(m.referenceValues || node.referenceValues) ? `
                <div class="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div class="text-[10px] font-mono-tech uppercase text-slate-400 font-semibold tracking-wider flex items-center justify-between">
                    <span class="flex items-center gap-1 text-cyan-300">
                      <svg class="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                      Valores de Referencia Esperados
                    </span>
                    <span class="text-[9px] text-slate-500">Banco de Trabajo</span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] font-mono-tech">
                    ${(m.referenceValues?.diodeDrop || node.referenceValues?.diodeDrop) ? `
                      <div class="p-2 rounded-lg bg-slate-900/90 border border-rose-900/50 flex flex-col justify-between">
                        <span class="text-[9px] text-rose-400 font-semibold flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Modo Diodo
                        </span>
                        <span class="text-xs font-bold text-rose-200 mt-0.5 leading-tight">${m.referenceValues?.diodeDrop || node.referenceValues?.diodeDrop}</span>
                      </div>
                    ` : ''}
                    ${(m.referenceValues?.nominalVoltage || node.referenceValues?.nominalVoltage) ? `
                      <div class="p-2 rounded-lg bg-slate-900/90 border border-cyan-900/50 flex flex-col justify-between">
                        <span class="text-[9px] text-cyan-400 font-semibold flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> Voltaje Multímetro
                        </span>
                        <span class="text-xs font-bold text-cyan-200 mt-0.5 leading-tight">${m.referenceValues?.nominalVoltage || node.referenceValues?.nominalVoltage}</span>
                      </div>
                    ` : ''}
                    ${(m.referenceValues?.usbCurrent || node.referenceValues?.usbCurrent) ? `
                      <div class="p-2 rounded-lg bg-slate-900/90 border border-emerald-900/50 flex flex-col justify-between">
                        <span class="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Amperímetro USB
                        </span>
                        <span class="text-xs font-bold text-emerald-200 mt-0.5 leading-tight">${m.referenceValues?.usbCurrent || node.referenceValues?.usbCurrent}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </details>
    ` : '';

    // Collapsible Accordion: Technical Tips Callout (Open on Desktop, Collapsed on Mobile)
    const tipsHtml = node.technicalTips ? `
      <details class="diag-accordion rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-slate-900 overflow-hidden" ${defaultAccordionOpen}>
        <summary class="cursor-pointer select-none px-3.5 py-2.5 hover:bg-amber-950/40 flex items-center justify-between gap-2 transition-colors">
          <div class="flex items-center gap-2 min-w-0">
            <span class="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </span>
            <span class="text-xs font-bold text-amber-300 uppercase tracking-wide truncate">
              Consejo Técnico de Microelectrónica
            </span>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <span class="text-[10px] font-mono-tech text-amber-400/80 hidden sm:inline">Tip de Taller</span>
            <svg class="accordion-chevron w-4 h-4 text-amber-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </summary>
        <div class="px-3.5 pb-3.5 pt-2 border-t border-amber-500/20">
          <p class="text-xs text-amber-100/90 leading-relaxed font-sans">
            ${node.technicalTips}
          </p>
        </div>
      </details>
    ` : '';

    // Collapsible Accordion: Quick Session Notes & Measurements Box (Auto-persisted in localStorage)
    const sessionNotesBoxHtml = `
      <details class="diag-accordion rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden" ${notesAccordionOpen}>
        <summary class="cursor-pointer select-none px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-800/80 flex items-center justify-between gap-2 transition-colors">
          <span class="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 truncate">
            <svg class="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Bitácora de Banco & Notas del Caso
          </span>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-[10px] font-mono-tech text-emerald-400/90 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Auto-guardado
            </span>
            <svg class="accordion-chevron w-4 h-4 text-slate-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </summary>
        <div class="p-3.5 border-t border-slate-800 space-y-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-mono-tech text-slate-400 uppercase mb-0.5">Modelo del Equipo</label>
              <input type="text" id="runner-device-model" value="${this._escapeAttr(reportData.deviceModel)}" placeholder="Ej: Samsung A52 / Moto G60 / PS5" class="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none">
            </div>
            <div>
              <label class="block text-[10px] font-mono-tech text-slate-400 uppercase mb-0.5">Tensión / Consumo Medido</label>
              <input type="text" id="runner-measured-values" value="${this._escapeAttr(reportData.measuredValues)}" placeholder="Ej: 4.2V / 0.16A fijos (VPH: 0.380V)" class="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono-tech placeholder-slate-600 focus:outline-none">
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-mono-tech text-slate-400 uppercase mb-0.5">Notas / Observaciones de la Sesión</label>
            <textarea id="runner-session-notes" rows="2" placeholder="Anotá mediciones, componentes revisados o detalles del cliente (se conserva al cerrar el navegador y se sincroniza con el Reporte)..." class="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none">${this._escapeAttr(reportData.observations)}</textarea>
          </div>
        </div>
      </details>
    `;

    this.container.innerHTML = `
      <div class="h-full flex flex-col justify-between overflow-y-auto p-3.5 md:p-6 space-y-4">
        <!-- Top Metadata & Navigation Bar -->
        <div class="space-y-2.5 pb-2.5 border-b border-slate-800">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono-tech px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 font-bold">
                PASO #${stepNumber}
              </span>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-lg border ${catInfo.badgeClass}">
                ${catInfo.label}
              </span>
            </div>

            <!-- Backtrack / Reset Buttons -->
            <div class="flex items-center gap-1.5">
              ${history.length > 0 ? `
                <button id="btn-backtrack" class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  <span>Atrás</span>
                </button>
              ` : ''}
              <button id="btn-reset-diag" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs border border-slate-700 transition-colors" title="Reiniciar Diagnóstico y Limpiar Sesión">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
          </div>

          <!-- Breadcrumbs Trail -->
          ${history.length > 0 ? `
            <div class="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
              <span class="text-[11px] text-slate-500 font-mono-tech mr-1">Ruta:</span>
              ${breadcrumbHtml}
              <span class="text-xs text-cyan-400 font-semibold truncate max-w-[150px]">${node.title}</span>
            </div>
          ` : ''}
        </div>

        <!-- Node Content Body (Reordenado para móvil: Opciones arriba sin scroll eterno + Acordeones debajo) -->
        <div class="space-y-4 flex-1">
          <!-- Title, Description & Quick Nominal Pill -->
          <div class="space-y-1.5">
            <h2 class="text-lg md:text-2xl font-bold text-white tracking-tight leading-snug">
              ${node.title}
            </h2>
            <p class="text-xs md:text-sm text-slate-300 leading-relaxed">
              ${node.description}
            </p>
            ${quickNominalSummaryHtml}
          </div>

          <!-- Primary Action: Options or Verdict Section RIGHT AT THE TOP -->
          ${isVerdict ? verdictHtml : optionsHtml}

          <!-- Collapsible Accordions: Reference Values, Technical Tips & Session Notes -->
          <div class="space-y-2.5 pt-1">
            ${measurementsHtml}
            ${tipsHtml}
            ${sessionNotesBoxHtml}
          </div>
        </div>

        <!-- Footer Help Note -->
        <div class="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Nodo ID: <code class="font-mono-tech text-slate-400">${node.id}</code></span>
          <span>Motor Nodal v1.0 • Persistencia Activa</span>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    // Option buttons
    this.container.querySelectorAll('.option-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const optIdx = parseInt(btn.getAttribute('data-option-idx'), 10);
        if (!isNaN(optIdx)) {
          stateManager.selectOption(optIdx);
        }
      });
    });

    // Breadcrumb buttons to jump back in history
    this.container.querySelectorAll('.breadcrumb-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const histIdx = parseInt(btn.getAttribute('data-history-idx'), 10);
        if (!isNaN(histIdx)) {
          const targetStep = stateManager.history[histIdx];
          if (targetStep) {
            stateManager.history = stateManager.history.slice(0, histIdx);
            stateManager.jumpToNode(targetStep.nodeId);
          }
        }
      });
    });

    // Backtrack button
    this.container.querySelector('#btn-backtrack')?.addEventListener('click', () => {
      stateManager.backtrack();
    });

    // Reset button
    this.container.querySelector('#btn-reset-diag')?.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar la sesión de diagnóstico desde el síntoma inicial y limpiar las notas actuales?')) {
        stateManager.resetDiagnostic(true);
      }
    });

    // Verdict restart button
    this.container.querySelector('#btn-restart-from-verdict')?.addEventListener('click', () => {
      stateManager.resetDiagnostic(true);
    });

    // Report button
    this.container.querySelector('#btn-generate-report')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-report-modal'));
    });

    // Live inputs for session notes & device/measurement
    const modelInput = this.container.querySelector('#runner-device-model');
    const measuredInput = this.container.querySelector('#runner-measured-values');
    const notesInput = this.container.querySelector('#runner-session-notes');

    modelInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ deviceModel: e.target.value }, 'runner');
    });

    measuredInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ measuredValues: e.target.value }, 'runner');
    });

    notesInput?.addEventListener('input', (e) => {
      stateManager.updateNotes(e.target.value, 'runner');
    });
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.RunnerView = RunnerView;
