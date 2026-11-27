// Host-owned presentation adapter for the approved Stage 1 projects.
import { STAGE1_PROJECTS, STAGE1_MANIFEST } from './stage1-rig-data.js';
import { getPartTransforms, getAnchor, getClip } from './stage1-rig-core.js';
import { createAnimationPlayer } from './stage1-animation-player.js';
const families = ['cinder', 'forestScout'];
const entryFor = family => STAGE1_MANIFEST.characters[family];
const textureKey = (family, i) => 'stage1-skeletal-' + family + '-' + i;
export function stage1Eligible(battle, reducedMotion = false) {
  return !reducedMotion && !battle?.deployment && battle?.stageId === STAGE1_MANIFEST.stageId &&
    battle.basicAttackLesson === true && battle.player?.length === 1 && battle.enemies?.length === 1 &&
    battle.player[0].heroDefId === entryFor('cinder').heroDefId &&
    battle.enemies[0].name === entryFor('forestScout').enemyName;
}
export function preloadStage1Rigs(scene) {
  for (const family of families) STAGE1_PROJECTS[family].art.forEach((part, i) => {
    const key = textureKey(family, i);
    if (!scene.textures.exists(key)) scene.load.image(key, part.src);
  });
}
export function stage1TexturesReady(scene) {
  return families.every(family => STAGE1_PROJECTS[family].art.every((_, i) => scene.textures.exists(textureKey(family, i))));
}
export function createStage1Rig(scene, family, facing, offsetY = 35) {
  const project = STAGE1_PROJECTS[family], entry = entryFor(family);
  if (!project || !entry || !stage1TexturesReady(scene)) return null;
  const scale = entry.scale, mirror = facing === entry.nativeFacing ? 1 : -1;
  const body = scene.add.container(0, offsetY);
  try {
    const visual = scene.add.container(-entry.groundAnchor.x * scale * mirror, -entry.groundAnchor.y * scale)
      .setScale(scale * mirror, scale);
    body.add(visual);
    const parts = project.art.map((part,i) => {
      const image = scene.add.image(0, 0, textureKey(family, i))
        .setOrigin(part.px / 100, part.py / 100)
        .setDisplaySize(part.width, part.height ?? part.width * part.ih / part.iw);
      visual.add(image);
      return image;
    });
    const player = createAnimationPlayer({project,manifestEntry:entry});
    let lastPose = player.getPose();
    function applyPose(pose) {
      lastPose = pose;
      getPartTransforms(project, pose).forEach((tr,i) => parts[i].setPosition(tr.x,tr.y).setRotation(tr.angle*Math.PI/180));
    }
    function anchor(name) {
      const p = getAnchor(project,lastPose,entry.anchors[name]);
      return {x:body.x + (p.x-entry.groundAnchor.x)*scale*mirror,y:body.y + (p.y-entry.groundAnchor.y)*scale};
    }
    function play(state,options) { applyPose(player.play(state,options)); }
    function update(dt) { applyPose(player.update(dt)); }
    function move(distance,dt) { applyPose(player.advanceByDistance(distance,dt)); }
    function duration(state) { return getClip(project,entry.states[state].clip).durationFrames*1000/project.fps; }
    applyPose(lastPose);
    return {body,project,entry,player,applyPose,anchor,play,update,move,duration};
  } catch (error) {
    body.destroy();
    throw error;
  }
}
