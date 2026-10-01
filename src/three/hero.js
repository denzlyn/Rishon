import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage, makeMaterials, contactShadow } from './stage.js';

// The hero object: an exploded architecture stack. Top to bottom:
// Interface, Application, Integration, Data, Infrastructure.
// Each plate carries details that say what the layer is. Orange packets are data moving between layers.

const LAYER_IDS = ['interface', 'application', 'integration', 'data', 'infrastructure'];
const SLAB = 3.6;
const THICK = 0.22;
const BASE_GAP = 0.95;

// small deterministic random so the plates look the same on every load
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function buildLayer(i, mats, tier) {
  const g = new THREE.Group();
  const slabMat = [mats.glass, mats.ceramic, mats.steel, mats.graphite, mats.ink][i];
  const slab = new THREE.Mesh(new RoundedBoxGeometry(SLAB, THICK, SLAB, 4, 0.08), slabMat);
  slab.userData.layer = i;
  g.add(slab);
  const top = THICK / 2;
  const rand = rng(31 + i * 7);

  if (i === 0) {
    // Interface: screen tiles
    const tile = new RoundedBoxGeometry(1.0, 0.04, 0.7, 2, 0.02);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const m = new THREE.Mesh(tile, r === 0 && c === 1 ? mats.steel : mats.ceramic);
        m.position.set((c - 1) * 1.1, top + 0.03, (r - 0.5) * 0.95);
        g.add(m);
      }
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.05), mats.accent);
    bar.position.set(-1.25, top + 0.06, -0.35);
    g.add(bar);
  }

  if (i === 1) {
    // Application: a field of service modules
    const n = tier === 'high' ? 5 : 4;
    const box = new RoundedBoxGeometry(0.42, 1, 0.42, 2, 0.04);
    const inst = new THREE.InstancedMesh(box, mats.graphite, n * n);
    const m = new THREE.Matrix4();
    let k = 0;
    const step = 2.6 / (n - 1);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const h = 0.08 + Math.pow(rand(), 2) * 0.42;
        m.compose(
          new THREE.Vector3(-1.3 + c * step, top + h / 2, -1.3 + r * step),
          new THREE.Quaternion(),
          new THREE.Vector3(1, h, 1),
        );
        inst.setMatrixAt(k++, m);
      }
    }
    g.add(inst);
  }

  if (i === 2) {
    // Integration: a ring bus with connectors
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.035, 12, 96), mats.ceramic);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = top + 0.05;
    g.add(ring);
    const port = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 24);
    for (let p = 0; p < 8; p++) {
      const a = (p / 8) * Math.PI * 2;
      const m = new THREE.Mesh(port, p === 3 ? mats.accent : mats.graphite);
      m.position.set(Math.cos(a) * 1.2, top + 0.07, Math.sin(a) * 1.2);
      g.add(m);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 32), mats.graphite);
    hub.position.y = top + 0.08;
    g.add(hub);
  }

  if (i === 3) {
    // Data: database cylinders (primary and replicas)
    const disk = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 40);
    const spots = [[-0.95, -0.6], [0.2, 0.75], [1.05, -0.55]];
    spots.forEach(([x, z], s) => {
      for (let d = 0; d < 3; d++) {
        const m = new THREE.Mesh(disk, mats.ceramic);
        m.position.set(x, top + 0.07 + d * 0.15, z);
        g.add(m);
      }
      if (s === 0) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.012, 8, 48), mats.accent);
        band.rotation.x = Math.PI / 2;
        band.position.set(x, top + 0.29, z);
        g.add(band);
      }
    });
  }

  if (i === 4) {
    // Infrastructure: rack blades with a few status lights
    const blade = new RoundedBoxGeometry(2.9, 0.14, 0.32, 2, 0.03);
    const led = new THREE.BoxGeometry(0.05, 0.05, 0.02);
    for (let r = 0; r < 6; r++) {
      const m = new THREE.Mesh(blade, mats.graphite);
      m.position.set(0, top + 0.07, -1.25 + r * 0.5);
      g.add(m);
      if (r % 2 === 0) {
        const l = new THREE.Mesh(led, r === 2 ? mats.accent : mats.ceramic);
        l.position.set(1.3, top + 0.1, -1.25 + r * 0.5 + 0.17);
        g.add(l);
      }
    }
  }

  return { group: g, slab };
}

export function initHero(canvas, { tier, reduced, labels, onSelect }) {
  const stage = createStage(canvas, { tier, still: reduced });
  const { scene, camera } = stage;
  const mats = makeMaterials(tier);

  const root = new THREE.Group(); // follows cursor
  const stack = new THREE.Group(); // base orientation
  stack.rotation.y = -0.62;
  root.add(stack);
  scene.add(root);

  const layers = LAYER_IDS.map((_, i) => buildLayer(i, mats, tier));
  layers.forEach((l) => stack.add(l.group));
  // Hover is tested against fixed volumes, one per layer, that don't move when a plate lifts.
  // Testing the plates themselves made hover flicker as the lifted plate slid out from under the cursor.
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hits = layers.map((_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(SLAB, 1, SLAB), hitMat);
    m.userData.layer = i;
    stack.add(m);
    return m;
  });

  // conduits at the plate corners
  const conduitGeo = new THREE.CylinderGeometry(0.028, 0.028, 1, 12);
  const corners = [[-1.62, -1.62], [1.62, -1.62], [1.62, 1.62], [-1.62, 1.62]];
  const conduits = corners.map(([x, z]) => {
    const m = new THREE.Mesh(conduitGeo, mats.steel);
    m.position.set(x, 0, z);
    stack.add(m);
    return m;
  });

  // packets: data travelling between layers
  const packetCount = tier === 'high' ? 16 : 10;
  const packetGeo = new THREE.BoxGeometry(0.075, 0.075, 0.075);
  const packets = Array.from({ length: packetCount }, (_, i) => {
    const m = new THREE.Mesh(packetGeo, mats.accent);
    m.userData = { corner: i % 4, phase: (i * 0.618) % 1, speed: 0.09 + (i % 3) * 0.03, dir: i % 2 ? 1 : -1 };
    stack.add(m);
    return m;
  });

  const shadow = contactShadow(9, 0.75);
  stack.add(shadow);

  // state
  let progress = 0; // scroll through hero, 0..1
  let intro = reduced ? 1 : 0;
  let hovered = -1;
  const lift = new Float32Array(5);
  const pointer = new THREE.Vector2(0, 0);
  const tilt = { x: 0, y: 0 };
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(2, 2);
  let layout = { x: 0, y: 0, scale: 1 };

  function frame() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const aspect = w / h;
    const fovR = THREE.MathUtils.degToRad(camera.fov / 2);
    const wide = aspect > 1.05;
    // keep the whole stack in frame: on narrow screens pull the camera back
    const dist = wide ? 15 : Math.max(15, 3.7 / (Math.tan(fovR) * aspect));
    camera.position.set(0, dist * 0.36, dist);
    camera.lookAt(0, 0, 0);
    const halfH = Math.tan(fovR) * dist;
    const halfW = halfH * aspect;
    layout = wide
      // narrower landscape screens (tablets, small laptops) get a smaller stack so the labels fit
      ? { x: halfW * (w < 1200 ? 0.36 : 0.4), y: halfH * 0.04, scale: THREE.MathUtils.clamp(w / 1800, 0.6, 0.8) }
      : { x: 0, y: halfH * 0.3, scale: aspect > 0.65 ? 0.8 : 0.95 };
  }

  function placeLabels() {
    if (!labels || tier === 'none') return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 920) return;
    const v = new THREE.Vector3();
    layers.forEach((l, i) => {
      // rightmost corner of the plate on screen
      let best = null;
      for (const [x, z] of corners) {
        v.set(x * 1.1, 0, z * 1.1);
        l.group.localToWorld(v);
        v.project(camera);
        if (!best || v.x > best.x) best = v.clone();
      }
      const sx = (best.x * 0.5 + 0.5) * w + 18;
      const sy = (-best.y * 0.5 + 0.5) * h;
      labels[i].style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translateY(-50%)`;
      // never let a label run off the edge of the screen
      labels[i].style.visibility = sx + labels[i].offsetWidth > w - 16 ? 'hidden' : '';
      labels[i].classList.toggle('is-hot', hovered === i);
    });
  }

  frame();

  stage.onFrame((dt, t) => {
    if (!reduced) intro = Math.min(1, intro + dt / 1.8);
    const e = 1 - Math.pow(1 - intro, 3);

    // scroll opens the system up, cursor tilts it
    const gap = (BASE_GAP + progress * 0.7) * e + 0.02;
    const pitch = THICK + gap;
    const total = pitch * 4;

    layers.forEach((l, i) => {
      const target = hovered === i ? 0.22 : 0;
      lift[i] += (target - lift[i]) * (reduced ? 1 : Math.min(1, dt * 9));
      const base = total / 2 - i * pitch;
      l.group.position.y = base + lift[i];
      hits[i].position.y = base + gap / 2;
      hits[i].scale.y = pitch;
    });
    conduits.forEach((c) => { c.scale.y = total + 0.4; c.position.y = 0; });
    shadow.position.y = -total / 2 - THICK / 2 - 0.35;
    shadow.material.opacity = 0.55 + 0.45 * (1 - progress);

    packets.forEach((p) => {
      const d = p.userData;
      const u = reduced ? d.phase : (d.phase + t * d.speed * d.dir + 10) % 1;
      const [x, z] = corners[d.corner];
      p.position.set(x, -total / 2 + u * total, z);
      p.visible = e > 0.6;
    });

    const lerp = reduced ? 1 : Math.min(1, dt * 3);
    tilt.x += (pointer.y * 0.12 - tilt.x) * lerp;
    tilt.y += (pointer.x * 0.22 - tilt.y) * lerp;
    root.rotation.x = 0.04 + tilt.x + progress * 0.12;
    root.rotation.y = tilt.y + progress * 0.45;
    stack.rotation.y = -0.62 - (1 - e) * 0.5;
    root.position.set(layout.x, layout.y + progress * 1.2, -progress * 2);
    root.scale.setScalar(layout.scale);

    placeLabels();
  });

  function updateHover() {
    if (ndc.x > 1) { setHover(-1); return; }
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    setHover(hit ? hit.object.userData.layer : -1);
  }
  function setHover(i) {
    if (i === hovered) return;
    hovered = i;
    canvas.style.cursor = i >= 0 ? 'pointer' : '';
    stage.kick();
  }

  // pointer is tracked on the whole hero so the stack responds even over the headline
  const hero = canvas.closest('.hero');
  hero.addEventListener('pointermove', (ev) => {
    if (ev.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, ((ev.clientY - r.top) / r.height) * 2 - 1);
    ndc.set(pointer.x, -pointer.y);
    // only plates under the cursor (not under the text column) count as hover
    if (ev.target.closest('a, button, h1, p')) ndc.set(2, 2);
    updateHover();
  });
  hero.addEventListener('pointerleave', () => { pointer.set(0, 0); ndc.set(2, 2); setHover(-1); });
  canvas.addEventListener('click', () => { if (hovered >= 0) onSelect?.(LAYER_IDS[hovered]); });
  // the canvas sits behind the content column; let it receive clicks only where nothing else is
  canvas.style.pointerEvents = 'auto';

  new ResizeObserver(frame).observe(canvas);

  return {
    setProgress(p) {
      progress = p;
      stage.kick();
    },
  };
}
