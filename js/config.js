/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Global Configuration & Color Mapping
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

const CATEGORIES = {
  symptom: {
    label: 'Síntoma Inicial',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
    headerBg: 'bg-purple-900/30',
    accentColor: '#c084fc',
    icon: 'activity'
  },
  measurement: {
    label: 'Medición / Test Eléctrico',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
    headerBg: 'bg-cyan-900/30',
    accentColor: '#22d3ee',
    icon: 'gauge'
  },
  inspection: {
    label: 'Inspección Visual / Microscopio',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    headerBg: 'bg-amber-900/30',
    accentColor: '#fbbf24',
    icon: 'eye'
  },
  action: {
    label: 'Acción Técnica / Procedimiento',
    badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
    headerBg: 'bg-blue-900/30',
    accentColor: '#60a5fa',
    icon: 'wrench'
  },
  verdict: {
    label: 'Veredicto de Reparación',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    headerBg: 'bg-emerald-900/30',
    accentColor: '#34d399',
    icon: 'check-circle'
  }
};

const BADGE_COLORS = {
  red: {
    bg: 'bg-rose-950/60 hover:bg-rose-900/80',
    border: 'border-rose-700/60 hover:border-rose-500',
    text: 'text-rose-300',
    glow: 'hover:shadow-rose-900/40',
    dot: 'bg-rose-500',
    stroke: '#f43f5e'
  },
  green: {
    bg: 'bg-emerald-950/60 hover:bg-emerald-900/80',
    border: 'border-emerald-700/60 hover:border-emerald-500',
    text: 'text-emerald-300',
    glow: 'hover:shadow-emerald-900/40',
    dot: 'bg-emerald-500',
    stroke: '#10b981'
  },
  yellow: {
    bg: 'bg-amber-950/60 hover:bg-amber-900/80',
    border: 'border-amber-700/60 hover:border-amber-500',
    text: 'text-amber-300',
    glow: 'hover:shadow-amber-900/40',
    dot: 'bg-amber-500',
    stroke: '#f59e0b'
  },
  blue: {
    bg: 'bg-sky-950/60 hover:bg-sky-900/80',
    border: 'border-sky-700/60 hover:border-sky-500',
    text: 'text-sky-300',
    glow: 'hover:shadow-sky-900/40',
    dot: 'bg-sky-500',
    stroke: '#38bdf8'
  }
};

const TOOL_ICONS = {
  'Fuente de alimentación': 'zap',
  'Multímetro (Diodo)': 'activity',
  'Multímetro (Voltaje)': 'gauge',
  'Multímetro (Continuidad / Ohmios)': 'activity',
  'Osciloscopio': 'radio',
  'Cámara Térmica': 'flame',
  'Amperímetro USB': 'zap',
  'Microscopio Estereoscópico': 'eye',
  'default': 'cpu'
};

window.DiagApp = window.DiagApp || {};
window.DiagApp.CATEGORIES = CATEGORIES;
window.DiagApp.BADGE_COLORS = BADGE_COLORS;
window.DiagApp.TOOL_ICONS = TOOL_ICONS;
