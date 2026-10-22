/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * JSON Tree Editor, Validator, and Import/Export Modal
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

class EditorModal {
  constructor() {
    this.modalEl = null;
    this._init();
  }

  _init() {
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'editor-modal-wrapper';
    this.modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm hidden';
    document.body.appendChild(this.modalEl);

    document.addEventListener('open-editor-modal', () => this.open());
  }

  open() {
    this.render();
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }

  render() {
    const currentTree = stateManager.currentTree;
    const jsonString = currentTree ? JSON.stringify(currentTree, null, 2) : '{\n  "id": "custom_tree",\n  "name": "Nuevo Árbol",\n  "nodes": []\n}';

    this.modalEl.innerHTML = `
      <div class="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        <!-- Header -->
        <div class="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </div>
            <div>
              <h3 class="text-base md:text-lg font-bold text-white">Editor e Importador de Árboles JSON</h3>
              <p class="text-xs text-slate-400">Carga, valida y personaliza las ramas diagnósticas en tiempo real.</p>
            </div>
          </div>
          <button id="btn-close-editor" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Editor Workspace -->
        <div class="flex-1 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
          <!-- Action Bar -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div class="flex items-center gap-2">
              <label class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer flex items-center gap-1.5 font-medium transition-colors">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <span>Cargar Archivo JSON</span>
                <input type="file" id="input-upload-json" accept=".json" class="hidden">
              </label>
              <button id="btn-download-json" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition-colors">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                <span>Descargar JSON</span>
              </button>
              <button id="btn-copy-json" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition-colors">
                <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <span>Copiar al Portapapeles</span>
              </button>
            </div>
            <button id="btn-format-json" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono-tech transition-colors">
              Formatear JSON
            </button>
          </div>

          <!-- Code Textarea -->
          <div class="flex-1 relative rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            <textarea id="json-editor-textarea" spellcheck="false" class="w-full flex-1 p-4 bg-slate-950 font-mono-tech text-xs text-cyan-300 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500">${jsonString}</textarea>
          </div>

          <!-- Live Validation Feedback Box -->
          <div id="validation-feedback-box" class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono-tech max-h-28 overflow-y-auto">
            <div class="text-emerald-400 flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Estructura JSON válida según interfaz estricta de nodos.</span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span class="text-xs text-slate-500">Esquema: Hardware Diagnostic Graph JSON v1.0</span>
          <div class="flex items-center gap-2">
            <button id="btn-cancel-editor" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
              Cancelar
            </button>
            <button id="btn-apply-json" class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Validar y Aplicar Árbol</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const textarea = this.modalEl.querySelector('#json-editor-textarea');
    const feedbackBox = this.modalEl.querySelector('#validation-feedback-box');

    const checkValidity = () => {
      try {
        const parsed = JSON.parse(textarea.value);
        const nodes = Array.isArray(parsed) ? parsed : parsed.nodes;
        const validation = validateTree(nodes);

        if (!validation.valid) {
          feedbackBox.innerHTML = `
            <div class="text-rose-400 space-y-1">
              <div class="font-bold flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Se detectaron ${validation.errors.length} errores de esquema:
              </div>
              <ul class="list-disc list-inside space-y-0.5 text-[11px] text-rose-300">
                ${validation.errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}
                ${validation.errors.length > 5 ? `<li>... y ${validation.errors.length - 5} más</li>` : ''}
              </ul>
            </div>
          `;
          return false;
        } else {
          feedbackBox.innerHTML = `
            <div class="text-emerald-400 flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Estructura JSON válida: ${nodes.length} nodos verificados con éxito.</span>
            </div>
          `;
          return parsed;
        }
      } catch (err) {
        feedbackBox.innerHTML = `
          <div class="text-rose-400 flex items-center gap-1.5 font-bold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            <span>Error de sintaxis JSON: ${err.message}</span>
          </div>
        `;
        return false;
      }
    };

    textarea.addEventListener('input', checkValidity);

    this.modalEl.querySelector('#btn-format-json')?.addEventListener('click', () => {
      try {
        const obj = JSON.parse(textarea.value);
        textarea.value = JSON.stringify(obj, null, 2);
        checkValidity();
      } catch (e) {
        alert('No se puede formatear: la sintaxis JSON es inválida.');
      }
    });

    this.modalEl.querySelector('#btn-copy-json')?.addEventListener('click', () => {
      copyTextSafe(textarea.value).then(() => {
        alert('JSON copiado al portapapeles.');
      });
    });

    this.modalEl.querySelector('#btn-download-json')?.addEventListener('click', () => {
      const blob = new Blob([textarea.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hardware_diagnostic_tree_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const fileInput = this.modalEl.querySelector('#input-upload-json');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        textarea.value = event.target.result;
        checkValidity();
      };
      reader.readAsText(file);
    });

    this.modalEl.querySelector('#btn-apply-json')?.addEventListener('click', () => {
      const parsed = checkValidity();
      if (!parsed) {
        alert('Corrige los errores de validación antes de aplicar el árbol.');
        return;
      }

      let treeToLoad = parsed;
      if (Array.isArray(parsed)) {
        treeToLoad = {
          id: 'custom_imported_' + Date.now(),
          name: 'Árbol Personalizado Importado',
          deviceType: 'Dispositivo Electrónico',
          description: 'Cargado mediante el editor JSON.',
          nodes: parsed
        };
      }

      stateManager.loadTree(treeToLoad);
      this.close();
    });

    this.modalEl.querySelector('#btn-close-editor')?.addEventListener('click', () => this.close());
    this.modalEl.querySelector('#btn-cancel-editor')?.addEventListener('click', () => this.close());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.EditorModal = EditorModal;
