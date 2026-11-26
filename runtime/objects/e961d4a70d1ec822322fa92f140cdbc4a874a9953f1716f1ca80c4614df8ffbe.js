export const CINDER_CELL = 384;
export const CINDER_SOLE = 329;
export const CINDER_WALK_URL = './final-assets/academy/cinder-walk.webp';
export const CINDER_BATTLE_URL = './final-assets/battle/rigs/cinder-vale/cinder-actions.webp';
export const CINDER_WALK_DISTANCE = [0, 18, 42, 63, 87, 105, 129, 151, 174];
export const CINDER_RUN_DISTANCE = [0, 12, 54, 78, 95, 108, 149, 176, 190];
// Measured support boot x offsets in each half-step. Null means both boots are airborne.
export const CINDER_RUN_SUPPORT = [[65, 65], [65, 59], [65, 4], null, [160, 65], [160, 63], [160, -24], null];
export const CINDER_GUARD_FRAME = 8;
export const CINDER_BRAKE_FIRST = 28;
export const CINDER_BRAKE_COUNT = 8;
export const CINDER_ACTIONS = {
  attack: {
    frames: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 8],
    durations: [50, 64, 78, 48, 40, 32, 30, 50, 49, 58, 70, 66],
    approach: [0, 0, 0, 0.06, 0.19, 0.37, 0.65, 1, 0.81, 0.44, 0.12, 0],
    impact: 7,
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
