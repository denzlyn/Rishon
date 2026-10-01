import { neighbours, NODES } from '../data/architecture.js';
import { hasFinePointer, prefersReducedMotion } from '../lib/device.js';
import { icon } from '../lib/icons.js';

// Contact address used by the form. CONFIRM with Taqniat before launch.
const CONTACT_EMAIL = 'info@taqniat.ae';

/* Navigation: scrolled state, active section indicator, mobile sheet */
export function initNav() {
  const nav = document.querySelector('[data-nav]');
  const links = [...nav.querySelectorAll('.nav__links a')];
  const indicator = nav.querySelector('.nav__indicator');
  const toggle = nav.querySelector('.nav__toggle');
  const sheet = document.getElementById('mobile-menu');

  // scrolled state from a sentinel instead of a scroll listener
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;height:48px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);

  function moveIndicator(a) {
    if (!a) { indicator.style.opacity = '0'; return; }
    indicator.style.opacity = '1';
    indicator.style.width = `${a.offsetWidth}px`;
    indicator.style.transform = `translateX(${a.offsetLeft}px)`;
  }

  const sections = links.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
  const visible = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
    const current = sections.find((s) => visible.get(s.id));
    links.forEach((a) => {
      const on = current && a.dataset.section === current.id;
      a.classList.toggle('is-active', !!on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    moveIndicator(links.find((a) => a.classList.contains('is-active')));
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
  window.addEventListener('resize', () => moveIndicator(links.find((a) => a.classList.contains('is-active'))));

  function setMenu(open) {
    sheet.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('[data-icon]').innerHTML = icon(open ? 'x' : 'list');
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) sheet.querySelector('a')?.focus();
  }
  toggle.addEventListener('click', () => setMenu(sheet.hidden));
  sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); toggle.focus(); } });
  window.matchMedia('(min-width: 921px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
}

/* Accessible tabs helper: roving tabindex + arrow keys */
function tabs(buttons, onChange, { orientation = 'horizontal' } = {}) {
  const prev = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
  const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => onChange(i, true));
    b.addEventListener('keydown', (e) => {
      let j = null;
      if (e.key === prev || e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + buttons.length) % buttons.length;
      if (e.key === next || e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % buttons.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = buttons.length - 1;
      if (j === null) return;
      e.preventDefault();
      buttons[j].focus();
      onChange(j, true);
    });
  });
  return (i) => buttons.forEach((b, k) => {
    b.setAttribute('aria-selected', String(k === i));
    b.tabIndex = k === i ? 0 : -1;
  });
}

/* Services: tabs + panels. Scroll-driven rotation is wired in motion.js and calls setService. */
export function initServices({ onUserPick } = {}) {
  const root = document.querySelector('[data-services]');
  const buttons = [...root.querySelectorAll('[data-svc]')];
  const panels = [...root.querySelectorAll('[data-svc-panel]')];
  const prism = root.querySelector('[data-prism]');
  let current = 0;

  const mark = tabs(buttons, (i, user) => {
    if (user && onUserPick) onUserPick(i);
    else set(i);
  });

  function set(i, { rotate = true } = {}) {
    if (i === current && rotate) return;
    current = i;
    mark(i);
    panels.forEach((p, k) => {
      p.classList.toggle('is-active', k === i);
      p.toggleAttribute('inert', k !== i);
    });
    if (rotate) prism.style.setProperty('--ry', `${i * -90}deg`);
  }
  panels.forEach((p, k) => p.toggleAttribute('inert', k !== 0));
  return { set, prism, root, count: buttons.length };
}

/* Architecture: list + panels work without WebGL; the 3D board is an enhancement. */
export function initArchitectureUI() {
  const root = document.querySelector('[data-arch]');
  const buttons = [...root.querySelectorAll('[data-node]')];
  const panels = new Map([...root.querySelectorAll('[data-panel]')].map((p) => [p.dataset.panel, p]));
  const labels = Object.fromEntries(NODES.map((n) => [n.id, n.label]));
  const listeners = [];
  let current = 'application';

  // fill each panel's "Links to" row from the graph so content and diagram can't drift apart
  panels.forEach((panel, id) => {
    const row = panel.querySelector('.node-panel__tech');
    neighbours(id).forEach((n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = labels[n];
      b.addEventListener('click', () => select(n, { focus: true }));
      row.appendChild(b);
    });
  });

  const mark = tabs(buttons, (i) => select(buttons[i].dataset.node));

  function select(id, { focus = false } = {}) {
    if (!panels.has(id)) return;
    current = id;
    const linked = new Set(neighbours(id));
    mark(buttons.findIndex((b) => b.dataset.node === id));
    buttons.forEach((b) => b.classList.toggle('is-linked', linked.has(b.dataset.node)));
    panels.forEach((p, key) => {
      const on = key === id;
      p.hidden = !on;
      p.classList.toggle('is-entering', on && !prefersReducedMotion());
    });
    listeners.forEach((fn) => fn(id));
    if (focus) buttons.find((b) => b.dataset.node === id)?.focus({ preventScroll: true });
  }

  select(current);
  return {
    select,
    onChange(fn) { listeners.push(fn); fn(current); },
  };
}

/* Industries: typographic selector */
export function initIndustries() {
  const root = document.querySelector('[data-industries]');
  const buttons = [...root.querySelectorAll('[data-ind]')];
  const panels = [...root.querySelectorAll('[data-ind-panel]')];
  const mark = tabs(buttons, (i) => set(i), { orientation: 'vertical' });
  function set(i) {
    mark(i);
    panels.forEach((p, k) => { p.hidden = k !== i; });
  }
  if (hasFinePointer()) {
    buttons.forEach((b, i) => b.addEventListener('pointerenter', () => set(i)));
  }
}

/* Work plates: tilt toward the cursor, layers separate (CSS) */
export function initPlates() {
  if (!hasFinePointer() || prefersReducedMotion()) return;
  document.querySelectorAll('[data-plate]').forEach((plate) => {
    const stack = plate.querySelector('.plate__stack');
    const scene = plate.querySelector('.plate__scene');
    scene.addEventListener('pointermove', (e) => {
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stack.style.setProperty('--tx', `${(-y * 10).toFixed(2)}deg`);
      stack.style.setProperty('--ty', `${(x * 14).toFixed(2)}deg`);
    });
    scene.addEventListener('pointerleave', () => {
      stack.style.setProperty('--tx', '0deg');
      stack.style.setProperty('--ty', '0deg');
    });
  });
}

/* Magnetic primary buttons */
export function initMagnetic(gsap) {
  if (!hasFinePointer() || prefersReducedMotion()) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

/* Contact form: inline validation, then hands off to the visitor's email app.
   Swap `submit` for a real endpoint when one exists. */
export function initForm() {
  const form = document.querySelector('[data-form]');
  const status = form.querySelector('[data-form-status]');
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    message: form.elements.message,
  };
  const checks = {
    name: (v) => v.trim().length > 1,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    message: (v) => v.trim().length > 4,
  };
  const errId = { name: 'f-name-err', email: 'f-email-err', message: 'f-msg-err' };

  function validate(key) {
    const input = fields[key];
    const ok = checks[key](input.value);
    const err = document.getElementById(errId[key]);
    err.hidden = ok;
    input.setAttribute('aria-invalid', String(!ok));
    const described = new Set((input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    if (ok) described.delete(errId[key]); else described.add(errId[key]);
    input.setAttribute('aria-describedby', [...described].join(' '));
    return ok;
  }

  Object.keys(fields).forEach((k) => {
    fields[k].addEventListener('blur', () => { if (fields[k].value) validate(k); });
    fields[k].addEventListener('input', () => { if (fields[k].getAttribute('aria-invalid') === 'true') validate(k); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = Object.keys(fields).map(validate);
    if (results.includes(false)) {
      const first = Object.keys(fields)[results.indexOf(false)];
      fields[first].focus();
      status.textContent = 'A couple of fields need attention.';
      return;
    }
    if (import.meta.env.MODE === 'concept') {
      status.textContent = 'This is a design concept, so the form isn\'t connected yet. Call +971 2 414 7333 to reach Taqniat.';
      return;
    }
    const org = form.elements.organisation.value.trim();
    const subject = `Project enquiry${org ? ` from ${org}` : ''}`;
    const body = `${fields.message.value.trim()}\n\n${fields.name.value.trim()}\n${fields.email.value.trim()}${org ? `\n${org}` : ''}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = `Your email app should open with the message ready. If it doesn't, email ${CONTACT_EMAIL} or call +971 2 414 7333.`;
  });
}
