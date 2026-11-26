import { rewardSummary } from './src/game/equipment-acquisition.js';
import { EQUIPMENT_RARITIES } from './src/game/equipment.js';
import { equipmentPanel, equipmentDialogs, inventoryEquipment, forgePanel } from './src/game/equipment-ui.js';
import { recyclingReward } from './src/game/equipment.js';
import { mountCampusWalker } from './src/animation/campus-walker.js';
import {
  CHAPTER_DEFINITIONS,
  CURRENCY,
  FOREST_GATE_STAGE_4_MIN_LEVEL,
  TRAINEE_SKILL_UNLOCK_LEVEL,
  CURRENCY_LABEL,
  HERO_DEFINITIONS,
  LOCATION_DEFINITIONS,
  PRESENTATION_CONFIG,
  RARITY_COLORS,
  getHeroDefinition,
  getChapterById,
  getLocationById,
  getRegionPresentation,
  getStageById,
} from './src/game/data.js';
import { GameSession, combatPowerFromStats, computeHeroStats, isSecondarySkillUnlocked, getHeroRankProgress } from './src/game/game.js';
import { getArchiveEntries, getMonsterPortrait } from './src/game/archive.js';
import { getBattlefieldArt } from './src/battle/location-battle-art.js';
import {
  BATTLEFIELD_WIDTH,
  BATTLEFIELD_HEIGHT,
  STANDEE_CONTACT_OFFSET_Y,
  DEPLOYMENT_SLOTS,
  DEPLOYMENT_TILE_WIDTH,
  DEPLOYMENT_TILE_HEIGHT,
  createPhaserBattleRenderer,
  getBattleCardPortrait,
  getBattleIdleArt,
  getBattleUnitHeadY,
  planBattleEntrance,
  resolveBattleFormation,
  resolveDeploymentFormation,
} from './src/battle/phaser-battle-renderer.js';
import { createPersistentStorage } from './src/platform/persistent-storage.js';
import { actionCue, createGameAudio } from './src/platform/game-audio.js';
import { mountGameSettings } from './src/platform/game-settings.js';

import { initializeContent, mountContentUpdates, contentReady } from './src/platform/content-updates.js';

await initializeContent();
const battleRenderer = createPhaserBattleRenderer();
void battleRenderer.preload();
const persistentStorage = await createPersistentStorage();
const gameAudio = createGameAudio({ storage: persistentStorage });
document.addEventListener('pointerdown', () => { void gameAudio.unlock(); }, { passive: true });
document.addEventListener('keydown', () => { void gameAudio.unlock(); });
document.addEventListener('visibilitychange', () => gameAudio.setHidden(document.hidden));
window.addEventListener('pagehide', () => gameAudio.setHidden(true));
window.addEventListener('pageshow', () => gameAudio.setHidden(document.hidden));
gameAudio.setHidden(document.hidden);
const fallbackBattlePositions = new WeakMap();
const game = new GameSession({
  storage: persistentStorage,
  getBattlePosition(battle, unitId) {
    const livePosition = battleRenderer.getUnitPosition(battle, unitId);
    if (livePosition) return livePosition;

    if (!fallbackBattlePositions.has(battle)) {
      const placements = [
        ...resolveBattleFormation(battle.player, 'player'),
        ...resolveBattleFormation(battle.enemies, 'enemy'),
      ];
      fallbackBattlePositions.set(battle, new Map(placements.map(({ unit, combatPosition }) => [unit.id, combatPosition])));
    }
    return fallbackBattlePositions.get(battle).get(unitId);
  },
});
const root = document.getElementById('game-root');
function applyPresentationConfig() {
  const battle = PRESENTATION_CONFIG.battle;
  const shell = PRESENTATION_CONFIG.shell;
  const theme = PRESENTATION_CONFIG.theme;
  const values = {
    '--shell-hud-top': shell.hudTop,
    '--shell-hud-side': shell.hudSide,
    '--shell-hud-height': shell.hudHeight,
    '--shell-screen-top': shell.screenTop,
    '--shell-screen-side': shell.screenSide,
    '--shell-screen-bottom': shell.screenBottom,
    '--shell-nav-side': shell.navSide,
    '--shell-nav-bottom': shell.navBottom,
    '--shell-nav-height': shell.navHeight,
    '--shell-update-right': shell.updateButtonRight,
    '--shell-update-bottom': shell.updateButtonBottom,
    '--battle-field-side': battle.fieldSideMargin,
    '--battlefield-width': BATTLEFIELD_WIDTH,
    '--battle-deck-min': battle.deckMinHeight,
    '--battle-deck-vh': battle.deckViewportHeight,
    '--battle-deck-max': battle.deckMaxHeight,
    '--battle-deck-side': battle.deckSideMargin,
    '--battle-header-side': battle.headerSideMargin,
    '--battle-header-top': battle.headerTopInset,
    '--battle-control-size': battle.controlSize,
    '--battle-label-offset': battle.fieldLabelOffset,
    '--battle-portrait-min': battle.portraitMinHeight,
    '--battle-portrait-vh': battle.portraitViewportHeight,
    '--battle-portrait-max': battle.portraitMaxHeight,
    '--battle-field-deck-gap': battle.fieldDeckGap,
    '--battle-toast-gap': battle.toastGap,
    '--battle-background-size': battle.backgroundZoom === 100 ? 'cover' : `auto ${battle.backgroundZoom}%`,
    '--battle-background-y': battle.backgroundPositionY,
  };
  for (const [name, value] of Object.entries(values)) root.style.setProperty(name, String(value));
  root.style.setProperty('--gold', theme.gold);
  root.style.setProperty('--gold-bright', theme.goldBright);
  root.style.setProperty('--bone', theme.bone);
  root.style.setProperty('--muted', theme.muted);
  root.classList.toggle('battle-hide-field-label', !battle.showFieldLabel);
  root.classList.toggle('battle-hide-stage-subtitle', !battle.showStageSubtitle);
  root.classList.toggle('battle-cover-background', battle.backgroundCover);
}
applyPresentationConfig();
const queryParams = new URLSearchParams(window.location.search);
const devMode = queryParams.has('dev') || window.location.hash.includes('dev');
const visualQaMode = queryParams.has('visualqa');
const previewToolsEnabled = devMode || visualQaMode;

window.addEventListener('pagehide', () => {
  void persistentStorage.flush();
});

const ui = {
  view: 'ACADEMY',
  expeditionMode: 'LOCATION',
  selectedLocationId: game.getActiveLocation()?.id || 'forest-gate',
  selectedStageId: game.getCurrentStage()?.id,
  formationStageId: game.getCurrentStage()?.id,
  formationPickId: null,
  activeBanner: 'BASIC',
  showSummonResults: false,
  battleTimer: null,
  battleActionClock: 0,
  battleStarted: false,
  deployedFromFormation: false,
  battleEntering: false,
  battlePaused: false,
  battleRendererReady: false,
  battleMountToken: 0,
  battleSpeed: 1,
  autoUltimates: true,
  ultimateChargeHolds: new Set(),
  selectedHeroId: game.heroes[0]?.id || null,
  traineeNotice: '',
  traineeSort: 'rarity',
  traineeTab: 'overview',
  archiveCategory: 'monsters',
  archiveEntryId: null,
  archiveDiscoveredOnly: false,
  archiveSort: 'default',
  devPanelOpen: previewToolsEnabled,
};

mountContentUpdates({
  canRestart: () => ui.view !== 'BATTLE',
  flush: () => persistentStorage.flush(),
  backup: () => persistentStorage.snapshot?.(),
  resetSave: async () => {
    game.reset();
    if (!await persistentStorage.flush()) throw new Error('The reset could not be saved. Please try again.');
    window.location.reload();
  },
});

mountGameSettings({
  audio: gameAudio, storage: persistentStorage, game,
  onFrameRateChange: battleRenderer.setFrameRateLimit,
  onDeveloperModeChange: () => render(),
  getBattleDiagnostics: () => battleRenderer.getDiagnostics().runtime,
  canRestore: () => ui.view !== 'BATTLE',
  onSuspend: () => {
    game.save();
    if (ui.view === 'BATTLE' && ui.battleStarted && !ui.battlePaused) {
      ui.battlePaused = true;
      restartBattleTimer();
      refreshBattleView();
    }
  },
  onBack: () => {
    if (ui.view === 'BATTLE') {
      ui.battlePaused = true;
      restartBattleTimer();
      refreshBattleView();
      if (!window.confirm('Leave this battle and return to the academy?')) return;
    }
    if (ui.view !== 'ACADEMY') setView('ACADEMY');
    else void window.Capacitor?.Plugins?.App?.minimizeApp();
  },
});

const PREVIEW_SQUAD = Object.freeze([
  ['hero_cinder_vale', 'FRONT', 8],
  ['hero_frost_warden_kael', 'FRONT', 7],
  ['hero_yssa_driftborn', 'BACK', 8],
  ['hero_lumen_solis', 'BACK', 7],
  ['hero_sera_ashveil', 'BACK', 6],
]);

const DEV_STATES = Object.freeze([
  ['campaign', 'Expedition'],
  ['victory', 'Victory'],
  ['claimed', 'Claimed'],
  ['formation', 'Formation 5v5'],
  ['battle', 'Battle 5v5'],
  ['summonLocked', 'Locked'],
  ['summonOpen', 'Recruit'],
  ['defeat', 'Defeat'],
]);


function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(value) {
  return Math.floor(value || 0).toLocaleString();
}

function formatRewards(rewards, traineeXp, lessonScrolls) {
  const parts = [
    rewards.gold ? `${formatNumber(rewards.gold)} gold` : '',
    traineeXp ? `${formatNumber(traineeXp)} XP each` : '',
    lessonScrolls ? `${formatNumber(lessonScrolls)} Lesson Scrolls` : '',
    rewards.crystals ? `${formatNumber(rewards.crystals)} crystals` : '',
    rewards.premiumCrystals ? `${formatNumber(rewards.premiumCrystals)} Lumens` : '',
  ].filter(Boolean);
  return parts.join(' / ') || 'No rewards';
}

function formatSystem(system) {
  return String(system || '').replaceAll('_', ' ');
}

function formatTerm(value) {
  const term = String(value || '').toLowerCase();
  return term ? `${term[0].toUpperCase()}${term.slice(1)}` : '';
}

function sigilLetters(value, fallback = 'AA') {
  const letters = String(value || '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return letters || fallback;
}

function traineePortrait(hero) {
  return getBattleCardPortrait({ ...hero, side: 'player' });
}

function renderTraineePortraitImage(portrait) {
  return portrait
    ? `<img class="trainee-pose-image" src="${esc(portrait.src)}" alt="" style="--portrait-x:${portrait.x}%;--portrait-y:${portrait.y}%;" loading="lazy">`
    : '';
}

function formatDuration(ms = 0) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function pct(current, max) {
  return `${Math.max(0, Math.min(100, Math.round((current / Math.max(1, max)) * 100)))}%`;
}

function rarityColor(rarity) {
  return RARITY_COLORS[rarity] || RARITY_COLORS.COMMON;
}

function visualClass(entity) {
  return `class-${String(entity?.heroClass || 'guardian').toLowerCase()} affinity-${String(entity?.affinity || 'flame').toLowerCase()} rarity-${String(entity?.rarity || 'common').toLowerCase()}`;
}

function setView(view) {
  if (view !== 'SUMMON') ui.showSummonResults = false;
  if (view !== 'TRAINING') trainingPractice = null;
  ui.view = view;
  if (view === 'CAMPAIGN') {
    ui.expeditionMode = 'LOCATION';
    const activeLocation = game.getActiveLocation();
    ui.selectedLocationId = activeLocation?.id || 'forest-gate';
    ui.selectedStageId = game.getCurrentStage(ui.selectedLocationId)?.id || ui.selectedStageId;
  }
  if (view === 'FORMATION') {
    ui.formationStageId = ui.selectedStageId || game.getCurrentStage(ui.selectedLocationId)?.id;
    ui.formationPickId = null;
  }
  if (view === 'HEROES' && !game.getHero(ui.selectedHeroId)) ui.selectedHeroId = game.heroes[0]?.id || null;
  render();
}

function grantPreviewCurrencies() {
  game.addLessonScrolls(Math.max(0, 2000 - game.lessonScrolls));
  game.currencies[CURRENCY.GOLD] = Math.max(game.currencies[CURRENCY.GOLD] || 0, 250000);
  game.currencies[CURRENCY.CRYSTALS] = Math.max(game.currencies[CURRENCY.CRYSTALS] || 0, 12000);
  game.currencies[CURRENCY.PREMIUM_CRYSTALS] = Math.max(game.currencies[CURRENCY.PREMIUM_CRYSTALS] || 0, 2500);
}

function addPreviewHero(heroDefId, level = 6) {
  const definition = getHeroDefinition(heroDefId);
  if (!definition) return null;
  game.addHeroFromDefinition(definition);
  const hero = game.heroes.find((item) => item.heroDefId === heroDefId);
  if (!hero) return null;
  hero.level = Math.max(hero.level || 1, level);
  return hero;
}

function setupPreviewSquad() {
  grantPreviewCurrencies();
  const entries = [];
  for (const [heroDefId, row, level] of PREVIEW_SQUAD) {
    const hero = addPreviewHero(heroDefId, level);
    if (hero) entries.push({ heroId: hero.id, row });
  }
  game.saveData.activeSquad = game.normalizeActiveSquad(entries);
}

function forceBattleResult(stageId, result) {
  game.beginBattle(stageId);
  if (!game.battle) return;
  for (let i = 0; i < 24 && !game.battle.result; i += 1) game.stepBattle();
  if (result === 'player_win' && game.battle.result !== 'player_win') {
    for (const enemy of game.battle.enemies) enemy.hp = 0;
  }
  if (result === 'enemy_win') {
    for (const hero of game.battle.player) hero.hp = 0;
    for (const enemy of game.battle.enemies) enemy.hp = Math.max(1, enemy.hp);
  }
  game.battle.result = result;
  game.battle.lastAction = game.battle.events[game.battle.events.length - 1] || null;
}

function applyDevState(state) {
  game.reset();
  ui.battleStarted = false;
  ui.battlePaused = true;
  ui.battleRendererReady = false;
  ui.battleSpeed = 1;
  ui.autoUltimates = true;
  ui.expeditionMode = 'LOCATION';
  ui.selectedLocationId = 'forest-gate';
  if (state !== 'summonLocked') setupPreviewSquad();

  const clearThrough = (locationId, stageNumber) => {
    const ids = game.getStageList(locationId).filter((stage) => stage.stage <= stageNumber).map((stage) => stage.id);
    game.saveData.expeditionProgress.clearedStageIds.push(...ids);
    game.saveData.expeditionProgress.clearedStageIds = Array.from(new Set(game.saveData.expeditionProgress.clearedStageIds));
  };

  if (state === 'campaign') {
    clearThrough('forest-gate', 5);
    ui.selectedLocationId = 'sprite-grove';
    game.setActiveLocation('sprite-grove');
    ui.selectedStageId = 'sprite-grove-1';
    ui.view = 'CAMPAIGN';
  }
  if (state === 'victory') {
    ui.selectedStageId = 'forest-gate-1';
    forceBattleResult('forest-gate-1', 'player_win');
    ui.battleStarted = true;
    ui.view = 'BATTLE';
  }
  if (state === 'claimed') {
    ui.selectedStageId = 'forest-gate-1';
    forceBattleResult('forest-gate-1', 'player_win');
    game.collectBattleRewards();
    ui.battleStarted = true;
    ui.view = 'BATTLE';
  }
  const prepareFiveVsFiveStage = () => {
    clearThrough('forest-gate', 99);
    clearThrough('sprite-grove', 99);
    clearThrough('deeper-woods', 17);
    ui.selectedLocationId = 'deeper-woods';
    game.setActiveLocation('deeper-woods');
    ui.selectedStageId = 'deeper-woods-18';
    return ui.selectedStageId;
  };

  if (state === 'formation') {
    ui.formationStageId = prepareFiveVsFiveStage();
    ui.view = 'FORMATION';
  }
  if (state === 'battle') {
    const stageId = prepareFiveVsFiveStage();
    game.beginBattle(stageId);
    if (game.battle && !game.battle.result) game.stepBattle();
    ui.battleStarted = true;
    ui.deployedFromFormation = true;
    ui.battlePaused = true;
    ui.view = 'BATTLE';
  }
  if (state === 'summonLocked') {
    ui.activeBanner = 'BASIC';
    ui.view = 'SUMMON';
  }
  if (state === 'summonOpen') {
    game.unlock('BASIC_SUMMON');
    game.pull('BASIC', 10);
    ui.activeBanner = 'BASIC';
    ui.view = 'SUMMON';
  }
  if (state === 'defeat') {
    clearThrough('forest-gate', 2);
    game.saveData.activeSquad = game.normalizeActiveSquad(game.saveData.activeSquad.slice(0, 1));
    ui.selectedStageId = 'forest-gate-3';
    forceBattleResult('forest-gate-3', 'enemy_win');
    ui.battleStarted = true;
    ui.view = 'BATTLE';
  }

  game.addLog(`Preview state: ${state}.`);
  game.save();
  render();
}

function prepareBattle(stageId = ui.selectedStageId || game.getCurrentStage()?.id) {
  const fromFormation = ui.view === 'FORMATION';
  const battle = game.beginBattle(stageId);
  if (!battle) {
    game.addLog('That expedition stage is still locked.');
    game.save();
    render();
    return;
  }
  if (ui.battleTimer) window.clearInterval(ui.battleTimer);
  ui.battleTimer = null;
  ui.ultimateChargeHolds.clear();
  ui.view = 'BATTLE';
  ui.battleStarted = false;
  ui.deployedFromFormation = fromFormation;
  ui.battleEntering = false;
  ui.battlePaused = true;
  ui.battleRendererReady = false;
  ui.formationPickId = null;
  render();
  void battleRenderer.preloadEncounter(battle);
}

function startPreparedBattle() {
  const battle = game.battle;
  if (!battle || battle.result || ui.battleStarted || ui.battleEntering || !ui.battleRendererReady) return;
  const mountToken = ui.battleMountToken;
  const panel = root.querySelector('.phaser-battle-panel');
  ui.battleEntering = true;
  panel.querySelector('.battle-start-overlay')?.remove();
  refreshBattleView();
  const complete = () => {
    if (ui.view !== 'BATTLE' || game.battle !== battle || ui.battleMountToken !== mountToken) return;
    ui.battleEntering = false;
    game.lockBattleOpeningTargets();
    ui.battleStarted = true;
    ui.battlePaused = false;
    ui.battleActionClock = 0;
    refreshBattleView();
    restartBattleTimer();
  };

  if (battleRenderer.playEntrance(ui.battleSpeed, complete)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    complete();
    return;
  }
  const units = new Map([...panel.querySelectorAll('[data-entrance-unit]')].map((unit) => [unit.dataset.entranceUnit, unit]));
  const animations = planBattleEntrance(battle, ui.battleSpeed).flatMap(({ id, origin, destination, delay, duration }) => {
    const unit = units.get(id);
    if (!unit?.animate) return [];
    return [unit.animate([
      { left: `${origin.x / BATTLEFIELD_WIDTH * 100}%` },
      { left: `${destination.x / BATTLEFIELD_WIDTH * 100}%` },
    ], { delay, duration, fill: 'both' })];
  });
  Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
    complete();
    animations.forEach((animation) => animation.cancel());
  });
}

function collectBattle(goNext = false) {
  const stageId = game.battle?.stageId;
  const receipt = game.collectBattleRewards() || game.battle?.rewardReceipt;
  const nextStageId = receipt?.nextStageId;
  const unlockedBasicSummon = receipt?.milestoneRewards?.some((reward) => reward.type === 'unlockSystem' && reward.system === 'BASIC_SUMMON');
  ui.selectedLocationId = receipt?.locationId || ui.selectedLocationId;
  ui.selectedStageId = nextStageId || stageId || ui.selectedStageId;

  if (receipt?.revealChapterMap) {
    ui.expeditionMode = 'CHAPTER_MAP';
    ui.view = 'CAMPAIGN';
    render();
    return;
  }
  if (unlockedBasicSummon) {
    ui.activeBanner = 'BASIC';
    setView('SUMMON');
    return;
  }
  if (goNext && nextStageId && nextStageId !== stageId) {
    ui.selectedStageId = nextStageId;
    setView('FORMATION');
    return;
  }
  ui.expeditionMode = 'LOCATION';
  ui.view = 'CAMPAIGN';
  render();
}

function restartBattleTimer() {
  if (ui.battleTimer) window.clearInterval(ui.battleTimer);
  ui.battleTimer = null;
  if (!ui.battleStarted || ui.battlePaused || !game.battle || game.battle.result) return;
  const cadence = PRESENTATION_CONFIG.combat;
  const referenceMs = ui.battleSpeed === 4 ? cadence.tick4Ms : ui.battleSpeed === 2 ? cadence.tick2Ms : cadence.tick1Ms;
  let lastUpdate = performance.now();
  ui.battleTimer = window.setInterval(() => {
    const now = performance.now();
    const elapsed = now - lastUpdate;
    lastUpdate = now;
    if (ui.view !== 'BATTLE' || ui.battlePaused || !game.battle || game.battle.result) return;
    const nextActionAt = game.getNextBattleActionAt();
    // Bound clock catch-up after a paused frame without tying due actions to animation.
    ui.battleActionClock = Math.min(nextActionAt + 1000,
      Math.max(ui.battleActionClock, game.battle.actionTime) + elapsed * 1000 / referenceMs);
    if (ui.battleActionClock >= nextActionAt) advanceBattle();
  }, 40);
}

function castBattleUltimate(heroId) {
  if (!game.useUltimate(heroId)) return false;
  ui.ultimateChargeHolds.add(heroId);
  const castBattle = game.battle;
  // The Phaser cast completion releases this hold; this also covers the DOM fallback.
  window.setTimeout(() => {
    if (game.battle !== castBattle) return;
    if (ui.ultimateChargeHolds.delete(heroId) && ui.view === 'BATTLE') refreshBattleView();
  }, 2200 / ui.battleSpeed);
  return true;
}

function triggerReadyUltimates() {
  if (!ui.autoUltimates || !game.battle) return;
  for (const hero of game.battle.player) {
    if (hero.hp > 0 && hero.ultimateCharge >= 100) {
      castBattleUltimate(hero.id);
    }
  }
}

function refreshBattleView() {
  if (ui.view !== 'BATTLE' || !game.battle) {
    render();
    return;
  }

  battleRenderer.sync(game.battle, {
    speed: ui.battleSpeed, started: ui.battleStarted,
    chargeHolds: ui.ultimateChargeHolds,
    onResultPresented: () => {
      if (ui.view === 'BATTLE') refreshBattleView();
    },
    onUltimatePresented: (heroId) => {
      if (ui.ultimateChargeHolds.delete(heroId) && ui.view === 'BATTLE') refreshBattleView();
    },
  });
  syncGameAudio();
  const battlePanel = root.querySelector('.phaser-battle-panel');
  battlePanel?.classList.toggle('battle-started', ui.battleStarted);
  battlePanel?.style.setProperty('--battle-approach-duration', `${Math.max(150, 520 / ui.battleSpeed)}ms`);
  const status = root.querySelector('[data-battle-status]');
  const statusText = battleStatusText(game.battle);
  if (status && status.textContent !== statusText) status.textContent = statusText;
  updateBattleHeroDeck(game.battle.player);
  const resultSlot = root.querySelector('.battle-result-slot');
  if (resultSlot && !game.battle.result && !devMode) {
    const liveStatus = resultSlot.querySelector('.battle-live-status');
    const latestEvent = game.battle.events.at(-1);
    const message = ui.battleStarted ? battleEventMessage(latestEvent) : '';
    if (liveStatus && liveStatus.textContent !== message) liveStatus.textContent = message;
  } else if (resultSlot && !resultSlot.querySelector('.battle-defeat-dialog[open]')) {
    const resultMarkup = renderBattleResult(game.battle, getStageById(game.battle.stageId));
    if (resultSlot.battleMarkup !== resultMarkup) {
      resultSlot.battleMarkup = resultMarkup;
      resultSlot.innerHTML = resultMarkup;
      showBattleDefeatDialog();
    }
  }

  const pauseButton = root.querySelector('[data-action="pause-battle"]');
  if (pauseButton) {
    const pauseIcon = pauseButton.querySelector('img');
    const pauseIconPath = `${BATTLE_ICON_PATH}${ui.battlePaused ? 'play' : 'pause'}.webp`;
    if (pauseIcon.getAttribute('src') !== pauseIconPath) pauseIcon.src = pauseIconPath;
    pauseButton.classList.toggle('active', ui.battlePaused);
    pauseButton.disabled = !ui.battleStarted || Boolean(game.battle.result);
    pauseButton.setAttribute('aria-label', ui.battlePaused ? 'Resume battle' : 'Pause battle');
    pauseButton.setAttribute('aria-pressed', String(ui.battlePaused));
  }
  const speedButton = root.querySelector('[data-action="speed-battle"]');
  if (speedButton) {
    const multiplier = speedButton.querySelector('.battle-speed-value');
    const speedText = `×${ui.battleSpeed}`;
    if (multiplier.textContent !== speedText) multiplier.textContent = speedText;
    speedButton.setAttribute('aria-label', `Battle speed ${ui.battleSpeed} times`);
  }
  const autoButton = root.querySelector('[data-action="auto-ult"]');
  if (autoButton) {
    autoButton.classList.toggle('active', ui.autoUltimates);
    autoButton.setAttribute('aria-pressed', String(ui.autoUltimates));
  }

  const startOverlay = root.querySelector('.battle-start-overlay');
  const startButton = root.querySelector('[data-action="begin-battle"]');
  if (startOverlay) {
    startOverlay.classList.toggle('ready', ui.battleRendererReady);
    startOverlay.setAttribute('aria-busy', String(!ui.battleRendererReady));
  }
  if (startButton) {
    startButton.disabled = !ui.battleRendererReady;
    startButton.textContent = ui.battleRendererReady ? 'START' : 'PREPARING…';
  }
}

function advanceBattle() {
  triggerReadyUltimates();
  game.stepBattle();
  triggerReadyUltimates();
  refreshBattleView();
}

const CURRENCY_ICONS = {
  [CURRENCY.GOLD]: 'final-assets/upper-hud/gold-coin.png',
  [CURRENCY.LESSON_SCROLLS]: 'final-assets/currencies/lesson-scrolls.webp',
  [CURRENCY.CRYSTALS]: 'final-assets/upper-hud/blue-crystal.png',
  [CURRENCY.PREMIUM_CRYSTALS]: 'final-assets/expedition/stage-info-panel/lumen-reward-icon.png',
  [CURRENCY.FRAGMENTS]: 'final-assets/currencies/training-seal.webp',
};

function renderTopHud(extraClass = '', currencies = []) {
  return `
    <header class="top-hud ${esc(extraClass)}">
      <div class="ruler">
        <div class="avatar">${extraClass === 'campus-hud' ? renderTraineeIcon('profile-crest') : 'AA'}</div>
        <div>
          <div class="ruler-title">Academy Master</div>
          <div class="ruler-power">Power ${formatNumber(game.getRosterPower())}</div>
        </div>
      </div>
      <div class="currencies">
        ${currencies.map(renderCurrency).join('')}
      </div>
      <button class="content-updates-button" data-action="content-updates" type="button">Updates</button>
      <button class="audio-settings-button" data-action="game-settings" type="button" aria-label="Game settings">⚙ Settings</button>
    </header>
  `;
}

function renderCurrency(currency) {
  return `
    <div class="currency" data-currency="${currency}" data-icon="${CURRENCY_ICONS[currency]}">
      <span class="currency-mark"></span>
      <span class="currency-value">${formatNumber(game.getCurrencyBalance(currency))}</span>
      <span class="currency-label">${esc(CURRENCY_LABEL[currency])}</span>
    </div>
  `;
}

function renderBottomNav() {
  const tabs = [
    ['ACADEMY', 'Academy', 'academy', 'final-assets/navigation/bottom-tabs/academy-tab.png'],
    ['HEROES', 'Combatants', 'trainees', 'final-assets/navigation/bottom-tabs/trainees-tab.png'],
    ['CAMPAIGN', 'Expedition', 'expedition', 'final-assets/navigation/bottom-tabs/expedition-tab.png'],
    ['SUMMON', 'Recruit', 'summon', 'final-assets/navigation/bottom-tabs/summon-tab.png'],
    ['SYSTEMS', 'Archive', 'archive', 'final-assets/navigation/bottom-tabs/archive-tab.png'],
  ];
  return `
    <nav class="bottom-nav">
      ${tabs.map(([key, label, icon, asset]) => `
        <button class="nav-button nav-${icon} ${ui.view === key ? 'active' : ''}" data-view="${key}" type="button">
          <span class="nav-glyph" aria-hidden="true">
            <img class="nav-icon" src="${asset}" alt="" loading="eager" decoding="async">
          </span>
          <span class="nav-label">${label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

function getPrimaryQuest() {
  const quests = game.getQuestList();
  return quests.find((quest) => quest.complete && !quest.claimed)
    || quests.find((quest) => !quest.claimed)
    || null;
}

function getNextMilestoneStage() {
  return game.getStageList().find((stage) => !stage.cleared && (stage.milestoneRewards?.length || 0));
}

function renderQuestFocus() {
  const quest = getPrimaryQuest();
  const milestoneStage = getNextMilestoneStage();
  const milestoneHints = milestoneStage?.rewardPreview?.milestoneRewards?.map((reward) => reward.hint).filter(Boolean) || [];
  if (!quest && !milestoneStage) return '';
  const rewardText = quest ? [
    quest.rewards.gold ? `${formatNumber(quest.rewards.gold)} Gold` : '',
    quest.rewards.crystals ? `${formatNumber(quest.rewards.crystals)} Crystals` : '',
    quest.rewards.premiumCrystals ? `${formatNumber(quest.rewards.premiumCrystals)} Lumens` : '',
    quest.rewards.awakeningShards ? `${formatNumber(quest.rewards.awakeningShards)} Resonance` : '',
  ].filter(Boolean).join(' / ') : '';
  const questPercent = quest ? Math.min(100, Math.floor((quest.progress / Math.max(1, quest.target)) * 100)) : 0;
  return `
    <section class="quest-focus">
      ${quest ? `
        <article class="quest-card ${quest.complete && !quest.claimed ? 'ready' : ''}">
          <div class="quest-copy">
            <div class="kicker">${quest.complete && !quest.claimed ? 'Ready To Claim' : 'Current Goal'}</div>
            <div class="quest-title">${esc(quest.title)}</div>
            <div class="quest-meta">${esc(quest.description)}</div>
            <div class="quest-reward">${esc(rewardText)}</div>
            <div class="quest-track"><span style="--quest-progress:${questPercent}%;"></span></div>
          </div>
          ${quest.complete && !quest.claimed
            ? `<button class="battle-button" data-action="claim-quest" data-quest="${quest.id}" type="button">Claim</button>`
            : `<div class="quest-state">${formatNumber(quest.progress)}/${formatNumber(quest.target)}</div>`}
        </article>
      ` : ''}
      ${milestoneStage ? `
        <article class="quest-card milestone-card">
          <div class="quest-copy">
            <div class="kicker">Next Big Unlock</div>
            <div class="quest-title">${esc(milestoneStage.id)} ${esc(milestoneStage.name)}</div>
            <div class="quest-meta">${esc(milestoneHints.join(' / ') || 'Clear this stage to keep the academy growing.')}</div>
          </div>
        </article>
      ` : ''}
    </section>
  `;
}

function renderIdleSanctum() {
  const preview = game.getIdleRewardPreview();
  const { rewards, rates, elapsedMs, capMs, capped } = preview;
  const fill = Math.max(4, Math.min(100, Math.round((elapsedMs / Math.max(1, capMs)) * 100)));
  return `
    <section class="idle-sanctum">
      <article class="idle-card">
        <div class="idle-copy">
          <div class="kicker">Passive Lessons</div>
          <div class="quest-title">${formatDuration(elapsedMs)} stored${capped ? ' / cap reached' : ''}</div>
          <div class="quest-meta">Passive training rewards scale with expedition depth. Claim before the lesson ledger overflows.</div>
          <div class="idle-track"><span style="--idle-progress:${fill}%;"></span></div>
          <div class="reward-row idle-reward-row">
            <span>Gold ${formatNumber(rewards.gold)}</span>
            <span>Lesson Scrolls ${formatNumber(rewards.xp)}</span>
            <span>Crystals ${formatNumber(rewards.crystals)}</span>
          </div>
          ${preview.equipmentPreview.unlocked ? `<div class="quest-meta">Passive loot: ${preview.equipmentPreview.rolls} rolls ready · ${Math.round(preview.equipmentPreview.chance*100)}% gear / ${Math.round(preview.equipmentPreview.materialChance*100)}% 1 enhancement material per 2h · ${formatDuration(preview.equipmentPreview.carryMs)} toward next roll</div>` : '<div class="quest-meta">Passive loot unlocks after 5 campaign clears.</div>'}
          ${rates.catchupActive ? `<div class="quest-meta">Wild Forest training support: ×${rates.catchupMultiplier} Lesson Scrolls active.</div>` : !rates.wildForestComplete ? `<div class="quest-meta">Training support after ${formatDuration(rates.catchupRemainingMs)} more claimed idle time.</div>` : ''}
          <div class="quest-meta">Rate: ${formatNumber(rates.goldPerHour)}/h gold / ${formatNumber(rates.xpPerHour)}/h XP / ${formatNumber(rates.crystalsPerInterval)} crystals every ${formatDuration(rates.intervalMs)}</div>
        </div>
        <button class="battle-button" data-action="claim-idle" type="button" ${rewards.gold || rewards.xp || rewards.crystals ? '' : 'disabled'}>Claim</button>
      </article>
    </section>
  `;
}


function renderSynergyPanel() {
  const synergy = game.getSquadSynergy();
  return `
    <section class="synergy-panel">
      <div class="reserve-title">Formation Resonance</div>
      <article class="quest-card">
        <div class="quest-copy">
          <div class="quest-title">${esc(synergy.title)} ${synergy.bonusPct ? `+${synergy.bonusPct}%` : ''}</div>
          <div class="quest-meta">${esc(synergy.detail)}</div>
          <div class="quest-reward">${esc(synergy.summary)}</div>
          <div class="synergy-gems">
            ${[['FLAME', 'FL'], ['FROST', 'FR'], ['ARCANE', 'AR']].map(([affinity, label]) => `<span class="synergy-gem ${affinity.toLowerCase()} ${synergy.counts[affinity] ? 'active' : ''}">${label}${synergy.counts[affinity] ? ` x${synergy.counts[affinity]}` : ''}</span>`).join('')}
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderSystemStatuses() {
  const synergy = game.getSquadSynergy();
  const idle = game.getIdleRewardPreview();
  const statuses = [
    { label: 'PASSIVE_LESSONS', open: true, detail: `${formatDuration(idle.elapsedMs)} stored` },
    { label: 'FORMATION_RESONANCE', open: synergy.bonusPct > 0, detail: synergy.bonusPct ? `+${synergy.bonusPct}% formation stats` : 'Assemble affinities' },
    { label: 'BASIC_SUMMON', open: game.isUnlocked('BASIC_SUMMON'), detail: game.isUnlocked('BASIC_SUMMON') ? 'Enrollment ritual opened' : 'Clear Forest Gate Stage 4' },
    { label: 'ADVANCED_SUMMON', open: game.isUnlocked('ADVANCED_SUMMON'), detail: 'Higher-rarity enrollment' },
    { label: 'ARENA', open: game.isUnlocked('ARENA'), detail: 'PvP academy trials' },
    { label: 'GUILD', open: game.isUnlocked('GUILD'), detail: 'Alliance progression' },
    { label: 'WORLD_BOSS_HARD_TIER', open: game.isUnlocked('WORLD_BOSS_HARD_TIER'), detail: 'Server-scale expedition hunts' },
    { label: 'FULL_ENDLESS_CONTENT', open: game.isUnlocked('FULL_ENDLESS_CONTENT'), detail: 'Late-game archive loops' },
  ];
  return `
    <section class="system-list">
      ${statuses.map((system) => `<div class="system-row ${system.open ? 'unlocked' : ''}"><span>${esc(formatSystem(system.label))}<small>${esc(system.detail)}</small></span><b>${system.open ? 'OPEN' : 'LOCKED'}</b></div>`).join('')}
    </section>
  `;
}

function getLocationUnlockText(location) {
  const rule = location?.unlockRule || {};
  if (rule.type === 'STARTER') return 'Starting Location';
  if (rule.type === 'LOCATION_COMPLETE') return `Complete ${getLocationById(rule.locationId)?.name || 'the previous Location'}`;
  if (rule.type === 'LOCATION_PERCENTAGES') {
    return (rule.requirements || []).map((item) => `${item.percent}% ${getLocationById(item.locationId)?.name || item.locationId}`).join(' + ');
  }
  if (rule.type === 'COMPLETED_LOCATION_COUNT') return `Complete any ${rule.count} Locations`;
  if (rule.type === 'REQUIRED_LOCATIONS_COMPLETE') return 'Complete all required Locations';
  return 'Progress through Region One';
}

function getVisibleLocationStages(stages, selectedStage) {
  if (!stages.length) return [];
  const focusIndex = Math.max(0, stages.findIndex((stage) => stage.current) >= 0
    ? stages.findIndex((stage) => stage.current)
    : stages.findIndex((stage) => stage.id === selectedStage?.id));
  const resolvedFocus = focusIndex >= 0 ? focusIndex : stages.length - 1;
  const start = Math.max(0, resolvedFocus - 2);
  const end = Math.min(stages.length, resolvedFocus + 4);
  return stages.slice(start, end).reverse();
}

function renderStageRewardItems(rewardPreview) {
  const rewards = rewardPreview?.rewards || {};
  const items = [
    ['final-assets/expedition/stage-info-panel/gold-reward-icon.png', 'Gold', rewards.gold],
    ['final-assets/expedition/stage-info-panel/academy-exp-reward-icon.png', 'XP per combatant', rewardPreview?.traineeXp],
    [CURRENCY_ICONS[CURRENCY.LESSON_SCROLLS], 'Lesson Scrolls', rewardPreview?.lessonScrolls],
    ['final-assets/upper-hud/blue-crystal.png', 'Blue Crystals', rewards.crystals],
    ['final-assets/expedition/stage-info-panel/lumen-reward-icon.png', 'Lumens', rewards.premiumCrystals],
  ].filter(([, , value]) => value);
  if (!rewardPreview?.firstClear) return `<div class="completed-stage-copy">${game.developerMode ? 'Replay · First-clear rewards already claimed' : 'Completed — No Replay'}</div>`;
  const equipment=rewardPreview.equipmentReward;
  return items.map(([asset, label, value]) => `
    <span class="location-reward-item">
      <img src="${asset}" alt="" aria-hidden="true">
      <b>${formatNumber(value)}</b><small>${esc(label)}</small>
    </span>
  `).join('')+(equipment?.items||[]).map(item=>`<span class="location-reward-item"><img src="final-assets/equipment/${item.type.toLowerCase()}-${item.slot.toLowerCase()}.svg" alt=""><b style="color:${EQUIPMENT_RARITIES[item.rarity].color}">${esc(formatTerm(item.rarity))}</b><small>${esc(item.name)} · Lv ${item.baseLevel||1}</small></span>`).join('')+(equipment?.materials?`<span class="location-reward-item"><b>+${equipment.materials}</b><small>Enhancement Materials</small></span>`:'');
}

function renderChapterMap(chapter, locations, summary) {
  return `
    ${renderTopHud('expedition-hud')}
    <main class="screen chapter-map-screen region-wild-forest">
      <section class="chapter-map-hero">
        <h1>${esc(chapter.name)}</h1>
        ${game.developerMode && CHAPTER_DEFINITIONS.length > 1 ? `<div aria-label="Regions">${CHAPTER_DEFINITIONS.map((item) =>
          `<button class="control-button" data-chapter="${esc(item.id)}" type="button" aria-pressed="${item.id === chapter.id}">${esc(item.name)}</button>`).join('')}</div>` : ''}
        <div class="chapter-progress-line" role="progressbar" aria-label="Region completion" aria-valuenow="${summary.percent}" aria-valuetext="${summary.cleared} of ${summary.total} stages cleared"><span style="--chapter-progress:${summary.percent}%"></span></div>
      </section>
      <section class="chapter-location-map integrated-atlas" aria-label="${esc(chapter.name)} Locations">
        ${locations.map((item) => `
          <button class="chapter-location-node ${item.unlocked ? 'unlocked' : 'locked'} ${item.complete ? 'complete' : ''} ${item.optional ? 'optional' : ''}"
            data-location="${item.id}" type="button" ${item.unlocked ? '' : 'disabled'}
            aria-label="${esc(item.name)}, ${item.percent}% complete${item.unlocked ? '' : ', locked'}">
            <span class="chapter-location-copy">
              <b>${esc(item.name)}${!item.unlocked || item.complete ? ` <i class="chapter-map-mark" aria-hidden="true">${item.complete ? '✓' : '🔒'}</i>` : ''}</b>
              <span class="chapter-node-status" aria-hidden="true">
                <span class="chapter-node-progress"><i style="width:${item.percent}%"></i></span>
                <span class="chapter-node-percent">${item.percent}%</span>
              </span>
            </span>
          </button>
        `).join('')}
      </section>
      <footer class="chapter-map-footer">
        <button class="control-button" data-action="return-active-location" type="button" aria-label="Return to ${esc(game.getActiveLocation()?.name || 'Forest Gate')}">‹</button>
        <details class="chapter-map-details">
          <summary aria-label="Region details">ⓘ</summary>
          <div>
            <p>${summary.cleared}/${summary.total} stages cleared</p>
            <ul>${locations.map(item => `<li><b>${esc(item.name)}</b> · ${item.unlocked ? `${item.percent}% complete` : esc(getLocationUnlockText(item))} · Power ${formatNumber(item.suggestedPower)}</li>`).join('')}</ul>
            <p>${game.developerMode ? 'Developer mode · All regions available' : summary.chapterSelectUnlocked ? 'Next Region unlocked' : 'Defeat the Heart of the Curse to unlock the next Region'}</p>
          </div>
        </details>
      </footer>
    </main>
    ${renderBottomNav()}
  `;
}

const EXPEDITION_TRAILS = {
  'ancient-roots': {"background": "ancient-roots-route.webp", "marker": "ancient-roots-waystone.webp", "landmark": "Root-Crowned Gate", "minCanvasHeight": 665, "numberOffset": [54, 58], "positions": [[86, 83.5], [87, 76.2], [70.5, 74.4], [54.1, 72], [37.4, 69.9], [20.6, 67.9], [9.4, 61.2], [26.5, 58.6], [43, 55.6], [59.5, 52.6], [76, 49.3], [91.5, 45.6], [70.5, 41.5], [45, 36.4], [21.5, 24.7]]},
  'deeper-woods': {"background": "deeper-woods-route.webp", "marker": "deeper-woods-waystone.webp", "landmark": "Eclipse Cairn", "minCanvasHeight": 650, "numberOffset": [50, 80], "positions": [[14, 85], [29, 81.4], [44.5, 82], [60, 79], [74, 73], [83, 66], [89, 58.5], [92, 51], [90, 43], [86, 35.1], [78, 25.8], [63, 21], [48, 17], [32.8, 18.1], [18, 24], [10, 35.7], [26, 48], [52, 44.5]]},
  'heart-of-the-curse': {"background": "heart-of-the-curse-route.webp", "marker": "heart-of-the-curse-waystone.webp", "landmark": "Fractured Heart", "minCanvasHeight": 700, "numberOffset": [50, 51], "positions": [[19, 82.3], [35, 81.1], [51, 79], [68, 76.9], [84, 74.5], [89, 67.8], [74, 61.9], [58.5, 60.9], [42.5, 59.6], [26.5, 58.5], [10, 56.5], [9, 49.9], [24.5, 46.5], [40.5, 45.4], [56.5, 44.3], [71.5, 42.8], [87.2, 39.6], [71, 34.8], [53, 33], [50, 25.8], [50, 18.5]]},
  'sprite-grove': {
    background: 'sprite-grove-route.webp',
    marker: 'sprite-grove-waystone.webp',
    landmark: 'Emerald Shrine',
    positions: [
      [20.2, 82.4], [35.6, 73.6], [53, 70.3], [68.9, 66], [83.7, 60.4], [69, 53.6],
      [52.6, 52.5], [34.2, 51.6], [14.2, 47.1], [29, 39.9], [56.2, 37.2], [86.8, 28.1],
    ],
  },
  'wolf-den': {
    background: 'wolf-den-route.webp',
    marker: 'wolf-den-waystone.webp',
    landmark: 'Den Entrance',
    positions: [
      [24.1, 81.9], [43, 72.2], [78.8, 65.2], [37.3, 55], [49.8, 45], [80.8, 29.3],
    ],
  },
};

function renderExpeditionTrail(location, stages, trail) {
  const expanded = Boolean(trail.minCanvasHeight);
  return `<section class="expedition-trail-route${expanded ? ' expanded-trail' : ''}" aria-label="${esc(location.name)} stage route">
    ${expanded ? `<div class="expanded-trail-canvas" style="--trail-min-height:${trail.minCanvasHeight}px;--trail-number-x:${trail.numberOffset[0]}%;--trail-number-y:${trail.numberOffset[1]}%">` : ''}
    ${stages.map((stage) => {
      const [x, y] = trail.positions[stage.stage - 1];
      const state = stage.current ? 'current' : stage.cleared ? 'cleared' : stage.selectable ? 'available' : 'locked';
      const kind = stage.encounterType === 'BOSS' ? 'boss' : stage.encounterType === 'ELITE' ? 'strong' : 'normal';
      const isLandmark = stage.stage === trail.positions.length;
      return `<button type="button" class="expedition-trail-node ${kind} ${state}${isLandmark ? ' landmark' : ''}" data-stage="${stage.id}"
        style="--stage-x:${x}%;--stage-y:${y}%" ${stage.current ? 'aria-current="step"' : stage.selectable ? '' : 'disabled'}
        aria-label="Stage ${stage.stage}${isLandmark ? `, ${esc(trail.landmark)}` : kind === 'boss' ? ', boss' : ''}, ${state}">
        ${isLandmark ? '' : `<img class="expedition-trail-marker" src="final-assets/expedition/stage-nodes/${trail.marker}" alt="">`}
        <b>${stage.stage}</b>
        ${stage.cleared ? '<img class="expedition-trail-cleared" src="final-assets/expedition/stage-nodes/stage-node-cleared-mark.png" alt="">' : ''}
      </button>`;
    }).join('')}
    ${expanded ? '</div>' : ''}
  </section>`;
}

function renderLocationRoute(location, stages, selectedStage, progress) {
  const visibleStages = game.developerMode ? stages : getVisibleLocationStages(stages, selectedStage);
  return `
    <section class="location-route-shell" ${game.developerMode ? 'style="justify-content:flex-start;overflow-y:auto"' : ''} aria-label="${esc(location.name)} stage route">
      <div class="location-route-line" aria-hidden="true"></div>
      ${visibleStages.map((stage) => {
        const state = stage.current ? 'current' : stage.cleared ? 'cleared' : stage.selectable ? 'available' : 'locked';
        const selected = stage.id === selectedStage?.id;
        const bossLabel = stage.encounterType === 'BOSS' ? (stage.stage === progress.total ? 'Boss' : 'Advanced Boss') : `Stage ${stage.stage}`;
        return `
          <button class="location-stage-node ${state} ${selected ? 'selected' : ''} ${stage.encounterType.toLowerCase()}"
            data-stage="${stage.id}" type="button" ${stage.selectable ? '' : 'disabled'}>
            <span class="location-stage-sigil">${stage.encounterType === 'BOSS' ? '♛' : stage.stage}</span>
            <span class="location-stage-copy"><b>${esc(bossLabel)}</b><small>${stage.cleared ? 'Cleared' : stage.current ? 'Current challenge' : stage.selectable ? 'Available' : 'Locked'}</small></span>
          </button>
        `;
      }).join('')}
    </section>
  `;
}

const STAGE_ENTRY_PROMPTS = {
  TRAIN: { message: `Deploy a combatant at Lv ${FOREST_GATE_STAGE_4_MIN_LEVEL} or higher.`, target: 'data-view="HEROES"', label: 'Level Up Combatants' },
};

function renderStageEntryAction(prompt, buttonClass) {
  return `<button class="${buttonClass}" ${prompt.target} type="button">${prompt.label}</button>`;
}

function renderAcquisitionDialog(location) {
  const farm=game.getFarmingStatus(location.id),special=game.getSpecialStatus(location.id);
  const hours=ms=>Math.max(0,Math.ceil(ms/60000))+' min';
  const assignment=farm.farm;
  const farmText=assignment?('Assigned: '+(getLocationById(assignment.locationId)?.name||assignment.locationId)+' · '+(farm.ready?'Ready to claim':hours(assignment.readyAt-Date.now())+' remaining')):(!farm.unlocked?'Unlock after Stage '+location.farmingUnlockStage:'Squad '+formatNumber(farm.power)+' / '+formatNumber(farm.minimum)+' power · '+Math.round(farm.chance*100)+'% drop chance · up to '+formatTerm(Object.keys(EQUIPMENT_RARITIES)[farm.cap])+' · Gear Lv '+farm.baseLevel);
  return '<dialog class="trainee-dialog trainee-gilded gear-dialog" id="location-acquisition" aria-label="Expedition equipment"><h2>Equipment rewards</h2><p>'+esc(location.name)+'</p><article class="gear-card"><strong>Farming · 2 hours</strong><p>'+esc(farmText)+'</p><p>Uses the current formation when assigned. One assignment at a time.</p><button class="control-button" data-action="'+(assignment?'claim-farming':'start-farming')+'" type="button" '+(assignment?(farm.ready?'':'disabled'):(farm.canStart?'':'disabled'))+'>'+(assignment?'Claim farming':'Assign formation')+'</button></article><article class="gear-card"><strong>Special challenge</strong><p>'+esc(!special.unlocked?'Defeat the location boss first.':special.canStart?'60% equipment chance · up to '+formatTerm(Object.keys(EQUIPMENT_RARITIES)[special.cap])+' · Gear Lv '+special.baseLevel:'Next challenge in '+hours(special.readyAt-Date.now()))+'</p><p>Stronger boss encounter · resets every '+location.specialStage.resetHours+' hours after victory.</p><button class="control-button" type="button" data-action="special-challenge" '+(special.canStart?'':'disabled')+'>Challenge</button></article><p role="status" class="gear-message"></p><button class="control-button" data-action="refresh-acquisition" type="button">Refresh</button><form method="dialog"><button type="submit">Close</button></form></dialog>';
}

function renderStageDetails(location, selectedStage, progress) {
  const threat = game.getStageThreat(selectedStage?.id);
  const rewardPreview = selectedStage?.rewardPreview || game.getStageRewardPreview(selectedStage?.id);
  const canChallenge = Boolean(selectedStage?.battleable);
  const entryPrompt = selectedStage?.current ? STAGE_ENTRY_PROMPTS[game.getStageEntryBlock(selectedStage.id)] : null;
  const title = selectedStage?.encounterType === 'BOSS' ? selectedStage.name : `Stage ${selectedStage?.stage || 1}`;
  return `
    <section class="location-stage-panel">
      <div class="location-stage-panel-art">
        <img src="final-assets/expedition/location-nodes/${location.nodeAsset}" alt="${esc(location.name)}">
      </div>
      <div class="location-stage-panel-copy">
        <div class="stage-panel-eyebrow">${rewardPreview.firstClear ? 'First-Clear Challenge' : 'Completed Stage'}</div>
        <h2>${esc(title)}</h2>
        <p>${esc(entryPrompt?.message || (selectedStage?.current && selectedStage.briarWard
          ? 'Briar Guard’s ward has five seals. Each combatant breaks one on their first action.' : location.description))}</p>
        <div class="location-stage-metrics">
          <div class="location-power-card">
            <img src="final-assets/expedition/stage-info-panel/suggested-power-icon.png" alt="" aria-hidden="true">
            <span><small>Suggested Battle Power</small><b>${formatNumber(threat.recommendedPower)}</b></span>
          </div>
          <div class="location-progress-card"><small>Location Progress</small><b>${progress.percent}%</b><span>${progress.cleared}/${progress.total} cleared</span></div>
        </div>
        <div class="location-reward-block">
          <span class="expedition-stat-label">${rewardPreview.firstClear ? 'Fixed First-Clear Rewards' : 'Stage Status'}</span>
          <div class="location-reward-grid">${renderStageRewardItems(rewardPreview)}</div>
        </div>
        <div class="location-stage-actions">
          ${entryPrompt ? renderStageEntryAction(entryPrompt, 'control-button') : ''}
          <button class="battle-button challenge-button" data-action="battle-selected" type="button" ${canChallenge ? '' : 'disabled'}>Enter Battle</button>
        </div>
      </div>
    </section>
  `;
}

function renderInventory() {
  const items = [
    ...game.expeditionProgress.cosmetics.map((name) => `<li><span>${esc(name)}</span><strong>Cosmetic</strong></li>`),
  ];
  return `
    <dialog class="trainee-dialog trainee-gilded inventory-dialog" id="academy-inventory" aria-labelledby="inventory-title">
      <h2 id="inventory-title">Inventory</h2>
      <fieldset class="inventory-tabs">
        <legend>Inventory category</legend>
        <input type="radio" name="inventory-category" id="inventory-currencies" checked>
        <label for="inventory-currencies">Currencies</label>
        <input type="radio" name="inventory-category" id="inventory-items">
        <label for="inventory-items">Items</label>
        <ul class="inventory-currencies">
          ${Object.values(CURRENCY).map((currency) => `<li>${CURRENCY_ICONS[currency] ? `<img src="${CURRENCY_ICONS[currency]}" alt="">` : ''}<span>${esc(CURRENCY_LABEL[currency])}</span><strong>${formatNumber(game.getCurrencyBalance(currency))}</strong></li>`).join('')}
          <li><span>Enhancement Materials</span><strong>${formatNumber(game.saveData.equipment.materials)}</strong></li>
        </ul>
        <div class="inventory-items">${inventoryEquipment(game)}${items.length ? `<ul>${items.join('')}</ul>` : ''}</div>
      </fieldset>
      <form method="dialog"><button type="submit">Close</button></form>
    </dialog>
  `;
}

let campusLightTimer;

function syncCampusLighting() {
  window.clearTimeout(campusLightTimer);
  const map = root.querySelector('.campus-map');
  if (!map || document.hidden) return;

  const now = new Date();
  const hour = now.getHours();
  map.dataset.lighting = hour >= 6 && hour < 18 ? 'day' : 'night';

  const boundary = new Date(now);
  boundary.setHours(hour < 6 ? 6 : hour < 18 ? 18 : 30, 0, 0, 0);
  // Recheck periodically so a phone clock or time zone change is picked up too.
  campusLightTimer = window.setTimeout(syncCampusLighting, Math.min(60_000, boundary - now));
}

document.addEventListener('visibilitychange', syncCampusLighting);

let unmountCampusWalker;

const forgeSelection={};
function renderAcademy() {
  const hall = 'data-action="show-dialog" data-dialog="academy-hall" aria-haspopup="dialog"';
  const facilities = [
    ['hall', 'Headmaster Hall', 'final-assets/academy/hall-crown.webp', hall],
    ['library', 'Library Tower', 'final-assets/archive/tab-records.webp', 'data-view="SYSTEMS"'],
    ['alchemy', 'Alchemy Lab', 'final-assets/academy/alchemy-flask.webp', 'disabled'],
    ['dormitory', 'Dormitory', 'final-assets/academy/dormitory-bed.webp', 'disabled'],
    ['courtyard', 'Courtyard', 'final-assets/archive/tab-regions.webp', hall],
    ['training', 'Training Grounds', null, 'data-view="TRAINING"'],
  ];
  return `
    ${renderTopHud('campus-hud')}
    <main class="screen academy-campus-screen" aria-label="Arcane Academy campus">
      <section class="campus-pan" aria-label="Academy map, scroll sideways to explore" tabindex="0">
        <div class="campus-map">
          <svg class="campus-ambience" viewBox="0 0 460 575" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <filter id="campus-cloud-softness" x="-30%" y="-90%" width="160%" height="280%">
                <feGaussianBlur stdDeviation="4"/>
              </filter>
              <radialGradient id="campus-night-glow">
                <stop stop-color="#ffe4a3" stop-opacity=".88"/>
                <stop offset="1" stop-color="#ffad51" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <g class="campus-night-lights" fill="url(#campus-night-glow)">
              <ellipse cx="240" cy="218" rx="11" ry="24"/>
              <ellipse cx="53" cy="390" rx="6" ry="10"/>
              <ellipse cx="406" cy="96" rx="16" ry="20"/>
              <ellipse cx="165" cy="49" rx="9" ry="12"/>
              <ellipse cx="321" cy="29" rx="7" ry="9"/>
            </g>
            <g class="campus-cloud-parallax">
              <g class="campus-cloud-drift" fill="#edf6ff" filter="url(#campus-cloud-softness)">
                <path d="M18 86 Q38 80 51 84 Q61 73 77 81 Q94 78 106 89 Q130 93 147 107 Q115 104 90 95 Q52 98 18 86Z"/>
                <path d="M319 124 Q333 109 347 110 Q358 96 372 103 Q393 101 416 111 Q391 109 374 119 Q344 131 319 124Z"/>
              </g>
            </g>
            <g fill="none" stroke-linecap="round">
              <path class="campus-fountain-stream" d="M232 406 Q221 398 211 419 M243 407 Q253 400 263 419"/>
              <path class="campus-fountain-stream" d="M211 428 Q209 435 209 442 M222 432 L220 447 M241 433 L241 449 M254 430 L256 444 M265 429 L268 438"/>
              <ellipse class="campus-fountain-ripple" cx="237" cy="444" rx="41" ry="7"/>
            </g>
          </svg>
          <div class="campus-activity" aria-hidden="true">
            <span class="campus-walker campus-walker--cinder"><canvas width="384" height="384"></canvas></span>
            <div class="campus-alchemy-smoke"><i></i><i></i><i></i></div>
          </div>
          ${facilities.map(([place, title, icon, attrs]) => `
            <button class="campus-marker campus-marker--${place}" ${attrs} type="button"
              ${attrs === 'disabled' ? `aria-label="${title} (coming soon)" title="Coming soon"` : ''}>
              ${icon ? `<img src="${icon}" alt="">` : '<span aria-hidden="true">⚔</span>'}
              ${title}
            </button>
          `).join('')}
        </div>
      </section>
      <button class="trainee-log-button campus-dispatch" data-action="show-dialog" data-dialog="academy-dispatch" type="button" aria-haspopup="dialog">
        ${renderTraineeIcon('dispatch-scroll')}Dispatch Log
      </button>

      <dialog class="content-dialog campus-dialog" id="academy-hall" aria-labelledby="academy-hall-title">
        <h2 id="academy-hall-title">Headmaster Hall</h2>
        ${renderQuestFocus()}
        ${renderIdleSanctum()}
        ${renderSynergyPanel()}
        <div class="campus-hall-links">
          <button class="control-button" data-action="show-dialog" data-dialog="academy-inventory" type="button" aria-haspopup="dialog">Inventory</button>
          <button class="control-button" data-action="show-dialog" data-dialog="academy-forge" type="button" aria-haspopup="dialog">Forge</button>
          <button class="control-button" data-view="HEROES" type="button">Combatants</button>
          <button class="control-button" data-view="CAMPAIGN" type="button">Expedition</button>
        </div>
        <form method="dialog"><button>Close</button></form>
      </dialog>
      <dialog class="trainee-dialog trainee-gilded gear-dialog" id="academy-forge" aria-labelledby="forge-title"><h2 id="forge-title">Academy Forge</h2><div id="forge-content">${forgePanel(game,forgeSelection)}</div><form method="dialog"><button type="submit">Close</button></form></dialog>
      ${renderInventory()}
      ${renderDispatchDialog('academy-dispatch', 'campus-dialog')}
    </main>
    ${renderBottomNav()}
  `;
}

function renderDispatchDialog(id, extraClass) {
  return `
    <dialog class="content-dialog ${extraClass}" id="${id}" aria-labelledby="${id}-title">
      <h2 id="${id}-title">Dispatch Log</h2>
      ${game.saveData.log?.length ? `<ul>${game.saveData.log.slice(-12).reverse().map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : '<p>No dispatches yet.</p>'}
      <form method="dialog"><button>Close</button></form>
    </dialog>
  `;
}

function renderCampaign() {
  const activeChapter = game.getActiveLocation()?.chapterId;
  const mapChapter = ui.expeditionMode === 'CHAPTER_MAP' ? ui.developerChapterId : null;
  const chapter = (game.developerMode && getChapterById(mapChapter || activeChapter)) || CHAPTER_DEFINITIONS[0];
  const locations = game.getLocationList(chapter.id);
  const summary = game.getCampaignSummary(chapter.id);
  if (ui.expeditionMode === 'CHAPTER_MAP' && summary.chapterMapUnlocked) {
    return renderChapterMap(chapter, locations, summary);
  }

  const fallbackLocation = game.getActiveLocation() || getLocationById('forest-gate');
  const location = getLocationById(ui.selectedLocationId) && game.isLocationUnlocked(ui.selectedLocationId)
    ? getLocationById(ui.selectedLocationId)
    : fallbackLocation;
  if (location.id !== ui.selectedLocationId) ui.selectedLocationId = location.id;
  const stages = game.getStageList(location.id);
  const progress = game.getLocationProgress(location.id);
  const selectedStage = stages.find((stage) => stage.id === ui.selectedStageId && stage.unlocked)
    || stages.find((stage) => stage.current)
    || stages[0];
  ui.selectedStageId = selectedStage?.id;
  const trail = EXPEDITION_TRAILS[location.id];

  return `
    ${renderTopHud('expedition-hud')}
    <main class="screen expedition-location-screen ${trail ? `expedition-trail-screen ${location.id}-screen` : ''}" style="--location-background:url('final-assets/expedition/location-backgrounds/${trail?.background || location.backgroundAsset}')"
      data-developer-mode="${game.developerMode}" data-cleared-stages="${stages.filter((stage) => stage.cleared).map((stage) => stage.stage).join(',')}">
      <div class="location-background-shade" aria-hidden="true"></div>
      <header class="location-header">
        <div>
          <div class="kicker">${esc(chapter.subtitle)} · ${esc(chapter.name)}</div>
          <h1>${esc(location.name)}</h1>
          <p>${esc(location.description)}</p>
        </div>
        <div class="location-header-actions">
          ${summary.chapterMapUnlocked ? '<button class="control-button chapter-map-button" data-action="open-chapter-map" type="button">Region Map</button>' : ''}
          <span class="location-completion">${progress.percent}%</span>
        </div>
      </header>
      ${trail ? renderExpeditionTrail(location, stages, trail) : `<section class="location-route-area">
        ${renderLocationRoute(location, stages, selectedStage, progress)}
        <aside class="location-system-status">
          <div><small>Farming</small><b>${progress.farmingUnlocked ? 'Available' : `Unlock at Stage ${location.farmingUnlockStage}`}</b><span>Minimum Assignment Power ${formatNumber(location.minimumAssignmentPower)}</span></div>
          <div><small>Special Stage</small><b>${progress.complete ? 'Unlocked' : 'Defeat the Location Boss'}</b><span>${progress.complete ? `Resets about every ${location.specialStage.resetHours}h` : 'Not part of the normal route'}</span></div>
        </aside>
      </section>`}
      ${location.id === 'wolf-den' && progress.complete && !game.developerMode ? '' : renderStageDetails(location, selectedStage, progress)}
      <button class="control-button acquisition-launch" data-action="show-dialog" data-dialog="location-acquisition" type="button" aria-label="Farming and special stage rewards">Loot</button>
      ${renderAcquisitionDialog(location)}
    </main>
    ${renderActivityLog()}
    ${renderBottomNav()}
  `;
}


function summarizeEnemyComposition(enemies = []) {
  const counts = new Map();
  for (const enemy of enemies) {
    const rank = enemy.trainingRank || enemy.rarity || 'COMMON';
    const label = `${enemy.name} · ${rank[0] + rank.slice(1).toLowerCase()} Lv. ${enemy.level}`;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => count > 1 ? `${name} ×${count}` : name).join(' · ');
}

function battleUnitStatusLabels(unit) {
  const labels = [];
  if ((unit?.barrier || 0) > 0) labels.push('Ward');
  if ((unit?.guardActions || 0) > 0) labels.push('Guard');
  if ((unit?.burnActions || 0) > 0) labels.push('Burn');
  if ((unit?.chillActions || 0) > 0) labels.push('Chill');
  if ((unit?.stunActions || 0) > 0) labels.push('Stun');
  return labels;
}

function battleStatusText(battle) {
  if (battle.result) {
    if (battleRenderer.isResultPresentationPending()) return 'Battle ending…';
    return battle.result === 'player_win' ? 'Victory' : 'Defeat';
  }
  if (ui.battleEntering) return 'Entering battlefield…';
  if (!ui.battleStarted) return ui.battleRendererReady ? 'Ready · Press Start' : 'Preparing battlefield…';
  if (battle.briarWard?.remaining > 0) {
    return `Briar Ward · ${battle.briarWard.remaining}/${battle.briarWard.seals} seals left`;
  }
  if (ui.battlePaused) return 'Paused';
  return devMode ? `Turn ${battle.tick}` : 'In combat';
}

function renderBattleAtmosphere() {
  return `
    <div class="battle-atmosphere" aria-hidden="true">
      <span class="battle-mist"></span>
      <span class="courtyard-moonlight"></span>
      <span class="battle-mote"></span>
      <span class="battle-mote"></span>
      <span class="battle-mote"></span>
      <span class="battle-mote"></span>
    </div>
  `;
}

const BATTLE_ICON_PATH = 'final-assets/battle/control-icons/';
const battleIcon = (name) => `<img class="battle-control-icon" src="${BATTLE_ICON_PATH}${name}.webp" alt="" aria-hidden="true">`;

function renderBattle() {
  const battle = game.battle || game.beginBattle(ui.selectedStageId);
  if (!battle) {
    ui.view = 'CAMPAIGN';
    return renderCampaign();
  }
  const stage = game.getStageList().find((item) => item.id === battle.stageId) || getStageById(battle.stageId);
  const threat = game.getStageThreat(stage?.id);
  const enemyComposition = summarizeEnemyComposition(battle.enemies);
  const isBossEncounter = stage?.encounterType === 'BOSS';
  const boss = battle.enemies.find((unit) => unit.isBoss);
  const presentation = getRegionPresentation(stage?.region || 1);
  const playerFormation = resolveBattleFormation(battle.player, 'player');
  const enemyFormation = resolveBattleFormation(battle.enemies, 'enemy');
  const battleStatus = battleStatusText(battle);
  const battlefieldClass = getBattlefieldArt(battle.stageId)?.className || '';
  return `
    <div class="battle-screen-art battle-backdrop region-${presentation.className} ${battlefieldClass}" aria-hidden="true"></div>
    ${renderTopHud()}
    <section class="stage-plate battle-stage-plate ${isBossEncounter ? 'boss-encounter' : ''}">
      <div class="stage-copy">
        <div class="stage-title">${isBossEncounter ? '<span class="battle-encounter-tag">Boss</span>' : ''}${esc(stage?.locationName || 'Wild Forest')} · ${stage?.special?'Special':formatNumber(stage?.stage)}</div>
        <div class="stage-subtitle" data-battle-status>${esc(battleStatus)}</div>
      </div>
      <div class="battle-controls">
        <button class="control-button ${ui.battlePaused ? 'active' : ''}" data-action="pause-battle" type="button" aria-label="${ui.battlePaused ? 'Resume battle' : 'Pause battle'}" aria-pressed="${String(ui.battlePaused)}" ${!ui.battleStarted || battle.result ? 'disabled' : ''}>${battleIcon(ui.battlePaused ? 'play' : 'pause')}</button>
        <button class="control-button" data-action="speed-battle" type="button" aria-label="Battle speed ${ui.battleSpeed} times">${battleIcon('speed')}<span class="battle-speed-value">×${ui.battleSpeed}</span></button>
        <button class="control-button ${ui.autoUltimates ? 'active' : ''}" data-action="auto-ult" type="button" aria-label="Automatic ultimates" aria-pressed="${String(ui.autoUltimates)}">${battleIcon('auto')}</button>
        <button class="control-button" data-view="CAMPAIGN" type="button" aria-label="Exit battle">${battleIcon('exit')}</button>
      </div>
    </section>

    <main class="battle-panel phaser-battle-panel battle-backdrop renderer-loading ${!ui.battleStarted && !battle.result && !battle.tick ? 'battle-awaiting-entry' : ''} region-${presentation.className} ${battlefieldClass} ${isBossEncounter ? 'boss-encounter' : ''}">
      ${renderBattleAtmosphere()}
      <div class="battle-field-label">
        <b data-battle-count>${battle.player.length} VS ${battle.enemies.length}</b>
      </div>
      <div id="phaser-battle-host" class="phaser-battle-host"${ui.deployedFromFormation ? ' data-formation-entry' : ''} aria-label="Arcane Academy real-time battle${boss ? ` against ${esc(boss.name)}` : ''}"></div>
      <div class="battle-dom-fallback" data-battle-fallback hidden aria-label="Battlefield">
        ${enemyFormation.map(renderUnit).join('')}
        ${playerFormation.map(renderUnit).join('')}
        ${renderBattleFloat(battle.lastAction)}
      </div>
      <div class="battle-live-status" data-battle-renderer-status role="status">Preparing battlefield…</div>
      ${!ui.battleStarted && !battle.result && !ui.deployedFromFormation ? `
        <div class="battle-start-overlay" aria-busy="${String(!ui.battleRendererReady)}">
          <div class="battle-start-briefing ${isBossEncounter ? 'boss-briefing' : ''}" aria-label="Enemy composition and actual power">
            <em>${isBossEncounter ? `Boss Encounter · ${esc(boss?.name || stage?.name)}` : 'Enemy Formation'}</em>
            <span>${esc(enemyComposition)}</span>
            <b>Enemy Power ${formatNumber(threat.enemyPower)}</b>
          </div>
          <button class="battle-start-button" data-action="begin-battle" type="button" ${ui.battleRendererReady ? '' : 'disabled'}>${ui.battleRendererReady ? 'START' : 'PREPARING…'}</button>
        </div>
      ` : ''}
    </main>

    <div class="battle-result-slot">
      ${renderBattleResult(battle, stage)}
    </div>

    <nav class="hero-deck" aria-label="Combatant ultimate controls">
      ${battle.player.map(renderBattleHeroCard).join('')}
    </nav>
  `;
}
function renderUnit(placement) {
  const unit = placement.unit;
  const hitClass = game.battle?.lastHitId === unit.id ? ' hit' : '';
  const actingClass = game.battle?.lastActorId === unit.id ? ' acting' : '';
  const statuses = battleUnitStatusLabels(unit);
  const formationX = (placement.formationPosition.x / BATTLEFIELD_WIDTH) * 100;
  const combatX = (placement.combatPosition.x / BATTLEFIELD_WIDTH) * 100;
  const formationY = (placement.formationPosition.y / 560) * 100;
  const renderScale = placement.depthScale * (unit.isBoss ? 1.08 : 1)
    * (placement.deployment ? 1 : PRESENTATION_CONFIG.combat.characterScale / 0.44);
  const actionScale = renderScale * 1.035;
  const art = getBattleIdleArt(unit, placement, renderScale);
  const fieldLength = (length) => `min(${length / BATTLEFIELD_WIDTH * 100}cqw, ${length / 560 * 100}cqh)`;
  const headY = placement.deployment ? null : getBattleUnitHeadY(unit, placement);
  const hudTop = (gap) => headY === null ? ''
    : ` style="top:calc(50% - ${fieldLength(-headY / renderScale)} - ${gap}px)"`;
  return `
    <div class="unit ${unit.side === 'enemy' ? 'enemy' : 'player'} ${visualClass(unit)}${hitClass}${actingClass} ${unit.isBoss ? 'boss-unit' : ''} ${unit.hp <= 0 ? 'defeated' : ''} ${placement.isMelee ? 'melee-unit' : 'backline-unit'} slot-${placement.slotKind}" data-entrance-unit="${esc(unit.id)}" style="--formation-x:${formationX.toFixed(3)}%;--combat-x:${combatX.toFixed(3)}%;--formation-y:${formationY.toFixed(3)}%;--unit-render-scale:${renderScale.toFixed(3)};--unit-action-scale:${actionScale.toFixed(3)};--unit-depth:${Math.round(placement.groundY)};top:var(--formation-y);z-index:var(--unit-depth);">
      ${art ? `<img class="battle-fallback-art" src="${esc(art.src)}" alt="" draggable="false"
        style="position:absolute;left:50%;top:calc(50% + ${fieldLength(art.ground)});width:${fieldLength(art.size)};max-width:none;transform:translate(-50%, -${art.origin * 100}%);pointer-events:none">` : ''}
      <span class="hp-track"${hudTop(17)}><span class="hp-fill" style="--hp: ${pct(unit.hp, unit.maxHp)};"></span></span>
      <span class="barrier-track" aria-hidden="true"${hudTop(8)}><span class="barrier-fill" style="--barrier: ${pct(unit.barrier || 0, unit.maxHp)};"></span></span>
      <span class="ultimate-track ${unit.ultimateCharge >= 100 ? 'ready' : ''}" aria-hidden="true"${hudTop(4)}><span class="ultimate-fill" style="--charge: ${pct(unit.ultimateCharge || 0, 100)};"></span></span>
      <span class="unit-name"${hudTop(34)}>${esc(unit.name)}</span>
      ${statuses.length ? `<span class="unit-status">${esc(statuses.join(' · '))}</span>` : ''}
    </div>
  `;
}

function renderBattleFloat(event) {
  if (!event || event.type === 'skill' || event.type === 'ultimate') return '';
  const isHeal = event.type === 'heal';
  const isBarrier = event.type === 'barrier';
  const isStatus = event.type === 'status';
  const label = isBarrier ? 'BUFF'
    : isStatus ? event.abilityName === 'Stun' ? 'STUN' : 'DEBUFF'
      : event.type === 'damage' && event.amount <= 0 ? `WARD ${event.absorbed || 0}` : `${isHeal ? '+' : '-'}${event.amount}`;
  return `<div class="battle-float damage ${isHeal ? 'heal' : ''} ${isBarrier ? 'barrier' : ''} ${isStatus ? 'status' : ''}">${esc(label)}</div>`;
}

function battleEventMessage(event) {
  if (!event) return 'Battle running';
  if (event.type === 'heal') return `${event.actorName} healed ${event.targetName}`;
  if (event.type === 'barrier') return `${event.actorName} shielded ${event.targetName}`;
  if (event.type === 'skill') return `${event.actorName} used ${event.abilityName}`;
  if (event.type === 'ultimate') return `${event.actorName} used ${event.abilityName}`;
  if (event.type === 'status') return `${event.targetName} is affected by ${event.abilityName}`;
  return `${event.actorName} struck ${event.targetName}`;
}

function battleHeroCardState(hero) {
  const displayingCast = ui.ultimateChargeHolds.has(hero.id);
  const displayedCharge = hero.hp <= 0 ? 0 : displayingCast ? 100 : hero.ultimateCharge;
  const defeated = hero.hp <= 0;
  const unavailable = defeated || !ui.battleStarted || Boolean(game.battle?.result);
  const ready = !unavailable && !displayingCast && hero.ultimateCharge >= 100;
  const hpPercent = Math.round(Math.max(0, Math.min(1, hero.hp / Math.max(1, hero.maxHp))) * 100);
  const chargePercent = Math.round(displayedCharge);
  const ultimateLabel = displayingCast ? `${hero.name} ultimate casting` : ready ? `Use ${hero.ultimateName || 'ultimate'} for ${hero.name}` : `${hero.name} ultimate ${chargePercent} percent charged`;
  return { displayingCast, displayedCharge, ready, defeated, unavailable, hpPercent, ultimateLabel,
    health: pct(hero.hp, hero.maxHp),
    label: `${hero.name}, ${hpPercent} percent health, ${chargePercent} percent ultimate`,
  };
}

const BATTLE_DECK_PORTRAITS = Object.freeze({
  hero_archmage_eloris: 'archmage-eloris',
  hero_neris_rimeweave: 'neris-rimeweave',
  hero_tavian_emberstep: 'tavian-emberstep',
  hero_cinder_vale: 'cinder-vale',
  hero_yssa_driftborn: 'yssa-driftborn',
  hero_sera_ashveil: 'sera-ashveil',
  hero_frost_warden_kael: 'frost-warden-kael',
  hero_lumen_solis: 'lumen-solis',
  hero_pyreth_the_branded: 'pyreth-the-branded',
  hero_stone_sentinel_gorr: 'stone-sentinel-gorr',
  hero_dusk: 'dusk',
});

const APPROVED_RARITY_FRAME_TIERS = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary']);
function portraitFrameTier(rank) {
  const tier = String(rank || 'COMMON').toLowerCase();
  return APPROVED_RARITY_FRAME_TIERS.has(tier) ? tier : '';
}
function renderPortraitRarityFrame(tier) {
  return tier ? `<img class="combatant-rarity-frame" src="./final-assets/trainees/approved-rarity-frames/${tier}-battle.webp" alt="" aria-hidden="true" draggable="false" decoding="async">` : '';
}

function renderBattleHeroCard(hero) {
  const frameTier = portraitFrameTier(hero.trainingRank || hero.rarity);
  const portrait = traineePortrait(hero);
  const deckPortrait = BATTLE_DECK_PORTRAITS[hero.heroDefId];
  const art = deckPortrait
    ? `<img class="battle-deck-portrait" src="./final-assets/battle/deck-portraits/${deckPortrait}.webp" alt="" decoding="async">`
    : portrait ? renderTraineePortraitImage(portrait)
      : `<span class="portrait-monogram">${esc(sigilLetters(hero.name, 'AA'))}</span>`;
  const { displayingCast, displayedCharge, ready, defeated, unavailable, hpPercent, ultimateLabel,
    health, label } = battleHeroCardState(hero);
  const outline = "M50 99 H15 Q1 99 1 94 V16 Q1 1 24 1 H76 Q99 1 99 16 V94 Q99 99 85 99 Z";
  return `
    <article data-rarity-frame="${frameTier}" class="hero-card ${hero.rarity.toLowerCase()} ${visualClass(hero)} ${ready ? 'ultimate-ready' : ''} ${hpPercent <= 25 && !defeated ? 'low-health' : ''} ${defeated ? 'defeated' : ''}" aria-label="${esc(label)}">
      <button class="ultimate-button ${ready ? 'ready' : ''} ${displayingCast ? 'casting' : ''}" style="--charge-offset: ${100 - displayedCharge};" data-ult="${hero.id}" type="button" aria-label="${esc(ultimateLabel)}" aria-disabled="${String(unavailable || displayingCast)}" ${unavailable || displayingCast ? 'disabled' : ''}>
        <span class="card-identity" aria-hidden="true">
          <span class="portrait">${art}</span>
        </span>
        ${renderPortraitRarityFrame(frameTier)}
        <svg class="card-ultimate-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="${outline}" pathLength="100" vector-effect="non-scaling-stroke"/>
          <path class="card-ultimate-charge" d="${outline}" pathLength="100" vector-effect="non-scaling-stroke"/>
        </svg>
      </button>
      <div class="card-vitals" role="img" aria-label="Health ${hpPercent} percent">
        <div class="card-hp"><span style="--hp: ${health};"></span></div>
      </div>
    </article>
  `;
}
function updateBattleHeroDeck(heroes) {
  const deck = root.querySelector('.hero-deck');
  if (!deck) return;
  heroes.forEach((hero, index) => {
    const card = deck.children[index];
    const button = card.querySelector('.ultimate-button');
    const state = battleHeroCardState(hero);
    const previous = card.battleState;
    if (previous?.label !== state.label) card.setAttribute('aria-label', state.label);
    if (previous?.health !== state.health) card.querySelector('.card-hp span').style.setProperty('--hp', state.health);
    if (previous?.hpPercent !== state.hpPercent || previous?.defeated !== state.defeated) {
      card.querySelector('.card-vitals').setAttribute('aria-label', `Health ${state.hpPercent} percent`);
      card.classList.toggle('low-health', state.hpPercent <= 25 && !state.defeated);
      card.classList.toggle('defeated', state.defeated);
    }
    if (previous?.ready !== state.ready || previous?.displayingCast !== state.displayingCast || previous?.unavailable !== state.unavailable) {
      card.classList.toggle('ultimate-ready', state.ready);
      button.classList.toggle('ready', state.ready);
      button.classList.toggle('casting', state.displayingCast);
      button.disabled = state.unavailable || state.displayingCast;
      button.setAttribute('aria-disabled', String(button.disabled));
    }
    if (previous?.displayedCharge !== state.displayedCharge) button.style.setProperty('--charge-offset', String(100 - state.displayedCharge));
    if (previous?.ultimateLabel !== state.ultimateLabel) button.setAttribute('aria-label', state.ultimateLabel);
    card.battleState = state;
  });
}

function renderBattleDefeat(battle) {
  const canSummon = game.canUseBanner('BASIC');
  return `
    <dialog class="content-dialog battle-defeat-dialog" aria-labelledby="battle-defeat-title" aria-describedby="battle-defeat-guidance">
      <header>
        <h2 id="battle-defeat-title">Defeated</h2>
        <button data-view="CAMPAIGN" type="button" aria-label="Exit to Expedition">Exit</button>
      </header>
      ${battle.briarWard?.fired ? '<p>Break Briar Ward by deploying five combatants and having each act once.</p>' : ''}
      <p id="battle-defeat-guidance">Increase your squad’s power by leveling up your combatants${canSummon ? ' or recruiting new ones' : ''}.</p>
      <div class="content-actions">
        <button data-view="HEROES" type="button" autofocus>Level Up Combatants</button>
        ${canSummon ? '<button data-action="open-basic-summon" type="button">Recruit</button>' : ''}
        <button data-action="retry" type="button">Retry</button>
      </div>
    </dialog>
  `;
}

function showBattleDefeatDialog() {
  const dialog = root.querySelector('.battle-defeat-dialog');
  if (!dialog || dialog.open) return;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    setView('CAMPAIGN');
  }, { once: true });
  dialog.showModal();
}

function renderBattleResult(battle, stage) {
  if (battle.result && battleRenderer.isResultPresentationPending()) {
    return '<div class="battle-live-status" role="status" aria-live="polite">Battle ending…</div>';
  }
  if (!battle.result) {
    if (!devMode) {
      const message = ui.battleStarted ? battleEventMessage(battle.events.at(-1)) : '';
      return `<div class="battle-live-status" role="status" aria-live="polite">${esc(message)}</div>`;
    }
    if (!ui.battleStarted) return '';
    return `
      <aside class="battle-toast battle-debug-toast">
        <div>
          <div class="toast-title">${esc(battle.log[battle.log.length - 1] || 'Battle running')}</div>
          <div class="toast-meta">${esc(battle.events.slice(-3).map(battleEventMessage).join(' / '))}</div>
        </div>
        <button class="battle-button" data-action="battle-step" type="button">Step</button>
      </aside>
    `;
  }
  if (battle.result !== 'player_win') return renderBattleDefeat(battle);
  const receipt = battle.rewardReceipt;
  const preview = receipt || game.getStageRewardPreview(stage?.id);
  const ordinary=formatRewards(preview.rewards, preview.traineeXp, preview.lessonScrolls);
  const gear=preview.equipmentReward;
  const rewardText=stage?.special&&!receipt?'Random equipment and Enhancement Materials':[ordinary==='No rewards'?'':ordinary,gear&&(gear.items.length||gear.materials)?rewardSummary(gear):''].filter(Boolean).join(' / ')||'No rewards';
  if (battle.collected) {
    const canContinue = receipt?.nextStageId && receipt.nextStageId !== stage?.id;
    return `
      <aside class="battle-toast result-toast won claimed">
        <div>
          <div class="toast-title">Rewards Claimed</div>
          <div class="toast-meta">${esc(rewardText)}${receipt?.milestoneRewards?.length ? ` / ${esc(receipt.milestoneRewards.map((item) => item.hint).join(' / '))}` : ''}</div>
        </div>
        <div class="result-actions">
          ${canContinue ? '<button class="battle-button" data-action="next-stage" type="button">Next</button>' : ''}
          <button class="control-button" data-view="CAMPAIGN" type="button">Location</button>
        </div>
      </aside>
    `;
  }
  return `
    <aside class="battle-toast result-toast won">
      <div>
        <div class="toast-title">Victory</div>
        <div class="toast-meta">${stage?.special?'Special reward':'First-clear reward'}: ${esc(rewardText)}.${battle.basicAttackLesson ? ` ${esc(stage?.milestoneRewards?.filter((item) => item.type !== 'unlockSystem').map((item) => item.hint).join(' ') || '')}` : ''}</div>
      </div>
      <div class="result-actions"><button class="control-button" data-action="collect" type="button">Claim</button><button class="battle-button" data-action="collect-next" type="button">Claim + Next</button></div>
    </aside>
  `;
}

function formationPreview(stage) {
  const player = game.makePlayerCombatants(stage);
  const enemies = game.makeEnemyCombatants(stage);
  const placements = [...resolveDeploymentFormation(player, 'player'), ...resolveDeploymentFormation(enemies, 'enemy')];
  for (const placement of placements) {
    const { unit, formationX, formationY } = placement;
    const head = formationY + (getBattleUnitHeadY(unit, placement) ?? -55);
    const overlaps = placements.some((other) => other !== placement
      && Math.abs(other.formationX - formationX) < 45 && other.formationY < formationY
      && other.groundY > head - 20
      && other.formationY + (getBattleUnitHeadY(other.unit, other) ?? -55) < head);
    const offsetX = overlaps ? (formationX < BATTLEFIELD_WIDTH / 2 ? 50 : -50) : 0;
    const rank = unit.trainingRank || unit.rarity || 'COMMON';
    const shortRank = { COMMON: 'C', RARE: 'R', EPIC: 'E', LEGENDARY: 'L', MYTHIC: 'M', ASCENDED: 'A' }[rank];
    unit.deploymentBadge = {
      text: unit.side === 'enemy' ? `${shortRank} · Lv. ${unit.level}` : `Lv. ${unit.level}`,
      description: unit.side === 'enemy' ? `${rank}, level ${unit.level}` : `level ${unit.level}`, offsetX
    };
  }
  return { deployment: true, stageId: stage.id, player, enemies, events: [], tick: 0, result: null };
}

function renderDeploymentBadge(placement) {
  const { unit, formationX, formationY } = placement;
  const { text, description, offsetX } = unit.deploymentBadge;
  const headY = getBattleUnitHeadY(unit, placement);
  const badgeY = headY === null ? formationY : formationY + headY - 6;
  const transform = headY === null ? '' : ';transform:translate(-50%,-100%)';
  return `<span class="deployment-level ${unit.side}" role="img" aria-label="${esc(unit.name)}, ${esc(description)}"
    style="left:${(formationX + offsetX) / BATTLEFIELD_WIDTH * 100}%;top:${badgeY / BATTLEFIELD_HEIGHT * 100}%${transform}">${esc(text)}</span>`;
}

// Rows widen toward the foreground. The etched diamonds use the same anchors as the fighters.
const COURTYARD_SEAMS = [
  [[50, 226], [146, 229], [255, 225], [354, 226]],
  [[34, 323], [136, 325], [248, 321], [356, 325]],
  [[18, 428], [126, 424], [242, 429], [358, 427]],
  [[4, 543], [121, 540], [240, 544], [360, 542]],
];
const DEPLOYMENT_COLUMNS = [['BACK', 'Rear'], ['MIDDLE', 'Center'], ['FRONT', 'Forward']];
const courtyardLine = (points) => `M${points.map((point) => point.join(' ')).join('L')}`;

function renderCourtyardEngraving() {
  const columns = COURTYARD_SEAMS[0].map((_, column) => COURTYARD_SEAMS.map((seam) => seam[column]));
  const grooves = [...COURTYARD_SEAMS, ...columns].map(courtyardLine).join('');
  const diamonds = DEPLOYMENT_SLOTS.map(({ x, y, index }) => {
    const ground = y + STANDEE_CONTACT_OFFSET_Y;
    const w = 10 + index;
    return `M${x - w} ${ground}l${w} -5 ${w} 5 -${w} 5Z M${x - w - 7} ${ground}h3 M${x + w + 4} ${ground}h3`;
  }).join('');
  return `<svg class="deployment-engraving" viewBox="0 0 ${BATTLEFIELD_WIDTH} ${BATTLEFIELD_HEIGHT}" aria-hidden="true">
    <path class="deployment-engraving-cut" d="${grooves}"/>
    <path class="deployment-engraving-edge" d="${grooves}"/>
    <path class="deployment-engraving-rune-cut" d="${diamonds}"/>
    <path class="deployment-engraving-rune" d="${diamonds}"/>
  </svg>`;
}

function renderCourtyardSlotLight({ index, x, y }, column) {
  const upper = COURTYARD_SEAMS[index];
  const lower = COURTYARD_SEAMS[index + 1];
  const outline = courtyardLine([upper[column], upper[column + 1], lower[column + 1], lower[column]]);
  const left = x - DEPLOYMENT_TILE_WIDTH / 2;
  const top = y + STANDEE_CONTACT_OFFSET_Y - DEPLOYMENT_TILE_HEIGHT / 2;
  return `<svg class="deployment-slot-light" viewBox="${left} ${top} ${DEPLOYMENT_TILE_WIDTH} ${DEPLOYMENT_TILE_HEIGHT}" aria-hidden="true">
    <path d="${outline}Z"/>
  </svg>`;
}

function renderFormation() {
  const counts = game.getFormationCounts();
  const tileOrigin = DEPLOYMENT_SLOTS[0];
  const gridStyle = `left:${(tileOrigin.x - DEPLOYMENT_TILE_WIDTH / 2) / BATTLEFIELD_WIDTH * 100}%;
    top:${(tileOrigin.y + STANDEE_CONTACT_OFFSET_Y - DEPLOYMENT_TILE_HEIGHT / 2) / BATTLEFIELD_HEIGHT * 100}%;
    width:${3 * DEPLOYMENT_TILE_WIDTH / BATTLEFIELD_WIDTH * 100}%;
    height:${3 * DEPLOYMENT_TILE_HEIGHT / BATTLEFIELD_HEIGHT * 100}%`;
  const stage = game.getStageList().find((item) => item.id === ui.formationStageId) || getStageById(ui.formationStageId) || game.getCurrentStage();
  if (!stage) return renderCampaign();
  const preview = formationPreview(stage);
  const positions = resolveDeploymentFormation(preview.player, 'player');
  const enemyPositions = resolveDeploymentFormation(preview.enemies, 'enemy');
  const squadPower = preview.player.reduce((total, unit) => total + combatPowerFromStats(unit.stats), 0);
  const enemyPower = game.getStageThreat(stage.id).enemyPower;
  const featuredEnemy = preview.enemies.find((unit) => unit.isBoss) || preview.enemies.reduce((strongest, unit) =>
    !strongest || combatPowerFromStats(unit.stats) > combatPowerFromStats(strongest.stats) ? unit : strongest, null);
  const enemyPortrait = getMonsterPortrait(featuredEnemy?.name);
  const activeIds = new Set(game.saveData.activeSquad.map((entry) => entry.heroId));
  const picked = game.getHero(ui.formationPickId);
  const occupied = new Map(positions.map((placement) => [
    `${placement.slotKind.toUpperCase()}-${placement.slotIndex}`, placement.unit,
  ]));
  const fieldClass = getBattlefieldArt(stage.id)?.className || '';
  const presentation = getRegionPresentation(stage.region || 1);
  const entryBlock = game.getCurrentStage(stage.locationId)?.id === stage.id ? game.getStageEntryBlock(stage.id) : null;
  const entryPrompt = STAGE_ENTRY_PROMPTS[entryBlock];
  const trayNotice = entryPrompt?.message || (picked && counts.total === 5 && !activeIds.has(picked.id)
    ? 'Choose a position to replace.'
    : stage.briarWard ? 'Briar Ward · 5 seals' : '');
  const rosterColumns = 5;
  const rosterRows = Array.from({ length: Math.max(3, Math.ceil(game.heroes.length / rosterColumns)) }, (_, row) =>
    Array.from({ length: rosterColumns }, (_, col) => game.heroes[row * rosterColumns + col] || null));
  const wispPortrait = featuredEnemy?.name === 'Grove Wisp';
  return `
    <main class="formation-deployment has-reserves${picked ? ' placing-trainee' : ''}" aria-label="Deploy combatants for ${esc(stage.locationName)} stage ${stage.stage}">
      <div class="battle-screen-art battle-backdrop region-${presentation.className} ${fieldClass}" aria-hidden="true"></div>
      <header class="deployment-heading">
        <button class="deployment-back" data-view="CAMPAIGN" type="button" aria-label="Back to expedition">${battleIcon('back')}</button>
        <div><strong>${esc(stage.locationName)} · ${stage.special?'Special':formatNumber(stage.stage)}</strong></div>
      </header>
      <div class="deployment-power" role="group" aria-label="Power comparison">
        <span class="deployment-power-side" role="group" aria-label="Squad power">
          <img class="deployment-power-portrait" src="final-assets/expedition/academy-master-portrait-v1.png" alt="">
          <b>${formatNumber(squadPower)}</b>
        </span>
        <span class="deployment-power-side" role="group" aria-label="Enemy power${featuredEnemy ? ` · ${esc(featuredEnemy.name)}` : ''}">
          <b>${formatNumber(enemyPower)}</b>
          ${enemyPortrait
            ? `<span class="deployment-power-portrait${wispPortrait ? ' wisp-portrait' : ''}"><img src="${esc(enemyPortrait)}" alt=""></span>`
            : featuredEnemy ? `<span class="deployment-power-portrait" aria-hidden="true">${esc(sigilLetters(featuredEnemy.name))}</span>` : ''}
        </span>
      </div>
      <section class="deployment-field phaser-battle-panel battle-backdrop region-${presentation.className} ${fieldClass}" aria-label="Upcoming battlefield with ${preview.enemies.length} enemies">
        ${renderBattleAtmosphere()}
        ${renderCourtyardEngraving()}
        <div id="phaser-battle-host" class="phaser-battle-host" aria-hidden="true"></div>
        <div class="battle-dom-fallback" aria-hidden="true">
          ${enemyPositions.map(renderUnit).join('')}
          ${positions.map(renderUnit).join('')}
        </div>
        <div class="battle-live-status" data-battle-renderer-status role="status">Preparing battlefield…</div>
        <div class="deployment-plane">
          <div class="deployment-grid" role="group" aria-label="Nine deployment positions"
            style="${gridStyle}">
            ${['Upper', 'Middle', 'Lower'].map((lane, index) => `
              <div class="deployment-grid-row" role="group" aria-label="${lane} row">
                ${DEPLOYMENT_COLUMNS.map(([row, name], column) => {
                  const unit = occupied.get(`${row}-${index}`);
                  const selected = unit && unit.id === ui.formationPickId;
                  const canPlace = picked && (unit || counts.total < 5 || activeIds.has(picked.id));
                  const slot = DEPLOYMENT_SLOTS[column * DEPLOYMENT_COLUMNS.length + index];
                  return `<button class="deployment-slot ${unit ? 'occupied' : 'empty'} ${canPlace ? 'placing' : ''} ${selected ? 'selected' : ''}"
                    data-action="place-formation" data-row="${row}" data-slot="${index}" data-hero="${unit ? esc(unit.id) : ''}" type="button"
                    aria-pressed="${Boolean(selected)}" aria-label="${name} position${unit ? `, ${esc(unit.name)}` : ', empty'}">${renderCourtyardSlotLight(slot, column)}</button>`;
                }).join('')}
              </div>`).join('')}
          </div>
          ${positions.map(renderDeploymentBadge).join('')}
          ${enemyPositions.map(renderDeploymentBadge).join('')}
        </div>
      </section>
      <section class="deployment-tray${trayNotice ? ' has-notice' : ''}">
        ${trayNotice ? `<div class="deployment-tray-heading">${trayNotice}</div>` : ''}
        <div class="deployment-roster" role="group" aria-label="Combatants, ${counts.total} of 5 deployed">
          ${rosterRows.map((row, rowIndex) => `<div class="deployment-roster-row" role="group" aria-label="Roster row ${rowIndex + 1}">${row.map((hero) => hero ? `<button data-rarity-frame="${portraitFrameTier(getHeroRankProgress(hero).rank)}" class="deployment-trainee ${activeIds.has(hero.id) ? 'assigned' : ''} ${ui.formationPickId === hero.id ? 'picked' : ''} ${visualClass(hero)}" data-action="pick-formation" data-hero="${esc(hero.id)}" type="button" aria-pressed="${ui.formationPickId === hero.id}" aria-label="${esc(hero.name)}, level ${hero.level}, ${activeIds.has(hero.id) ? 'placed' : 'available'}">
            <span class="deployment-avatar" aria-hidden="true">${BATTLE_DECK_PORTRAITS[hero.heroDefId]
              ? `<img class="deployment-deck-portrait" src="./final-assets/battle/deck-portraits/${BATTLE_DECK_PORTRAITS[hero.heroDefId]}.webp" alt="">`
              : renderTraineePortraitImage(traineePortrait(hero)) || esc(sigilLetters(hero.name))}</span>${renderPortraitRarityFrame(portraitFrameTier(getHeroRankProgress(hero).rank))}<small class="formation-portrait-level" aria-hidden="true">Lv. ${hero.level}</small>
          </button>` : '<div class="deployment-roster-empty" role="img" aria-label="Empty combatant slot"><span aria-hidden="true"></span></div>').join('')}</div>`).join('')}
        </div>
        ${entryPrompt
          ? renderStageEntryAction(entryPrompt, 'deployment-go')
          : `<button class="deployment-go deployment-start" data-action="start-formation-battle" type="button" aria-label="Start battle" ${counts.total && game.canBattleStage(stage.id) ? '' : 'disabled'}></button>`}
      </section>
    </main>
  `;
}

// Selection is DOM-only: do not destroy/reload the battlefield on every tap.
function refreshFormation(changed = false) {
  const stage = getStageById(ui.formationStageId);
  if (changed && (!stage || !battleRenderer.updateDeployment(formationPreview(stage)))) {
    const scroll = root.querySelector('.deployment-roster')?.scrollTop || 0;
    render();
    root.querySelector('.deployment-roster')?.scrollTo(0, scroll);
    return;
  }
  const scroll = root.querySelector('.deployment-roster')?.scrollTop || 0;
  const template = document.createElement('template');
  template.innerHTML = renderFormation();
  root.querySelector('.formation-deployment')?.classList.toggle('placing-trainee', Boolean(ui.formationPickId));
  for (const selector of ['.deployment-heading', '.deployment-power', '.deployment-plane', '.deployment-tray', '.battle-dom-fallback']) {
    root.querySelector(selector)?.replaceWith(template.content.querySelector(selector));
  }
  root.querySelector('.deployment-roster')?.scrollTo(0, scroll);
}

function renderFormationRow(row, heroes, limit) {
  const slots = Array.from({ length: limit }, (_, index) => heroes[index] || null);
  return `
    <div class="formation-row ${row.toLowerCase()}">
      <div class="formation-row-label">${row}</div>
      <div class="formation-slots">
        ${slots.map((hero, index) => hero ? renderFormationHero(hero, row) : `<div class="formation-slot empty"><span>${row === 'FRONT' ? 'Front' : 'Back'} ${index + 1}</span></div>`).join('')}
      </div>
    </div>
  `;
}

function renderFormationHero(hero, row) {
  const otherRow = row === 'FRONT' ? 'BACK' : 'FRONT';
  return `
    <article class="formation-slot filled ${visualClass(hero)}">
      <div class="portrait formation-portrait"></div>
      <div class="formation-name">${esc(hero.name)}</div>
      <div class="formation-meta">${esc(formatTerm(hero.heroClass))} / ${esc(formatTerm(hero.affinity))}</div>
      <div class="formation-actions">
        <button class="control-button" data-action="set-row" data-row="${otherRow}" data-hero="${hero.id}" type="button">${otherRow}</button>
        <button class="control-button" data-action="toggle-squad" data-hero="${hero.id}" type="button">OUT</button>
      </div>
    </article>
  `;
}

function renderReserveHero(hero) {
  return `
    <article class="reserve-card ${visualClass(hero)}">
      <div class="portrait reserve-portrait"></div>
      <div class="reserve-copy">
        <div class="roster-title" style="color:${rarityColor(hero.rarity)}">${esc(hero.name)}</div>
        <div class="roster-meta">Lv ${hero.level} ${hero.rarity} ${formatTerm(hero.heroClass)} / ${formatTerm(hero.affinity)}</div>
      </div>
      <button class="control-button" data-action="toggle-squad" data-hero="${hero.id}" type="button">IN</button>
    </article>
  `;
}

const TRAINEE_ART_BASE = 'final-assets/trainees';
const TRAINEE_CARD_ART = Object.freeze({
  hero_cinder_vale: 'cinder-vale',
  hero_yssa_driftborn: 'yssa-driftborn',
  hero_frost_warden_kael: 'frost-warden-kael',
  hero_lumen_solis: 'lumen-solis',
  hero_dusk: 'dusk',
  hero_sera_ashveil: 'sera-ashveil',
  hero_pyreth_the_branded: 'pyreth-the-branded',
  hero_stone_sentinel_gorr: 'stone-sentinel-gorr',
});
const TRAINEE_RANK_COLORS = RARITY_COLORS;

const TRAINEE_AFFINITY_ART = Object.freeze({ FLAME: 'flame', FROST: 'frost', ARCANE: 'arcane' });

function renderTraineeIcon(icon) {
  return `<img class="trainee-icon" src="${TRAINEE_ART_BASE}/${icon}.webp" alt="">`;
}

function renderTraineeAffinity(affinity) {
  const gem = TRAINEE_AFFINITY_ART[affinity];
  return gem ? renderTraineeIcon(`affinity-${gem}`) : '<i aria-hidden="true">✦</i>';
}

function renderHeroes() {
  const activeIds = new Set(game.saveData.activeSquad.map((entry) => entry.heroId));
  const selectedHero = game.getHero(ui.selectedHeroId)
    || game.heroes.find((hero) => activeIds.has(hero.id))
    || game.heroes[0];
  ui.selectedHeroId = selectedHero?.id || null;
  const launchHeroIds = new Set(HERO_DEFINITIONS.map((definition) => definition.id));
  const ownedLaunchCount = game.heroes.filter((hero) => launchHeroIds.has(hero.heroDefId)).length;
  const lockedCount = Math.max(0, HERO_DEFINITIONS.length - ownedLaunchCount);
  const roster = [...game.heroes];
  if (ui.traineeSort === 'rarity') roster.sort((a, b) => getHeroRankProgress(b).index - getHeroRankProgress(a).index);
  if (ui.traineeSort === 'level') roster.sort((a, b) => b.level - a.level);
  const log = (game.saveData.log || []).slice(-4).reverse();
  return `
    ${renderTopHud('', [CURRENCY.LESSON_SCROLLS])}
    <main class="screen roster-screen trainee-page" aria-label="Combatants">
      ${selectedHero ? renderTraineeShowcase(selectedHero) : '<div class="empty-state">No combatants recruited yet.</div>'}
      <section class="trainee-page-roster trainee-gilded" aria-labelledby="trainee-roster-title">
        <header>
          <h2 id="trainee-roster-title" class="trainee-roster-label" aria-label="Combatant roster">${renderTraineeIcon('formation-party')}</h2>
          <span>${ownedLaunchCount} / ${HERO_DEFINITIONS.length}</span>
          <label class="trainee-sort"><select aria-label="Sort combatants" data-trainee-sort>
            <option value="enrollment" ${ui.traineeSort === 'enrollment' ? 'selected' : ''}>Recruitment</option>
            <option value="rarity" ${ui.traineeSort === 'rarity' ? 'selected' : ''}>Rank</option>
            <option value="level" ${ui.traineeSort === 'level' ? 'selected' : ''}>Level</option>
          </select></label>
          <button class="trainee-log-button" data-action="open-trainee-dialog" data-dialog="trainee-log" type="button" aria-label="Dispatch Log" aria-haspopup="dialog">
            ${renderTraineeIcon('dispatch-scroll')}
          </button>
        </header>
        <div class="trainee-card-grid">
          ${roster.map((hero) => renderRosterGridHero(hero, activeIds.has(hero.id), hero.id === selectedHero?.id)).join('')}
          ${Array.from({ length: lockedCount }, renderLockedRosterSlot).join('')}
        </div>
      </section>
      <dialog class="trainee-dialog trainee-gilded" id="trainee-log" aria-labelledby="trainee-log-title">
        <h2 id="trainee-log-title">Dispatch Log</h2>
        ${log.length ? `<ul>${log.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : '<p>No dispatches yet.</p>'}
        <form method="dialog"><button type="submit">Close</button></form>
      </dialog>
    </main>
    ${renderBottomNav()}
  `;
}

const TRAINEE_TABS = [
  ['overview', 'Overview', 'skill-ward'],
  ['equipment', 'Equipment', 'forest-gate-shield'],
  ['promotion', 'Promotion', 'role-compass'],
];

const SECONDARY_SKILL_DESCRIPTIONS = {
  'Heated Guard': 'After taking HP damage, gains a temporary self-shield.',
  'Glacier Shield': 'Shields the ally with the lowest HP percentage.',
  'Sigil Wall': 'When an ally takes HP damage, briefly shields the two allies with the lowest HP percentages.',
  'Cinder Feint': 'Strikes the same frontline enemy twice.',
  'Chilling Thread': 'Deals Frost damage and applies Chill.',
  'Shatter Arrow': 'Strikes the enemy with the lowest current HP.',
  'Phase Step': 'Every fourth landed Basic Attack strikes the most vulnerable backline enemy, if one is alive.',
  'Lumen Mend': 'Heals the injured ally with the lowest HP percentage.',
  'Cauterize': 'When an ally drops below 50% HP, heals that ally over their next two actions.',
  'Ignite': 'Damages an enemy and applies Burning.',
  'Arcane Amplify': 'Automatically increases the next Ultimate’s damage by 25%.',
};

const TRAINEE_SKILL_EFFECTS = {
  DAMAGE: 'Hits one enemy.',
  DAMAGE_LOWEST: 'Hits one enemy.',
  BARRIER_GUARD_SELF: 'Gains a barrier and reduces incoming damage.',
  CHARGE_SPLASH_BARRIER: 'Hits an enemy and up to two others, then gains a barrier.',
  DAMAGE_BURN: 'Hits one enemy with a chance to burn them.',
  DAMAGE_ALL_BURN: 'Hits all enemies, with a chance to burn each one.',
  HEAL_LOWEST: 'Heals the lowest-health ally.',
  HEAL_OVER_TIME: 'Heals the lowest-health injured ally over time.',
  HEAL_ALL_BARRIER: 'Heals all living allies and gives them a barrier.',
  BARRIER_LOWEST: 'Gives the lowest-health ally a barrier.',
  DAMAGE_ALL_CHILL: 'Hits and chills all enemies.',
  DAMAGE_ALL_STUN: 'Hits all enemies and may stun one of them.',
  DAMAGE_WEAKEST: 'Hits the enemy with the lowest health.',
  THREE_HITS: 'Strikes repeatedly, retargeting if an enemy falls.',
  BARRIER_TWO: 'Gives a barrier to up to two allies with the lowest health percentage.',
  BARRIER_ALL_GUARD: 'Gives allies a barrier and reduces damage taken by the caster.',
  DAMAGE_BACK_LOWEST: 'Targets the lowest-health backline enemy when possible.',
  THREE_LOWEST: 'Strikes the lowest-health enemies, spreading hits when possible.',
  HEAL_ALL_CLEANSE: 'Heals allies and removes burn, chill, and stun.',
  DAMAGE_FRONT: 'Prioritizes the enemy frontline.',
  AMPLIFY_ULTIMATE: 'Amplifies the next ultimate.',
  DAMAGE_CLUSTER: 'Hits an enemy and nearby targets.',
  DAMAGE_CLUSTER_FREEZE: 'Hits an enemy and nearby targets and briefly freezes them.',
  DAMAGE_ALL: 'Hits all enemies.',
  DAMAGE_CHILL: 'Hits and chills one enemy.',
};

let trainingPractice = null;

const TRAINING_ACTIONS = [
  ['basic', 'Basic', 'basicAbility', 'skill-strike'],
  ['skill', 'Skill', 'skillAbility', 'skill-ward'],
  ['ultimate', 'Ultimate', 'ultimateAbility', 'skill-rift'],
];

function createTrainingPractice(hero) {
  const session = new GameSession({ storage: { getItem: () => null, setItem() {} } });
  session.saveData.heroes = [structuredClone(hero)];
  session.saveData.activeSquad = [{ heroId: hero.id }];
  const [caster] = session.makePlayerCombatants();
  caster.hp = Math.max(1, Math.floor(caster.maxHp / 2));
  caster.chillActions = 2;
  const targetHp = Math.max(1000, caster.stats.damage * 45);
  const enemies = session.makeEnemyCombatants({
    enemies: ['Left construct', 'Center construct', 'Right construct'].map((name, slot) => ({
      id: `training-${slot}`, name, level: hero.level, heroClass: 'GUARDIAN', affinity: 'TRAINING',
      row: slot === 2 ? 'BACK' : 'FRONT', formationSlot: slot === 2 ? 0 : slot,
      stats: { hp: targetHp, defense: 100 },
    })),
  });
  session.battle = { player: [caster], enemies, log: [], events: [], eventSequence: 0, tick: 0 };
  return { heroId: hero.id, session, caster, enemies, result: null };
}

function castTrainingAbility(action) {
  const practice = trainingPractice;
  const choice = TRAINING_ACTIONS.find(([key]) => key === action);
  const hero = game.getHero(practice?.heroId);
  if (!practice || !choice || !hero || (action === 'skill' && (!isSecondarySkillUnlocked(hero) || hero.skillAbility?.kind === 'PASSIVE'))) return;
  const ability = practice.caster[choice[2]];
  if (!ability) return;
  const { session, caster, enemies } = practice;
  session.battle.events = [];
  const wasChilled = caster.chillActions > 0;
  const priorRecovery = caster.recovery;
  const priorStatuses = enemies.map(({ burnActions, chillActions, stunActions }) => ({ burnActions, chillActions, stunActions }));
  if (action === 'ultimate') {
    caster.ultimateCharge = 100;
    session.useUltimate(caster.id);
  } else {
    session.executeAbility(caster, ability);
  }
  const events = session.battle.events;
  const totals = Object.fromEntries(['damage', 'heal', 'barrier'].map(type => [
    type, events.filter(event => event.type === type).reduce((total, event) => total + event.amount, 0),
  ]));
  const effects = [
    totals.damage && `${formatNumber(totals.damage)} damage`,
    totals.heal && `${formatNumber(totals.heal)} healing`,
    totals.barrier && `${formatNumber(totals.barrier)} barrier`,
    wasChilled && !caster.chillActions && 'Chill removed',
    caster.recovery && priorRecovery !== caster.recovery && `${formatNumber(caster.recovery.amount)} healing per action for ${caster.recovery.remaining} actions`,
    ability.effect === 'AMPLIFY_ULTIMATE' && 'Next ultimate empowered',
    ...[['burnActions', 'Burn applied'], ['chillActions', 'Chill applied'], ['stunActions', 'Stun applied']]
      .filter(([status]) => enemies.some((enemy, index) => enemy[status] > priorStatuses[index][status]))
      .map(([, label]) => label),
  ].filter(Boolean);
  const targets = new Set(events.filter(event => event.type === 'damage').map(event => event.targetId));
  for (const enemy of enemies) {
    if (enemy.hp > 0) continue;
    enemy.hp = enemy.maxHp;
    enemy.burnActions = enemy.chillActions = enemy.stunActions = 0;
  }
  practice.result = {
    action, name: ability.id, targets,
    message: effects.join(' · ') || TRAINEE_SKILL_EFFECTS[ability.effect] || 'Ability used',
  };
}

function renderTrainingGrounds() {
  const hero = game.getHero(trainingPractice?.heroId) || game.getHero(ui.selectedHeroId) || game.heroes[0];
  if (hero && trainingPractice?.heroId !== hero.id) trainingPractice = createTrainingPractice(hero);
  const standee = hero && getBattleIdleArt({ ...hero, side: 'player' }, { deployment: true, depthScale: 1 }, 1);
  return `
    ${renderTopHud()}
    <main class="screen training-screen" aria-labelledby="training-title">
      <header class="training-heading">
        <button class="control-button" type="button" data-view="ACADEMY" aria-label="Back to Academy">‹ Academy</button>
        <h1 id="training-title">Training Grounds</h1>
      </header>
      ${hero ? `
        <div class="training-art" aria-hidden="true">
          ${standee?.src ? `<img class="training-caster" src="${esc(standee.src)}" alt="">` : ''}
          ${trainingPractice.enemies.map((enemy) => `
            <img class="training-construct" data-training-target="${enemy.id}" src="final-assets/battle/enemies/location-roster/root-warden.webp" alt="">
          `).join('')}
        </div>
        <section class="training-controls" aria-label="Ability practice">
          <div class="training-selector">
            <label for="training-hero">Combatant</label>
            <select id="training-hero">
              ${game.heroes.map(candidate => `<option value="${esc(candidate.id)}" ${candidate.id === hero.id ? 'selected' : ''}>${esc(candidate.name)}</option>`).join('')}
            </select>
            <button class="control-button" type="button" data-action="training-reset">Reset</button>
          </div>
          <div class="training-abilities">
            ${TRAINING_ACTIONS.map(([key, label, field, icon]) => {
              const locked = key === 'skill' && !isSecondarySkillUnlocked(hero);
              const passive = key === 'skill' && hero.skillAbility?.kind === 'PASSIVE';
              return `
                <button class="control-button" type="button" data-action="training-cast" data-ability="${key}" ${locked || passive || !hero[field] ? 'disabled' : ''}>
                  ${renderTraineeIcon(icon)}<strong>${label}</strong>
                  <small>${locked ? `Lv. ${TRAINEE_SKILL_UNLOCK_LEVEL}` : passive ? 'Triggers automatically' : esc(hero[field]?.id || '')}</small>
                </button>`;
            }).join('')}
          </div>
          <p class="training-result" role="status">Choose an ability to test it. Ultimates are ready for practice.</p>
        </section>
      ` : '<p>Recruit a combatant to begin practicing.</p>'}
    </main>
    ${renderBottomNav()}
  `;
}

function showTrainingCast() {
  const result = trainingPractice?.result;
  if (!result) return;
  root.querySelector('.training-result').textContent = `${result.name} · ${result.message}`;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const caster = root.querySelector('.training-caster');
  caster?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(9%)', offset: .34 }, { transform: 'translateX(0)' }], 325);
  for (const target of root.querySelectorAll('.training-construct')) {
    if (!result.targets.has(target.dataset.trainingTarget)) continue;
    target.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.7)', transform: 'translateX(6%)', offset: .3 }, { filter: 'brightness(1)' }], { duration: 385, delay: 100 });
  }
}

root.addEventListener('change', (event) => {
  if (event.target.id !== 'training-hero') return;
  const hero = game.getHero(event.target.value);
  if (!hero) return;
  trainingPractice = createTrainingPractice(hero);
  render();
  root.querySelector('#training-hero')?.focus();
});

function renderTraineeShowcase(hero) {
  const rank = getHeroRankProgress(hero);
  const hasCinderArt = hero.heroDefId === 'hero_cinder_vale';
  const standee = getBattleIdleArt({ ...hero, side: 'player' }, { deployment: true, depthScale: 1 }, 1);
  const showcaseSrc = hasCinderArt
    ? `${TRAINEE_ART_BASE}/cinder-vale-showcase.webp`
    : standee?.src || traineePortrait(hero)?.src;
  const stats = computeHeroStats(hero);
  const abilities = [
    ['Basic', hero.basicAbility, hero.normalAbilityIds?.[0], 'strike'],
    ['Secondary', hero.skillAbility, hero.normalAbilityIds?.[1], hero.heroClass === 'STRIKER' ? 'shards' : 'ward'],
    ['Ultimate', hero.ultimateAbility, hero.ultimateAbilityId, 'rift'],
  ].map(([kind, ability, name, icon]) => ({
    kind: kind === 'Secondary' ? (ability?.kind === 'PASSIVE' ? 'Passive' : 'Active') : kind, name: ability?.id || name || kind, icon, description: SECONDARY_SKILL_DESCRIPTIONS[ability?.id] || TRAINEE_SKILL_EFFECTS[ability?.effect],
    cooldown: ability?.cooldownMs,
    locked: kind === 'Secondary' && !isSecondarySkillUnlocked(hero),
  }));
  const panels = [
    renderTraineeOverview(hero, abilities, rank),
    renderTraineeEquipment(hero),
    renderTraineePromotion(hero, rank),
  ];
  const role = formatTerm(hero.heroClass);
  const affinity = formatTerm(hero.affinity);
  const rarity = formatTerm(rank.rank);
  return `
    <article class="trainee-showcase ${visualClass(hero)}" style="--trainee-rarity:${TRAINEE_RANK_COLORS[rank.rank] || RARITY_COLORS.COMMON}" aria-labelledby="selected-trainee-title">
      <div class="trainee-showcase-art">
        ${showcaseSrc ? `<img class="${hasCinderArt ? 'trainee-showcase-painted' : ''}" src="${esc(showcaseSrc)}" alt="" fetchpriority="high">` : `<span aria-hidden="true">${esc(sigilLetters(hero.name))}</span>`}
      </div>
      <div class="trainee-profile trainee-gilded">
        <div class="trainee-profile-crest" aria-hidden="true"><img src="${TRAINEE_ART_BASE}/profile-crest.webp" alt=""></div>
        <h2 id="selected-trainee-title" tabindex="-1">${esc(hero.name)}</h2>
        <div class="trainee-identity">
          <span class="trainee-rank-gem" role="img" aria-label="${esc(rarity)} rank" title="${esc(rarity)}"></span>
          <span class="trainee-role-mark" role="img" aria-label="${esc(role)} class" title="${esc(role)}">${renderTraineeIcon('role-compass')}</span>
          <span class="trainee-profile-affinity" role="img" aria-label="${esc(affinity)} affinity" title="${esc(affinity)}">${renderTraineeAffinity(hero.affinity)}</span>
        </div>
        <div class="trainee-profile-power">
          <b aria-label="${formatNumber(combatPowerFromStats(stats))} power">${renderTraineeIcon('power-fist')}<span><small>Power</small>${formatNumber(combatPowerFromStats(stats))}</span></b>
          <button type="button" data-action="open-trainee-dialog" data-dialog="trainee-details" aria-label="View combat statistics" aria-haspopup="dialog">${renderTraineeIcon('stats-medallion')}</button>
        </div>
        ${TRAINEE_TABS.map(([id], index) => `<section class="trainee-panel" role="tabpanel" id="trainee-panel-${id}" aria-labelledby="trainee-tab-${id}" tabindex="0" ${ui.traineeTab === id ? '' : 'hidden'}>${panels[index]}</section>`).join('')}
      </div>
      <div class="trainee-profile-actions" role="tablist" aria-label="Combatant details">
        ${TRAINEE_TABS.map(([id, label, icon]) => `<button type="button" role="tab" id="trainee-tab-${id}" data-action="trainee-tab" data-tab="${id}" aria-controls="trainee-panel-${id}" aria-selected="${ui.traineeTab === id}" tabindex="${ui.traineeTab === id ? 0 : -1}">${renderTraineeIcon(icon)}${label}</button>`).join('')}
      </div>
      <p class="trainee-training-note" role="status">${esc(ui.traineeNotice)}</p>
      ${equipmentDialogs(game,hero)}
      <dialog class="trainee-dialog trainee-gilded" id="trainee-details" aria-labelledby="trainee-details-title">
        <h2 id="trainee-details-title">${esc(hero.name)}</h2>
        <dl class="trainee-combat-stats">
          <div><dt>Class</dt><dd>${esc(role)}</dd></div>
          <div><dt>Affinity</dt><dd>${esc(affinity)}</dd></div>
          <div><dt>Rank</dt><dd>${esc(rarity)} · Max ${esc(formatTerm(rank.cap))}</dd></div>
          <div><dt>Original rarity</dt><dd>${esc(formatTerm(rank.origin))}</dd></div>
          <div><dt>HP</dt><dd>${formatNumber(stats.hp)}</dd></div>
          <div><dt>DEF</dt><dd>${formatNumber(stats.defense)}</dd></div>
          <div><dt>ATK</dt><dd>${formatNumber(stats.damage)}</dd></div>
          <div><dt>SPD</dt><dd>${formatNumber(stats.speed)}</dd></div>
          <div><dt>CRIT</dt><dd>${formatNumber(stats.crit)}%</dd></div>
          <div><dt>DODGE</dt><dd>${stats.dodge || 0}%</dd></div>
        </dl>
        <form method="dialog"><button type="submit">Close</button></form>
      </dialog>
      ${abilities.map(({ kind, name, description, locked, cooldown }, index) => `<dialog class="trainee-dialog trainee-gilded" id="trainee-skill-${index}" aria-labelledby="trainee-skill-title-${index}">
        <h2 id="trainee-skill-title-${index}">${esc(name)}</h2>
        <p>${kind} · ${locked ? 'Unlocks at' : 'Unlocked at'} Lv. ${kind === 'Active' || kind === 'Passive' ? TRAINEE_SKILL_UNLOCK_LEVEL : 1}</p>
        ${cooldown ? `<p>${cooldown / 1000}s cooldown</p>` : ''}
        ${description ? `<p>${esc(description)}</p>` : ''}
        <form method="dialog"><button type="submit">Close</button></form>
      </dialog>`).join('')}
    </article>
  `;
}

function renderTraineeOverview(hero, abilities, rank) {
  const xpNeed = game.xpThreshold(hero);
  const scrollCost = game.lessonScrollCost(hero);
  const capped = hero.level >= rank.levelCap;
  const canLevelUp = game.canLevelUp(hero);
  return `
    <div class="trainee-training-progress">
      <span class="trainee-rarity-ribbon">${esc(formatTerm(rank.rank))}</span>
      <strong class="trainee-level-display">Lv. ${hero.level}<small> / ${rank.levelCap}</small></strong>
      <span class="trainee-xp-readout">${formatNumber(hero.xp)} / ${formatNumber(xpNeed)} XP</span>
      <progress value="${Math.min(hero.xp, xpNeed)}" max="${xpNeed}" aria-label="Personal XP available for the next level"></progress>
      <button class="trainee-train" data-action="level-up" data-hero="${esc(hero.id)}" type="button"
        aria-label="Level Up${scrollCost ? ` · ${formatNumber(scrollCost)} Lesson Scrolls` : ''}" ${canLevelUp ? '' : 'disabled'}>
        <span class="trainee-train-title"><i aria-hidden="true"></i>Level Up</span>
        ${scrollCost ? `<span class="trainee-level-cost" aria-hidden="true"><img src="${CURRENCY_ICONS[CURRENCY.LESSON_SCROLLS]}" alt="">+${formatNumber(scrollCost)}</span>` : ''}
      </button>
    </div>
    ${canLevelUp ? '' : `<small class="trainee-cost-note">${capped ? 'Rank level cap reached' : 'Need more Lesson Scrolls'}</small>`}
    <div class="trainee-section-rule" aria-hidden="true">Skills</div>
    <div class="trainee-skill-list" aria-label="Skills">
      ${abilities.map(({ kind, icon, locked }, index) => `<button type="button" class="${locked ? 'trainee-skill-locked' : ''}" data-action="open-trainee-dialog" data-skill-dialog="trainee-skill-${index}" data-dialog="trainee-skill-${index}" aria-haspopup="dialog" aria-label="${kind}${locked ? `, unlocks at level ${TRAINEE_SKILL_UNLOCK_LEVEL}` : ''}">
        <img src="${TRAINEE_ART_BASE}/skill-${icon}.webp" alt="">
        ${locked ? renderTraineeIcon('slot-lock') : ''}
        <span class="trainee-skill-kind">${esc(kind)}</span>
      </button>`).join('')}
    </div>`;
}

function renderTraineeEquipment(hero) {
  return equipmentPanel(game,hero);
}

function renderTraineePromotion(hero, rank) {
  const fragments = game.currencies[CURRENCY.FRAGMENTS];
  const canPromote = Boolean(rank.next) && hero.level >= rank.levelCap
    && game.canAfford(CURRENCY.FRAGMENTS, rank.fragmentCost);
  return `
    <p>${esc(formatTerm(rank.rank))} · ${formatNumber(fragments)} Fragments</p>
    ${rank.next ? `<button class="trainee-equipment" type="button" data-action="promote-combatant" data-hero="${esc(hero.id)}" ${canPromote ? '' : 'disabled'}>
      <span>Promote to ${esc(formatTerm(rank.next))}<small>Level ${rank.levelCap} · ${rank.fragmentCost} Fragments</small></span>
    </button>` : '<p>Maximum rank reached</p>'}`;
}

function renderRosterGridHero(hero, active, selected) {
  const cardArt = TRAINEE_CARD_ART[hero.heroDefId];
  const portrait = cardArt ? null : traineePortrait(hero);
  const ready = game.canLevelUp(hero);
  const { rank } = getHeroRankProgress(hero);
  return `
    <button class="trainee-grid-card ${active ? 'active' : ''} ${selected ? 'selected' : ''} ${visualClass(hero)}" data-rank="${esc(rank.toLowerCase())}" style="--trainee-rarity:${TRAINEE_RANK_COLORS[rank] || RARITY_COLORS.COMMON}" data-action="select-trainee" data-hero="${esc(hero.id)}" type="button" aria-pressed="${String(selected)}" aria-label="${esc(hero.name)}, level ${hero.level}, ${esc(formatTerm(rank))} rank${active ? ', deployed' : ''}${ready ? ', level-up available' : ''}">
      <span class="trainee-grid-portrait ${cardArt || portrait ? 'has-art' : ''}" aria-hidden="true">${cardArt
        ? `<img class="trainee-showcase-card-art" src="${TRAINEE_ART_BASE}/${cardArt}-card.webp" alt="">`
        : portrait ? renderTraineePortraitImage(portrait) : esc(sigilLetters(hero.name))}</span>
      <span class="trainee-card-affinity" aria-hidden="true">${renderTraineeAffinity(hero.affinity)}</span>
      <span class="trainee-tile-level">Lv. ${hero.level}</span>
      ${ready ? '<span class="trainee-ready-dot" aria-hidden="true"></span>' : ''}
    </button>
  `;
}

function renderLockedRosterSlot() {
  return `<div class="trainee-grid-card trainee-grid-locked">${renderTraineeIcon('slot-lock')}<small>Locked</small></div>`;
}

function renderSummon() {
  const banner = game.getBannerConfig(ui.activeBanner);
  const locked = !game.canUseBanner(ui.activeBanner);
  const freeRecruit = ui.activeBanner === 'BASIC' && !locked && game.getForestGateSummonPool().length > 0;
  const lastResults = game.saveData.summon.lastResults || [];
  const featuredHeroes = HERO_DEFINITIONS
    .filter((hero) => ui.activeBanner === 'ADVANCED' ? ['EPIC', 'LEGENDARY'].includes(hero.rarity) : ['RARE', 'EPIC', 'LEGENDARY'].includes(hero.rarity))
    .slice(ui.activeBanner === 'ADVANCED' ? -4 : 2, ui.activeBanner === 'ADVANCED' ? undefined : 6);
  const unlockMessage = ui.activeBanner === 'BASIC' ? 'Clear Forest Gate Stage 4 to unlock' : 'Advanced recruitment is locked';
  return `
    ${renderTopHud()}
    <main class="screen summon-screen">
      <div class="summon-backdrop ${locked ? 'locked' : ''}" data-hall-banner="${esc(ui.activeBanner)}" aria-hidden="true"></div>
      <div class="summon-layout">
        <header class="summon-heading">
          <h1 class="summon-title">Recruit</h1>
          <section class="banner-tabs" aria-label="Recruitment options">
            <button class="region-tab ${ui.activeBanner === 'BASIC' ? 'active' : ''}" data-banner="BASIC" type="button" aria-pressed="${ui.activeBanner === 'BASIC'}">Basic</button>
            <button class="region-tab ${ui.activeBanner === 'ADVANCED' ? 'active' : ''}" data-banner="ADVANCED" type="button" aria-pressed="${ui.activeBanner === 'ADVANCED'}">Advanced</button>
          </section>
        </header>
        <div class="summon-hall-space" aria-hidden="true"></div>
        <div class="summon-desk">
          <section class="summon-featured-cards" aria-label="Featured combatants">
            ${featuredHeroes.map(renderFeaturedSummonCard).join('')}
          </section>
          <div class="summon-currency">
            <img src="${CURRENCY_ICONS[banner.currency]}" alt="" aria-hidden="true">
            <span>${esc(CURRENCY_LABEL[banner.currency] || banner.currency)}</span>
            <strong>${formatNumber(game.getCurrencyBalance(banner.currency))}</strong>
          </div>
          ${locked ? `<p class="summon-unlock" id="summon-unlock">${unlockMessage}</p>` : ''}
          <section class="summon-actions" aria-label="Recruitment actions" ${locked ? 'aria-describedby="summon-unlock"' : ''}>
            ${[[1, banner.cost1], [10, banner.cost10]].map(([count, cost]) => `
              <button class="battle-button currency-purchase-tile" data-action="pull" data-count="${count}" type="button" ${locked ? 'disabled' : ''}>
                <span>Recruit ×${count}</span>
                <span class="currency-purchase-cost">${!game.developerMode && freeRecruit && count === 1 ? 'FREE' : `<img src="${CURRENCY_ICONS[banner.currency]}" alt="${esc(CURRENCY_LABEL[banner.currency])}"> ${formatNumber(cost)}`}</span>
              </button>
            `).join('')}
          </section>
        </div>
      </div>
      ${ui.showSummonResults && lastResults.length ? `
        <div class="summon-result-overlay">
          <section class="summon-result-dialog" role="dialog" aria-modal="true" aria-labelledby="summon-result-title">
            <div class="summon-result-heading">
              <h2 id="summon-result-title">Recruitment Results</h2>
              <button type="button" class="summon-result-close" data-action="close-summon-results" aria-label="Close recruitment results">✕</button>
            </div>
            <div class="summon-result-list" aria-label="Recruited combatants">
              ${lastResults.map(renderSummonResult).join('')}
            </div>
            <button type="button" class="summon-result-confirm" data-action="close-summon-results">Continue</button>
          </section>
        </div>
      ` : ''}
    </main>
    ${renderActivityLog()}
    ${renderBottomNav()}
  `;
}

// Summon art uses existing, identity-accurate battle poses from each trainee.
const SUMMON_POSE_ASSETS = Object.freeze({
  hero_archmage_eloris: 'final-assets/battle/characters/archmage-eloris/archmage-eloris-idle-right.webp',
  hero_neris_rimeweave: 'final-assets/battle/characters/neris-rimeweave/neris-rimeweave-idle-right.webp',
  hero_tavian_emberstep: 'final-assets/battle/characters/tavian-emberstep/tavian-emberstep-idle-right.webp',
  hero_cinder_vale: 'final-assets/battle/characters/cinder-vale/cinder-vale-ultimate-right.png',
  hero_yssa_driftborn: 'final-assets/battle/characters/yssa-driftborn/yssa-driftborn-attack-right.webp',
  hero_frost_warden_kael: 'final-assets/battle/characters/frost-warden-kael/frost-warden-kael-attack-right.webp',
  hero_lumen_solis: 'final-assets/battle/characters/lumen-solis/lumen-solis-skill-right.webp',
  hero_pyreth_the_branded: 'final-assets/battle/characters/pyreth-the-branded/pyreth-the-branded-skill-right.webp',
  hero_sera_ashveil: 'final-assets/battle/characters/sera-ashveil/sera-ashveil-skill-right.webp',
  hero_stone_sentinel_gorr: 'final-assets/battle/characters/stone-sentinel-gorr/stone-sentinel-gorr-attack-right.webp',
  hero_dusk: 'final-assets/battle/characters/dusk/dusk-ultimate-right.webp',
});

function renderSummonPortrait(hero) {
  const id = hero.heroDefId || hero.id;
  const src = SUMMON_POSE_ASSETS[id];
  return src
    ? `<img class="summon-pose-image" src="${esc(src)}" alt="" loading="lazy" decoding="async">`
    : `<span class="portrait-monogram">${esc(sigilLetters(hero.name))}</span>`;
}

function renderFeaturedSummonCard(hero) {
  return `
    <article class="featured-summon-card ${esc(hero.rarity.toLowerCase())} ${visualClass(hero)}" aria-label="${esc(hero.name)}, ${esc(hero.rarity)} combatant">
      <div class="featured-portrait has-art" aria-hidden="true">
        ${renderSummonPortrait(hero)}
      </div>
      <div class="featured-name">${esc(hero.name)}</div>
      <div class="featured-rarity">${esc(hero.rarity)}</div>
    </article>
  `;
}

function renderSummonResult(result) {
  return `
    <article class="pull-card ${esc(String(result.rarity || '').toLowerCase())}">
      <div class="pull-portrait" aria-hidden="true">${renderSummonPortrait(result)}</div>
      <div class="pull-rarity" style="color:${rarityColor(result.rarity)}">${esc(result.rarity)}</div>
      <div class="pull-name">${esc(result.name)}</div>
      <div class="pull-meta">${result.isNew ? 'NEW RECRUIT' : `<img class="summon-seal-icon" src="${CURRENCY_ICONS[CURRENCY.FRAGMENTS]}" alt=""> +${formatNumber(result.shards)} Fragments`}</div>
    </article>
  `;
}

const ARCHIVE_TABS = [
  ['monsters', 'Monsters', 'final-assets/trainees/power-fist.webp'],
  ['regions', 'Regions', 'tab-regions.webp'],
  ['creatures', 'Creatures', 'tab-creatures.webp'],
  ['records', 'Records', 'tab-records.webp'],
];

function renderSystems() {
  return `${renderTopHud()}${renderArchiveScreen()}${renderBottomNav()}`;
}

function renderArchiveScreen() {
  const category = ui.archiveCategory;
  const tab = ARCHIVE_TABS.find(([id]) => id === category);
  return `
    <main class="screen archive-screen" aria-labelledby="archive-title">
      <header class="archive-hero">
        <div class="archive-hero-title">
          <img src="final-assets/archive/archive-crest.webp" alt="">
          <h1 id="archive-title">Archive</h1>
          <p>Field notes from Arcane Academy and the Wild Forest</p>
        </div>
        <button class="trainee-log-button archive-dispatch" data-action="show-dialog" data-dialog="archive-dispatch" type="button" aria-haspopup="dialog">
          ${renderTraineeIcon('dispatch-scroll')}Dispatch Log
        </button>
      </header>
      <nav class="archive-tabs" aria-label="Archive categories">
        ${ARCHIVE_TABS.map(([id, title, art]) => `<button type="button" data-action="archive-category" data-category="${id}" aria-pressed="${id === category}">
          <img src="${art.startsWith('final-assets/') ? art : `final-assets/archive/${art}`}" alt="">${title}
        </button>`).join('')}
      </nav>
      ${category === 'records' ? renderArchiveRecords() : renderArchiveCollection(category, tab[1])}
      ${renderDispatchDialog('archive-dispatch', 'archive-dialog')}
    </main>
  `;
}

function renderArchiveCollection(category, title) {
  const entries = getArchiveEntries(game, category);
  const preview = category === 'creatures';
  const visible = !preview && ui.archiveDiscoveredOnly ? entries.filter((entry) => entry.seen) : [...entries];
  if (!preview) visible.sort((a, b) => Number(b.seen) - Number(a.seen)
    || (ui.archiveSort === 'name' ? a.name.localeCompare(b.name) : 0)
    || (ui.archiveSort === 'progress' ? b.progress - a.progress : 0));
  const selected = visible.find((entry) => entry.seen && entry.id === ui.archiveEntryId) || visible.find((entry) => entry.seen);
  const discovered = entries.filter((entry) => entry.seen).length;
  const emptyMessage = preview ? 'Creature acquisition is coming later.' : 'Continue your expedition to fill the Archive.';
  return `
    <section class="archive-collection archive-frame${preview ? ' archive-creature-collection' : ''}" aria-label="${title} collection">
      <div class="archive-browser">
        <header><strong>${category === 'monsters' ? 'Discovered monsters' : title}</strong><span>${discovered}/${entries.length}</span></header>
        <div class="archive-card-grid">
          ${visible.map((entry) => renderArchiveCard(entry, entry.id === selected?.id)).join('')}
        </div>
        ${preview ? '' : `<div class="archive-filters">
          <select data-archive-filter aria-label="Filter collection">
            <option value="all" ${ui.archiveDiscoveredOnly ? '' : 'selected'}>All</option>
            <option value="seen" ${ui.archiveDiscoveredOnly ? 'selected' : ''}>Discovered</option>
          </select>
          <select data-archive-sort aria-label="Sort collection">
            <option value="default" ${ui.archiveSort === 'default' ? 'selected' : ''}>Discovery</option>
            <option value="progress" ${ui.archiveSort === 'progress' ? 'selected' : ''}>Progress</option>
            <option value="name" ${ui.archiveSort === 'name' ? 'selected' : ''}>Name</option>
          </select>
        </div>`}
      </div>
      ${selected ? renderArchiveDetail(selected) : `<p class="archive-dossier archive-frame">${emptyMessage}</p>`}
    </section>
  `;
}

function archiveEntryArt(entry) {
  if (!entry.seen) return `
    ${entry.art ? `<img class="archive-locked-art${entry.name ? '' : ' archive-locked-silhouette'}" src="${esc(entry.art)}" alt="" loading="lazy" decoding="async">` : ''}
    <span class="archive-entry-lock" aria-hidden="true">${renderTraineeIcon('slot-lock')}</span>`;

  return entry.art
    ? `<img src="${esc(entry.art)}" alt="" loading="lazy" decoding="async">`
    : '<span class="archive-entry-sigil" aria-hidden="true">✦</span>';
}

function renderArchiveCard(entry, selected) {
  const name = entry.seen ? entry.name : 'Undiscovered';
  const hasProgress = entry.progress != null;
  const status = hasProgress ? `${entry.progress}%` : 'Unlocked';
  return `
    <button type="button" class="archive-card${hasProgress ? '' : ' archive-card-unlocked'}" data-action="archive-select" ${entry.seen ? `data-entry="${esc(entry.id)}"` : 'disabled'} aria-pressed="${selected}" aria-label="${esc(name)}, ${status}">
      <span class="archive-card-art">${archiveEntryArt(entry)}${hasProgress ? '' : '<i class="archive-unlocked-glint" aria-hidden="true"></i>'}</span>
      <strong>${entry.seen ? esc(name) : '???'}</strong>
      <span>${status}</span>
      ${hasProgress ? `<progress value="${entry.progress}" max="100" aria-hidden="true"></progress>` : ''}
    </button>
  `;
}

function renderArchiveDetail(entry) {
  const habitat = entry.habitats?.join(', ');
  const notes = entry.lore || (habitat ? `Sighted in ${habitat}.` : 'This entry is part of the Academy’s expedition catalog.');
  return `
    <article class="archive-dossier archive-frame">
      <h2>${esc(entry.name)}</h2>
      <p class="archive-dossier-type">${esc(entry.type.split(' · ').map(formatTerm).join(' · '))}</p>
      <div class="archive-dossier-art">${archiveEntryArt(entry)}</div>
      <p class="archive-dossier-notes">${esc(notes)}</p>
      ${entry.progress != null ? `<div class="archive-research">
        <span class="archive-meter" style="--archive-progress:${entry.progress}%" aria-label="Collection progress ${entry.progress}%"><b>${entry.progress}%</b></span>
        <span>${esc(entry.progressLabel)}<strong>${entry.completed}/${entry.total}</strong></span>
      </div>` : ''}
      <button class="archive-lore-button" type="button" data-action="show-dialog" data-dialog="archive-lore" aria-haspopup="dialog">View Lore</button>
      <dialog class="content-dialog archive-dialog" id="archive-lore" aria-labelledby="archive-lore-title">
        <h2 id="archive-lore-title">${esc(entry.name)}</h2>
        <p>${esc(notes)}</p>
        ${habitat ? `<p><strong>Habitat</strong><br>${esc(habitat)}</p>` : ''}
        <form method="dialog"><button>Close</button></form>
      </dialog>
    </article>
  `;
}

function renderArchiveRecords() {
  const quests = game.getQuestList();
  const complete = quests.filter((quest) => quest.claimed || quest.complete).length;
  const campaign = game.getCampaignSummary();
  return `
    <section class="archive-records archive-frame" aria-label="Academy records">
      <dl><div><dt>Academy goals</dt><dd>${complete}/${quests.length}</dd></div>
      <div><dt>Expedition stages cleared</dt><dd>${campaign.cleared}</dd></div></dl>
      <ul>${quests.map((quest) => `<li><strong>${esc(quest.title)}</strong><span>${quest.claimed ? 'Claimed' : `${quest.progress}/${quest.target}`}</span></li>`).join('')}</ul>
    </section>
  `;
}

function refreshArchive(focusSelector, resetGrid = false) {
  const screen = root.querySelector('.archive-screen');
  const scrollTop = screen.scrollTop;
  const gridTop = screen.querySelector('.archive-card-grid')?.scrollTop || 0;
  const template = document.createElement('template');
  template.innerHTML = renderArchiveScreen();
  const next = template.content.firstElementChild;
  screen.replaceWith(next);
  next.scrollTop = scrollTop;
  const grid = next.querySelector('.archive-card-grid');
  if (grid && !resetGrid) grid.scrollTop = gridTop;
  next.querySelector(focusSelector)?.focus({ preventScroll: true });
}

function renderQuestRow(quest) {
  const rewardText = [
    quest.rewards.gold ? `${formatNumber(quest.rewards.gold)} Gold` : '',
    quest.rewards.crystals ? `${formatNumber(quest.rewards.crystals)} Crystals` : '',
    quest.rewards.premiumCrystals ? `${formatNumber(quest.rewards.premiumCrystals)} Lumens` : '',
    quest.rewards.awakeningShards ? `${formatNumber(quest.rewards.awakeningShards)} Resonance` : '',
  ].filter(Boolean).join(' / ');
  const state = quest.claimed ? 'CLAIMED' : quest.complete ? 'CLAIM' : `${formatNumber(quest.progress)}/${formatNumber(quest.target)}`;
  return `
    <div class="system-row ${quest.complete ? 'unlocked' : ''}">
      <span>${esc(quest.title)}<small>${esc(quest.description)} / ${esc(rewardText)}</small></span>
      <button class="control-button ${quest.complete && !quest.claimed ? 'active' : ''}" data-action="claim-quest" data-quest="${quest.id}" type="button" ${quest.complete && !quest.claimed ? '' : 'disabled'}>${esc(state)}</button>
    </div>
  `;
}

function renderActivityLog() {
  return `
    <aside class="activity-log">
      ${(game.saveData.log || []).slice(-4).map((line) => `<div>${esc(line)}</div>`).join('')}
    </aside>
  `;
}

function renderDevTools() {
  if (!previewToolsEnabled) return '';
  return `
    <aside class="dev-tools ${ui.devPanelOpen ? 'open' : ''}">
      <button class="dev-toggle" data-action="dev-toggle" type="button">DEV</button>
      <div class="dev-panel">
        ${DEV_STATES.map(([key, label]) => `<button class="dev-state" data-action="dev-state" data-dev-state="${key}" type="button">${label}</button>`).join('')}
      </div>
    </aside>
  `;
}

function afterBattleShellPaint(callback) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
}

function render() {
  if (ui.view !== 'BATTLE' && ui.battleTimer) {
    window.clearInterval(ui.battleTimer);
    ui.battleTimer = null;
  }

  const views = {
    ACADEMY: renderAcademy,
    TRAINING: renderTrainingGrounds,
    CAMPAIGN: renderCampaign,
    FORMATION: renderFormation,
    BATTLE: renderBattle,
    HEROES: renderHeroes,
    SUMMON: renderSummon,
    SYSTEMS: renderSystems,
  };

  battleRenderer.destroy();
  ui.battleEntering = false;
  root.classList.toggle('battle-view', ui.view === 'BATTLE' || ui.view === 'FORMATION');
  root.classList.toggle('formation-view', ui.view === 'FORMATION');
  root.classList.toggle('trainees-view', ui.view === 'HEROES');
  root.classList.toggle('archive-view', ui.view === 'SYSTEMS');
  root.classList.toggle('academy-view', ui.view === 'ACADEMY');
  const pickerScroll = root.querySelector('.trainee-card-grid')?.scrollLeft;
  const campusScroll = root.querySelector('.campus-pan')?.scrollLeft;
  unmountCampusWalker?.();
  unmountCampusWalker = undefined;
  root.innerHTML = `${(views[ui.view] || renderAcademy)()}${renderDevTools()}`;
  if (ui.view === 'HEROES' && pickerScroll) root.querySelector('.trainee-card-grid').scrollLeft = pickerScroll;
  syncCampusLighting();
  const campusPan = root.querySelector('.campus-pan');
  if (campusPan) {
    unmountCampusWalker = mountCampusWalker(campusPan.querySelector('.campus-map'));
    const cloudLayer = campusPan.querySelector('.campus-cloud-parallax');
    const syncCloudParallax = () => {
      const scrollRange = campusPan.scrollWidth - campusPan.clientWidth;
      const offset = (campusPan.scrollLeft - scrollRange / 2) * .18;
      cloudLayer.style.setProperty('--campus-cloud-offset', `${offset / campusPan.scrollWidth * 100}%`);
    };
    campusPan.scrollLeft = campusScroll ?? (campusPan.scrollWidth - campusPan.clientWidth) / 2;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      syncCloudParallax();
      campusPan.addEventListener('scroll', syncCloudParallax, { passive: true });
    }
  }
  const selectedTrailNode = root.querySelector(".expanded-trail .expedition-trail-node.current");
  selectedTrailNode?.scrollIntoView({ block: "center", inline: "nearest" });
  showBattleDefeatDialog();
  syncGameAudio();
  if (ui.view === 'BATTLE' && game.battle) {
    const stage = game.getStageList().find((item) => item.id === game.battle.stageId) || getStageById(game.battle.stageId);
    const presentation = getRegionPresentation(stage?.region || 1);
    const mountToken = ++ui.battleMountToken;
    const battle = game.battle;
    const host = root.querySelector('#phaser-battle-host');
    afterBattleShellPaint(() => {
      if (mountToken !== ui.battleMountToken || ui.view !== 'BATTLE' || game.battle !== battle) return;
      void battleRenderer.mount(host, battle, presentation).then(({ state }) => {
        if (mountToken !== ui.battleMountToken || ui.view !== 'BATTLE' || game.battle !== battle) return;
        ui.battleRendererReady = state === 'ready' || state === 'fallback';
        refreshBattleView();
        if (ui.deployedFromFormation) afterBattleShellPaint(() => {
          if (mountToken === ui.battleMountToken && ui.view === 'BATTLE' && game.battle === battle) startPreparedBattle();
        });
      });
    });
  } else if (ui.view === 'FORMATION') {
    const stage = getStageById(ui.formationStageId);
    if (!stage) return;
    const preview = formationPreview(stage);
    const mountToken = ++ui.battleMountToken;
    const host = root.querySelector('#phaser-battle-host');
    afterBattleShellPaint(() => {
      if (mountToken !== ui.battleMountToken || ui.view !== 'FORMATION') return;
      void battleRenderer.mount(host, preview, getRegionPresentation(stage.region || 1));
    });
  }
}
function syncGameAudio() {
  const stageId = ui.view === 'BATTLE' ? game.battle?.stageId : ui.view === 'FORMATION' ? ui.formationStageId : null;
  const locationId = getStageById(stageId)?.locationId || ui.selectedLocationId;
  gameAudio.sync(game.battle, { view: ui.view, started: ui.battleStarted, battlePaused: ui.battlePaused, speed: ui.battleSpeed,
    resultPending: battleRenderer.isResultPresentationPending(),
    locationId, regionMap: ui.view === 'CAMPAIGN' && ui.expeditionMode === 'CHAPTER_MAP' });
}

let formationPointerDrag = null;
let suppressFormationClick = false;

function clearFormationPointerDrag() {
  formationPointerDrag?.over?.classList.remove('drag-over');
  formationPointerDrag?.source?.classList.remove('drag-source');
  formationPointerDrag?.ghost?.remove();
  root.classList.remove('formation-dragging');
  formationPointerDrag = null;
}

function updateFormationDragTarget(event) {
  if (!formationPointerDrag?.dragging) return;
  const ghost = formationPointerDrag.ghost;
  if (ghost) {
    ghost.style.left = event.clientX + 'px';
    ghost.style.top = event.clientY + 'px';
  }
  const hit = document.elementFromPoint(event.clientX, event.clientY);
  const slot = hit?.closest?.('.deployment-slot') || null;
  if (slot === formationPointerDrag.over) return;
  formationPointerDrag.over?.classList.remove('drag-over');
  formationPointerDrag.over = slot;
  slot?.classList.add('drag-over');
}

root.addEventListener('dragstart', (event) => {
  if (event.target.closest('.deployment-trainee')) event.preventDefault();
});

root.addEventListener('pointerdown', (event) => {
  if (ui.view !== 'FORMATION' || event.button > 0 || !event.isPrimary) return;
  const source = event.target.closest('.deployment-trainee, .deployment-slot.occupied');
  const heroId = source?.dataset.hero;
  if (!source || !heroId) return;
  formationPointerDrag = {
    pointerId: event.pointerId,
    heroId,
    source,
    fromRoster: source.classList.contains('deployment-trainee'),
    roster: source.closest('.deployment-roster'),
    touch: event.pointerType === 'touch',
    startedAt: event.timeStamp,
    scrollStart: source.closest('.deployment-roster')?.scrollTop || 0,
    scrolling: false,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    ghost: null,
    over: null,
  };
});

root.addEventListener('pointermove', (event) => {
  const state = formationPointerDrag;
  if (!state || state.pointerId !== event.pointerId) return;
  const dx = event.clientX - state.startX;
  const dy = event.clientY - state.startY;
  if (!state.dragging) {
    const distance = Math.hypot(dx, dy);
    const wantsRosterDrag = dy < -10 && -dy > Math.abs(dx) * 0.7;
    // A quick vertical swipe scrolls the roster. Hold briefly before dragging
    // a card upward to deploy it; mouse and battlefield dragging are unchanged.
    if (state.fromRoster && state.touch && state.roster &&
        (state.scrolling || (distance >= 9 && (!wantsRosterDrag || event.timeStamp - state.startedAt < 260)))) {
      state.scrolling = true;
      lastFormationCardTap = null;
      try { state.source.setPointerCapture(event.pointerId); } catch {}
      state.roster.scrollTop = state.scrollStart - dy;
      event.preventDefault();
      return;
    }
    if (distance < 9 || (state.fromRoster && !wantsRosterDrag)) return;
    const hero = game.getHero(state.heroId);
    if (!hero) return clearFormationPointerDrag();
    lastFormationCardTap = null;
    state.dragging = true;
    state.source.classList.add('drag-source');
    root.classList.add('formation-dragging');
    const ghost = document.createElement('div');
    ghost.className = 'deployment-drag-ghost';
    ghost.dataset.trainee = hero.heroDefId || '';
    ghost.innerHTML = `${renderTraineePortraitImage(traineePortrait(hero))}<span>${esc(hero.name.split(' ')[0])}</span>`;
    root.appendChild(ghost);
    state.ghost = ghost;
    try { state.source.setPointerCapture(event.pointerId); } catch {}
  }
  event.preventDefault();
  updateFormationDragTarget(event);
});

root.addEventListener('pointerup', (event) => {
  const state = formationPointerDrag;
  if (!state || state.pointerId !== event.pointerId) return;
  if (!state.dragging) {
    if (state.scrolling) {
      event.preventDefault();
      suppressFormationClick = true;
      setTimeout(() => { suppressFormationClick = false; }, 0);
    }
    clearFormationPointerDrag();
    return;
  }
  event.preventDefault();
  updateFormationDragTarget(event);
  const drop = state.over;
  const heroId = state.heroId;
  const row = drop?.dataset.row;
  const slot = drop ? Number(drop.dataset.slot) : NaN;
  clearFormationPointerDrag();
  suppressFormationClick = true;
  setTimeout(() => { suppressFormationClick = false; }, 0);
  if (drop && game.placeHeroInFormation(heroId, row, slot)) {
    ui.formationPickId = null;
    refreshFormation(true);
    gameAudio.play('formation');
  }
});

root.addEventListener('pointercancel', (event) => {
  if (formationPointerDrag?.pointerId === event.pointerId) clearFormationPointerDrag();
});

root.addEventListener('change', (event) => {
  if (event.target.matches('[data-archive-filter]')) {
    ui.archiveDiscoveredOnly = event.target.value === 'seen';
    refreshArchive('[data-archive-filter]', true);
    return;
  }
  if (event.target.matches('[data-archive-sort]')) {
    ui.archiveSort = event.target.value;
    refreshArchive('[data-archive-sort]', true);
    return;
  }
  if (!event.target.matches('[data-trainee-sort]')) return;
  ui.traineeSort = event.target.value;
  render();
  root.querySelector('[data-trainee-sort]').focus({ preventScroll: true });
});

function selectTraineeTab(button) {
  ui.traineeTab = button.dataset.tab;
  ui.traineeNotice = '';
  const showcase = button.closest('.trainee-showcase');
  for (const tab of showcase.querySelectorAll('[role="tab"]')) {
    const selected = tab === button;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    showcase.querySelector('#' + tab.getAttribute('aria-controls')).hidden = !selected;
  }
  showcase.querySelector('.trainee-training-note').textContent = '';
}

root.addEventListener('keydown', (event) => {
  const tab = event.target.closest('[data-action="trainee-tab"]');
  if (!tab) return;
  const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(tab);
  const destination = {
    ArrowLeft: (index - 1 + tabs.length) % tabs.length,
    ArrowRight: (index + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  }[event.key];
  if (destination === undefined) return;
  event.preventDefault();
  tabs[destination].focus({ preventScroll: true });
  selectTraineeTab(tabs[destination]);
});

let skillHold = null;

function cancelSkillHold(event) {
  if (skillHold?.pointerId !== event.pointerId) return;
  clearTimeout(skillHold.timer);
  skillHold = null;
}

root.addEventListener('pointerdown', (event) => {
  const button = event.target.closest('[data-skill-dialog]');
  if (!button || !event.isPrimary || event.button !== 0) return;
  const { pointerId, clientX, clientY } = event;
  skillHold = {
    pointerId, clientX, clientY,
    timer: setTimeout(() => {
      skillHold = null;
      if (button.isConnected) root.querySelector('#' + button.dataset.skillDialog)?.showModal();
    }, 450),
  };
});
root.addEventListener('pointermove', (event) => {
  if (skillHold?.pointerId === event.pointerId
    && Math.hypot(event.clientX - skillHold.clientX, event.clientY - skillHold.clientY) > 10) cancelSkillHold(event);
});
root.addEventListener('pointerup', cancelSkillHold);
root.addEventListener('pointercancel', cancelSkillHold);
root.addEventListener('contextmenu', (event) => {
  if (event.target.closest('[data-skill-dialog]')) event.preventDefault();
});

const FORMATION_DOUBLE_TAP_MS = 350;
let lastFormationCardTap = null;

root.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  if (target.dataset.action !== 'pick-formation') lastFormationCardTap = null;
  if (suppressFormationClick && target.matches('.deployment-trainee, .deployment-slot')) {
    lastFormationCardTap = null;
    suppressFormationClick = false;
    return;
  }
  void gameAudio.unlock();
  const hasActionCue = ['pull', 'level-up', 'claim-quest', 'claim-idle', 'toggle-squad', 'set-row', 'collect', 'collect-next'].includes(target.dataset.action);
  if (!target.dataset.ult && !hasActionCue) gameAudio.play('ui');

  if (target.dataset.view) {
    setView(target.dataset.view);
    return;
  }


  if (target.dataset.chapter && game.developerMode && getChapterById(target.dataset.chapter)) {
    ui.developerChapterId = target.dataset.chapter;
    render();
    return;
  }

  if (target.dataset.location) {
    const locationId = target.dataset.location;
    if (game.setActiveLocation(locationId)) {
      ui.selectedLocationId = locationId;
      ui.selectedStageId = game.getCurrentStage(locationId)?.id;
      ui.expeditionMode = 'LOCATION';
    }
    render();
    return;
  }

  if (target.dataset.stage) {
    const stage = game.getStageList(ui.selectedLocationId).find((item) => item.id === target.dataset.stage);
    if (!stage?.selectable) return;
    ui.selectedStageId = target.dataset.stage;
    setView('FORMATION');
    return;
  }

  if (target.dataset.banner) {
    ui.activeBanner = target.dataset.banner;
    render();
    return;
  }

  if (target.dataset.ult) {
    castBattleUltimate(target.dataset.ult);
    refreshBattleView();
    return;
  }

  const action = target.dataset.action;
  if (action === 'training-cast' && ui.view === 'TRAINING') {
    castTrainingAbility(target.dataset.ability);
    showTrainingCast();
    return;
  }
  if (action === 'training-reset' && ui.view === 'TRAINING') {
    const hero = game.getHero(trainingPractice?.heroId);
    trainingPractice = hero ? createTrainingPractice(hero) : null;
    render();
    root.querySelector('[data-action="training-reset"]')?.focus();
    return;
  }
  if (action === 'open-basic-summon') {
    ui.activeBanner = 'BASIC';
    setView('SUMMON');
    return;
  }
  if (action === 'open-chapter-map') {
    ui.developerChapterId = null;
    ui.expeditionMode = 'CHAPTER_MAP';
    render();
    return;
  }
  if (action === 'return-active-location') {
    ui.expeditionMode = 'LOCATION';
    ui.selectedLocationId = game.getActiveLocation()?.id || 'forest-gate';
    ui.selectedStageId = game.getCurrentStage(ui.selectedLocationId)?.id;
    render();
    return;
  }
  if (action === 'refresh-acquisition' || (action === 'show-dialog' && target.dataset.dialog==='location-acquisition')) {
    render();document.getElementById('location-acquisition')?.showModal();return;
  }
  if (action === 'start-farming' || action === 'claim-farming') {
    const result=action==='start-farming'?game.startFarming(ui.selectedLocationId):game.claimFarming();
    render();const dialog=document.getElementById('location-acquisition');dialog?.showModal();const msg=dialog?.querySelector('.gear-message');if(msg)msg.textContent=result.message;return;
  }
  if (action === 'special-challenge') {
    const location=getLocationById(ui.selectedLocationId);
    if(location&&game.getSpecialStatus(location.id).canStart){ui.selectedStageId=location.specialStage.id;setView('FORMATION');}return;
  }
  if (action === 'battle-selected') setView('FORMATION');
  if (action === 'start-formation-battle') prepareBattle(ui.formationStageId);
  if (action === 'pick-formation') {
    const heroId = target.dataset.hero;
    const isTap = event.detail > 0;
    const now = performance.now();
    const isDoubleTap = isTap && lastFormationCardTap?.heroId === heroId
      && now - lastFormationCardTap.time <= FORMATION_DOUBLE_TAP_MS;
    const removed = isDoubleTap && game.removeHeroFromFormation(heroId);
    lastFormationCardTap = isTap && !isDoubleTap ? { heroId, time: now } : null;
    ui.formationPickId = removed || ui.formationPickId === heroId ? null : heroId;
    refreshFormation(removed);
    gameAudio.play('formation');
  }
  if (action === 'place-formation') {
    const heroId = ui.formationPickId;
    const slotHeroId = target.dataset.hero || null;
    let changed = false;
    if (!heroId && slotHeroId) {
      ui.formationPickId = slotHeroId;
    } else if (heroId && slotHeroId === heroId) {
      changed = game.removeHeroFromFormation(heroId);
      ui.formationPickId = null;
      if (changed) gameAudio.play('formation');
    } else if (heroId && game.placeHeroInFormation(heroId, target.dataset.row, Number(target.dataset.slot))) {
      ui.formationPickId = null;
      changed = true;
      gameAudio.play('formation');
    }
    refreshFormation(changed);
  }
  if (action === 'begin-battle') startPreparedBattle();
  if (action === 'battle-step' && !ui.battleEntering) {
    advanceBattle();
  }
  if (action === 'pause-battle') {
    if (!ui.battleStarted) return;
    ui.battlePaused = !ui.battlePaused;
    restartBattleTimer();
    refreshBattleView();
  }
  if (action === 'speed-battle') {
    ui.battleSpeed = ui.battleSpeed === 1 ? 2 : ui.battleSpeed === 2 ? 4 : 1;
    restartBattleTimer();
    refreshBattleView();
  }
  if (action === 'auto-ult') {
    ui.autoUltimates = !ui.autoUltimates;
    refreshBattleView();
  }
  if (action === 'retry') {
    ui.selectedStageId = game.battle?.stageId || ui.selectedStageId;
    setView('FORMATION');
  }
  if (action === 'collect') {
    const freshReward = game.battle?.result === 'player_win' && !game.battle.collected;
    collectBattle(false);
    if (freshReward) gameAudio.play('reward');
  }
  if (action === 'collect-next') {
    const freshReward = game.battle?.result === 'player_win' && !game.battle.collected;
    collectBattle(true);
    if (freshReward) gameAudio.play('reward');
  }
  if (action === 'next-stage') {
    ui.selectedStageId = game.getCurrentStage(ui.selectedLocationId)?.id;
    setView('FORMATION');
  }
  if (action === 'trainee-tab') {
    selectTraineeTab(target);
    return;
  }
  if (action === 'open-trainee-dialog') {
    root.querySelector('#' + target.dataset.dialog)?.showModal();
    return;
  }
  if (action === 'select-trainee') {
    ui.selectedHeroId = target.dataset.hero;
    ui.traineeNotice = '';
    render();
    root.querySelector('#selected-trainee-title')?.focus({ preventScroll: true });
    return;
  }
  if (action === 'toggle-squad') {
    const before = JSON.stringify(game.saveData.activeSquad);
    game.toggleSquad(target.dataset.hero);
    render();
    if (JSON.stringify(game.saveData.activeSquad) !== before) gameAudio.play('formation');
  }
  if (action === 'set-row') {
    const before = game.saveData.activeSquad.find(entry => entry.heroId === target.dataset.hero)?.row;
    const ok = game.setHeroRow(target.dataset.hero, target.dataset.row);
    if (!ok) {
      game.addLog(`${target.dataset.row} row is full.`);
      game.save();
    }
    render();
    if (ok && before !== target.dataset.row) gameAudio.play('formation');
  }
  if (action === 'promote-combatant') {
    ui.traineeNotice = game.promoteHero(target.dataset.hero).message;
    render();
    return;
  }
  if(action==='forge-craft'||action==='forge-upgrade'){
    const dialog=document.getElementById('academy-forge');
    if(!dialog?.open)return;
    const type=dialog.querySelector('#forge-type')?.value,slot=dialog.querySelector('#forge-slot')?.value,rarity=dialog.querySelector('#forge-rarity')?.value;
    Object.assign(forgeSelection,{type,slot,rarity});
    const recipe=game.getForgeRecipe(type,slot,rarity);
    if(action==='forge-craft'&&(!recipe||!window.confirm('Craft '+recipe.item.name+' for '+recipe.cost.gold+' Gold and '+recipe.cost.materials+' Enhancement Materials?')))return;
    if(action==='forge-upgrade'&&!window.confirm('Upgrade the Forge?'))return;
    const result=action==='forge-upgrade'?game.upgradeForge():game.craftForge(type,slot,rarity);
    forgeSelection.message=result.message;
    render();document.getElementById('academy-forge')?.showModal();return;
  }
  if (action?.startsWith('gear-')) {
    const item=game.saveData.equipment.items.find(entry=>entry.id===target.dataset.item);
    if(!item) return;
    const gearAction=action.slice(5);
    if(gearAction==='recycle') {
      if(item.locked||item.heroId) return;
      if(!window.confirm('Recycle '+item.name+'? You will receive '+recyclingReward(item)+' Enhancement Materials. This cannot be undone.')) return;
    }
    const dialogId=target.closest('dialog')?.id;
    const result=game.equipmentAction(gearAction,item.id,target.dataset.hero||null);
    ui.traineeNotice=result.message;
    render();
    if(dialogId) {
      const dialog=document.getElementById(dialogId);
      if(dialogId==='academy-inventory') document.getElementById('inventory-items').checked=true;
      dialog?.showModal();
      const message=dialog?.querySelector('.gear-message');
      if(message) message.textContent=result.message;
    }
    return;
  }
  if (action === 'level-up') {
    ui.selectedHeroId = target.dataset.hero;
    const result = game.levelUp(target.dataset.hero);
    ui.traineeNotice = result.message;
    if (!result.ok) game.addLog(result.message);
    game.save();
    render();
    gameAudio.play(actionCue(action, result));
  }
  if (action === 'claim-quest') {
    const hallOpen = Boolean(target.closest('#academy-hall[open]'));
    const result = game.claimQuest(target.dataset.quest);
    if (!result.ok) game.addLog(result.message);
    game.save();
    render();
    if (hallOpen) document.getElementById('academy-hall').showModal();
    gameAudio.play(actionCue(action, result));
  }
  if (action === 'claim-idle') {
    const hallOpen = Boolean(target.closest('#academy-hall[open]'));
    const result = game.claimIdleRewards();
    if (!result.ok) game.addLog(result.message);
    render();
    if (hallOpen) document.getElementById('academy-hall').showModal();
    gameAudio.play(actionCue(action, result));
  }
  if (action === 'close-summon-results') {
    ui.showSummonResults = false;
    render();
    return;
  }
  if (action === 'pull') {
    const result = game.pull(ui.activeBanner, Number(target.dataset.count));
    ui.showSummonResults = result.ok;
    if (!result.ok) {
      game.addLog(result.message);
      game.save();
    }
    render();
    gameAudio.play(actionCue(action, result));
  }
  if (action === 'archive-category') {
    ui.archiveCategory = target.dataset.category;
    ui.archiveEntryId = null;
    refreshArchive('.archive-tabs [aria-pressed="true"]', true);
    return;
  }
  if (action === 'archive-select') {
    ui.archiveEntryId = target.dataset.entry;
    refreshArchive('.archive-card[aria-pressed="true"]');
    return;
  }
  if (action === 'show-dialog') {
    document.getElementById(target.dataset.dialog)?.showModal();
    return;
  }
  if (action === 'dev-toggle') {
    ui.devPanelOpen = !ui.devPanelOpen;
    render();
  }
  if (action === 'dev-state') {
    applyDevState(target.dataset.devState);
  }
});

document.addEventListener('change',event=>{
  if(!['forge-type','forge-slot','forge-rarity'].includes(event.target?.id))return;
  const dialog=document.getElementById('academy-forge');if(!dialog?.open)return;
  Object.assign(forgeSelection,{type:dialog.querySelector('#forge-type')?.value,slot:dialog.querySelector('#forge-slot')?.value,rarity:dialog.querySelector('#forge-rarity')?.value,message:''});
  dialog.querySelector('#forge-content').innerHTML=forgePanel(game,forgeSelection);
});
render();
window.requestAnimationFrame(() => { void contentReady().catch((error) => console.warn('Content readiness could not be saved:', error)); });
