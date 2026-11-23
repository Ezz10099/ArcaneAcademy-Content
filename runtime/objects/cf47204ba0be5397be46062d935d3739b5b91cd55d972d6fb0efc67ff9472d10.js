// A gait is sampled by distance in rig units, so frame rate and speed changes
// do not affect the position of a foot during its contact phase.
export const WALK = { cycle: 36, contact: .64, lift: 7, lean: .05, swing: .29, bounce: 2 };
export const RUN = { cycle: 54, contact: .43, lift: 13, lean: .20, swing: .55, bounce: 4 };

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const angle = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]);

export function footfall(distance, offset, gait, routeLength) {
  const { cycle, contact, lift } = gait;
  const origin = Math.floor(distance / cycle + offset) - offset;
  const phase = distance / cycle - origin;
  // Place the foot under the body at the middle of the next stance.
  const plant = cycle * (origin + contact / 2);
  const from = clamp(plant, 0, routeLength);
  const to = clamp(plant + cycle, 0, routeLength);
  if (phase <= contact || from === to) return { distance: from, lift: 0, pitch: 0 };

  const swing = (phase - contact) / (1 - contact);
  const ease = swing * swing * (3 - 2 * swing);
  const arc = Math.sin(Math.PI * swing) * ((to - from) / cycle);
  return { distance: from + (to - from) * ease, lift: lift * arc, pitch: .25 * arc * Math.cos(Math.PI * swing) };
}

function connectLeg(hip, ankle, thighLength, shinLength) {
  const direction = angle(hip, ankle);
  const reach = clamp(Math.hypot(ankle[0] - hip[0], ankle[1] - hip[1]), Math.abs(thighLength - shinLength) + .01, thighLength + shinLength - .01);
  const bend = Math.acos(clamp((thighLength ** 2 + reach ** 2 - shinLength ** 2) / (2 * thighLength * reach), -1, 1));
  const knee = [
    hip[0] + Math.cos(direction - bend) * thighLength,
    hip[1] + Math.sin(direction - bend) * thighLength,
  ];
  return { knee, ankle: [hip[0] + reach * Math.cos(direction), hip[1] + reach * Math.sin(direction)] };
}

const add = ([x, y], [rx, ry], rotation) => [
  x + (rx * Math.cos(rotation) - ry * Math.sin(rotation)),
  y + (rx * Math.sin(rotation) + ry * Math.cos(rotation)),
];

export function drawCutout(ctx, atlas, rig, { distance, routeLength, gait, facing, origin, pointAt }) {
  const phase = distance / gait.cycle * Math.PI * 2;
  const root = Math.min(distance, routeLength);
  const motion = clamp(Math.min(root, routeLength - root) / 10, 0, 1);
  const twist = Math.cos(phase) * motion;
  const turn = gait.lean * motion + twist * .06;
  const { parts, cell, legs, arms } = rig;
  const feet = [legs.far, legs.near].map(({ offset, hipOffset, shade }) => {
    const step = footfall(distance, offset, gait, routeLength);
    const ground = pointAt(step.distance);
    const x = (ground[0] - origin[0]) * facing;
    return { ankle: [x + hipOffset, ground[1] - origin[1] - 4 - step.lift], x, hipOffset, shade, pitch: step.pitch };
  });

  // Lower the pelvis if needed to keep both ankles within the leg chains.
  // Otherwise IK would have to drag a contact point toward the hip.
  const legReach = legs.thighLength + legs.shinLength - .1;
  const desiredHeight = -35 - gait.bounce * (1 - Math.cos(2 * phase)) * motion / 2;
  const hipY = Math.max(desiredHeight, ...feet.map(({ ankle, x }) =>
    ankle[1] - Math.sqrt(Math.max(0, legReach ** 2 - x ** 2))));
  const hip = [0, hipY];
  const attach = ([x, y]) => add(hip, [x - rig.hip[0], y - rig.hip[1]], turn);

  function part(name, position, rotation, shade = 1) {
    const { index, pivot } = parts[name];
    ctx.save();
    ctx.translate(...position);
    ctx.rotate(rotation);
    ctx.globalAlpha *= shade;
    ctx.drawImage(atlas, index * cell, 0, cell, cell, -pivot[0], -pivot[1], cell, cell);
    ctx.restore();
  }

  function segment(name, end, position, target, shade) {
    part(name, position, angle(position, target) - angle(parts[name].pivot, end), shade);
  }

  function leg({ ankle, hipOffset, shade, pitch }) {
    const joint = [hipOffset, hipY];
    const solved = connectLeg(joint, ankle, legs.thighLength, legs.shinLength);
    segment('thigh', parts.shin.pivot, joint, solved.knee, shade);
    segment('shin', parts.boot.pivot, solved.knee, solved.ankle, shade);
    part('boot', solved.ankle, pitch, shade);
  }

  function arm({ upper, lower, side, hand }) {
    const shoulder = attach(parts[upper].pivot);
    const swing = turn + twist * gait.swing * side;
    const relative = (a, b) => [b[0] - a[0], b[1] - a[1]];
    const elbow = add(shoulder, relative(parts[upper].pivot, parts[lower].pivot), swing);
    const bend = swing + motion * (hand ? -.12 : .25 + .16 * Math.sin(phase));
    part(upper, shoulder, swing);
    part(lower, elbow, bend);
    if (hand) {
      const wrist = add(elbow, relative(parts[lower].pivot, parts[hand].pivot), bend);
      part(hand, wrist, -.35 * swing + .08 * Math.sin(phase) * motion);
    }
  }

  ctx.save();
  ctx.scale(facing, 1);
  leg(feet[0]);
  arm(arms.far);
  part('coat', attach(parts.coat.pivot), turn + motion * (.08 + .08 * Math.sin(phase - .8)));
  leg(feet[1]);
  part('torso', hip, turn);
  part('head', attach(parts.head.pivot), turn * .3 - twist * .04);
  arm(arms.near);
  ctx.restore();
}
