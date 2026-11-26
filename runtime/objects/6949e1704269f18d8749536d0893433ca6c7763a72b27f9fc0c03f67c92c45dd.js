export const CINDER_CELL = 384;
export const CINDER_SOLE = 329;
export const CINDER_WALK_URL = './final-assets/academy/cinder-walk.webp';
export const CINDER_BATTLE_URL = './final-assets/battle/rigs/cinder-vale/cinder-actions.webp';
export const CINDER_WALK_DISTANCE = [0, 18, 42, 63, 87, 105, 129, 151, 174];
export const CINDER_RUN_DISTANCE = [0, 53, 108, 150, 195, 250, 308, 352, 395];
export const CINDER_GUARD_FRAME = 8;
export const CINDER_BRAKE_FIRST = 28;
export const CINDER_BRAKE_COUNT = 8;
export const CINDER_ACTIONS = {
  attack: {
    frames: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 8],
    durations: [42, 57, 80, 48, 36, 32, 52, 49, 55, 63, 70, 70],
    impact: 6,
  },
  ultimate: {
    frames: [8, 20, 21, 22, 23, 24, 25, 26, 27, 8],
    durations: [55, 100, 130, 177, 65, 80, 85, 98, 100, 85],
    impact: 5,
  },
};

export function cinderDistanceFrame(distance, steps) {
  const phase = distance % steps.at(-1);
  return steps.findIndex((limit) => phase < limit) - 1;
}

export function cinderActionImpact(kind) {
  const { durations, impact } = CINDER_ACTIONS[kind];
  return durations.slice(0, impact).reduce((elapsed, duration) => elapsed + duration, 0);
}
