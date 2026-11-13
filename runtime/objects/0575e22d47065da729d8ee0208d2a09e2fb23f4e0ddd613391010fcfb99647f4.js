const SIZE = 384;
const GROUND = { x: 192, y: 351 };
const PART_FILES = {
  backArm: 'back_arm',
  legs: 'legs',
  torso: 'torso',
  head: 'head',
  frontArm: 'front_arm',
};

export const DEFAULT_JOINTS = Object.freeze({
  legs: GROUND,
  torso: { x: 192, y: 245 },
  head: { x: 192, y: 150 },
  backArm: { x: 165, y: 175 },
  frontArm: { x: 215, y: 175 },
});

const textureKey = (charKey, part) => `${charKey}_${part}`;

export function preloadCharacterRig(scene, charKey, basePath) {
  for (const part of Object.values(PART_FILES)) {
    scene.load.image(textureKey(charKey, part), `${basePath}/${part}.webp`);
  }
}

export function createCharacterRig(scene, { charKey, x = 192, y = 351,
  scale = 1, flipX = false, joints = DEFAULT_JOINTS, reducedMotion = false }) {
  if (!Object.values(PART_FILES).every(part => scene.textures.exists(textureKey(charKey, part)))) {
    return null;
  }

  const root = scene.add.container(x, y).setScale(flipX ? -scale : scale, scale);
  const waist = joints.torso;
  const upperBody = scene.add.container(waist.x - GROUND.x, waist.y - GROUND.y);
  function image(part, parentOrigin) {
    const joint = joints[part];
    return scene.add.image(joint.x - parentOrigin.x, joint.y - parentOrigin.y,
      textureKey(charKey, PART_FILES[part])).setOrigin(joint.x / SIZE, joint.y / SIZE);
  }
  const legs = image('legs', GROUND);
  const torso = image('torso', waist);
  const head = image('head', waist);
  const backArm = image('backArm', waist);
  const frontArm = image('frontArm', waist);
  root.add([legs, upperBody]);
  upperBody.add([backArm, torso, head, frontArm]);
  const articulated = [upperBody, head, backArm, frontArm];

  function stop() {
    scene.tweens.killTweensOf(articulated);
  }

  function resetPose() {
    stop();
    articulated.forEach(part => part.setAngle(0));
  }

  function startIdle() {
    resetPose();
    if (reducedMotion) return;
    [1.2, -2, -3, 4].forEach((angle, index) => {
      scene.tweens.add({ targets: articulated[index], angle,
        duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
  }

  function tweenPose(angles, duration) {
    stop();
    if (reducedMotion) return;
    articulated.forEach((part, index) => {
      scene.tweens.add({ targets: part, angle: angles[index],
        duration, ease: 'Sine.inOut' });
    });
  }

  return { root, resetPose, startIdle, tweenPose };
}
