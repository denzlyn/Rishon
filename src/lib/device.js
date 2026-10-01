// Decides how much 3D this device should get. Kept in one place so every scene agrees.
const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');

export const prefersReducedMotion = () => mqReduce.matches;
export const hasFinePointer = () => mqFine.matches;

let webgl;
export function supportsWebGL() {
  if (webgl !== undefined) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    webgl = false;
  }
  return webgl;
}

// 'high' | 'low' | 'none'
export function renderTier() {
  if (!supportsWebGL()) return 'none';
  const params = new URLSearchParams(location.search);
  if (params.has('tier')) return params.get('tier');
  const small = window.matchMedia('(max-width: 920px)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 8;
  const saveData = navigator.connection?.saveData;
  if (saveData) return 'none';
  if (small || cores <= 4 || mem <= 4) return 'low';
  return 'high';
}
