// Phosphor (light weight) for UI glyphs, Simple Icons for technology logos.
import arrowRight from '@phosphor-icons/core/assets/light/arrow-right-light.svg?raw';
import list from '@phosphor-icons/core/assets/light/list-light.svg?raw';
import x from '@phosphor-icons/core/assets/light/x-light.svg?raw';
import phone from '@phosphor-icons/core/assets/light/phone-light.svg?raw';
import mapPin from '@phosphor-icons/core/assets/light/map-pin-light.svg?raw';
import code from '@phosphor-icons/core/assets/thin/code-thin.svg?raw';
import lifebuoy from '@phosphor-icons/core/assets/thin/lifebuoy-thin.svg?raw';
import usersThree from '@phosphor-icons/core/assets/thin/users-three-thin.svg?raw';
import compass from '@phosphor-icons/core/assets/thin/compass-thin.svg?raw';
import userCircle from '@phosphor-icons/core/assets/light/user-circle-light.svg?raw';
import devices from '@phosphor-icons/core/assets/light/devices-light.svg?raw';
import appWindow from '@phosphor-icons/core/assets/light/app-window-light.svg?raw';
import plugs from '@phosphor-icons/core/assets/light/plugs-light.svg?raw';
import database from '@phosphor-icons/core/assets/light/database-light.svg?raw';
import chartLineUp from '@phosphor-icons/core/assets/light/chart-line-up-light.svg?raw';
import hardDrives from '@phosphor-icons/core/assets/light/hard-drives-light.svg?raw';
import shieldCheck from '@phosphor-icons/core/assets/light/shield-check-light.svg?raw';
import pulse from '@phosphor-icons/core/assets/light/pulse-light.svg?raw';
import { siApachekafka, siMongodb, siApachehadoop, siApachespark } from 'simple-icons';

const ICONS = {
  'arrow-right': arrowRight, list, x, phone, 'map-pin': mapPin,
  code, lifebuoy, 'users-three': usersThree, compass,
  'user-circle': userCircle, devices, 'app-window': appWindow, plugs, database,
  'chart-line-up': chartLineUp, 'hard-drives': hardDrives, 'shield-check': shieldCheck, pulse,
};

const LOGOS = {
  apachekafka: siApachekafka,
  mongodb: siMongodb,
  apachehadoop: siApachehadoop,
  apachespark: siApachespark,
};

export function icon(name) {
  return ICONS[name] ?? '';
}

export function mountIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = ICONS[el.dataset.icon] ?? '';
  });
  root.querySelectorAll('[data-logo]').forEach((el) => {
    const si = LOGOS[el.dataset.logo];
    if (!si) return;
    el.innerHTML = `<svg viewBox="0 0 24 24" role="img" aria-label="${si.title}"><path d="${si.path}"/></svg>`;
  });
}
