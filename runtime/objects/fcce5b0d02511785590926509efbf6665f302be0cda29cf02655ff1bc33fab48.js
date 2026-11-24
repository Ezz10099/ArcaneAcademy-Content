export const CINDER_CELL = 384;
export const CINDER_SOLE = 329;
export const CINDER_WALK_URL = './final-assets/academy/cinder-walk.webp';
export const CINDER_BATTLE_URL = './final-assets/battle/rigs/cinder-vale/cinder-actions.webp';
export const CINDER_WALK_DISTANCE = [0, 18, 42, 63, 87, 105, 129, 151, 174];
export const CINDER_RUN_DISTANCE = [0, 53, 108, 150, 195, 250, 308, 352, 395];
export const CINDER_ACTIONS = {
  attack: { first: 8, durations: [115, 125, 90, 43, 58, 77, 105, 155], impact: 4 },
  ultimate: { first: 16, durations: [125, 138, 225, 73, 80, 120, 135, 180], impact: 4 },
};

export function cinderDistanceFrame(distance, steps) {
  const phase = distance % steps.at(-1);
  return steps.findIndex((limit) => phase < limit) - 1;
}

export function cinderActionImpact(kind) {
  const { durations, impact } = CINDER_ACTIONS[kind];
  return durations.slice(0, impact).reduce((elapsed, duration) => elapsed + duration, 0);
}
