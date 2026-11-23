let pilotEnabled = false;

export function cinderLocomotionEnabled() {
  const preview = new URLSearchParams(globalThis.location?.search).get('cinderLocomotion');
  return preview === null ? pilotEnabled : preview === '1';
}

export function setCinderLocomotionEnabled(enabled) {
  pilotEnabled = enabled;
}

const KEY = 'arcane-cinder-locomotion';
const CELL = 128;
const STRIDE = 112;
const CONTACT = .39;
const THIGH = 73;
const SHIN = 72;
const DEG = Math.PI / 180;

// Per-cell pivots in pixels, in the same order as the Phaser atlas frames.
const PARTS = {
  head: [64, 91], torso: [64, 29], hips: [64, 46], scarf: [99, 48],
  nearUpper: [64, 28], nearLower: [64, 33], nearHand: [64, 44],
  shield: [64, 64], thigh: [64, 27], shin: [64, 29], boot: [57, 60],
  coat: [72, 35], farUpper: [64, 28], farLower: [64, 33],
  farHand: [64, 44], flame: [64, 79],
};

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (u) => u * u * (3 - 2 * u);
const rotate = ([x, y], angle) => [
  x * Math.cos(angle) - y * Math.sin(angle),
  x * Math.sin(angle) + y * Math.cos(angle),
];
const add = ([x, y], [dx, dy]) => [x + dx, y + dy];

// Full-stride key poses, starting at the near-foot strike. Arms move in
// opposition to the legs; the shield arm takes a shorter, heavier arc.
// pelvisY, pelvisX, trunk lean, head, near shoulder/elbow, far shoulder/elbow
const RUN_KEYS = [
  [-137,  1, 13, -5,  24, 47, -30, 65],
  [-132,  3, 15, -6,  14, 57, -23, 71],
  [-136,  2, 13, -3,   4, 61,  -9, 70],
  [-142,  0, 11, -2, -13, 59,  13, 59],
  [-137, -1, 10, -3, -23, 56,  28, 48],
  [-132, -3, 12, -4, -18, 57,  24, 47],
  [-136, -2, 14, -4,  -7, 55,  10, 51],
  [-142,  0, 13, -3,  14, 47, -16, 60],
];
const GUARD = [-132, 0, 0, 0, -8, 44, 24, 64];

export function preloadCinderLocomotion(scene, base) {
  scene.load.spritesheet(KEY, `${base}/rigs/cinder-vale/cinder-locomotion.webp`, {
    frameWidth: CELL, frameHeight: CELL, endFrame: 27,
  });
}

// Plant points are selected in route space once per run. A contact position
// stays fixed through stance, including on diagonal routes and at x4.
export function planCinderFootfalls(total, dx, dy, near) {
  const forward = near ? 1 : -1;
  const guard = [forward * 61, near ? 0 : -12];
  const first = near ? 0 : STRIDE / 2;
  const advance = STRIDE * CONTACT / 2;
  const end = [total * dx + guard[0], total * dy + guard[1]];
  const contacts = [{ at: 0, until: Math.min(total * .12, near ? 27 : 2), ground: guard }];
  for (let at = first || STRIDE; at < total - STRIDE * .43; at += STRIDE) {
    const distance = at + advance;
    contacts.push({
      at,
      until: Math.min(at + STRIDE * CONTACT, total - STRIDE * .23),
      ground: [distance * dx, distance * dy + (near ? 0 : -9)],
    });
  }
  const preceding = contacts[contacts.length - 1];
  contacts.push({ at: Math.max(preceding.until, total - (near ? 2 : 15)), until: total, ground: end });
  return contacts;
}

export function sampleCinderFoot(contacts, distance, total) {
  let last = contacts[0];
  for (let i = 1; i < contacts.length; i += 1) {
    const next = contacts[i];
    if (distance <= last.until) return { ground: last.ground, lift: 0, roll: 0, planted: true };
    if (distance < next.at) {
      const progress = (distance - last.until) / (next.at - last.until);
      const arc = Math.sin(Math.PI * progress ** .76);
      const reach = smooth(progress);
      const height = 38 * clamp(total / 112);
      return {
        ground: [mix(last.ground[0], next.ground[0], reach), mix(last.ground[1], next.ground[1], reach)],
        lift: height * arc,
        roll: DEG * 29 * arc * Math.cos(Math.PI * progress),
        planted: false,
      };
    }
    last = next;
  }
  return { ground: last.ground, lift: 0, roll: 0, planted: true };
}

export function createCinderLocomotion(scene, view) {
  if (!scene.textures.exists(KEY) || !scene.textures.get(KEY).has(27)) return null;
  const scale = view.bodyScaleX;
  const root = scene.add.container(view.bodyBaseX, view.bodyBaseY).setVisible(false);
  const image = (frame, [x, y]) => scene.add.image(0, 0, KEY, frame).setOrigin(x / CELL, y / CELL);
  const parts = Object.fromEntries(Object.entries(PARTS).map(([name, pivot], frame) => [name, image(frame, pivot)]));
  const farLeg = ['thigh', 'shin', 'boot'].map((name, i) =>
    image(8 + i, PARTS[name]).setTint(0xa6a4ad));
  const nearLeg = [parts.thigh, parts.shin, parts.boot];
  root.add([...farLeg, parts.farUpper, parts.farLower, parts.flame, parts.farHand, parts.coat, ...nearLeg,
    parts.hips, parts.scarf, parts.torso, parts.head, parts.nearUpper, parts.nearLower,
    parts.nearHand, parts.shield]);
  view.container.addAt(root, view.container.getIndex(view.body));

  function place(part, [x, y], angle = 0) {
    part.setPosition(x, y).setRotation(angle);
  }

  function arm(shoulder, upperAngle, elbowAngle, upperLength, lowerLength, upper, lower, hand) {
    const elbow = add(shoulder, rotate([0, upperLength], upperAngle));
    const forearmAngle = upperAngle - elbowAngle;
    const wrist = add(elbow, rotate([0, lowerLength], forearmAngle));
    place(upper, shoulder, upperAngle);
    place(lower, elbow, forearmAngle);
    place(hand, wrist, forearmAngle * .55);
    return wrist;
  }

  let facing, dx, dy, total, routes;

  function begin(distance, directionX, directionY) {
    facing = directionX < -.14 ? -1 : 1;
    dx = directionX * facing;
    dy = directionY;
    total = distance / scale;
    routes = [false, true].map(near => planCinderFootfalls(total, dx, dy, near));
    root.setScale(facing * scale, scale);
  }

  function pose(traveled) {
    const d = clamp(traveled / scale, 0, total);
    const weight = smooth(clamp(Math.min(d, total - d) / 46));
    const key = ((d / STRIDE + .5) % 1) * RUN_KEYS.length;
    const index = Math.floor(key);
    const a = RUN_KEYS[index];
    const b = RUN_KEYS[(index + 1) % RUN_KEYS.length];
    const [height, shift, lean, head, nearSwing, nearBend, farSwing, farBend] =
      GUARD.map((value, joint) => mix(value, mix(a[joint], b[joint], smooth(key - index)), weight));
    const feet = routes.map((route) => {
      const foot = sampleCinderFoot(route, d, total);
      const local = [foot.ground[0] - d * dx, foot.ground[1] - d * dy];
      const ankle = add([local[0], local[1] - foot.lift], rotate([-3, -14], foot.roll));
      return { ...foot, local, ankle };
    });
    const hips = feet.map((foot, i) => {
      const x = shift + (i ? 12 : -13);
      const reach = THIGH + SHIN - 1;
      const gap = clamp(foot.ankle[0] - x, -reach, reach);
      return foot.ankle[1] - Math.sqrt(reach * reach - gap * gap) + (i ? 0 : 3);
    });
    const pelvis = [shift, Math.max(height, ...hips)];
    const angle = lean * DEG;
    const joint = (offset) => add(pelvis, rotate(offset, angle));
    feet.forEach(({ ankle, roll }, i) => {
      const hip = [pelvis[0] + (i ? 12 : -13), pelvis[1] + (i ? 0 : -3)];
      const x = ankle[0] - hip[0], y = ankle[1] - hip[1];
      const reach = Math.hypot(x, y);
      const axis = Math.atan2(y, x);
      const bend = Math.acos(clamp((THIGH ** 2 + reach ** 2 - SHIN ** 2) / (2 * THIGH * reach), -1, 1));
      const thighAngle = axis - bend - Math.PI / 2;
      const knee = add(hip, rotate([0, THIGH], thighAngle));
      const shinAngle = Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]) - Math.PI / 2;
      const [thigh, shin, boot] = i ? nearLeg : farLeg;
      place(thigh, hip, thighAngle);
      place(shin, knee, shinAngle);
      place(boot, ankle, roll);
    });
    place(parts.hips, pelvis, angle * .24);
    place(parts.torso, joint([0, -91]), angle);
    place(parts.head, joint([1, -103]), head * DEG);
    place(parts.coat, joint([-14, -10]), (12 + lean * 1.25) * DEG);
    place(parts.scarf, joint([-16, -101]), (-36 + 45 * weight) * DEG);
    parts.scarf.setFrame(16 + Math.floor(key * 6 / RUN_KEYS.length));
    const wrist = arm(joint([31, -79]), nearSwing * DEG, nearBend * DEG, 49, 40,
      parts.nearUpper, parts.nearLower, parts.nearHand);
    place(parts.shield, add(wrist, [15, 9]), (nearSwing * .23 + 4) * DEG);
    const ember = arm(joint([-25, -81]), farSwing * DEG, farBend * DEG, 48, 38,
      parts.farUpper, parts.farLower, parts.farHand);
    place(parts.flame, add(ember, [5, 11]), -weight * .22);
    parts.flame.setFrame(22 + Math.floor(key * 12 / RUN_KEYS.length) % 6);
    return {
      feet: feet.map(({ local, planted }) => ({ x: local[0] * facing * scale, y: local[1] * scale - 4, planted })),
      rise: Math.max(0, (-pelvis[1] - 134) * scale),
    };
  }

  return { root, begin, pose };
}
