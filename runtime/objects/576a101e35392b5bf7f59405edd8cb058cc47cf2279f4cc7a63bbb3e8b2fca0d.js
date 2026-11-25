import { ENEMY_BASE_STATS, ENEMY_ABILITY_OVERRIDES, ENEMY_BALANCE_STAGES, ENEMY_RANKS, ENEMY_BOSS_SPECIES } from './enemy-balance.js';
import { compileContentPatch, cloneContent } from './content-schema.js';

export const CURRENCY = Object.freeze({
  // The persisted key preserves existing shared balances and reward payloads.
  GOLD: 'GOLD',
  LESSON_SCROLLS: 'LESSON_SCROLLS',
  CRYSTALS: 'CRYSTALS',
  PREMIUM_CRYSTALS: 'PREMIUM_CRYSTALS',
  FRAGMENTS: 'AWAKENING_SHARDS',
});

export const CURRENCY_LABEL = Object.freeze({
  GOLD: 'Gold',
  LESSON_SCROLLS: 'Lesson Scrolls',
  CRYSTALS: 'Crystals',
  PREMIUM_CRYSTALS: 'Lumens',
  AWAKENING_SHARDS: 'Fragments',
});

export const RARITY_ORDER = Object.freeze({
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
  MYTHIC: 5,
  ASCENDED: 6,
});

export const RARITY_COLORS = Object.freeze({
  COMMON: '#8d8d92',
  UNCOMMON: '#68c978',
  RARE: '#66a8ff',
  EPIC: '#b66dff',
  LEGENDARY: '#f3be57',
  MYTHIC: '#ff6464',
  ASCENDED: '#ff8ce3',
});

export const CLASS_DEFAULTS = Object.freeze({
  GUARDIAN: { row: 'FRONT', hp: 1400, damage: 70, defense: 125, speed: 85, crit: 5 },
  WARRIOR: { row: 'FRONT', hp: 1200, damage: 110, defense: 95, speed: 95, crit: 10 },
  STRIKER: { row: 'BACK', hp: 850, damage: 125, defense: 70, speed: 110, crit: 18 },
  ASSASSIN: { row: 'FRONT', hp: 800, damage: 140, defense: 60, speed: 125, crit: 22 },
  MAGE: { row: 'BACK', hp: 850, damage: 135, defense: 65, speed: 90, crit: 10 },
  MYSTIC: { row: 'BACK', hp: 1000, damage: 90, defense: 80, speed: 100, crit: 5 },
});

export const EQUIPMENT_RARITY_COLORS = Object.freeze({
  COMMON: '#a0a1a6',
  UNCOMMON: '#68c978',
  RARE: '#66a8ff',
  ELITE: '#b66dff',
  LEGENDARY: '#f3be57',
  MYTHIC: '#ff6464',
});

export const AFFINITY_ADVANTAGES = Object.freeze({
  FLAME: { strongVs: 'ARCANE', weakVs: 'FROST' },
  FROST: { strongVs: 'FLAME', weakVs: 'ARCANE' },
  ARCANE: { strongVs: 'FROST', weakVs: 'FLAME' },
});


export let PRESENTATION_CONFIG = Object.freeze({
  battle: Object.freeze({
    fieldSideMargin: 0,
    deckMinHeight: 122,
    deckViewportHeight: 15.5,
    deckMaxHeight: 136,
    deckSideMargin: 6,
    headerSideMargin: 8,
    headerTopInset: 0,
    controlSize: 48,
    fieldLabelOffset: 56,
    portraitMinHeight: 30,
    portraitViewportHeight: 4.5,
    portraitMaxHeight: 38,
    fieldDeckGap: 10,
    toastGap: 14,
    showFieldLabel: true,
    showStageSubtitle: true,
    backgroundCover: true,
    backgroundZoom: 100,
    backgroundPositionY: 50,
  }),
  shell: Object.freeze({
    hudTop: 8,
    hudSide: 8,
    hudHeight: 64,
    screenTop: 92,
    screenSide: 14,
    screenBottom: 114,
    navSide: 8,
    navBottom: 6,
    navHeight: 84,
    updateButtonRight: 12,
    updateButtonBottom: 84,
  }),
  combat: Object.freeze({
    characterScale: 0.34,
    bossScale: 0.38,
    frontTopY: 275,
    frontBottomY: 435,
    backTopY: 205,
    backMiddleY: 350,
    backBottomY: 500,
    playerFrontX: 160,
    playerReserveX: 104,
    playerCombatX: 165,
    playerBackGuardianX: 72,
    playerBackStrikerX: 70,
    playerBackMysticX: 68,
    enemyFrontX: 320,
    enemyReserveX: 376,
    enemyCombatX: 315,
    enemyBackGuardianX: 408,
    enemyBackStrikerX: 410,
    enemyBackMysticX: 412,
    effectScale: 1,
    floatScale: 1,
    motionSpeed: 1,
    tick1Ms: 1575,
    tick2Ms: 840,
    tick4Ms: 430,
    maxTransientEffects: 26,
  }),
  theme: Object.freeze({
    gold: '#d6ad5c',
    goldBright: '#f0cf82',
    bone: '#efe4cc',
    muted: '#a99e8c',
  }),
});

function combatAbility(id, effect, options = {}) {
  return Object.freeze({ id, effect, ...options });
}

export function getBattleFrontlineSlots(units, side) {
  const front = units.slice(0, 5).map((unit, sourceIndex) => ({ unit, sourceIndex }))
    .filter(({ unit }) => unit?.row !== 'BACK');
  if (side === 'enemy') {
    const isGuardian = (unit) => ['GUARDIAN', 'TANK', 'WARRIOR'].includes(unit?.heroClass);
    front.sort((a, b) => Number(Boolean(b.unit?.isBoss)) - Number(Boolean(a.unit?.isBoss))
      || Number(isGuardian(b.unit)) - Number(isGuardian(a.unit)));
  }
  const { frontTopY, frontBottomY, backTopY, backMiddleY, backBottomY } = PRESENTATION_CONFIG.combat;
  const denseFront = front.length >= 3 || front.some(({ unit }) => (
    unit?.formationSlot === 2 || (side === 'enemy' && unit?.formationSlot != null)
  ));
  const slotYs = denseFront ? [backTopY, backMiddleY, backBottomY] : [frontTopY, frontBottomY, backBottomY];
  const available = [0, 1, 2];
  return front.map((entry) => {
    const requested = entry.unit?.formationSlot;
    const index = available.includes(requested) ? available.indexOf(requested) : 0;
    const [slotIndex] = available.splice(index, 1);
    return { ...entry, slotIndex, formationY: slotYs[slotIndex] };
  });
}

// Shared by the live formation and rear-line target selection.
export function getBattleBacklineSlots(units) {
  const back = units.slice(0, 5).map((unit, sourceIndex) => ({ unit, sourceIndex }))
    .filter(({ unit }) => unit?.row === 'BACK').slice(0, 3);
  const preferred = back.length === 1 ? [1] : back.length === 2 ? [0, 2] : [0, 1, 2];
  const available = [...new Set([...preferred, 0, 1, 2])];
  const { backTopY, backMiddleY, backBottomY } = PRESENTATION_CONFIG.combat;
  const slotYs = [backTopY, backMiddleY, backBottomY];
  return back.map((entry) => {
    const requested = entry.unit.formationSlot;
    const index = available.includes(requested) ? available.indexOf(requested) : 0;
    const [slotIndex] = available.splice(index, 1);
    return { ...entry, slotIndex, formationY: slotYs[slotIndex] };
  });
}

export let HERO_DEFINITIONS = Object.freeze([
  { id: 'hero_cinder_vale', name: 'Cinder Vale', heroClass: 'GUARDIAN', affinity: 'FLAME', rarity: 'COMMON', defaultRow: 'FRONT', attackInterval: 1020, baseStats: { hp: 1370, defense: 122, damage: 74, speed: 89, crit: 6 }, basicAbility: combatAbility('Ember Punch', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Heated Guard', 'BARRIER_GUARD_SELF', { kind: 'PASSIVE', trigger: 'SELF_DAMAGED', cooldownMs: 5000, barrierMs: 2400, power: 1.8, duration: 2 }), ultimateAbility: combatAbility('Blazing Charge', 'CHARGE_SPLASH_BARRIER', { power: 2.25, splashPower: 0.9, barrierPower: 1.2 }) },
  { id: 'hero_pyreth_the_branded', name: 'Pyreth', heroClass: 'MAGE', affinity: 'FLAME', rarity: 'EPIC', summonTier: 'RARE', defaultRow: 'BACK', attackInterval: 950, baseStats: { hp: 1378, defense: 106, damage: 236, speed: 92, crit: 12 }, basicAbility: combatAbility('Ember Bolt', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Ignite', 'DAMAGE_BURN', { kind: 'ACTIVE', cooldownMs: 3200, power: 1.35, statusPower: 0.34, duration: 2 }), ultimateAbility: combatAbility('Conflagration', 'DAMAGE_ALL_BURN', { power: 1.55, statusPower: 0.3, duration: 2, statusChance: 0.35 }) },
  { id: 'hero_sera_ashveil', name: 'Sera Ashveil', heroClass: 'MYSTIC', affinity: 'FLAME', rarity: 'EPIC', defaultRow: 'BACK', attackInterval: 1130, baseStats: { hp: 1747, defense: 141, damage: 142, speed: 98, crit: 4 }, basicAbility: combatAbility('Ash Spark', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Cauterize', 'HEAL_OVER_TIME', { kind: 'PASSIVE', trigger: 'ALLY_BELOW_HALF', cooldownMs: 5000, power: 0.9, duration: 2 }), ultimateAbility: combatAbility('Pyre Bloom', 'HEAL_ALL_BARRIER', { power: 1.65, barrierPower: 0.7 }) },
  { id: 'hero_frost_warden_kael', name: 'Frost Warden Kael', heroClass: 'GUARDIAN', affinity: 'FROST', rarity: 'COMMON', summonTier: 'UNCOMMON', defaultRow: 'FRONT', attackInterval: 1310, baseStats: { hp: 1440, defense: 130, damage: 68, speed: 82, crit: 5 }, basicAbility: combatAbility('Frost Hammer', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Glacier Shield', 'BARRIER_LOWEST', { kind: 'ACTIVE', cooldownMs: 3200, power: 2 }), ultimateAbility: combatAbility('Absolute Zero', 'DAMAGE_ALL_STUN', { power: 1.35, stunChance: 0.25 }) },
  { id: 'hero_yssa_driftborn', name: 'Yssa Driftborn', heroClass: 'STRIKER', affinity: 'FROST', rarity: 'RARE', defaultRow: 'BACK', attackInterval: 810, baseStats: { hp: 1128, defense: 86, damage: 168, speed: 114, crit: 18 }, basicAbility: combatAbility('Cryo Shot', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Shatter Arrow', 'DAMAGE_WEAKEST', { kind: 'ACTIVE', cooldownMs: 3000, power: 1.65 }), ultimateAbility: combatAbility('Blizzard Barrage', 'THREE_HITS', { power: 1.15, hits: 3 }) },
  { id: 'hero_stone_sentinel_gorr', name: 'Stone Sentinel Gorr', heroClass: 'GUARDIAN', affinity: 'ARCANE', rarity: 'COMMON', defaultRow: 'FRONT', attackInterval: 1370, baseStats: { hp: 1470, defense: 133, damage: 65, speed: 79, crit: 4 }, basicAbility: combatAbility('Runic Slam', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Sigil Wall', 'BARRIER_TWO', { kind: 'PASSIVE', trigger: 'ALLY_DAMAGED', cooldownMs: 6000, barrierMs: 3000, power: 1.55 }), ultimateAbility: combatAbility('Living Bastion', 'BARRIER_ALL_GUARD', { power: 1.2, duration: 2 }) },
  { id: 'hero_dusk', name: 'Dusk', heroClass: 'ASSASSIN', affinity: 'ARCANE', rarity: 'RARE', defaultRow: 'FRONT', attackInterval: 760, baseStats: { hp: 998, defense: 77, damage: 188, speed: 130, crit: 24 }, basicAbility: combatAbility('Rift Cut', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Phase Step', 'DAMAGE_BACK_LOWEST', { kind: 'PASSIVE', trigger: 'FOURTH_BASIC', cooldownMs: 3000, power: 1.55 }), ultimateAbility: combatAbility('Nightfall', 'THREE_LOWEST', { power: 1.25, hits: 3 }) },
  { id: 'hero_lumen_solis', name: 'Lumen Solis', heroClass: 'MYSTIC', affinity: 'ARCANE', rarity: 'RARE', defaultRow: 'BACK', attackInterval: 1080, baseStats: { hp: 1309, defense: 106, damage: 110, speed: 102, crit: 5 }, basicAbility: combatAbility('Prism Bolt', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Lumen Mend', 'HEAL_LOWEST', { kind: 'ACTIVE', cooldownMs: 3200, power: 1.85 }), ultimateAbility: combatAbility('Grand Resonance', 'HEAL_ALL_CLEANSE', { power: 1.55 }) },
  { id: 'hero_tavian_emberstep', name: 'Tavian Emberstep', heroClass: 'WARRIOR', affinity: 'FLAME', rarity: 'COMMON', defaultRow: 'FRONT', attackInterval: 930, baseStats: { hp: 1160, defense: 91, damage: 115, speed: 99, crit: 11 }, basicAbility: combatAbility('Forge Cut', 'DAMAGE'), skillAbility: combatAbility('Cinder Feint', 'DAMAGE_FRONT', { kind: 'ACTIVE', cooldownMs: 3000, repeatTarget: true, power: 1.05, hits: 2 }), ultimateAbility: combatAbility('Ember Sweep', 'DAMAGE_FRONT', { power: 1.65 }) },
  { id: 'hero_neris_rimeweave', name: 'Neris Rimeweave', heroClass: 'MAGE', affinity: 'FROST', rarity: 'COMMON', defaultRow: 'BACK', attackInterval: 1130, baseStats: { hp: 830, defense: 66, damage: 132, speed: 91, crit: 10 }, basicAbility: combatAbility('Rime Shard', 'DAMAGE'), skillAbility: combatAbility('Chilling Thread', 'DAMAGE_CHILL', { kind: 'ACTIVE', cooldownMs: 3400, power: 1.25, duration: 1 }), ultimateAbility: combatAbility('Quiet Winter', 'DAMAGE_CLUSTER_FREEZE', { power: 1.35, hits: 3 }) },
  { id: 'hero_archmage_eloris', name: 'Archmage Eloris', heroClass: 'MAGE', affinity: 'LIGHT', rarity: 'LEGENDARY', defaultRow: 'BACK', attackInterval: 1140, baseStats: { hp: 1896, defense: 146, damage: 307, speed: 91, crit: 11 }, basicAbility: combatAbility('Holy Bolt', 'DAMAGE'), skillAbility: combatAbility('Arcane Amplify', 'AMPLIFY_ULTIMATE', { kind: 'PASSIVE', trigger: 'BEFORE_ULTIMATE', power: 1.25 }), ultimateAbility: combatAbility('Starfall', 'DAMAGE_CLUSTER', { power: 1.6, hits: 3 }) },
]);

export const LAUNCH_HERO_IDS = Object.freeze(HERO_DEFINITIONS.map((definition) => definition.id));

const LEGACY_HERO_DEFINITIONS = Object.freeze([
  { id: 'hero_vale_coldmantle', name: 'Vale Coldmantle', heroClass: 'ASSASSIN', affinity: 'ICE', rarity: 'EPIC', baseStats: { hp: 90, defense: 17, damage: 58 }, normalAbilityIds: ['Frostblade', 'Hypothermia'], ultimateAbilityId: "Winter's Edge" },
  { id: 'hero_briar_thornguard', name: 'Briar Thornguard', heroClass: 'WARRIOR', affinity: 'EARTH', rarity: 'RARE', baseStats: { hp: 136, defense: 29, damage: 31 }, normalAbilityIds: ['Thornstrike', 'Overgrowth'], ultimateAbilityId: 'Thorn Eruption' },
  { id: 'hero_mudra_the_shaper', name: 'Mudra', title: 'the Shaper', heroClass: 'MAGE', affinity: 'EARTH', rarity: 'UNCOMMON', baseStats: { hp: 84, defense: 17, damage: 44 }, normalAbilityIds: ['Rockslide', 'Sinkhole'], ultimateAbilityId: 'Avalanche' },
  { id: 'hero_vesper', name: 'Vesper', heroClass: 'HEALER', affinity: 'SHADOW', rarity: 'EPIC', baseStats: { hp: 116, defense: 24, damage: 20 }, normalAbilityIds: ['Dark Mend', 'Shadow Shroud'], ultimateAbilityId: 'Siphon Life' },
  { id: 'hero_hollow_gravyn', name: 'Hollow Gravyn', heroClass: 'WARRIOR', affinity: 'SHADOW', rarity: 'UNCOMMON', baseStats: { hp: 132, defense: 27, damage: 30 }, normalAbilityIds: ['Void Slash', 'Iron Resolve'], ultimateAbilityId: 'Cursed Surge' },
  { id: 'hero_crest_of_dawning', name: 'Crest of Dawning', heroClass: 'WARRIOR', affinity: 'LIGHT', rarity: 'EPIC', baseStats: { hp: 142, defense: 31, damage: 33 }, normalAbilityIds: ['Radiant Blade', 'Aegis of Light'], ultimateAbilityId: 'Judgement Strike' },
]);

export let QUEST_DEFINITIONS = Object.freeze([
  {
    id: 'quest_secure_first_road',
    title: 'Begin the First Expedition',
    description: 'Clear any expedition stage to prove your combatants are ready beyond the academy walls.',
    metric: 'CLEAR_STAGES',
    target: 1,
    rewards: { gold: 180, crystals: 100 },
  },
  {
    id: 'quest_assemble_vanguard',
    title: 'Recruit New Combatants',
    description: 'Recruit two combatants so the formation starts to feel like a real academy team.',
    metric: 'OWN_HEROES',
    target: 2,
    rewards: { gold: 220, crystals: 100, awakeningShards: 3 },
  },
  {
    id: 'quest_temper_squad',
    title: 'Train the Formation',
    description: 'Reach 380 active formation power through levels, rarity, and formation choices.',
    metric: 'ROSTER_POWER',
    target: 380,
    rewards: { crystals: 200 },
  },
  {
    id: 'quest_reclaim_crown_gate',
    title: 'Complete Region One',
    description: 'Finish The Wild Forest to unlock the next expedition region with a premium boost.',
    metric: 'CLEAR_REGION',
    target: 1,
    rewards: { premiumCrystals: 100 },
  },
]);

export const REGION_DEFINITIONS = Object.freeze([
  {
    id: 'region-1',
    legacyChapterId: 'chapter-1',
    region: 1,
    chapter: 1,
    name: 'The Wild Forest',
    subtitle: 'Region One',
    description: 'An untamed realm beyond the academy walls.',
    className: 'wild-forest',
    requiredLocationIds: ['forest-gate', 'sprite-grove', 'wolf-den', 'ancient-roots', 'heart-of-the-curse'],
    optionalLocationIds: ['deeper-woods'],
    completionCosmetic: 'Wild Forest Mastery',
  },
]);

// Compatibility export for older UI/save code. Player-facing terminology is Region.
export const CHAPTER_DEFINITIONS = Object.freeze(REGION_DEFINITIONS.map((region) => ({
  ...region,
  id: region.legacyChapterId,
  chapterId: region.legacyChapterId,
})));

export let LOCATION_DEFINITIONS = Object.freeze([
  {
    id: 'forest-gate',
    regionId: 'region-1',
    chapterId: 'chapter-1',
    order: 1,
    name: 'Forest Gate',
    description: 'The academy gate opens onto the moonlit forest path.',
    stages: 10,
    suggestedPower: 180,
    minimumAssignmentPower: 620,
    nodeAsset: 'forest-gate.png',
    backgroundAsset: 'forest-gate.jpg',
    requiredForStory: true,
    unlockRule: { type: 'STARTER' },
    farmingUnlockStage: 5,
    strongStageNumbers: [5],
    specialStage: { id: 'forest-gate-special', resetHours: 6, uniqueEnemy: 'Lantern Stag' },
  },
  {
    id: 'sprite-grove',
    regionId: 'region-1',
    chapterId: 'chapter-1',
    order: 2,
    name: 'Sprite Grove',
    description: 'Lantern sprites gather around a grove of training runes.',
    stages: 12,
    advancedBossStages: [6],
    suggestedPower: 360,
    minimumAssignmentPower: 920,
    nodeAsset: 'sprite-grove.png',
    backgroundAsset: 'sprite-grove.jpg',
    requiredForStory: true,
    unlockRule: { type: 'LOCATION_COMPLETE', locationId: 'forest-gate' },
    farmingUnlockStage: 5,
    specialStage: { id: 'sprite-grove-special', resetHours: 6, uniqueEnemy: 'Prism Sprite' },
  },
  {
    id: 'wolf-den',
    regionId: 'region-1',
    chapterId: 'chapter-1',
    order: 3,
    name: 'Wolf Den',
    description: 'Wolf tracks circle a cold den beside the old trail.',
    stages: 6,
    suggestedPower: 460,
    minimumAssignmentPower: 1080,
    nodeAsset: 'wolf-den.png',
    backgroundAsset: 'wolf-den.jpg',
    requiredForStory: true,
    unlockRule: { type: 'LOCATION_COMPLETE', locationId: 'forest-gate' },
    farmingUnlockStage: 5,
    specialStage: { id: 'wolf-den-special', resetHours: 7, uniqueEnemy: 'Moonfang Alpha' },
  },
  {
    id: 'ancient-roots',
    regionId: 'region-1',
    chapterId: 'chapter-1',
    order: 4,
    name: 'Ancient Roots',
    description: 'Gnarled roots twist with ancient magic below the forest floor.',
    stages: 15,
    advancedBossStages: [7],
    suggestedPower: 720,
    minimumAssignmentPower: 1520,
    nodeAsset: 'ancient-roots.png',
    backgroundAsset: 'ancient-roots.jpg',
    requiredForStory: true,
    unlockRule: {
      type: 'LOCATION_PERCENTAGES',
      requirements: [
        { locationId: 'sprite-grove', percent: 70 },
        { locationId: 'wolf-den', percent: 70 },
      ],
    },
    farmingUnlockStage: 6,
    specialStage: { id: 'ancient-roots-special', resetHours: 7, uniqueEnemy: 'Elder Rootseer' },
  },
  {
    id: 'deeper-woods',
    regionId: 'region-1',
    chapterId: 'chapter-1',
    order: 5,
    name: 'Deeper Woods',
    description: 'Violet curse-light stains the leaves of an optional high-power route.',
    stages: 18,
    suggestedPower: 1420,
    minimumAssignmentPower: 2600,
    nodeAsset: 'deeper-woods.png',
    backgroundAsset: 'deeper-woods.jpg',
    requiredForStory: false,
    optional: true,
    unlockRule: { type: 'COMPLETED_LOCATION_COUNT', count: 2 },
    farmingUnlockStage: 7,
    advancedBossStages: [4, 8],
    specialStage: { id: 'deeper-woods-special', resetHours: 8, uniqueEnemy: 'Violet Antler Lord' },
  },
  {
    id: 'heart-of-the-curse',
    regionId: 'region-1',
    chapterId: 'chapter-1',
    order: 6,
    name: 'Heart of the Curse',
    description: 'The curse gathers around a sealed heart of wild magic.',
    stages: 21,
    advancedBossStages: [8],
    suggestedPower: 1040,
    minimumAssignmentPower: 2200,
    nodeAsset: 'heart-of-the-curse.png',
    backgroundAsset: 'heart-of-the-curse.jpg',
    requiredForStory: true,
    unlockRule: {
      type: 'REQUIRED_LOCATIONS_COMPLETE',
      locationIds: ['forest-gate', 'sprite-grove', 'wolf-den', 'ancient-roots'],
    },
    farmingUnlockStage: 8,
    specialStage: { id: 'heart-of-the-curse-special', resetHours: 8, uniqueEnemy: 'Cursed Heart Avatar' },
  },
]);

export const REGION_SCHEDULE = Object.freeze(REGION_DEFINITIONS.map((region) => ({
  region: region.region,
  regionId: region.id,
  name: region.name,
  stages: LOCATION_DEFINITIONS
    .filter((location) => location.regionId === region.id || location.chapterId === region.legacyChapterId)
    .reduce((sum, location) => sum + location.stages, 0),
  unlockSystem: region.region === 1 ? 'REGION_TWO' : null,
})));

export const REGION_PRESENTATION = Object.freeze({
  1: {
    className: 'wild-forest',
    crest: 'Wild Forest',
    terrain: 'Moonlit forest trail',
    battleBackdrop: 'Ancient Roots',
    accent: '#d6ad5c',
  },
});

const LOCATION_ENEMY_FAMILIES = Object.freeze({
  'forest-gate': [
    { name: 'Forest Scout', attackInterval: 860, heroClass: 'STRIKER', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Briar Guard', attackInterval: 1260, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Lantern Moth', attackInterval: 1100, heroClass: 'MYSTIC', affinity: 'FROST', row: 'BACK' },
    {
      name: 'Rime Scout', attackInterval: 930, heroClass: 'STRIKER', affinity: 'FROST', row: 'FRONT',
      skillAbility: combatAbility('Rime Slash', 'DAMAGE_CHILL', { power: 1.05, duration: 1 }),
    },
    {
      name: 'Ember Moth', attackInterval: 1170, heroClass: 'MYSTIC', affinity: 'FLAME', row: 'BACK',
      skillAbility: combatAbility('Ember Spit', 'DAMAGE_BURN', { power: 1.1, statusPower: 0.25, duration: 2 }),
    },
  ],
  'sprite-grove': [
    { name: 'Rune Sprite', attackInterval: 1040, heroClass: 'MYSTIC', affinity: 'ARCANE', row: 'BACK' },
    { name: 'Grove Wisp', attackInterval: 970, heroClass: 'MYSTIC', affinity: 'FLAME', row: 'BACK' },
    { name: 'Prism Archer', attackInterval: 890, heroClass: 'STRIKER', affinity: 'FROST', row: 'BACK' },
  ],
  'wolf-den': [
    { name: 'Forest Wolf', attackInterval: 820, heroClass: 'STRIKER', affinity: 'FLAME', row: 'FRONT' },
    { name: 'Moonfang Hunter', attackInterval: 920, heroClass: 'STRIKER', affinity: 'FROST', row: 'FRONT' },
    { name: 'Den Keeper', attackInterval: 1220, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  ],
  'ancient-roots': [
    { name: 'Root Warden', attackInterval: 1200, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Buried Seer', attackInterval: 1120, heroClass: 'MYSTIC', affinity: 'FROST', row: 'BACK' },
    { name: 'Thornbound Mage', attackInterval: 990, heroClass: 'MYSTIC', affinity: 'FLAME', row: 'BACK' },
  ],
  'deeper-woods': [
    { name: 'Violet Stalker', attackInterval: 840, heroClass: 'STRIKER', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Cursehorn Beast', attackInterval: 1250, heroClass: 'GUARDIAN', affinity: 'FLAME', row: 'FRONT' },
    { name: 'Umbral Keeper', attackInterval: 1070, heroClass: 'MYSTIC', affinity: 'FROST', row: 'BACK' },
  ],
  'heart-of-the-curse': [
    { name: 'Heartbound Guard', attackInterval: 1170, heroClass: 'GUARDIAN', affinity: 'FLAME', row: 'FRONT' },
    { name: 'Cursed Arcanist', attackInterval: 1030, heroClass: 'MYSTIC', affinity: 'ARCANE', row: 'BACK' },
    { name: 'Wild Magic Echo', attackInterval: 900, heroClass: 'STRIKER', affinity: 'FROST', row: 'BACK' },
  ],
});

const LOCATION_BOSSES = Object.freeze({
  'forest-gate': { name: 'Gatewood Warden', attackInterval: 1320, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'sprite-grove': { name: 'Prismheart Dryad', attackInterval: 1300, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'wolf-den': { name: 'Denmother Varkai', attackInterval: 1290, heroClass: 'GUARDIAN', affinity: 'FROST', row: 'FRONT' },
  'ancient-roots': { name: 'Root-Crown Colossus', attackInterval: 1360, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'deeper-woods-4': { name: 'Hollow Antler', attackInterval: 940, heroClass: 'STRIKER', affinity: 'ARCANE', row: 'FRONT' },
  'deeper-woods': { name: 'Violet Sovereign', attackInterval: 1280, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'heart-of-the-curse': { name: 'Heartwood Tyrant', attackInterval: 1340, heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
});

function encounterFormation(power, front, back) {
  const row = (families, row) => families.flatMap((family, formationSlot) => (
    family ? [{ family, row, formationSlot }] : []
  ));
  return { power, units: [...row(front, 'FRONT'), ...row(back, 'BACK')] };
}

const LOCATION_FORMATIONS = (() => {
  const [, briarGuard] = LOCATION_ENEMY_FAMILIES['forest-gate'];
  const [sprite, wisp, archer] = LOCATION_ENEMY_FAMILIES['sprite-grove'];
  const [wolf, hunter, keeper] = LOCATION_ENEMY_FAMILIES['wolf-den'];
  const dryad = LOCATION_BOSSES['sprite-grove'];
  const denmother = LOCATION_BOSSES['wolf-den'];
  return {
    'sprite-grove': [
      encounterFormation(1350, [null, briarGuard], [sprite, null, wisp]),
      encounterFormation(1440, [briarGuard], [null, wisp, archer]),
      encounterFormation(1530, [null, null, briarGuard], [archer, sprite]),
      encounterFormation(1630, [briarGuard, null, briarGuard], [wisp, null, archer]),
      encounterFormation(1740, [null, briarGuard], [archer, sprite, wisp]),
      encounterFormation(1860, [null, dryad], [sprite, null, archer]),
      encounterFormation(1900, [briarGuard, briarGuard], [null, archer, wisp]),
      encounterFormation(2020, [null, null, briarGuard], [wisp, archer, sprite]),
      encounterFormation(2140, [briarGuard, null, briarGuard], [sprite, archer, wisp]),
      encounterFormation(2260, [briarGuard, briarGuard], [archer, wisp, archer]),
      encounterFormation(2380, [null, briarGuard, briarGuard], [wisp, sprite, archer]),
      encounterFormation(2550, [null, dryad, briarGuard], [archer, null, sprite]),
    ],
    'wolf-den': [
      encounterFormation(1560, [wolf, null, wolf], [null, hunter]),
      encounterFormation(1740, [wolf, keeper, hunter], [null, null, wolf]),
      encounterFormation(1920, [keeper, null, wolf], [hunter, null, hunter]),
      encounterFormation(2120, [wolf, keeper, wolf], [hunter, null, hunter]),
      encounterFormation(2330, [keeper, hunter, keeper], [wolf, hunter]),
      encounterFormation(2510, [null, denmother], [hunter, null, hunter]),
    ],
  };
})();

export const FOREST_GATE_SHIELD = Object.freeze({ name: 'Forest Gate Shield', rarity: 'COMMON', defense: 35 });
export const FIRST_LEVEL_XP = 150;
export const FOREST_GATE_STAGE_4_MIN_LEVEL = 4;
export const TRAINEE_SKILL_UNLOCK_LEVEL = 10;
export const FOREST_GATE_STAGE_3_TRAINING_BONUS = Object.freeze({ xpShards: 1610, gold: 103 });

const FOREST_GATE_ENCOUNTERS = Object.freeze({
  1: { recommendedPower: 240, xpShards: FIRST_LEVEL_XP, enemies: [
    { name: 'Forest Scout', level: 1, hp: 120, defense: 12, damage: 30 },
  ] },
  2: { recommendedPower: 610, xpShards: 100, enemies: [
    { name: 'Briar Guard', level: 2, attackInterval: 1100, hp: 310, defense: 50, damage: 71 },
  ] },
  3: { recommendedPower: 860, xpShards: 120 + FOREST_GATE_STAGE_3_TRAINING_BONUS.xpShards, goldBonus: FOREST_GATE_STAGE_3_TRAINING_BONUS.gold, enemies: [
    { name: 'Forest Scout', level: 2, hp: 146, defense: 22, damage: 38 },
    { name: 'Lantern Moth', level: 2, hp: 123, defense: 14, damage: 34 },
    { name: 'Rime Scout', level: 3, hp: 136, defense: 18, damage: 35 },
  ] },
  4: { recommendedPower: 1050, xpShards: 150, enemies: [
    { name: 'Briar Guard', level: 4, hp: 270, defense: 44, damage: 48 },
    { name: 'Lantern Moth', level: 3, hp: 172, defense: 14, damage: 33 },
    { name: 'Rime Scout', level: 4, hp: 143, defense: 19, damage: 31 },
    { name: 'Ember Moth', level: 3, hp: 177, defense: 12, damage: 34 },
  ] },
  5: { recommendedPower: 1600, xpShards: 170, briarWard: { seals: 5, deadline: 4400 }, enemies: [
    { name: 'Forest Scout', level: 4, hp: 198, defense: 18, damage: 42 },
    { name: 'Briar Guard', level: 5, hp: 329, defense: 42, damage: 46 },
    { name: 'Lantern Moth', level: 4, hp: 240, defense: 12, damage: 37 },
    { name: 'Lantern Moth', level: 4, hp: 193, defense: 18, damage: 39 },
    { name: 'Ember Moth', level: 5, hp: 232, defense: 12, damage: 39 },
  ] },
  6: { recommendedPower: 1700, xpShards: 220, enemies: [
    { name: 'Forest Scout', level: 5, hp: 208, defense: 22, damage: 49 },
    { name: 'Briar Guard', level: 5, hp: 292, defense: 45, damage: 52 },
    { name: 'Lantern Moth', level: 4, hp: 207, defense: 12, damage: 43 },
    { name: 'Rime Scout', level: 5, hp: 185, defense: 18, damage: 48 },
    { name: 'Ember Moth', level: 5, hp: 206, defense: 12, damage: 48 },
  ] },
  7: { recommendedPower: 1780, enemies: [
    { name: 'Briar Guard', level: 5, hp: 338, defense: 42, damage: 37 },
    { name: 'Forest Scout', level: 5, hp: 258, defense: 22, damage: 38 },
    { name: 'Briar Guard', level: 5, hp: 322, defense: 40, damage: 35 },
    { name: 'Lantern Moth', level: 6, hp: 258, defense: 14, damage: 44 },
    { name: 'Ember Moth', level: 6, hp: 260, defense: 15, damage: 43 },
  ] },
  8: { recommendedPower: 1820, enemies: [
    { name: 'Briar Guard', level: 7, hp: 519, defense: 51, damage: 51 },
    { name: 'Rime Scout', level: 6, hp: 355, defense: 25, damage: 47 },
    { name: 'Lantern Moth', level: 6, hp: 346, defense: 17, damage: 47 },
    { name: 'Ember Moth', level: 7, hp: 384, defense: 19, damage: 52 },
  ] },
  9: { recommendedPower: 1860, enemies: [
    { name: 'Briar Guard', level: 8, hp: 485, defense: 47, damage: 41 },
    { name: 'Rime Scout', level: 7, hp: 334, defense: 24, damage: 36 },
    { name: 'Ember Moth', level: 8, hp: 351, defense: 17, damage: 43 },
    { name: 'Lantern Moth', level: 7, hp: 325, defense: 14, damage: 35 },
    { name: 'Ember Moth', level: 7, hp: 339, defense: 15, damage: 36 },
  ] },
  10: { recommendedPower: 1920, enemies: [
    { name: 'Gatewood Warden', level: 10, hp: 650, defense: 63, damage: 40 },
    { name: 'Briar Guard', level: 8, hp: 430, defense: 44, damage: 32 },
    { name: 'Forest Scout', level: 7, hp: 310, defense: 22, damage: 29 },
    { name: 'Lantern Moth', level: 7, hp: 308, defense: 14, damage: 30 },
    { name: 'Ember Moth', level: 8, hp: 351, defense: 17, damage: 33 },
  ] },
});

const LOCATION_STAGE_MILESTONES = Object.freeze({
  'forest-gate-1': [
    { type: 'giftHero', heroDefId: 'hero_yssa_driftborn', hint: 'Yssa Driftborn joins your training roster.' },
  ],
  'forest-gate-2': [
    { type: 'giftHero', heroDefId: 'hero_frost_warden_kael', hint: 'Frost Warden Kael joins your training roster.' },
  ],
  'forest-gate-3': [
    { type: 'giftShield', hint: 'Forest Gate Shield earned. Equip it in Combatants.' },
  ],
  'forest-gate-4': [
    { type: 'giftHero', heroDefId: 'hero_lumen_solis', hint: 'Lumen Solis joins your training roster.' },
    { type: 'unlockSystem', system: 'BASIC_SUMMON', hint: 'Recruit unlocked.' },
  ],
  'forest-gate-6': [
    { type: 'giftHero', heroDefId: 'hero_pyreth_the_branded', hint: 'Pyreth joins your training roster.' },
  ],
  'heart-of-the-curse-21': [
    { type: 'giftHero', heroDefId: 'hero_archmage_eloris', hint: 'Archmage Eloris joins your training roster.' },
    { type: 'unlockSystem', system: 'REGION_TWO', hint: 'The next Region is unlocked.' },
  ],
});

function makeStageId(locationId, stageNumber) {
  return `${locationId}-${stageNumber}`;
}

function enemyAbilities(family) {
  if (family.heroClass === 'GUARDIAN') {
    return {
      basicAbility: combatAbility(`${family.name} Strike`, 'DAMAGE', { power: 1 }),
      skillAbility: combatAbility(`${family.name} Guard`, 'BARRIER_GUARD_SELF', { power: 1.2, duration: 1 }),
      ultimateAbility: combatAbility(`${family.name} Surge`, 'DAMAGE_ALL', { power: 1.15 }),
    };
  }
  if (family.heroClass === 'MYSTIC') {
    return {
      basicAbility: combatAbility(`${family.name} Bolt`, 'DAMAGE', { power: 1 }),
      skillAbility: combatAbility(`${family.name} Hex`, 'DAMAGE_ALL', { power: 1.1 }),
      ultimateAbility: combatAbility(`${family.name} Surge`, 'DAMAGE_ALL', { power: 1.25 }),
    };
  }
  return {
    basicAbility: combatAbility(`${family.name} Strike`, 'DAMAGE', { power: 1 }),
    skillAbility: combatAbility(`${family.name} Assault`, 'DAMAGE_LOWEST', { power: 1.35 }),
    ultimateAbility: combatAbility(`${family.name} Surge`, 'THREE_HITS', { power: 0.9, hits: 3 }),
  };
}

function getBossFamily(location, stageNumber) {
  return LOCATION_BOSSES[`${location.id}-${stageNumber}`] || LOCATION_BOSSES[location.id] || null;
}

function getEncounterFamilies(location, stageNumber) {
  const families = LOCATION_ENEMY_FAMILIES[location.id] || [];
  const boss = getBossFamily(location, stageNumber);
  if (location.id === 'deeper-woods' && stageNumber === 4) return [boss, families[0], families[1]].filter(Boolean);
  if (stageNumber === location.stages || location.advancedBossStages?.includes(stageNumber)) {
    const supports = location.order >= 5 ? [families[0], families[1], families[2], families[0]] : [families[0], families[1]];
    return [boss, ...supports].filter(Boolean);
  }
  const expansionStart = { 'ancient-roots': 8, 'deeper-woods': 9, 'heart-of-the-curse': 9 }[location.id];
  if (expansionStart && stageNumber >= expansionStart) {
    const front = families.find((family) => family.row === 'FRONT');
    const back = families.find((family) => family.row === 'BACK');
    const variants = [
      [front, front, back, families[2]],
      [front, families[1], families[2], back],
      [front, front, families[1], back, families[2]],
    ];
    return variants[(stageNumber - expansionStart) % variants.length];
  }
  if (stageNumber <= 3) return [families[stageNumber - 1]].filter(Boolean);
  if (stageNumber === location.stages - 1) return [families[0], families[1], families[2], families[0]].filter(Boolean);
  if (stageNumber % 4 === 0) return [families[0], families[1], families[2]].filter(Boolean);
  return [families[(stageNumber - 1) % families.length], families[stageNumber % families.length]].filter(Boolean);
}

function makeEnemy(location, stageNumber, slot, family, spec, baseLevel, early) {
  const base = ENEMY_BASE_STATS[family.name];
  const rank = ENEMY_RANKS[spec.trainingRank];
  const boss = ENEMY_BOSS_SPECIES.has(family.name);
  const originRarity = early ? spec.trainingRank : boss ? 'RARE' : 'COMMON';
  const level = Math.min(rank.levelCap, baseLevel + (boss ? 2 : 0) + (spec.levelOffset || 0));
  const scale = (1 + 0.04 * (level - 1)) * rank.multiplier * (1.08 ** ENEMY_RANKS[originRarity].index);
  const stats = { hp: Math.round(base.hp * scale), damage: Math.round(base.damage * scale),
    defense: Math.round(base.defense * scale), speed: base.speed, crit: base.crit };
  const abilities = enemyAbilities(family);
  return {
    id: `enemy-${location.id}-${stageNumber}-${slot + 1}`,
    name: family.name, heroClass: family.heroClass, affinity: family.affinity,
    row: spec.row ?? family.row,
    ...(spec.formationSlot != null ? { formationSlot: spec.formationSlot } : {}),
    ...abilities, skillAbility: family.skillAbility || abilities.skillAbility,
    ...ENEMY_ABILITY_OVERRIDES[family.name],
    attackInterval: Math.round(100000 / base.speed), level, stats,
    rarity: spec.trainingRank, trainingRank: spec.trainingRank, originRarity,
  };
}

function makeLocationStage(location, stageNumber, globalIndex) {
  const isFinalBoss = stageNumber === location.stages;
  const isAdvancedBoss = Boolean(location.advancedBossStages?.includes(stageNumber));
  const isStrong = location.strongStageNumbers
    ? location.strongStageNumbers.includes(stageNumber)
    : stageNumber % 4 === 0;
  const isBoss = isFinalBoss || isAdvancedBoss;
  const authored = location.id === 'forest-gate' ? FOREST_GATE_ENCOUNTERS[stageNumber] : null;
  const boss = isBoss ? getBossFamily(location, stageNumber) : null;
  const formation = LOCATION_FORMATIONS[location.id]?.[stageNumber - 1];
  const encounterFamilies = authored
    ? authored.enemies.map(({ name }) => name === boss?.name
      ? boss
      : LOCATION_ENEMY_FAMILIES[location.id].find((family) => family.name === name))
    : formation?.units.map(({ family }) => family) ?? getEncounterFamilies(location, stageNumber);
  const stageId = makeStageId(location.id, stageNumber);
  const balance = ENEMY_BALANCE_STAGES[stageId];
  if (!balance) throw new Error(`Missing encounter balance: ${stageId}`);
  const early = !balance.enemies;
  const families = [...Object.values(LOCATION_ENEMY_FAMILIES).flat(), ...Object.values(LOCATION_BOSSES)];
  const specs = early ? encounterFamilies.map((family, slot) => ({
    name: family.name, trainingRank: balance.trainingRanks[slot], levelOffset: balance.levelOffsets?.[slot] ?? 0,
    ...(formation ? { row: formation.units[slot].row, formationSlot: formation.units[slot].formationSlot } : {}),
  })) : balance.enemies;
  if (early && specs.length !== balance.trainingRanks.length) throw new Error(`Rank count mismatch: ${stageId}`);
  const enemies = specs.map((spec, slot) => {
    const family = early ? encounterFamilies[slot] : families.find(f => f.name === spec.name);
    if (!family) throw new Error(`Missing enemy template: ${spec.name}`);
    return makeEnemy(location, stageNumber, slot, family, spec, balance.baseLevel, early);
  });
  const recommendedPower = enemies.reduce((sum, { stats }) => sum + Math.floor(stats.hp * 0.45 + stats.defense * 2.1 + stats.damage * 4.5), 0);
  const rewards = {
    gold: 65 + globalIndex * 14 + location.order * 20 + (authored?.goldBonus || 0),
    xp: authored?.xpShards != null ? 0 : Math.round((28 + globalIndex * 6 + location.order * 4) * (balance.firstClearXpMultiplier ?? 1)),
    ...(authored?.xpShards != null ? { xpShards: authored.xpShards } : {}),
    crystals: isFinalBoss ? 40 + location.order * 15 : 0,
    premiumCrystals: isAdvancedBoss && location.id === 'deeper-woods' ? 20 + stageNumber * 3 : 0,
  };
  return {
    id: makeStageId(location.id, stageNumber),
    regionId: location.regionId,
    chapterId: location.chapterId,
    chapter: 1,
    locationId: location.id,
    locationName: location.name,
    locationOrder: location.order,
    stage: stageNumber,
    name: boss?.name || (isFinalBoss ? `${location.name} Guardian` : isAdvancedBoss ? 'Advanced Guardian' : `Stage ${stageNumber}`),
    encounterType: isBoss ? 'BOSS' : isStrong ? 'ELITE' : 'NORMAL',
    recommendedPower,
    basicAttackLesson: Boolean(authored && stageNumber <= 3),
    ...(authored?.briarWard ? { briarWard: authored.briarWard } : {}),
    enemies,
    rewards,
    milestoneRewards: LOCATION_STAGE_MILESTONES[`${location.id}-${stageNumber}`] || [],
  };
}

let stageCursor = 0;
export let STAGE_DEFINITIONS = Object.freeze(
  LOCATION_DEFINITIONS.flatMap((location) => Array.from({ length: location.stages }, (_, index) => {
    // The six added Grove encounters do not shift downstream enemy and reward scaling.
    const addedGroveStage = location.id === 'sprite-grove' && index >= 6;
    const oldCount = { 'ancient-roots': 7, 'deeper-woods': 8, 'heart-of-the-curse': 8 }[location.id];
    const addedLaterStage = oldCount !== undefined && index >= oldCount;
    const extraIndex = addedGroveStage ? index - 6 : addedLaterStage ? index - oldCount : 0;
    const stage = makeLocationStage(location, index + 1, stageCursor + extraIndex);
    if (!addedGroveStage && !addedLaterStage) stageCursor += 1;
    return stage;
  }))
);

const REGION_ID_MAP = new Map(REGION_DEFINITIONS.flatMap((region) => [[region.id, region], [region.legacyChapterId, region]]));
const CHAPTER_ID_MAP = new Map(CHAPTER_DEFINITIONS.map((chapter) => [chapter.id, chapter]));
const LOCATION_ID_MAP = new Map(LOCATION_DEFINITIONS.map((location) => [location.id, location]));
const STAGE_ID_MAP = new Map(STAGE_DEFINITIONS.map((stage) => [stage.id, stage]));

export function getHeroDefinition(heroDefId) {
  return [...HERO_DEFINITIONS, ...LEGACY_HERO_DEFINITIONS].find((definition) => definition.id === heroDefId) || null;
}

export function getRegionById(regionId) {
  return REGION_ID_MAP.get(regionId) || null;
}

export function getChapterById(chapterId) {
  return CHAPTER_ID_MAP.get(chapterId) || null;
}

export function getLocationById(locationId) {
  return LOCATION_ID_MAP.get(locationId) || null;
}

export function getLocationsForRegion(regionId) {
  const region = getRegionById(regionId);
  return LOCATION_DEFINITIONS.filter((location) => location.regionId === region?.id || location.chapterId === region?.legacyChapterId);
}

export function getLocationsForChapter(chapterId) {
  return LOCATION_DEFINITIONS.filter((location) => location.chapterId === chapterId);
}

export function getStagesForLocation(locationId) {
  return STAGE_DEFINITIONS.filter((stage) => stage.locationId === locationId);
}

export function getStageById(stageId) {
  return STAGE_ID_MAP.get(stageId) || null;
}

export function getRegionPresentation(region) {
  return REGION_PRESENTATION[region] || REGION_PRESENTATION[1];
}

export function getStageIndex(stageId) {
  return STAGE_DEFINITIONS.findIndex((stage) => stage.id === stageId);
}

export function getNextStageId(stageId) {
  const stage = getStageById(stageId);
  if (!stage) return STAGE_DEFINITIONS[0]?.id || null;
  const stages = getStagesForLocation(stage.locationId);
  const index = stages.findIndex((item) => item.id === stageId);
  return stages[index + 1]?.id || stage.id;
}

// Capture APK defaults once. Every release is a complete override relative to these,
// never a patch layered on a previous download. IDs and save migrations stay stable.
const CONTENT_DEFAULTS = cloneContent({ heroes: HERO_DEFINITIONS, quests: QUEST_DEFINITIONS,
  locations: LOCATION_DEFINITIONS, stages: STAGE_DEFINITIONS, presentation: PRESENTATION_CONFIG });
export function getContentDefaults() { return cloneContent(CONTENT_DEFAULTS); }
export function validateContentPatch(patch) { return compileContentPatch(CONTENT_DEFAULTS, patch); }
export function applyContentPatch(patch) {
  const next = validateContentPatch(patch); // Validate everything before changing anything.
  HERO_DEFINITIONS = Object.freeze(next.heroes);
  QUEST_DEFINITIONS = Object.freeze(next.quests);
  LOCATION_DEFINITIONS = Object.freeze(next.locations);
  STAGE_DEFINITIONS = Object.freeze(next.stages);
  PRESENTATION_CONFIG = Object.freeze({
    battle: Object.freeze({ ...next.presentation.battle }),
    shell: Object.freeze({ ...next.presentation.shell }),
    combat: Object.freeze({ ...next.presentation.combat }),
    theme: Object.freeze({ ...next.presentation.theme }),
  });
  LOCATION_ID_MAP.clear();
  for (const value of LOCATION_DEFINITIONS) LOCATION_ID_MAP.set(value.id, value);
  STAGE_ID_MAP.clear();
  for (const value of STAGE_DEFINITIONS) STAGE_ID_MAP.set(value.id, value);
  return next.message;
}
