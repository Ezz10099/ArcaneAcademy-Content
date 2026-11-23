import { drawCutout, RUN, WALK } from './cutout-rig.js';

const CELL = 96;
const SERA = {
  cell: CELL,
  hip: [50, 49],
  parts: Object.fromEntries([
    ['head', 44, 20], ['torso', 50, 49], ['coat', 44, 44],
    ['sleeve', 40, 28], ['forearm', 34, 41],
    ['lanternSleeve', 48, 32], ['lanternForearm', 56, 39], ['lantern', 61, 43],
    ['thigh', 50, 49], ['shin', 56, 68], ['boot', 63, 84],
  ].map(([name, x, y], index) => [name, { index, pivot: [x, y] }])),
  arms: {
    far: { upper: 'lanternSleeve', lower: 'lanternForearm', side: -1, hand: 'lantern' },
    near: { upper: 'sleeve', lower: 'forearm', side: 1 },
  },
  legs: {
    thighLength: Math.hypot(6, 19),
    shinLength: Math.hypot(7, 16),
    far: { offset: .5, hipOffset: -2, shade: .8 },
    near: { offset: 0, hipOffset: 2, shade: 1 },
  },
};

const TERRACE = [[.63, .69], [.72, .69], [.81, .72]];
const TRIPS = [{ gait: WALK, speed: 36, facing: 1 }, { gait: RUN, speed: 80, facing: -1 }];
const TURN_PAUSE = .55;
const atlas = new Image();
atlas.src = './final-assets/academy/sera-cutout.webp';

export function mountCampusWalker(map) {
  const walker = map.querySelector('.campus-walker--sera');
  const canvas = walker.querySelector('canvas');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  let routes;
  let frame;
  let elapsed = 0;
  let previous;
  let disposed = false;

  function measure() {
    // Hold scale constant through foot contact. Coordinates are local to the
    // scrolled map, so panning never introduces motion into the gait.
    const scale = walker.offsetWidth * .76 / CELL;
    if (!scale) return;
    const points = TERRACE.map(([x, y]) => [map.clientWidth * x / scale, map.clientHeight * y / scale]);
    routes = TRIPS.map(({ gait, speed, facing }) => {
      const [start, middle, end] = facing > 0 ? points : [...points].reverse();
      const length = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
      const first = length(start, middle);
      const second = length(middle, end);
      const routeLength = first + second;
      const duration = (routeLength + gait.cycle) / speed + TURN_PAUSE;
      function pointAt(distance) {
        const [a, b, t] = distance <= first
          ? [start, middle, distance / first]
          : [middle, end, (distance - first) / second];
        return a.map((value, i) => value + (b[i] - value) * t);
      }
      return { gait, speed, facing, routeLength, duration, pointAt, scale };
    });
  }

  function draw(now) {
    frame = undefined;
    if (document.hidden || reducedMotion.matches || map.dataset.lighting === 'night') {
      previous = undefined;
      return;
    }
    if (routes?.[0].routeLength) {
      elapsed += previous === undefined ? 0 : Math.min(.05, (now - previous) / 1000);
      const [outbound, returning] = routes;
      elapsed %= outbound.duration + returning.duration;
      const route = elapsed < outbound.duration ? outbound : returning;
      const seconds = route === outbound ? elapsed : elapsed - outbound.duration;
      const distance = Math.min(route.routeLength + route.gait.cycle, seconds * route.speed);
      const origin = route.pointAt(Math.min(distance, route.routeLength));
      walker.style.left = `${origin[0] * route.scale}px`;
      walker.style.top = `${origin[1] * route.scale}px`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, 90);
      drawCutout(ctx, atlas, SERA, { ...route, distance, origin });
      ctx.restore();
      walker.classList.add('campus-walker--rigged');
    }
    previous = now;
    frame = window.requestAnimationFrame(draw);
  }

  let loaded = false;
  function sync() {
    if (!loaded || frame !== undefined || document.hidden || reducedMotion.matches || map.dataset.lighting === 'night') return;
    measure();
    frame = window.requestAnimationFrame(draw);
  }

  const observer = new ResizeObserver(measure);
  observer.observe(map);
  const lighting = new MutationObserver(sync);
  lighting.observe(map, { attributes: true, attributeFilter: ['data-lighting'] });
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  atlas.decode().then(() => {
    if (disposed) return;
    loaded = true;
    sync();
  }).catch(() => {
    // The existing CSS walk remains available if the cutout cannot be decoded.
  });
  return () => {
    disposed = true;
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    observer.disconnect();
    lighting.disconnect();
    document.removeEventListener('visibilitychange', sync);
    reducedMotion.removeEventListener('change', sync);
  };
}
