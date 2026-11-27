// Pure Arcane Animator v7 skeletal pose sampler & transform math.
// Derived directly from reference-rig-core.mjs (Studio 0.7.1 exact rules)
// plus reusable shortest-angle pose blending for seamless combat transitions.
// Zero DOM, game simulation, wall clocks, Phaser dependency, or texture loading.

const radians = degrees => degrees * Math.PI / 180;
export const wrapAngle = a => ((a + 180) % 360 + 360) % 360 - 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const copy = v => JSON.parse(JSON.stringify(v));
const ease = (t, mode) =>
  mode === 'ease-in' ? t * t
  : mode === 'ease-out' ? 1 - (1 - t) * (1 - t)
  : mode === 'ease-in-out' ? t * t * (3 - 2 * t)
  : t;

export function getClip(project, clipName) {
  if (clipName === project.animationName) {
    return { name: clipName, keys: project.keys, durationFrames: project.durationFrames };
  }
  const clip = project.clips.find(c => c.name === clipName);
  if (!clip) throw new Error('Unknown clip: ' + clipName);
  return clip;
}

export function getBoneWorld(project, pose) {
  const out = [];
  for (const [i, b] of project.rig.entries()) {
    const p = out[b.p];
    let x = pose.x;
    let y = pose.y;
    let a = pose.a[i];
    if (p) {
      const c = Math.cos(radians(p.a));
      const s = Math.sin(radians(p.a));
      x = p.x + b.x * c - b.y * s;
      y = p.y + b.x * s + b.y * c;
      a += p.a;
    }
    out.push({
      id: b.id,
      x,
      y,
      a,
      ex: x + b.len * Math.cos(radians(a)),
      ey: y + b.len * Math.sin(radians(a)),
    });
  }
  return out;
}

function solvePin(project, pose, id, pin) {
  const i = project.rig.findIndex(b => b.id === id);
  const b = project.rig[i];
  if (!b || b.p < 0 || !['nearKnee', 'farKnee'].includes(id)) return;
  const parent = project.rig[b.p];
  if (parent.p < 0 || Math.abs(b.x - parent.len) > 1e-6 || Math.abs(b.y) > 1e-6) return;
  const w = getBoneWorld(project, pose);
  const root = w[b.p];
  const L1 = parent.len;
  const L2 = b.len;
  const dx = pin.x - root.x;
  const dy = pin.y - root.y;
  const dist = Math.hypot(dx, dy);
  const d = clamp(dist, Math.max(Math.abs(L1 - L2), 1e-7), L1 + L2);
  const direction = dist > 1e-7 ? Math.atan2(dy, dx) : radians(root.a);
  const bend = (pin.sign < 0 ? -1 : 1) * Math.acos(clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1));
  const upper = direction - Math.atan2(L2 * Math.sin(bend), L1 + L2 * Math.cos(bend));
  pose.a[b.p] = wrapAngle(upper * 180 / Math.PI - w[parent.p].a);
  pose.a[i] = wrapAngle(bend * 180 / Math.PI);
  if (project.rigKind === 'cinder' && Number.isFinite(pin.footAngle)) {
    const boot = project.rig.findIndex(b => b.id === (id === 'nearKnee' ? 'nearFoot' : 'farFoot'));
    if (boot >= 0) pose.a[boot] = wrapAngle(pin.footAngle - getBoneWorld(project, pose)[i].a);
  }
}

export function samplePose(project, clipName, frame) {
  const { keys } = getClip(project, clipName);
  const right = keys.findIndex(k => k.f >= frame);
  if (right < 0) return copy(keys.at(-1).pose);
  if (right === 0 || keys[right].f === frame) return copy(keys[right].pose);
  const b = keys[right];
  const a = keys[right - 1];
  const t = ease((frame - a.f) / (b.f - a.f), a.ease);
  const p = {
    x: a.pose.x + (b.pose.x - a.pose.x) * t,
    y: a.pose.y + (b.pose.y - a.pose.y) * t,
    a: a.pose.a.map((v, i) => v + wrapAngle(b.pose.a[i] - v) * t),
  };
  const pins = {};
  if (project.rigKind !== 'custom') {
    for (const [id, v] of Object.entries(a.pose.pins || {})) {
      const n = b.pose.pins?.[id];
      if (!n || n.sign !== v.sign || Math.hypot(n.x - v.x, n.y - v.y) >= 1e-6) continue;
      const pin = { ...v };
      if (Number.isFinite(v.footAngle) && Number.isFinite(n.footAngle)) {
        pin.footAngle = v.footAngle + wrapAngle(n.footAngle - v.footAngle) * t;
      } else {
        delete pin.footAngle;
      }
      pins[id] = pin;
      solvePin(project, p, id, pin);
    }
  }
  if (Object.keys(pins).length) p.pins = pins;
  return p;
}

export function blendPose(fromPose, toPose, alpha) {
  const t = clamp(alpha, 0, 1);
  if (t <= 0) return copy(fromPose);
  if (t >= 1) return copy(toPose);
  const s = t * t * (3 - 2 * t);
  return {
    x: fromPose.x + (toPose.x - fromPose.x) * s,
    y: fromPose.y + (toPose.y - fromPose.y) * s,
    a: fromPose.a.map((v, i) => v + wrapAngle(toPose.a[i] - v) * s),
  };
}

export function getPartTransforms(project, pose) {
  const w = getBoneWorld(project, pose);
  const byId = new Map(w.map(b => [b.id, b]));
  return project.art.map(a => {
    const b = byId.get(a.bone);
    const c = Math.cos(radians(b.a));
    const s = Math.sin(radians(b.a));
    return {
      bone: a.bone,
      x: b.x + a.x * c - a.y * s,
      y: b.y + a.x * s + a.y * c,
      angle: b.a + a.angle,
      width: a.width,
      height: a.height ?? a.width * a.ih / a.iw,
      originX: a.px / 100,
      originY: a.py / 100,
    };
  });
}

export function getAnchor(project, pose, anchor) {
  const b = getBoneWorld(project, pose).find(bone => bone.id === anchor.bone);
  if (!b) throw new Error('Unknown anchor bone: ' + anchor.bone);
  const c = Math.cos(radians(b.a));
  const s = Math.sin(radians(b.a));
  return {
    x: b.x + anchor.x * c - anchor.y * s,
    y: b.y + anchor.x * s + anchor.y * c,
  };
}

