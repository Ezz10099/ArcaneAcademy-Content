// Points are sampled from the registered 384px idle textures. Each leg keeps
// its original pixels, with a small overlap at the knee behind the front layer.
const LEGS = {
  cinder: [
    [[161, 201], [139, 244], [126, 307], [[123,215],[165,190],[179,224],[153,263],[145,325],[96,331],[99,301]]],
    [[212, 199], [235, 235], [262, 323], [[189,195],[227,193],[248,222],[258,268],[284,350],[247,350],[245,307],[219,267],[200,230]]],
  ],
  forestScout: [
    [[160, 214], [136, 260], [135, 322], [[124,232],[161,204],[181,234],[149,271],[169,338],[81,348],[83,319],[119,305],[120,272],[106,240]]],
    [[197, 220], [226, 264], [265, 329], [[177,214],[203,208],[222,239],[249,268],[258,300],[322,350],[226,354],[244,310],[217,279],[185,253]]],
  ],
  briarGuard: [
    [[158, 211], [132, 257], [147, 313], [[114,227],[154,199],[179,232],[153,277],[193,321],[75,345],[75,313],[112,289],[126,270],[104,250]]],
    [[254, 304], [258, 323], [270, 339], [[239,312],[276,310],[298,324],[318,350],[210,355],[216,330]]],
  ],
  kael: [
    [[158, 205], [137, 269], [111, 334], [[138,212],[172,211],[165,277],[137,314],[135,353],[88,357],[97,319],[116,299],[110,282]]],
    [[221, 214], [244, 277], [258, 333], [[203,210],[236,219],[255,258],[260,305],[289,345],[287,355],[231,355],[238,323],[217,267]]],
  ],
  gorr: [
    [[169, 215], [138, 270], [122, 330], [[143,228],[169,222],[185,249],[146,288],[137,351],[98,354],[107,291],[120,265]]],
    [[211, 216], [224, 273], [238, 326], [[196,220],[226,219],[249,254],[243,307],[279,328],[282,352],[212,352],[214,315],[204,269]]],
  ],
  dusk: [
    [[169, 217], [148, 280], [121, 333], [[142,226],[169,209],[186,236],[161,285],[135,347],[108,355],[103,334],[122,289]]],
    [[213, 218], [235, 276], [247, 327], [[200,219],[227,218],[248,255],[256,313],[282,347],[226,349],[230,307],[216,282]]],
  ],
  gatewoodWarden: [
    [[163, 245], [155, 296], [142, 328], [[149,270],[173,270],[173,336],[133,345],[108,340],[117,322],[139,302]]],
    [[204, 300], [205, 320], [213, 339], [[190,313],[217,313],[228,329],[246,350],[193,351],[190,330]]],
  ],
};

const CYCLE_LENGTH = 60;
const CONTACT_FRACTION = 0.38;
const CINDER_CYCLE_LENGTH = 80;
const CINDER_SOLES = [[115, 325], [270, 344]];
const blend = (a, b, t) => a + (b - a) * t;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function runTravelProgress(time) {
  // Constant running speed between short acceleration and braking ramps.
  const ramp = 0.18;
  const early = (t) => t * t / (2 * ramp * (1 - ramp));
  if (time < ramp) return early(time);
  if (time > 1 - ramp) return 1 - early(1 - time);
  return (time - ramp / 2) / (1 - ramp);
}

export function sampleRunFoot(distance, legIndex, cycleLength = CYCLE_LENGTH) {
  const phase = (distance / cycleLength + legIndex * 0.5) % 1;
  const halfStride = cycleLength * CONTACT_FRACTION / 2;
  if (phase < CONTACT_FRACTION) {
    return { alongPath: halfStride - phase * cycleLength, lift: 0, planted: true };
  }
  const swing = (phase - CONTACT_FRACTION) / (1 - CONTACT_FRACTION);
  // Tuck the trailing heel just after push-off, then extend the knee into the next landing.
  const reach = swing * swing * (3 - 2 * swing);
  const tuck = Math.sin(Math.PI * swing ** 0.72);
  return { alongPath: blend(-halfStride, halfStride, reach), lift: 21 * tuck, planted: false };
}

export function sampleRunBody(distance, cycleLength = CYCLE_LENGTH) {
  const step = (distance / cycleLength) % 0.5;
  if (step < CONTACT_FRACTION) {
    return -3 * Math.sin(Math.PI * step / CONTACT_FRACTION);
  }
  const flight = (step - CONTACT_FRACTION) / (0.5 - CONTACT_FRACTION);
  return 5 * Math.sin(Math.PI * flight);
}

function cutTexture(scene, key, source, polygon, mode, cutY, ankleY = source.height) {
  if (!scene.textures.exists(key)) {
    const crop = mode === 'upper'
      ? [0, 0, source.width, source.height]
      : [
        Math.min(...polygon.map(([x]) => x)),
        Math.max(mode === 'shin' ? cutY - 9 : mode === 'boot' ? ankleY - 5 : 0, Math.min(...polygon.map(([, y]) => y))),
        Math.max(...polygon.map(([x]) => x)),
        Math.min(mode === 'thigh' ? cutY + 10 : mode === 'shin' ? ankleY + 5 : source.height, Math.max(...polygon.map(([, y]) => y))),
      ];
    const [x, y, right, bottom] = crop;
    const canvas = document.createElement('canvas');
    canvas.width = right - x;
    canvas.height = bottom - y;
    const ctx = canvas.getContext('2d');
    ctx.translate(-x, -y);
    const path = (points) => {
      ctx.beginPath();
      points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.closePath();
    };
    if (mode === 'upper') {
      ctx.drawImage(source, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      polygon.forEach((points) => { path(points); ctx.fill(); });
    } else {
      path(polygon);
      ctx.clip();
      ctx.drawImage(source, 0, 0);
    }
    const texture = scene.textures.addCanvas(key, canvas);
    texture.runCrop = { x, y };
  }
  return scene.textures.get(key);
}

function limbPose(hip, knee, ankle, hipX, hipY, targetX, targetY, forwardKnee = 0) {
  const thigh = Math.hypot(knee[0] - hip[0], knee[1] - hip[1]);
  const shin = Math.hypot(ankle[0] - knee[0], ankle[1] - knee[1]);
  const dx = targetX - hipX, dy = targetY - hipY;
  const length = clamp(Math.hypot(dx, dy), Math.abs(thigh - shin) + 0.5, thigh + shin - 0.5);
  const bend = (knee[0] - hip[0]) * (ankle[1] - hip[1]) - (knee[1] - hip[1]) * (ankle[0] - hip[0]);
  const angle = Math.atan2(dy, dx);
  const bendAngle = Math.acos(clamp((thigh ** 2 + length ** 2 - shin ** 2) / (2 * thigh * length), -1, 1));
  const restBend = Math.sign(bend || 1);
  // The idle pose can have a locked back knee. Blend the two limb angles together
  // into a forward bend for Cinder while keeping both joints connected.
  const bendDirection = blend(restBend, 1, forwardKnee);
  const thighAngle = angle - bendDirection * bendAngle;
  const x = hipX + Math.cos(thighAngle) * thigh;
  const y = hipY + Math.sin(thighAngle) * thigh;
  let ankleX = hipX + Math.cos(angle) * length;
  let ankleY = hipY + Math.sin(angle) * length;
  if (bendDirection !== restBend && forwardKnee < 1) {
    const shinBend = Math.acos(clamp((shin ** 2 + length ** 2 - thigh ** 2) / (2 * shin * length), -1, 1));
    const shinAngle = angle + bendDirection * shinBend;
    ankleX = x + Math.cos(shinAngle) * shin;
    ankleY = y + Math.sin(shinAngle) * shin;
  }
  return {
    x, y, ankleX, ankleY,
    thighAngle: thighAngle - Math.atan2(knee[1] - hip[1], knee[0] - hip[0]),
    shinAngle: Math.atan2(ankleY - y, ankleX - x) - Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]),
  };
}

export function createMeleeRun(scene, view) {
  const legData = LEGS[view.family];
  if (!legData || !view.textureMap?.idle) return null;
  const cinder = view.family === 'cinder';
  const seed = scene.textures.get(view.textureMap.idle).getSourceImage();
  const key = view.textureMap.idle + '-run';
  const scale = view.bodyScaleX;
  const ground = cinder ? CINDER_SOLES[1][1] : view.soleRow;
  const root = scene.add.container(view.bodyBaseX, view.bodyBaseY).setScale(scale).setVisible(false);
  const worldPart = (texture, [x, y]) => {
    const { x: cropX, y: cropY } = texture.runCrop;
    const source = texture.getSourceImage();
    return scene.add.image(x - 192, y - ground, texture.key)
      .setOrigin((x - cropX) / source.width, (y - cropY) / source.height);
  };
  const legs = legData.map(([hip, knee, ankle, polygon], index) => {
    const thigh = worldPart(cutTexture(scene, key + '-thigh-' + index, seed, polygon, 'thigh', knee[1]), hip);
    const shin = worldPart(cutTexture(scene, key + '-shin-' + index, seed, polygon, 'shin', knee[1], cinder ? ankle[1] : undefined), knee);
    const boot = cinder
      ? worldPart(cutTexture(scene, key + '-boot-' + index, seed, polygon, 'boot', knee[1], ankle[1]), ankle)
      : null;
    root.add([shin, thigh]);
    if (boot) root.add(boot);
    return { hip, knee, ankle, thigh, shin, boot };
  });
  const torsoAnchor = [192, Math.min(...legs.map(({ hip }) => hip[1]))];
  const upper = worldPart(cutTexture(scene, key + '-torso', seed, legData.map((leg) => leg[3]), 'upper'), torsoAnchor);
  root.add(upper);
  view.container.addAt(root, view.container.getIndex(view.body));

  function pose(distance, total, directionX, directionY) {
    const ramp = clamp(Math.min(distance, total - distance) / (cinder ? 19 : 9), 0, 1);
    const gait = ramp * ramp * (3 - 2 * ramp);
    const cycleLength = cinder ? CINDER_CYCLE_LENGTH : CYCLE_LENGTH;
    const rise = sampleRunBody(distance, cycleLength) * gait;
    const lean = (Math.sign(directionX) || (view.side === 'player' ? 1 : -1)) * (cinder ? 0.34 : 0.29) * gait;
    const sinLean = Math.sin(lean), cosLean = Math.cos(lean);
    const hipOffset = 17 * gait - rise / scale;
    upper.y = torsoAnchor[1] - ground + hipOffset;
    upper.rotation = lean;
    const midX = (legs[0].ankle[0] + legs[1].ankle[0]) / 2;
    const groundAnkle = Math.max(...legs.map(({ ankle }) => ankle[1]));
    const feet = legs.map(({ hip, knee, ankle, thigh, shin, boot }, index) => {
      const step = sampleRunFoot(distance, cinder ? 1 - index : index, cycleLength);
      const legReach = Math.hypot(knee[0] - hip[0], knee[1] - hip[1])
        + Math.hypot(ankle[0] - knee[0], ankle[1] - knee[1]);
      // Armor and shields hide some upper legs. Keep those shorter visible cuts attached.
      const reach = clamp(legReach / 100, 0.38, 1);
      const runCenter = cinder ? midX + (index === 0 ? -2 : 6) : blend(ankle[0], midX, 0.82 * reach);
      const floorAnkle = cinder ? ankle[1] + (index === 0 ? 8 : 0) : blend(ankle[1], groundAnkle, reach);
      // The rear boot points outward in the guard stance. Turn it toward the
      // run during takeoff, then open the stance again under braking.
      const bootScaleX = index === 0 ? Math.cos(Math.PI * gait) : 1;
      const bootAngle = -step.lift / 130 * gait;
      const [soleX, soleY] = cinder ? CINDER_SOLES[index] : ankle;
      const bootX = (soleX - ankle[0]) * bootScaleX;
      const bootY = soleY - ankle[1];
      const soleOffsetX = bootX * Math.cos(bootAngle) - bootY * Math.sin(bootAngle);
      const soleOffsetY = bootX * Math.sin(bootAngle) + bootY * Math.cos(bootAngle);
      const stride = step.alongPath * reach / scale;
      const runX = runCenter + directionX * stride;
      const runY = floorAnkle + bootY + directionY * stride
        - (step.lift * reach + (step.planted ? 0 : Math.max(0, rise))) / scale;
      const hipLocalX = hip[0] - torsoAnchor[0];
      const hipLocalY = hip[1] - torsoAnchor[1];
      const hipX = cinder ? torsoAnchor[0] + cosLean * hipLocalX - sinLean * hipLocalY : hip[0];
      const hipY = hip[1] + hipOffset + sinLean * hipLocalX + (cinder ? (cosLean - 1) * hipLocalY : 0);
      const position = limbPose(hip, knee, ankle, hipX, hipY,
        blend(soleX, runX, gait) - soleOffsetX,
        blend(soleY, runY, gait) - soleOffsetY, cinder ? gait : 0);
      thigh.setPosition(hipX - 192, hipY - ground).setRotation(position.thighAngle);
      shin.setPosition(position.x - 192, position.y - ground).setRotation(position.shinAngle);
      boot?.setPosition(position.ankleX - 192, position.ankleY - ground)
        .setScale(bootScaleX, 1).setRotation(bootAngle);
      return {
        x: (position.ankleX + soleOffsetX - 192) * scale,
        y: (position.ankleY + soleOffsetY - ground) * scale - (cinder ? 4 : 0),
        planted: gait < 0.1 || step.planted,
      };
    });
    return { feet, rise };
  }
  return { root, pose };
}
