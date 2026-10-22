/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * State Manager (Central Reactive Store + Auto-Save & Session Recovery via localStorage)
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

const SESSION_STORAGE_KEY = 'diag_active_session_v1';

class StateManager {
  constructor() {
    this.currentTree = null;
    this.nodeMap = new Map();
    this.currentNodeId = null;
    this.inspectedNodeId = null;
    this.history = []; // Array of { nodeId, nodeTitle, optionLabel, badgeColor, targetNodeId, timestamp }
    this.startTime = Date.now();
    this.viewMode = 'split'; // 'split' | 'runner' | 'graph' | 'matrix'

    let savedTechName = 'Técnico Especialista';
    try {
      savedTechName = localStorage.getItem('diag_tech_name') || 'Técnico Especialista';
    } catch (e) {
      // Ignore storage access errors
    }

    this.technicianName = savedTechName;
    this.sessionNotes = '';
    this.reportData = {
      clientName: '',
      deviceModel: '',
      measuredValues: '',
      observations: '',
      serialNumber: '',
      statusType: 'presupuesto',
      budget: '$ 45.000',
      technicianName: savedTechName
    };

    this.subscribers = {};
  }

  on(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    return () => {
      this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in subscriber for event ${event}:`, e);
        }
      });
    }
  }

  /**
   * Loads a decision tree into the engine.
   * @param {Object} tree 
   * @param {string|null} initialNodeId 
   * @param {boolean} skipSave - When true, avoids overwriting localStorage before recovery prompt
   */
  loadTree(tree, initialNodeId = null, skipSave = false) {
    if (!tree || !Array.isArray(tree.nodes)) return;

    this.currentTree = tree;
    this.nodeMap.clear();
    tree.nodes.forEach(node => {
      this.nodeMap.set(node.id, node);
    });

    this.history = [];
    this.startTime = Date.now();

    // Choose start node: explicit initialNodeId, or first node marked as symptom, or first node
    let startId = initialNodeId;
    if (!startId || !this.nodeMap.has(startId)) {
      const symptomNode = tree.nodes.find(n => n.category === 'symptom');
      startId = symptomNode ? symptomNode.id : tree.nodes[0]?.id;
    }

    this.currentNodeId = startId;
    this.inspectedNodeId = startId;

    if (!this.reportData.deviceModel || PRESET_TREES.some(t => t.deviceType === this.reportData.deviceModel)) {
      this.reportData.deviceModel = '';
    }

    this.emit('treeLoaded', { tree: this.currentTree, startNode: this.getCurrentNode() });
    this.emit('nodeChanged', { node: this.getCurrentNode(), history: this.history });

    if (!skipSave) {
      this.saveSessionToStorage();
    }
  }

  getCurrentNode() {
    return this.nodeMap.get(this.currentNodeId) || null;
  }

  getNode(id) {
    return this.nodeMap.get(id) || null;
  }

  getInspectedNode() {
    return this.nodeMap.get(this.inspectedNodeId) || this.getCurrentNode();
  }

  selectOption(optionIndex) {
    const currentNode = this.getCurrentNode();
    if (!currentNode || !currentNode.options || !currentNode.options[optionIndex]) {
      return false;
    }

    const option = currentNode.options[optionIndex];
    const targetNode = this.getNode(option.targetNodeId);
    if (!targetNode) {
      console.warn(`Target node not found: ${option.targetNodeId}`);
      return false;
    }

    // Audio feedback depending on badge color or verdict
    if (targetNode.category === 'verdict') {
      audioEngine.playVerdictSound();
    } else if (option.badgeColor === 'red') {
      audioEngine.playShortAlert();
    } else if (option.badgeColor === 'green') {
      audioEngine.playContinuityBeep();
    } else {
      audioEngine.playClick();
    }

    // Record step in history
    this.history.push({
      nodeId: currentNode.id,
      nodeTitle: currentNode.title,
      optionLabel: option.label,
      badgeColor: option.badgeColor,
      targetNodeId: option.targetNodeId,
      timestamp: Date.now()
    });

    this.currentNodeId = option.targetNodeId;
    this.inspectedNodeId = option.targetNodeId;

    this.saveSessionToStorage();
    this.emit('historyChanged', { history: this.history });
    this.emit('nodeChanged', { node: this.getCurrentNode(), history: this.history, fromOption: option });
    return true;
  }

  backtrack() {
    if (this.history.length === 0) return false;
    audioEngine.playClick();
    const lastStep = this.history.pop();
    this.currentNodeId = lastStep.nodeId;
    this.inspectedNodeId = lastStep.nodeId;

    this.saveSessionToStorage();
    this.emit('historyChanged', { history: this.history });
    this.emit('nodeChanged', { node: this.getCurrentNode(), history: this.history });
    return true;
  }

  jumpToNode(nodeId) {
    const targetNode = this.getNode(nodeId);
    if (!targetNode) return false;

    audioEngine.playClick();
    this.currentNodeId = nodeId;
    this.inspectedNodeId = nodeId;

    this.saveSessionToStorage();
    this.emit('nodeChanged', { node: targetNode, history: this.history });
    return true;
  }

  inspectNode(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return false;
    this.inspectedNodeId = nodeId;
    this.emit('nodeInspected', { node });
    return true;
  }

  updateNotes(notesText, source = 'runner') {
    this.sessionNotes = notesText;
    this.reportData.observations = notesText;
    this.saveSessionToStorage();
    this.emit('notesChanged', { notes: this.sessionNotes, reportData: this.reportData, source });
  }

  updateReportData(partialData, source = 'report') {
    this.reportData = {
      ...this.reportData,
      ...partialData
    };
    if (partialData.observations !== undefined) {
      this.sessionNotes = partialData.observations;
    }
    if (partialData.technicianName !== undefined) {
      this.technicianName = partialData.technicianName;
      try {
        localStorage.setItem('diag_tech_name', partialData.technicianName);
      } catch (e) {
        // Ignore
      }
    }
    this.saveSessionToStorage();
    this.emit('notesChanged', { notes: this.sessionNotes, reportData: this.reportData, source });
  }

  resetDiagnostic(clearNotes = true) {
    if (!this.currentTree) return;
    audioEngine.playClick();
    const symptomNode = this.currentTree.nodes.find(n => n.category === 'symptom');
    const startId = symptomNode ? symptomNode.id : this.currentTree.nodes[0]?.id;
    this.history = [];
    this.startTime = Date.now();
    this.currentNodeId = startId;
    this.inspectedNodeId = startId;

    if (clearNotes) {
      this.sessionNotes = '';
      this.reportData.clientName = '';
      this.reportData.deviceModel = '';
      this.reportData.measuredValues = '';
      this.reportData.observations = '';
      this.reportData.serialNumber = '';
    }

    this.clearSavedSession();
    this.emit('historyChanged', { history: this.history });
    this.emit('nodeChanged', { node: this.getCurrentNode(), history: this.history });
    this.emit('notesChanged', { notes: this.sessionNotes, reportData: this.reportData, source: 'reset' });
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.saveSessionToStorage();
    this.emit('viewModeChanged', { mode });
  }

  getTraversedPath() {
    const nodeIds = new Set();
    const edgeIds = new Set();

    if (this.history.length > 0) {
      this.history.forEach(step => {
        nodeIds.add(step.nodeId);
        nodeIds.add(step.targetNodeId);
        edgeIds.add(`${step.nodeId}->${step.targetNodeId}`);
      });
    } else if (this.currentNodeId) {
      nodeIds.add(this.currentNodeId);
    }

    return { nodeIds, edgeIds };
  }

  /**
   * Persists current diagnostic state to localStorage.
   */
  saveSessionToStorage() {
    if (!this.currentTree) return;
    try {
      const isPreset = Array.isArray(PRESET_TREES) && PRESET_TREES.some(t => t.id === this.currentTree.id);
      const payload = {
        treeId: this.currentTree.id,
        treeName: this.currentTree.name,
        isCustomTree: !isPreset,
        customTree: !isPreset ? this.currentTree : null,
        currentNodeId: this.currentNodeId,
        inspectedNodeId: this.inspectedNodeId,
        history: this.history,
        startTime: this.startTime,
        savedAt: Date.now(),
        viewMode: this.viewMode,
        sessionNotes: this.sessionNotes || '',
        reportData: this.reportData
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('No se pudo guardar la sesión en localStorage:', e);
    }
  }

  /**
   * Checks if there is a meaningful saved session in localStorage to recover.
   * @returns {Object|null}
   */
  getRecoverableSession() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || !saved.treeId) return null;

      // Locate target tree
      const tree = saved.isCustomTree && saved.customTree
        ? saved.customTree
        : (Array.isArray(PRESET_TREES) ? PRESET_TREES.find(t => t.id === saved.treeId) : null);

      if (!tree || !Array.isArray(tree.nodes) || tree.nodes.length === 0) return null;

      const symptomNode = tree.nodes.find(n => n.category === 'symptom') || tree.nodes[0];
      const defaultStartId = symptomNode?.id;
      const defaultFirstTreeId = Array.isArray(PRESET_TREES) && PRESET_TREES[0]?.id;

      const hasHistory = Array.isArray(saved.history) && saved.history.length > 0;
      const hasAdvancedNode = saved.currentNodeId && saved.currentNodeId !== defaultStartId;
      const hasDifferentPreset = saved.treeId !== defaultFirstTreeId;
      const hasNotesOrFields = Boolean(
        (saved.sessionNotes && saved.sessionNotes.trim()) ||
        (saved.reportData?.observations && saved.reportData.observations.trim()) ||
        (saved.reportData?.clientName && saved.reportData.clientName.trim()) ||
        (saved.reportData?.deviceModel && saved.reportData.deviceModel.trim()) ||
        (saved.reportData?.measuredValues && saved.reportData.measuredValues.trim())
      );

      if (hasHistory || hasAdvancedNode || hasNotesOrFields || hasDifferentPreset) {
        const targetNode = tree.nodes.find(n => n.id === saved.currentNodeId) || symptomNode;
        return {
          ...saved,
          resolvedTree: tree,
          resolvedNode: targetNode
        };
      }
      return null;
    } catch (e) {
      console.warn('Error al leer sesión guardada en localStorage:', e);
      return null;
    }
  }

  /**
   * Restores a previously saved session into live state.
   * @param {Object} savedSession 
   */
  restoreSession(savedSession) {
    if (!savedSession || !savedSession.resolvedTree) return false;
    const tree = savedSession.resolvedTree;

    this.currentTree = tree;
    this.nodeMap.clear();
    tree.nodes.forEach(node => {
      this.nodeMap.set(node.id, node);
    });

    const symptomNode = tree.nodes.find(n => n.category === 'symptom') || tree.nodes[0];
    const fallbackStartId = symptomNode?.id;

    this.history = Array.isArray(savedSession.history) ? savedSession.history : [];
    this.currentNodeId = (savedSession.currentNodeId && this.nodeMap.has(savedSession.currentNodeId))
      ? savedSession.currentNodeId
      : fallbackStartId;
    this.inspectedNodeId = this.currentNodeId;
    this.startTime = savedSession.startTime || Date.now();
    this.sessionNotes = savedSession.sessionNotes || savedSession.reportData?.observations || '';
    this.reportData = {
      ...this.reportData,
      ...(savedSession.reportData || {}),
      observations: this.sessionNotes
    };

    this.emit('treeLoaded', { tree: this.currentTree, startNode: this.getCurrentNode(), restored: true });
    this.emit('historyChanged', { history: this.history });
    this.emit('nodeChanged', { node: this.getCurrentNode(), history: this.history, restored: true });
    this.emit('notesChanged', { notes: this.sessionNotes, reportData: this.reportData, source: 'restore' });

    if (savedSession.viewMode && ['split', 'runner', 'graph', 'matrix'].includes(savedSession.viewMode)) {
      this.setViewMode(savedSession.viewMode);
    } else {
      this.saveSessionToStorage();
    }

    return true;
  }

  clearSavedSession() {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  }
}

const stateManager = new StateManager();
window.DiagApp = window.DiagApp || {};
window.DiagApp.StateManager = StateManager;
window.DiagApp.stateManager = stateManager;
