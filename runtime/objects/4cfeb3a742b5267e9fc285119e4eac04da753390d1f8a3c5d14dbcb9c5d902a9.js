import {
  AFFINITY_ADVANTAGES,
  CHAPTER_DEFINITIONS,
  CLASS_DEFAULTS,
  CURRENCY,
  HERO_DEFINITIONS,
  LAUNCH_HERO_IDS,
  LOCATION_DEFINITIONS,
  QUEST_DEFINITIONS,
  RARITY_ORDER,
  STAGE_DEFINITIONS,
  getChapterById,
  getHeroDefinition,
  getLocationById,
  getLocationsForChapter,
  getRegionPresentation,
  getStageById,
  getStageIndex,
  getStagesForLocation,
} from './data.js';

const STORAGE_KEY = 'darkness_kingdom_cocos_save';
const LEGACY_STORAGE_KEY = 'darkness_kingdom_save';

const RARITY_STAT_MULTIPLIER = Object.freeze({
  COMMON: 1,
  UNCOMMON: 1.15,
  RARE: 1.35,
  EPIC: 1.65,
  LEGENDARY: 2.1,
  MYTHIC: 2.8,
  ASCENDED: 3.8,
});

const SHARD_VALUES = Object.freeze({
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 5,
  EPIC: 15,
  LEGENDARY: 50,
  MYTHIC: 150,
  ASCENDED: 300,
});

const BANNER_RATES = Object.freeze({
  BASIC: { COMMON: 55, UNCOMMON: 28, RARE: 14, EPIC: 3 },
  ADVANCED: { RARE: 50, EPIC: 35, LEGENDARY: 15 },
});

const BANNER_CONFIG = Object.freeze({
  BASIC: { unlockKey: 'BASIC_SUMMON', currency: CURRENCY.CRYSTALS, cost1: 100, cost10: 900, pityRarity: 'EPIC', pityMax: 30 },
  ADVANCED: { unlockKey: 'ADVANCED_SUMMON', currency: CURRENCY.PREMIUM_CRYSTALS, cost1: 100, cost10: 900, pityRarity: 'LEGENDARY', pityMax: 80 },
});

const FORMATION_LIMITS = Object.freeze({ FRONT: 2, BACK: 3 });
const IDLE_REWARD_CAP_MS = 8 * 60 * 60 * 1000;
const IDLE_CRYSTAL_INTERVAL_MS = 2 * 60 * 60 * 1000;
const EXPEDITION_SAVE_VERSION = 3;
const EXPEDITION_MIGRATION_ID = 'chapter-location-stage-v1';
const LAUNCH_BATTLE_MIGRATION_ID = 'launch-battle-content-v1';

const LEGACY_ROLE_MAP = Object.freeze({
  WARRIOR: 'GUARDIAN',
  TANK: 'GUARDIAN',
  MAGE: 'MYSTIC',
  HEALER: 'MYSTIC',
  ARCHER: 'STRIKER',
  ASSASSIN: 'STRIKER',
});

const LEGACY_AFFINITY_MAP = Object.freeze({
  FIRE: 'FLAME',
  ICE: 'FROST',
  EARTH: 'ARCANE',
  SHADOW: 'ARCANE',
  LIGHT: 'ARCANE',
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createStorageFallback() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

function makeId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function createHeroInstance(definition, overrides = {}) {
  const basicAbility = definition.basicAbility || { id: definition.normalAbilityIds?.[0] || 'Basic Attack', effect: 'DAMAGE', power: 1 };
  const skillAbility = definition.skillAbility || { id: definition.normalAbilityIds?.[1] || 'Focused Skill', effect: 'DAMAGE_LOWEST', power: 1.3 };
  const ultimateAbility = definition.ultimateAbility || { id: definition.ultimateAbilityId || 'Ultimate', effect: 'DAMAGE_ALL', power: 1.25 };
  return {
    id: overrides.id || makeId('hero'),
    heroDefId: definition.id,
    name: definition.title ? `${definition.name} ${definition.title}` : definition.name,
    heroClass: LEGACY_ROLE_MAP[definition.heroClass] || definition.heroClass,
    affinity: LEGACY_AFFINITY_MAP[definition.affinity] || definition.affinity,
    defaultRow: definition.defaultRow || CLASS_DEFAULTS[LEGACY_ROLE_MAP[definition.heroClass] || definition.heroClass]?.row || 'FRONT',
    rarity: overrides.rarity || definition.rarity,
    originRarity: definition.rarity,
    level: overrides.level || 1,
    stars: overrides.stars || 1,
    xp: overrides.xp || 0,
    awakeningShards: overrides.awakeningShards || 0,
    ultimateCharge: overrides.ultimateCharge || 0,
    basicAbility,
    skillAbility,
    ultimateAbility,
    normalAbilityIds: [basicAbility.id, skillAbility.id],
    ultimateAbilityId: ultimateAbility.id,
    ultimateAbilityId2: null,
    baseStats: definition.baseStats,
  };
}

function normalizeHeroRecord(hero) {
  if (!hero || typeof hero !== 'object') return null;
  const definition = getHeroDefinition(hero.heroDefId);
  if (definition && LAUNCH_HERO_IDS.includes(definition.id)) {
    const canonical = createHeroInstance(definition, {
      id: hero.id,
      rarity: hero.rarity || definition.rarity,
      level: hero.level || 1,
      stars: hero.stars || 1,
      xp: hero.xp || 0,
      awakeningShards: hero.awakeningShards || 0,
      ultimateCharge: hero.ultimateCharge || 0,
    });
    return { ...hero, ...canonical };
  }
  const heroClass = LEGACY_ROLE_MAP[hero.heroClass] || hero.heroClass || 'GUARDIAN';
  const affinity = LEGACY_AFFINITY_MAP[hero.affinity] || hero.affinity || 'ARCANE';
  const basicAbility = hero.basicAbility || { id: hero.normalAbilityIds?.[0] || 'Basic Attack', effect: 'DAMAGE', power: 1 };
  const skillAbility = hero.skillAbility || { id: hero.normalAbilityIds?.[1] || 'Focused Skill', effect: 'DAMAGE_LOWEST', power: 1.3 };
  const ultimateAbility = hero.ultimateAbility || { id: hero.ultimateAbilityId || 'Ultimate', effect: 'DAMAGE_ALL', power: 1.25 };
  return {
    ...hero,
    heroClass,
    affinity,
    defaultRow: hero.defaultRow || CLASS_DEFAULTS[heroClass]?.row || 'FRONT',
    basicAbility,
    skillAbility,
    ultimateAbility,
    normalAbilityIds: [basicAbility.id, skillAbility.id],
    ultimateAbilityId: ultimateAbility.id,
    ultimateAbilityId2: null,
  };
}

function makeDefaultSave() {
  const starterDef = getHeroDefinition('hero_cinder_vale');
  const starterHero = createHeroInstance(starterDef);
  return {
    version: EXPEDITION_SAVE_VERSION,
    currencies: {
      [CURRENCY.GOLD]: 500,
      [CURRENCY.CRYSTALS]: 500,
      [CURRENCY.PREMIUM_CRYSTALS]: 300,
      [CURRENCY.AWAKENING_SHARDS]: 0,
    },
    heroes: [starterHero],
    activeSquad: [{ heroId: starterHero.id, row: 'FRONT', slotIndex: 0 }],
    expeditionProgress: {
      chapterId: 'chapter-1',
      activeLocationId: 'forest-gate',
      lastActiveLocationId: 'forest-gate',
      clearedStageIds: [],
      chapterMapUnlocked: false,
      chapterSelectUnlocked: false,
      pendingChapterMapReveal: false,
      cosmetics: [],
    },
    campaignProgress: { stageCleared: null, regionCleared: 0 },
    migrations: [EXPEDITION_MIGRATION_ID, LAUNCH_BATTLE_MIGRATION_ID],
    unlockedSystems: [],
    summon: { pityCounters: { BASIC: 0, ADVANCED: 0 }, lastResults: [] },
    questClaims: [],
    regionCacheClaims: [],
    idle: { lastClaimTime: Date.now() },
    log: ['Cinder Vale joined your academy.'],
    lastSaveTime: Date.now(),
  };
}

function legacyClearedStageIds(stageCleared) {
  const legacyLocationOrder = [
    ['1-1', 'forest-gate'],
    ['1-2', 'sprite-grove'],
    ['1-3', 'wolf-den'],
    ['1-4', 'ancient-roots'],
    ['1-5', 'deeper-woods'],
    ['1-6', 'heart-of-the-curse'],
    ['1-7', 'heart-of-the-curse'],
  ];
  const legacyIndex = legacyLocationOrder.findIndex(([id]) => id === stageCleared);
  if (legacyIndex < 0) return [];
  const completedLocations = new Set(legacyLocationOrder.slice(0, legacyIndex + 1).map(([, locationId]) => locationId));
  return STAGE_DEFINITIONS.filter((stage) => completedLocations.has(stage.locationId)).map((stage) => stage.id);
}

export function computeHeroStats(hero) {
  const classBase = CLASS_DEFAULTS[hero.heroClass] || CLASS_DEFAULTS.GUARDIAN;
  const rarityMultiplier = RARITY_STAT_MULTIPLIER[hero.rarity] || 1;
  const levelMultiplier = 1 + Math.max(0, hero.level - 1) * 0.08;
  const starMultiplier = 1 + Math.max(0, hero.stars - 1) * 0.15;
  const base = hero.baseStats || classBase;
  return {
    hp: Math.floor(base.hp * rarityMultiplier * levelMultiplier * starMultiplier),
    defense: Math.floor(base.defense * rarityMultiplier * levelMultiplier * starMultiplier),
    damage: Math.floor(base.damage * rarityMultiplier * levelMultiplier * starMultiplier),
  };
}

function combatPowerFromStats(stats) {
  return Math.floor(stats.hp * 0.45 + stats.defense * 2.1 + stats.damage * 4.5);
}

function scaleStats(stats, multiplier = 1) {
  return {
    hp: Math.max(1, Math.floor((stats.hp || 0) * multiplier)),
    defense: Math.max(1, Math.floor((stats.defense || 0) * multiplier)),
    damage: Math.max(1, Math.floor((stats.damage || 0) * multiplier)),
  };
}

function affinityMultiplier(attacker, target) {
  const advantage = AFFINITY_ADVANTAGES[attacker.affinity];
  if (!advantage) return 1;
  if (advantage.strongVs === target.affinity) return 1.3;
  if (advantage.weakVs === target.affinity) return 0.75;
  return 1;
}

function stagePower(stage) {
  return (stage?.enemies || []).reduce((sum, enemy) => {
    const stats = enemy.stats || {};
    return sum + combatPowerFromStats({
      hp: stats.hp || 0,
      defense: stats.defense || 0,
      damage: stats.damage || 0,
    });
  }, 0);
}

function pickWeighted(weights, random) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[0][0];
}

export class GameSession {
  constructor(options = {}) {
    this.storage = options.storage || globalThis.localStorage || createStorageFallback();
    this.random = options.random || Math.random;
    this.saveData = this.load();
    this.battle = null;
  }

  load() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY) || this.storage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return makeDefaultSave();
      const parsed = JSON.parse(raw);
      return this.normalizeSave(parsed);
    } catch {
      return makeDefaultSave();
    }
  }

  normalizeSave(data) {
    const fresh = makeDefaultSave();
    const incoming = data && typeof data === 'object' ? data : {};
    const incomingExpedition = incoming.expeditionProgress && typeof incoming.expeditionProgress === 'object'
      ? incoming.expeditionProgress
      : {};
    const migrations = Array.isArray(incoming.migrations) ? [...incoming.migrations] : [];
    let clearedStageIds = Array.isArray(incomingExpedition.clearedStageIds)
      ? incomingExpedition.clearedStageIds.filter((stageId) => Boolean(getStageById(stageId)))
      : [];

    if (!migrations.includes(EXPEDITION_MIGRATION_ID)) {
      if (clearedStageIds.length === 0) {
        clearedStageIds = legacyClearedStageIds(incoming.campaignProgress?.stageCleared);
      }
      migrations.push(EXPEDITION_MIGRATION_ID);
    }

    const clearedSet = new Set(clearedStageIds);
    const forestGateComplete = getStagesForLocation('forest-gate').every((stage) => clearedSet.has(stage.id));
    const heartComplete = getStagesForLocation('heart-of-the-curse').every((stage) => clearedSet.has(stage.id));
    const requestedLocationId = incomingExpedition.lastActiveLocationId || incomingExpedition.activeLocationId || 'forest-gate';
    const safeLocationId = getLocationById(requestedLocationId) ? requestedLocationId : 'forest-gate';

    const merged = {
      ...fresh,
      ...incoming,
      version: EXPEDITION_SAVE_VERSION,
      currencies: { ...fresh.currencies, ...(incoming.currencies || {}) },
      expeditionProgress: {
        ...fresh.expeditionProgress,
        ...incomingExpedition,
        chapterId: getChapterById(incomingExpedition.chapterId) ? incomingExpedition.chapterId : 'chapter-1',
        activeLocationId: safeLocationId,
        lastActiveLocationId: safeLocationId,
        clearedStageIds: Array.from(clearedSet),
        chapterMapUnlocked: Boolean(incomingExpedition.chapterMapUnlocked || forestGateComplete),
        chapterSelectUnlocked: Boolean(incomingExpedition.chapterSelectUnlocked || heartComplete),
        pendingChapterMapReveal: Boolean(incomingExpedition.pendingChapterMapReveal),
        cosmetics: Array.isArray(incomingExpedition.cosmetics) ? incomingExpedition.cosmetics : [],
      },
      campaignProgress: { ...fresh.campaignProgress, ...(incoming.campaignProgress || {}) },
      migrations,
      summon: {
        ...fresh.summon,
        ...(incoming.summon || {}),
        pityCounters: { ...fresh.summon.pityCounters, ...(incoming.summon?.pityCounters || {}) },
      },
      idle: { ...fresh.idle, ...(incoming.idle || {}) },
    };
    const allChapterStagesCleared = STAGE_DEFINITIONS.every((stage) => clearedSet.has(stage.id));
    const chapterCosmetic = CHAPTER_DEFINITIONS[0]?.completionCosmetic;
    if (allChapterStagesCleared && chapterCosmetic && !merged.expeditionProgress.cosmetics.includes(chapterCosmetic)) {
      merged.expeditionProgress.cosmetics.push(chapterCosmetic);
    }
    if (!Array.isArray(merged.heroes) || merged.heroes.length === 0) merged.heroes = fresh.heroes;
    merged.heroes = merged.heroes.map(normalizeHeroRecord).filter(Boolean);
    merged.unlockedSystems = Array.isArray(merged.unlockedSystems) ? merged.unlockedSystems : [];
    merged.log = Array.isArray(merged.log) ? merged.log.slice(-8) : fresh.log;
    if (!migrations.includes(LAUNCH_BATTLE_MIGRATION_ID)) {
      const migrationGifts = [
        ['forest-gate-2', 'hero_yssa_driftborn', 'Yssa Driftborn joined your academy through the launch roster migration.'],
        ['forest-gate-5', 'hero_lumen_solis', 'Lumen Solis joined your academy through the launch roster migration.'],
      ];
      for (const [stageId, heroDefId, message] of migrationGifts) {
        if (!clearedSet.has(stageId) || merged.heroes.some((hero) => hero.heroDefId === heroDefId)) continue;
        const definition = getHeroDefinition(heroDefId);
        if (!definition) continue;
        merged.heroes.push(createHeroInstance(definition));
        merged.log.push(message);
      }
      if (clearedSet.has('forest-gate-10') && !merged.unlockedSystems.includes('BASIC_SUMMON')) {
        merged.unlockedSystems.push('BASIC_SUMMON');
      }
      migrations.push(LAUNCH_BATTLE_MIGRATION_ID);
    }
    if (!Array.isArray(merged.activeSquad)) merged.activeSquad = [];
    merged.activeSquad = this.normalizeActiveSquad(merged.activeSquad, merged.heroes);
    if (merged.activeSquad.length === 0) {
      merged.activeSquad = this.normalizeActiveSquad(
        merged.heroes.slice(0, 5).map((hero) => ({ heroId: hero.id, row: hero.defaultRow || CLASS_DEFAULTS[hero.heroClass]?.row || 'FRONT' })),
        merged.heroes
      );
    }
    merged.questClaims = Array.isArray(merged.questClaims) ? merged.questClaims : [];
    merged.regionCacheClaims = Array.isArray(merged.regionCacheClaims) ? merged.regionCacheClaims : [];
    merged.log = merged.log.slice(-8);
    return merged;
  }

  save() {
    this.saveData.lastSaveTime = Date.now();
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.saveData));
  }

  reset() {
    this.storage.removeItem(STORAGE_KEY);
    this.saveData = makeDefaultSave();
    this.battle = null;
    this.save();
  }

  addLog(message) {
    this.saveData.log.push(message);
    this.saveData.log = this.saveData.log.slice(-8);
  }

  get heroes() {
    return this.saveData.heroes;
  }

  get currencies() {
    return this.saveData.currencies;
  }

  isUnlocked(system) {
    return this.saveData.unlockedSystems.includes(system);
  }

  unlock(system) {
    if (!system || this.isUnlocked(system)) return;
    this.saveData.unlockedSystems.push(system);
    this.addLog(`${system.replaceAll('_', ' ')} unlocked.`);
  }

  get expeditionProgress() {
    return this.saveData.expeditionProgress;
  }

  getClearedStageIds() {
    return new Set(this.expeditionProgress.clearedStageIds || []);
  }

  getLocationProgress(locationId) {
    const location = getLocationById(locationId);
    if (!location) return null;
    const stages = getStagesForLocation(locationId);
    const clearedSet = this.getClearedStageIds();
    const cleared = stages.filter((stage) => clearedSet.has(stage.id)).length;
    const total = stages.length;
    const complete = total > 0 && cleared >= total;
    const currentStage = stages.find((stage) => !clearedSet.has(stage.id)) || null;
    return {
      location,
      stages,
      total,
      cleared,
      percent: total ? Math.round((cleared / total) * 100) : 0,
      complete,
      unlocked: this.isLocationUnlocked(locationId),
      currentStageId: currentStage?.id || null,
      farmingUnlocked: cleared >= Math.min(total, location.farmingUnlockStage || total),
    };
  }

  isLocationUnlocked(locationId) {
    const location = getLocationById(locationId);
    if (!location) return false;
    const rule = location.unlockRule || { type: 'STARTER' };
    if (rule.type === 'STARTER') return true;
    const completion = (id) => {
      const stages = getStagesForLocation(id);
      const cleared = this.getClearedStageIds();
      const count = stages.filter((stage) => cleared.has(stage.id)).length;
      return { complete: stages.length > 0 && count >= stages.length, percent: stages.length ? Math.round((count / stages.length) * 100) : 0 };
    };
    if (rule.type === 'LOCATION_COMPLETE') return completion(rule.locationId).complete;
    if (rule.type === 'LOCATION_PERCENTAGES') {
      return (rule.requirements || []).every((requirement) => completion(requirement.locationId).percent >= requirement.percent);
    }
    if (rule.type === 'COMPLETED_LOCATION_COUNT') {
      const completed = LOCATION_DEFINITIONS.filter((item) => completion(item.id).complete).length;
      return completed >= (rule.count || 0);
    }
    if (rule.type === 'REQUIRED_LOCATIONS_COMPLETE') {
      return (rule.locationIds || []).every((id) => completion(id).complete);
    }
    return false;
  }

  getLocationList(chapterId = this.expeditionProgress.chapterId || 'chapter-1') {
    return getLocationsForChapter(chapterId).map((location) => ({
      ...location,
      ...this.getLocationProgress(location.id),
    }));
  }

  getActiveLocation() {
    const preferred = this.expeditionProgress.lastActiveLocationId || this.expeditionProgress.activeLocationId || 'forest-gate';
    if (this.isLocationUnlocked(preferred)) return getLocationById(preferred);
    return this.getLocationList().find((location) => location.unlocked)?.location || getLocationById('forest-gate');
  }

  setActiveLocation(locationId) {
    if (!this.isLocationUnlocked(locationId)) return false;
    this.expeditionProgress.activeLocationId = locationId;
    this.expeditionProgress.lastActiveLocationId = locationId;
    this.save();
    return true;
  }

  consumeChapterMapReveal() {
    const pending = Boolean(this.expeditionProgress.pendingChapterMapReveal);
    this.expeditionProgress.pendingChapterMapReveal = false;
    if (pending) this.save();
    return pending;
  }

  getCurrentStage(locationId = this.getActiveLocation()?.id) {
    const progress = this.getLocationProgress(locationId);
    if (!progress?.unlocked) return null;
    return getStageById(progress.currentStageId);
  }

  getLastClearedIndex() {
    const cleared = this.getClearedStageIds();
    return STAGE_DEFINITIONS.reduce((last, stage, index) => cleared.has(stage.id) ? Math.max(last, index) : last, -1);
  }

  isStageCleared(stageId) {
    return this.getClearedStageIds().has(stageId);
  }

  canBattleStage(stageId) {
    const stage = getStageById(stageId);
    if (!stage || !this.isLocationUnlocked(stage.locationId)) return false;
    const progress = this.getLocationProgress(stage.locationId);
    return progress?.currentStageId === stageId;
  }

  getStageRewardPreview(stageId) {
    const stage = getStageById(stageId);
    if (!stage) return { firstClear: false, rewards: { gold: 0, xp: 0, crystals: 0, premiumCrystals: 0 }, milestoneRewards: [] };
    const firstClear = !this.isStageCleared(stageId);
    return {
      firstClear,
      rewards: firstClear ? stage.rewards : { gold: 0, xp: 0, crystals: 0, premiumCrystals: 0 },
      milestoneRewards: firstClear ? (stage.milestoneRewards || []) : [],
    };
  }

  getIdleRewardRates() {
    const depth = Math.max(1, this.getClearedStageCount() + 1);
    return {
      goldPerHour: 110 + depth * 38,
      xpPerHour: 60 + depth * 24,
      crystalsPerInterval: 12 + Math.floor(depth / 5) * 2,
      intervalMs: IDLE_CRYSTAL_INTERVAL_MS,
      capMs: IDLE_REWARD_CAP_MS,
      stageDepth: depth,
    };
  }

  getIdleRewardPreview(now = Date.now()) {
    const idle = this.saveData.idle || {};
    const rates = this.getIdleRewardRates();
    const elapsedMs = clamp(Math.max(0, now - (idle.lastClaimTime || now)), 0, rates.capMs);
    const hours = elapsedMs / (60 * 60 * 1000);
    const fullCrystalIntervals = Math.floor(elapsedMs / rates.intervalMs);
    return {
      elapsedMs,
      capMs: rates.capMs,
      capped: elapsedMs >= rates.capMs,
      hours,
      rates,
      rewards: {
        gold: Math.floor(rates.goldPerHour * hours),
        xp: Math.floor(rates.xpPerHour * hours),
        crystals: fullCrystalIntervals * rates.crystalsPerInterval,
      },
    };
  }

  claimIdleRewards(now = Date.now()) {
    const preview = this.getIdleRewardPreview(now);
    const rewards = preview.rewards;
    const total = (rewards.gold || 0) + (rewards.xp || 0) + (rewards.crystals || 0);
    this.saveData.idle.lastClaimTime = now;
    if (total <= 0) {
      this.save();
      return { ok: false, message: 'No idle rewards ready yet.', rewards };
    }
    this.addCurrency(CURRENCY.GOLD, rewards.gold || 0);
    this.addCurrency(CURRENCY.CRYSTALS, rewards.crystals || 0);
    this.addXP(rewards.xp || 0);
    this.addLog(`Claimed idle tribute: +${rewards.gold} gold, +${rewards.xp} XP${rewards.crystals ? `, +${rewards.crystals} crystals` : ''}.`);
    this.save();
    return { ok: true, message: 'Idle rewards claimed.', rewards };
  }

  getRosterPower() {
    const synergy = this.getSquadSynergy();
    return this.getActiveHeroes().reduce((sum, hero) => sum + combatPowerFromStats(scaleStats(computeHeroStats(hero), synergy.statMultiplier)), 0);
  }

  getSquadSynergy() {
    const active = this.getActiveHeroes();
    const counts = active.reduce((map, hero) => {
      map[hero.affinity] = (map[hero.affinity] || 0) + 1;
      return map;
    }, {});
    const values = Object.values(counts);
    const uniqueCount = values.length;
    const largestCount = values.length ? Math.max(...values) : 0;
    let baseBonus = 0;
    let title = 'Scattered Oaths';
    let detail = 'Too many lone affinities to awaken a major court blessing.';

    if (largestCount >= 5) {
      baseBonus = 24;
      title = 'Sovereign Court';
      detail = 'Five champions of one affinity bind the whole warband into a single court.';
    } else if (largestCount === 4) {
      baseBonus = 18;
      title = 'Dominant Court';
      detail = 'Four heroes of one affinity seize control of the battle rhythm.';
    } else if (largestCount === 3) {
      baseBonus = 12;
      title = 'Triune Court';
      detail = 'Three aligned affinities create a strong offensive bond.';
    } else if (uniqueCount >= 3) {
      baseBonus = 6;
      title = 'Arcane Triad';
      detail = 'Flame, Frost, and Arcane form a balanced academy resonance.';
    }

    const bonusPct = baseBonus;
    const notes = [];
    if (baseBonus) notes.push(`+${baseBonus}% court blessing`);
    if (!notes.length) notes.push('No active blessing');

    return {
      counts,
      uniqueCount,
      largestCount,
      title,
      detail,
      bonusPct,
      summary: notes.join(' / '),
      statMultiplier: 1 + bonusPct / 100,
    };
  }

  getCampaignSummary(chapterId = this.expeditionProgress.chapterId || 'chapter-1') {
    const chapter = getChapterById(chapterId) || CHAPTER_DEFINITIONS[0];
    const locations = this.getLocationList(chapter.id);
    const total = locations.reduce((sum, item) => sum + item.total, 0);
    const cleared = locations.reduce((sum, item) => sum + item.cleared, 0);
    const requiredComplete = (chapter.requiredLocationIds || []).every((id) => this.getLocationProgress(id)?.complete);
    const fullComplete = locations.every((item) => item.complete);
    return {
      chapterId: chapter.id,
      region: chapter.chapter,
      name: chapter.name,
      total,
      cleared,
      percent: total ? Math.round((cleared / total) * 100) : 0,
      requiredComplete,
      fullComplete,
      chapterMapUnlocked: Boolean(this.expeditionProgress.chapterMapUnlocked),
      chapterSelectUnlocked: Boolean(this.expeditionProgress.chapterSelectUnlocked),
      activeLocationId: this.getActiveLocation()?.id || 'forest-gate',
      nextUnlock: this.expeditionProgress.chapterSelectUnlocked ? 'CHAPTER_TWO' : null,
      presentation: getRegionPresentation(chapter.chapter),
    };
  }

  getRegionCacheList() {
    return [];
  }

  claimRegionCache() {
    return { ok: false, message: 'Location milestone caches were retired. First-clear stage rewards are granted automatically.' };
  }

  getClearedStageCount() {
    return this.getClearedStageIds().size;
  }

  getQuestProgress(quest) {
    if (quest.metric === 'CLEAR_STAGES') return this.getClearedStageCount();
    if (quest.metric === 'OWN_HEROES') return this.heroes.length;
    if (quest.metric === 'ROSTER_POWER') return this.getRosterPower();
    if (quest.metric === 'CLEAR_REGION') return this.expeditionProgress.chapterSelectUnlocked ? 1 : 0;
    return 0;
  }

  getQuestList() {
    return QUEST_DEFINITIONS.map((quest) => {
      const progress = this.getQuestProgress(quest);
      const claimed = this.saveData.questClaims.includes(quest.id);
      return {
        ...quest,
        progress,
        percent: Math.min(100, Math.floor((progress / Math.max(1, quest.target)) * 100)),
        complete: progress >= quest.target,
        claimed,
      };
    });
  }

  claimQuest(questId) {
    const quest = this.getQuestList().find((item) => item.id === questId);
    if (!quest) return { ok: false, message: 'Quest not found.' };
    if (quest.claimed) return { ok: false, message: 'Quest already claimed.' };
    if (!quest.complete) return { ok: false, message: 'Quest is not complete yet.' };
    const rewards = quest.rewards || {};
    this.addCurrency(CURRENCY.GOLD, rewards.gold || 0);
    this.addCurrency(CURRENCY.CRYSTALS, rewards.crystals || 0);
    this.addCurrency(CURRENCY.PREMIUM_CRYSTALS, rewards.premiumCrystals || 0);
    this.addCurrency(CURRENCY.AWAKENING_SHARDS, rewards.awakeningShards || 0);
    this.saveData.questClaims.push(quest.id);
    this.addLog(`Quest complete: ${quest.title}.`);
    this.save();
    return { ok: true, message: 'Quest reward claimed.', rewards };
  }

  getStageThreat(stageId) {
    const stage = getStageById(stageId);
    if (!stage) return { label: 'UNKNOWN', ratio: 0, recommendedPower: 0, enemyPower: 0 };
    const rosterPower = this.getRosterPower();
    const recommendedPower = stage.recommendedPower || stagePower(stage);
    const ratio = rosterPower / Math.max(1, recommendedPower);
    const label = ratio >= 1.35 ? 'EASY' : ratio >= 0.96 ? 'FAIR' : ratio >= 0.72 ? 'HARD' : 'DEADLY';
    return { label, ratio, recommendedPower, enemyPower: stagePower(stage) };
  }

  getHero(heroId) {
    return this.heroes.find((hero) => hero.id === heroId) || null;
  }

  getActiveHeroes() {
    return this.saveData.activeSquad
      .map((entry) => ({ entry, hero: this.getHero(entry.heroId) }))
      .filter(({ hero }) => hero)
      .slice(0, 5)
      .map(({ entry, hero }) => ({ ...hero, row: entry.row || hero.defaultRow || CLASS_DEFAULTS[hero.heroClass]?.row || 'FRONT', formationSlot: entry.slotIndex }));
  }

  normalizeActiveSquad(entries, heroes = this.heroes) {
    const knownHeroes = new Map(heroes.map((hero) => [hero.id, hero]));
    const counts = { FRONT: 0, BACK: 0 };
    const used = new Set();
    const normalized = [];
    for (const entry of entries || []) {
      const heroId = typeof entry === 'string' ? entry : entry?.heroId;
      const hero = knownHeroes.get(heroId);
      if (!hero || used.has(heroId) || normalized.length >= 5) continue;
      const preferredRow = entry?.row === 'BACK' || entry?.row === 'FRONT'
        ? entry.row
        : hero.defaultRow || CLASS_DEFAULTS[hero.heroClass]?.row || 'FRONT';
      const fallbackRow = preferredRow === 'FRONT' ? 'BACK' : 'FRONT';
      const row = counts[preferredRow] < FORMATION_LIMITS[preferredRow] ? preferredRow : fallbackRow;
      if (counts[row] >= FORMATION_LIMITS[row]) continue;
      counts[row] += 1;
      used.add(heroId);
      normalized.push({ heroId, row, slotIndex: Number.isInteger(entry?.slotIndex) ? entry.slotIndex : null });
    }
    for (const row of ['FRONT', 'BACK']) {
      const members = normalized.filter((entry) => entry.row === row);
      const preferred = row === 'FRONT' ? [0, 1]
        : members.length === 1 ? [1] : members.length === 2 ? [0, 2] : [0, 1, 2];
      const occupied = new Set();
      for (const entry of members) {
        if (entry.slotIndex == null || entry.slotIndex < 0 || entry.slotIndex >= FORMATION_LIMITS[row] || occupied.has(entry.slotIndex)) entry.slotIndex = null;
        else occupied.add(entry.slotIndex);
      }
      for (const entry of members) {
        if (entry.slotIndex != null) continue;
        entry.slotIndex = [...preferred, ...Array.from({ length: FORMATION_LIMITS[row] }, (_, i) => i)]
          .find((index) => !occupied.has(index));
        occupied.add(entry.slotIndex);
      }
    }
    return normalized;
  }

  getFormationRows() {
    const active = this.getActiveHeroes();
    return {
      FRONT: active.filter((hero) => hero.row === 'FRONT').sort((a, b) => a.formationSlot - b.formationSlot),
      BACK: active.filter((hero) => hero.row === 'BACK').sort((a, b) => a.formationSlot - b.formationSlot),
    };
  }

  getFormationCounts() {
    const rows = this.getFormationRows();
    return {
      FRONT: rows.FRONT.length,
      BACK: rows.BACK.length,
      total: rows.FRONT.length + rows.BACK.length,
      limits: FORMATION_LIMITS,
    };
  }

  chooseFormationRow(hero, preferredRow = hero.defaultRow || CLASS_DEFAULTS[hero.heroClass]?.row || 'FRONT') {
    const counts = this.getFormationCounts();
    const fallbackRow = preferredRow === 'FRONT' ? 'BACK' : 'FRONT';
    if (counts[preferredRow] < FORMATION_LIMITS[preferredRow]) return preferredRow;
    if (counts[fallbackRow] < FORMATION_LIMITS[fallbackRow]) return fallbackRow;
    return null;
  }

  toggleSquad(heroId) {
    const existingIndex = this.saveData.activeSquad.findIndex((entry) => entry.heroId === heroId);
    if (existingIndex >= 0) {
      if (this.saveData.activeSquad.length > 1) this.saveData.activeSquad.splice(existingIndex, 1);
      this.save();
      return;
    }
    if (this.saveData.activeSquad.length >= 5) return;
    const hero = this.getHero(heroId);
    if (!hero) return;
    const row = this.chooseFormationRow(hero);
    if (!row) return;
    this.saveData.activeSquad = this.normalizeActiveSquad([...this.saveData.activeSquad, { heroId, row }]);
    this.save();
  }

  placeHeroInFormation(heroId, row, slotIndex) {
    if (!this.getHero(heroId) || !['FRONT', 'BACK'].includes(row)) return false;
    const limit = FORMATION_LIMITS[row];
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= limit) return false;
    const squad = this.normalizeActiveSquad(this.saveData.activeSquad).map((entry) => ({ ...entry }));
    const source = squad.find((entry) => entry.heroId === heroId);
    const destination = squad.find((entry) => entry.row === row && entry.slotIndex === slotIndex);
    if (source?.heroId === destination?.heroId) return true;
    if (!source && squad.length >= 5 && !destination) return false;
    // Swapping with an occupied slot keeps the five-member limit and both row caps.
    if (destination && source) {
      destination.row = source.row;
      destination.slotIndex = source.slotIndex;
    }
    if (source) { source.row = row; source.slotIndex = slotIndex; }
    else if (destination) {
      squad.splice(squad.indexOf(destination), 1);
      squad.push({ heroId, row, slotIndex });
    } else squad.push({ heroId, row, slotIndex });
    const next = squad;
    if (next.length > 5 || next.filter((entry) => entry.row === row).length > limit
      || next.filter((entry) => entry.row !== row).length > FORMATION_LIMITS[row === 'FRONT' ? 'BACK' : 'FRONT']) return false;
    this.saveData.activeSquad = this.normalizeActiveSquad(next);
    this.save();
    return true;
  }

  setHeroRow(heroId, row) {
    if (row !== 'FRONT' && row !== 'BACK') return false;
    const entry = this.saveData.activeSquad.find((item) => item.heroId === heroId);
    if (!entry) return false;
    const counts = this.getFormationCounts();
    if (entry.row === row) return true;
    if (counts[row] >= FORMATION_LIMITS[row]) return false;
    entry.row = row;
    entry.slotIndex = null;
    this.saveData.activeSquad = this.normalizeActiveSquad(this.saveData.activeSquad);
    this.save();
    return true;
  }

  spend(currency, amount) {
    if ((this.currencies[currency] || 0) < amount) return false;
    this.currencies[currency] -= amount;
    return true;
  }

  addCurrency(currency, amount) {
    this.currencies[currency] = (this.currencies[currency] || 0) + amount;
  }

  addXP(amount) {
    for (const hero of this.heroes) {
      hero.xp = (hero.xp || 0) + amount;
    }
  }

  levelCost(hero) {
    return 40 + hero.level * 30;
  }

  xpThreshold(hero) {
    return 80 + hero.level * 70;
  }

  levelUp(heroId) {
    const hero = this.getHero(heroId);
    if (!hero) return { ok: false, message: 'Hero not found.' };
    const xpCost = this.xpThreshold(hero);
    const goldCost = this.levelCost(hero);
    if ((hero.xp || 0) < xpCost) return { ok: false, message: 'Not enough XP.' };
    if (!this.spend(CURRENCY.GOLD, goldCost)) return { ok: false, message: 'Not enough gold.' };
    hero.xp -= xpCost;
    hero.level += 1;
    this.addLog(`${hero.name} reached level ${hero.level}.`);
    this.save();
    return { ok: true, message: `${hero.name} leveled up.` };
  }

  addHeroFromDefinition(definition, rarity = definition.rarity) {
    const existing = this.heroes.find((hero) => hero.heroDefId === definition.id);
    if (existing) {
      const shards = SHARD_VALUES[rarity] || 1;
      existing.awakeningShards = (existing.awakeningShards || 0) + shards;
      this.addCurrency(CURRENCY.AWAKENING_SHARDS, shards);
      return { hero: existing, isNew: false, shards };
    }
    const hero = createHeroInstance(definition, { rarity });
    this.heroes.push(hero);
    if (this.saveData.activeSquad.length < 5) {
      const row = this.chooseFormationRow(hero);
      if (row) this.saveData.activeSquad.push({ heroId: hero.id, row });
    }
    return { hero, isNew: true, shards: 0 };
  }

  applyMilestone(milestone) {
    if (milestone.type === 'unlockSystem') {
      this.unlock(milestone.system);
    }
    if (milestone.type === 'giftHero') {
      const definition = getHeroDefinition(milestone.heroDefId);
      if (definition) {
        const result = this.addHeroFromDefinition(definition);
        if (result.isNew) this.addLog(milestone.hint);
      }
    }
  }

  makePlayerCombatants(stage = null) {
    const synergy = this.getSquadSynergy();
    return this.getActiveHeroes().map((hero) => {
      const stats = scaleStats(computeHeroStats(hero), synergy.statMultiplier);
      // Presentation trial: keep trainees alive across the longer encounters.
      if (stage) stats.hp = Math.floor(stats.hp * 1.5);
      return {
        id: hero.id,
        heroId: hero.id,
        heroDefId: hero.heroDefId,
        name: hero.name,
        heroClass: hero.heroClass,
        affinity: hero.affinity,
        rarity: hero.rarity,
        row: hero.row,
        formationSlot: hero.formationSlot,
        side: 'player',
        stats,
        maxHp: stats.hp,
        hp: stats.hp,
        barrier: 0,
        guardActions: 0,
        burnActions: 0,
        burnDamage: 0,
        chillActions: 0,
        stunActions: 0,
        normalActionCount: 0,
        ultimateCharge: 0,
        basicAbility: hero.basicAbility,
        skillAbility: hero.skillAbility,
        ultimateAbility: hero.ultimateAbility,
        ultimateName: hero.ultimateAbilityId,
      };
    });
  }

  makeEnemyCombatants(stage) {
    return stage.enemies.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      heroClass: enemy.heroClass,
      affinity: enemy.affinity,
      rarity: 'COMMON',
      row: enemy.row,
      side: 'enemy',
      isBoss: stage.encounterType === 'BOSS' && enemy.name === stage.name,
      stats: enemy.stats,
      maxHp: enemy.stats.hp,
      hp: enemy.stats.hp,
      barrier: 0,
      guardActions: 0,
      burnActions: 0,
      burnDamage: 0,
      chillActions: 0,
      stunActions: 0,
      normalActionCount: 0,
      ultimateCharge: 0,
      basicAbility: enemy.basicAbility,
      skillAbility: enemy.skillAbility,
      ultimateAbility: enemy.ultimateAbility,
      ultimateName: enemy.ultimateAbility?.id || `${enemy.name} Surge`,
    }));
  }

  beginBattle(stageId = this.getCurrentStage()?.id) {
    const stage = getStageById(stageId);
    if (!stage || !this.canBattleStage(stage.id)) return null;
    this.battle = {
      stageId: stage.id,
      tick: 0,
      result: null,
      collected: false,
      rewardReceipt: null,
      player: this.makePlayerCombatants(stage),
      enemies: this.makeEnemyCombatants(stage),
      log: [`Battle started: ${stage.id} ${stage.name}`],
      events: [],
      eventSequence: 0,
      presentationActionKind: null,
      lastHitId: null,
      lastActorId: null,
      lastTargetId: null,
      lastAction: null,
    };
    return this.battle;
  }

  recordBattleEvent(event) {
    if (!this.battle) return;
    this.battle.eventSequence = (this.battle.eventSequence || 0) + 1;
    const actionKind = event.actionKind
      || (event.type === 'skill' || event.type === 'ultimate' ? event.type : this.battle.presentationActionKind);
    const stamped = {
      eventId: this.battle.eventSequence,
      turn: this.battle.tick,
      ...event,
      ...(actionKind ? { actionKind } : {}),
    };
    this.battle.events.push(stamped);
    this.battle.events = this.battle.events.slice(-8);
    this.battle.lastAction = stamped;
    if (event.actorId) this.battle.lastActorId = event.actorId;
    if (event.targetId) this.battle.lastTargetId = event.targetId;
  }

  getLiving(side) {
    const list = side === 'player' ? this.battle?.player : this.battle?.enemies;
    return (list || []).filter((combatant) => combatant.hp > 0);
  }

  chooseTarget(targets) {
    const front = targets.filter((target) => target.row === 'FRONT');
    const guarded = front.filter((target) => target.guardActions > 0);
    const pool = guarded.length ? guarded : front.length ? front : targets;
    return pool[Math.floor(this.random() * pool.length)] || null;
  }

  lowestHealthTarget(targets, row = null) {
    const living = targets.filter((target) => target.hp > 0 && (!row || target.row === row));
    return living.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.hp - b.hp)[0] || null;
  }

  calculateDamage(attacker, target, power = 1) {
    const raw = attacker.stats.damage * power * (1 + this.random() * 0.18);
    const reduced = raw * (1 - target.stats.defense / (target.stats.defense + 500));
    return Math.max(1, Math.floor(reduced * affinityMultiplier(attacker, target)));
  }

  hit(attacker, target, amount, abilityName = null) {
    const absorbed = Math.min(target.barrier || 0, amount);
    target.barrier = Math.max(0, (target.barrier || 0) - absorbed);
    const healthDamage = Math.max(0, amount - absorbed);
    target.hp = Math.max(0, target.hp - healthDamage);
    this.battle.lastHitId = target.id;
    this.recordBattleEvent({
      type: 'damage',
      actorId: attacker?.id || null,
      targetId: target.id,
      actorName: attacker?.name || abilityName || 'Status effect',
      targetName: target.name,
      abilityName,
      amount: healthDamage,
      absorbed,
      targetHp: target.hp,
      targetMaxHp: target.maxHp,
      targetBarrier: target.barrier,
    });
    const barrierText = absorbed ? ` (${absorbed} barrier)` : '';
    this.battle.log.push(`${attacker?.name || abilityName || 'Status effect'} hit ${target.name} for ${healthDamage}${barrierText}.`);
    if (target.hp <= 0) this.battle.log.push(`${target.name} fell.`);
    this.battle.log = this.battle.log.slice(-5);
    return healthDamage;
  }

  healTarget(attacker, target, amount, abilityName) {
    if (!target) return false;
    const applied = Math.min(amount, target.maxHp - target.hp);
    if (applied <= 0) return false;
    target.hp += applied;
    this.recordBattleEvent({
      type: 'heal',
      actorId: attacker.id,
      targetId: target.id,
      actorName: attacker.name,
      targetName: target.name,
      abilityName,
      amount: applied,
      targetHp: target.hp,
      targetMaxHp: target.maxHp,
    });
    this.battle.log.push(`${attacker.name} healed ${target.name} for ${applied}.`);
    this.battle.log = this.battle.log.slice(-5);
    return true;
  }

  healLowest(attacker, targets, power, abilityName) {
    const target = this.lowestHealthTarget(targets.filter((unit) => unit.hp < unit.maxHp));
    return this.healTarget(attacker, target, Math.max(1, Math.floor(attacker.stats.damage * power)), abilityName);
  }

  grantBarrier(attacker, targets, power, abilityName) {
    const amount = Math.max(1, Math.floor(attacker.stats.damage * power));
    for (const target of targets.filter((unit) => unit?.hp > 0)) {
      const cap = Math.max(1, Math.floor(target.maxHp * 0.6));
      const before = target.barrier || 0;
      target.barrier = Math.min(cap, before + amount);
      const applied = target.barrier - before;
      if (applied <= 0) continue;
      this.recordBattleEvent({
        type: 'barrier',
        actorId: attacker.id,
        targetId: target.id,
        actorName: attacker.name,
        targetName: target.name,
        abilityName,
        amount: applied,
        targetBarrier: target.barrier,
      });
    }
  }

  applyBurn(attacker, target, ability) {
    if (!target || target.hp <= 0) return;
    if (this.random() >= (ability.statusChance ?? 1)) return;
    target.burnActions = Math.max(target.burnActions || 0, ability.duration || 1);
    target.burnDamage = Math.max(target.burnDamage || 0, Math.max(1, Math.floor(attacker.stats.damage * (ability.statusPower || 0.25))));
    target.burnSourceId = attacker.id;
  }

  applyChill(target, duration = 1) {
    if (!target || target.hp <= 0) return;
    target.chillActions = Math.max(target.chillActions || 0, duration);
  }

  applyStun(target, chance) {
    if (!target || target.hp <= 0 || target.stunActions > 0 || this.random() >= chance) return;
    target.stunActions = 1;
  }

  recordAbilityEvent(type, combatant, ability) {
    this.recordBattleEvent({
      type,
      actorId: combatant.id,
      actorName: combatant.name,
      abilityName: ability.id,
    });
    this.battle.log.push(`${combatant.name} used ${ability.id}.`);
    this.battle.log = this.battle.log.slice(-5);
  }

  executeAbility(combatant, ability) {
    const allies = combatant.side === 'player' ? this.battle.player : this.battle.enemies;
    const enemies = combatant.side === 'player' ? this.battle.enemies : this.battle.player;
    const livingAllies = allies.filter((unit) => unit.hp > 0);
    const livingEnemies = enemies.filter((unit) => unit.hp > 0);
    const hitTarget = (target, power = ability.power || 1) => {
      if (!target || target.hp <= 0) return;
      this.hit(combatant, target, this.calculateDamage(combatant, target, power), ability.id);
    };

    switch (ability.effect) {
      case 'BARRIER_GUARD_SELF':
        this.grantBarrier(combatant, [combatant], ability.power || 1, ability.id);
        combatant.guardActions = Math.max(combatant.guardActions || 0, ability.duration || 1);
        break;
      case 'CHARGE_SPLASH_BARRIER': { 
        const primary = this.chooseTarget(livingEnemies);
        hitTarget(primary, ability.power);
        livingEnemies.filter((target) => target.id !== primary?.id).slice(0, 2).forEach((target) => hitTarget(target, ability.splashPower || 0.8));
        this.grantBarrier(combatant, [combatant], ability.barrierPower || 1, ability.id);
        break;
      }
      case 'DAMAGE_BURN': { 
        const target = this.chooseTarget(livingEnemies);
        hitTarget(target);
        this.applyBurn(combatant, target, ability);
        break;
      }
      case 'DAMAGE_ALL_BURN':
        livingEnemies.forEach((target) => {
          hitTarget(target);
        });
        this.applyBurn(combatant, this.chooseTarget(livingEnemies.filter((target) => target.hp > 0)), ability);
        break;
      case 'HEAL_LOWEST':
        this.healLowest(combatant, livingAllies, ability.power || 1, ability.id);
        break;
      case 'HEAL_ALL_BARRIER':
        livingAllies.forEach((target) => this.healTarget(combatant, target, Math.max(1, Math.floor(combatant.stats.damage * (ability.power || 1))), ability.id));
        this.grantBarrier(combatant, livingAllies, ability.barrierPower || 0.5, ability.id);
        break;
      case 'BARRIER_LOWEST':
        this.grantBarrier(combatant, [this.lowestHealthTarget(livingAllies)], ability.power || 1, ability.id);
        break;
      case 'DAMAGE_ALL_CHILL':
        livingEnemies.forEach((target) => {
          hitTarget(target);
          this.applyChill(target, ability.duration || 1);
        });
        break;
      case 'DAMAGE_ALL_STUN': {
        livingEnemies.forEach((target) => hitTarget(target));
        this.applyStun(this.chooseTarget(livingEnemies.filter((target) => target.hp > 0)), ability.stunChance ?? 0.25);
        break;
      }
      case 'DAMAGE_LOWEST':
        hitTarget(this.lowestHealthTarget(livingEnemies));
        break;
      case 'THREE_HITS':
        for (let index = 0; index < (ability.hits || 3); index += 1) {
          const targets = enemies.filter((target) => target.hp > 0);
          if (!targets.length) break;
          hitTarget(targets[index % targets.length]);
        }
        break;
      case 'BARRIER_TWO':
        this.grantBarrier(combatant, [...livingAllies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, 2), ability.power || 1, ability.id);
        break;
      case 'BARRIER_ALL_GUARD':
        this.grantBarrier(combatant, livingAllies, ability.power || 1, ability.id);
        combatant.guardActions = Math.max(combatant.guardActions || 0, ability.duration || 1);
        break;
      case 'DAMAGE_BACK_LOWEST':
        hitTarget(this.lowestHealthTarget(livingEnemies, 'BACK') || this.chooseTarget(livingEnemies));
        break;
      case 'THREE_LOWEST':
        for (let index = 0; index < (ability.hits || 3); index += 1) {
          const target = this.lowestHealthTarget(enemies);
          if (!target) break;
          hitTarget(target);
        }
        break;
      case 'HEAL_ALL_CLEANSE':
        livingAllies.forEach((target) => {
          this.healTarget(combatant, target, Math.max(1, Math.floor(combatant.stats.damage * (ability.power || 1))), ability.id);
          target.burnActions = 0;
          target.burnDamage = 0;
          target.chillActions = 0;
          target.stunActions = 0;
        });
        break;
      case 'DAMAGE_ALL':
        livingEnemies.forEach((target) => hitTarget(target));
        break;
      case 'DAMAGE_CHILL': { 
        const target = this.chooseTarget(livingEnemies);
        hitTarget(target);
        this.applyChill(target, ability.duration || 1);
        break;
      }
      case 'DAMAGE':
      default:
        hitTarget(this.chooseTarget(livingEnemies));
        break;
    }
    this.checkBattleEnd();
  }

  useSkill(combatant) {
    const ability = combatant.skillAbility || { id: 'Focused Skill', effect: 'DAMAGE_LOWEST', power: 1.3 };
    const previousActionKind = this.battle.presentationActionKind;
    this.battle.presentationActionKind = 'skill';
    try {
      this.recordAbilityEvent('skill', combatant, ability);
      this.executeAbility(combatant, ability);
    } finally {
      this.battle.presentationActionKind = previousActionKind;
    }
  }

  useUltimate(combatantId) {
    if (!this.battle || this.battle.result) return false;
    const combatant = [...this.battle.player, ...this.battle.enemies].find((unit) => unit.id === combatantId);
    if (!combatant || combatant.ultimateCharge < 100 || combatant.hp <= 0) return false;
    combatant.ultimateCharge = 0;
    const ability = combatant.ultimateAbility || { id: combatant.ultimateName || 'Ultimate', effect: 'DAMAGE_ALL', power: 1.25 };
    const previousActionKind = this.battle.presentationActionKind;
    this.battle.presentationActionKind = 'ultimate';
    try {
      this.recordAbilityEvent('ultimate', combatant, ability);
      this.executeAbility(combatant, ability);
    } finally {
      this.battle.presentationActionKind = previousActionKind;
    }
    return true;
  }

  advanceActionEffects(combatant) {
    if (combatant.burnActions > 0) {
      combatant.burnActions -= 1;
      const source = [...this.battle.player, ...this.battle.enemies].find((unit) => unit.id === combatant.burnSourceId) || null;
      this.hit(source, combatant, combatant.burnDamage || 1, 'Burn');
      if (combatant.burnActions <= 0) combatant.burnDamage = 0;
      this.checkBattleEnd();
      if (combatant.hp <= 0 || this.battle.result) return false;
    }
    if (combatant.chillActions > 0) {
      combatant.chillActions -= 1;
      this.recordBattleEvent({ type: 'status', actorId: combatant.id, targetId: combatant.id, actorName: combatant.name, targetName: combatant.name, abilityName: 'Chill' });
      return false;
    }
    if (combatant.stunActions > 0) {
      combatant.stunActions -= 1;
      this.recordBattleEvent({ type: 'status', actorId: combatant.id, targetId: combatant.id, actorName: combatant.name, targetName: combatant.name, abilityName: 'Stun' });
      return false;
    }
    return true;
  }

  stepBattle() {
    if (!this.battle || this.battle.result) return this.battle;
    this.battle.tick += 1;
    const actionOrder = [...this.getLiving('player'), ...this.getLiving('enemy')].sort((a, b) => b.stats.damage - a.stats.damage);
    for (const combatant of actionOrder) {
      if (this.battle.result || combatant.hp <= 0) continue;
      const previousGuardActions = combatant.guardActions || 0;
      if (!this.advanceActionEffects(combatant)) {
        if (previousGuardActions > 0) combatant.guardActions = Math.max(0, previousGuardActions - 1);
        continue;
      }
      combatant.ultimateCharge = clamp(combatant.ultimateCharge + 22, 0, 100);
      if (combatant.ultimateCharge >= 100 && combatant.side === 'enemy') {
        this.useUltimate(combatant.id);
        if (previousGuardActions > 0) combatant.guardActions = Math.max(0, previousGuardActions - 1);
        continue;
      }
      combatant.normalActionCount = (combatant.normalActionCount || 0) + 1;
      if (combatant.normalActionCount % 3 === 0) this.useSkill(combatant);
      else this.executeAbility(combatant, combatant.basicAbility || { id: 'Basic Attack', effect: 'DAMAGE', power: 1 });
      if (previousGuardActions > 0) combatant.guardActions = Math.max(0, previousGuardActions - 1);
    }
    this.checkBattleEnd();
    return this.battle;
  }

  checkBattleEnd() {
    if (!this.battle) return null;
    const playerAlive = this.battle.player.some((unit) => unit.hp > 0);
    const enemyAlive = this.battle.enemies.some((unit) => unit.hp > 0);
    if (!enemyAlive) this.battle.result = 'player_win';
    if (!playerAlive) this.battle.result = 'enemy_win';
    return this.battle.result;
  }

  collectBattleRewards() {
    if (!this.battle || this.battle.result !== 'player_win' || this.battle.collected) return null;
    const stage = getStageById(this.battle.stageId);
    if (!stage) return null;
    const firstClear = !this.isStageCleared(stage.id);
    const rewards = firstClear ? stage.rewards : { gold: 0, xp: 0, crystals: 0, premiumCrystals: 0 };
    const milestoneRewards = [];
    this.battle.collected = true;
    this.addCurrency(CURRENCY.GOLD, rewards.gold || 0);
    this.addCurrency(CURRENCY.CRYSTALS, rewards.crystals || 0);
    this.addCurrency(CURRENCY.PREMIUM_CRYSTALS, rewards.premiumCrystals || 0);
    this.addXP(rewards.xp || 0);

    let locationComplete = false;
    let revealChapterMap = false;
    let chapterComplete = false;
    let cosmeticUnlocked = null;

    if (firstClear) {
      this.expeditionProgress.clearedStageIds.push(stage.id);
      this.expeditionProgress.clearedStageIds = Array.from(new Set(this.expeditionProgress.clearedStageIds));
      this.expeditionProgress.activeLocationId = stage.locationId;
      this.expeditionProgress.lastActiveLocationId = stage.locationId;
      for (const milestone of stage.milestoneRewards || []) {
        this.applyMilestone(milestone);
        milestoneRewards.push(milestone);
      }

      const locationProgress = this.getLocationProgress(stage.locationId);
      locationComplete = Boolean(locationProgress?.complete);
      if (stage.locationId === 'forest-gate' && locationComplete && !this.expeditionProgress.chapterMapUnlocked) {
        this.expeditionProgress.chapterMapUnlocked = true;
        this.expeditionProgress.pendingChapterMapReveal = true;
        revealChapterMap = true;
      }
      if (stage.locationId === 'heart-of-the-curse' && locationComplete) {
        this.expeditionProgress.chapterSelectUnlocked = true;
        chapterComplete = true;
      }

      const summary = this.getCampaignSummary(stage.chapterId);
      const chapter = getChapterById(stage.chapterId);
      if (summary.fullComplete && chapter?.completionCosmetic && !this.expeditionProgress.cosmetics.includes(chapter.completionCosmetic)) {
        this.expeditionProgress.cosmetics.push(chapter.completionCosmetic);
        cosmeticUnlocked = chapter.completionCosmetic;
      }
    }

    const rewardParts = [
      rewards.gold ? `+${rewards.gold} gold` : '',
      rewards.xp ? `+${rewards.xp} XP` : '',
      rewards.crystals ? `+${rewards.crystals} crystals` : '',
      rewards.premiumCrystals ? `+${rewards.premiumCrystals} Lumens` : '',
    ].filter(Boolean).join(', ');
    this.addLog(firstClear ? `Cleared ${stage.locationName} ${stage.stage}: ${rewardParts}.` : `Completed stage ${stage.locationName} ${stage.stage} cannot grant rewards again.`);
    const nextStageId = this.getLocationProgress(stage.locationId)?.currentStageId || null;
    const receipt = {
      stageId: stage.id,
      locationId: stage.locationId,
      firstClear,
      rewards,
      milestoneRewards,
      nextStageId,
      locationComplete,
      revealChapterMap,
      chapterComplete,
      cosmeticUnlocked,
    };
    this.battle.rewardReceipt = receipt;
    this.save();
    return receipt;
  }

  getBannerConfig(bannerType) {
    return BANNER_CONFIG[bannerType] || BANNER_CONFIG.BASIC;
  }

  canUseBanner(bannerType) {
    const config = this.getBannerConfig(bannerType);
    return bannerType === 'BASIC' ? this.isUnlocked(config.unlockKey) : this.isUnlocked(config.unlockKey);
  }

  pickSummonRarity(bannerType) {
    const config = this.getBannerConfig(bannerType);
    const nextPity = (this.saveData.summon.pityCounters[bannerType] || 0) + 1;
    if (nextPity >= config.pityMax) return config.pityRarity;
    const weights = { ...BANNER_RATES[bannerType] };
    if (bannerType === 'BASIC' && nextPity >= 25) weights.EPIC *= 1 + (nextPity - 24) * 7;
    if (bannerType === 'ADVANCED' && nextPity >= 60) weights.LEGENDARY *= 1 + (nextPity - 59) * 5;
    return pickWeighted(weights, this.random);
  }

  pickHeroDefinitionByRarity(rarity) {
    const pool = HERO_DEFINITIONS.filter((definition) => definition.rarity === rarity);
    return pool[Math.floor(this.random() * pool.length)] || HERO_DEFINITIONS[0];
  }

  pull(bannerType = 'BASIC', count = 1) {
    const config = this.getBannerConfig(bannerType);
    const cost = count === 10 ? config.cost10 : config.cost1;
    if (!this.canUseBanner(bannerType)) return { ok: false, message: 'Banner locked.', results: [] };
    if (!this.spend(config.currency, cost)) return { ok: false, message: 'Not enough currency.', results: [] };
    const results = [];
    for (let i = 0; i < count; i += 1) {
      const rarity = count === 10 && i === count - 1 && bannerType === 'ADVANCED'
        ? pickWeighted({ RARE: 55, EPIC: 35, LEGENDARY: 10 }, this.random)
        : this.pickSummonRarity(bannerType);
      const definition = this.pickHeroDefinitionByRarity(rarity);
      const result = this.addHeroFromDefinition(definition, rarity);
      this.saveData.summon.pityCounters[bannerType] = (this.saveData.summon.pityCounters[bannerType] || 0) + 1;
      if (rarity === config.pityRarity) this.saveData.summon.pityCounters[bannerType] = 0;
      results.push({ heroDefId: definition.id, name: definition.name, rarity, isNew: result.isNew, shards: result.shards });
    }
    this.saveData.summon.lastResults = results;
    this.addLog(`Summoned ${results.length} hero${results.length === 1 ? '' : 'es'}.`);
    this.save();
    return { ok: true, message: 'Summon complete.', results };
  }

  getStageList(locationId = null) {
    const stages = locationId ? getStagesForLocation(locationId) : STAGE_DEFINITIONS;
    return stages.map((stage) => {
      const progress = this.getLocationProgress(stage.locationId);
      const cleared = this.isStageCleared(stage.id);
      const current = progress?.currentStageId === stage.id;
      return {
        ...stage,
        region: getChapterById(stage.chapterId)?.chapter || 1,
        cleared,
        unlocked: Boolean(progress?.unlocked && (current || cleared)),
        current,
        battleable: this.canBattleStage(stage.id),
        rewardPreview: this.getStageRewardPreview(stage.id),
      };
    });
  }
}
