import { CINDER_CELL, CINDER_WALK_URL, CINDER_WALK_DISTANCE, cinderDistanceFrame } from './cinder-frames.js';

const ROUTES = {
  day: [[.63, .69], [.72, .69], [.81, .72]],
  night: [[.48, .96], [.51, .88], [.57, .81]],
};
const TURN_PAUSE = 550;
const WALK_SPEED = 165;

export function mountCampusWalker(map) {
  const walker = map?.querySelector('.campus-walker--cinder');
  const canvas = walker?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return undefined;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const atlas = new Image();
  let route, frame, previous;
  let elapsed = 0;
  let disposed = false;

  function measure() {
    const scale = walker.offsetWidth / CINDER_CELL;
    const [start, middle, end] = (ROUTES[map.dataset.lighting] || ROUTES.day)
      .map(([x, y]) => [x * map.clientWidth, y * map.clientHeight]);
    const length = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    const first = length(start, middle);
    const total = first + length(middle, end);
    route = { start, middle, end, scale, first, total };
  }

  function draw(now) {
    frame = undefined;
    if (disposed || document.hidden || !route?.scale || !route.total) {
      previous = undefined;
      return;
    }
    const { start, middle, end, first, total, scale } = route;
    const trip = total / (WALK_SPEED * scale) * 1000;
    const legTime = trip + TURN_PAUSE;
    if (!reducedMotion.matches) elapsed += previous === undefined ? 0 : Math.min(50, now - previous);
    const cycle = reducedMotion.matches ? 0 : elapsed % (legTime * 2);
    const returning = cycle >= legTime;
    const progress = Math.min(1, (cycle % legTime) / trip);
    const distance = total * (returning ? 1 - progress : progress);
    const [a, b, part] = distance <= first
      ? [start, middle, first ? distance / first : 0]
      : [middle, end, (distance - first) / (total - first)];
    walker.style.left = `${a[0] + (b[0] - a[0]) * part}px`;
    walker.style.top = `${a[1] + (b[1] - a[1]) * part}px`;
    const index = cinderDistanceFrame(total * progress / scale, CINDER_WALK_DISTANCE);
    ctx.clearRect(0, 0, CINDER_CELL, CINDER_CELL);
    ctx.save();
    if (returning) {
      ctx.translate(CINDER_CELL, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(atlas, index % 4 * CINDER_CELL, Math.floor(index / 4) * CINDER_CELL,
      CINDER_CELL, CINDER_CELL, 0, 0, CINDER_CELL, CINDER_CELL);
    ctx.restore();
    walker.classList.add('campus-walker--ready');
    previous = now;
    if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
  }

  let loaded = false;
  function sync() {
    if (!loaded || disposed || document.hidden || frame !== undefined) return;
    frame = requestAnimationFrame(draw);
  }
  function refresh() {
    measure();
    sync();
  }
  const resize = new ResizeObserver(refresh);
  resize.observe(map);
  const lighting = new MutationObserver(() => {
    elapsed = 0;
    refresh();
  });
  lighting.observe(map, { attributes: true, attributeFilter: ['data-lighting'] });
  function resume() {
    previous = undefined;
    sync();
  }
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', resume);
  atlas.src = CINDER_WALK_URL;
  atlas.decode().then(() => {
    loaded = true;
    if (!disposed) refresh();
  }).catch(() => {});
  return () => {
    disposed = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
    resize.disconnect();
    lighting.disconnect();
    document.removeEventListener('visibilitychange', resume);
    reducedMotion.removeEventListener('change', resume);
  };
}
