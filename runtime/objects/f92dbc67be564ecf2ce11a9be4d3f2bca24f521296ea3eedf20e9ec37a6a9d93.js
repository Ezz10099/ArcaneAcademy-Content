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

const CYCLE_LENGTH = 48;
const CONTACT_FRACTION = 0.56;
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

export function sampleRunFoot(distance, legIndex) {
  const phase = (distance / CYCLE_LENGTH + legIndex * 0.5) % 1;
  const planted = phase < CONTACT_FRACTION;
  const swing = clamp((phase - CONTACT_FRACTION) / (1 - CONTACT_FRACTION), 0, 1);
  const halfStride = CYCLE_LENGTH * CONTACT_FRACTION / 2;
  const alongPath = planted ? halfStride - phase * CYCLE_LENGTH
    : blend(-halfStride, halfStride, swing * swing * (3 - 2 * swing));
  return { alongPath, lift: 8 * Math.sin(Math.PI * swing), planted };
}

function cutTexture(scene, key, source, polygon, mode, cutY) {
  if (!scene.textures.exists(key)) {
    const crop = mode === 'upper'
      ? [0, 0, source.width, source.height]
      : [
        Math.min(...polygon.map(([x]) => x)),
        Math.max(mode === 'shin' ? cutY - 9 : 0, Math.min(...polygon.map(([, y]) => y))),
        Math.max(...polygon.map(([x]) => x)),
        Math.min(mode === 'thigh' ? cutY + 10 : source.height, Math.max(...polygon.map(([, y]) => y))),
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

function limbPose(hip, knee, ankle, hipY, targetX, targetY) {
  const thigh = Math.hypot(knee[0] - hip[0], knee[1] - hip[1]);
  const shin = Math.hypot(ankle[0] - knee[0], ankle[1] - knee[1]);
  const dx = targetX - hip[0], dy = targetY - hipY;
  const length = clamp(Math.hypot(dx, dy), Math.abs(thigh - shin) + 0.5, thigh + shin - 0.5);
  const bend = (knee[0] - hip[0]) * (ankle[1] - hip[1]) - (knee[1] - hip[1]) * (ankle[0] - hip[0]);
  const angle = Math.atan2(dy, dx);
  const bendAngle = Math.acos(clamp((thigh ** 2 + length ** 2 - shin ** 2) / (2 * thigh * length), -1, 1));
  const thighAngle = angle - Math.sign(bend || 1) * bendAngle;
  const x = hip[0] + Math.cos(thighAngle) * thigh;
  const y = hipY + Math.sin(thighAngle) * thigh;
  const ankleX = hip[0] + Math.cos(angle) * length;
  const ankleY = hipY + Math.sin(angle) * length;
  return {
    x, y, ankleX, ankleY,
    thighAngle: thighAngle - Math.atan2(knee[1] - hip[1], knee[0] - hip[0]),
    shinAngle: Math.atan2(ankleY - y, ankleX - x) - Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]),
  };
}

export function createMeleeRun(scene, view) {
  const legData = LEGS[view.family];
  if (!legData || !view.textureMap?.idle) return null;
  const seed = scene.textures.get(view.textureMap.idle).getSourceImage();
  const key = view.textureMap.idle + '-run';
  const scale = view.bodyScaleX;
  const ground = view.soleRow;
  const root = scene.add.container(view.bodyBaseX, view.bodyBaseY).setScale(scale).setVisible(false);
  const worldPart = (texture, [x, y]) => {
    const { x: cropX, y: cropY } = texture.runCrop;
    const source = texture.getSourceImage();
    return scene.add.image(x - 192, y - ground, texture.key)
      .setOrigin((x - cropX) / source.width, (y - cropY) / source.height);
  };
  const legs = legData.map(([hip, knee, ankle, polygon], index) => {
    const thigh = worldPart(cutTexture(scene, key + '-thigh-' + index, seed, polygon, 'thigh', knee[1]), hip);
    const shin = worldPart(cutTexture(scene, key + '-shin-' + index, seed, polygon, 'shin', knee[1]), knee);
    root.add([shin, thigh]);
    return { hip, knee, ankle, thigh, shin };
  });
  const torsoAnchor = [192, Math.min(...legs.map(({ hip }) => hip[1]))];
  const upper = worldPart(cutTexture(scene, key + '-torso', seed, legData.map((leg) => leg[3]), 'upper'), torsoAnchor);
  root.add(upper);
  view.container.addAt(root, view.container.getIndex(view.body));

  function pose(distance, total, directionX, directionY) {
    const ramp = clamp(Math.min(distance, total - distance) / 14, 0, 1);
    const gait = ramp * ramp * (3 - 2 * ramp);
    const facing = view.side === 'player' ? 1 : -1;
    upper.y = torsoAnchor[1] - ground + 8 * gait;
    upper.rotation = facing * 0.12 * gait;
    const midX = (legs[0].ankle[0] + legs[1].ankle[0]) / 2;
    const groundAnkle = Math.max(...legs.map(({ ankle }) => ankle[1]));
    return legs.map(({ hip, knee, ankle, thigh, shin }, index) => {
      const step = sampleRunFoot(distance, index);
      const runX = midX + (ankle[0] - midX) * 0.35 + directionX * step.alongPath / scale;
      const runY = groundAnkle + directionY * step.alongPath / scale - step.lift / scale;
      const hipY = hip[1] + 15 * gait;
      const position = limbPose(hip, knee, ankle, hipY,
        blend(ankle[0], runX, gait), blend(ankle[1], runY, gait));
      thigh.setPosition(hip[0] - 192, hipY - ground).setRotation(position.thighAngle);
      shin.setPosition(position.x - 192, position.y - ground).setRotation(position.shinAngle);
      return { x: (position.ankleX - 192) * scale, y: (position.ankleY - ground) * scale, planted: gait < 0.1 || step.planted };
    });
  }
  return { root, pose };
}
