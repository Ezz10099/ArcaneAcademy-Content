import { getBattlefieldArt, LOCATION_ENEMY_ART, locationEnemyArtUrl } from './location-battle-art.js';
import { getBattleBacklineSlots, getBattleFrontlineSlots, PRESENTATION_CONFIG } from '../game/data.js';
import { createMeleeRun, prepareMeleeRunTextures, runTravelProgress, sampleRunBody } from './vfx/MeleeRun.js';
import { createCharacterRig, preloadCharacterRig, DEFAULT_JOINTS } from './vfx/CharacterRig.js';
import { cinderLocomotionEnabled, createCinderLocomotion, preloadCinderLocomotion } from './vfx/CinderLocomotion.js';

const PHASER_VERSION = '4.2.1';
const PHASER_SCRIPT_ID = 'arcane-phaser-runtime';
const PHASER_LOCAL_URL = `./src/vendor/phaser-${PHASER_VERSION}.min.js`;
const PHASER_CDN_URL = `https://cdn.jsdelivr.net/npm/phaser@${PHASER_VERSION}/dist/phaser.min.js`;
const PHASER_INTEGRITY = 'sha384-kyUQ5+cxc6+X89xEG6DhcXLcDU9T3Z+o/45VdT6pgAwtG6gxtAzYTEn0Wwj/BKZd';
export const BATTLEFIELD_WIDTH = 726;
export const BATTLEFIELD_HEIGHT = 560;
const BATTLEFIELD_CENTER_X = BATTLEFIELD_WIDTH / 2;
const PRODUCTION_ASSET_BASE = './final-assets/battle';
const EFFECT_SHEETS = Object.freeze({
  heal: 'heal-restorative',
  buff: 'buff-gold',
  debuff: 'debuff-violet',
  stun: 'stun-spark',
});
const effectTexture = (name) => `arcane-fx-${EFFECT_SHEETS[name]}`;
const effectUrl = (name) => `${PRODUCTION_ASSET_BASE}/effects/${EFFECT_SHEETS[name]}.webp`;
const PROJECTILE_ART = Object.freeze(['frost-arrow', 'spell-bolt', 'healing-blossom']);
const projectileTexture = (name) => `arcane-projectile-${name}`;
const projectileUrl = (name) => `${PRODUCTION_ASSET_BASE}/effects/${name}.webp`;
const CINDER_RIG_KEY = 'arcane-cinder-rig';
const CINDER_JOINTS = {
  ...DEFAULT_JOINTS,
  torso: { x: 192, y: 159 },
  head: { x: 195, y: 77 },
  backArm: { x: 165, y: 99 },
  frontArm: { x: 231, y: 101 },
};
const STANDEE_SCALE = 0.44;
const COMBATANT_SIZE_MULTIPLIER = 1.3;
const STANDEE_ORIGIN_Y = 351 / 384;
export const STANDEE_CONTACT_OFFSET_Y = 35;
const MAX_TRANSIENT_EFFECTS = 26;
const MELEE_REACH = 86;
const MELEE_STOP_DISTANCE = 72;
const BATTLE_RUN_SPEED = 128 * 0.82;
const RANGED_ATTACK_REACH = new Map([
  ['eloris', 350],
  ['neris', 350],
  ['yssa', 400],
  ['pyreth', 375],
  ['lumen', 355],
  ['sera', 335],
  ['lanternMoth', 310],
]);
const DEFAULT_RANGED_REACH = 345;
const locationEnemyByStem = new Map(Object.values(LOCATION_ENEMY_ART).map((art) => [art.stem, art]));
for (const art of locationEnemyByStem.values()) {
  if (art.ranged) RANGED_ATTACK_REACH.set(art.stem, DEFAULT_RANGED_REACH);
}
const FRAME_SAMPLE_LIMIT = 360;
const CINDER_MOTION_PROFILE = Object.freeze({
  idle: Object.freeze({ rise: 4, scaleX: 1.018, scaleY: 0.982, duration: 980 }),
  attack: Object.freeze({ windupMs: 115, extensionMs: 75, holdMs: 110, recoverMs: 125 }),
  skill: Object.freeze({ windupMs: 95, holdMs: 360, recoverMs: 150 }),
  ultimate: Object.freeze({ windupMs: 150, driveMs: 145, holdMs: 430, recoverMs: 190 }),
});
const BOSS_NAME = 'Gatewood Warden';
const BACK_SLOT_Y = Object.freeze([65, 235, 420]);
function battlePresentation() {
  return PRESENTATION_CONFIG.battle;
}
function battleMotionMultiplier(playbackSpeed) {
  return clamp(playbackSpeed || 1, 0.5, 2.25);
}

function combatPresentation() {
  return PRESENTATION_CONFIG.combat;
}
function liveBackSlotY() {
  const config = combatPresentation();
  return [config.backTopY, config.backMiddleY, config.backBottomY];
}
export const BATTLE_SPATIAL_EVENT = Object.freeze({
  START: 'start',
  ATTACK: 'attack',
  RECOVER: 'recover',
});
const PRODUCTION_TEXTURES = Object.freeze({
  eloris: Object.freeze({ idle: 'arcane-eloris-idle' }),
  neris: Object.freeze({ idle: 'arcane-neris-idle' }),
  tavian: Object.freeze({ idle: 'arcane-tavian-idle' }),
  background: 'arcane-battle-forest-gate',
  yssa: Object.freeze(Object.fromEntries(['idle', 'move', 'attack', 'hit', 'skill', 'ultimate', 'defeat'].map(state => [state, `arcane-yssa-${state}`]))),
  lumen: Object.freeze(Object.fromEntries(['idle', 'move', 'attack', 'hit', 'skill', 'ultimate', 'defeat'].map(state => [state, `arcane-lumen-${state}`]))),
  kael: Object.freeze(Object.fromEntries(['idle', 'move', 'attack', 'hit', 'skill', 'ultimate', 'defeat'].map(state => [state, `arcane-kael-${state}`]))),
  pyreth: Object.freeze(Object.fromEntries(['idle', 'move', 'attack', 'hit', 'skill', 'ultimate', 'defeat'].map(state => [state, `arcane-pyreth-${state}`]))),
  sera: Object.freeze(Object.fromEntries(['idle', 'move', 'attack', 'hit', 'skill', 'ultimate', 'defeat'].map(state => [state, `arcane-sera-${state}`]))),
  gorr: Object.freeze(Object.fromEntries(['idle', 'move', 'attack', 'hit', 'skill', 'ultimate', 'defeat'].map(state => [state, `arcane-gorr-${state}`]))),
  dusk: Object.freeze(Object.fromEntries(['idle', 'move', 'attack', 'hit', 'skill', 'ultimate', 'defeat'].map(state => [state, `arcane-dusk-${state}`]))),
  cinder: Object.freeze({
    idle: 'arcane-cinder-idle',
    move: 'arcane-cinder-move',
    attack: 'arcane-cinder-attack',
    hit: 'arcane-cinder-hit',
    skill: 'arcane-cinder-skill',
    ultimate: 'arcane-cinder-ultimate',
    defeat: 'arcane-cinder-defeat',
  }),
  forestScout: Object.freeze({
    idle: 'arcane-forest-scout-idle',
    move: 'arcane-forest-scout-move',
    attack: 'arcane-forest-scout-attack',
    hit: 'arcane-forest-scout-hit',
    skill: 'arcane-forest-scout-skill',
    ultimate: 'arcane-forest-scout-ultimate',
    defeat: 'arcane-forest-scout-defeat',
  }),
  briarGuard: Object.freeze({
    idle: 'arcane-briar-guard-idle',
    move: 'arcane-briar-guard-move',
    attack: 'arcane-briar-guard-attack',
    hit: 'arcane-briar-guard-hit',
    skill: 'arcane-briar-guard-skill',
    ultimate: 'arcane-briar-guard-ultimate',
    defeat: 'arcane-briar-guard-defeat',
  }),
  lanternMoth: Object.freeze({
    idle: 'arcane-lantern-moth-idle',
    move: 'arcane-lantern-moth-move',
    attack: 'arcane-lantern-moth-attack',
    hit: 'arcane-lantern-moth-hit',
    skill: 'arcane-lantern-moth-skill',
    ultimate: 'arcane-lantern-moth-ultimate',
    defeat: 'arcane-lantern-moth-defeat',
  }),
  gatewoodWarden: Object.freeze({
    idle: 'arcane-gatewood-warden-idle',
    move: 'arcane-gatewood-warden-move',
    attack: 'arcane-gatewood-warden-attack',
    hit: 'arcane-gatewood-warden-hit',
    skill: 'arcane-gatewood-warden-skill',
    ultimate: 'arcane-gatewood-warden-ultimate',
    defeat: 'arcane-gatewood-warden-defeat',
  }),
});
// Idle alpha top rows (threshold24), measured from the retained 384px exports.
// HUDs sit above the head rather than extending below feet into the next slot.
const FAMILY_IDLE_TOP_ROW = Object.freeze({
  eloris: 44,
  neris: 66,
  tavian: 66,
  cinder: 29, yssa: 12, lumen: 12, kael: 52, pyreth: 51, sera: 51,
  gorr: 52, dusk: 79, forestScout: 37, briarGuard: 23, lanternMoth: 23, gatewoodWarden: 46,
  ...Object.fromEntries([...locationEnemyByStem.values()].map(({ stem, height }) => [stem, 352 - height])),
});
// Cap ranged silhouettes below the 299px idle height of the front-line guards.
const MAX_RANGED_IDLE_HEIGHT = 290;
// Visible sole contacts in the 384px idle exports. Shoes and roots do not
// always reach the nominal y=351 registration line, or land on the same row.
const IDLE_SOLES = Object.freeze({
  cinder: [[115, 325], [270, 344]],
  cinderRig: [[115, 329], [270, 348]],
  yssa: [[146, 343], [239, 339]],
  lumen: [[174, 349], [302, 347]],
  kael: [[108, 351], [263, 349]],
  pyreth: [[116, 350], [254, 349]],
  sera: [[175, 348], [234, 350]],
  gorr: [[122, 350], [246, 347]],
  dusk: [[122, 350], [254, 341]],
  forestScout: [[107, 341], [269, 351]],
  briarGuard: [[116, 335], [272, 350]],
  gatewoodWarden: [[148, 338], [223, 346]],
});

// The remaining grounded poses are registered within one pixel of row 351.
const ACTION_SOLE_ROWS = Object.freeze({
  cinder: { move: 347, attack: 347, hit: 347, skill: 347, ultimate: 347, defeat: 347 },
  yssa: { move: 344, attack: 337, hit: 349, skill: 349, ultimate: 347, defeat: 325 },
  lumen: { move: 343, attack: 337, hit: 342, skill: 341, ultimate: 347, defeat: 336 },
  gatewoodWarden: { move: 331, attack: 347, hit: 347, skill: 344, ultimate: 347, defeat: 347 },
});

const COMBAT_NAME = Object.freeze({
  hero_archmage_eloris: 'Eloris',
  hero_neris_rimeweave: 'Neris',
  hero_tavian_emberstep: 'Tavian',
  hero_cinder_vale: 'Cinder', hero_yssa_driftborn: 'Yssa', hero_lumen_solis: 'Lumen',
  hero_frost_warden_kael: 'Kael', hero_pyreth_the_branded: 'Pyreth',
  hero_sera_ashveil: 'Sera', hero_stone_sentinel_gorr: 'Gorr', hero_dusk: 'Dusk',
});
export function getBattleUnitHeadY(unit, placement) {
  const family = productionTextureFamily(unit);
  if (!family) return null;
  const scale = standeeScale(unit, placement.deployment) * placement.depthScale;
  return STANDEE_CONTACT_OFFSET_Y - (351 - FAMILY_IDLE_TOP_ROW[family]) * scale;
}

export function resolveUnitHudLayout(unit, placement) {
  const headY = getBattleUnitHeadY(unit, placement)
    ?? -55 * placement.depthScale * combatPresentation().characterScale / STANDEE_SCALE;
  return { top: Math.floor(headY - 28), width: 88, height: 28,
    name: unit.side === 'player' ? COMBAT_NAME[unit.heroDefId] || unit.name : unit.isBoss ? 'Gatewood' : unit.name };
}

const FAMILY_ASSET_PATHS = Object.freeze({
  eloris: Object.freeze({ directory: 'characters/archmage-eloris', stem: 'archmage-eloris', facing: 'right', extension: 'webp' }),
  neris: Object.freeze({ directory: 'characters/neris-rimeweave', stem: 'neris-rimeweave', facing: 'right', extension: 'webp' }),
  tavian: Object.freeze({ directory: 'characters/tavian-emberstep', stem: 'tavian-emberstep', facing: 'right', extension: 'webp' }),
  kael: Object.freeze({ directory: 'characters/frost-warden-kael', stem: 'frost-warden-kael', facing: 'right', extension: 'webp' }),
  pyreth: Object.freeze({ directory: 'characters/pyreth-the-branded', stem: 'pyreth-the-branded', facing: 'right', extension: 'webp' }),
  sera: Object.freeze({ directory: 'characters/sera-ashveil', stem: 'sera-ashveil', facing: 'right', extension: 'webp' }),
  gorr: Object.freeze({ directory: 'characters/stone-sentinel-gorr', stem: 'stone-sentinel-gorr', facing: 'right', extension: 'webp' }),
  dusk: Object.freeze({ directory: 'characters/dusk', stem: 'dusk', facing: 'right', extension: 'webp' }),
  yssa: Object.freeze({ directory: 'characters/yssa-driftborn', stem: 'yssa-driftborn', facing: 'right', extension: 'webp' }),
  lumen: Object.freeze({ directory: 'characters/lumen-solis', stem: 'lumen-solis', facing: 'right', extension: 'webp' }),
  cinder: Object.freeze({ directory: 'characters/cinder-vale', stem: 'cinder-vale', facing: 'right' }),
  forestScout: Object.freeze({ directory: 'enemies/forest-scout', stem: 'forest-scout', facing: 'left' }),
  briarGuard: Object.freeze({ directory: 'enemies/briar-guard', stem: 'briar-guard', facing: 'left' }),
  lanternMoth: Object.freeze({ directory: 'enemies/lantern-moth', stem: 'lantern-moth', facing: 'left' }),
  gatewoodWarden: Object.freeze({ directory: 'enemies/gatewood-warden', stem: 'gatewood-warden', facing: 'left' }),
});
const ENEMY_VARIANT_TINTS = Object.freeze({
  'Rime Scout': 0x88caff,
  'Ember Moth': 0xffa064,
});

function productionAssetUrl(family, state) {
  if (locationEnemyByStem.has(family)) return state === 'idle' ? locationEnemyArtUrl(family) : null;
  const asset = FAMILY_ASSET_PATHS[family];
  return asset ? `${PRODUCTION_ASSET_BASE}/${asset.directory}/${asset.stem}-${state}-${asset.facing}.${asset.extension || 'png'}` : null;
}

function textureMapForFamily(family) {
  if (locationEnemyByStem.has(family)) return { idle: `arcane-${family}-idle` };
  return PRODUCTION_TEXTURES[family] || null;
}

function productionTextureFamily(unit) {
  if (unit?.side === 'player' && unit.heroDefId === 'hero_archmage_eloris') return 'eloris';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_neris_rimeweave') return 'neris';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_tavian_emberstep') return 'tavian';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_frost_warden_kael') return 'kael';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_pyreth_the_branded') return 'pyreth';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_sera_ashveil') return 'sera';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_stone_sentinel_gorr') return 'gorr';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_dusk') return 'dusk';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_yssa_driftborn') return 'yssa';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_lumen_solis') return 'lumen';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_cinder_vale') return 'cinder';
  if (unit?.side === 'enemy' && unit.name === 'Forest Scout') return 'forestScout';
  if (unit?.side === 'enemy' && unit.name === 'Rime Scout') return 'forestScout';
  if (unit?.side === 'enemy' && unit.name === 'Briar Guard') return 'briarGuard';
  if (unit?.side === 'enemy' && unit.name === 'Lantern Moth') return 'lanternMoth';
  if (unit?.side === 'enemy' && unit.name === 'Ember Moth') return 'lanternMoth';
  if (unit?.side === 'enemy' && unit.name === 'Gatewood Warden') return 'gatewoodWarden';
  if (unit?.side === 'enemy') return LOCATION_ENEMY_ART[unit.name]?.stem || null;
  return null;
}

// Face centers as percentages of the source pose, for the compact card crop.
const BATTLE_CARD_POSES = Object.freeze({
  eloris: ['idle', 55, 22],
  neris: ['idle', 49, 23],
  tavian: ['idle', 55, 23],
  cinder: ['idle', 52, 17],
  dusk: ['idle', 55, 28],
  gorr: ['idle', 53, 22],
  kael: ['attack', 60, 30],
  lumen: ['skill', 57, 17],
  pyreth: ['skill', 46, 24],
  sera: ['skill', 53, 26],
  yssa: ['attack', 53, 23],
});

// Match the canvas standee’s scale and foot anchor in the DOM view.
export function getBattleIdleArt(unit, placement, unitScale) {
  const src = productionAssetUrl(productionTextureFamily(unit), 'idle');
  if (!src) return null;
  const scale = standeeScale(unit, placement.deployment) * placement.depthScale / unitScale;
  return { src, size: 384 * scale, ground: STANDEE_CONTACT_OFFSET_Y / unitScale, origin: STANDEE_ORIGIN_Y };
}

function standeeScale(unit, deploying) {
  const baseScale = deploying
    ? (unit.isBoss ? 0.47 : STANDEE_SCALE)
    : (unit.isBoss ? combatPresentation().bossScale : combatPresentation().characterScale);
  const family = productionTextureFamily(unit);
  const silhouetteScale = RANGED_ATTACK_REACH.has(family)
    ? Math.min(1, MAX_RANGED_IDLE_HEIGHT / (351 - FAMILY_IDLE_TOP_ROW[family]))
    : 1;
  return baseScale * COMBATANT_SIZE_MULTIPLIER * silhouetteScale;
}

export function getBattleCardPortrait(trainee) {
  const family = productionTextureFamily(trainee);
  const pose = BATTLE_CARD_POSES[family];
  if (!pose) return null;
  const [state, x, y] = pose;
  return { src: productionAssetUrl(family, state), x, y, name: COMBAT_NAME[trainee.heroDefId] || trainee.name };
}

const PRODUCTION_ASSET_URLS = Object.freeze([
  `${PRODUCTION_ASSET_BASE}/backgrounds/forest-gate-battlefield.jpg`,
  ...Object.keys(EFFECT_SHEETS).map(effectUrl),
  ...PROJECTILE_ART.map(projectileUrl),
  ...Object.keys(PRODUCTION_TEXTURES.cinder).map(
    (state) => `${PRODUCTION_ASSET_BASE}/characters/cinder-vale/cinder-vale-${state}-right.png`
  ),
  ...Object.keys(PRODUCTION_TEXTURES.forestScout).map(
    (state) => `${PRODUCTION_ASSET_BASE}/enemies/forest-scout/forest-scout-${state}-left.png`
  ),
]);
const BATTLE_ASSET_URLS = PRODUCTION_ASSET_URLS;

let phaserLoadPromise = null;
let battlePreloadPromise = null;
const preloadedImages = new Map();
const imagePreloadPromises = new Map();
let initialBattleSceneCreated = false;
const battleLoadTrace = [];
const traceOrigin = globalThis.performance?.now?.() ?? Date.now();
let runtimeBattleDiagnostics = {
  state: 'idle',
  stageId: null,
  reducedMotion: false,
  boss: null,
  unitCount: 0,
  activeEffects: 0,
  peakEffects: 0,
  frameMetrics: null,
  frameRateLimit: 60,
  positioning: null,
};

function traceBattleLoad(event, data = {}) {
  const now = globalThis.performance?.now?.() ?? Date.now();
  battleLoadTrace.push({
    t: Math.round((now - traceOrigin) * 10) / 10,
    event,
    ...data,
  });
  if (battleLoadTrace.length > 64) battleLoadTrace.splice(0, battleLoadTrace.length - 64);
}

function getBattleLoadDiagnostics() {
  return {
    phaserVersion: PHASER_VERSION,
    assetCount: BATTLE_ASSET_URLS.length,
    prewarmedAssetCount: imagePreloadPromises.size,
    events: battleLoadTrace.map((entry) => ({ ...entry })),
    runtime: {
      ...runtimeBattleDiagnostics,
      frameMetrics: runtimeBattleDiagnostics.frameMetrics ? { ...runtimeBattleDiagnostics.frameMetrics } : null,
    },
  };
}

globalThis.__battleLoadDiag = getBattleLoadDiagnostics;

function preloadImage(url) {
  if (typeof globalThis.Image !== 'function' || !globalThis.document?.baseURI) {
    return Promise.resolve({ url, state: 'unsupported' });
  }
  if (imagePreloadPromises.has(url)) return imagePreloadPromises.get(url);
  const resolvedUrl = new URL(url, document.baseURI).href;
  traceBattleLoad('asset-preload-start', { url });
  const promise = new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = async (state) => {
      if (settled) return;
      settled = true;
      if (state === 'loaded' && typeof image.decode === 'function') {
        try {
          await image.decode();
        } catch {
          state = 'decode-failed';
        }
      }
      if (state === 'loaded' && !initialBattleSceneCreated) preloadedImages.set(url, image);
      traceBattleLoad('asset-preload-end', {
        url,
        state,
        width: image.naturalWidth || 0,
        height: image.naturalHeight || 0,
      });
      resolve({ url, state });
    };
    image.decoding = 'async';
    image.addEventListener('load', () => void finish('loaded'), { once: true });
    image.addEventListener('error', () => void finish('error'), { once: true });
    image.src = resolvedUrl;
    if (image.complete) void finish(image.naturalWidth ? 'loaded' : 'error');
  });
  imagePreloadPromises.set(url, promise);
  return promise;
}

function encounterAssetUrls(battle) {
  const families = new Set();
  [...(battle?.player || []), ...(battle?.enemies || [])].forEach((unit) => {
    const family = productionTextureFamily(unit);
    if (family) families.add(family);
  });
  const background = getBattlefieldArt(battle?.stageId);
  return [...(background ? [background.src] : []), ...[...families].flatMap((family) => Object.keys(textureMapForFamily(family) || {})
    .map((state) => productionAssetUrl(family, state))
    .filter(Boolean))];
}

function preloadEncounterResources(battle) {
  const urls = encounterAssetUrls(battle);
  traceBattleLoad('encounter-prewarm-start', { stageId: battle?.stageId || null, assetCount: urls.length });
  return Promise.allSettled(urls.map(preloadImage)).then((results) => {
    const failures = results.filter(
      (result) => result.status === 'rejected' || result.value?.state !== 'loaded'
    ).length;
    traceBattleLoad('encounter-prewarm-end', { stageId: battle?.stageId || null, assetCount: urls.length, failures });
    return { ok: failures === 0, assetCount: urls.length, failures };
  });
}

function preloadBattleResources() {
  if (battlePreloadPromise) return battlePreloadPromise;
  traceBattleLoad('prewarm-start', { assetCount: BATTLE_ASSET_URLS.length });
  battlePreloadPromise = Promise.allSettled([
    ensurePhaser(),
    ...BATTLE_ASSET_URLS.map(preloadImage),
  ]).then((results) => {
    const rejected = results.filter((result) => result.status === 'rejected').length;
    const assetFailures = results.slice(1).filter(
      (result) => result.status === 'rejected' || result.value?.state !== 'loaded'
    ).length;
    traceBattleLoad('prewarm-end', { rejected, assetFailures });
    return { ok: rejected === 0 && assetFailures === 0, rejected, assetFailures };
  });
  return battlePreloadPromise;
}

function ensurePhaser() {
  if (globalThis.Phaser?.VERSION === PHASER_VERSION) {
    traceBattleLoad('phaser-ready', { source: 'existing' });
    return Promise.resolve(globalThis.Phaser);
  }
  if (globalThis.Phaser) {
    return Promise.reject(new Error(`Expected Phaser ${PHASER_VERSION}, received ${globalThis.Phaser.VERSION || 'unknown'}.`));
  }
  if (phaserLoadPromise) return phaserLoadPromise;

  phaserLoadPromise = new Promise((resolve, reject) => {
    const sources = [
      { source: 'local', url: PHASER_LOCAL_URL },
      { source: 'cdn-fallback', url: PHASER_CDN_URL },
    ];
    document.getElementById(PHASER_SCRIPT_ID)?.remove();

    const attempt = (index) => {
      const candidate = sources[index];
      if (!candidate) {
        reject(new Error('Phaser runtime failed to load from local and fallback sources.'));
        return;
      }
      traceBattleLoad('phaser-load-start', candidate);
      const script = document.createElement('script');
      script.id = PHASER_SCRIPT_ID;
      script.src = candidate.url;
      script.integrity = PHASER_INTEGRITY;
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.addEventListener('load', () => {
        if (globalThis.Phaser?.VERSION === PHASER_VERSION) {
          traceBattleLoad('phaser-ready', { source: candidate.source });
          resolve(globalThis.Phaser);
          return;
        }
        reject(new Error(`Phaser ${PHASER_VERSION} did not initialize.`));
      }, { once: true });
      script.addEventListener('error', () => {
        traceBattleLoad('phaser-source-error', candidate);
        script.remove();
        attempt(index + 1);
      }, { once: true });
      document.head.appendChild(script);
    };

    attempt(0);
  }).catch((error) => {
    traceBattleLoad('phaser-load-error', { message: error?.message || String(error) });
    document.getElementById(PHASER_SCRIPT_ID)?.remove();
    phaserLoadPromise = null;
    throw error;
  });

  return phaserLoadPromise;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percentile(sortedValues, ratio) {
  if (!sortedValues.length) return 0;
  return sortedValues[Math.min(sortedValues.length - 1, Math.floor((sortedValues.length - 1) * ratio))];
}

function frameMetrics(samples) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const averageFrameMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const p90FrameMs = percentile(sorted, 0.9);
  const p99FrameMs = percentile(sorted, 0.99);
  return {
    sampleCount: samples.length,
    averageFps: Math.round((1000 / Math.max(1, averageFrameMs)) * 10) / 10,
    averageFrameMs: Math.round(averageFrameMs * 10) / 10,
    p90FrameMs: Math.round(p90FrameMs * 10) / 10,
    p99FrameMs: Math.round(p99FrameMs * 10) / 10,
    framesOver34Ms: samples.filter((value) => value > 34).length,
    framesOver50Ms: samples.filter((value) => value > 50).length,
    framesOver100Ms: samples.filter((value) => value > 100).length,
  };
}

function registerTransient(targetScene, gameObject) {
  if (!targetScene || !gameObject) return gameObject;
  targetScene.transientEffects = (targetScene.transientEffects || []).filter((effect) => effect?.active);
  const transientLimit = combatPresentation().maxTransientEffects || MAX_TRANSIENT_EFFECTS;
  while (targetScene.transientEffects.length >= transientLimit) {
    const oldest = targetScene.transientEffects.shift();
    if (oldest) {
      targetScene.tweens?.killTweensOf(oldest);
      oldest.destroy();
    }
  }
  targetScene.transientEffects.push(gameObject);
  targetScene.peakTransientEffects = Math.max(
    targetScene.peakTransientEffects || 0,
    targetScene.transientEffects.length
  );
  runtimeBattleDiagnostics.activeEffects = targetScene.transientEffects.length;
  runtimeBattleDiagnostics.peakEffects = targetScene.peakTransientEffects;
  return gameObject;
}

function statusLabels(unit) {
  const labels = [];
  if ((unit?.barrier || 0) > 0) labels.push('WARD');
  if ((unit?.guardActions || 0) > 0) labels.push('GUARD');
  if ((unit?.burnActions || 0) > 0) labels.push('BURN');
  if ((unit?.chillActions || 0) > 0) labels.push('CHILL');
  if ((unit?.stunActions || 0) > 0) labels.push('STUN');
  return labels;
}

export function schedulePresentationCall(targetScene, delay, callback) {
  targetScene.pendingPresentationCalls = (targetScene.pendingPresentationCalls || 0) + 1;
  return targetScene.time.delayedCall(delay, () => {
    try { callback(); }
    finally { targetScene.pendingPresentationCalls -= 1; }
  });
}

export function buildEventSchedule(events, reducedMotion, playbackSpeed = 1) {
  const schedule = [];
  const speed = clamp(Number(playbackSpeed) || 1, 0.6, 7.2);
  let cursor = 0;
  let previousAction = null;
  events.forEach((event, index) => {
    const action = `${event.turn}:${event.actorId || 'system'}`;
    if (index > 0 && action !== previousAction) cursor += (reducedMotion ? 16 : 92) / speed;
    schedule.push({ event, delay: cursor });
    const eventBeat = event.type === 'ultimate'
      ? reducedMotion ? 48 : 265
      : event.type === 'skill'
        ? reducedMotion ? 38 : 185
        : event.type === 'damage'
          ? reducedMotion ? 24 : 100
          : event.type === 'heal' || event.type === 'barrier'
            ? reducedMotion ? 24 : 92
            : reducedMotion ? 20 : 74;
    cursor += eventBeat / speed;
    previousAction = action;
  });
  return schedule;
}

export function resolveCombatFloatPresentation({
  kind = 'damage',
  amount = 0,
  maxHp = 1,
  actionKind = 'basic',
  isBoss = false,
} = {}) {
  const ratio = Math.max(0, Number(amount) || 0) / Math.max(1, Number(maxHp) || 1);
  const actionBoost = actionKind === 'ultimate' ? 2 : actionKind === 'skill' ? 1 : 0;
  const magnitudeBoost = ratio >= 0.24 ? 2 : ratio >= 0.12 ? 1 : 0;
  const floatScale = combatPresentation().floatScale;
  const scaled = (profile) => ({
    ...profile,
    fontSize: Math.round(profile.fontSize * floatScale * 10) / 10,
    rise: Math.round(profile.rise * floatScale * 10) / 10,
  });
  if (kind === 'ability') return scaled({ fontSize: actionKind === 'ultimate' ? 13 : 12, rise: 18, duration: 520, startScale: 0.92 });
  if (kind === 'status') return scaled({ fontSize: 11, rise: 18, duration: 430, startScale: 0.94 });
  if (kind === 'barrier') return scaled({ fontSize: 14, rise: 26, duration: 520, startScale: 0.86 });
  if (kind === 'heal') return scaled({ fontSize: 16 + magnitudeBoost, rise: 30, duration: 560, startScale: 0.84 });
  return scaled({
    fontSize: 17 + Math.min(3, magnitudeBoost + actionBoost) + (isBoss ? 1 : 0),
    rise: 32 + actionBoost * 3,
    duration: 540 + actionBoost * 45,
    startScale: actionKind === 'ultimate' ? 0.76 : 0.82,
  });
}

function eventKey(event) {
  if (event.eventId != null) return `event:${event.eventId}`;
  return [
    event.turn,
    event.type,
    event.actorId,
    event.targetId,
    event.amount,
    event.abilityName,
    event.targetHp,
  ].join(':');
}

function unitRole(heroClass) {
  if (heroClass === 'GUARDIAN') return 'guardian';
  if (heroClass === 'MYSTIC') return 'mystic';
  if (heroClass === 'STRIKER') return 'striker';
  if (heroClass === 'TANK' || heroClass === 'WARRIOR') return 'guardian';
  if (heroClass === 'MAGE' || heroClass === 'HEALER') return 'mystic';
  return 'striker';
}

function perspectiveScale(y, deployment = false) {
  const backSlots = deployment ? BACK_SLOT_Y : liveBackSlotY();
  const progress = clamp((y - backSlots[0]) / (backSlots[2] - backSlots[0]), 0, 1);
  return Math.round((0.955 + progress * 0.09) * 1000) / 1000;
}

function copyPosition(position) {
  return { x: position.x, y: position.y };
}

function battleDistance(origin, target) {
  return Math.hypot(origin.x - target.x, origin.y - target.y);
}

export function resolveMeleeApproach(origin, target, side, occupied) {
  if (Math.hypot(origin.x - target.x, origin.y - target.y) <= MELEE_REACH) return null;
  const direction = side === 'enemy' ? 1 : -1;
  const preferredFlank = origin.y < target.y ? -1 : 1;
  const points = [0, preferredFlank * 54, -preferredFlank * 54].map((offset) => ({
    x: clamp(target.x + direction * Math.sqrt(MELEE_STOP_DISTANCE ** 2 - offset ** 2), 48, BATTLEFIELD_WIDTH - 48),
    y: clamp(target.y + offset, liveBackSlotY()[0], liveBackSlotY()[2]),
  }));
  const available = points.filter((point) => occupied.every((other) =>
    Math.hypot(point.x - other.x, point.y - other.y) >= 45));
  const candidates = available.length ? available : points;
  return candidates.reduce((nearest, point) =>
    Math.hypot(origin.x - point.x, origin.y - point.y) < Math.hypot(origin.x - nearest.x, origin.y - nearest.y)
      ? point : nearest);
}

export function resolveRangedApproach(origin, target, reach, occupied, side = origin.x < BATTLEFIELD_CENTER_X ? 'player' : 'enemy') {
  if (battleDistance(origin, target) <= reach) return null;
  const bearing = Math.atan2(origin.y - target.y, origin.x - target.x);
  const firingDistance = reach - 8;
  const rearX = BATTLEFIELD_CENTER_X + (side === 'enemy' ? 40 : -40);
  const behindMidfield = (point) => side === 'enemy' ? point.x >= rearX : point.x <= rearX;
  const points = [0, 0.36, -0.36, 0.64, -0.64].map((offset) => ({
    x: clamp(target.x + Math.cos(bearing + offset) * firingDistance, 48, BATTLEFIELD_WIDTH - 48),
    y: clamp(target.y + Math.sin(bearing + offset) * firingDistance, liveBackSlotY()[0], liveBackSlotY()[2]),
  }));
  const verticalReach = Math.sqrt(Math.max(0, firingDistance ** 2 - (target.x - rearX) ** 2));
  points.push({ x: rearX, y: clamp(origin.y, target.y - verticalReach, target.y + verticalReach) });
  const rearPoints = points.filter((point) => behindMidfield(point) && battleDistance(point, target) <= reach);
  const candidates = rearPoints.length ? rearPoints : points.slice(0, -1);
  return candidates.find((point) => occupied.every((ally) => battleDistance(point, ally) >= 45)) || candidates[0];
}

function openingMidpoint(unit, opponent, laneY) {
  const gap = battleDistance(unit.position, opponent.position);
  const fraction = gap > MELEE_REACH ? (gap - MELEE_STOP_DISTANCE) / (2 * gap) : 0;
  return {
    x: unit.position.x + (opponent.position.x - unit.position.x) * fraction,
    y: fraction && laneY != null ? laneY : unit.position.y + (opponent.position.y - unit.position.y) * fraction,
  };
}

// Mutual melee targets meet halfway. Other fighters follow their own target.
export function planOpeningEngagement(units) {
  const melee = units.filter((unit) => unit.isMelee);
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const positions = new Map();
  for (const ally of melee.filter((unit) => unit.side === 'player')) {
    const enemy = byId.get(ally.targetId);
    if (!enemy?.isMelee || enemy.targetId !== ally.id) continue;
    // Follow the player's formation lanes so crossed pairs don't stack at midfield.
    const laneY = ally.position.y * 0.75 + enemy.position.y * 0.25;
    positions.set(ally.id, openingMidpoint(ally, enemy, laneY));
    positions.set(enemy.id, openingMidpoint(enemy, ally, laneY));
  }
  const pending = melee.filter((unit) => !positions.has(unit.id));
  while (pending.length) {
    const ready = pending.findIndex((unit) => !byId.get(unit.targetId)?.isMelee || positions.has(unit.targetId));
    const [unit] = pending.splice(Math.max(0, ready), 1);
    const opponent = byId.get(unit.targetId);
    if (ready < 0) {
      // A pursuit loop has no stationary target. Anchor one fighter halfway toward its own target.
      positions.set(unit.id, openingMidpoint(unit, opponent));
      continue;
    }
    const target = opponent && (positions.get(opponent.id) || opponent.position);
    const occupied = units.filter((other) => other.side === unit.side && other !== unit)
      .map((other) => positions.get(other.id) || other.position);
    positions.set(unit.id, target
      ? resolveMeleeApproach(unit.position, target, unit.side, occupied) || unit.position
      : unit.position);
  }
  return positions;
}

export function createBattleSpatialState(placement) {
  const formationPosition = placement.formationPosition || {
    x: placement.formationX,
    y: placement.formationY,
  };
  const combatPosition = placement.combatPosition || {
    x: placement.combatX,
    y: placement.combatY,
  };
  return {
    phase: 'formation',
    action: 'idle',
    isMelee: Boolean(placement.isMelee),
    formationPosition: copyPosition(formationPosition),
    combatPosition: copyPosition(combatPosition),
    persistentPosition: copyPosition(formationPosition),
  };
}

export function transitionBattleSpatialState(state, event) {
  const phase = event === BATTLE_SPATIAL_EVENT.START ? 'combat' : state.phase;
  const action = event === BATTLE_SPATIAL_EVENT.ATTACK
    ? 'attack'
    : event === BATTLE_SPATIAL_EVENT.RECOVER
      ? 'idle'
      : state.action;
  const persistentPosition = event === BATTLE_SPATIAL_EVENT.START
    ? state.isMelee ? state.combatPosition : state.formationPosition
    : state.persistentPosition;
  return {
    ...state,
    phase,
    action,
    persistentPosition: copyPosition(persistentPosition),
  };
}

// The courtyard marks, formation preview and battle spawn share these anchors.
export const DEPLOYMENT_TILE_WIDTH = 118;
export const DEPLOYMENT_TILE_HEIGHT = 106;
export const DEPLOYMENT_SLOTS = Object.freeze(['BACK', 'MIDDLE', 'FRONT']
  .flatMap((row, column) => Array.from({ length: 3 }, (_, index) => Object.freeze({
    row, index,
    x: 63 + column * DEPLOYMENT_TILE_WIDTH,
    y: 244 + index * DEPLOYMENT_TILE_HEIGHT,
  }))));

const BATTLE_ENTRANCE_MARGIN = 200;

export function planBattleEntrance(battle, speed = 1) {
  const motionSpeed = battleMotionMultiplier(clamp((Number(speed) || 1) * combatPresentation().motionSpeed, 0.6, 7.2));
  const millisecondsPerUnit = 1000 / (BATTLE_RUN_SPEED * motionSpeed);
  return ['player', 'enemy'].flatMap((side) => {
    const placements = resolveBattleFormation(side === 'player' ? battle.player : battle.enemies, side);
    if (!placements.length) return [];
    const direction = side === 'player' ? 1 : -1;
    const edgeX = side === 'player' ? -BATTLE_ENTRANCE_MARGIN : BATTLEFIELD_WIDTH + BATTLE_ENTRANCE_MARGIN;
    const firstRank = Math.max(...placements.map(({ formationX }) => direction * formationX));
    return placements.map(({ unit, formationPosition: destination }) => ({
      id: unit.id,
      origin: { x: edgeX, y: destination.y },
      destination,
      delay: (firstRank - direction * destination.x) * millisecondsPerUnit,
      duration: Math.abs(destination.x - edgeX) * millisecondsPerUnit,
    }));
  });
}

export function resolveDeploymentFormation(units = [], side = 'player') {
  return resolveBattleFormation(units, side).map((placement) => ({
    ...placement,
    depthScale: perspectiveScale(placement.formationY, true) * 0.72,
    deployment: true,
  }));
}

export function resolveBattleFormation(units = [], side = 'player') {
  const resolvedSide = side === 'enemy' ? 'enemy' : 'player';
  const isEnemy = resolvedSide === 'enemy';
  const indexed = units.slice(0, 5).map((unit, sourceIndex) => ({
    unit,
    sourceIndex,
    gameplayRow: unit?.row === 'BACK' ? 'BACK' : 'FRONT',
    role: unitRole(unit?.heroClass),
  }));
  const front = getBattleFrontlineSlots(units, resolvedSide);
  const isMiddle = (unit) => resolvedSide === 'player' && unit?.formationColumn === 'MIDDLE';
  const back = indexed.filter((entry) => entry.gameplayRow === 'BACK' && !isMiddle(entry.unit));
  const placements = new Map();

  const assign = (entry, slotKind, slotIndex) => {
    const family = productionTextureFamily(entry.unit);
    const isMelee = family ? !RANGED_ATTACK_REACH.has(family) : entry.gameplayRow === 'FRONT';
    const slot = DEPLOYMENT_SLOTS.find(({ row, index }) => row.toLowerCase() === slotKind && index === slotIndex);
    const y = slot.y;
    const formationX = isEnemy ? BATTLEFIELD_WIDTH - slot.x : slot.x;
    const formationPosition = Object.freeze({ x: formationX, y });
    // The DOM fallback uses a fixed approach line. Phaser follows each fighter's target.
    const combatX = isMelee
      ? BATTLEFIELD_CENTER_X + (isEnemy ? 1 : -1) * MELEE_STOP_DISTANCE / 2
      : formationX;
    const combatPosition = Object.freeze({ x: combatX, y });
    const depthScale = perspectiveScale(y);
    placements.set(entry.sourceIndex, {
      unit: entry.unit,
      side: resolvedSide,
      role: entry.role,
      gameplayRow: entry.gameplayRow,
      isMelee,
      attackReach: isMelee ? MELEE_REACH : RANGED_ATTACK_REACH.get(family) ?? DEFAULT_RANGED_REACH,
      slotKind,
      slotIndex,
      slotId: `${resolvedSide}-${slotKind}-${slotIndex + 1}`,
      formationPosition,
      combatPosition,
      formationX: formationPosition.x,
      formationY: formationPosition.y,
      combatX: combatPosition.x,
      combatY: combatPosition.y,
      groundY: y + STANDEE_CONTACT_OFFSET_Y,
      depthScale,
    });
  };

  front.filter((entry) => entry.slotIndex != null).forEach(({ sourceIndex, slotIndex }) => {
    assign(indexed[sourceIndex], 'front', slotIndex);
  });

  const usedBack = new Set();
  getBattleBacklineSlots(units.slice(0, 5).filter((unit) => !isMiddle(unit))).forEach(({ unit, slotIndex }) => {
    usedBack.add(slotIndex);
    assign(back.find((entry) => entry.unit === unit), 'back', slotIndex);
  });
  indexed.filter(({ unit }) => isMiddle(unit)).forEach((entry) => {
    assign(entry, 'middle', entry.unit.formationSlot);
  });

  const freeBackIndexes = [0, 1, 2].filter((index) => !usedBack.has(index));
  front.filter((entry) => entry.slotIndex == null).forEach(({ sourceIndex }) => {
    const slotIndex = freeBackIndexes.shift();
    if (slotIndex != null) assign(indexed[sourceIndex], 'back', slotIndex);
  });

  const usedFrontIndexes = new Set(
    [...placements.values()].filter((placement) => placement.slotKind === 'front').map((placement) => placement.slotIndex)
  );
  const freeFrontIndexes = [0, 1, 2].filter((index) => !usedFrontIndexes.has(index));
  back.slice(3).forEach((entry) => {
    const slotIndex = freeFrontIndexes.shift();
    if (slotIndex != null) assign(entry, 'front', slotIndex);
  });

  return indexed.map((entry) => placements.get(entry.sourceIndex)).filter(Boolean);
}

function affinityColor(affinity, side) {
  const colors = {
    FIRE: 0xf07858,
    ICE: 0x72c9ff,
    EARTH: 0x66c78a,
    SHADOW: 0xb983ff,
    LIGHT: 0xf3d98b,
    ARCANE: 0x70e6ef,
    FROST: 0x72c9ff,
    FLAME: 0xf07858,
  };
  return colors[affinity] || (side === 'enemy' ? 0xe56a9b : 0x70e6ef);
}

function setRendererState(host, state) {
  if (!host) return;
  host.dataset.rendererState = state;
  const panel = host.closest('.phaser-battle-panel');
  panel?.classList.toggle('renderer-loading', state === 'loading');
  panel?.classList.toggle('renderer-ready', state === 'ready');
  panel?.classList.toggle('renderer-fallback', state === 'fallback');
  const fallback = panel?.querySelector('[data-battle-fallback]');
  if (fallback) fallback.hidden = state !== 'fallback';
  const status = panel?.querySelector('[data-battle-renderer-status]');
  if (status) status.textContent = state === 'loading' ? 'Preparing battlefield…' : '';
}

export function createPhaserBattleRenderer() {
  let game = null;
  let scene = null;
  let host = null;
  let pendingBattle = null;
  let pendingPresentation = null;
  let generation = 0;
  let settleMount = null;
  let frameRateLimit = 60;
  const processedEvents = new Set();
  let lastProcessedEventId = 0;

  function completeMount(state, error = null) {
    traceBattleLoad('mount-end', { state, error: error?.message || null });
    if (!settleMount) return;
    settleMount({ state, error });
    settleMount = null;
  }

  function drawBattlefield(targetScene, presentation, battle) {
    const centerX = BATTLEFIELD_CENTER_X;
    const background = getBattlefieldArt(battle?.stageId);
    const productionBackgroundReady = background && targetScene.textures.exists(PRODUCTION_TEXTURES.background);
    if (productionBackgroundReady || (background && (battle?.deployment || battlePresentation().backgroundCover))) {
      if (!battlePresentation().backgroundCover && !battle?.deployment) {
        const backgroundWidth = Math.max(BATTLEFIELD_WIDTH, 700 * 960 / 1096);
        const backgroundHeight = backgroundWidth * 1096 / 960;
        targetScene.add.image(centerX, BATTLEFIELD_HEIGHT + 10 - backgroundHeight / 2, PRODUCTION_TEXTURES.background)
          .setDisplaySize(backgroundWidth, backgroundHeight);
        targetScene.add.rectangle(centerX, BATTLEFIELD_HEIGHT / 2, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT, 0x02070d, 0.12);
        targetScene.add.ellipse(centerX, 515, 560, 180, 0x02070d, 0.28);
      }

    } else {
      targetScene.add.rectangle(centerX, BATTLEFIELD_HEIGHT / 2, BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT, 0x061522);
      targetScene.add.ellipse(centerX, 255, 610, 530, 0x123c50, 0.42);
      targetScene.add.ellipse(centerX, 315, 430, 340, 0x321b52, 0.28);
      targetScene.add.ellipse(centerX, 500, 560, 170, 0x02070d, 0.74);

      const path = targetScene.add.graphics();
      path.lineStyle(2, 0xd7b76f, 0.12);
      for (let y = 110; y <= 530; y += 98) path.lineBetween(26, y, BATTLEFIELD_WIDTH - 26, y - 22);
      path.lineStyle(1, 0x70e6ef, 0.1);
      path.lineBetween(centerX, 54, centerX, 540);
    }
  }

  function productionTextureMap(unit) {
    return textureMapForFamily(productionTextureFamily(unit));
  }

  function drawProductionStandee(targetScene, unit, depthScale = 1) {
    const textureMap = productionTextureMap(unit);
    if (!textureMap || !targetScene.textures.exists(textureMap.idle)) return null;
    const family = productionTextureFamily(unit);
    const body = targetScene.add.image(0, STANDEE_CONTACT_OFFSET_Y, textureMap.idle)
      .setOrigin(0.5, STANDEE_ORIGIN_Y)
      .setScale(standeeScale(unit, pendingBattle?.deployment) * depthScale);
    if (family !== 'cinder' || targetScene.reducedMotion || pendingBattle?.deployment) return { body, textureMap, family };
    const rig = createCharacterRig(targetScene, {
      charKey: CINDER_RIG_KEY, x: 0, y: 0, joints: CINDER_JOINTS,
    });
    if (!rig) return { body, textureMap, family };
    const scale = body.scaleX;
    body.setPosition(0, 0).setScale(1).setVisible(false);
    const wrapper = targetScene.add.container(0, STANDEE_CONTACT_OFFSET_Y, [body, rig.root])
      .setScale(scale);
    return { body: wrapper, standee: body, rig, textureMap, family };
  }

  function syncGroundContact(view) {
    const { body, shadow, contacts, soles, soleRow } = view;
    const planted = view.state === 'idle' && !view.defeated && soles;
    // Keep the shadow on the floor as the fighter steps or a flying enemy rises.
    const lift = Math.max(0, view.runRise ?? (view.bodyBaseY - body.y));
    const shadowAlpha = view.defeated ? 0.12 : view.shadowAlpha / (1 + lift / 12);
    if (shadow.x !== body.x) shadow.x = body.x;
    if (shadow.alpha !== shadowAlpha) shadow.setAlpha(shadowAlpha);
    if (!soles) return;
    const contactsVisible = Boolean(planted);
    if (!view.runFeet && !contactsVisible && contacts.every(({ soft }) => !soft.visible)) return;
    contacts.forEach(({ soft, core }, index) => {
      if (view.runFeet) {
        const foot = view.runFeet[index];
        soft.setVisible(foot.planted).setPosition(foot.x, STANDEE_CONTACT_OFFSET_Y + foot.y + 4);
        core.setVisible(foot.planted).setPosition(foot.x, STANDEE_CONTACT_OFFSET_Y + foot.y + 4);
        return;
      }
      const [x, y] = soles[index];
      const footX = body.x + (x - 192) * body.scaleX;
      const footY = STANDEE_CONTACT_OFFSET_Y + (y - soleRow) * body.scaleY;
      if (soft.visible !== contactsVisible) {
        soft.setVisible(contactsVisible);
        core.setVisible(contactsVisible);
      }
      if (contactsVisible && (soft.x !== footX || soft.y !== footY)) {
        soft.setPosition(footX, footY);
        core.setPosition(footX, footY);
      }
    });
  }

  function setStandeeTexture(targetScene, view, state) {
    const artState = state === 'run' ? 'move' : state;
    const textureKey = view.textureMap?.[artState] || view.textureMap?.idle;
    if (view.rig) {
      const useStandee = state !== 'idle';
      view.rig.root.setVisible(!useStandee);
      view.standee.setVisible(useStandee);
      if (useStandee) view.rig.resetPose();
    }
    if (textureKey && targetScene.textures.exists(textureKey)) {
      const image = view.standee || view.body;
      const soleRow = state === 'idle' && view.soles && !view.rig
        ? view.soleRow : ACTION_SOLE_ROWS[view.family]?.[artState] ?? 351;
      image.setTexture(textureKey).setOrigin(0.5, soleRow / 384);
    }
    if (view.rig) {
      // The idle rig uses the registered legs layer, whose sole is at y=348.
      view.rig.root.y = 351 - view.soleRow;
    }
    if (state !== 'run' && view.runRig?.root.visible) {
      view.runRig.root.setVisible(false);
      view.body.setVisible(true).setAlpha(1);
      view.runFeet = null;
      view.runRise = null;
    }
    view.state = state;
    syncGroundContact(view);
  }

  function resetBodyTransform(targetScene, view) {
    targetScene.tweens.killTweensOf(view.body);
    view.rig?.resetPose();
    view.body.setPosition(view.bodyBaseX, view.bodyBaseY);
    view.body.setScale(view.bodyScaleX, view.bodyScaleY);
    view.body.setAlpha(1).setAngle(0);
    const standee = view.standee || view.body;
    if (view.variantTint) standee.setTint?.(view.variantTint);
    else standee.clearTint?.();
  }

  function startIdleMotion(targetScene, view) {
    if (!view || view.defeated) return;
    resetBodyTransform(targetScene, view);
    setStandeeTexture(targetScene, view, 'idle');
    if (view.rig) {
      view.rig.startIdle();
      return;
    }
    if (targetScene.reducedMotion || !view.textureMap) return;
    const cinder = view.family === 'cinder' ? CINDER_MOTION_PROFILE.idle : null;
    targetScene.tweens.add({
      targets: view.body,
      // Grounded families breathe around their registered foot pivot.
      y: view.family === 'lanternMoth' ? view.bodyBaseY - 1.5 : view.bodyBaseY,
      scaleX: view.bodyScaleX * (cinder?.scaleX ?? 1.012),
      scaleY: view.bodyScaleY * (cinder?.scaleY ?? 0.988),
      duration: cinder?.duration ?? (1500 + (view.baseY % 4) * 80),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  function addGroundEllipse(targetScene, x, y, width, height, color, fillAlpha) {
    const key = 'battle-ground-ellipses';
    const frameSize = 128;
    const diameter = frameSize - 4;
    if (!targetScene.textures.exists(key)) {
      const opacities = [0.1, 0.17, 0.24, 0.3, 0.32, 0.64];
      const canvas = document.createElement('canvas');
      canvas.width = frameSize * 3;
      canvas.height = frameSize * 2;
      const context = canvas.getContext('2d');
      if (!context) return targetScene.add.ellipse(x, y, width, height, color, fillAlpha);
      context.fillStyle = '#fff';
      for (const [index, opacity] of opacities.entries()) {
        const left = index % 3 * frameSize;
        const top = Math.floor(index / 3) * frameSize;
        context.globalAlpha = opacity;
        context.beginPath();
        context.arc(left + frameSize / 2, top + frameSize / 2, diameter / 2, 0, Math.PI * 2);
        context.fill();
      }
      const texture = targetScene.textures.addCanvas(key, canvas);
      for (const [index, opacity] of opacities.entries()) {
        texture.add(String(opacity), 0, index % 3 * frameSize, Math.floor(index / 3) * frameSize, frameSize, frameSize);
      }
    }
    return targetScene.add.image(x, y, key, String(fillAlpha))
      .setDisplaySize(width * frameSize / diameter, height * frameSize / diameter)
      .setTint(color);
  }

  function createUnitView(targetScene, unit, placement) {
    const side = unit.side === 'enemy' ? 'enemy' : 'player';
    const accent = affinityColor(unit.affinity, side);
    const isBoss = Boolean(unit.isBoss || unit.name === BOSS_NAME);
    const role = placement.role || unitRole(unit.heroClass);
    const depthScale = placement.depthScale || 1;
    const family = productionTextureFamily(unit);
    const spatialState = createBattleSpatialState(placement);
    const barWidth = isBoss ? 76 : 64;
    const barHalf = barWidth / 2;
    const container = targetScene.add.container(
      spatialState.persistentPosition.x,
      spatialState.persistentPosition.y
    );
    const aura = addGroundEllipse(targetScene, 0, 35, isBoss ? 96 : 82, isBoss ? 25 : 21, accent, isBoss ? 0.17 : 0.1);
    const bossAura = targetScene.add.ellipse(0, 35, 110, 31, 0x000000, 0)
      .setStrokeStyle(2, 0xa98cff, isBoss ? 0.44 : 0)
      .setVisible(isBoss);
    const bossPresence = targetScene.add.graphics().setPosition(0, -8).setVisible(isBoss);
    if (isBoss) {
      bossPresence.lineStyle(2, 0x70e6ef, 0.2);
      bossPresence.strokeCircle(0, 0, 49);
      bossPresence.lineStyle(2, 0xa98cff, 0.22);
      bossPresence.lineBetween(-38, -34, -48, -45);
      bossPresence.lineBetween(38, -34, 48, -45);
      bossPresence.lineBetween(-44, 27, -54, 34);
      bossPresence.lineBetween(44, 27, 54, 34);
    }
    const deploying = Boolean(pendingBattle?.deployment);
    const art = drawProductionStandee(targetScene, unit, depthScale);
    const body = art?.body ?? targetScene.add.container(0, STANDEE_CONTACT_OFFSET_Y);
    const soles = IDLE_SOLES[art?.rig ? 'cinderRig' : art?.family];
    const shadowWidth = soles ? Math.abs(soles[1][0] - soles[0][0]) * body.scaleX + 18 * depthScale
      : (isBoss ? 78 : 52) * depthScale;
    const shadowAlpha = soles ? 0.24 : 0.3;
    const shadow = addGroundEllipse(targetScene, 0, STANDEE_CONTACT_OFFSET_Y,
      shadowWidth, (isBoss ? 12 : 9) * depthScale, 0x030609, shadowAlpha);
    const contacts = (soles || []).map(() => ({
      soft: addGroundEllipse(targetScene, 0, 0, 24 * depthScale, 9 * depthScale, 0x020407, 0.32),
      core: addGroundEllipse(targetScene, 0, 0, 15 * depthScale, 4 * depthScale, 0x010205, 0.64),
    }));
    const hud = resolveUnitHudLayout(unit, placement);
    const hudBack = targetScene.add.rectangle(0, hud.top + 14, hud.width + 6, hud.height + 4, 0x02070d, 0.7);
    const statusX = side === 'enemy' ? 44 : -44;
    const hpBack = targetScene.add.rectangle(-barHalf - 2, hud.top + 17, barWidth + 4, 8, 0x02070d, 0.97)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0xf3e4bd, 0.46);
    const hpFill = targetScene.add.rectangle(-barHalf, hud.top + 17, barWidth, 5, side === 'enemy' ? 0xe05c86 : 0x68d99e, 1).setOrigin(0, 0.5);
    const barrierBack = targetScene.add.rectangle(-barHalf - 1, hud.top + 22, barWidth + 2, 3, 0x02070d, 0)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x70e6ef, 0.46);
    const barrierFill = targetScene.add.rectangle(-barHalf, hud.top + 22, barWidth, 2, 0x70e6ef, 0).setOrigin(0, 0.5);
    const energyBack = targetScene.add.rectangle(-barHalf - 1, hud.top + 27, barWidth + 2, 3, 0x02070d, 0.94)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, accent, 0.28);
    const energyFill = targetScene.add.rectangle(-barHalf, hud.top + 27, barWidth, 2, accent, 1).setOrigin(0, 0.5);
    const lowHealthMark = targetScene.add.star(barHalf + 7, hud.top + 17, 4, 2, 5, 0xffc46b, 1)
      .setStrokeStyle(1, 0x02070d, 0.9)
      .setVisible(false);
    const ultimateReadyMark = targetScene.add.star(barHalf + 7, hud.top + 27, 4, 2, 5, 0xf0dfba, 1)
      .setStrokeStyle(1, accent, 0.96)
      .setVisible(false);
    const name = targetScene.add.text(0, hud.top, hud.name, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#e8e0d2',
      stroke: '#02070d',
      strokeThickness: 3,
      align: 'center',
    }).setFixedSize(hud.width, 0).setOrigin(0.5, 0);
    const statusBack = targetScene.add.rectangle(statusX, 20, 40, 16, 0x02070d, 0.9)
      .setStrokeStyle(1, 0x70e6ef, 0.42)
      .setVisible(false);
    const statusText = targetScene.add.text(statusX, 12, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#e8e0d2',
      stroke: '#02070d',
      strokeThickness: 2,
      align: 'center',
      letterSpacing: 0.4,
      lineSpacing: -1,
    }).setFixedSize(38, 0).setOrigin(0.5, 0).setVisible(false);

    container.add([
      bossPresence,
      bossAura,
      aura,
      shadow,
      ...contacts.flatMap(({ soft, core }) => [soft, core]),
      body,
      hudBack,
      hpBack,
      hpFill,
      barrierBack,
      barrierFill,
      energyBack,
      energyFill,
      lowHealthMark,
      ultimateReadyMark,
      name,
      statusBack,
      statusText,
    ]);
    if (deploying) {
      container.list.forEach((child) => child.setVisible(Boolean(art) && (child === body || child === shadow)));
      if (unit.deploymentBadge) {
        const headY = art ? getBattleUnitHeadY(unit, placement) : body.y - 55;
        const badgeY = Math.floor(headY - 6);
        const badge = targetScene.add.text(unit.deploymentBadge.offsetX ?? 0, badgeY, art ? unit.deploymentBadge.text : `${unit.name} · ${unit.deploymentBadge.text}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: side === 'enemy' ? '#e5b9bd' : '#c2d8d8',
          backgroundColor: '#081923',
          padding: { left: 6, right: 6, top: 1, bottom: 1 },
          resolution: 2,
        }).setOrigin(0.5, 1);
        container.add(badge);
      }
    }
    container.setDepth(100 + placement.groundY);
    const view = {
      container,
      body,
      aura,
      bossAura,
      bossPresence,
      shadow,
      shadowAlpha,
      contacts,
      soles,
      soleRow: soles ? Math.max(soles[0][1], soles[1][1]) : 351,
      hpBack,
      hpFill,
      barrierBack,
      barrierFill,
      energyBack,
      energyFill,
      lowHealthMark,
      ultimateReadyMark,
      name,
      statusBack,
      statusText,
      side,
      role,
      accent,
      isBoss,
      isMelee: placement.isMelee,
      attackReach: placement.attackReach,
      slotId: placement.slotId,
      spatialState,
      standee: art?.standee,
      rig: art?.rig,
      textureMap: art?.textureMap || null,
      family: art?.family || 'placeholder',
      variantTint: side === 'enemy' ? ENEMY_VARIANT_TINTS[unit.name] : undefined,
      baseX: placement.formationX,
      baseY: placement.formationY,
      formationX: placement.formationX,
      formationY: placement.formationY,
      combatX: placement.combatX,
      combatY: placement.combatY,
      groundY: placement.groundY,
      depthScale,
      hudTop: hud.top,
      hudBack,
      maxHp: Math.max(1, unit.maxHp || 1),
      bodyBaseX: body.x,
      bodyBaseY: body.y,
      bodyScaleX: body.scaleX,
      bodyScaleY: body.scaleY,
      actionLockUntil: 0,
      motionToken: 0,
      pendingDefeat: unit.hp <= 0,
      defeated: false,
      engaged: false,
    };
    if (!view.defeated) startIdleMotion(targetScene, view);
    return view;
  }

  function createBossHud(targetScene, battle) {
    const boss = battle?.enemies?.find((unit) => unit.isBoss || unit.name === BOSS_NAME);
    if (!boss) return;
    const frame = targetScene.add.rectangle(0, 0, 286, 44, 0x02070d, 0.9)
      .setStrokeStyle(1, 0xd7b76f, 0.78);
    const badgeBack = targetScene.add.rectangle(-112, -12, 43, 15, 0x54253a, 0.96)
      .setStrokeStyle(1, 0xf0b24b, 0.76);
    const badge = targetScene.add.text(-112, -12, 'BOSS', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#efddbb',
      letterSpacing: 0.8,
    }).setOrigin(0.5);
    const title = targetScene.add.text(-3, -12, boss.name.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#e5d3b4',
      stroke: '#02070d',
      strokeThickness: 3,
      letterSpacing: 0.8,
    }).setOrigin(0.5);
    const hpValue = targetScene.add.text(116, -12, '100%', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#e8e0d2',
      stroke: '#02070d',
      strokeThickness: 2,
    }).setOrigin(0.5);
    const hpBack = targetScene.add.rectangle(-124, 7, 248, 9, 0x081019, 0.98)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0xf3e4bd, 0.38);
    const hpFill = targetScene.add.rectangle(-123, 7, 246, 6, 0xe05c86, 1).setOrigin(0, 0.5);
    const barrierBack = targetScene.add.rectangle(-123, 15, 246, 4, 0x081019, 0)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x70e6ef, 0.42);
    const barrierFill = targetScene.add.rectangle(-122, 15, 244, 2, 0x70e6ef, 0).setOrigin(0, 0.5);
    const leftRune = targetScene.add.star(-135, 0, 4, 3, 7, 0x70e6ef, 0.9);
    const rightRune = targetScene.add.star(135, 0, 4, 3, 7, 0xa98cff, 0.9);
    const container = targetScene.add.container(BATTLEFIELD_CENTER_X, 54, [
      frame,
      badgeBack,
      badge,
      title,
      hpValue,
      hpBack,
      hpFill,
      barrierBack,
      barrierFill,
      leftRune,
      rightRune,
    ])
      .setDepth(1900);
    targetScene.bossHud = { container, unitId: boss.id, hpFill, hpValue, barrierBack, barrierFill };
  }

  function buildUnitViews(targetScene, battle) {
    targetScene.unitViews = new Map();
    const resolve = battle?.deployment ? resolveDeploymentFormation : resolveBattleFormation;
    resolve(battle?.player || [], 'player').forEach((placement) => {
      targetScene.unitViews.set(placement.unit.id, createUnitView(targetScene, placement.unit, placement));
    });
    resolve(battle?.enemies || [], 'enemy').forEach((placement) => {
      targetScene.unitViews.set(placement.unit.id, createUnitView(targetScene, placement.unit, placement));
    });
    if (!battle?.deployment) createBossHud(targetScene, battle);
  }

  function playFloat(targetScene, view, label, color, kind = 'damage', options = {}) {
    if (!view) return;
    const actionKind = options.actionKind || 'basic';
    const floatPresentation = resolveCombatFloatPresentation({
      kind,
      amount: options.amount || 0,
      maxHp: view.maxHp,
      actionKind,
      isBoss: view.isBoss,
    });
    const isAbility = kind === 'ability';
    const laneOffset = options.eventId == null ? 0 : ((Number(options.eventId) % 3) - 1) * 7;
    const float = registerTransient(targetScene, targetScene.add.text(
      view.container.x + laneOffset,
      view.container.y - (view.isBoss ? 86 : isAbility ? 76 : 62),
      label,
      {
      fontFamily: 'system-ui, sans-serif',
      fontSize: `${floatPresentation.fontSize}px`,
      fontStyle: 'bold',
      color,
      stroke: '#02070d',
      strokeThickness: isAbility || kind === 'status' ? 3 : 4,
      align: 'center',
      wordWrap: isAbility ? { width: 154, useAdvancedWrap: true } : undefined,
      backgroundColor: isAbility ? 'rgba(2, 7, 13, 0.74)' : undefined,
      padding: isAbility ? { x: 6, y: 3 } : undefined,
    }).setOrigin(0.5).setDepth(2200));
    float.setScale(targetScene.reducedMotion ? 1 : floatPresentation.startScale);
    targetScene.tweens.add({
      targets: float,
      y: targetScene.reducedMotion ? float.y : float.y - floatPresentation.rise,
      scale: targetScene.reducedMotion ? 1 : 1.04,
      alpha: 0,
      delay: targetScene.reducedMotion ? 110 : 0,
      duration: targetScene.reducedMotion ? 180 : floatPresentation.duration,
      ease: isAbility ? 'Quad.out' : 'Back.out',
      onComplete: () => float.destroy(),
    });
  }

  function finishUnitAction(targetScene, view, token) {
    if (!view || view.defeated || view.motionToken !== token) return;
    view.spatialState = transitionBattleSpatialState(view.spatialState, BATTLE_SPATIAL_EVENT.RECOVER);
    if (!view.isMelee || view.engaged) settlePersistentUnitPosition(view);
    startIdleMotion(targetScene, view);
  }

  function cinderMotionSpeed(targetScene) {
    return battleMotionMultiplier(targetScene.playbackSpeed);
  }

  function schedulePose(targetScene, view, token, delay, state, transform = null) {
    schedulePresentationCall(targetScene, delay, () => {
      if (!view || view.defeated || view.motionToken !== token) return;
      setStandeeTexture(targetScene, view, state);
      if (!transform) return;
      targetScene.tweens.killTweensOf(view.body);
      targetScene.tweens.add({
        targets: view.body,
        ...transform,
        ease: transform.ease || 'Cubic.out',
      });
    });
  }

  function cinderPunchTiming(targetScene) {
    const { windupMs, extensionMs, holdMs, recoverMs } = CINDER_MOTION_PROFILE.attack;
    const speed = cinderMotionSpeed(targetScene);
    return {
      windup: windupMs / speed,
      extension: extensionMs / speed,
      contact: (windupMs + extensionMs) / speed,
      recovery: (windupMs + extensionMs + holdMs) / speed,
      total: (windupMs + extensionMs + holdMs + recoverMs) / speed,
    };
  }

  function animateCinderAttack(targetScene, view, token, direction) {
    const timing = cinderPunchTiming(targetScene);
    view.actionLockUntil = targetScene.time.now + timing.total;
    setStandeeTexture(targetScene, view, 'idle');
    targetScene.tweens.add({
      targets: view.body,
      x: view.bodyBaseX - direction * 3,
      duration: timing.windup,
      ease: 'Quad.in',
    });
    schedulePose(targetScene, view, token, timing.windup, 'attack', {
      x: view.bodyBaseX + direction * 12,
      duration: timing.extension,
      ease: 'Quad.out',
    });
    schedulePose(targetScene, view, token, timing.recovery, 'idle', {
      x: view.bodyBaseX,
      duration: timing.total - timing.recovery,
      ease: 'Sine.inOut',
    });
    schedulePresentationCall(targetScene, timing.total, () => finishUnitAction(targetScene, view, token));
  }

  function animateCinderAbility(targetScene, view, token, kind) {
    const profile = CINDER_MOTION_PROFILE[kind];
    const speed = cinderMotionSpeed(targetScene);
    const windup = profile.windupMs / speed;
    const hold = profile.holdMs / speed;
    const recover = profile.recoverMs / speed;
    const total = windup + hold + recover;
    const charge = kind === 'ultimate';
    const direction = view.side === 'player' ? 1 : -1;
    view.actionLockUntil = targetScene.time.now + total;
    setStandeeTexture(targetScene, view, 'skill');
    targetScene.tweens.add({
      targets: view.body,
      x: view.bodyBaseX - direction * (charge ? 5 : 2),
      duration: windup,
      ease: 'Quad.out',
    });
    schedulePose(targetScene, view, token, windup, kind, {
      x: view.bodyBaseX + direction * (charge ? 20 : 0),
      duration: charge ? profile.driveMs / speed : windup,
      ease: 'Cubic.out',
    });
    schedulePose(targetScene, view, token, windup + hold, charge ? 'skill' : 'idle', {
      x: view.bodyBaseX,
      duration: recover,
      ease: 'Sine.inOut',
    });
    schedulePresentationCall(targetScene, total, () => finishUnitAction(targetScene, view, token));
  }

  function animateRangedTraineePose(targetScene, view, token, kind) {
    const speed = Math.min(2.25, Math.max(0.5, targetScene.playbackSpeed || 1));
    const reduced = targetScene.reducedMotion;
    const anticipation = reduced ? 0 : (kind === 'ultimate' ? 115 : 95) / speed;
    const hold = reduced ? 185 : (kind === 'ultimate' ? 430 : kind === 'skill' ? 330 : 230) / speed;
    const recovery = reduced ? 0 : 140 / speed;
    const total = anticipation + hold + recovery;
    view.actionLockUntil = targetScene.time.now + total;
    const direction = view.side === 'player' ? 1 : -1;
    setStandeeTexture(targetScene, view, anticipation ? 'move' : kind);
    if (anticipation) {
      targetScene.tweens.add({
        targets: view.body,
        x: view.bodyBaseX - direction * 3,
        y: view.bodyBaseY + 1,
        duration: anticipation,
        ease: 'Sine.in',
      });
      schedulePose(targetScene, view, token, anticipation, kind, {
        x: view.bodyBaseX + direction * (kind === 'attack' ? 6 : 2),
        y: view.bodyBaseY - (kind === 'ultimate' ? 5 : 0),
        duration: Math.min(100, hold),
      });
    }
    if (recovery) schedulePose(targetScene, view, token, anticipation + hold, 'idle', {
      x: view.bodyBaseX,
      y: view.bodyBaseY,
      duration: recovery,
      ease: 'Sine.inOut',
    });
    schedulePresentationCall(targetScene, total, () => finishUnitAction(targetScene, view, token));
  }

  function settlePersistentUnitPosition(view) {
    const position = view.spatialState.persistentPosition;
    view.container.setPosition(position.x, position.y).setDepth(Math.round(position.y + STANDEE_CONTACT_OFFSET_Y));
  }

  function positioningDiagnostics(targetScene) {
    return [...(targetScene.unitViews?.values() || [])].map((view) => ({
      slotId: view.slotId,
      side: view.side,
      role: view.role,
      melee: view.isMelee,
      attackReach: view.attackReach,
      engaged: view.engaged,
      phase: view.spatialState.phase,
      action: view.spatialState.action,
      x: Math.round(view.container.x * 10) / 10,
      y: view.container.y,
      formationPosition: copyPosition(view.spatialState.formationPosition),
      combatPosition: copyPosition(view.spatialState.combatPosition),
      persistentPosition: copyPosition(view.spatialState.persistentPosition),
      formationX: view.formationX,
      combatX: view.combatX,
      groundY: view.groundY,
      depthScale: view.depthScale,
      hudTop: view.container.y + view.hudTop,
      hudWidth: 88,
    }));
  }

  function runApproach(targetScene, view, destination, onReady, entrance = null) {
    const origin = copyPosition(view.container);
    const distance = Math.hypot(destination.x - origin.x, destination.y - origin.y);
    if (!entrance) {
      view.spatialState = { ...view.spatialState, combatPosition: destination, persistentPosition: destination };
      view.engaged = true;
    }
    const run = { waiters: onReady ? [onReady] : [], tween: null };
    view.approachRun = run;

    const finishRun = () => {
      if (view.approachRun !== run) return;
      view.approachRun = null;
      settlePersistentUnitPosition(view);
      startIdleMotion(targetScene, view);
      runtimeBattleDiagnostics.positioning = positioningDiagnostics(targetScene);
      run.waiters.forEach((ready) => ready());
    };
    if (distance < 1 || targetScene.reducedMotion) {
      finishRun();
      return;
    }

    view.motionToken += 1;
    resetBodyTransform(targetScene, view);
    const directionX = (destination.x - origin.x) / distance;
    const directionY = (destination.y - origin.y) / distance;
    if (targetScene.cinderLocomotion && view.family === 'cinder') {
      view.runRig ??= createCinderLocomotion(targetScene, view);
    }
    view.runRig ??= createMeleeRun(targetScene, view);
    const authored = Boolean(view.runRig?.begin);
    if (authored) {
      // Use the current battle idle at both ends of the locomotion blend.
      setStandeeTexture(targetScene, view, 'idle');
      view.state = 'run';
      view.runRig.begin(distance, directionX, directionY);
    } else {
      setStandeeTexture(targetScene, view, 'run');
    }
    if (view.runRig) {
      view.body.setVisible(authored);
      view.runRig.root.setVisible(true);
    }
    const duration = entrance?.duration ?? 1000 * distance / (BATTLE_RUN_SPEED * cinderMotionSpeed(targetScene));
    const travel = { progress: 0 };
    const fadeRange = Math.min(7, distance / 3);
    const applyRun = () => {
      const traveled = distance * (entrance && !authored ? travel.progress : runTravelProgress(travel.progress));
      const x = origin.x + directionX * traveled;
      const y = origin.y + directionY * traveled;
      view.container.setPosition(x, y);
      const depth = Math.round(y + STANDEE_CONTACT_OFFSET_Y);
      if (view.container.depth !== depth) view.container.setDepth(depth);
      if (view.runRig?.root.visible) {
        const { feet, rise } = view.runRig.pose(traveled, distance, directionX, directionY);
        if (authored) {
          const fade = clamp(Math.min(traveled, distance - traveled) / fadeRange, 0, 1);
          view.runRig.root.setAlpha(fade);
          view.body.setAlpha(1 - fade);
          view.runFeet = fade > .5 ? feet : null;
        } else {
          view.runFeet = feet;
        }
        view.runRise = rise;
      } else if (!view.isMelee && view.family !== 'lanternMoth') {
        const stride = clamp(Math.min(traveled, distance - traveled) / 10, 0, 1);
        view.body.y = view.bodyBaseY - sampleRunBody(traveled) * stride;
      }
    };
    applyRun();
    run.tween = targetScene.tweens.add({
      targets: travel, progress: 1, duration, delay: entrance?.delay ?? 0, ease: 'Linear',
      onUpdate: applyRun,
      onComplete: finishRun,
    });
  }

  function playEntrance(speed, onComplete) {
    if (!scene?.unitViews) return false;
    const targetScene = scene;
    const plan = planBattleEntrance(pendingBattle, speed);
    let remaining = plan.length;
    if (!remaining) onComplete();
    for (const entry of plan) {
      const view = targetScene.unitViews.get(entry.id);
      view.container.setPosition(entry.origin.x, entry.origin.y);
      runApproach(targetScene, view, entry.destination, () => {
        remaining -= 1;
        if (!remaining && scene === targetScene) onComplete();
      }, entry);
    }
    return true;
  }

  function startMeleeEngagement(targetScene) {
    if (!targetScene?.unitViews || targetScene.combatStarted) return;
    targetScene.combatStarted = true;
    const assignments = new Map([...pendingBattle.player, ...pendingBattle.enemies]
      .map((unit) => [unit.id, unit.attackTargetId]));
    const units = [...targetScene.unitViews].filter(([, view]) => !view.defeated).map(([id, view]) => {
      const targetId = assignments.get(id);
      view.engagementTarget = targetScene.unitViews.get(targetId);
      return { id, targetId, side: view.side, isMelee: view.isMelee, position: copyPosition(view.container) };
    });
    const destinations = planOpeningEngagement(units);
    targetScene.openingRuns = destinations.size;
    for (const [id, view] of targetScene.unitViews) {
      view.spatialState = transitionBattleSpatialState(view.spatialState, BATTLE_SPATIAL_EVENT.START);
      if (!destinations.has(id)) continue;
      runApproach(targetScene, view, destinations.get(id), () => {
        targetScene.openingRuns -= 1;
      });
    }
    for (const view of targetScene.unitViews.values()) {
      if (view.isMelee || view.defeated) continue;
      approachAttackTarget(targetScene, view, view.engagementTarget);
    }
  }

  function approachAttackTarget(targetScene, view, target, onReady) {
    if (!view || !target || view.defeated || target.defeated) {
      onReady?.();
      return;
    }
    const occupied = [...targetScene.unitViews.values()]
      .filter((ally) => ally !== view && ally.side === view.side && !ally.defeated)
      .map((ally) => ally.spatialState.persistentPosition);
    const planned = target.spatialState.persistentPosition;
    const destination = view.isMelee
      ? resolveMeleeApproach(view.container, planned, view.side, occupied)
      : resolveRangedApproach(view.container, onReady ? target.container : planned, view.attackReach, occupied, view.side);
    if (!destination) onReady?.();
    else {
      // Check the live position again if the target moved during a ranged approach.
      const ready = onReady && !view.isMelee ? () => approachAttackTarget(targetScene, view, target, onReady) : onReady;
      runApproach(targetScene, view, destination, ready);
    }
  }

  function stopApproachRun(view) {
    const run = view.approachRun;
    if (!run) return null;
    view.approachRun = null;
    run.tween?.stop();
    const position = copyPosition(view.container);
    view.spatialState = { ...view.spatialState, combatPosition: position, persistentPosition: position };
    return run;
  }

  function retargetAfterDefeat(targetScene, defeated, retargets = []) {
    // The simulation can already have a result while the last hits are still playing.
    if (targetScene.resultSettled) return;
    defeated.knockoutRetargets = new Map(retargets);
    for (const [id, fighter] of targetScene.unitViews) {
      if (fighter.side === defeated.side || fighter.defeated || fighter.engagementTarget !== defeated) continue;
      // Actor lanes can show a later knockout first. Follow the recorded
      // replacements through any targets that have already fallen on screen.
      let next = targetScene.unitViews.get(defeated.knockoutRetargets.get(id));
      while (next?.defeated) next = targetScene.unitViews.get(next.knockoutRetargets?.get(id));
      fighter.engagementTarget = next;
      if (!next) {
        // Release actions waiting on a run after its final target falls.
        const run = stopApproachRun(fighter);
        if (run) {
          startIdleMotion(targetScene, fighter);
          run.waiters.forEach((ready) => ready());
        }
        continue;
      }
      const advance = () => {
        if (fighter.defeated || fighter.engagementTarget !== next || next.defeated
          || targetScene.resultSettled) return;
        if (targetScene.resultPending) {
          const lane = targetScene.battleEventLanes.get(id);
          const attacksNext = (entry) => entry?.context.actionKind === 'basic' && entry.event.type === 'damage'
            && targetScene.unitViews.get(entry.event.targetId) === next;
          if (!lane || !(attacksNext(lane.current) || lane.events.some(attacksNext))) return;
        }
        const recovery = fighter.actionLockUntil - targetScene.time.now;
        if (recovery > 0 && !targetScene.reducedMotion) {
          schedulePresentationCall(targetScene, recovery, advance);
          return;
        }
        const run = stopApproachRun(fighter);
        if (run) startIdleMotion(targetScene, fighter);
        // Keep recorded actions queued when a running fighter changes course.
        const resume = run?.waiters.length ? () => run.waiters.forEach((ready) => ready()) : undefined;
        approachAttackTarget(targetScene, fighter, next, resume);
      };
      advance();
    }
  }

  function animateAttack(targetScene, view) {
    if (!view || view.defeated || view.actionLockUntil > targetScene.time.now) return;
    view.motionToken += 1;
    const token = view.motionToken;
    const direction = view.side === 'player' ? 1 : -1;
    const speed = Math.max(0.5, targetScene.playbackSpeed || 1);
    view.actionLockUntil = targetScene.time.now + 250 / speed;
    view.spatialState = transitionBattleSpatialState(view.spatialState, BATTLE_SPATIAL_EVENT.ATTACK);
    resetBodyTransform(targetScene, view);
    if (['yssa', 'lumen', 'pyreth', 'sera'].includes(view.family)) {
      animateRangedTraineePose(targetScene, view, token, 'attack');
      return;
    }
    if (view.family === 'cinder' && !targetScene.reducedMotion) {
      animateCinderAttack(targetScene, view, token, direction);
      return;
    }
    if (!view.isMelee) {
      setStandeeTexture(targetScene, view, 'attack');
      if (targetScene.reducedMotion) {
        schedulePresentationCall(targetScene, 90, () => finishUnitAction(targetScene, view, token));
        return;
      }
      const travel = view.role === 'mystic' ? 3 : 6;
      targetScene.tweens.add({
        targets: view.body,
        x: view.bodyBaseX + direction * travel,
        y: view.bodyBaseY - (view.family === 'lanternMoth' ? 2 : 0),
        scaleX: view.bodyScaleX * 1.02,
        scaleY: view.bodyScaleY * 0.99,
        duration: 110 / speed,
        yoyo: true,
        ease: 'Quad.out',
        onComplete: () => finishUnitAction(targetScene, view, token),
      });
      return;
    }
    setStandeeTexture(targetScene, view, 'move');
    if (targetScene.reducedMotion) {
      setStandeeTexture(targetScene, view, 'attack');
      schedulePresentationCall(targetScene, 90, () => finishUnitAction(targetScene, view, token));
      return;
    }
    targetScene.tweens.add({
      targets: view.body,
      scaleX: view.bodyScaleX * 0.98,
      scaleY: view.bodyScaleY * 1.02,
      duration: 75 / speed,
      ease: 'Quad.in',
      onComplete: () => {
        if (view.motionToken !== token) return;
        setStandeeTexture(targetScene, view, 'attack');
        targetScene.tweens.add({
          targets: view.body,
          scaleX: view.bodyScaleX * 1.04,
          scaleY: view.bodyScaleY * 0.98,
          duration: 95 / speed,
          yoyo: true,
          ease: 'Cubic.out',
          onComplete: () => finishUnitAction(targetScene, view, token),
        });
      },
    });
  }

  function animateSkill(targetScene, view) {
    if (!view || view.defeated) return;
    view.motionToken += 1;
    const token = view.motionToken;
    const speed = Math.max(0.5, targetScene.playbackSpeed || 1);
    view.actionLockUntil = targetScene.time.now + 320 / speed;
    resetBodyTransform(targetScene, view);
    if (['yssa', 'lumen', 'pyreth', 'sera'].includes(view.family)) {
      animateRangedTraineePose(targetScene, view, token, 'skill');
      return;
    }
    if (view.family === 'cinder' && !targetScene.reducedMotion) {
      animateCinderAbility(targetScene, view, token, 'skill');
      return;
    }
    setStandeeTexture(targetScene, view, 'skill');
    targetScene.tweens.add({
      targets: view.body,
      y: view.bodyBaseY - 2,
      scaleX: view.bodyScaleX * 1.04,
      scaleY: view.bodyScaleY * 1.025,
      duration: targetScene.reducedMotion ? 82 : 165 / speed,
      yoyo: true,
      ease: 'Sine.inOut',
      onComplete: () => finishUnitAction(targetScene, view, token),
    });
  }

  function animateUltimate(targetScene, view) {
    if (!view || view.defeated) return;
    view.motionToken += 1;
    const token = view.motionToken;
    const speed = Math.max(0.5, targetScene.playbackSpeed || 1);
    view.actionLockUntil = targetScene.time.now + 620 / speed;
    resetBodyTransform(targetScene, view);
    if (['yssa', 'lumen', 'pyreth', 'sera'].includes(view.family)) {
      animateRangedTraineePose(targetScene, view, token, 'ultimate');
      return;
    }
    if (view.family === 'cinder' && !targetScene.reducedMotion) {
      animateCinderAbility(targetScene, view, token, 'ultimate');
      return;
    }
    setStandeeTexture(targetScene, view, 'ultimate');
    targetScene.tweens.add({
      targets: view.body,
      y: view.bodyBaseY - 4,
      scaleX: view.bodyScaleX * 1.06,
      scaleY: view.bodyScaleY * 1.045,
      duration: targetScene.reducedMotion ? 96 : 260 / speed,
      yoyo: true,
      ease: 'Cubic.out',
      onComplete: () => finishUnitAction(targetScene, view, token),
    });
  }

  function animateDefeat(targetScene, view) {
    if (!view || view.defeated) return;
    view.motionToken += 1;
    view.defeated = true;
    view.pendingDefeat = false;
    const run = stopApproachRun(view);
    resetBodyTransform(targetScene, view);
    setStandeeTexture(targetScene, view, 'defeat');
    view.aura.setAlpha(0.025);
    view.bossPresence.setAlpha(view.isBoss ? 0.06 : 0);
    view.hpBack.setAlpha(0.28);
    view.hpFill.setAlpha(0.2);
    view.barrierBack.setAlpha(0.1);
    view.barrierFill.setAlpha(0.08);
    view.energyBack.setAlpha(0.2);
    view.energyFill.setAlpha(0.16);
    view.statusBack.setVisible(false);
    view.statusText.setVisible(false);
    view.name.setAlpha(0.42);
    view.hudBack.setAlpha(0.3);
    view.container.setAlpha(0.76);
    targetScene.tweens.add({
      targets: view.body,
      y: view.bodyBaseY + (view.textureMap ? 3 : 10),
      angle: view.textureMap ? 0 : view.side === 'enemy' ? 12 : -12,
      alpha: 0.62,
      duration: targetScene.reducedMotion ? 100 : 300,
      ease: 'Cubic.out',
    });
    run?.waiters.forEach((ready) => ready());
  }

  // Asset frames carry the motion; one short-lived sprite per cue.
  function playEffectSheet(targetScene, target, name, options = {}) {
    if (!target || !targetScene.textures.exists(effectTexture(name))) return false;
    const effect = registerTransient(targetScene, targetScene.add.sprite(
      target.container.x, target.container.y + (options.yOffset ?? -22), effectTexture(name), 0
    ).setDepth(options.depth ?? 2080).setDisplaySize(
      (options.size ?? 108) * combatPresentation().effectScale,
      (options.size ?? 108) * combatPresentation().effectScale
    ));
    if (options.flipX) effect.setFlipX(true);
    const timer = targetScene.time.addEvent({
      delay: targetScene.reducedMotion ? 55
        : Math.max(38, (options.frameMs ?? 78) / Math.min(2, targetScene.playbackSpeed || 1)),
      repeat: 7,
      callback: () => {
        if (!effect.active) { timer.remove(); return; }
        const next = Number(effect.frame.name) + 1;
        if (next >= 8) effect.destroy();
        else effect.setFrame(next);
      },
    });
    return true;
  }

  function playCombatProjectile(targetScene, actor, target, kind, onArrive) {
    if (!actor || !target || actor.isMelee || targetScene.reducedMotion) return false;
    const yssa = actor.family === 'yssa';
    const ultimate = kind === 'ultimate';
    const direction = actor.side === 'enemy' ? -1 : 1;
    const fromX = actor.container.x + direction * (yssa ? 42 : 29);
    const fromY = actor.container.y - (yssa ? 21 : 30);
    const toX = target.container.x - direction * 12;
    const toY = target.container.y - 25;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    const texture = projectileTexture(yssa ? 'frost-arrow' : 'spell-bolt');
    if (!targetScene.textures.exists(texture)) return false;
    const width = yssa ? (ultimate ? 70 : 56) : (ultimate ? 56 : 45);
    const bolt = registerTransient(targetScene, targetScene.add.image(fromX, fromY, texture)
      .setOrigin(0.78, 0.5)
      .setDepth(2098)
      .setAngle(Math.atan2(dy, dx) * 180 / Math.PI));
    bolt.setScale(width / bolt.width);
    if (!yssa) bolt.setTint(actor.accent);
    const duration = clamp(distance * (ultimate ? 1.15 : 0.95), 115, 285) / cinderMotionSpeed(targetScene);
    const flight = { progress: 0 };
    targetScene.tweens.add({
      targets: flight, progress: 1, duration, ease: 'Linear',
      onUpdate: () => {
        if (!bolt.active) return;
        const dx = target.container.x - direction * 12 - fromX;
        const dy = target.container.y - 25 - fromY;
        bolt.setPosition(fromX + dx * flight.progress, fromY + dy * flight.progress)
          .setAngle(Math.atan2(dy, dx) * 180 / Math.PI);
      },
    });
    schedulePresentationCall(targetScene, duration, () => {
      bolt.destroy();
      onArrive();
    });
    return true;
  }

  function playLumenHealLink(targetScene, actor, target, kind, onArrive) {
    if (actor?.family !== 'lumen' || !target || targetScene.reducedMotion) return false;
    const fromX = actor.container.x + 30;
    const fromY = actor.container.y - 30;
    const toX = target.container.x;
    const toY = target.container.y - 23;
    if (Math.hypot(toX - fromX, toY - fromY) < 20) return false;
    const texture = projectileTexture('healing-blossom');
    if (!targetScene.textures.exists(texture)) return false;
    const blossom = registerTransient(targetScene, targetScene.add.image(fromX, fromY, texture)
      .setDepth(2098));
    blossom.setScale((kind === 'ultimate' ? 40 : 30) / blossom.width);
    const speed = Math.min(2.25, Math.max(0.5, targetScene.playbackSpeed || 1));
    const duration = Math.max(115, (kind === 'ultimate' ? 225 : 190) / speed);
    targetScene.tweens.add({
      targets: blossom,
      x: toX,
      y: toY,
      duration,
      ease: 'Sine.inOut',
      onComplete: () => blossom.destroy(),
    });
    schedulePresentationCall(targetScene, duration, onArrive);
    return true;
  }

  function playHealVfx(targetScene, target) {
    playEffectSheet(targetScene, target, 'heal', { size: 94, yOffset: -24, frameMs: 62 });
  }

  function playWardVfx(targetScene, target) {
    playEffectSheet(targetScene, target, 'buff', { size: 82, frameMs: 58 });
  }

  function playStatusVfx(targetScene, target, status) {
    const stunned = String(status).toLowerCase().includes('stun');
    playEffectSheet(targetScene, target, stunned ? 'stun' : 'debuff', {
      size: stunned ? 78 : 80, yOffset: stunned ? -55 : -16, depth: 2070, frameMs: 55,
    });
  }

  function showBattleHealth(targetScene, view, hp, animate, eventId) {
    if (eventId != null) {
      if (eventId < (view.lastHealthEventId ?? 0)) return;
      view.lastHealthEventId = eventId;
    }
    const health = clamp(hp / view.maxHp, 0, 1);
    setBarRatio(targetScene, view.hpFill, health, animate);
    view.hpFill.setFillStyle(health <= 0.25 ? 0xff9a66 : view.side === 'enemy' ? 0xe05c86 : 0x68d99e, 1);
    view.lowHealthMark.setVisible(health > 0 && health <= 0.25);
    const bossHud = targetScene.bossHud;
    if (!bossHud || targetScene.unitViews.get(bossHud.unitId) !== view) return;
    setBarRatio(targetScene, bossHud.hpFill, health, animate);
    bossHud.hpFill.setFillStyle(health <= 0.25 ? 0xff9a66 : 0xe05c86, 1);
    bossHud.hpValue.setText(`${Math.round(health * 100)}%`);
    bossHud.container.setAlpha(health > 0 ? 1 : 0.56);
  }

  function playBattleEvent(targetScene, event, context, nextEvent) {
    const actor = targetScene.unitViews?.get(event.actorId);
    const target = targetScene.unitViews?.get(event.targetId);
    const actionKind = context.actionKind || event.actionKind || (event.type === 'ultimate' || event.type === 'skill' ? event.type : 'basic');
    const suppressActorMotion = Boolean(context.suppressActorMotion);
    const basicAttack = actionKind === 'basic' && event.type === 'damage';
    const splash = event.primaryTargetId && event.primaryTargetId !== event.targetId;
    if (basicAttack && actor && target && !target.defeated) actor.engagementTarget = target;
    if (event.type === 'ultimate') {
      animateUltimate(targetScene, actor);
      if (actor) {
        const castRemaining = Math.max(170, actor.actionLockUntil - targetScene.time.now);
        schedulePresentationCall(targetScene, castRemaining, () => {
          targetScene.visualUltimateHolds.delete(event.actorId);
          targetScene.onUltimatePresented?.(event.actorId);
          const current = targetScene.unitViews?.get(event.actorId);
          if (!current) return;
          const energy = current.actualEnergy || 0;
          setBarRatio(targetScene, current.energyFill, energy, true);
          current.energyFill.setFillStyle(energy >= 1 ? 0xf0b24b : current.accent, 1);
          current.energyBack.setStrokeStyle(1, energy >= 1 ? 0xf0b24b : current.accent, energy >= 1 ? 0.72 : 0.28);
          current.ultimateReadyMark.setVisible(energy >= 1 && !current.defeated);
        });
      }
      return;
    }
    if (event.type === 'skill') {
      animateSkill(targetScene, actor);
      return;
    }
    if (event.type === 'heal') {
      if (!suppressActorMotion) animateSkill(targetScene, actor);
      const resolveHeal = () => {
        if (target && Number.isFinite(event.targetHp)) showBattleHealth(targetScene, target, event.targetHp, true, event.eventId);
        playFloat(targetScene, target, `+${event.amount}`, '#a7f2c0', 'heal', {
          amount: event.amount,
          actionKind,
          eventId: event.eventId,
        });
        playHealVfx(targetScene, target);
      };
      if (!playLumenHealLink(targetScene, actor, target, actionKind, resolveHeal)) resolveHeal();
      return;
    }
    if (event.type === 'barrier') {
      if (!suppressActorMotion) animateSkill(targetScene, actor);
      if ((event.targetBarrier || 0) <= event.amount) {
        playWardVfx(targetScene, target);
        playFloat(targetScene, target, 'BUFF', '#f6d690', 'status', { eventId: event.eventId });
      }
      return;
    }
    if (event.type === 'status') {
      if (event.abilityName !== 'Stun') return;
      playFloat(targetScene, target, 'STUN', '#f6d690', 'status', {
        actionKind: 'status',
        eventId: event.eventId,
      });
      playStatusVfx(targetScene, target, 'Stun');
      return;
    }
    if (event.type !== 'damage') return;
    const isStatusDamage = event.abilityName === 'Burn';
    const resolvedActionKind = isStatusDamage ? 'status' : actionKind;
    const damageLabel = event.amount > 0 ? `-${event.amount}` : `WARD ${event.absorbed || 0}`;
    const resolveImpact = () => {
      context.onImpact?.();
      if (target?.defeated) return;
      playFloat(
        targetScene,
        target,
        damageLabel,
        event.amount > 0 ? '#fff0d2' : '#a8edf2',
        event.amount > 0 ? 'damage' : 'barrier',
        {
          amount: event.amount || event.absorbed || 0,
          actionKind: resolvedActionKind,
          eventId: event.eventId,
        }
      );
      if (!target) return;
      if (Number.isFinite(event.targetHp)) {
        showBattleHealth(targetScene, target, event.targetHp, !context.basicAttackLesson, event.eventId);
      }
      if (event.targetHp === 0 && !target.defeated) {
        animateDefeat(targetScene, target);
        retargetAfterDefeat(targetScene, target, event.retargets);
      }
    };
    const speed = Math.max(0.5, targetScene.playbackSpeed || 1);
    if (basicAttack && !isStatusDamage) {
      const strike = () => {
        const startedAt = targetScene.time.now;
        const finishStrike = () => {
          resolveImpact();
          nextEvent(targetScene.time.now - startedAt);
        };
        if (target?.defeated) {
          finishStrike();
          return;
        }
        animateAttack(targetScene, actor);
        if (targetScene.reducedMotion || !actor || actor.defeated || !target) {
          finishStrike();
          return;
        }
        if (!actor.isMelee) {
          const releaseDelay = RANGED_ATTACK_REACH.has(actor.family) && actor.family !== 'lanternMoth'
            ? 95 / cinderMotionSpeed(targetScene)
            : 80 / speed;
          schedulePresentationCall(targetScene, releaseDelay, () => {
            const release = () => approachAttackTarget(targetScene, actor, target, () => {
              if (actor.defeated || target.defeated
                || !playCombatProjectile(targetScene, actor, target, 'basic', finishStrike)) finishStrike();
            });
            if (actor.approachRun) actor.approachRun.waiters.push(release);
            else release();
          });
          return;
        }
        const contact = actor.family === 'cinder'
          ? cinderPunchTiming(targetScene).contact
          : (75 + 95) / speed;
        schedulePresentationCall(targetScene, contact, finishStrike);
      };
      if (actor?.isMelee) approachAttackTarget(targetScene, actor, target, strike);
      else strike();
      return true;
    }
    if (!suppressActorMotion && !isStatusDamage) animateAttack(targetScene, actor);
    if (!splash && !isStatusDamage && playCombatProjectile(targetScene, actor, target, resolvedActionKind, resolveImpact)) return;
    const charge = CINDER_MOTION_PROFILE.ultimate;
    const chargeDelay = actor?.family === 'cinder' && resolvedActionKind === 'ultimate' && !targetScene.reducedMotion
      ? (charge.windupMs + charge.driveMs) / cinderMotionSpeed(targetScene) : 0;
    if (chargeDelay > 0) schedulePresentationCall(targetScene, chargeDelay, resolveImpact);
    else resolveImpact();
  }

  function setBarRatio(targetScene, bar, ratio, animate) {
    if (animate && bar.targetRatio === ratio) return;
    targetScene.tweens.killTweensOf(bar);
    bar.targetRatio = ratio;
    if (!animate || targetScene.reducedMotion) {
      bar.scaleX = ratio;
      return;
    }
    if (Math.abs(bar.scaleX - ratio) < 0.001) {
      bar.scaleX = ratio;
      return;
    }
    targetScene.tweens.add({
      targets: bar,
      scaleX: ratio,
      duration: 115 / Math.max(0.5, targetScene.playbackSpeed || 1),
      ease: 'Quad.out',
    });
  }

  function dispatchBattleEvents(targetScene, actorId, elapsed = 0) {
    const lane = targetScene.battleEventLanes.get(actorId);
    const next = lane.events.shift();
    if (!next) {
      targetScene.battleEventLanes.delete(actorId);
      for (const [id, view] of targetScene.unitViews) {
        if (view.pendingDefeat && !targetScene.queuedHits.has(id)) animateDefeat(targetScene, view);
      }
      return;
    }
    lane.active = true;
    const { event, delay, context } = next;
    lane.current = next;
    schedulePresentationCall(targetScene, Math.max(0, delay - elapsed), () => {
      const present = () => {
        const continuedByAction = playBattleEvent(targetScene, event, context,
          (impactTime) => dispatchBattleEvents(targetScene, actorId, impactTime));
        if (!continuedByAction) dispatchBattleEvents(targetScene, actorId);
      };
      const actor = targetScene.unitViews.get(event.actorId);
      const basicAttack = event.type === 'damage' && context.actionKind === 'basic' && event.abilityName !== 'Burn';
      const prepare = () => {
        if (basicAttack && targetScene.unitViews.get(event.targetId)?.defeated) {
          present();
          return;
        }
        if (actor?.approachRun && context.actionKind !== 'status') {
          actor.approachRun.waiters.push(prepare);
          return;
        }
        const startsAttack = event.type === 'ultimate' || event.type === 'skill' || basicAttack;
        const recovery = startsAttack && actor && !actor.defeated ? actor.actionLockUntil - targetScene.time.now : 0;
        if (recovery > 0 && !targetScene.reducedMotion) {
          schedulePresentationCall(targetScene, recovery, prepare);
          return;
        }
        const target = actor && !actor.isMelee ? rangedEventTarget(targetScene, event, lane.events) : null;
        if (target && !target.defeated) approachAttackTarget(targetScene, actor, target, present);
        else present();
      };
      prepare();
    });
  }

  function rangedEventTarget(targetScene, event, queuedEvents) {
    let attack = event;
    const cast = event.type === 'skill' || event.type === 'ultimate';
    if (cast) {
      // The cast announcement has no target. Its damage events follow it in this batch.
      attack = null;
      for (const { event: effect, context } of queuedEvents) {
        if (effect.turn !== event.turn || effect.actorId !== event.actorId
          || effect.type === 'skill' || effect.type === 'ultimate') break;
        if (effect.type === 'damage' && effect.abilityName !== 'Burn' && context.actionKind === event.type) {
          attack = effect;
          break;
        }
      }
    }
    if (attack?.type !== 'damage' || attack.abilityName === 'Burn') return null;
    if (!cast && attack.primaryTargetId && attack.primaryTargetId !== attack.targetId) return null;
    const target = targetScene.unitViews.get(attack.primaryTargetId ?? attack.targetId);
    const actor = targetScene.unitViews.get(attack.actorId);
    return target?.side !== actor?.side ? target : null;
  }

  function applyBattleState(targetScene, battle, replayEvents = true) {
    if (!targetScene?.unitViews || !battle || battle.deployment) return;
    const units = [...(battle.player || []), ...(battle.enemies || [])];
    const incomingDamage = new Set();
    if (replayEvents) {
      (battle.events || []).forEach((event) => {
        const fresh = event.eventId != null ? event.eventId > lastProcessedEventId : !processedEvents.has(eventKey(event));
        if (!fresh) return;
        if (event.type === 'ultimate') targetScene.visualUltimateHolds.add(event.actorId);
        if (event.type === 'damage') incomingDamage.add(event.targetId);
      });
    }
    units.forEach((unit) => {
      const view = targetScene.unitViews.get(unit.id);
      if (!view) return;
      const barrier = clamp((unit.barrier || 0) / Math.max(1, unit.maxHp), 0, 1);
      const actualEnergy = clamp((unit.ultimateCharge || 0) / 100, 0, 1);
      view.actualEnergy = actualEnergy;
      const energy = targetScene.visualUltimateHolds.has(unit.id) || targetScene.chargeHolds?.has(unit.id)
        ? 1 : actualEnergy;
      view.maxHp = Math.max(1, unit.maxHp || 1);
      const deferHealth = replayEvents && (incomingDamage.has(unit.id) || targetScene.queuedHits.has(unit.id));
      if (!deferHealth) {
        showBattleHealth(targetScene, view, unit.hp, replayEvents);
        view.pendingDefeat = unit.hp <= 0;
      }
      setBarRatio(targetScene, view.barrierFill, barrier, replayEvents);
      view.barrierFill.setAlpha(barrier > 0 ? 0.9 : 0);
      view.barrierBack.setAlpha(barrier > 0 ? 0.9 : 0);
      setBarRatio(targetScene, view.energyFill, energy, replayEvents);
      view.energyFill.setFillStyle(energy >= 1 ? 0xf0b24b : view.accent, 1);
      view.energyBack.setStrokeStyle(1, energy >= 1 ? 0xf0b24b : view.accent, energy >= 1 ? 0.72 : 0.28);
      view.ultimateReadyMark.setVisible(energy >= 1 && unit.hp > 0);
      const statuses = statusLabels(unit);
      if (replayEvents && unit.hp > 0) {
        if ((unit.burnActions > 0 && !view.previousBurn) || (unit.chillActions > 0 && !view.previousChill)) {
          playStatusVfx(targetScene, view, 'Debuff');
          playFloat(targetScene, view, 'DEBUFF', '#c6a5f5', 'status');
        }
      }
      view.previousBurn = unit.burnActions || 0;
      view.previousChill = unit.chillActions || 0;
      const statusCopy = statuses.join('\n');
      if (view.statusText.text !== statusCopy) {
        view.statusText.setText(statusCopy);
        const statusHeight = statuses.length * 11 + 4;
        view.statusBack.setDisplaySize(40, statusHeight);
        view.statusText.y = 35 - statuses.length * 11;
        view.statusBack.y = view.statusText.y + statusHeight / 2 - 2;
        const statusColor = statuses.includes('STUN')
          ? { text: '#ffe8b0', stroke: 0xffd37a }
          : statuses.includes('BURN')
          ? { text: '#ffd0a2', stroke: 0xff8a38 }
          : statuses.includes('CHILL')
            ? { text: '#d8efff', stroke: 0x72c9ff }
            : statuses.includes('GUARD')
              ? { text: '#fff0c9', stroke: 0xf0b24b }
              : { text: '#d9fbff', stroke: 0x70e6ef };
        view.statusText.setColor(statusColor.text);
        view.statusBack.setStrokeStyle(1, statusColor.stroke, 0.52);
      }
      view.statusText.setVisible(statuses.length > 0 && unit.hp > 0);
      view.statusBack.setVisible(statuses.length > 0 && unit.hp > 0);
      if (unit.hp > 0) {
        view.container.setAlpha(1);
        view.name.setAlpha(1);
      }
    });

    if (targetScene.bossHud) {
      const boss = units.find((unit) => unit.id === targetScene.bossHud.unitId);
      const bossBarrier = boss ? clamp((boss.barrier || 0) / Math.max(1, boss.maxHp), 0, 1) : 0;
      setBarRatio(targetScene, targetScene.bossHud.barrierFill, bossBarrier, replayEvents);
      targetScene.bossHud.barrierBack.setAlpha(bossBarrier > 0 ? 0.92 : 0);
      targetScene.bossHud.barrierFill.setAlpha(bossBarrier > 0 ? 0.96 : 0);
    }
    runtimeBattleDiagnostics.stageId = battle.stageId || null;
    runtimeBattleDiagnostics.unitCount = units.length;
    runtimeBattleDiagnostics.boss = units.find((unit) => unit.isBoss || unit.name === BOSS_NAME)?.name || null;

    const events = battle.events || [];
    if (!replayEvents) {
      events.forEach((event) => {
        if (event.eventId != null) lastProcessedEventId = Math.max(lastProcessedEventId, event.eventId);
        else processedEvents.add(eventKey(event));
      });
      units.forEach((unit) => {
        const view = targetScene.unitViews.get(unit.id);
        if (view?.pendingDefeat) animateDefeat(targetScene, view);
      });
      return;
    }
    const fresh = [];
    events.forEach((event) => {
      if (event.eventId != null) {
        if (event.eventId <= lastProcessedEventId) return;
        lastProcessedEventId = event.eventId;
      } else {
        const key = eventKey(event);
        if (processedEvents.has(key)) return;
        processedEvents.add(key);
      }
      fresh.push(event);
    });
    queueBattleEvents(targetScene, fresh, battle.basicAttackLesson);
  }

  function queueBattleEvents(targetScene, events, basicAttackLesson) {
    const abilityActions = new Map();
    events
      .filter((event) => event.type === 'ultimate' || event.type === 'skill')
      .forEach((event) => abilityActions.set(`${event.turn}:${event.actorId}`, event.type));
    const byActor = new Map();
    for (const event of events) {
      const actionKind = event.actionKind
        || (event.type === 'ultimate' || event.type === 'skill' ? event.type : abilityActions.get(`${event.turn}:${event.actorId}`))
        || (event.abilityName === 'Burn' ? 'status' : 'basic');
      const actorId = actionKind === 'status' || event.type === 'status' || event.abilityName === 'Burn'
        ? null : event.actorId ?? null;
      if (!byActor.has(actorId)) byActor.set(actorId, []);
      byActor.get(actorId).push({ event, actionKind });
    }

    for (const [actorId, actorEvents] of byActor) {
      const lane = targetScene.battleEventLanes.get(actorId) ?? { events: [], active: false };
      targetScene.battleEventLanes.set(actorId, lane);
      const schedule = buildEventSchedule(actorEvents.map(({ event }) => event), targetScene.reducedMotion, targetScene.playbackSpeed);
      let previousDelay = 0;
      schedule.forEach(({ event, delay }, index) => {
        const { actionKind } = actorEvents[index];
        const suppressActorMotion = event.type !== 'ultimate'
          && event.type !== 'skill'
          && (actionKind === 'ultimate' || actionKind === 'skill' || actionKind === 'status');
        const hits = targetScene.queuedHits;
        let onImpact;
        if (event.type === 'damage') {
          hits.set(event.targetId, (hits.get(event.targetId) || 0) + 1);
          onImpact = () => {
            const remaining = hits.get(event.targetId) - 1;
            if (remaining) hits.set(event.targetId, remaining);
            else hits.delete(event.targetId);
          };
        }
        lane.events.push({
          event,
          delay: delay - previousDelay,
          context: { actionKind, suppressActorMotion, basicAttackLesson, onImpact },
        });
        previousDelay = delay;
      });
    }
    for (const [actorId, lane] of targetScene.battleEventLanes) {
      if (!lane.active) dispatchBattleEvents(targetScene, actorId);
    }

  }

  function startGame(Phaser, token) {
    if (!host || token !== generation) return;
    class ArcaneBattleScene extends Phaser.Scene {
      constructor() {
        super('ArcaneBattleScene');
        this.cinderLocomotion = cinderLocomotionEnabled();
        this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
        this.frameSamples = [];
        this.queuedHits = new Map();
        this.battleEventLanes = new Map();
        this.diagnosticFrameCounter = 0;
        this.lastFrameAt = null;
        this.transientEffects = [];
        this.peakTransientEffects = 0;
        this.playbackSpeed = 1;
        this.combatStarted = false;
      }

      preload() {
        traceBattleLoad('scene-preload-start', { stageId: pendingBattle?.stageId || null });
        this.load.on('loaderror', (file) => {
          traceBattleLoad('scene-asset-error', { key: file?.key || null, url: file?.src || file?.url || null });
        });
        this.load.once('complete', (_loader, completed, failed) => {
          traceBattleLoad('scene-preload-end', {
            stageId: pendingBattle?.stageId || null,
            completed: completed ?? null,
            failed: failed ?? null,
          });
        });
        const background = getBattlefieldArt(pendingBattle?.stageId);
        if (background && !battlePresentation().backgroundCover && !pendingBattle?.deployment) {
          this.load.image(PRODUCTION_TEXTURES.background, background.src);
        }
        PROJECTILE_ART.forEach((name) => this.load.image(projectileTexture(name), projectileUrl(name)));
        Object.keys(EFFECT_SHEETS).forEach((name) => {
          this.load.spritesheet(effectTexture(name), effectUrl(name), {
            frameWidth: 192, frameHeight: 192, endFrame: 7,
          });
        });
        const families = new Set(
          [...(pendingBattle?.player || []), ...(pendingBattle?.enemies || [])]
            .map(productionTextureFamily)
            .filter(Boolean)
        );
        if (families.has('cinder') && !this.reducedMotion && !pendingBattle?.deployment) {
          preloadCharacterRig(this, CINDER_RIG_KEY, `${PRODUCTION_ASSET_BASE}/rigs/cinder-vale`);
          if (this.cinderLocomotion) preloadCinderLocomotion(this, PRODUCTION_ASSET_BASE);
        }
        families.forEach((family) => {
          Object.entries(textureMapForFamily(family)).forEach(([state, texture]) => {
            this.load.image(texture, productionAssetUrl(family, state));
          });
        });
      }

      create() {
        if (token !== generation) return;
        const units = [...(pendingBattle?.player || []), ...(pendingBattle?.enemies || [])];
        if (units.some((unit) => {
          const idle = productionTextureMap(unit)?.idle;
          return idle && !this.textures.exists(idle);
        })) {
          setRendererState(host, 'fallback');
          completeMount('fallback', new Error('Battlefield character art could not load'));
          return;
        }
        initialBattleSceneCreated = true;
        scene = this;
        this.visualUltimateHolds = new Set();
        drawBattlefield(this, pendingPresentation, pendingBattle);
        buildUnitViews(this, pendingBattle);
        if (!this.reducedMotion && !pendingBattle?.deployment) {
          const runTextures = new Map();
          for (const view of this.unitViews.values()) {
            if (!runTextures.has(view.family)) {
              runTextures.set(view.family, prepareMeleeRunTextures(this, view));
            }
            view.runTextures = runTextures.get(view.family);
          }
        }
        applyBattleState(this, pendingBattle, false);
        if (pendingBattle && !pendingBattle.deployment && !pendingBattle.tick && !pendingBattle.result && !this.reducedMotion) {
          for (const { id, origin } of planBattleEntrance(pendingBattle)) {
            this.unitViews.get(id).container.setPosition(origin.x, origin.y);
          }
        }
        setRendererState(host, 'ready');
        runtimeBattleDiagnostics = {
          ...runtimeBattleDiagnostics,
          state: 'ready',
          stageId: pendingBattle?.stageId || null,
          reducedMotion: this.reducedMotion,
          unitCount: this.unitViews?.size || 0,
          boss: pendingBattle?.enemies?.find((unit) => unit.isBoss || unit.name === BOSS_NAME)?.name || null,
          activeEffects: 0,
          peakEffects: 0,
          frameMetrics: null,
          positioning: positioningDiagnostics(this),
        };
        traceBattleLoad('scene-ready', {
          stageId: pendingBattle?.stageId || null,
          reducedMotion: this.reducedMotion,
          unitCount: this.unitViews?.size || 0,
          textureCount: this.textures?.list ? Object.keys(this.textures.list).length : null,
        });
        preloadedImages.clear();
        completeMount('ready');
      }

      update() {
        this.unitViews?.forEach(syncGroundContact);
        // Result controls follow the last actual cue, rather than a fixed timeout.
        if (this.resultPending && !this.openingRuns && !this.battleEventLanes.size && !this.pendingPresentationCalls
          && ![...this.unitViews.values()].some((view) => view.approachRun)
          && !this.transientEffects.some(effect => effect?.active)) {
          this.resultPending = false;
          this.resultSettled = true;
          this.unitViews.forEach(view => {
            if (!view.defeated) {
              resetBodyTransform(this, view);
              setStandeeTexture(this, view, 'idle');
            }
          });
          traceBattleLoad('battle-result-presented');
          this.onResultPresented?.();
        }
        this.diagnosticFrameCounter += 1;
        const now = globalThis.performance?.now?.() ?? Date.now();
        if (this.lastFrameAt != null) {
          const delta = now - this.lastFrameAt;
          if (delta > 0 && delta < 1000) {
            this.frameSamples.push(delta);
            if (this.frameSamples.length > FRAME_SAMPLE_LIMIT) this.frameSamples.shift();
          }
        }
        this.lastFrameAt = now;
        this.transientEffects = this.transientEffects.filter((effect) => effect?.active);
        runtimeBattleDiagnostics.activeEffects = this.transientEffects.length;
        runtimeBattleDiagnostics.peakEffects = this.peakTransientEffects;
        if (this.frameSamples.length <= 5 || this.diagnosticFrameCounter % 30 === 0) {
          runtimeBattleDiagnostics.frameMetrics = frameMetrics(this.frameSamples);
        }
      }
    }

    class BattleGame extends Phaser.Game {
      frameCredit = 0;
      frameElapsed = 0;

      step(time, delta) {
        if (this.pendingDestroy || this.isPaused) return super.step(time, delta);
        const interval = 1000 / frameRateLimit;
        this.frameCredit += delta;
        this.frameElapsed += delta;
        // Keep the cadence aligned to display refreshes despite small RAF jitter.
        const intervals = Math.floor((this.frameCredit + 0.5) / interval);
        if (intervals < 1) return;
        this.frameCredit -= intervals * interval;
        const elapsed = this.frameElapsed;
        this.frameElapsed = 0;
        super.step(time, elapsed);
      }
    }

    try {
      game = new BattleGame({
        type: Phaser.WEBGL,
        parent: host.id,
        width: BATTLEFIELD_WIDTH,
        height: BATTLEFIELD_HEIGHT,
        backgroundColor: (battlePresentation().backgroundCover || pendingBattle?.deployment) ? 'rgba(0,0,0,0)' : '#061522',
        transparent: battlePresentation().backgroundCover || Boolean(pendingBattle?.deployment),
        audio: { noAudio: true },
        render: { antialias: true, roundPixels: true, powerPreference: 'high-performance' },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        fps: { target: 60, min: 30, smoothStep: false },
        scene: ArcaneBattleScene,
      });
    } catch (error) {
      setRendererState(host, 'fallback');
      completeMount('fallback', error);
    }
  }

  function mount(nextHost, battle, presentation) {
    destroy();
    generation += 1;
    const token = generation;
    host = nextHost;
    pendingBattle = battle;
    pendingPresentation = presentation;
    processedEvents.clear();
    lastProcessedEventId = 0;
    traceBattleLoad('mount-start', { stageId: battle?.stageId || null });
    runtimeBattleDiagnostics = {
      state: 'loading',
      stageId: battle?.stageId || null,
      reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
      boss: battle?.enemies?.find((unit) => unit.isBoss || unit.name === BOSS_NAME)?.name || null,
      unitCount: (battle?.player?.length || 0) + (battle?.enemies?.length || 0),
      activeEffects: 0,
      peakEffects: 0,
      frameMetrics: null,
      frameRateLimit,
      positioning: null,
    };
    if (!host) return Promise.resolve({ state: 'missing-host', error: null });
    setRendererState(host, 'loading');
    void preloadEncounterResources(battle);
    return new Promise((resolve) => {
      settleMount = resolve;
      ensurePhaser()
        .then((Phaser) => startGame(Phaser, token))
        .catch((error) => {
          if (token !== generation) return;
          setRendererState(host, 'fallback');
          completeMount('fallback', error);
        });
    });
  }

  function updateDeployment(battle) {
    if (!scene || !pendingBattle?.deployment || !battle?.deployment) return false;
    const units = [...battle.player, ...battle.enemies];
    if (units.some((unit) => {
      const key = productionTextureMap(unit)?.idle;
      return key && !scene.textures.exists(key);
    })) return false;
    for (const view of scene.unitViews.values()) {
      scene.tweens.killTweensOf(view.body);
      view.container.destroy(true);
    }
    pendingBattle = battle;
    buildUnitViews(scene, battle);
    runtimeBattleDiagnostics.unitCount = units.length;
    runtimeBattleDiagnostics.positioning = positioningDiagnostics(scene);
    return true;
  }

  function sync(battle, options = {}) {
    pendingBattle = battle;
    if (scene) {
      scene.playbackSpeed = clamp((Number(options.speed) || 1) * combatPresentation().motionSpeed, 0.6, 7.2);
      scene.chargeHolds = options.chargeHolds;
      scene.onUltimatePresented = options.onUltimatePresented;
      scene.onResultPresented = options.onResultPresented;
      if (scene.resultSettled) return;
      if (battle?.result) scene.resultPending = true;
      if (options.started) startMeleeEngagement(scene);
      applyBattleState(scene, battle, true);
      runtimeBattleDiagnostics.positioning = positioningDiagnostics(scene);
    }
  }

  function destroy() {
    generation += 1;
    scene = null;
    const panel = host?.closest('.phaser-battle-panel');
    panel?.classList.remove('renderer-loading', 'renderer-ready', 'renderer-fallback');
    if (game) {
      game.destroy(true);
      game = null;
    }
    host = null;
    pendingBattle = null;
    pendingPresentation = null;
    processedEvents.clear();
    lastProcessedEventId = 0;
    runtimeBattleDiagnostics = { ...runtimeBattleDiagnostics, state: 'destroyed', activeEffects: 0 };
    if (settleMount) completeMount('destroyed');
  }

  return {
    preload: preloadBattleResources,
    preloadEncounter: preloadEncounterResources,
    mount,
    sync,
    setFrameRateLimit(fps) {
      frameRateLimit = fps;
      if (scene) {
        scene.frameSamples.length = 0;
        scene.lastFrameAt = null;
        runtimeBattleDiagnostics.frameRateLimit = fps;
        runtimeBattleDiagnostics.frameMetrics = null;
      }
    },
    updateDeployment,
    playEntrance,
    getUnitPosition(battle, unitId) {
      const unit = pendingBattle === battle && scene?.unitViews?.get(unitId);
      return unit ? copyPosition(unit.container) : undefined;
    },
    isResultPresentationPending: () => Boolean(scene?.resultPending),
    destroy,
    getDiagnostics: getBattleLoadDiagnostics,
  };
}
