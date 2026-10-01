import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Motion system. Every animation here does one of three jobs:
//   intro      - establish hierarchy on load (headline first, then actions)
//   depth      - sections settle from a slight tilt as they reach reading position
//   scrubbed   - scroll drives a spatial change that explains something (stack opens, prism turns, plates assemble)
// Under prefers-reduced-motion none of this runs; the CSS resting state is the finished design.

export function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero__title .line > span', { yPercent: 110, duration: 1.3, stagger: 0.09 }, 0.15)
    .from('.hero__sub', { y: 18, opacity: 0, duration: 1.1 }, 0.5)
    .from('.hero__actions > *', { y: 14, opacity: 0, duration: 1, stagger: 0.07 }, 0.65);
  return tl;
}

export function heroScroll(onProgress) {
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => onProgress?.(self.progress),
  });
  gsap.to('.hero__content', {
    y: -80, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true },
  });
}

export function depthSections() {
  gsap.utils.toArray('.depth').forEach((el) => {
    gsap.fromTo(el,
      { rotateX: 7, scale: 0.95, y: 70, opacity: 0.35 },
      {
        rotateX: 0, scale: 1, y: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 45%', scrub: 0.6 },
      });
  });
}

export function servicesScroll(services) {
  const mm = gsap.matchMedia();
  let st = null;
  mm.add('(min-width: 921px)', () => {
    const n = services.count;
    services.prism.classList.add('is-scrubbed');
    st = ScrollTrigger.create({
      trigger: services.root,
      pin: '.services__pin',
      start: 'top top',
      end: () => `+=${window.innerHeight * 0.75 * (n - 1)}`,
      scrub: 0.6,
      snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut', delay: 0.05 },
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const turn = self.progress * (n - 1);
        services.prism.style.setProperty('--ry', `${(-turn * 90).toFixed(2)}deg`);
        services.set(Math.round(turn), { rotate: false });
      },
    });
    return () => {
      services.prism.classList.remove('is-scrubbed');
      st = null;
    };
  });
  // tabs jump to the scroll position of that face when pinned, otherwise just switch
  return (i) => {
    if (!st) { services.set(i); return; }
    const y = st.start + (st.end - st.start) * (i / (services.count - 1));
    window.scrollTo({ top: y + 1, behavior: 'smooth' });
  };
}

export function platesScroll() {
  gsap.utils.toArray('[data-plate]').forEach((plate) => {
    const stack = plate.querySelector('.plate__stack');
    const scene = plate.querySelector('.plate__scene');
    // layers arrive spread apart and assemble as the project reaches reading position
    gsap.fromTo(stack, { '--open': 1.3 }, {
      '--open': 0, ease: 'none',
      scrollTrigger: { trigger: plate, start: 'top bottom', end: 'center 55%', scrub: 0.6 },
    });
    gsap.fromTo(scene, { rotateX: 12, y: 60 }, {
      rotateX: 0, y: 0, ease: 'none',
      scrollTrigger: { trigger: plate, start: 'top bottom', end: 'top 35%', scrub: 0.6 },
    });
  });
}

export function whyScroll() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1001px)', () => {
    gsap.utils.toArray('.why__plane').forEach((plane, i) => {
      gsap.fromTo(plane, { y: 160 + i * 60, rotateX: -10, opacity: 0.2 }, {
        y: i * 28, rotateX: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.why__planes', start: 'top bottom', end: 'top 40%', scrub: 0.6 },
      });
    });
  });
}

export function refreshOnFonts() {
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

export { gsap, ScrollTrigger };
