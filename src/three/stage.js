import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Shared material palette. One world: ceramic, brushed steel, dark technical matte, one glass.
export const PALETTE = {
  ceramic: 0xd7dbdf,
  steel: 0x8e98a3,
  graphite: 0x1c2127,
  ink: 0x111418,
  accent: 0xf26a3d,
};

export function makeMaterials(tier) {
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: PALETTE.ceramic, roughness: 0.52, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4,
  });
  const steel = new THREE.MeshPhysicalMaterial({
    color: PALETTE.steel, roughness: 0.34, metalness: 1,
    anisotropy: tier === 'high' ? 0.6 : 0, // brushed look
  });
  const graphite = new THREE.MeshStandardMaterial({ color: PALETTE.graphite, roughness: 0.78, metalness: 0.15 });
  const ink = new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.9, metalness: 0.1 });
  const glass = tier === 'high'
    ? new THREE.MeshPhysicalMaterial({
      color: 0xdfe6ec, roughness: 0.18, metalness: 0, transmission: 1, thickness: 0.6, ior: 1.42,
      clearcoat: 1, clearcoatRoughness: 0.1, attenuationColor: new THREE.Color(0xb9c6d1), attenuationDistance: 2.5,
    })
    : new THREE.MeshPhysicalMaterial({
      color: 0xc8d2db, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.38, clearcoat: 1,
    });
  const accent = new THREE.MeshBasicMaterial({ color: PALETTE.accent, toneMapped: false });
  const accentLine = new THREE.MeshBasicMaterial({ color: PALETTE.accent, transparent: true, opacity: 0.85, toneMapped: false });
  return { ceramic, steel, graphite, ink, glass, accent, accentLine };
}

// Soft contact shadow, generated once instead of shipping a texture.
export function contactShadow(size = 8, strength = 0.7) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, `rgba(0,0,0,${strength})`);
  grd.addColorStop(0.45, `rgba(0,0,0,${strength * 0.45})`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = -1;
  return mesh;
}

/**
 * Renderer, camera, studio lighting, resize and an on-screen-only render loop.
 * `onFrame(dt, t)` runs each frame while visible; returns nothing.
 */
export function createStage(canvas, { tier, fov = 30, maxDpr, still = false }) {
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: tier === 'high', powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const dprCap = maxDpr ?? (tier === 'high' ? 1.75 : 1.25);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff4ea, 2.2);
  key.position.set(-4, 7, 5);
  const rim = new THREE.DirectionalLight(0xcfe0f0, 1.4);
  rim.position.set(5, 3, -6);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.12));

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

  let frameFn = null;
  let visible = false;
  let raf = 0;
  let last = performance.now();
  let t = 0;

  function size() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function loop(now) {
    raf = 0;
    const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 20));
    last = now;
    t += dt;
    frameFn?.(dt, t);
    renderer.render(scene, camera);
    if (visible && !still && !document.hidden) raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  const ro = new ResizeObserver(() => { size(); kick(); });
  ro.observe(canvas);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  }, { rootMargin: '100px' });
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) kick(); });

  size();

  return {
    renderer, scene, camera,
    onFrame(fn) { frameFn = fn; },
    /** request a frame (used in still mode after interaction) */
    kick,
    get visible() { return visible; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.dispose();
    },
  };
}
