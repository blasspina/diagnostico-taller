/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Technical Work Order & Diagnostic Report Modal
 * Soporta Cliente, Modelo del Equipo, Tensión/Consumo medido, Observaciones,
 * exportación directa a WhatsApp Web y fila TSV para Excel / Google Sheets.
 * Compatible con ejecución directa local (file://) sin bloqueos CORS.
 */

function copyTextSafe(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
  }
  return fallbackCopyText(text);
}

function fallbackCopyText(text) {
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error('execCommand copy failed'));
    } catch (err) {
      reject(err);
    }
  });
}

class ReportModal {
  constructor() {
    this.modalEl = null;
    this._init();
  }

  _init() {
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'report-modal-wrapper';
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm hidden';
    document.body.appendChild(this.modalEl);

    document.addEventListener('open-report-modal', () => this.open());
  }

  open() {
    this.render();
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }

  _escapeAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  render() {
    const tree = stateManager.currentTree;
    const history = stateManager.history;
    const currentNode = stateManager.getCurrentNode();
    const isVerdict = currentNode?.category === 'verdict';
    const dateStr = new Date().toLocaleString('es-AR');
    const durationMinutes = Math.max(1, Math.round((Date.now() - stateManager.startTime) / 60000));
    const rd = stateManager.reportData || {};
    const defaultModel = rd.deviceModel || tree?.deviceType || '';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        <!-- Modal Header -->
        <div class="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between no-print bg-slate-950/60">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <h3 class="text-base md:text-lg font-bold text-white">Generador de Reporte Técnico y Orden de Taller</h3>
              <p class="text-xs text-slate-400">Exportación directa para WhatsApp Web, Planilla Excel/Sheets (TSV) e Impresión PDF.</p>
            </div>
          </div>
          <button id="btn-close-report" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Printable Document Body -->
        <div id="printable-report-content" class="flex-1 overflow-y-auto p-5 md:p-7 space-y-5 text-xs md:text-sm">
          <!-- Laboratory Header -->
          <div class="flex justify-between items-start border-b border-slate-700/80 pb-4">
            <div>
              <div class="text-lg font-bold text-cyan-400 font-mono-tech tracking-tight">LABORATORIO DE MICROELECTRÓNICA & REPARACIÓN</div>
              <div class="text-xs text-slate-400">Reporte Técnico de Diagnóstico Guiado por Árbol de Decisiones</div>
              <div class="text-[11px] text-slate-500 mt-1">Protocolo Aplicado: <strong class="text-slate-300">${tree?.name || 'N/A'}</strong></div>
            </div>
            <div class="text-right font-mono-tech text-xs space-y-0.5">
              <div class="text-slate-400">FECHA: <span class="text-slate-200 font-bold">${dateStr}</span></div>
              <div class="text-slate-400">TIEMPO: <span class="text-slate-200 font-bold">${durationMinutes} min</span></div>
              <div class="text-slate-400">PASOS: <span class="text-slate-200 font-bold">${history.length + 1}</span></div>
            </div>
          </div>

          <!-- Datos Principales del Caso (Cliente, Modelo del Equipo, Tensión/Consumo medido, Observaciones) -->
          <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-cyan-400 uppercase tracking-wider text-xs flex items-center gap-2 font-mono-tech">
                <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
                Datos de Ingreso, Medición en Banco y Observaciones
              </h4>
              <span class="text-[10px] text-emerald-400 font-mono-tech no-print">✓ Sincronizado con localStorage</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label for="report-client-name" class="text-slate-400 block text-[10px] uppercase font-mono-tech mb-1">Cliente</label>
                <input type="text" id="report-client-name" value="${this._escapeAttr(rd.clientName)}" placeholder="Nombre del Cliente / Gremio" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500">
              </div>

              <div>
                <label for="report-device-model" class="text-slate-400 block text-[10px] uppercase font-mono-tech mb-1">Modelo del Equipo</label>
                <input type="text" id="report-device-model" value="${this._escapeAttr(defaultModel)}" placeholder="Ej: Samsung S22 / Moto G60 / PS5" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500">
              </div>

              <div>
                <label for="report-measured-values" class="text-slate-400 block text-[10px] uppercase font-mono-tech mb-1">Tensión / Consumo Medido</label>
                <input type="text" id="report-measured-values" value="${this._escapeAttr(rd.measuredValues)}" placeholder="Ej: 4.2V / 0.16A fijos (VPH: 0.380V)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono-tech font-semibold focus:outline-none focus:border-cyan-500">
              </div>
            </div>

            <div>
              <label for="report-custom-notes" class="text-slate-400 block text-[10px] uppercase font-mono-tech mb-1">Observaciones Técnicas y Notas para el Cliente / Planilla</label>
              <textarea id="report-custom-notes" rows="2" placeholder="Ej: Equipo ingresó mojado / sin blindajes. Se cotiza reemplazo de IF PMIC y reconstrucción de línea de datos." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none">${this._escapeAttr(rd.observations)}</textarea>
            </div>

            <!-- Sub-row: Técnico, Estado y Presupuesto -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs no-print">
              <div>
                <label for="report-tech-name" class="text-slate-500 block text-[10px] uppercase font-mono-tech mb-1">Técnico Especialista</label>
                <input type="text" id="report-tech-name" value="${this._escapeAttr(rd.technicianName || stateManager.technicianName)}" class="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500">
              </div>

              <div>
                <label for="report-status-select" class="text-slate-500 block text-[10px] uppercase font-mono-tech mb-1">Estado / Viabilidad</label>
                <select id="report-status-select" class="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500">
                  <option value="presupuesto" ${rd.statusType === 'presupuesto' ? 'selected' : ''}>Presupuesto Estimado (Reparación Viable)</option>
                  <option value="sin_solucion" ${rd.statusType === 'sin_solucion' ? 'selected' : ''}>Sin Solución Técnica Viable (Irrecuperable)</option>
                  <option value="completada" ${rd.statusType === 'completada' ? 'selected' : ''}>Reparación Exitosa Completada</option>
                  <option value="espera_repuesto" ${rd.statusType === 'espera_repuesto' ? 'selected' : ''}>En Espera de Repuesto / IC</option>
                </select>
              </div>

              <div id="report-budget-wrapper" style="${rd.statusType && rd.statusType !== 'presupuesto' ? 'display:none;' : ''}">
                <label for="report-budget-input" class="text-slate-500 block text-[10px] uppercase font-mono-tech mb-1">Presupuesto / Cotización (Opcional)</label>
                <input type="text" id="report-budget-input" placeholder="Ej: $ 45.000 ARS" value="${this._escapeAttr(rd.budget ?? '$ 45.000')}" class="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-cyan-500">
              </div>
            </div>
          </div>

          <!-- Diagnostic Trajectory History -->
          <div class="space-y-2">
            <h4 class="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              Recorrido del Árbol de Decisiones (${history.length} Pasos Registrados)
            </h4>
            <div class="rounded-xl border border-slate-800 overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-800/80 text-slate-400 font-mono-tech">
                  <tr>
                    <th class="p-2.5 w-12">#</th>
                    <th class="p-2.5">Prueba / Paso Ejecutado</th>
                    <th class="p-2.5">Condición / Medición Observada</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-sans">
                  ${history.length === 0 ? `
                    <tr><td colspan="3" class="p-3 text-slate-500 text-center">Diagnóstico en paso inicial (${currentNode?.title || 'Inicio'}).</td></tr>
                  ` : history.map((step, i) => `
                    <tr>
                      <td class="p-2.5 font-mono-tech text-slate-400 font-bold">${i + 1}</td>
                      <td class="p-2.5 text-slate-200 font-medium">${step.nodeTitle}</td>
                      <td class="p-2.5 text-cyan-300 font-semibold">${step.optionLabel}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Final Verdict / Root Cause -->
          <div class="p-4 rounded-xl border ${isVerdict ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-amber-500/50 bg-amber-950/20'} space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono-tech uppercase font-bold ${isVerdict ? 'text-emerald-400' : 'text-amber-400'}">
                ${isVerdict ? 'Diagnóstico / Veredicto Final Alcanzado' : 'Diagnóstico Actual (En Curso)'}
              </span>
              <span class="text-xs font-mono-tech text-slate-400">Nodo: ${currentNode?.id || 'N/A'}</span>
            </div>
            <h3 class="text-base font-bold text-white">${currentNode?.title || 'Sin veredicto'}</h3>
            <p class="text-slate-300 leading-relaxed text-xs md:text-sm">${currentNode?.description || ''}</p>
            ${currentNode?.technicalTips ? `
              <div class="pt-2 border-t border-slate-800/80 text-xs text-amber-200">
                <strong>Acción técnica recomendada:</strong> ${currentNode.technicalTips}
              </div>
            ` : ''}
          </div>

          <!-- Sign-Off Block for Print -->
          <div class="pt-6 border-t border-slate-700/80 flex justify-between items-end text-xs text-slate-400 font-mono-tech">
            <div class="text-center">
              <div class="w-48 border-b border-slate-600 mb-1"></div>
              <span>Firma Técnico Especialista</span>
            </div>
            <div class="text-center">
              <div class="w-48 border-b border-slate-600 mb-1"></div>
              <span>Conformidad Cliente / Recepción</span>
            </div>
          </div>
        </div>

        <!-- Modal Actions Footer -->
        <div class="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/90 no-print">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Enviar por WhatsApp (Directo a WhatsApp Web + Copia automática) -->
            <button id="btn-send-whatsapp" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/80 border border-emerald-400/50 transition-all transform hover:-translate-y-0.5">
              <svg class="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.073.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.634-.828A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.583 0-3.056-.444-4.321-1.218l-.31-.188-2.738.489.5-2.671-.202-.322A8.136 8.136 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z"/>
              </svg>
              <span id="btn-send-whatsapp-text">Enviar por WhatsApp</span>
            </button>

            <!-- Copiar fila para Planilla (TSV) -->
            <button id="btn-copy-tsv" class="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/80 border border-amber-400/50 transition-all transform hover:-translate-y-0.5" title="Copia: Fecha [TAB] Modelo [TAB] Síntoma Inicial [TAB] Diagnóstico Final [TAB] Observaciones">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <span id="btn-copy-tsv-text">Copiar fila para Planilla (TSV)</span>
            </button>

            <!-- Copiar solo texto de WhatsApp -->
            <button id="btn-copy-whatsapp" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors" title="Copiar texto formateado para pegar en WhatsApp">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <span id="btn-copy-whatsapp-text">Copiar Texto WA</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <!-- Copy Markdown -->
            <button id="btn-copy-markdown" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors">
              <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              <span>Markdown</span>
            </button>

            <!-- Print PDF -->
            <button id="btn-print-report" class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _collectFormValues() {
    const tree = stateManager.currentTree;
    const history = stateManager.history;
    const currentNode = stateManager.getCurrentNode();

    const clientName = this.modalEl.querySelector('#report-client-name')?.value?.trim() || 'No especificado';
    const deviceModel = this.modalEl.querySelector('#report-device-model')?.value?.trim() || tree?.deviceType || 'Equipo en revisión';
    const measuredValues = this.modalEl.querySelector('#report-measured-values')?.value?.trim() || 'No especificado';
    const observations = this.modalEl.querySelector('#report-custom-notes')?.value?.trim() || '';
    const tech = this.modalEl.querySelector('#report-tech-name')?.value?.trim() || 'Técnico Especialista';
    const statusType = this.modalEl.querySelector('#report-status-select')?.value || 'presupuesto';
    const budget = this.modalEl.querySelector('#report-budget-input')?.value?.trim() || '';
    const dateStr = new Date().toLocaleDateString('es-AR');

    const symptomNode = tree?.nodes?.find(n => n.category === 'symptom') || tree?.nodes?.[0];
    const initialSymptom = history.length > 0
      ? `${history[0].nodeTitle} (${history[0].optionLabel})`
      : (symptomNode?.title || tree?.name || 'Evaluación inicial');

    const finalDiagnosis = currentNode?.title || 'En evaluación';

    return {
      tree,
      history,
      currentNode,
      clientName,
      deviceModel,
      measuredValues,
      observations,
      tech,
      statusType,
      budget,
      dateStr,
      initialSymptom,
      finalDiagnosis
    };
  }

  _generateWhatsAppText() {
    const {
      tree,
      history,
      currentNode,
      clientName,
      deviceModel,
      measuredValues,
      observations,
      tech,
      statusType,
      budget,
      dateStr,
      initialSymptom,
      finalDiagnosis
    } = this._collectFormValues();

    let statusText = '';
    if (statusType === 'presupuesto') {
      statusText = budget
        ? `Presupuesto Estimado: *${budget}* (Reparación viable en laboratorio)`
        : `Reparación viable en laboratorio (Presupuesto a confirmar)`;
    } else if (statusType === 'sin_solucion') {
      statusText = `*Sin solución técnica viable* (Daño irreversible en silicio principal o capas internas del PCB)`;
    } else if (statusType === 'completada') {
      statusText = `*Reparación completada con éxito* (Equipo testeado en banco y listo para retirar)`;
    } else if (statusType === 'espera_repuesto') {
      statusText = `*En espera de repuesto / IC* (Componente solicitado a proveedor)`;
    }

    let text = `🛠️ *REPORTE TÉCNICO DE DIAGNÓSTICO*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *Cliente:* ${clientName}\n`;
    text += `📱 *Modelo del Equipo:* ${deviceModel}\n`;
    text += `⚡ *Tensión / Consumo Medido:* ${measuredValues}\n`;
    text += `👨‍🔧 *Técnico:* ${tech} | 📅 *Fecha:* ${dateStr}\n`;
    text += `📋 *Protocolo:* ${tree?.name || 'Diagnóstico General'}\n\n`;

    text += `⚠️ *Síntoma Inicial:*\n`;
    text += `${initialSymptom}\n\n`;

    text += `🔬 *Recorrido del Árbol de Decisiones:*\n`;
    if (history.length > 0) {
      history.forEach((step, idx) => {
        text += `${idx + 1}. *${step.nodeTitle}* ➔ _${step.optionLabel}_\n`;
      });
    } else {
      text += `• Paso 1: ${currentNode?.title || 'Evaluación inicial en banco'}\n`;
    }
    text += `\n`;

    text += `🎯 *Diagnóstico Final:*\n`;
    text += `*${finalDiagnosis}*\n`;
    if (currentNode?.description) {
      text += `${currentNode.description}\n`;
    }
    if (currentNode?.technicalTips) {
      text += `🔧 _Acción técnica:_ ${currentNode.technicalTips}\n`;
    }
    text += `\n`;

    text += `📌 *Estado:* ${statusText}\n`;
    if (observations) {
      text += `📝 *Observaciones:* ${observations}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return text;
  }

  /**
   * Genera una única línea separada por tabulaciones (\t) para Excel / Google Sheets:
   * Fecha \t Modelo \t Síntoma Inicial \t Diagnóstico Final \t Observaciones
   */
  _generateTSVRow() {
    const {
      clientName,
      deviceModel,
      measuredValues,
      observations,
      dateStr,
      initialSymptom,
      finalDiagnosis
    } = this._collectFormValues();

    const clean = (val) => String(val || '').replace(/[\r\n\t]+/g, ' ').trim();

    // Enriquecer Observaciones con Cliente y Tensión/Consumo medido si fueron ingresados
    const extraParts = [];
    if (clientName && clientName !== 'No especificado') {
      extraParts.push(`Cliente: ${clientName}`);
    }
    if (measuredValues && measuredValues !== 'No especificado') {
      extraParts.push(`Medición: ${measuredValues}`);
    }
    if (observations) {
      extraParts.push(observations);
    }
    const combinedObservations = extraParts.length > 0 ? extraParts.join(' | ') : 'Sin observaciones';

    const columns = [
      clean(dateStr),
      clean(deviceModel),
      clean(initialSymptom),
      clean(finalDiagnosis),
      clean(combinedObservations)
    ];

    return columns.join('\t');
  }

  _bindEvents() {
    this.modalEl.querySelector('#btn-close-report')?.addEventListener('click', () => this.close());

    // Sync inputs to stateManager & localStorage in real time
    const clientInput = this.modalEl.querySelector('#report-client-name');
    const modelInput = this.modalEl.querySelector('#report-device-model');
    const measuredInput = this.modalEl.querySelector('#report-measured-values');
    const notesInput = this.modalEl.querySelector('#report-custom-notes');
    const techInput = this.modalEl.querySelector('#report-tech-name');
    const statusSelect = this.modalEl.querySelector('#report-status-select');
    const budgetInput = this.modalEl.querySelector('#report-budget-input');
    const budgetWrapper = this.modalEl.querySelector('#report-budget-wrapper');

    clientInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ clientName: e.target.value }, 'report');
    });

    modelInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ deviceModel: e.target.value }, 'report');
    });

    measuredInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ measuredValues: e.target.value }, 'report');
    });

    notesInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ observations: e.target.value }, 'report');
    });

    techInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ technicianName: e.target.value }, 'report');
    });

    budgetInput?.addEventListener('input', (e) => {
      stateManager.updateReportData({ budget: e.target.value }, 'report');
    });

    statusSelect?.addEventListener('change', (e) => {
      stateManager.updateReportData({ statusType: e.target.value }, 'report');
      if (budgetWrapper) {
        budgetWrapper.style.display = e.target.value === 'presupuesto' ? 'block' : 'none';
      }
    });

    // Print button
    this.modalEl.querySelector('#btn-print-report')?.addEventListener('click', () => {
      window.print();
    });

    // Enviar por WhatsApp (Copia al portapapeles + abre WhatsApp Web)
    this.modalEl.querySelector('#btn-send-whatsapp')?.addEventListener('click', () => {
      const waText = this._generateWhatsAppText();
      const btnTextEl = this.modalEl.querySelector('#btn-send-whatsapp-text');

      copyTextSafe(waText).catch(() => {});
      if (btnTextEl) {
        const orig = btnTextEl.textContent;
        btnTextEl.textContent = '✓ Abriendo WhatsApp Web...';
        setTimeout(() => {
          btnTextEl.textContent = orig;
        }, 2500);
      }

      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
      window.open(url, '_blank');
    });

    // Copiar Texto WA únicamente
    this.modalEl.querySelector('#btn-copy-whatsapp')?.addEventListener('click', () => {
      const waText = this._generateWhatsAppText();
      const btnTextEl = this.modalEl.querySelector('#btn-copy-whatsapp-text');

      copyTextSafe(waText).then(() => {
        if (btnTextEl) {
          const orig = btnTextEl.textContent;
          btnTextEl.textContent = '✓ ¡Texto WA Copiado!';
          setTimeout(() => {
            btnTextEl.textContent = orig;
          }, 2500);
        }
      }).catch(() => {
        alert('No se pudo copiar automáticamente.');
      });
    });

    // Copiar fila para Planilla (TSV)
    this.modalEl.querySelector('#btn-copy-tsv')?.addEventListener('click', () => {
      const tsvLine = this._generateTSVRow();
      const btnTextEl = this.modalEl.querySelector('#btn-copy-tsv-text');

      copyTextSafe(tsvLine).then(() => {
        if (btnTextEl) {
          const orig = btnTextEl.textContent;
          btnTextEl.textContent = '✓ ¡Fila TSV Copiada (Excel/Sheets)!';
          setTimeout(() => {
            btnTextEl.textContent = orig;
          }, 2800);
        }
      }).catch(() => {
        alert('No se pudo copiar la fila TSV automáticamente.');
      });
    });

    // Copy Markdown button
    this.modalEl.querySelector('#btn-copy-markdown')?.addEventListener('click', () => {
      const {
        tree,
        history,
        currentNode,
        clientName,
        deviceModel,
        measuredValues,
        observations,
        tech,
        dateStr
      } = this._collectFormValues();

      let md = `# INFORME TÉCNICO DE DIAGNÓSTICO DE HARDWARE\n\n`;
      md += `- **Cliente:** ${clientName}\n`;
      md += `- **Modelo del Equipo:** ${deviceModel}\n`;
      md += `- **Tensión/Consumo Medido:** ${measuredValues}\n`;
      md += `- **Técnico:** ${tech} | **Fecha:** ${dateStr}\n`;
      md += `- **Protocolo:** ${tree?.name}\n\n`;
      md += `## RUTA DIAGNÓSTICA (${history.length} Decisiones)\n`;
      history.forEach((step, idx) => {
        md += `${idx + 1}. **${step.nodeTitle}** ➔ *${step.optionLabel}*\n`;
      });
      md += `\n## DIAGNÓSTICO FINAL: ${currentNode?.title}\n`;
      md += `${currentNode?.description || ''}\n\n`;
      if (currentNode?.technicalTips) {
        md += `> **Procedimiento Técnico Recomendado:** ${currentNode.technicalTips}\n\n`;
      }
      if (observations) {
        md += `**Observaciones:** ${observations}\n`;
      }

      copyTextSafe(md).then(() => {
        alert('¡Informe en Markdown copiado al portapapeles con éxito!');
      });
    });

    // Close on background click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.ReportModal = ReportModal;
window.DiagApp.copyTextSafe = copyTextSafe;
