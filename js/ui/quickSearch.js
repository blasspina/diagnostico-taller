/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Quick Search & Fast Filter Component
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

class QuickSearch {
  constructor() {
    this.searchInput = null;
    this.resultsContainer = null;
    this.clearBtn = null;
    this.selectedIndex = -1;
    this.currentResults = [];

    this._init();
  }

  _init() {
    this.searchInput = document.getElementById('global-quick-search');
    this.resultsContainer = document.getElementById('quick-search-results');
    this.clearBtn = document.getElementById('btn-clear-search');

    if (!this.searchInput || !this.resultsContainer) return;

    this.searchInput.addEventListener('input', (e) => this._onSearch(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this._onKeyDown(e));

    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.trim().length > 0) {
        this._showResults();
      }
    });

    this.clearBtn?.addEventListener('click', () => {
      this.searchInput.value = '';
      this.clearBtn.classList.add('hidden');
      this._hideResults();
      this.searchInput.focus();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#quick-search-wrapper')) {
        this._hideResults();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        this.searchInput.focus();
        this.searchInput.select();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.searchInput.focus();
        this.searchInput.select();
      }
    });

    stateManager.on('nodeChanged', () => {
      this._hideResults();
    });
  }

  _onSearch(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    if (this.clearBtn) {
      if (query.length > 0) {
        this.clearBtn.classList.remove('hidden');
      } else {
        this.clearBtn.classList.add('hidden');
      }
    }

    if (!query) {
      this._hideResults();
      return;
    }

    const tree = stateManager.currentTree;
    if (!tree || !Array.isArray(tree.nodes)) {
      this._hideResults();
      return;
    }

    const matches = [];
    tree.nodes.forEach(node => {
      let score = 0;
      let matchReason = '';

      if (node.title.toLowerCase().includes(query)) {
        score += 10;
        matchReason = 'Título del paso';
      }

      if (node.id.toLowerCase().includes(query)) {
        score += 8;
        matchReason = matchReason || `ID: ${node.id}`;
      }

      if (node.measurements && node.measurements.length > 0) {
        for (const m of node.measurements) {
          if (m.tool && m.tool.toLowerCase().includes(query)) {
            score += 6;
            matchReason = matchReason || `Herramienta: ${m.tool}`;
            break;
          }
          if (m.expected && m.expected.toLowerCase().includes(query)) {
            score += 6;
            matchReason = matchReason || 'Medición esperada';
            break;
          }
          if (m.referenceValues) {
            const refStr = Object.values(m.referenceValues).join(' ').toLowerCase();
            if (refStr.includes(query)) {
              score += 7;
              matchReason = matchReason || 'Valor de referencia de taller';
              break;
            }
          }
        }
      }

      if (node.description && node.description.toLowerCase().includes(query)) {
        score += 4;
        matchReason = matchReason || 'Descripción técnica';
      }

      if (node.technicalTips && node.technicalTips.toLowerCase().includes(query)) {
        score += 5;
        matchReason = matchReason || 'Consejo técnico';
      }

      if (node.options && node.options.some(opt => opt.label.toLowerCase().includes(query))) {
        score += 3;
        matchReason = matchReason || 'Condición observable';
      }

      if (score > 0) {
        matches.push({ node, score, matchReason });
      }
    });

    matches.sort((a, b) => b.score - a.score);
    this.currentResults = matches.slice(0, 8);
    this.selectedIndex = this.currentResults.length > 0 ? 0 : -1;

    this._renderDropdown(query);
  }

  _renderDropdown(query) {
    if (this.currentResults.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-500 font-mono-tech">
          Sin coincidencias para "<span class="text-cyan-400">${this._escape(query)}</span>" en este árbol.
        </div>
      `;
      this._showResults();
      return;
    }

    this.resultsContainer.innerHTML = `
      <div class="p-2 border-b border-slate-800 text-[10px] uppercase font-mono-tech text-slate-400 flex justify-between items-center bg-slate-950/40">
        <span>Resultados Rápidos (${this.currentResults.length})</span>
        <span class="text-slate-500 text-[9px]">[↑↓] Navegar • [Enter] Seleccionar</span>
      </div>
      <div class="py-1">
        ${this.currentResults.map((item, idx) => {
          const { node, matchReason } = item;
          const catInfo = CATEGORIES[node.category] || CATEGORIES.action;
          const isSelected = idx === this.selectedIndex;
          const isCurrent = stateManager.currentNodeId === node.id;

          return `
            <div data-result-idx="${idx}" class="search-result-item px-3 py-2 cursor-pointer transition-colors flex items-center justify-between gap-2.5 ${
              isSelected ? 'bg-cyan-950/60 border-l-2 border-cyan-400' : 'hover:bg-slate-800/60'
            }">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded border ${catInfo.badgeClass}">
                    ${catInfo.label}
                  </span>
                  <span class="text-[10px] font-mono-tech text-slate-400 truncate max-w-[140px]">
                    #${node.id}
                  </span>
                  ${isCurrent ? '<span class="text-[9px] font-bold text-emerald-400 font-mono-tech">ACTIVO</span>' : ''}
                </div>
                <div class="text-xs font-semibold text-slate-200 truncate">
                  ${this._highlight(node.title, query)}
                </div>
                <div class="text-[10px] text-slate-400 truncate mt-0.5">
                  <span class="text-cyan-400/80 font-mono-tech">[${matchReason}]</span> ${this._highlight(node.description, query)}
                </div>
              </div>
              <span class="text-slate-500 hover:text-cyan-400 text-xs flex-shrink-0">➔</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.resultsContainer.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-result-idx'), 10);
        if (!isNaN(idx) && this.currentResults[idx]) {
          this._selectResult(idx);
        }
      });
    });

    this._showResults();
  }

  _selectResult(index) {
    const item = this.currentResults[index];
    if (!item) return;

    stateManager.jumpToNode(item.node.id);
    this._hideResults();
    this.searchInput.value = '';
    if (this.clearBtn) this.clearBtn.classList.add('hidden');
    this.searchInput.blur();
  }

  _onKeyDown(e) {
    if (this.resultsContainer.classList.contains('hidden')) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        this._onSearch(this.searchInput.value);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.currentResults.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.currentResults.length;
        this._updateSelectionHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.currentResults.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.currentResults.length) % this.currentResults.length;
        this._updateSelectionHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectedIndex >= 0 && this.selectedIndex < this.currentResults.length) {
        this._selectResult(this.selectedIndex);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._hideResults();
    }
  }

  _updateSelectionHighlight() {
    const items = this.resultsContainer.querySelectorAll('.search-result-item');
    items.forEach((item, idx) => {
      if (idx === this.selectedIndex) {
        item.classList.add('bg-cyan-950/60', 'border-l-2', 'border-cyan-400');
        item.classList.remove('hover:bg-slate-800/60');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('bg-cyan-950/60', 'border-l-2', 'border-cyan-400');
        item.classList.add('hover:bg-slate-800/60');
      }
    });
  }

  _showResults() {
    this.resultsContainer.classList.remove('hidden');
  }

  _hideResults() {
    this.resultsContainer.classList.add('hidden');
    this.selectedIndex = -1;
  }

  _highlight(text, query) {
    if (!text) return '';
    if (!query) return this._escape(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return this._escape(text).replace(regex, '<span class="text-cyan-300 font-bold bg-cyan-950/80 px-0.5 rounded">$1</span>');
  }

  _escape(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.QuickSearch = QuickSearch;
