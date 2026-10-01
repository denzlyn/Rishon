import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import './styles/main.css';

import { mountIcons } from './lib/icons.js';
import { renderTier, prefersReducedMotion } from './lib/device.js';
import {
  initNav, initServices, initArchitectureUI, initIndustries, initPlates, initMagnetic, initForm,
} from './ui/interface.js';
import {
  gsap, heroIntro, heroScroll, depthSections, servicesScroll, platesScroll, whyScroll, refreshOnFonts,
} from './motion.js';

document.documentElement.classList.add('js');
const reduced = prefersReducedMotion();
const tier = renderTier();
const params = new URLSearchParams(location.search);
// ?poster renders a clean frame of each scene for the static fallback images
const posterMode = params.has('poster');
if (posterMode) document.documentElement.classList.add('poster-mode');

mountIcons();
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

initNav();
initIndustries();
initPlates();
initForm();
initMagnetic(gsap);
const arch = initArchitectureUI();

let jumpToService;
const services = initServices({ onUserPick: (i) => jumpToService(i) });

if (!reduced && !posterMode) {
  heroIntro();
  depthSections();
  platesScroll();
  whyScroll();
  jumpToService = servicesScroll(services);
  refreshOnFonts();
} else {
  jumpToService = (i) => services.set(i);
}

// Reveal: content blocks fade up once as they enter
if (!reduced) {
  const targets = document.querySelectorAll(
    '.arch__head > *, .arch__body, .eng__clusters > *, .stack, .work__title, .plate__body, .why__title, .contact__copy, .form',
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  targets.forEach((el, i) => {
    el.dataset.reveal = '';
    el.style.transitionDelay = `${(i % 3) * 70}ms`;
    io.observe(el);
  });
}

// 3D scenes load after first paint. The poster images stay as the fallback.
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));

function onArchitecturePick(id) {
  document.getElementById('architecture').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  arch.select(id);
}

if (tier !== 'none') {
  idle(async () => {
    const heroEl = document.querySelector('.hero');
    const canvas = heroEl.querySelector('[data-hero-canvas]');
    const labels = [...heroEl.querySelectorAll('[data-hero-labels] li')];
    try {
      const { initHero } = await import('./three/hero.js');
      const hero = initHero(canvas, {
        tier, reduced: reduced || posterMode, labels, onSelect: onArchitecturePick,
      });
      if (!reduced && !posterMode) heroScroll((p) => hero.setProgress(p));
      requestAnimationFrame(() => heroEl.classList.add('is-live'));
    } catch (err) {
      console.warn('Hero scene unavailable, keeping poster.', err);
    }
  });

  // architecture board initialises when it gets close to the viewport
  const archEl = document.querySelector('[data-arch]');
  const archIO = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    archIO.disconnect();
    try {
      const { initArchitecture } = await import('./three/architecture.js');
      const board = initArchitecture(archEl.querySelector('[data-arch-canvas]'), {
        tier,
        reduced: reduced || posterMode,
        tagsEl: archEl.querySelector('[data-arch-tags]'),
        onPick: (id) => arch.select(id),
      });
      arch.onChange((id) => board.select(id));
      requestAnimationFrame(() => archEl.classList.add('is-live'));
    } catch (err) {
      console.warn('Architecture scene unavailable, keeping poster.', err);
    }
  }, { rootMargin: '800px 0px' });
  archIO.observe(archEl);
}
