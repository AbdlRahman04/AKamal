const icons = new Set(['user','browser','server','image','model','check','results','book','file','chat','report','chart','database','card']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(text);

export function validateArchitecture(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['architecture must be an object'];
  if (value.technologies !== undefined && (!Array.isArray(value.technologies) || value.technologies.some(item => !item || !text(item.title) || !text(item.description) || !text(item.logo) || !/^[a-z0-9-]+$/.test(item.logo)))) errors.push('technologies must contain logo slugs, titles and descriptions');
  for (const field of ['title','subtitle','description','defaultNode']) if (!text(value[field])) errors.push(`${field} is required`);
  if (!Array.isArray(value.nodes) || !value.nodes.length) return [...errors, 'nodes must be a non-empty array'];
  const ids = new Set(), slots = new Set();
  for (const node of value.nodes) {
    if (!node || typeof node !== 'object') { errors.push('node must be an object'); continue; }
    if (!text(node.id) || ids.has(node.id)) errors.push('node IDs must be non-empty and unique');
    ids.add(node.id);
    for (const field of ['title','subtitle','technology']) if (!text(node[field])) errors.push(`${node.id}.${field} is required`);
    if (!icons.has(node.icon)) errors.push(`${node.id}.icon is unsupported`);
    if (!['runtime','support'].includes(node.category)) errors.push(`${node.id}.category is unsupported`);
    if (!Number.isInteger(node.column) || node.column < 1 || node.column > 5 || !Number.isInteger(node.row) || node.row < 1 || node.row > 3) errors.push(`${node.id} must occupy a column 1–5 and row 1–3`);
    const slot = `${node.column}:${node.row}`;
    if (slots.has(slot)) errors.push(`duplicate node position ${slot}`);
    slots.add(slot);
    if (!strings(node.responsibilities) || !node.responsibilities.length) errors.push(`${node.id}.responsibilities is required`);
    for (const field of ['endpoints','notes']) if (node[field] !== undefined && !strings(node[field])) errors.push(`${node.id}.${field} must contain non-empty strings`);
  }
  if (!ids.has(value.defaultNode)) errors.push('defaultNode must reference an existing node');
  if (!Array.isArray(value.edges)) errors.push('edges must be an array');
  else for (const edge of value.edges) {
    if (!edge || !ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to || !['runtime','support','response'].includes(edge.kind)) errors.push('edge has invalid references or kind');
    if (edge?.label !== undefined && !text(edge.label)) errors.push('edge label must be a non-empty string');
  }
  for (const field of ['requestPath','decisions']) {
    if (!Array.isArray(value[field]) || !value[field].length || value[field].some(item => !item || !text(item.title) || !text(item.description))) errors.push(`${field} must contain title/description records`);
  }
  if (value.requestPath?.length > 5) errors.push('requestPath must contain at most five steps');
  return errors;
}
