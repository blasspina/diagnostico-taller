/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Comprehensive Decision Matrix Table View
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

class MatrixView {
  constructor(containerElement) {
    this.container = containerElement;
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedTool = 'all';

    this._init();
  }

  _init() {
    stateManager.on('treeLoaded', () => this.render());
    stateManager.on('nodeChanged', () => {
      this.updateActiveRow();
    });
  }

  render() {
    const tree = stateManager.currentTree;
    if (!tree || !tree.nodes) {
      this.container.innerHTML = `
        <div class="p-8 text-center text-slate-500">
          No hay árbol cargado para visualizar la matriz.
        </div>
      `;
      return;
    }

    const filteredNodes = tree.nodes.filter(node => {
      const matchesCategory = this.selectedCategory === 'all' || node.category === this.selectedCategory;
      const matchesTool = this.selectedTool === 'all' || (node.measurements && node.measurements.some(m => m.tool === this.selectedTool));
      const term = this.searchTerm.toLowerCase();
      const matchesSearch = !term || (
        node.title.toLowerCase().includes(term) ||
        node.description.toLowerCase().includes(term) ||
        node.id.toLowerCase().includes(term) ||
        (node.technicalTips && node.technicalTips.toLowerCase().includes(term)) ||
        (node.options && node.options.some(opt => opt.label.toLowerCase().includes(term)))
      );
      return matchesCategory && matchesTool && matchesSearch;
    });

    this.container.innerHTML = `
      <div class="h-full flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
        <!-- Matrix Header & Filter Controls -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              Matriz de Decisiones Técnicas
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Vista tabular exhaustiva de todos los puntos de prueba, tolerancias y caminos de ramificación.
            </p>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Search Input -->
            <div class="relative min-w-[200px] flex-1 sm:flex-initial">
              <input type="text" id="matrix-search" placeholder="Buscar por falla, componente..." value="${this.searchTerm}" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 pl-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500">
              <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>

            <!-- Category Filter -->
            <select id="matrix-category-filter" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500">
              <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>Todas las Categorías</option>
              <option value="symptom" ${this.selectedCategory === 'symptom' ? 'selected' : ''}>Síntomas</option>
              <option value="measurement" ${this.selectedCategory === 'measurement' ? 'selected' : ''}>Medición Eléctrica</option>
              <option value="inspection" ${this.selectedCategory === 'inspection' ? 'selected' : ''}>Inspección Visual</option>
              <option value="action" ${this.selectedCategory === 'action' ? 'selected' : ''}>Acción Técnica</option>
              <option value="verdict" ${this.selectedCategory === 'verdict' ? 'selected' : ''}>Veredictos</option>
            </select>

            <!-- Counter badge -->
            <span class="text-xs font-mono-tech px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
              ${filteredNodes.length} / ${tree.nodes.length}
            </span>
          </div>
        </div>

        <!-- Table Container -->
        <div class="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-400 font-mono-tech uppercase text-[11px]">
              <tr>
                <th class="p-3 w-32">Nodo / Tipo</th>
                <th class="p-3 min-w-[220px]">Paso Diagnóstico & Descripción</th>
                <th class="p-3 min-w-[200px]">Herramientas & Lecturas Nominales</th>
                <th class="p-3 min-w-[260px]">Caminos de Salida (Opciones)</th>
                <th class="p-3 min-w-[200px]">Consejos Técnicos</th>
                <th class="p-3 w-20 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              ${filteredNodes.length === 0 ? `
                <tr>
                  <td colspan="6" class="p-8 text-center text-slate-500">
                    No se encontraron nodos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ` : filteredNodes.map(node => {
                const catInfo = CATEGORIES[node.category] || CATEGORIES.action;
                const isCurrent = stateManager.currentNodeId === node.id;
                return `
                  <tr id="matrix-row-${node.id}" class="hover:bg-slate-900/80 transition-colors ${isCurrent ? 'bg-cyan-950/30 border-l-4 border-cyan-400' : ''}">
                    <!-- Column 1: Node & Category -->
                    <td class="p-3 align-top font-mono-tech space-y-1">
                      <div class="font-bold text-slate-300 text-[11px]">${node.id}</div>
                      <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${catInfo.badgeClass}">
                        ${catInfo.label}
                      </span>
                    </td>

                    <!-- Column 2: Title & Description -->
                    <td class="p-3 align-top space-y-1">
                      <div class="font-bold text-slate-100 text-xs">${node.title}</div>
                      <p class="text-slate-400 text-[11px] leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer" title="${node.description}">
                        ${node.description}
                      </p>
                    </td>

                    <!-- Column 3: Measurements -->
                    <td class="p-3 align-top space-y-1.5">
                      ${(node.measurements && node.measurements.length > 0) ? node.measurements.map(m => `
                        <div class="p-1.5 rounded bg-slate-900/90 border border-slate-800 font-mono-tech text-[10px]">
                          <div class="text-cyan-400 font-semibold flex items-center gap-1">
                            <span>⚡</span> ${m.tool}
                          </div>
                          <div class="text-emerald-400 font-bold mt-0.5">Esp: ${m.expected}</div>
                          <div class="text-slate-500 text-[9px]">Tol: ${m.tolerance}</div>
                          ${(m.referenceValues || node.referenceValues) ? `
                            <div class="mt-1 pt-1 border-t border-slate-800/80 space-y-0.5 text-[9px]">
                              ${(m.referenceValues?.diodeDrop || node.referenceValues?.diodeDrop) ? `<div class="text-rose-400 font-medium truncate">🔴 Diodo: ${m.referenceValues?.diodeDrop || node.referenceValues?.diodeDrop}</div>` : ''}
                              ${(m.referenceValues?.nominalVoltage || node.referenceValues?.nominalVoltage) ? `<div class="text-cyan-400 font-medium truncate">⚡ Volt: ${m.referenceValues?.nominalVoltage || node.referenceValues?.nominalVoltage}</div>` : ''}
                              ${(m.referenceValues?.usbCurrent || node.referenceValues?.usbCurrent) ? `<div class="text-emerald-400 font-medium truncate">🔌 USB: ${m.referenceValues?.usbCurrent || node.referenceValues?.usbCurrent}</div>` : ''}
                            </div>
                          ` : ''}
                        </div>
                      `).join('') : '<span class="text-slate-600 italic">Sin mediciones</span>'}
                    </td>

                    <!-- Column 4: Options -->
                    <td class="p-3 align-top space-y-1">
                      ${(node.options && node.options.length > 0) ? node.options.map(opt => {
                        const colorCfg = BADGE_COLORS[opt.badgeColor] || BADGE_COLORS.blue;
                        return `
                          <div class="p-1.5 rounded border ${colorCfg.border} ${colorCfg.bg} flex items-start justify-between gap-1.5 text-[10px]">
                            <span class="${colorCfg.text} font-medium">${opt.label}</span>
                            <code class="text-[9px] font-mono-tech px-1 rounded bg-slate-900/80 text-slate-400 flex-shrink-0">
                              ➔ ${opt.targetNodeId}
                            </code>
                          </div>
                        `;
                      }).join('') : '<span class="inline-block px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 font-mono-tech text-[10px] border border-emerald-800">Punto Terminal / Veredicto</span>'}
                    </td>

                    <!-- Column 5: Technical Tips -->
                    <td class="p-3 align-top text-amber-200/80 text-[11px] leading-relaxed">
                      ${node.technicalTips ? `
                        <div class="p-2 rounded bg-amber-950/20 border border-amber-900/40">
                          ${node.technicalTips}
                        </div>
                      ` : '<span class="text-slate-600 italic">N/A</span>'}
                    </td>

                    <!-- Column 6: Action -->
                    <td class="p-3 align-top text-center">
                      <button data-jump-node="${node.id}" class="btn-jump-matrix px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[11px] transition-colors border border-slate-700 hover:border-cyan-500 whitespace-nowrap" title="Cargar este paso en el simulador">
                        Ir al Paso
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  updateActiveRow() {
    const currentNodeId = stateManager.currentNodeId;
    this.container.querySelectorAll('tr[id^="matrix-row-"]').forEach(tr => {
      tr.classList.remove('bg-cyan-950/30', 'border-l-4', 'border-cyan-400');
    });
    const activeRow = this.container.querySelector(`#matrix-row-${currentNodeId}`);
    if (activeRow) {
      activeRow.classList.add('bg-cyan-950/30', 'border-l-4', 'border-cyan-400');
    }
  }

  _bindEvents() {
    const searchInput = this.container.querySelector('#matrix-search');
    searchInput?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.render();
      const newInput = this.container.querySelector('#matrix-search');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });

    const catFilter = this.container.querySelector('#matrix-category-filter');
    catFilter?.addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.render();
    });

    this.container.querySelectorAll('.btn-jump-matrix').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-jump-node');
        if (targetId) {
          stateManager.jumpToNode(targetId);
          stateManager.setViewMode('split');
        }
      });
    });
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.MatrixView = MatrixView;
