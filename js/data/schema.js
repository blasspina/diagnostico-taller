/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Schema Validator for Diagnostic Nodes
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

const VALID_CATEGORIES = ['symptom', 'measurement', 'inspection', 'action', 'verdict'];
const VALID_BADGE_COLORS = ['red', 'green', 'yellow', 'blue'];
const VALID_TOOLS = [
  'Fuente de alimentación',
  'Multímetro (Diodo)',
  'Multímetro (Voltaje)',
  'Multímetro (Continuidad / Ohmios)',
  'Osciloscopio',
  'Cámara Térmica',
  'Amperímetro USB',
  'Microscopio Estereoscópico'
];

/**
 * Validates a complete decision tree array.
 * @param {Array} nodes 
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTree(nodes) {
  const errors = [];
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { valid: false, errors: ['El árbol debe ser un array de nodos no vacío.'] };
  }

  const idSet = new Set();
  const allIds = new Set(nodes.map(n => n?.id).filter(Boolean));

  nodes.forEach((node, index) => {
    const prefix = `Nodo [${index}] (ID: "${node?.id || 'sin-id'}"):`;

    if (!node.id || typeof node.id !== 'string') {
      errors.push(`${prefix} Debe tener una propiedad 'id' tipo string única.`);
    } else if (idSet.has(node.id)) {
      errors.push(`${prefix} ID duplicado "${node.id}".`);
    } else {
      idSet.add(node.id);
    }

    if (!node.title || typeof node.title !== 'string') {
      errors.push(`${prefix} Debe contener una propiedad 'title' válida.`);
    }

    if (!VALID_CATEGORIES.includes(node.category)) {
      errors.push(`${prefix} Categoría '${node.category}' inválida. Debe ser una de: ${VALID_CATEGORIES.join(', ')}.`);
    }

    if (!node.description || typeof node.description !== 'string') {
      errors.push(`${prefix} Debe contener una propiedad 'description' técnica.`);
    }

    if (!Array.isArray(node.measurements)) {
      errors.push(`${prefix} 'measurements' debe ser un array.`);
    } else {
      node.measurements.forEach((m, mIdx) => {
        if (!m.tool || typeof m.tool !== 'string') {
          errors.push(`${prefix} Medición [${mIdx}] falta 'tool' válida.`);
        }
        if (m.expected === undefined || m.expected === null) {
          errors.push(`${prefix} Medición [${mIdx}] falta valor 'expected'.`);
        }
        if (m.tolerance === undefined || m.tolerance === null) {
          errors.push(`${prefix} Medición [${mIdx}] falta 'tolerance'.`);
        }
      });
    }

    if (typeof node.technicalTips !== 'string') {
      errors.push(`${prefix} 'technicalTips' debe ser un string.`);
    }

    if (!Array.isArray(node.options)) {
      errors.push(`${prefix} 'options' debe ser un array.`);
    } else {
      node.options.forEach((opt, optIdx) => {
        if (!opt.label || typeof opt.label !== 'string') {
          errors.push(`${prefix} Opción [${optIdx}] falta 'label'.`);
        }
        if (!opt.targetNodeId || typeof opt.targetNodeId !== 'string') {
          errors.push(`${prefix} Opción [${optIdx}] falta 'targetNodeId'.`);
        } else if (!allIds.has(opt.targetNodeId)) {
          errors.push(`${prefix} Opción [${optIdx}] apunta a targetNodeId inexistente "${opt.targetNodeId}".`);
        }
        if (!VALID_BADGE_COLORS.includes(opt.badgeColor)) {
          errors.push(`${prefix} Opción [${optIdx}] badgeColor '${opt.badgeColor}' inválido. Debe ser: ${VALID_BADGE_COLORS.join(', ')}.`);
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

window.DiagApp = window.DiagApp || {};
window.DiagApp.VALID_CATEGORIES = VALID_CATEGORIES;
window.DiagApp.VALID_BADGE_COLORS = VALID_BADGE_COLORS;
window.DiagApp.VALID_TOOLS = VALID_TOOLS;
window.DiagApp.validateTree = validateTree;
