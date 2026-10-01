import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage, makeMaterials, contactShadow, PALETTE } from './stage.js';
import { NODES, EDGES } from '../data/architecture.js';

// The architecture board: each layer of a system is a ceramic puck on a dark technical board.
// Selecting one lifts it, lights the connections it depends on and dims everything else.

const DIM = new THREE.Color(0x30353c);
const LIT = new THREE.Color(PALETTE.ceramic);
const LINE = new THREE.Color(0x3a424b);
const ACCENT = new THREE.Color(PALETTE.accent);

export function initArchitecture(canvas, { tier, reduced, tagsEl, onPick }) {
  const stage = createStage(canvas, { tier, fov: 32, still: reduced });
  const { scene, camera } = stage;
  const mats = makeMaterials(tier);

  const world = new THREE.Group();
  scene.add(world);

  const board = new THREE.Mesh(new RoundedBoxGeometry(15.2, 0.24, 7.6, 4, 0.12), mats.ink);
  board.position.y = -0.12;
  world.add(board);
  const shadow = contactShadow(18, 0.6);
  shadow.scale.set(1, 0.6, 1);
  shadow.position.y = -0.5;
  world.add(shadow);

  // faint engraved grid on the board so it reads as a surface, not a void
  const grid = new THREE.GridHelper(14.4, 24, 0x2a3038, 0x1c2127);
  grid.scale.z = 7 / 14.4;
  grid.position.y = 0.005;
  grid.material.transparent = true;
  grid.material.opacity = 0.6;
  world.add(grid);

  const puckGeo = new THREE.CylinderGeometry(0.56, 0.6, 0.26, 48);
  const insetGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 40);
  const ringGeo = new THREE.TorusGeometry(0.78, 0.022, 8, 64);

  const nodes = new Map();
  NODES.forEach((n) => {
    const g = new THREE.Group();
    g.position.set(n.pos[0], 0, n.pos[1]);
    const mat = mats.ceramic.clone();
    const puck = new THREE.Mesh(puckGeo, mat);
    puck.position.y = 0.13;
    puck.userData.id = n.id;
    const inset = new THREE.Mesh(insetGeo, mats.graphite);
    inset.position.y = 0.27;
    const ring = new THREE.Mesh(ringGeo, mats.accent);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    ring.visible = false;
    g.add(puck, inset, ring);
    world.add(g);

    const tag = document.createElement('span');
    tag.className = 'arch__tag';
    tag.textContent = n.label;
    tagsEl?.appendChild(tag);

    nodes.set(n.id, { g, puck, mat, ring, tag, lift: 0, target: 0, glow: 1, glowTarget: 1 });
  });

  const tubeMat = () => new THREE.MeshBasicMaterial({ color: LINE.clone(), transparent: true, opacity: 0.9 });
  const edges = EDGES.map(([a, b]) => {
    const A = nodes.get(a).g.position;
    const B = nodes.get(b).g.position;
    const mid = A.clone().lerp(B, 0.5);
    mid.y = 0.5 + A.distanceTo(B) * 0.1;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(A.x, 0.2, A.z), mid, new THREE.Vector3(B.x, 0.2, B.z),
    );
    const mat = tubeMat();
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.022, 6, false), mat);
    world.add(mesh);
    return { a, b, curve, mat, on: 0, onTarget: 0 };
  });

  // packets travel only along the lit edges
  const packetGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  const packets = Array.from({ length: 18 }, () => {
    const m = new THREE.Mesh(packetGeo, mats.accent);
    m.visible = false;
    world.add(m);
    return m;
  });

  let selected = null;
  let hovered = null;
  const pointer = new THREE.Vector2();
  const ndc = new THREE.Vector2(2, 2);
  const ray = new THREE.Raycaster();
  const look = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  let portrait = false;
  let camBase = new THREE.Vector3();

  function frame() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const aspect = w / h;
    portrait = aspect < 1;
    // on tall screens the board turns so the flow runs top to bottom
    world.rotation.y = portrait ? -Math.PI / 2 : 0;
    const fovR = THREE.MathUtils.degToRad(camera.fov / 2);
    const span = portrait ? 9.4 : 17.6; // width of board we need on screen, with room for perspective
    // portrait also has to fit the board's length vertically
    const fitW = span / 2 / (Math.tan(fovR) * aspect);
    const dist = portrait ? Math.max(fitW, 8.4 / Math.tan(fovR) * 0.95) : Math.max(12, fitW);
    camBase = portrait
      ? new THREE.Vector3(0, dist * 0.93, dist * 0.36)
      : new THREE.Vector3(0, dist * 0.8, dist * 0.6);
  }
  frame();
  new ResizeObserver(frame).observe(canvas);

  const v = new THREE.Vector3();
  function placeTags() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    nodes.forEach((n) => {
      v.set(0, 0.1, 0);
      n.g.localToWorld(v);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h + (portrait ? 18 : 24);
      n.tag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateX(-50%)`;
    });
  }

  stage.onFrame((dt, t) => {
    const k = reduced ? 1 : Math.min(1, dt * 6);
    nodes.forEach((n) => {
      n.lift += (n.target + (hovered === n && n.target < 0.3 ? 0.1 : 0) - n.lift) * k;
      n.g.position.y = n.lift;
      n.glow += (n.glowTarget - n.glow) * k;
      n.mat.color.copy(DIM).lerp(LIT, n.glow);
      n.mat.envMapIntensity = 0.25 + 0.75 * n.glow;
      n.mat.clearcoat = 0.35 * n.glow;
    });
    edges.forEach((e) => {
      e.on += (e.onTarget - e.on) * k;
      e.mat.color.copy(LINE).lerp(ACCENT, e.on);
      e.mat.opacity = selected ? 0.25 + e.on * 0.75 : 0.9;
    });

    // packets distributed across lit edges, flowing in the direction of the edge
    const lit = edges.filter((e) => e.onTarget > 0);
    packets.forEach((p, i) => {
      if (!lit.length || i >= lit.length * 2) { p.visible = false; return; }
      const e = lit[i % lit.length];
      const u = reduced ? 0.5 : ((i < lit.length ? 0 : 0.5) + t * 0.32) % 1;
      e.curve.getPoint(u, p.position);
      p.visible = e.on > 0.5;
    });

    // camera eases a little toward the selection and follows the cursor slightly
    if (selected) {
      v.copy(selected.g.position);
      world.localToWorld(v);
      const pull = portrait ? 0.1 : 0.25;
      lookTarget.set(v.x * pull, 0, v.z * pull);
    } else {
      lookTarget.set(0, 0, 0);
    }
    look.lerp(lookTarget, reduced ? 1 : Math.min(1, dt * 2.5));
    camera.position.set(
      camBase.x + look.x + pointer.x * 0.8,
      camBase.y - pointer.y * 0.5,
      camBase.z + look.z,
    );
    camera.lookAt(look);
    placeTags();
  });

  function select(id) {
    selected = nodes.get(id) ?? null;
    const linked = new Set();
    edges.forEach((e) => {
      const on = e.a === id || e.b === id;
      e.onTarget = on ? 1 : 0;
      if (on) linked.add(e.a === id ? e.b : e.a);
    });
    nodes.forEach((n, key) => {
      const isSel = key === id;
      const isLinked = linked.has(key);
      n.target = isSel ? 0.42 : isLinked ? 0.12 : 0;
      n.glowTarget = isSel || isLinked ? 1 : 0.15;
      n.ring.visible = isSel;
      n.tag.classList.toggle('is-active', isSel);
      n.tag.classList.toggle('is-linked', isLinked);
      n.tag.classList.toggle('is-dim', !isSel && !isLinked);
    });
    stage.kick();
    if (reduced) requestAnimationFrame(() => stage.kick());
  }

  function hitTest() {
    if (ndc.x > 1) return null;
    ray.setFromCamera(ndc, camera);
    const pucks = [...nodes.values()].map((n) => n.puck);
    const hit = ray.intersectObjects(pucks, false)[0];
    return hit ? nodes.get(hit.object.userData.id) : null;
  }

  canvas.addEventListener('pointermove', (ev) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    if (ev.pointerType === 'mouse') pointer.set(ndc.x, -ndc.y);
    const h = hitTest();
    if (h !== hovered) {
      hovered = h;
      canvas.style.cursor = h ? 'pointer' : '';
      stage.kick();
    }
  });
  canvas.addEventListener('pointerleave', () => { pointer.set(0, 0); ndc.set(2, 2); hovered = null; canvas.style.cursor = ''; stage.kick(); });
  canvas.addEventListener('click', (ev) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    const h = hitTest();
    if (h) onPick?.(h.puck.userData.id);
  });

  return { select };
}
