import { compileContentPatch, cloneContent } from './content-schema.js';

export const CURRENCY = Object.freeze({
  GOLD: 'GOLD',
  CRYSTALS: 'CRYSTALS',
  PREMIUM_CRYSTALS: 'PREMIUM_CRYSTALS',
  AWAKENING_SHARDS: 'AWAKENING_SHARDS',
});

export const CURRENCY_LABEL = Object.freeze({
  GOLD: 'Gold',
  CRYSTALS: 'Crystals',
  PREMIUM_CRYSTALS: 'Lumens',
  AWAKENING_SHARDS: 'Training Seals',
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
  GUARDIAN: { row: 'FRONT', hp: 1100, defense: 110, damage: 85 },
  STRIKER: { row: 'BACK', hp: 680, defense: 62, damage: 165 },
  MYSTIC: { row: 'BACK', hp: 760, defense: 72, damage: 105 },
});

export const AFFINITY_ADVANTAGES = Object.freeze({
  FLAME: { strongVs: 'ARCANE', weakVs: 'FROST' },
  FROST: { strongVs: 'FLAME', weakVs: 'ARCANE' },
  ARCANE: { strongVs: 'FROST', weakVs: 'FLAME' },
});


export let PRESENTATION_CONFIG = Object.freeze({
  battle: Object.freeze({
    fieldSideMargin: 0,
    deckMinHeight: 108,
    deckViewportHeight: 13.5,
    deckMaxHeight: 122,
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
    backgroundCover: false,
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
    characterScale: 0.44,
    bossScale: 0.47,
    frontTopY: 290,
    frontBottomY: 470,
    backTopY: 195,
    backMiddleY: 365,
    backBottomY: 550,
    playerFrontX: 130,
    playerReserveX: 104,
    playerCombatX: 165,
    playerBackGuardianX: 96,
    playerBackStrikerX: 82,
    playerBackMysticX: 68,
    enemyFrontX: 350,
    enemyReserveX: 376,
    enemyCombatX: 315,
    enemyBackGuardianX: 384,
    enemyBackStrikerX: 398,
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

export let HERO_DEFINITIONS = Object.freeze([
  { id: 'hero_cinder_vale', name: 'Cinder Vale', heroClass: 'GUARDIAN', affinity: 'FLAME', rarity: 'COMMON', defaultRow: 'FRONT', baseStats: { hp: 125, defense: 25, damage: 30 }, basicAbility: combatAbility('Ember Bash', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Heated Guard', 'BARRIER_GUARD_SELF', { power: 1.8, duration: 2 }), ultimateAbility: combatAbility('Blazing Charge', 'CHARGE_SPLASH_BARRIER', { power: 2.25, splashPower: 0.9, barrierPower: 1.2 }) },
  { id: 'hero_pyreth_the_branded', name: 'Pyreth', heroClass: 'STRIKER', affinity: 'FLAME', rarity: 'RARE', defaultRow: 'BACK', baseStats: { hp: 86, defense: 16, damage: 48 }, basicAbility: combatAbility('Ember Bolt', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Ignite', 'DAMAGE_BURN', { power: 1.35, statusPower: 0.34, duration: 2, statusChance: 0.35 }), ultimateAbility: combatAbility('Conflagration', 'DAMAGE_ALL_BURN', { power: 1.55, statusPower: 0.3, duration: 2, statusChance: 0.35 }) },
  { id: 'hero_sera_ashveil', name: 'Sera Ashveil', heroClass: 'MYSTIC', affinity: 'FLAME', rarity: 'EPIC', defaultRow: 'BACK', baseStats: { hp: 118, defense: 24, damage: 20 }, basicAbility: combatAbility('Ash Spark', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Cauterize', 'HEAL_LOWEST', { power: 1.8 }), ultimateAbility: combatAbility('Pyre Bloom', 'HEAL_ALL_BARRIER', { power: 1.65, barrierPower: 0.7 }) },
  { id: 'hero_frost_warden_kael', name: 'Frost Warden Kael', heroClass: 'GUARDIAN', affinity: 'FROST', rarity: 'UNCOMMON', defaultRow: 'FRONT', baseStats: { hp: 188, defense: 42, damage: 16 }, basicAbility: combatAbility('Frost Hammer', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Glacier Shield', 'BARRIER_LOWEST', { power: 2 }), ultimateAbility: combatAbility('Absolute Zero', 'DAMAGE_ALL_STUN', { power: 1.35, stunChance: 0.25 }) },
  { id: 'hero_yssa_driftborn', name: 'Yssa Driftborn', heroClass: 'STRIKER', affinity: 'FROST', rarity: 'RARE', defaultRow: 'BACK', baseStats: { hp: 105, defense: 20, damage: 42 }, basicAbility: combatAbility('Cryo Shot', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Shatter Arrow', 'DAMAGE_LOWEST', { power: 1.65 }), ultimateAbility: combatAbility('Blizzard Barrage', 'THREE_HITS', { power: 1.15, hits: 3 }) },
  { id: 'hero_stone_sentinel_gorr', name: 'Stone Sentinel Gorr', heroClass: 'GUARDIAN', affinity: 'ARCANE', rarity: 'COMMON', defaultRow: 'FRONT', baseStats: { hp: 182, defense: 40, damage: 15 }, basicAbility: combatAbility('Runic Slam', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Sigil Wall', 'BARRIER_TWO', { power: 1.55 }), ultimateAbility: combatAbility('Living Bastion', 'BARRIER_ALL_GUARD', { power: 1.2, duration: 2 }) },
  { id: 'hero_dusk', name: 'Dusk', heroClass: 'STRIKER', affinity: 'ARCANE', rarity: 'RARE', defaultRow: 'FRONT', baseStats: { hp: 86, defense: 15, damage: 56 }, basicAbility: combatAbility('Rift Cut', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Phase Step', 'DAMAGE_BACK_LOWEST', { power: 1.55 }), ultimateAbility: combatAbility('Nightfall', 'THREE_LOWEST', { power: 1.25, hits: 3 }) },
  { id: 'hero_lumen_solis', name: 'Lumen Solis', heroClass: 'MYSTIC', affinity: 'ARCANE', rarity: 'RARE', defaultRow: 'BACK', baseStats: { hp: 112, defense: 23, damage: 18 }, basicAbility: combatAbility('Prism Bolt', 'DAMAGE', { power: 1 }), skillAbility: combatAbility('Lumen Mend', 'HEAL_LOWEST', { power: 1.85 }), ultimateAbility: combatAbility('Grand Resonance', 'HEAL_ALL_CLEANSE', { power: 1.55 }) },
]);

export const LAUNCH_HERO_IDS = Object.freeze(HERO_DEFINITIONS.map((definition) => definition.id));

const LEGACY_HERO_DEFINITIONS = Object.freeze([
  { id: 'hero_vale_coldmantle', name: 'Vale Coldmantle', heroClass: 'ASSASSIN', affinity: 'ICE', rarity: 'EPIC', baseStats: { hp: 90, defense: 17, damage: 58 }, normalAbilityIds: ['Frostblade', 'Hypothermia'], ultimateAbilityId: "Winter's Edge" },
  { id: 'hero_briar_thornguard', name: 'Briar Thornguard', heroClass: 'WARRIOR', affinity: 'EARTH', rarity: 'RARE', baseStats: { hp: 136, defense: 29, damage: 31 }, normalAbilityIds: ['Thornstrike', 'Overgrowth'], ultimateAbilityId: 'Thorn Eruption' },
  { id: 'hero_mudra_the_shaper', name: 'Mudra', title: 'the Shaper', heroClass: 'MAGE', affinity: 'EARTH', rarity: 'UNCOMMON', baseStats: { hp: 84, defense: 17, damage: 44 }, normalAbilityIds: ['Rockslide', 'Sinkhole'], ultimateAbilityId: 'Avalanche' },
  { id: 'hero_vesper', name: 'Vesper', heroClass: 'HEALER', affinity: 'SHADOW', rarity: 'EPIC', baseStats: { hp: 116, defense: 24, damage: 20 }, normalAbilityIds: ['Dark Mend', 'Shadow Shroud'], ultimateAbilityId: 'Siphon Life' },
  { id: 'hero_hollow_gravyn', name: 'Hollow Gravyn', heroClass: 'WARRIOR', affinity: 'SHADOW', rarity: 'UNCOMMON', baseStats: { hp: 132, defense: 27, damage: 30 }, normalAbilityIds: ['Void Slash', 'Iron Resolve'], ultimateAbilityId: 'Cursed Surge' },
  { id: 'hero_crest_of_dawning', name: 'Crest of Dawning', heroClass: 'WARRIOR', affinity: 'LIGHT', rarity: 'EPIC', baseStats: { hp: 142, defense: 31, damage: 33 }, normalAbilityIds: ['Radiant Blade', 'Aegis of Light'], ultimateAbilityId: 'Judgement Strike' },
  { id: 'hero_archmage_eloris', name: 'Archmage Eloris', heroClass: 'MAGE', affinity: 'LIGHT', rarity: 'LEGENDARY', baseStats: { hp: 94, defense: 19, damage: 62 }, normalAbilityIds: ['Holy Bolt', 'Arcane Amplify'], ultimateAbilityId: 'Starfall', ultimateAbilityId2: 'Arcane Rift' },
]);

export let QUEST_DEFINITIONS = Object.freeze([
  {
    id: 'quest_secure_first_road',
    title: 'Begin the First Expedition',
    description: 'Clear any expedition stage to prove your trainees are ready beyond the academy walls.',
    metric: 'CLEAR_STAGES',
    target: 1,
    rewards: { gold: 180, crystals: 100 },
  },
  {
    id: 'quest_assemble_vanguard',
    title: 'Enroll New Trainees',
    description: 'Recruit two trainees so the formation starts to feel like a real academy team.',
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
    stages: 6,
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
    stages: 7,
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
    stages: 8,
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
    stages: 8,
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
    { name: 'Forest Scout', heroClass: 'STRIKER', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Briar Guard', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Lantern Moth', heroClass: 'MYSTIC', affinity: 'FROST', row: 'BACK' },
  ],
  'sprite-grove': [
    { name: 'Rune Sprite', heroClass: 'MYSTIC', affinity: 'ARCANE', row: 'BACK' },
    { name: 'Grove Wisp', heroClass: 'MYSTIC', affinity: 'FLAME', row: 'BACK' },
    { name: 'Prism Archer', heroClass: 'STRIKER', affinity: 'FROST', row: 'BACK' },
  ],
  'wolf-den': [
    { name: 'Forest Wolf', heroClass: 'STRIKER', affinity: 'FLAME', row: 'FRONT' },
    { name: 'Moonfang Hunter', heroClass: 'STRIKER', affinity: 'FROST', row: 'FRONT' },
    { name: 'Den Keeper', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  ],
  'ancient-roots': [
    { name: 'Root Warden', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Buried Seer', heroClass: 'MYSTIC', affinity: 'FROST', row: 'BACK' },
    { name: 'Thornbound Mage', heroClass: 'MYSTIC', affinity: 'FLAME', row: 'BACK' },
  ],
  'deeper-woods': [
    { name: 'Violet Stalker', heroClass: 'STRIKER', affinity: 'ARCANE', row: 'FRONT' },
    { name: 'Cursehorn Beast', heroClass: 'GUARDIAN', affinity: 'FLAME', row: 'FRONT' },
    { name: 'Umbral Keeper', heroClass: 'MYSTIC', affinity: 'FROST', row: 'BACK' },
  ],
  'heart-of-the-curse': [
    { name: 'Heartbound Guard', heroClass: 'GUARDIAN', affinity: 'FLAME', row: 'FRONT' },
    { name: 'Cursed Arcanist', heroClass: 'MYSTIC', affinity: 'ARCANE', row: 'BACK' },
    { name: 'Wild Magic Echo', heroClass: 'STRIKER', affinity: 'FROST', row: 'BACK' },
  ],
});

const LOCATION_BOSSES = Object.freeze({
  'forest-gate': { name: 'Gatewood Warden', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'sprite-grove': { name: 'Prismheart Dryad', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'wolf-den': { name: 'Denmother Varkai', heroClass: 'GUARDIAN', affinity: 'FROST', row: 'FRONT' },
  'ancient-roots': { name: 'Root-Crown Colossus', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'deeper-woods-4': { name: 'Hollow Antler', heroClass: 'STRIKER', affinity: 'ARCANE', row: 'FRONT' },
  'deeper-woods': { name: 'Violet Sovereign', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
  'heart-of-the-curse': { name: 'Heartwood Tyrant', heroClass: 'GUARDIAN', affinity: 'ARCANE', row: 'FRONT' },
});

const FOREST_GATE_ENCOUNTERS = Object.freeze({
  1: ['Forest Scout', 'Forest Scout', 'Forest Scout', 'Forest Scout', 'Forest Scout'],
  2: ['Briar Guard', 'Briar Guard', 'Briar Guard', 'Briar Guard', 'Briar Guard'],
  3: ['Lantern Moth', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
  4: ['Forest Scout', 'Briar Guard', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
  5: ['Briar Guard', 'Briar Guard', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
  6: ['Forest Scout', 'Briar Guard', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
  7: ['Forest Scout', 'Briar Guard', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
  8: ['Briar Guard', 'Briar Guard', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
  9: ['Forest Scout', 'Briar Guard', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
  10: ['Gatewood Warden', 'Briar Guard', 'Lantern Moth', 'Lantern Moth', 'Lantern Moth'],
});

const LOCATION_STAGE_MILESTONES = Object.freeze({
  'forest-gate-2': [
    { type: 'giftHero', heroDefId: 'hero_yssa_driftborn', hint: 'Yssa Driftborn joins your training roster.' },
  ],
  'forest-gate-3': [
    { type: 'unlockSystem', system: 'BASIC_SUMMON', hint: 'Arcane Summon unlocked.' },
  ],
  'forest-gate-4': [
    { type: 'giftHero', heroDefId: 'hero_frost_warden_kael', hint: 'Frost Warden Kael joins your training roster.' },
  ],
  'forest-gate-5': [
    { type: 'giftHero', heroDefId: 'hero_lumen_solis', hint: 'Lumen Solis joins your training roster.' },
  ],
  'forest-gate-6': [
    { type: 'giftHero', heroDefId: 'hero_pyreth_the_branded', hint: 'Pyreth joins your training roster.' },
  ],
  'heart-of-the-curse-8': [
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
  if (location.id === 'forest-gate') {
    const names = FOREST_GATE_ENCOUNTERS[stageNumber] || [];
    const boss = getBossFamily(location, stageNumber);
    return names.map((name) => name === boss?.name ? boss : families.find((family) => family.name === name)).filter(Boolean);
  }
  const boss = getBossFamily(location, stageNumber);
  if (location.id === 'deeper-woods' && stageNumber === 4) return [boss, families[0], families[1]].filter(Boolean);
  if (stageNumber === location.stages) {
    const supports = location.order >= 5 ? [families[0], families[1], families[2], families[0]] : [families[0], families[1]];
    return [boss, ...supports].filter(Boolean);
  }
  if (stageNumber <= 3) return [families[stageNumber - 1]].filter(Boolean);
  if (stageNumber === location.stages - 1) return [families[0], families[1], families[2], families[0]].filter(Boolean);
  if (stageNumber % 4 === 0) return [families[0], families[1], families[2]].filter(Boolean);
  return [families[(stageNumber - 1) % families.length], families[stageNumber % families.length]].filter(Boolean);
}

function encounterStatScale(location, stageNumber) {
  if (location.id !== 'forest-gate') return 1;
  // Five visible enemies must remain approachable before all five gifts arrive.
  // Keep this tuning local to Forest Gate; other Locations retain their budgets.
  const openingScales = [0.16, 0.16, 0.16, 0.3, 0.36, 0.4, 0.42, 0.44, 0.46, 0.48];
  return openingScales[stageNumber - 1] ?? 1;
}

function makeEnemy(location, stageNumber, slot, powerIndex, family, statScale = 1) {
  const scale = 1 + location.order * 0.35 + stageNumber * 0.18;
  const abilities = enemyAbilities(family);
  // Presentation trial: more turns for skills and charged ultimates.
  // Attack and defense stay intact; the extra time comes from health.
  const healthScale = 1.6;
  return {
    id: `enemy-${location.id}-${stageNumber}-${slot + 1}`,
    name: family.name,
    heroClass: family.heroClass,
    affinity: family.affinity,
    row: family.row,
    ...abilities,
    stats: {
      hp: Math.max(1, Math.floor((72 + powerIndex * 13 + slot * 18 + scale * 18) * statScale * healthScale)),
      defense: Math.max(1, Math.floor((6 + powerIndex * 1.35 + slot * 2 + scale * 2) * statScale)),
      damage: Math.max(1, Math.floor((9 + powerIndex * 2.1 + slot * 3 + scale * 2) * statScale)),
    },
  };
}

function makeLocationStage(location, stageNumber, globalIndex) {
  const isFinalBoss = stageNumber === location.stages;
  const isAdvancedBoss = Boolean(location.advancedBossStages?.includes(stageNumber));
  const isStrong = location.strongStageNumbers
    ? location.strongStageNumbers.includes(stageNumber)
    : stageNumber % 4 === 0;
  const isBoss = isFinalBoss || isAdvancedBoss;
  const encounterFamilies = getEncounterFamilies(location, stageNumber);
  const statScale = encounterStatScale(location, stageNumber);
  const recommendedPower = Math.floor(
    location.suggestedPower
      + (stageNumber - 1) * Math.max(38, location.suggestedPower * 0.09)
      + (isBoss ? Math.max(80, location.suggestedPower * 0.18) : 0)
  );
  const rewards = {
    gold: 65 + globalIndex * 14 + location.order * 20,
    xp: 28 + globalIndex * 6 + location.order * 4,
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
    name: isFinalBoss ? getBossFamily(location, stageNumber)?.name || `${location.name} Guardian` : isAdvancedBoss ? getBossFamily(location, stageNumber)?.name || 'Advanced Guardian' : `Stage ${stageNumber}`,
    encounterType: isBoss ? 'BOSS' : isStrong ? 'ELITE' : 'NORMAL',
    recommendedPower,
    enemies: encounterFamilies.map((family, slot) => makeEnemy(location, stageNumber, slot, globalIndex + 1, family, statScale)),
    rewards,
    milestoneRewards: LOCATION_STAGE_MILESTONES[`${location.id}-${stageNumber}`] || [],
  };
}

let stageCursor = 0;
export let STAGE_DEFINITIONS = Object.freeze(
  LOCATION_DEFINITIONS.flatMap((location) => Array.from({ length: location.stages }, (_, index) => {
    const stage = makeLocationStage(location, index + 1, stageCursor);
    stageCursor += 1;
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
