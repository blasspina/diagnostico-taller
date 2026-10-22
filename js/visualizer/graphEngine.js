/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Native SVG Nodal Graph Engine with Pan, Zoom, and Live Flow Tracing
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

class GraphEngine {
  constructor(containerElement) {
    this.container = containerElement;
    this.svg = null;
    this.viewport = null;
    this.layoutEngine = new LayoutEngine();

    this.scale = 0.85;
    this.translateX = 0;
    this.translateY = 0;

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.layoutData = null;
    this.nodeElements = new Map();
    this.edgeElements = new Map();

    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div class="relative w-full h-full overflow-hidden canvas-grid-bg select-none">
        <!-- Floating Graph Controls Toolbar -->
        <div class="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 glass-panel rounded-xl shadow-2xl border border-slate-700/60">
          <button id="btn-zoom-in" title="Acercar (Zoom In)" class="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          </button>
          <button id="btn-zoom-out" title="Alejar (Zoom Out)" class="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
          </button>
          <div class="w-px h-5 bg-slate-700 mx-0.5"></div>
          <button id="btn-fit-screen" title="Ajustar a Pantalla (Fit)" class="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          </button>
          <button id="btn-focus-active" title="Centrar en Paso Activo" class="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </button>
          <div class="w-px h-5 bg-slate-700 mx-0.5"></div>
          <span id="zoom-level-text" class="text-xs font-mono-tech text-slate-400 px-2 min-w-[50px] text-center">85%</span>
        </div>

        <!-- Category Legend Overlay -->
        <div class="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 px-3.5 py-2 glass-panel-subtle rounded-xl text-xs border border-slate-800">
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span class="text-slate-300">Síntoma</span></div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span><span class="text-slate-300">Medición</span></div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span><span class="text-slate-300">Inspección</span></div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span><span class="text-slate-300">Acción</span></div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span class="text-slate-300">Veredicto</span></div>
        </div>

        <!-- Mobile Quick Node Jump Bar (Appears when tapping any node in Graph View) -->
        <div id="graph-mobile-jump-bar" class="hidden absolute bottom-3 left-3 right-3 z-30 p-3 glass-panel rounded-xl border border-cyan-500/50 shadow-2xl flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-[10px] font-mono-tech uppercase text-cyan-400">Nodo Seleccionado</div>
            <div id="graph-jump-node-title" class="text-xs font-bold text-white truncate">Paso</div>
          </div>
          <button id="btn-jump-to-selected-node" class="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 flex-shrink-0 shadow-md">
            <span>Ir a este Paso</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>

        <!-- SVG Visualizer Canvas -->
        <svg id="nodal-svg" class="w-full h-full cursor-grab active:cursor-grabbing">
          <defs>
            <!-- Marker Arrows -->
            <marker id="arrow-default" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0.5 L 10 5 L 0 9.5 z" fill="#06b6d4" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrow-yellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>

            <!-- Glow Filters -->
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g id="viewport">
            <g id="edges-layer"></g>
            <g id="nodes-layer"></g>
          </g>
        </svg>
      </div>
    `;

    this.svg = this.container.querySelector('#nodal-svg');
    this.viewport = this.container.querySelector('#viewport');

    this._setupPanZoom();
    this._bindControls();

    // Subscribe to state manager events
    stateManager.on('treeLoaded', () => this.render());
    stateManager.on('nodeChanged', () => this.updateHighlights());
    stateManager.on('historyChanged', () => this.updateHighlights());
  }

  _setupPanZoom() {
    // Mouse Pan
    this.svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, input, select')) return;
      this.isDragging = true;
      this.startX = e.clientX - this.translateX;
      this.startY = e.clientY - this.translateY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.translateX = e.clientX - this.startX;
      this.translateY = e.clientY - this.startY;
      this._applyTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Wheel Zoom
    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newScale = Math.min(Math.max(this.scale * zoomFactor, 0.2), 3.0);

      // Zoom toward mouse pointer
      this.translateX = mouseX - (mouseX - this.translateX) * (newScale / this.scale);
      this.translateY = mouseY - (mouseY - this.translateY) * (newScale / this.scale);
      this.scale = newScale;

      this._applyTransform();
    }, { passive: false });

    // Touch Support (1-finger Pan & 2-finger Pinch-Zoom around touch midpoint)
    let lastTouchDist = 0;
    let lastTouchMidX = 0;
    let lastTouchMidY = 0;

    this.svg.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, input, select')) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.translateX;
        this.startY = e.touches[0].clientY - this.translateY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const rect = this.svg.getBoundingClientRect();
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        lastTouchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      }
    }, { passive: true });

    this.svg.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        this.translateX = e.touches[0].clientX - this.startX;
        this.translateY = e.touches[0].clientY - this.startY;
        this._applyTransform();
      } else if (e.touches.length === 2) {
        const rect = this.svg.getBoundingClientRect();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        if (lastTouchDist > 0) {
          const factor = dist / lastTouchDist;
          const newScale = Math.min(Math.max(this.scale * factor, 0.2), 3.0);
          this.translateX = midX - (lastTouchMidX - this.translateX) * (newScale / this.scale);
          this.translateY = midY - (lastTouchMidY - this.translateY) * (newScale / this.scale);
          this.scale = newScale;
          this._applyTransform();
        }
        lastTouchDist = dist;
        lastTouchMidX = midX;
        lastTouchMidY = midY;
      }
    }, { passive: true });

    this.svg.addEventListener('touchend', () => {
      this.isDragging = false;
      lastTouchDist = 0;
    });
  }

  _bindControls() {
    this.container.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      this.zoom(1.25);
    });

    this.container.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      this.zoom(0.8);
    });

    this.container.querySelector('#btn-fit-screen')?.addEventListener('click', () => {
      this.fitToScreen();
    });

    this.container.querySelector('#btn-focus-active')?.addEventListener('click', () => {
      this.focusActiveNode();
    });

    this.container.querySelector('#btn-jump-to-selected-node')?.addEventListener('click', () => {
      if (this.selectedJumpNodeId) {
        stateManager.jumpToNode(this.selectedJumpNodeId);
        const jumpBar = this.container.querySelector('#graph-mobile-jump-bar');
        jumpBar?.classList.add('hidden');
        if (window.innerWidth < 1024 || stateManager.viewMode === 'graph') {
          stateManager.setViewMode(window.innerWidth < 1024 ? 'runner' : 'split');
        }
      }
    });
  }

  zoom(factor) {
    const rect = this.svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newScale = Math.min(Math.max(this.scale * factor, 0.2), 3.0);
    this.translateX = centerX - (centerX - this.translateX) * (newScale / this.scale);
    this.translateY = centerY - (centerY - this.translateY) * (newScale / this.scale);
    this.scale = newScale;
    this._applyTransform();
  }

  _applyTransform() {
    if (this.viewport) {
      this.viewport.setAttribute('transform', `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`);
    }
    const zoomText = this.container.querySelector('#zoom-level-text');
    if (zoomText) {
      zoomText.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  render() {
    const tree = stateManager.currentTree;
    if (!tree || !tree.nodes) return;

    this.layoutData = this.layoutEngine.computeLayout(tree.nodes);
    const edgesLayer = this.viewport.querySelector('#edges-layer');
    const nodesLayer = this.viewport.querySelector('#nodes-layer');

    edgesLayer.innerHTML = '';
    nodesLayer.innerHTML = '';
    this.nodeElements.clear();
    this.edgeElements.clear();

    // 1. Render Edges with cubic Bezier curves
    this.layoutData.edges.forEach(edge => {
      const { fromPos, toPos, from, to, label, badgeColor } = edge;
      if (!fromPos || !toPos) return;

      const x1 = fromPos.x + fromPos.width / 2;
      const y1 = fromPos.y + fromPos.height;
      const x2 = toPos.x + toPos.width / 2;
      const y2 = toPos.y;

      const dy = Math.max(y2 - y1, 40);
      const cp1x = x1;
      const cp1y = y1 + dy * 0.45;
      const cp2x = x2;
      const cp2y = y2 - dy * 0.45;

      const pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

      const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      edgeGroup.setAttribute('data-edge-id', `${from}->${to}`);

      // Path line
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', `graph-edge ${badgeColor}-edge`);
      path.setAttribute('marker-end', `url(#arrow-${badgeColor})`);

      // Edge Label badge (at curve midpoint)
      const midX = 0.125 * x1 + 0.375 * cp1x + 0.375 * cp2x + 0.125 * x2;
      const midY = 0.125 * y1 + 0.375 * cp1y + 0.375 * cp2y + 0.125 * y2;

      const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelGroup.setAttribute('transform', `translate(${midX}, ${midY})`);
      labelGroup.setAttribute('class', 'cursor-pointer hover:opacity-100 opacity-90 transition-opacity');

      const truncatedLabel = label.length > 28 ? label.substring(0, 26) + '…' : label;
      const labelWidth = Math.max(truncatedLabel.length * 6.5 + 16, 70);

      const labelRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelRect.setAttribute('x', -labelWidth / 2);
      labelRect.setAttribute('y', -11);
      labelRect.setAttribute('width', labelWidth);
      labelRect.setAttribute('height', 22);
      labelRect.setAttribute('rx', 11);
      labelRect.setAttribute('class', 'fill-slate-900 stroke-slate-700/80');
      labelRect.setAttribute('stroke-width', '1');

      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('dy', 3.5);
      labelText.setAttribute('class', 'text-[10px] font-medium fill-slate-300 select-none');
      labelText.textContent = truncatedLabel;

      const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      titleEl.textContent = label;
      labelGroup.appendChild(titleEl);

      labelGroup.appendChild(labelRect);
      labelGroup.appendChild(labelText);

      edgeGroup.appendChild(path);
      edgeGroup.appendChild(labelGroup);
      edgesLayer.appendChild(edgeGroup);

      this.edgeElements.set(`${from}->${to}`, { group: edgeGroup, path });
    });

    // 2. Render Nodes
    tree.nodes.forEach(node => {
      const pos = this.layoutData.positions.get(node.id);
      if (!pos) return;

      const catInfo = CATEGORIES[node.category] || CATEGORIES.action;
      const nodeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeG.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      nodeG.setAttribute('data-node-id', node.id);
      nodeG.setAttribute('class', 'cursor-pointer group');

      const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      fo.setAttribute('width', pos.width);
      fo.setAttribute('height', pos.height);

      const isCurrent = stateManager.currentNodeId === node.id;
      const nodeCard = document.createElement('div');
      nodeCard.className = `w-full h-full rounded-xl border bg-slate-900/90 shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden p-3 select-none ${
        isCurrent ? 'node-active border-cyan-400 bg-slate-900' : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/90'
      }`;

      const measCount = Array.isArray(node.measurements) ? node.measurements.length : 0;
      const optsCount = Array.isArray(node.options) ? node.options.length : 0;

      nodeCard.innerHTML = `
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catInfo.badgeClass}">
            ${catInfo.label}
          </span>
          <div class="flex items-center gap-1.5 text-[10px] font-mono-tech text-slate-400">
            ${measCount > 0 ? `<span title="${measCount} mediciones">⚡${measCount}</span>` : ''}
            <span class="text-slate-500">#${node.id.split('_')[0] || ''}</span>
          </div>
        </div>

        <div class="font-semibold text-xs text-slate-100 line-clamp-2 leading-tight flex-1">
          ${node.title}
        </div>

        <div class="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span class="truncate max-w-[170px] text-slate-400">${node.measurements?.[0]?.tool || 'Paso estándar'}</span>
          <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono-tech font-bold text-[10px]">
            ${optsCount === 0 ? 'FIN' : `${optsCount} ramas`}
          </span>
        </div>
      `;

      nodeG.addEventListener('click', (e) => {
        e.stopPropagation();
        stateManager.inspectNode(node.id);
        this.selectedJumpNodeId = node.id;
        const jumpBar = this.container.querySelector('#graph-mobile-jump-bar');
        const jumpTitle = this.container.querySelector('#graph-jump-node-title');
        if (jumpBar && jumpTitle) {
          jumpTitle.textContent = node.title;
          jumpBar.classList.remove('hidden');
        }
      });

      nodeG.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        stateManager.jumpToNode(node.id);
      });

      fo.appendChild(nodeCard);
      nodeG.appendChild(fo);
      nodesLayer.appendChild(nodeG);

      this.nodeElements.set(node.id, { group: nodeG, card: nodeCard, pos });
    });

    this.updateHighlights();
    this.fitToScreen();
  }

  updateHighlights() {
    const { nodeIds, edgeIds } = stateManager.getTraversedPath();
    const currentNodeId = stateManager.currentNodeId;

    this.nodeElements.forEach(({ card }, nodeId) => {
      const isCurrent = nodeId === currentNodeId;
      const isTraversed = nodeIds.has(nodeId);

      card.classList.remove('node-active', 'border-cyan-400', 'border-emerald-500', 'border-slate-800');

      if (isCurrent) {
        card.classList.add('node-active', 'border-cyan-400');
      } else if (isTraversed) {
        card.classList.add('border-emerald-600/80', 'bg-slate-900/95');
      } else {
        card.classList.add('border-slate-800');
      }
    });

    this.edgeElements.forEach(({ path }, edgeKey) => {
      const isTraversed = edgeIds.has(edgeKey);
      if (isTraversed) {
        path.classList.add('active-edge');
        path.setAttribute('marker-end', 'url(#arrow-active)');
      } else {
        path.classList.remove('active-edge');
        const classStr = path.getAttribute('class') || (typeof path.className === 'string' ? path.className : path.className?.baseVal) || '';
        const match = classStr.match(/(red|green|yellow|blue)-edge/);
        const originalBadgeColor = match ? match[1] : 'default';
        path.setAttribute('marker-end', `url(#arrow-${originalBadgeColor})`);
      }
    });
  }

  focusActiveNode() {
    const activeId = stateManager.currentNodeId;
    if (!activeId || !this.layoutData) return;
    const pos = this.layoutData.positions.get(activeId);
    if (!pos) return;

    const rect = this.svg.getBoundingClientRect();
    this.scale = 0.95;
    this.translateX = rect.width / 2 - (pos.x + pos.width / 2) * this.scale;
    this.translateY = rect.height / 2 - (pos.y + pos.height / 2) * this.scale;
    this._applyTransform();
  }

  fitToScreen() {
    if (!this.layoutData || !this.layoutData.bounds) return;
    const { bounds } = this.layoutData;
    const rect = this.svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const padding = 100;
    const scaleX = (rect.width - padding) / Math.max(bounds.width, 100);
    const scaleY = (rect.height - padding) / Math.max(bounds.height, 100);
    this.scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.0);

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    this.translateX = rect.width / 2 - centerX * this.scale;
    this.translateY = rect.height / 2 - centerY * this.scale;

    this._applyTransform();
  }
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.GraphEngine = GraphEngine;
