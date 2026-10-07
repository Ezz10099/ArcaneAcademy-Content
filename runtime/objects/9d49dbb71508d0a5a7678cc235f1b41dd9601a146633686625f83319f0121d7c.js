import { PRESENTATION_CONFIG } from '../game/data.js';

const PHASER_VERSION = '4.2.1';
const PHASER_SCRIPT_ID = 'arcane-phaser-runtime';
const PHASER_LOCAL_URL = `./src/vendor/phaser-${PHASER_VERSION}.min.js`;
const PHASER_CDN_URL = `https://cdn.jsdelivr.net/npm/phaser@${PHASER_VERSION}/dist/phaser.min.js`;
const PHASER_INTEGRITY = 'sha384-kyUQ5+cxc6+X89xEG6DhcXLcDU9T3Z+o/45VdT6pgAwtG6gxtAzYTEn0Wwj/BKZd';
const DESIGN_WIDTH = 480;
const DESIGN_HEIGHT = 560;
const PRODUCTION_ASSET_BASE = './final-assets/battle';
const EFFECT_SHEETS = Object.freeze({
  heal: 'heal-restorative',
  buff: 'buff-gold',
  debuff: 'debuff-violet',
  stun: 'stun-spark',
});
const effectTexture = (name) => `arcane-fx-${EFFECT_SHEETS[name]}`;
const effectUrl = (name) => `${PRODUCTION_ASSET_BASE}/effects/${EFFECT_SHEETS[name]}.webp`;
const STANDEE_SCALE = 0.44;
const STANDEE_ORIGIN_Y = 351 / 384;
const STANDEE_CONTACT_OFFSET_Y = 35;
const MAX_TRANSIENT_EFFECTS = 26;
const FRAME_SAMPLE_LIMIT = 360;
const CINDER_MOTION_PROFILE = Object.freeze({
  idle: Object.freeze({ rise: 4, scaleX: 1.018, scaleY: 0.982, duration: 980 }),
  approach: Object.freeze({ bob: 1.4, lean: 1.2 }),
  attack: Object.freeze({ windup: 8, strike: 30, lift: 3, windupMs: 120, strikeMs: 230, recoverMs: 150 }),
  skill: Object.freeze({ rise: 6, scaleX: 1.065, scaleY: 1.05, holdMs: 360, recoverMs: 150 }),
  ultimate: Object.freeze({ rise: 10, scaleX: 1.1, scaleY: 1.075, windupMs: 150, holdMs: 430, recoverMs: 190 }),
  hit: Object.freeze({ recoil: 12, squashX: 0.94, stretchY: 1.06, holdMs: 145, recoverMs: 110 }),
});
const BOSS_NAME = 'Gatewood Warden';
const FRONT_SLOT_Y = Object.freeze([205, 350, 500]);
const BACK_SLOT_Y = Object.freeze([65, 235, 420]);
const SIDE_LAYOUT = Object.freeze({
  player: Object.freeze({
    frontX: 130,
    reserveMeleeX: 104,
    combatX: 165,
    backX: Object.freeze({ guardian: 96, striker: 82, mystic: 68 }),
  }),
  enemy: Object.freeze({
    frontX: 350,
    reserveMeleeX: 376,
    combatX: 315,
    backX: Object.freeze({ guardian: 384, striker: 398, mystic: 412 }),
  }),
});
function battlePresentation() {
  return PRESENTATION_CONFIG.battle;
}
function combatPresentation() {
  return PRESENTATION_CONFIG.combat;
}
function liveFrontSlotY(threeFront = false) {
  const config = combatPresentation();
  return threeFront ? [config.backTopY, config.backMiddleY, config.backBottomY]
    : [config.frontTopY, config.frontBottomY, config.backBottomY];
}
function liveBackSlotY() {
  const config = combatPresentation();
  return [config.backTopY, config.backMiddleY, config.backBottomY];
}
function liveSideLayout(side) {
  const config = combatPresentation();
  return side === 'enemy'
    ? {
        frontX: config.enemyFrontX,
        reserveMeleeX: config.enemyReserveX,
        combatX: config.enemyCombatX,
        backX: { guardian: config.enemyBackGuardianX, striker: config.enemyBackStrikerX, mystic: config.enemyBackMysticX },
      }
    : {
        frontX: config.playerFrontX,
        reserveMeleeX: config.playerReserveX,
        combatX: config.playerCombatX,
        backX: { guardian: config.playerBackGuardianX, striker: config.playerBackStrikerX, mystic: config.playerBackMysticX },
      };
}
export const BATTLE_SPATIAL_EVENT = Object.freeze({
  START: 'start',
  ATTACK: 'attack',
  RECOVER: 'recover',
});
const PRODUCTION_TEXTURES = Object.freeze({
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
  cinder: 29, yssa: 12, lumen: 12, kael: 52, pyreth: 51, sera: 51,
  gorr: 52, dusk: 79, forestScout: 37, briarGuard: 23, lanternMoth: 23, gatewoodWarden: 46,
});
const COMBAT_NAME = Object.freeze({
  hero_cinder_vale: 'Cinder', hero_yssa_driftborn: 'Yssa', hero_lumen_solis: 'Lumen',
  hero_frost_warden_kael: 'Kael', hero_pyreth_the_branded: 'Pyreth',
  hero_sera_ashveil: 'Sera', hero_stone_sentinel_gorr: 'Gorr', hero_dusk: 'Dusk',
});
export function resolveUnitHudLayout(unit, placement) {
  const family = productionTextureFamily(unit);
  const scale = (unit.isBoss ? combatPresentation().bossScale : combatPresentation().characterScale) * placement.depthScale;
  const headY = family
    ? STANDEE_CONTACT_OFFSET_Y - (351 - FAMILY_IDLE_TOP_ROW[family]) * scale
    : -55 * placement.depthScale * combatPresentation().characterScale / STANDEE_SCALE;
  return { top: Math.floor(headY - 28), width: 88, height: 28,
    name: unit.side === 'player' ? COMBAT_NAME[unit.heroDefId] || unit.name : unit.isBoss ? 'Gatewood' : unit.name };
}

const FAMILY_ASSET_PATHS = Object.freeze({
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
const FAMILY_PRESENTATION = Object.freeze({
  kael: Object.freeze({ color: 0x72c9ff, secondary: 0xf3d98b, impact: 'ward', scale: STANDEE_SCALE }),
  pyreth: Object.freeze({ color: 0xff8a38, secondary: 0xf3d98b, impact: 'flame', scale: STANDEE_SCALE }),
  sera: Object.freeze({ color: 0xf3d98b, secondary: 0xf3d98b, impact: 'rune', scale: STANDEE_SCALE }),
  gorr: Object.freeze({ color: 0x96c8b6, secondary: 0xf3d98b, impact: 'ward', scale: STANDEE_SCALE }),
  dusk: Object.freeze({ color: 0xa98cff, secondary: 0xf3d98b, impact: 'slash', scale: STANDEE_SCALE }),
  yssa: Object.freeze({ color: 0x72c9ff, secondary: 0xc6e8ff, impact: 'slash', scale: STANDEE_SCALE }),
  lumen: Object.freeze({ color: 0xb28bff, secondary: 0xf3d98b, impact: 'rune', scale: STANDEE_SCALE }),
  cinder: Object.freeze({ color: 0xff8a38, secondary: 0xf3d98b, impact: 'flame', scale: STANDEE_SCALE }),
  forestScout: Object.freeze({ color: 0x70e6ef, secondary: 0x96f2b8, impact: 'slash', scale: STANDEE_SCALE }),
  briarGuard: Object.freeze({ color: 0x66c78a, secondary: 0x70e6ef, impact: 'ward', scale: STANDEE_SCALE }),
  lanternMoth: Object.freeze({ color: 0xf0b24b, secondary: 0x70e6ef, impact: 'rune', scale: STANDEE_SCALE }),
  gatewoodWarden: Object.freeze({ color: 0x70e6ef, secondary: 0xa98cff, impact: 'boss-ward', scale: 0.47 }),
  placeholder: Object.freeze({ color: 0xd7b76f, secondary: 0xf3e4bd, impact: 'slash', scale: 1 }),
});

function productionAssetUrl(family, state) {
  const asset = FAMILY_ASSET_PATHS[family];
  return asset ? `${PRODUCTION_ASSET_BASE}/${asset.directory}/${asset.stem}-${state}-${asset.facing}.${asset.extension || 'png'}` : null;
}

function productionTextureFamily(unit) {
  if (unit?.side === 'player' && unit.heroDefId === 'hero_frost_warden_kael') return 'kael';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_pyreth_the_branded') return 'pyreth';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_sera_ashveil') return 'sera';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_stone_sentinel_gorr') return 'gorr';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_dusk') return 'dusk';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_yssa_driftborn') return 'yssa';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_lumen_solis') return 'lumen';
  if (unit?.side === 'player' && unit.heroDefId === 'hero_cinder_vale') return 'cinder';
  if (unit?.side === 'enemy' && unit.name === 'Forest Scout') return 'forestScout';
  if (unit?.side === 'enemy' && unit.name === 'Briar Guard') return 'briarGuard';
  if (unit?.side === 'enemy' && unit.name === 'Lantern Moth') return 'lanternMoth';
  if (unit?.side === 'enemy' && unit.name === 'Gatewood Warden') return 'gatewoodWarden';
  return null;
}

const PRODUCTION_ASSET_URLS = Object.freeze([
  `${PRODUCTION_ASSET_BASE}/backgrounds/forest-gate-battlefield.jpg`,
  ...Object.keys(EFFECT_SHEETS).map(effectUrl),
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
  return [...families].flatMap((family) => Object.keys(PRODUCTION_TEXTURES[family] || {})
    .map((state) => productionAssetUrl(family, state))
    .filter(Boolean));
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

function presentationFor(view) {
  return FAMILY_PRESENTATION[view?.family] || {
    ...FAMILY_PRESENTATION.placeholder,
    color: view?.accent || FAMILY_PRESENTATION.placeholder.color,
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

function preferredBackSlotIndexes(count) {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count === 2) return [0, 2];
  return [0, 1, 2];
}

function perspectiveScale(y, deployment = false) {
  const backSlots = deployment ? BACK_SLOT_Y : liveBackSlotY();
  const progress = clamp((y - backSlots[0]) / (backSlots[2] - backSlots[0]), 0, 1);
  return Math.round((0.955 + progress * 0.09) * 1000) / 1000;
}

function copyPosition(position) {
  return { x: position.x, y: position.y };
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
  const persistentPosition = phase === 'combat' && state.isMelee
    ? state.combatPosition
    : state.formationPosition;
  return {
    ...state,
    phase,
    action,
    persistentPosition: copyPosition(persistentPosition),
  };
}

// Deployment coordinates are shared by canvas art, DOM fallback and touch slots.
// The 480x560 crop removes unused sky while retaining standee scale and paving.
// Canvas art, fallback and touch slots share the wider 125px column spacing.
export const DEPLOYMENT_SLOTS = Object.freeze([
  { row: 'FRONT', index: 0, x: 175, y: 220 },
  { row: 'FRONT', index: 1, x: 175, y: 360 },
  { row: 'FRONT', index: 2, x: 175, y: 500 },
  { row: 'BACK', index: 0, x: 50, y: 220 },
  { row: 'BACK', index: 1, x: 50, y: 360 },
  { row: 'BACK', index: 2, x: 50, y: 500 },
].map(Object.freeze));

export function resolveDeploymentFormation(units = [], side = 'player') {
  return resolveBattleFormation(units, side).map((placement) => {
    const slot = DEPLOYMENT_SLOTS.find((item) => item.row === placement.slotKind.toUpperCase()
      && item.index === placement.slotIndex);
    const x = side === 'enemy' ? DESIGN_WIDTH - slot.x : slot.x;
    const y = slot.y;
    return { ...placement, formationPosition: { x, y }, formationX: x, formationY: y,
      groundY: y + STANDEE_CONTACT_OFFSET_Y, depthScale: perspectiveScale(y, true) * 0.72, deployment: true };
  });
}

export function resolveBattleFormation(units = [], side = 'player') {
  const resolvedSide = side === 'enemy' ? 'enemy' : 'player';
  const config = liveSideLayout(resolvedSide);
  const threeFront = units.slice(0, 5).filter(u => u?.row !== 'BACK').length >= 3
    || units.slice(0, 5).some(u => u?.row !== 'BACK' && u?.formationSlot === 2);
  const frontSlots = liveFrontSlotY(threeFront);
  const backSlots = liveBackSlotY();
  const indexed = units.slice(0, 5).map((unit, sourceIndex) => ({
    unit,
    sourceIndex,
    gameplayRow: unit?.row === 'BACK' ? 'BACK' : 'FRONT',
    role: unitRole(unit?.heroClass),
  }));
  const front = indexed
    .filter((entry) => entry.gameplayRow === 'FRONT')
    .sort((a, b) => {
      if (resolvedSide === 'player') return a.sourceIndex - b.sourceIndex;
      const bossDelta = Number(Boolean(b.unit?.isBoss)) - Number(Boolean(a.unit?.isBoss));
      if (bossDelta) return bossDelta;
      const guardianDelta = Number(b.role === 'guardian') - Number(a.role === 'guardian');
      return guardianDelta || a.sourceIndex - b.sourceIndex;
    });
  const back = indexed.filter((entry) => entry.gameplayRow === 'BACK');
  const placements = new Map();

  const assign = (entry, slotKind, slotIndex) => {
    const y = slotKind === 'front' ? frontSlots[slotIndex] : backSlots[slotIndex];
    const isMelee = entry.gameplayRow === 'FRONT';
    const formationX = slotKind === 'front' && isMelee
      ? config.frontX
      : isMelee
        ? config.reserveMeleeX
        : config.backX[entry.role];
    const formationPosition = Object.freeze({ x: formationX, y });
    const combatPosition = Object.freeze({ x: isMelee ? config.combatX : formationX, y });
    const depthScale = perspectiveScale(y);
    placements.set(entry.sourceIndex, {
      unit: entry.unit,
      threeFront,
      side: resolvedSide,
      role: entry.role,
      gameplayRow: entry.gameplayRow,
      isMelee,
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

  const usedFront = new Set();
  front.slice(0, frontSlots.length).forEach((entry, index) => {
    const requested = entry.unit?.formationSlot;
    const slotIndex = Number.isInteger(requested) && requested >= 0 && requested < frontSlots.length && !usedFront.has(requested)
      ? requested : [0, 1, 2].find((slot) => !usedFront.has(slot));
    usedFront.add(slotIndex);
    assign(entry, 'front', slotIndex);
  });

  const backEntries = back.slice(0, backSlots.length);
  const reservedBackIndexes = preferredBackSlotIndexes(backEntries.length);
  const usedBack = new Set();
  backEntries.forEach((entry, index) => {
    const requested = entry.unit?.formationSlot;
    const slotIndex = Number.isInteger(requested) && requested >= 0 && requested < backSlots.length && !usedBack.has(requested)
      ? requested : [...reservedBackIndexes, 0, 1, 2].find((slot) => !usedBack.has(slot));
    usedBack.add(slotIndex);
    assign(entry, 'back', slotIndex);
  });

  const freeBackIndexes = [0, 1, 2].filter((index) => !usedBack.has(index));
  front.slice(frontSlots.length).forEach((entry) => {
    const slotIndex = freeBackIndexes.shift();
    if (slotIndex != null) assign(entry, 'back', slotIndex);
  });

  const usedFrontIndexes = new Set(
    [...placements.values()].filter((placement) => placement.slotKind === 'front').map((placement) => placement.slotIndex)
  );
  const freeFrontIndexes = [0, 1, 2].filter((index) => !usedFrontIndexes.has(index));
  back.slice(backSlots.length).forEach((entry) => {
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

function setRendererMessage(host, message, state = 'loading') {
  if (!host) return;
  host.dataset.rendererState = state;
  const panel = host.closest('.phaser-battle-panel');
  panel?.classList.toggle('renderer-loading', state === 'loading');
  panel?.classList.toggle('renderer-ready', state === 'ready');
  panel?.classList.toggle('renderer-fallback', state === 'fallback');
  const status = panel?.querySelector('.battle-renderer-state');
  if (status) status.textContent = message;
}

export function createPhaserBattleRenderer() {
  let game = null;
  let scene = null;
  let host = null;
  let pendingBattle = null;
  let pendingPresentation = null;
  let generation = 0;
  let settleMount = null;
  const processedEvents = new Set();

  function completeMount(state, error = null) {
    traceBattleLoad('mount-end', { state, error: error?.message || null });
    if (!settleMount) return;
    settleMount({ state, error });
    settleMount = null;
  }

  function drawBattlefield(targetScene, presentation, battle) {
    const isForestGate = battle?.stageId?.startsWith('forest-gate-');
    const productionBackgroundReady = isForestGate && targetScene.textures.exists(PRODUCTION_TEXTURES.background);
    if (productionBackgroundReady) {
      if (!battlePresentation().backgroundCover) {
        targetScene.add.image(240, 220, PRODUCTION_TEXTURES.background)
          .setDisplaySize(700 * 960 / 1096, 700);
      }
      targetScene.add.rectangle(240, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x02070d, 0.12);
      targetScene.add.ellipse(240, 515, 560, 180, 0x02070d, 0.28);

      const gateGlow = targetScene.add.circle(240, 62, 36, 0x70e6ef, 0.035);
      gateGlow.setStrokeStyle(2, 0x70e6ef, 0.12);
      const mistA = targetScene.add.ellipse(118, 450, 320, 54, 0x9ed7d8, 0.035);
      const mistB = targetScene.add.ellipse(360, 495, 300, 48, 0x809eb8, 0.03);
      if (!targetScene.reducedMotion) {
        targetScene.tweens.add({ targets: gateGlow, alpha: 0.085, scale: 1.12, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        targetScene.tweens.add({ targets: mistA, x: 178, duration: 7200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        targetScene.tweens.add({ targets: mistB, x: 302, duration: 8600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    } else {
      targetScene.add.rectangle(240, DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT, 0x061522);
      targetScene.add.ellipse(240, 255, 610, 530, 0x123c50, 0.42);
      targetScene.add.ellipse(240, 315, 430, 340, 0x321b52, 0.28);
      targetScene.add.ellipse(240, 500, 560, 170, 0x02070d, 0.74);

      const path = targetScene.add.graphics();
      path.lineStyle(2, 0xd7b76f, 0.12);
      for (let y = 110; y <= 530; y += 98) path.lineBetween(26, y, 454, y - 22);
      path.lineStyle(1, 0x70e6ef, 0.1);
      path.lineBetween(240, 54, 240, 540);
      const rune = targetScene.add.star(240, 280, 8, 66, 78, 0x70e6ef, 0.07);
      rune.setStrokeStyle(2, 0xd7b76f, 0.25);
      if (!targetScene.reducedMotion) targetScene.tweens.add({ targets: rune, angle: 360, duration: 22000, repeat: -1 });
    }

    const moteCount = targetScene.reducedMotion ? 4 : 11;
    for (let index = 0; index < moteCount; index += 1) {
      const mote = targetScene.add.circle(
        22 + (index * 79) % 438,
        84 + (index * 103) % 374,
        1 + index % 2,
        index % 3 === 0 ? 0xd7b76f : 0x70e6ef,
        0.24
      );
      if (!targetScene.reducedMotion) {
        targetScene.tweens.add({
          targets: mote,
          y: mote.y - 38 - index % 4 * 6,
          alpha: { from: 0.08, to: 0.42 },
          duration: 2200 + index % 6 * 260,
          delay: index * 70,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
      }
    }
  }

  function drawPlaceholderStandee(targetScene, unit) {
    const graphics = targetScene.add.graphics();
    const side = unit.side === 'enemy' ? 'enemy' : 'player';
    const facing = side === 'player' ? 1 : -1;
    const role = unitRole(unit.heroClass);
    const accent = affinityColor(unit.affinity, side);
    const bodyColor = side === 'enemy' ? 0x4a2038 : 0x173b50;
    const trimColor = side === 'enemy' ? 0xe56a9b : 0xd7b76f;

    graphics.fillStyle(bodyColor, 1);
    if (role === 'guardian') graphics.fillRoundedRect(-25, -28, 50, 58, 11);
    else if (role === 'mystic') graphics.fillTriangle(-22, 30, 22, 30, 0, -30);
    else graphics.fillRoundedRect(-18, -29, 36, 57, 7);

    graphics.lineStyle(2, trimColor, 0.88);
    if (role === 'guardian') graphics.strokeRoundedRect(-25, -28, 50, 58, 11);
    else if (role === 'mystic') graphics.strokeTriangle(-22, 30, 22, 30, 0, -30);
    else graphics.strokeRoundedRect(-18, -29, 36, 57, 7);

    graphics.fillStyle(accent, 1);
    graphics.fillCircle(0, -39, 13);
    graphics.lineStyle(2, 0xf4e6c3, 0.55);
    graphics.strokeCircle(0, -39, 13);

    if (role === 'guardian') {
      graphics.fillStyle(trimColor, 0.82);
      graphics.fillRoundedRect(20 * facing - (facing < 0 ? 15 : 0), -17, 15, 35, 5);
    } else if (role === 'mystic') {
      graphics.lineStyle(4, trimColor, 0.9);
      graphics.lineBetween(23 * facing, -24, 27 * facing, 31);
      graphics.fillStyle(accent, 0.95);
      graphics.fillCircle(22 * facing, -29, 7);
    } else {
      graphics.lineStyle(4, trimColor, 0.92);
      graphics.lineBetween(18 * facing, -15, 34 * facing, 19);
      graphics.lineStyle(2, 0xf4e6c3, 0.7);
      graphics.lineBetween(15 * facing, -7, 26 * facing, -13);
    }
    return graphics;
  }

  function productionTextureMap(unit) {
    const family = productionTextureFamily(unit);
    return family ? PRODUCTION_TEXTURES[family] : null;
  }

  function drawProductionStandee(targetScene, unit, depthScale = 1) {
    const textureMap = productionTextureMap(unit);
    if (!textureMap || !targetScene.textures.exists(textureMap.idle)) return null;
    const family = productionTextureFamily(unit);
    const presentation = FAMILY_PRESENTATION[family] || FAMILY_PRESENTATION.placeholder;
    const body = targetScene.add.image(0, STANDEE_CONTACT_OFFSET_Y, textureMap.idle)
      .setOrigin(0.5, STANDEE_ORIGIN_Y)
      .setScale((pendingBattle?.deployment ? unit.isBoss ? 0.47 : STANDEE_SCALE
        : unit.isBoss ? combatPresentation().bossScale : combatPresentation().characterScale) * depthScale);
    return { body, textureMap, family };
  }

  function setStandeeTexture(targetScene, view, state) {
    const textureKey = view.textureMap?.[state] || view.textureMap?.idle;
    if (textureKey && targetScene.textures.exists(textureKey)) view.body.setTexture(textureKey);
    view.state = state;
  }

  function resetBodyTransform(targetScene, view) {
    targetScene.tweens.killTweensOf(view.body);
    view.body.setPosition(view.bodyBaseX, view.bodyBaseY);
    view.body.setScale(view.bodyScaleX, view.bodyScaleY);
    view.body.setAlpha(1).setAngle(0);
    if (typeof view.body.clearTint === 'function') view.body.clearTint();
  }

  function startIdleMotion(targetScene, view) {
    if (!view || view.defeated) return;
    resetBodyTransform(targetScene, view);
    setStandeeTexture(targetScene, view, 'idle');
    if (targetScene.reducedMotion || !view.textureMap) return;
    const cinder = view.family === 'cinder' ? CINDER_MOTION_PROFILE.idle : null;
    targetScene.tweens.add({
      targets: view.body,
      y: view.bodyBaseY - (cinder?.rise ?? 1.5),
      scaleX: view.bodyScaleX * (cinder?.scaleX ?? 1.012),
      scaleY: view.bodyScaleY * (cinder?.scaleY ?? 0.988),
      duration: cinder?.duration ?? (1500 + (view.baseY % 4) * 80),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
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
    const targetRing = targetScene.add.ellipse(0, 35, isBoss ? 108 : 88, isBoss ? 28 : 22, 0x000000, 0)
      .setStrokeStyle(isBoss ? 3 : 2, 0x70e6ef, 0.88)
      .setVisible(false);
    const aura = targetScene.add.ellipse(0, 35, isBoss ? 96 : 82, isBoss ? 25 : 21, accent, isBoss ? 0.17 : 0.1);
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
    const shadowWidth = deploying ? (family === 'lanternMoth' ? 58 : isBoss ? 86 : 72)
      : family === 'lanternMoth' ? 52 : isBoss ? 78 : 64;
    const shadowHeight = deploying ? (family === 'lanternMoth' ? 11 : isBoss ? 17 : 15)
      : family === 'lanternMoth' ? 9 : isBoss ? 15 : 12;
    const shadowAlpha = deploying ? (family === 'lanternMoth' ? 0.38 : isBoss ? 0.56 : 0.5)
      : family === 'lanternMoth' ? 0.23 : isBoss ? 0.42 : 0.34;
    const shadow = targetScene.add.ellipse(
      0,
      36,
      shadowWidth * depthScale,
      shadowHeight * depthScale,
      0x000000,
      shadowAlpha
    );
    const art = drawProductionStandee(targetScene, unit, depthScale);
    const body = art?.body || drawPlaceholderStandee(targetScene, unit).setScale(depthScale *
      (deploying ? 1 : combatPresentation().characterScale / STANDEE_SCALE));
    const hud = resolveUnitHudLayout(unit, placement);
    const hudBack = targetScene.add.rectangle(0, hud.top + 14, hud.width + 6, hud.height + 4, 0x02070d, 0.7);
    const statusX = side === 'enemy' ? 44 : -44;
    const actorMarker = targetScene.add.graphics().setPosition(0, hud.top - 8).setVisible(false);
    actorMarker.lineStyle(2, 0xf0b24b, 0.96);
    actorMarker.beginPath();
    actorMarker.moveTo(-8, -4);
    actorMarker.lineTo(0, 3);
    actorMarker.lineTo(8, -4);
    actorMarker.strokePath();
    actorMarker.lineStyle(1, 0xf3e4bd, 0.76);
    actorMarker.lineBetween(-5, -9, 0, -5);
    actorMarker.lineBetween(0, -5, 5, -9);
    const targetLabelBack = targetScene.add.rectangle(0, 21, 48, 13, 0x02070d, 0.82)
      .setStrokeStyle(1, 0x70e6ef, 0.5)
      .setVisible(false);
    const targetLabel = targetScene.add.text(0, 21, 'TARGET', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '8px',
      fontStyle: 'bold',
      color: '#f7e8c4',
      stroke: '#02070d',
      strokeThickness: 3,
      letterSpacing: 1,
    }).setOrigin(0.5).setVisible(false);
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
      color: '#f3ead8',
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
      color: '#f3ead8',
      stroke: '#02070d',
      strokeThickness: 2,
      align: 'center',
      letterSpacing: 0.4,
      lineSpacing: -1,
    }).setFixedSize(38, 0).setOrigin(0.5, 0).setVisible(false);

    container.add([
      targetRing,
      bossPresence,
      bossAura,
      aura,
      shadow,
      body,
      actorMarker,
      targetLabelBack,
      targetLabel,
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
    if (pendingBattle?.deployment) {
      // Pre-battle has no health/energy state to explain: show only art and contact shadows.
      container.list.forEach((child) => child.setVisible(child === body || child === shadow));
    }
    container.setDepth(100 + placement.groundY);
    const view = {
      container,
      body,
      aura,
      bossAura,
      bossPresence,
      shadow,
      targetRing,
      targetLabelBack,
      targetLabel,
      actorMarker,
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
      slotId: placement.slotId,
      spatialState,
      textureMap: art?.textureMap || null,
      family: art?.family || 'placeholder',
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
    if (!targetScene.reducedMotion) {
      targetScene.tweens.add({
        targets: aura,
        alpha: isBoss ? 0.28 : 0.2,
        scaleX: isBoss ? 1.08 : 1.12,
        duration: 1900 + (placement.formationY % 5) * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }
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
      color: '#fff1c9',
      letterSpacing: 0.8,
    }).setOrigin(0.5);
    const title = targetScene.add.text(-3, -12, boss.name.toUpperCase(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f3e4bd',
      stroke: '#02070d',
      strokeThickness: 3,
      letterSpacing: 0.8,
    }).setOrigin(0.5);
    const hpValue = targetScene.add.text(116, -12, '100%', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#f3ead8',
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
    const container = targetScene.add.container(DESIGN_WIDTH / 2, 54, [
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
    if (!view || view.motionToken !== token) return;
    view.spatialState = transitionBattleSpatialState(view.spatialState, BATTLE_SPATIAL_EVENT.RECOVER);
    if (!view.isMelee || view.engaged) settlePersistentUnitPosition(view);
    if (view.pendingDefeat) animateDefeat(targetScene, view);
    else startIdleMotion(targetScene, view);
  }

  function cinderMotionSpeed(targetScene) {
    return Math.min(2.25, Math.max(0.5, targetScene.playbackSpeed || 1));
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

  function animateCinderAttack(targetScene, view, token, direction) {
    const profile = CINDER_MOTION_PROFILE.attack;
    const speed = cinderMotionSpeed(targetScene);
    const windupMs = profile.windupMs / speed;
    const strikeMs = profile.strikeMs / speed;
    const recoverMs = profile.recoverMs / speed;
    const totalMs = windupMs + strikeMs + recoverMs;
    view.actionLockUntil = targetScene.time.now + totalMs;
    setStandeeTexture(targetScene, view, 'move');
    targetScene.tweens.add({
      targets: view.body,
      x: view.bodyBaseX - direction * profile.windup,
      y: view.bodyBaseY + 2,
      scaleX: view.bodyScaleX * 0.96,
      scaleY: view.bodyScaleY * 1.045,
      angle: -direction * 2.4,
      duration: windupMs,
      ease: 'Cubic.in',
    });
    schedulePose(targetScene, view, token, windupMs, 'attack', {
      x: view.bodyBaseX + direction * profile.strike,
      y: view.bodyBaseY - profile.lift,
      scaleX: view.bodyScaleX * 1.08,
      scaleY: view.bodyScaleY * 0.94,
      angle: direction * 1.5,
      duration: strikeMs,
    });
    schedulePose(targetScene, view, token, windupMs + strikeMs, 'move', {
      x: view.bodyBaseX,
      y: view.bodyBaseY,
      scaleX: view.bodyScaleX,
      scaleY: view.bodyScaleY,
      angle: 0,
      duration: recoverMs,
      ease: 'Sine.inOut',
    });
    schedulePresentationCall(targetScene, totalMs, () => finishUnitAction(targetScene, view, token));
  }

  function animateCinderAbility(targetScene, view, token, kind) {
    const profile = CINDER_MOTION_PROFILE[kind];
    const speed = cinderMotionSpeed(targetScene);
    const windupMs = (profile.windupMs || 95) / speed;
    const holdMs = profile.holdMs / speed;
    const recoverMs = profile.recoverMs / speed;
    const totalMs = windupMs + holdMs + recoverMs;
    const direction = view.side === 'player' ? 1 : -1;
    view.actionLockUntil = targetScene.time.now + totalMs;
    setStandeeTexture(targetScene, view, kind === 'ultimate' ? 'move' : kind);
    targetScene.tweens.add({
      targets: view.body,
      x: view.bodyBaseX - direction * (kind === 'ultimate' ? 7 : 2),
      y: view.bodyBaseY - profile.rise,
      scaleX: view.bodyScaleX * profile.scaleX,
      scaleY: view.bodyScaleY * profile.scaleY,
      duration: windupMs,
      ease: 'Cubic.out',
    });
    schedulePose(targetScene, view, token, windupMs, kind, {
      x: view.bodyBaseX + direction * (kind === 'ultimate' ? 68 : 3),
      y: view.bodyBaseY - profile.rise,
      scaleX: view.bodyScaleX * profile.scaleX,
      scaleY: view.bodyScaleY * profile.scaleY,
      duration: kind === 'ultimate' ? Math.min(220, holdMs) : holdMs,
      ease: 'Sine.inOut',
    });
    schedulePose(targetScene, view, token, windupMs + holdMs, kind === 'ultimate' ? 'attack' : 'idle', {
      x: view.bodyBaseX,
      y: view.bodyBaseY,
      scaleX: view.bodyScaleX,
      scaleY: view.bodyScaleY,
      duration: recoverMs,
      ease: 'Cubic.inOut',
    });
    schedulePresentationCall(targetScene, totalMs, () => finishUnitAction(targetScene, view, token));
  }

  function animateRangedTraineePose(targetScene, view, token, kind) {
    const speed = Math.min(2.25, Math.max(0.5, targetScene.playbackSpeed || 1));
    const reduced = targetScene.reducedMotion;
    const anticipation = reduced ? 0 : (kind === 'ultimate' ? 115 : kind === 'hit' ? 0 : 95) / speed;
    const hold = reduced ? 185 : (kind === 'ultimate' ? 430 : kind === 'skill' ? 330 : kind === 'hit' ? 145 : 230) / speed;
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
        y: view.bodyBaseY - (kind === 'ultimate' ? 5 : 2),
        duration: Math.min(100, hold),
      });
    } else if (kind === 'hit' && !reduced && typeof view.body.setTintFill === 'function') {
      view.body.setTintFill(0xf8f3df);
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
    view.container.setPosition(position.x, position.y);
  }

  function positioningDiagnostics(targetScene) {
    return [...(targetScene.unitViews?.values() || [])].map((view) => ({
      slotId: view.slotId,
      side: view.side,
      role: view.role,
      melee: view.isMelee,
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

  function engageCombatLines(targetScene) {
    if (!targetScene?.unitViews || targetScene.combatStarted) return;
    targetScene.combatStarted = true;
    targetScene.unitViews.forEach((view) => {
      view.spatialState = transitionBattleSpatialState(view.spatialState, BATTLE_SPATIAL_EVENT.START);
      if (!view.isMelee || view.defeated) return;
      targetScene.tweens.killTweensOf(view.container);
      resetBodyTransform(targetScene, view);
      setStandeeTexture(targetScene, view, 'move');
      const destination = view.spatialState.persistentPosition;
      const distance = Math.abs(destination.x - view.container.x);
      const duration = targetScene.reducedMotion
        ? 0
        : clamp((420 + distance * 2) / Math.max(0.5, targetScene.playbackSpeed || 1), 150, 620);
      if (view.family === 'cinder' && !targetScene.reducedMotion) {
        const direction = view.side === 'player' ? 1 : -1;
        view.body.setAngle(direction * CINDER_MOTION_PROFILE.approach.lean);
      }
      view.actionLockUntil = targetScene.time.now + duration;
      const finishApproach = () => {
        settlePersistentUnitPosition(view);
        view.engaged = true;
        if (!view.defeated) startIdleMotion(targetScene, view);
        runtimeBattleDiagnostics.positioning = positioningDiagnostics(targetScene);
      };
      if (!duration || distance < 1) {
        finishApproach();
        return;
      }
      targetScene.tweens.add({
        targets: view.container,
        x: destination.x,
        y: destination.y,
        duration,
        ease: 'Sine.inOut',
        onComplete: finishApproach,
      });
    });
    runtimeBattleDiagnostics.positioning = positioningDiagnostics(targetScene);
  }

  function animateAttack(targetScene, view) {
    if (!view || view.defeated || view.actionLockUntil > targetScene.time.now) return;
    view.motionToken += 1;
    const token = view.motionToken;
    const direction = view.side === 'player' ? 1 : -1;
    const speed = Math.max(0.5, targetScene.playbackSpeed || 1);
    const cinder = view.family === 'cinder' ? CINDER_MOTION_PROFILE.attack : null;
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
        y: view.bodyBaseY - 2,
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
      x: view.bodyBaseX - direction * (cinder?.windup ?? 4),
      y: view.bodyBaseY + (cinder ? 1 : 0),
      scaleX: view.bodyScaleX * (cinder ? 0.97 : 0.98),
      scaleY: view.bodyScaleY * (cinder ? 1.03 : 1.02),
      duration: (cinder?.windupMs ?? 75) / speed,
      ease: 'Quad.in',
      onComplete: () => {
        if (view.motionToken !== token) return;
        setStandeeTexture(targetScene, view, 'attack');
        targetScene.tweens.add({
          targets: view.body,
          x: view.bodyBaseX + direction * (cinder?.strike ?? 20),
          y: view.bodyBaseY - (cinder?.lift ?? 0),
          scaleX: view.bodyScaleX * (cinder ? 1.055 : 1.04),
          scaleY: view.bodyScaleY * (cinder ? 0.97 : 0.98),
          duration: (cinder?.strikeMs ?? 95) / speed,
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
    const cinder = view.family === 'cinder' ? CINDER_MOTION_PROFILE.skill : null;
    targetScene.tweens.add({
      targets: view.body,
      y: view.bodyBaseY - (cinder?.rise ?? 2),
      scaleX: view.bodyScaleX * (cinder?.scaleX ?? 1.04),
      scaleY: view.bodyScaleY * (cinder?.scaleY ?? 1.025),
      duration: targetScene.reducedMotion ? 82 : (cinder?.duration ?? 165) / speed,
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
    const cinder = view.family === 'cinder' ? CINDER_MOTION_PROFILE.ultimate : null;
    targetScene.tweens.add({
      targets: view.body,
      y: view.bodyBaseY - (cinder?.rise ?? 4),
      scaleX: view.bodyScaleX * (cinder?.scaleX ?? 1.06),
      scaleY: view.bodyScaleY * (cinder?.scaleY ?? 1.045),
      duration: targetScene.reducedMotion ? 96 : (cinder?.duration ?? 260) / speed,
      yoyo: true,
      ease: 'Cubic.out',
      onComplete: () => finishUnitAction(targetScene, view, token),
    });
  }

  function animateHit(targetScene, view) {
    if (!view || view.defeated) return;
    view.motionToken += 1;
    const token = view.motionToken;
    const speed = Math.max(0.5, targetScene.playbackSpeed || 1);
    const cinder = view.family === 'cinder' ? CINDER_MOTION_PROFILE.hit : null;
    const recoilDistance = view.isBoss ? 4 : (cinder?.recoil ?? 7);
    const recoil = view.side === 'enemy' ? recoilDistance : -recoilDistance;
    resetBodyTransform(targetScene, view);
    if (['yssa', 'lumen', 'pyreth', 'sera'].includes(view.family)) {
      animateRangedTraineePose(targetScene, view, token, 'hit');
      return;
    }
    setStandeeTexture(targetScene, view, 'hit');
    if (typeof view.body.setTintFill === 'function') view.body.setTintFill(0xf8f3df);
    if (view.family === 'cinder' && !targetScene.reducedMotion) {
      const holdMs = cinder.holdMs / cinderMotionSpeed(targetScene);
      const recoverMs = cinder.recoverMs / cinderMotionSpeed(targetScene);
      view.actionLockUntil = targetScene.time.now + holdMs + recoverMs;
      targetScene.tweens.add({
        targets: view.body,
        x: view.bodyBaseX + recoil,
        scaleX: view.bodyScaleX * cinder.squashX,
        scaleY: view.bodyScaleY * cinder.stretchY,
        alpha: 0.84,
        duration: holdMs,
        ease: 'Quad.out',
      });
      schedulePose(targetScene, view, token, holdMs, 'idle', {
        x: view.bodyBaseX,
        scaleX: view.bodyScaleX,
        scaleY: view.bodyScaleY,
        alpha: 1,
        duration: recoverMs,
        ease: 'Cubic.out',
      });
      schedulePresentationCall(targetScene, holdMs + recoverMs, () => finishUnitAction(targetScene, view, token));
      return;
    }
    targetScene.tweens.add({
      targets: view.body,
      x: view.bodyBaseX + recoil,
      scaleX: view.bodyScaleX * (cinder?.squashX ?? 0.98),
      scaleY: view.bodyScaleY * (cinder?.stretchY ?? 1.025),
      alpha: 0.88,
      duration: targetScene.reducedMotion ? 52 : (cinder?.duration ?? 72) / speed,
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => finishUnitAction(targetScene, view, token),
    });
  }

  function animateDefeat(targetScene, view) {
    if (!view || view.defeated) return;
    view.motionToken += 1;
    view.defeated = true;
    view.pendingDefeat = false;
    resetBodyTransform(targetScene, view);
    setStandeeTexture(targetScene, view, 'defeat');
    playDefeatVfx(targetScene, view);
    targetScene.tweens.killTweensOf(view.aura);
    view.aura.setAlpha(0.025);
    view.bossPresence.setAlpha(view.isBoss ? 0.06 : 0);
    view.shadow.setAlpha(view.isBoss ? 0.2 : 0.12);
    view.hpBack.setAlpha(0.28);
    view.hpFill.setAlpha(0.2);
    view.barrierBack.setAlpha(0.1);
    view.barrierFill.setAlpha(0.08);
    view.energyBack.setAlpha(0.2);
    view.energyFill.setAlpha(0.16);
    view.statusBack.setVisible(false);
    view.statusText.setVisible(false);
    view.actorMarker.setVisible(false);
    view.targetLabelBack.setVisible(false);
    view.targetLabel.setVisible(false);
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
    if (view.isBoss) playCameraImpact(targetScene, 'boss-defeat');
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

  function playTraineeProjectile(targetScene, actor, target, kind, onArrive) {
    if (!actor || !target || !['yssa', 'lumen'].includes(actor.family) || targetScene.reducedMotion) return false;
    const yssa = actor.family === 'yssa';
    const ultimate = kind === 'ultimate';
    const skill = kind === 'skill';
    const fromX = actor.container.x + (yssa ? 42 : 32);
    const fromY = actor.container.y - (yssa ? 21 : 30);
    const toX = target.container.x - (target.side === 'enemy' ? 12 : 0);
    const toY = target.container.y - 25;
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (Math.hypot(dx, dy) < 25) return false;
    const bolt = registerTransient(targetScene, targetScene.add.graphics()
      .setPosition(fromX, fromY)
      .setDepth(2098)
      .setAngle(Math.atan2(dy, dx) * 180 / Math.PI));
    if (yssa) {
      bolt.lineStyle(ultimate ? 5 : 4, 0x1b567d, 0.85);
      bolt.lineBetween(-22, 0, 11, 0);
      bolt.lineStyle(ultimate ? 3 : 2, 0xdafaff, 1);
      bolt.lineBetween(-24, 0, 13, 0);
      bolt.fillStyle(0x7de8ff, 1);
      bolt.fillTriangle(18, 0, 7, -7, 7, 7);
      bolt.fillStyle(0xe7ffff, 0.96);
      bolt.fillTriangle(-16, 0, -23, -7, -23, 7);
      if (skill || ultimate) {
        bolt.lineStyle(2, 0x9beeff, 0.74);
        bolt.lineBetween(-29, -8, -12, -3);
        bolt.lineBetween(-29, 8, -12, 3);
      }
    } else {
      bolt.lineStyle(5, 0xa88cff, 0.32);
      bolt.lineBetween(-24, 0, -3, 0);
      bolt.fillStyle(0x5d48aa, 0.94);
      bolt.fillTriangle(0, -12, 13, 0, 0, 12);
      bolt.fillTriangle(0, -12, -13, 0, 0, 12);
      bolt.lineStyle(2, 0xffe9aa, 1);
      bolt.lineBetween(0, -12, 13, 0);
      bolt.lineBetween(13, 0, 0, 12);
      bolt.lineBetween(0, 12, -13, 0);
      bolt.lineBetween(-13, 0, 0, -12);
      bolt.fillStyle(0xffffff, 0.95);
      bolt.fillCircle(0, 0, 3);
    }
    const speed = Math.min(2.25, Math.max(0.5, targetScene.playbackSpeed || 1));
    const duration = Math.max(115, (ultimate ? 260 : skill ? 230 : 210) / speed);
    targetScene.tweens.add({
      targets: bolt,
      x: toX,
      y: toY,
      duration,
      ease: 'Sine.inOut',
      onComplete: () => bolt.destroy(),
    });
    schedulePresentationCall(targetScene, duration, onArrive);
    return true;
  }

  function playLumenHealLink(targetScene, actor, target, kind, onArrive) {
    if (actor?.family !== 'lumen' || !target || targetScene.reducedMotion) return false;
    const fromX = actor.container.x + 30;
    const fromY = actor.container.y - 30;
    const toX = target.container.x;
    const toY = target.container.y - 23;
    if (Math.hypot(toX - fromX, toY - fromY) < 20) return false;
    const prism = registerTransient(targetScene, targetScene.add.graphics()
      .setPosition(fromX, fromY)
      .setDepth(2098));
    prism.lineStyle(2, 0xffe7ad, 0.9);
    prism.lineBetween(0, -10, 9, 0);
    prism.lineBetween(9, 0, 0, 10);
    prism.lineBetween(0, 10, -9, 0);
    prism.lineBetween(-9, 0, 0, -10);
    prism.fillStyle(kind === 'ultimate' ? 0xf9dd91 : 0xb5f3d6, 0.9);
    prism.fillCircle(0, 0, kind === 'ultimate' ? 5 : 4);
    const speed = Math.min(2.25, Math.max(0.5, targetScene.playbackSpeed || 1));
    const duration = Math.max(115, (kind === 'ultimate' ? 225 : 190) / speed);
    targetScene.tweens.add({
      targets: prism,
      x: toX,
      y: toY,
      angle: 180,
      duration,
      ease: 'Sine.inOut',
      onComplete: () => prism.destroy(),
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

  function playUltimateVfx(targetScene, view) {
    if (!view) return;
    const profile = presentationFor(view);
    const charge = registerTransient(targetScene, targetScene.add.graphics()
      .setPosition(view.container.x, view.container.y - 12)
      .setDepth(2095));
    const radius = view.isBoss ? 34 : 29;
    charge.lineStyle(view.isBoss ? 4 : 3, profile.color, 0.86);
    charge.strokeCircle(0, 0, radius);
    charge.lineStyle(2, profile.secondary, 0.7);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      charge.lineBetween(
        Math.cos(angle) * (radius - 9),
        Math.sin(angle) * (radius - 9),
        Math.cos(angle) * (radius + 9),
        Math.sin(angle) * (radius + 9)
      );
    }
    charge.lineBetween(0, -14, 10, 0);
    charge.lineBetween(10, 0, 0, 14);
    charge.lineBetween(0, 14, -10, 0);
    charge.lineBetween(-10, 0, 0, -14);
    charge.setScale(0.68).setAlpha(0.9);
    targetScene.tweens.add({
      targets: charge,
      scale: view.isBoss ? 1.42 : 1.3,
      alpha: 0,
      angle: view.side === 'player' ? 22 : -22,
      duration: targetScene.reducedMotion ? 170 : 540,
      ease: 'Cubic.out',
      onComplete: () => charge.destroy(),
    });
  }

  function playTraineeUltimateSignature(targetScene, view) {
    if (!view || (view.family !== 'lumen' && view.family !== 'cinder')) return false;
    const lumen = view.family === 'lumen';
    const x = view.container.x;
    const y = view.container.y - 28;
    if (lumen) {
      const mark = registerTransient(targetScene, targetScene.add.graphics().setDepth(900));
      const allies = [...targetScene.unitViews.values()].filter((ally) => ally.side === view.side && !ally.defeated);
      allies.forEach((ally) => {
        const allyX = ally.container.x;
        const allyY = ally.container.y - 28;
        mark.lineStyle(7, 0x7053b5, 0.38);
        mark.lineBetween(x, y, allyX, allyY);
        mark.lineStyle(3, 0xffe5a8, 0.88);
        mark.lineBetween(x, y, allyX, allyY);
        mark.lineStyle(3, 0xb6f3d9, 0.92);
        mark.strokeCircle(allyX, allyY, 29);
        mark.lineStyle(2, 0xffe5a8, 0.9);
        mark.strokeCircle(allyX, allyY, 20);
      });
      mark.lineStyle(5, 0xffe5a8, 0.94);
      mark.strokeCircle(x, y, 40);
      mark.lineStyle(2, 0xb6f3d9, 0.9);
      mark.strokeCircle(x, y, 52);
      const beamDuration = targetScene.reducedMotion ? 320 : Math.max(420, 900 / Math.min(2.25, targetScene.playbackSpeed || 1));
      targetScene.tweens.add({ targets: mark, alpha: 0, duration: beamDuration, ease: 'Quad.in', onComplete: () => mark.destroy() });
    }
    const duration = targetScene.reducedMotion ? 500 : Math.max(580, 1300 / Math.min(2.25, targetScene.playbackSpeed || 1));

    const title = registerTransient(targetScene, targetScene.add.text(
      DESIGN_WIDTH / 2, 93, lumen ? 'GRAND RESONANCE' : 'BLAZING CHARGE', {
        fontFamily: 'system-ui, sans-serif', fontSize: '19px', fontStyle: 'bold',
        color: lumen ? '#fff0c8' : '#ffe0a4', backgroundColor: '#101824',
        stroke: '#05090e', strokeThickness: 3, padding: { x: 12, y: 7 },
      }
    ).setOrigin(0.5).setDepth(2200));
    targetScene.tweens.add({ targets: title, alpha: 0, duration, ease: 'Quad.in', onComplete: () => title.destroy() });
    const explanation = registerTransient(targetScene, targetScene.add.text(
      DESIGN_WIDTH / 2, 124, lumen ? 'HEAL + CLEANSE' : 'STRIKE + SPLASH · SELF WARD', {
        fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontStyle: 'bold',
        color: lumen ? '#c3ffe2' : '#ffd0a0', backgroundColor: '#101824',
        stroke: '#05090e', strokeThickness: 2, padding: { x: 8, y: 5 },
      }
    ).setOrigin(0.5).setDepth(2200));
    targetScene.tweens.add({ targets: explanation, alpha: 0, duration, ease: 'Quad.in', onComplete: () => explanation.destroy() });
    return true;
  }

  function playCinderChargeImpact(targetScene, target) {
    if (!target) return;
    const flame = registerTransient(targetScene, targetScene.add.graphics()
      .setPosition(target.container.x, target.container.y - 22).setDepth(2105));
    flame.lineStyle(5, 0xffab55, 0.94);
    flame.strokeCircle(0, 0, 29);
    flame.lineStyle(3, 0xffe3a0, 0.9);
    flame.strokeCircle(0, 0, 19);
    flame.fillStyle(0xf2733d, 0.76);
    flame.fillTriangle(-18, 18, -7, -28, 1, 8);
    flame.fillTriangle(4, 19, 12, -25, 19, 13);
    flame.setScale(0.7);
    targetScene.tweens.add({
      targets: flame, scale: 1.45, alpha: 0,
      duration: targetScene.reducedMotion ? 170 : 460,
      ease: 'Cubic.out', onComplete: () => flame.destroy(),
    });
  }

  function playDefeatVfx(targetScene, view) {
    if (!view) return;
    const profile = presentationFor(view);
    const defeat = registerTransient(targetScene, targetScene.add.graphics()
      .setPosition(view.container.x, view.container.y - 3)
      .setDepth(2050));
    const radius = view.isBoss ? 32 : 24;
    defeat.lineStyle(view.isBoss ? 4 : 3, profile.color, 0.78);
    defeat.strokeCircle(0, 0, radius);
    defeat.lineStyle(2, profile.secondary, 0.72);
    for (let angle = Math.PI / 4; angle < Math.PI * 2; angle += Math.PI / 2) {
      defeat.lineBetween(
        Math.cos(angle) * (radius - 5),
        Math.sin(angle) * (radius - 5),
        Math.cos(angle) * (radius + 15),
        Math.sin(angle) * (radius + 15)
      );
    }
    defeat.setScale(0.72);
    targetScene.tweens.add({
      targets: defeat,
      scale: targetScene.reducedMotion ? 0.96 : 1.28,
      alpha: 0,
      duration: targetScene.reducedMotion ? 170 : 440,
      ease: 'Cubic.out',
      onComplete: () => defeat.destroy(),
    });
  }

  function playUltimateScreenAccent(targetScene, view) {
    if (targetScene.reducedMotion || targetScene.time.now - (targetScene.lastScreenAccentAt || 0) < 700) return;
    targetScene.lastScreenAccentAt = targetScene.time.now;
    const profile = presentationFor(view);
    const accent = registerTransient(targetScene, targetScene.add.rectangle(
      DESIGN_WIDTH / 2,
      DESIGN_HEIGHT / 2,
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
      profile.color,
      view?.isBoss ? 0.14 : 0.1
    ).setDepth(2040));
    targetScene.tweens.add({
      targets: accent,
      alpha: 0,
      duration: 170,
      ease: 'Quad.out',
      onComplete: () => accent.destroy(),
    });
    playUltimateCameraAccent(targetScene, view);
  }

  function playUltimateCameraAccent(targetScene, view) {
    if (targetScene.reducedMotion || targetScene.time.now - (targetScene.lastCameraZoomAt || 0) < 260) return;
    const camera = targetScene.cameras?.main;
    if (!camera) return;
    targetScene.lastCameraZoomAt = targetScene.time.now;
    camera.setZoom(1);
    targetScene.tweens.add({
      targets: camera,
      zoom: view?.isBoss ? 1.012 : 1.008,
      duration: view?.isBoss ? 105 : 90,
      yoyo: true,
      ease: 'Sine.inOut',
      onComplete: () => camera.setZoom(1),
    });
  }

  function playCameraImpact(targetScene, kind = 'basic') {
    if (targetScene.reducedMotion) return;
    const camera = targetScene.cameras?.main;
    if (!camera) return;
    const profiles = {
      basic: { duration: 42, intensity: 0.0018, zoom: 0.003 },
      skill: { duration: 58, intensity: 0.0024, zoom: 0.005 },
      ultimate: { duration: 78, intensity: 0.0032, zoom: 0.009 },
      'boss-basic': { duration: 56, intensity: 0.0024, zoom: 0.005 },
      'boss-skill': { duration: 70, intensity: 0.0029, zoom: 0.007 },
      'boss-ultimate': { duration: 92, intensity: 0.0038, zoom: 0.011 },
      'boss-defeat': { duration: 108, intensity: 0.0042, zoom: 0.013 },
    };
    const profile = profiles[kind] || profiles.basic;
    const now = targetScene.time.now;
    if (now - (targetScene.lastCameraImpactAt || 0) < 95) return;
    targetScene.lastCameraImpactAt = now;
    camera.shake(profile.duration, profile.intensity);
    if (now - (targetScene.lastCameraZoomAt || 0) < 150) return;
    targetScene.lastCameraZoomAt = now;
    camera.setZoom(1);
    targetScene.tweens.add({
      targets: camera,
      zoom: 1 + profile.zoom,
      duration: Math.max(38, Math.round(profile.duration * 0.72)),
      yoyo: true,
      ease: 'Quad.out',
      onComplete: () => camera.setZoom(1),
    });
  }

  function markEventParticipants(targetScene, actor, target) {
    targetScene.unitViews?.forEach((view) => {
      view.actorMarker.setVisible(false);
      view.targetRing.setVisible(false);
      view.targetLabelBack.setVisible(false);
      view.targetLabel.setVisible(false);
    });
    if (actor && !actor.defeated) actor.actorMarker.setVisible(true);
    if (!target || target.defeated) return;
    target.targetRing.setVisible(true);
    target.targetLabelBack.setVisible(true);
    target.targetLabel.setVisible(true);
    targetScene.tweens.killTweensOf(target.targetRing);
    target.targetRing.setScale(targetScene.reducedMotion ? 1 : 0.88).setAlpha(1);
    if (!targetScene.reducedMotion) {
      targetScene.tweens.add({ targets: target.targetRing, scale: 1, duration: 105, ease: 'Quad.out' });
    }
  }

  function playBattleEvent(targetScene, event, context = {}) {
    const actor = targetScene.unitViews?.get(event.actorId);
    const target = targetScene.unitViews?.get(event.targetId);
    const actionKind = context.actionKind || event.actionKind || (event.type === 'ultimate' || event.type === 'skill' ? event.type : 'basic');
    const suppressActorMotion = Boolean(context.suppressActorMotion);
    markEventParticipants(targetScene, actor, target);
    if (event.type === 'ultimate') {
      animateUltimate(targetScene, actor);
      playUltimateVfx(targetScene, actor);
      if (!playTraineeUltimateSignature(targetScene, actor)) {
        playFloat(targetScene, actor, event.abilityName || 'Ultimate', '#f3e4bd', 'ability', {
          actionKind: 'ultimate',
          eventId: event.eventId,
        });
      }
      playUltimateScreenAccent(targetScene, actor);
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
        playFloat(targetScene, target, `+${event.amount}`, '#a7f2c0', 'heal', {
          amount: event.amount,
          actionKind,
          eventId: event.eventId,
        });
        playHealVfx(targetScene, target);
        if (target) {
          targetScene.tweens.add({ targets: target.aura, alpha: 0.48, duration: 140, yoyo: true });
        }
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
    if (!suppressActorMotion && !isStatusDamage) animateAttack(targetScene, actor);
    const resolveImpact = () => {
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
      if (actor?.family === 'cinder' && resolvedActionKind === 'ultimate') playCinderChargeImpact(targetScene, target);
      if (!target) return;
      animateHit(targetScene, target);
      targetScene.tweens.add({
        targets: target.aura,
        alpha: target.isBoss ? 0.42 : 0.34,
        duration: targetScene.reducedMotion ? 50 : 68,
        yoyo: true,
      });
      const cameraKind = resolvedActionKind === 'status' || resolvedActionKind === 'basic'
        ? null
        : actor?.isBoss
          ? resolvedActionKind === 'ultimate'
            ? 'boss-ultimate'
            : resolvedActionKind === 'skill'
              ? 'boss-skill'
              : 'boss-basic'
          : resolvedActionKind;
      if (cameraKind) playCameraImpact(targetScene, cameraKind);
    };
    const speed = Math.max(0.5, targetScene.playbackSpeed || 1);
    const impactDelay = suppressActorMotion || isStatusDamage || targetScene.reducedMotion
      ? 0
      : (actor?.family === 'cinder' ? 145 : actor?.isMelee ? 92 : 72) / speed;
    if (!isStatusDamage && playTraineeProjectile(targetScene, actor, target, resolvedActionKind, resolveImpact)) return;
    const chargeDelay = actor?.family === 'cinder' && resolvedActionKind === 'ultimate' && !targetScene.reducedMotion
      ? 105 / speed : 0;
    if (chargeDelay > 0) schedulePresentationCall(targetScene, chargeDelay, resolveImpact);
    else if (impactDelay > 0) schedulePresentationCall(targetScene, impactDelay, resolveImpact);
    else resolveImpact();
  }

  function setBarRatio(targetScene, bar, ratio, animate) {
    if (Math.abs(bar.scaleX - ratio) < 0.001) return;
    targetScene.tweens.killTweensOf(bar);
    if (!animate || targetScene.reducedMotion) {
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

  function applyBattleState(targetScene, battle, replayEvents = true) {
    if (!targetScene?.unitViews || !battle || battle.deployment) return;
    const units = [...(battle.player || []), ...(battle.enemies || [])];
    if (replayEvents) {
      (battle.events || []).forEach((event) => {
        if (event.type === 'ultimate' && !processedEvents.has(eventKey(event))) {
          targetScene.visualUltimateHolds.add(event.actorId);
        }
      });
    }
    units.forEach((unit) => {
      const view = targetScene.unitViews.get(unit.id);
      if (!view) return;
      const health = clamp(unit.hp / Math.max(1, unit.maxHp), 0, 1);
      const barrier = clamp((unit.barrier || 0) / Math.max(1, unit.maxHp), 0, 1);
      const actualEnergy = clamp((unit.ultimateCharge || 0) / 100, 0, 1);
      view.actualEnergy = actualEnergy;
      const energy = targetScene.visualUltimateHolds.has(unit.id) || targetScene.chargeHolds?.has(unit.id)
        ? 1 : actualEnergy;
      view.maxHp = Math.max(1, unit.maxHp || 1);
      setBarRatio(targetScene, view.hpFill, health, replayEvents);
      view.hpFill.setFillStyle(
        health <= 0.25 ? 0xff9a66 : view.side === 'enemy' ? 0xe05c86 : 0x68d99e,
        1
      );
      setBarRatio(targetScene, view.barrierFill, barrier, replayEvents);
      view.barrierFill.setAlpha(barrier > 0 ? 0.9 : 0);
      view.barrierBack.setAlpha(barrier > 0 ? 0.9 : 0);
      setBarRatio(targetScene, view.energyFill, energy, replayEvents);
      view.energyFill.setFillStyle(energy >= 1 ? 0xf0b24b : view.accent, 1);
      view.energyBack.setStrokeStyle(1, energy >= 1 ? 0xf0b24b : view.accent, energy >= 1 ? 0.72 : 0.28);
      view.lowHealthMark.setVisible(health > 0 && health <= 0.25);
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
      view.previousGuard = unit.guardActions || 0;
      const statusCopy = statuses.join('\n');
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
      view.statusText.setVisible(statuses.length > 0 && unit.hp > 0);
      view.statusBack.setVisible(statuses.length > 0 && unit.hp > 0);
      view.pendingDefeat = unit.hp <= 0;
      if (unit.hp > 0) {
        view.container.setAlpha(1);
        view.name.setAlpha(1);
      }
    });

    targetScene.unitViews.forEach((view, unitId) => {
      const isActor = unitId === battle.lastActorId && !view.defeated;
      const isTarget = unitId === battle.lastTargetId && !view.defeated;
      view.actorMarker.setVisible(isActor);
      view.targetRing.setVisible(isTarget);
      view.targetLabelBack.setVisible(isTarget);
      view.targetLabel.setVisible(isTarget);
    });
    if (targetScene.bossHud) {
      const boss = units.find((unit) => unit.id === targetScene.bossHud.unitId);
      const bossHealth = boss ? clamp(boss.hp / Math.max(1, boss.maxHp), 0, 1) : 0;
      const bossBarrier = boss ? clamp((boss.barrier || 0) / Math.max(1, boss.maxHp), 0, 1) : 0;
      setBarRatio(targetScene, targetScene.bossHud.hpFill, bossHealth, replayEvents);
      targetScene.bossHud.hpFill.setFillStyle(bossHealth <= 0.25 ? 0xff9a66 : 0xe05c86, 1);
      targetScene.bossHud.hpValue.setText(`${Math.round(bossHealth * 100)}%`);
      setBarRatio(targetScene, targetScene.bossHud.barrierFill, bossBarrier, replayEvents);
      targetScene.bossHud.barrierBack.setAlpha(bossBarrier > 0 ? 0.92 : 0);
      targetScene.bossHud.barrierFill.setAlpha(bossBarrier > 0 ? 0.96 : 0);
      targetScene.bossHud.container.setAlpha(bossHealth > 0 ? 1 : 0.56);
    }
    runtimeBattleDiagnostics.stageId = battle.stageId || null;
    runtimeBattleDiagnostics.unitCount = units.length;
    runtimeBattleDiagnostics.boss = units.find((unit) => unit.isBoss || unit.name === BOSS_NAME)?.name || null;

    const events = battle.events || [];
    if (!replayEvents) {
      events.forEach((event) => processedEvents.add(eventKey(event)));
      units.forEach((unit) => {
        const view = targetScene.unitViews.get(unit.id);
        if (view?.pendingDefeat) animateDefeat(targetScene, view);
      });
      return;
    }
    const fresh = [];
    events.forEach((event) => {
      const key = eventKey(event);
      if (processedEvents.has(key)) return;
      processedEvents.add(key);
      fresh.push(event);
    });
    const replay = fresh.slice(-8);
    const abilityActions = new Map();
    replay
      .filter((event) => event.type === 'ultimate' || event.type === 'skill')
      .forEach((event) => abilityActions.set(`${event.turn}:${event.actorId}`, event.type));
    const hitTargets = new Set(replay.filter((event) => event.type === 'damage').map((event) => event.targetId));
    const schedule = buildEventSchedule(replay, targetScene.reducedMotion, targetScene.playbackSpeed);
    schedule.forEach(({ event, delay }) => {
      const actionKind = event.actionKind
        || (event.type === 'ultimate' || event.type === 'skill' ? event.type : abilityActions.get(`${event.turn}:${event.actorId}`))
        || (event.abilityName === 'Burn' ? 'status' : 'basic');
      const suppressActorMotion = event.type !== 'ultimate'
        && event.type !== 'skill'
        && (actionKind === 'ultimate' || actionKind === 'skill' || actionKind === 'status');
      schedulePresentationCall(targetScene, delay, () => playBattleEvent(targetScene, event, {
        suppressActorMotion,
        actionKind,
      }));
    });
    const replayEnd = schedule.length ? schedule[schedule.length - 1].delay : 0;
    units.forEach((unit) => {
      const view = targetScene.unitViews.get(unit.id);
      if (!view?.pendingDefeat || hitTargets.has(unit.id)) return;
      schedulePresentationCall(targetScene, replayEnd + 120, () => animateDefeat(targetScene, view));
    });
    if (processedEvents.size > 96) {
      const newest = [...processedEvents].slice(-48);
      processedEvents.clear();
      newest.forEach((key) => processedEvents.add(key));
    }
  }

  function startGame(Phaser, token) {
    if (!host || token !== generation) return;
    class ArcaneBattleScene extends Phaser.Scene {
      constructor() {
        super('ArcaneBattleScene');
        this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
        this.frameSamples = [];
        this.diagnosticFrameCounter = 0;
        this.lastFrameAt = null;
        this.transientEffects = [];
        this.peakTransientEffects = 0;
        this.lastScreenAccentAt = 0;
        this.lastCameraImpactAt = 0;
        this.lastCameraZoomAt = 0;
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
        this.load.image(
          PRODUCTION_TEXTURES.background,
          `${PRODUCTION_ASSET_BASE}/backgrounds/forest-gate-battlefield.jpg`
        );
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
        families.forEach((family) => {
          Object.entries(PRODUCTION_TEXTURES[family]).forEach(([state, texture]) => {
            this.load.image(texture, productionAssetUrl(family, state));
          });
        });
      }

      create() {
        initialBattleSceneCreated = true;
        scene = this;
        this.visualUltimateHolds = new Set();
        drawBattlefield(this, pendingPresentation, pendingBattle);
        buildUnitViews(this, pendingBattle);
        applyBattleState(this, pendingBattle, false);
        const curtain = this.add.rectangle(
          DESIGN_WIDTH / 2,
          DESIGN_HEIGHT / 2,
          DESIGN_WIDTH,
          DESIGN_HEIGHT,
          0x02070d,
          1
        ).setDepth(5000);
        setRendererMessage(host, `Phaser ${PHASER_VERSION} WebGL battle renderer ready.`, 'ready');
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
        if (this.reducedMotion) curtain.destroy();
        else {
          this.tweens.add({
            targets: curtain,
            alpha: 0,
            duration: 180,
            ease: 'Cubic.out',
            onComplete: () => curtain.destroy(),
          });
        }
      }

      update() {
        // Result controls follow the last actual cue, rather than a fixed timeout.
        if (this.resultPending && !this.pendingPresentationCalls
          && !this.transientEffects.some(effect => effect?.active)) {
          this.resultPending = false;
          this.resultSettled = true;
          this.unitViews.forEach(view => {
            view.actorMarker.setVisible(false);
            view.targetRing.setVisible(false);
            view.targetLabelBack.setVisible(false);
            view.targetLabel.setVisible(false);
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

    try {
      game = new Phaser.Game({
        type: Phaser.WEBGL,
        parent: host.id,
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT,
        backgroundColor: battlePresentation().backgroundCover ? 'rgba(0,0,0,0)' : '#061522',
        transparent: battlePresentation().backgroundCover,
        audio: { noAudio: true },
        render: { antialias: true, roundPixels: true, powerPreference: 'high-performance' },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        fps: { target: 60, min: 30, smoothStep: false },
        scene: ArcaneBattleScene,
      });
    } catch (error) {
      setRendererMessage(host, `Simplified battle view active: ${error?.message || error}`, 'fallback');
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
      positioning: null,
    };
    if (!host) return Promise.resolve({ state: 'missing-host', error: null });
    setRendererMessage(host, `Preparing Phaser ${PHASER_VERSION} battle renderer…`, 'loading');
    void preloadEncounterResources(battle);
    return new Promise((resolve) => {
      settleMount = resolve;
      ensurePhaser()
        .then((Phaser) => startGame(Phaser, token))
        .catch((error) => {
          if (token !== generation) return;
          setRendererMessage(host, `Simplified battle view active: ${error?.message || error}`, 'fallback');
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
      scene.tweens.killTweensOf(view.aura);
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
      if (options.started) engageCombatLines(scene);
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
    runtimeBattleDiagnostics = { ...runtimeBattleDiagnostics, state: 'destroyed', activeEffects: 0 };
    if (settleMount) completeMount('destroyed');
  }

  return {
    preload: preloadBattleResources,
    preloadEncounter: preloadEncounterResources,
    mount,
    sync,
    updateDeployment,
    isResultPresentationPending: () => Boolean(scene?.resultPending),
    destroy,
    getDiagnostics: getBattleLoadDiagnostics,
  };
}
