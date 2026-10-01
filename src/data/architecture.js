// The system model used by the architecture section. Labels and details live in index.html;
// this file only describes layout and relationships.
export const NODES = [
  { id: 'people', label: 'People', pos: [-6.0, 0.3] },
  { id: 'interface', label: 'Interface', pos: [-4.0, -0.5] },
  { id: 'application', label: 'Application', pos: [-1.9, 0.4] },
  { id: 'integration', label: 'Integration', pos: [0.2, -0.5] },
  { id: 'data', label: 'Data', pos: [2.3, 0.4] },
  { id: 'analytics', label: 'Analytics', pos: [4.3, -0.6] },
  { id: 'infrastructure', label: 'Infrastructure', pos: [6.0, 0.6] },
  { id: 'security', label: 'Security', pos: [0.2, -2.7] },
  { id: 'operations', label: 'Operations', pos: [0.2, 2.6] },
];

// [from, to]: direction is the main flow of a request or of data
export const EDGES = [
  ['people', 'interface'],
  ['interface', 'application'],
  ['application', 'integration'],
  ['application', 'data'],
  ['integration', 'data'],
  ['data', 'analytics'],
  ['data', 'infrastructure'],
  ['analytics', 'infrastructure'],
  ['security', 'interface'],
  ['security', 'application'],
  ['security', 'integration'],
  ['security', 'data'],
  ['security', 'infrastructure'],
  ['operations', 'application'],
  ['operations', 'integration'],
  ['operations', 'data'],
  ['operations', 'infrastructure'],
];

export function neighbours(id) {
  const out = [];
  for (const [a, b] of EDGES) {
    if (a === id) out.push(b);
    else if (b === id) out.push(a);
  }
  return out;
}
