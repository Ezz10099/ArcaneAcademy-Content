// Content is data, never expressions, markup, module paths or save migrations.
export const cloneContent = (value) => JSON.parse(JSON.stringify(value));
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const bad = (message) => { throw new Error(`Invalid content: ${message}`); };
function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) bad(`${label} must be an object`);
  for (const key of Object.keys(value)) if (['__proto__', 'constructor', 'prototype'].includes(key)) bad('unsafe key');
}
function keys(value, allowed, label) {
  object(value, label);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) bad(`${label}.${key} is not supported by this APK`);
}
function text(value, max = 300) {
  if (typeof value !== 'string' || value.length > max || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) bad('invalid plain text');
  return value;
}
function number(value, min, max, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) bad('numeric value out of range');
  return value;
}
function boolean(value) {
  if (typeof value !== 'boolean') bad('expected boolean');
  return value;
}
function color(value) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value)) bad('invalid color');
  return value;
}
function presentation(base, patch = {}) {
  keys(patch, ['battle', 'shell', 'combat', 'theme'], 'presentation');
  const result = cloneContent(base);
  if (own(patch, 'battle')) {
    const value = patch.battle;
    keys(value, [
      'fieldSideMargin', 'deckMinHeight', 'deckViewportHeight', 'deckMaxHeight',
      'deckSideMargin', 'headerSideMargin', 'headerTopInset', 'controlSize',
      'fieldLabelOffset', 'portraitMinHeight', 'portraitViewportHeight',
      'portraitMaxHeight', 'fieldDeckGap', 'toastGap', 'showFieldLabel', 'showStageSubtitle',
      'backgroundCover', 'backgroundZoom', 'backgroundPositionY',
    ], 'presentation.battle');
    const ranges = {
      fieldSideMargin: [0, 32], deckMinHeight: [72, 180], deckViewportHeight: [8, 24],
      deckMaxHeight: [90, 220], deckSideMargin: [0, 28], headerSideMargin: [0, 28],
      headerTopInset: [0, 40], controlSize: [44, 72], fieldLabelOffset: [40, 130],
      portraitMinHeight: [20, 64], portraitViewportHeight: [2, 10], portraitMaxHeight: [24, 80],
      fieldDeckGap: [0, 40], toastGap: [0, 48], backgroundZoom: [100, 160], backgroundPositionY: [0, 100],
    };
    for (const [key, v] of Object.entries(value)) {
      if (key === 'showFieldLabel' || key === 'showStageSubtitle' || key === 'backgroundCover') result.battle[key] = boolean(v);
      else result.battle[key] = number(v, ranges[key][0], ranges[key][1]);
    }
    if (result.battle.deckMinHeight > result.battle.deckMaxHeight) bad('battle deck minimum exceeds maximum');
    if (result.battle.portraitMinHeight > result.battle.portraitMaxHeight) bad('battle portrait minimum exceeds maximum');
  }
  if (own(patch, 'shell')) {
    const value = patch.shell;
    keys(value, [
      'hudTop', 'hudSide', 'hudHeight',
      'screenTop', 'screenSide', 'screenBottom',
      'navSide', 'navBottom', 'navHeight',
      'updateButtonRight', 'updateButtonBottom',
    ], 'presentation.shell');
    const ranges = {
      hudTop: [0, 30], hudSide: [0, 24], hudHeight: [52, 90],
      screenTop: [64, 150], screenSide: [0, 32], screenBottom: [70, 180],
      navSide: [0, 24], navBottom: [0, 24], navHeight: [56, 120],
      updateButtonRight: [4, 40], updateButtonBottom: [60, 160],
    };
    for (const [key, v] of Object.entries(value)) result.shell[key] = number(v, ranges[key][0], ranges[key][1]);
  }
  if (own(patch, 'combat')) {
    const value = patch.combat;
    keys(value, [
      'characterScale', 'bossScale',
      'frontTopY', 'frontBottomY', 'backTopY', 'backMiddleY', 'backBottomY',
      'playerFrontX', 'playerReserveX', 'playerCombatX',
      'playerBackGuardianX', 'playerBackStrikerX', 'playerBackMysticX',
      'enemyFrontX', 'enemyReserveX', 'enemyCombatX',
      'enemyBackGuardianX', 'enemyBackStrikerX', 'enemyBackMysticX',
      'effectScale', 'floatScale', 'motionSpeed', 'tick1Ms', 'tick2Ms', 'tick4Ms', 'maxTransientEffects',
    ], 'presentation.combat');
    const ranges = {
      characterScale: [0.28, 0.7], bossScale: [0.3, 0.8],
      frontTopY: [180, 420], frontBottomY: [320, 620],
      backTopY: [120, 360], backMiddleY: [220, 480], backBottomY: [360, 650],
      playerFrontX: [90, 190], playerReserveX: [55, 160], playerCombatX: [130, 235],
      playerBackGuardianX: [50, 150], playerBackStrikerX: [40, 145], playerBackMysticX: [35, 140],
      enemyFrontX: [290, 390], enemyReserveX: [320, 425], enemyCombatX: [245, 350],
      enemyBackGuardianX: [330, 430], enemyBackStrikerX: [335, 440], enemyBackMysticX: [340, 445],
      effectScale: [0.5, 1.8], floatScale: [0.7, 1.6], motionSpeed: [0.6, 1.8],
      tick1Ms: [700, 2600], tick2Ms: [350, 1600], tick4Ms: [180, 900],
      maxTransientEffects: [8, 40],
    };
    for (const [key, v] of Object.entries(value)) {
      result.combat[key] = number(v, ranges[key][0], ranges[key][1], key === 'maxTransientEffects' || key.startsWith('tick'));
    }
    if (result.combat.frontTopY >= result.combat.frontBottomY) bad('front slots must remain ordered');
    if (!(result.combat.backTopY < result.combat.backMiddleY && result.combat.backMiddleY < result.combat.backBottomY)) bad('back slots must remain ordered');
    if (result.combat.playerCombatX <= result.combat.playerFrontX) bad('player combat line must advance toward center');
    if (result.combat.enemyCombatX >= result.combat.enemyFrontX) bad('enemy combat line must advance toward center');
    if (!(result.combat.tick1Ms > result.combat.tick2Ms && result.combat.tick2Ms > result.combat.tick4Ms)) bad('battle cadence must remain ordered from x1 to x4');
  }
  if (own(patch, 'theme')) {
    const value = patch.theme;
    keys(value, ['gold', 'goldBright', 'bone', 'muted'], 'presentation.theme');
    for (const [key, v] of Object.entries(value)) result.theme[key] = color(v);
  }
  return result;
}
function stats(base, patch) {
  keys(patch, ['hp', 'defense', 'damage'], 'stats');
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) result[key] = number(value, key === 'defense' ? 0 : 1, 1000000, true);
  return result;
}
function rewards(base, patch) {
  keys(patch, ['gold', 'xp', 'crystals', 'premiumCrystals', 'awakeningShards'], 'rewards');
  return { ...base, ...Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, number(value, 0, 1000000, true)])) };
}
function ability(base, patch) {
  // Effect primitives/target selection stay owned by the installed engine.
  keys(patch, ['id', 'power', 'splashPower', 'barrierPower', 'statusPower', 'duration', 'hits', 'statusChance', 'stunChance'], 'ability');
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'id') result[key] = text(value, 80);
    else if (key.endsWith('Chance')) result[key] = number(value, 0, 1);
    else if (key === 'hits' || key === 'duration') result[key] = number(value, 1, 5, true);
    else result[key] = number(value, 0.01, 10);
  }
  return result;
}
function combat(base, patch, allowed) {
  keys(patch, allowed, 'combatant');
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'baseStats' || key === 'stats') result[key] = stats(base[key], value);
    else if (key.endsWith('Ability')) result[key] = ability(base[key], value);
    else if (key === 'name') result[key] = text(value, 80);
  }
  return result;
}
function records(base, patch = {}, transform) {
  object(patch, 'records');
  const ids = new Set(base.map((v) => v.id));
  for (const id of Object.keys(patch)) if (!ids.has(id)) bad(`unknown ID ${id}; requires a compatible catalog/engine update`);
  return base.map((value) => own(patch, value.id) ? transform(value, patch[value.id]) : cloneContent(value));
}

export function compileContentPatch(defaults, patch) {
  keys(patch, ['schema', 'message', 'heroes', 'stages', 'locations', 'quests', 'presentation'], 'patch');
  if (patch.schema !== 1) bad('unsupported data schema');
  const result = { message: own(patch, 'message') ? text(patch.message, 500) : '' };
  result.presentation = presentation(defaults.presentation, patch.presentation);
  result.heroes = records(defaults.heroes, patch.heroes, (base, value) => combat(base, value,
    ['name', 'baseStats', 'basicAbility', 'skillAbility', 'ultimateAbility']));
  result.locations = records(defaults.locations, patch.locations, (base, value) => {
    keys(value, ['description', 'suggestedPower', 'minimumAssignmentPower'], 'location');
    const next = { ...base };
    for (const [key, v] of Object.entries(value)) next[key] = key === 'description' ? text(v) : number(v, 1, 10000000, true);
    return next;
  });
  result.quests = records(defaults.quests, patch.quests, (base, value) => {
    keys(value, ['title', 'description', 'rewards'], 'quest');
    const next = { ...base };
    for (const [key, v] of Object.entries(value)) next[key] = key === 'rewards' ? rewards(base.rewards, v) : text(v);
    return next;
  });
  const templates = new Map();
  for (const stage of defaults.stages) for (const enemy of stage.enemies) if (!templates.has(enemy.name)) templates.set(enemy.name, enemy);
  result.stages = records(defaults.stages, patch.stages, (base, value) => {
    keys(value, ['name', 'recommendedPower', 'rewards', 'enemies'], 'stage');
    const next = cloneContent(base);
    if (own(value, 'name')) next.name = text(value.name, 100);
    if (own(value, 'recommendedPower')) next.recommendedPower = number(value.recommendedPower, 1, 10000000, true);
    if (own(value, 'rewards')) next.rewards = rewards(base.rewards, value.rewards);
    if (own(value, 'enemies')) {
      if (!Array.isArray(value.enemies) || value.enemies.length < 1 || value.enemies.length > 5) bad('encounters require 1–5 enemies');
      next.enemies = value.enemies.map((entry, index) => {
        keys(entry, ['template', 'stats', 'basicAbility', 'skillAbility', 'ultimateAbility'], 'enemy');
        if (!templates.has(entry.template)) bad('unknown enemy family');
        const { template, ...overrides } = entry;
        const slot = base.enemies[index];
        const local = slot?.name === template && slot.level != null ? slot : base.enemies.find((enemy) => enemy.name === template);
        const enemy = combat(local || templates.get(template), overrides, ['stats', 'basicAbility', 'skillAbility', 'ultimateAbility']);
        if (!local) delete enemy.level;
        enemy.id = `enemy-${base.locationId}-${base.stage}-${index + 1}`;
        return enemy;
      });
    }
    return next;
  });
  return result;
}
