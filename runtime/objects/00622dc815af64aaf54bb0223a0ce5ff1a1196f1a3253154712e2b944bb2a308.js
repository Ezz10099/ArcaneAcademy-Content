import {
  CHAPTER_DEFINITIONS,
  CURRENCY,
  CURRENCY_LABEL,
  HERO_DEFINITIONS,
  LOCATION_DEFINITIONS,
  PRESENTATION_CONFIG,
  RARITY_COLORS,
  RARITY_ORDER,
  getHeroDefinition,
  getLocationById,
  getRegionPresentation,
  getStageById,
} from './src/game/data.js';
import { GameSession, computeHeroStats } from './src/game/game.js';
import { createPhaserBattleRenderer, resolveBattleFormation, resolveDeploymentFormation, DEPLOYMENT_SLOTS } from './src/battle/phaser-battle-renderer.js';
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
const game = new GameSession({ storage: persistentStorage });
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
    '--battle-background-zoom': battle.backgroundZoom,
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
  battleTimer: null,
  battleStarted: false,
  deployedFromFormation: false,
  battlePaused: false,
  battleRendererReady: false,
  battleMountToken: 0,
  battleSpeed: 1,
  autoUltimates: true,
  ultimateChargeHolds: new Set(),
  selectedHeroId: game.heroes[0]?.id || null,
  traineeNotice: '',
  devPanelOpen: previewToolsEnabled,
};

mountContentUpdates({
  canRestart: () => ui.view !== 'BATTLE',
  flush: () => persistentStorage.flush(),
  backup: () => persistentStorage.snapshot?.(),
});

mountGameSettings({
  audio: gameAudio, storage: persistentStorage, game,
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
  ['summonOpen', 'Summon'],
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

function formatRewards(rewards = {}) {
  const parts = [
    rewards.gold ? `${formatNumber(rewards.gold)} gold` : '',
    rewards.xp ? `${formatNumber(rewards.xp)} XP` : '',
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

const TRAINEE_CARD_ART = Object.freeze({
  hero_cinder_vale: 'final-assets/battle/characters/cinder-vale/cinder-vale-idle-right.png',
  hero_yssa_driftborn: 'final-assets/battle/characters/yssa-driftborn/yssa-driftborn-idle-right.webp',
  hero_lumen_solis: 'final-assets/battle/characters/lumen-solis/lumen-solis-idle-right.webp',
});

function traineeCardArt(hero) {
  return TRAINEE_CARD_ART[hero?.heroDefId] || '';
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
  hero.xp = Math.max(hero.xp || 0, 2000);
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
    clearThrough('deeper-woods', 7);
    ui.selectedLocationId = 'deeper-woods';
    game.setActiveLocation('deeper-woods');
    ui.selectedStageId = 'deeper-woods-8';
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
  ui.battlePaused = true;
  ui.battleRendererReady = false;
  ui.formationPickId = null;
  render();
  void battleRenderer.preloadEncounter(battle);
}

function startPreparedBattle() {
  if (!game.battle || game.battle.result || ui.battleStarted || !ui.battleRendererReady) return;
  ui.battleStarted = true;
  ui.battlePaused = false;
  root.querySelector('.battle-start-overlay')?.remove();
  restartBattleTimer();
  refreshBattleView();
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
  if (goNext && nextStageId && nextStageId !== stageId) {
    ui.selectedStageId = nextStageId;
    setView('FORMATION');
    return;
  }
  if (unlockedBasicSummon) {
    ui.activeBanner = 'BASIC';
    setView('SUMMON');
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
  const delay = ui.battleSpeed === 4 ? cadence.tick4Ms : ui.battleSpeed === 2 ? cadence.tick2Ms : cadence.tick1Ms;
  ui.battleTimer = window.setInterval(() => {
    if (ui.view !== 'BATTLE' || ui.battlePaused || !game.battle || game.battle.result) return;
    advanceBattle();
  }, delay);
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

  syncGameAudio();
  battleRenderer.sync(game.battle, {
    speed: ui.battleSpeed, started: ui.battleStarted,
    chargeHolds: ui.ultimateChargeHolds,
    onUltimatePresented: (heroId) => {
      if (ui.ultimateChargeHolds.delete(heroId) && ui.view === 'BATTLE') refreshBattleView();
    },
  });
  const battlePanel = root.querySelector('.phaser-battle-panel');
  battlePanel?.classList.toggle('battle-started', ui.battleStarted);
  battlePanel?.style.setProperty('--battle-approach-duration', `${Math.max(150, 520 / ui.battleSpeed)}ms`);
  const stage = game.getStageList().find((item) => item.id === game.battle.stageId);
  const status = root.querySelector('[data-battle-status]');
  if (status) {
    status.textContent = game.battle.result
      ? game.battle.result === 'player_win' ? 'Victory' : 'Defeat'
      : !ui.battleStarted
        ? ui.battleRendererReady ? 'Ready · Press Start' : 'Preparing battlefield…'
        : devMode ? `Turn ${game.battle.tick} · Auto battle` : 'Auto battle in progress';
  }
  const count = root.querySelector('[data-battle-count]');
  if (count) count.textContent = `${game.battle.player.length} VS ${game.battle.enemies.length}`;
  const heroDeck = root.querySelector('.hero-deck');
  if (heroDeck) heroDeck.innerHTML = game.battle.player.map(renderBattleHeroCard).join('');
  const resultSlot = root.querySelector('.battle-result-slot');
  if (resultSlot) resultSlot.innerHTML = renderBattleResult(game.battle, stage);

  const pauseButton = root.querySelector('[data-action="pause-battle"]');
  if (pauseButton) {
    pauseButton.textContent = ui.battlePaused ? 'PLAY' : 'PAUSE';
    pauseButton.classList.toggle('active', ui.battlePaused);
    pauseButton.disabled = !ui.battleStarted || Boolean(game.battle.result);
    pauseButton.setAttribute('aria-label', ui.battlePaused ? 'Resume battle' : 'Pause battle');
    pauseButton.setAttribute('aria-pressed', String(ui.battlePaused));
  }
  const speedButton = root.querySelector('[data-action="speed-battle"]');
  if (speedButton) {
    speedButton.textContent = `x${ui.battleSpeed}`;
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

function renderTopHud(extraClass = '') {
  return `
    <header class="top-hud ${esc(extraClass)}">
      <div class="ruler">
        <div class="avatar">AA</div>
        <div>
          <div class="ruler-title">Academy Master</div>
          <div class="ruler-power">Power ${formatNumber(game.getRosterPower())}</div>
        </div>
      </div>
      <div class="currencies">
        ${renderCurrency(CURRENCY.GOLD, 'gold')}
        ${renderCurrency(CURRENCY.CRYSTALS, 'crystal')}
        ${renderCurrency(CURRENCY.PREMIUM_CRYSTALS, 'seal')}
      </div>
      <button class="content-updates-button" data-action="content-updates" type="button">Updates</button>
      <button class="audio-settings-button" data-action="game-settings" type="button" aria-label="Game settings">⚙ Settings</button>
    </header>
  `;
}

function renderCurrency(currency, tone) {
  return `
    <div class="currency ${tone}">
      <span class="currency-mark"></span>
      <span class="currency-value">${formatNumber(game.currencies[currency])}</span>
      <span class="currency-label">${esc(CURRENCY_LABEL[currency])}</span>
    </div>
  `;
}

function renderBottomNav() {
  const tabs = [
    ['ACADEMY', 'Academy', 'academy', 'final-assets/navigation/bottom-tabs/academy-tab.png'],
    ['HEROES', 'Trainees', 'trainees', 'final-assets/navigation/bottom-tabs/trainees-tab.png'],
    ['CAMPAIGN', 'Expedition', 'expedition', 'final-assets/navigation/bottom-tabs/expedition-tab.png'],
    ['SUMMON', 'Summon', 'summon', 'final-assets/navigation/bottom-tabs/summon-tab.png'],
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
            <span>XP ${formatNumber(rewards.xp)}</span>
            <span>Crystals ${formatNumber(rewards.crystals)}</span>
          </div>
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
    { label: 'BASIC_SUMMON', open: game.isUnlocked('BASIC_SUMMON'), detail: game.isUnlocked('BASIC_SUMMON') ? 'Enrollment ritual opened' : 'Clear Forest Gate Stage 3' },
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
    ['final-assets/expedition/stage-info-panel/academy-exp-reward-icon.png', 'Academy EXP', rewards.xp],
    ['final-assets/upper-hud/blue-crystal.png', 'Blue Crystals', rewards.crystals],
    ['final-assets/expedition/stage-info-panel/lumen-reward-icon.png', 'Lumens', rewards.premiumCrystals],
  ].filter(([, , value]) => value);
  if (!rewardPreview?.firstClear) return '<div class="completed-stage-copy">Completed — No Replay</div>';
  return items.map(([asset, label, value]) => `
    <span class="location-reward-item">
      <img src="${asset}" alt="" aria-hidden="true">
      <b>${formatNumber(value)}</b><small>${esc(label)}</small>
    </span>
  `).join('');
}

function renderChapterMap(chapter, locations, summary) {
  return `
    ${renderTopHud('expedition-hud')}
    <main class="screen chapter-map-screen region-wild-forest">
      <section class="chapter-map-hero">
        <div class="kicker">${esc(chapter.subtitle)}</div>
        <h1>${esc(chapter.name)}</h1>
        <p>${esc(chapter.description)}</p>
        <div class="chapter-progress-line"><span style="--chapter-progress:${summary.percent}%"></span></div>
        <div class="chapter-progress-copy">${summary.percent}% region completion · ${summary.cleared}/${summary.total} stages cleared</div>
      </section>
      <section class="chapter-location-map" aria-label="${esc(chapter.name)} Locations">
        ${locations.map((item, index) => `
          <button class="chapter-location-node ${item.unlocked ? 'unlocked' : 'locked'} ${item.complete ? 'complete' : ''} ${item.optional ? 'optional' : ''}"
            data-location="${item.id}" type="button" ${item.unlocked ? '' : 'disabled'} style="--location-order:${index}">
            <span class="chapter-location-art"><img src="final-assets/expedition/location-nodes/${item.nodeAsset}" alt=""></span>
            <span class="chapter-location-copy">
              <b>${esc(item.name)}</b>
              <small>${item.unlocked ? `${item.percent}% complete` : esc(getLocationUnlockText(item))}</small>
              <em>Suggested Power ${formatNumber(item.suggestedPower)}</em>
            </span>
          </button>
        `).join('')}
      </section>
      <footer class="chapter-map-footer">
        <button class="control-button" data-action="return-active-location" type="button">Return to ${esc(game.getActiveLocation()?.name || 'Forest Gate')}</button>
        <span>${summary.chapterSelectUnlocked ? 'Next Region unlocked' : 'Defeat the Heart of the Curse to unlock the next Region'}</span>
      </footer>
    </main>
    ${renderBottomNav()}
  `;
}

function renderLocationRoute(location, stages, selectedStage, progress) {
  const visibleStages = getVisibleLocationStages(stages, selectedStage);
  return `
    <section class="location-route-shell" aria-label="${esc(location.name)} stage route">
      <div class="location-route-line" aria-hidden="true"></div>
      ${visibleStages.map((stage) => {
        const state = stage.current ? 'current' : stage.cleared ? 'cleared' : 'locked';
        const selected = stage.id === selectedStage?.id;
        const bossLabel = stage.encounterType === 'BOSS' ? (stage.stage === progress.total ? 'Boss' : 'Advanced Boss') : `Stage ${stage.stage}`;
        return `
          <button class="location-stage-node ${state} ${selected ? 'selected' : ''} ${stage.encounterType.toLowerCase()}"
            data-stage="${stage.id}" type="button" ${stage.current ? '' : 'disabled'}>
            <span class="location-stage-sigil">${stage.encounterType === 'BOSS' ? '♛' : stage.stage}</span>
            <span class="location-stage-copy"><b>${esc(bossLabel)}</b><small>${stage.cleared ? 'Cleared' : stage.current ? 'Current challenge' : 'Locked'}</small></span>
          </button>
        `;
      }).join('')}
    </section>
  `;
}

function renderStageDetails(location, selectedStage, progress) {
  const threat = game.getStageThreat(selectedStage?.id);
  const rewardPreview = selectedStage?.rewardPreview || game.getStageRewardPreview(selectedStage?.id);
  const canChallenge = Boolean(selectedStage?.battleable);
  const title = selectedStage?.encounterType === 'BOSS' ? selectedStage.name : `Stage ${selectedStage?.stage || 1}`;
  return `
    <section class="location-stage-panel">
      <div class="location-stage-panel-art">
        <img src="final-assets/expedition/location-nodes/${location.nodeAsset}" alt="${esc(location.name)}">
      </div>
      <div class="location-stage-panel-copy">
        <div class="stage-panel-eyebrow">${rewardPreview.firstClear ? 'First-Clear Challenge' : 'Completed Stage'}</div>
        <h2>${esc(title)}</h2>
        <p>${esc(location.description)}</p>
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
          <button class="battle-button challenge-button" data-action="battle-selected" type="button" ${canChallenge ? '' : 'disabled'}>Enter Battle</button>
        </div>
      </div>
    </section>
  `;
}

function renderAcademy() {
  const currentStage = game.getCurrentStage();
  const idle = game.getIdleRewardPreview();
  const quest = getPrimaryQuest();
  const idleReady = Boolean(idle.rewards.gold || idle.rewards.xp || idle.rewards.crystals);
  const facilities = [
    { title: 'Headmaster Hall', detail: 'Review academy status, lessons, and next growth targets.', actionLabel: 'Enter Headmaster Hall', action: 'enter-headmaster-hall', icon: '♛', position: 'hall' },
    { title: 'Training Grounds', detail: 'Prepare formations and improve trainee readiness.', actionLabel: 'Open Formation', action: 'FORMATION', icon: '⚔', position: 'training' },
    { title: 'Alchemy Lab', detail: 'Future material crafting and potion upgrades.', actionLabel: 'Coming Soon', action: null, icon: '⚗', position: 'alchemy' },
    { title: 'Dormitory', detail: 'Future trainee rest, bonds, and passive recovery.', actionLabel: 'Coming Soon', action: null, icon: '▰', position: 'dormitory' },
    { title: 'Library Tower', detail: 'Lore, records, and archive collection.', actionLabel: 'Open Archive', action: 'SYSTEMS', icon: '📖', position: 'library' },
    { title: 'Courtyard', detail: 'Daily lessons, events, and academy notices.', actionLabel: 'View Goals', action: 'SYSTEMS', icon: '✦', position: 'courtyard' },
  ];
  return `
    ${renderTopHud()}
    <main class="screen academy-screen">
      <section class="academy-hero-copy">
        <div class="kicker">Arcane Academy</div>
        <h1>Master's Campus</h1>
        <p>Grow the academy, train heroes from zero, and send trainees beyond the walls.</p>
      </section>

      <section class="academy-facility-map" aria-label="Academy facilities">
        ${facilities.map(({ title, detail, actionLabel, action, icon, position }) => {
          const actionAttrs = action
            ? action === 'enter-headmaster-hall'
              ? `data-action="${action}"`
              : `data-view="${action}"`
            : 'disabled';
          return `
            <button class="facility-marker marker-${position} ${action ? 'ready' : 'locked'}" ${actionAttrs} type="button" aria-label="${esc(`${title}: ${actionLabel}`)}">
              <span class="facility-icon">${esc(icon)}</span>
              <span class="facility-name">${esc(title)}</span>
              <span class="facility-detail">${esc(detail)}</span>
            </button>
          `;
        }).join('')}
      </section>

      <section class="academy-status-dock" aria-label="Academy status">
        <article class="quest-card academy-summary-card">
          <div class="quest-copy">
            <div class="kicker">Academy Status</div>
            <div class="quest-title">Next: ${esc(currentStage?.name || 'Forest Gate')}</div>
            <div class="quest-meta">Expedition depth ${formatNumber(game.getClearedStageCount())} / Formation power ${formatNumber(game.getRosterPower())}</div>
            <div class="quest-reward">${quest ? `Goal: ${esc(quest.title)}` : 'All current goals complete.'}</div>
          </div>
        </article>
        <article class="quest-card academy-rewards-card ${idleReady ? 'ready' : ''}">
          <div class="quest-copy">
            <div class="kicker">Passive Rewards</div>
            <div class="quest-title">${formatDuration(idle.elapsedMs)} stored${idle.capped ? ' / full' : ''}</div>
            <div class="quest-meta">Gold ${formatNumber(idle.rewards.gold)} / XP ${formatNumber(idle.rewards.xp)} / Crystals ${formatNumber(idle.rewards.crystals)}</div>
          </div>
          <button class="battle-button" data-action="claim-idle" type="button" ${idleReady ? '' : 'disabled'}>Claim</button>
        </article>
      </section>

      <section class="stage-detail selected-stage-panel academy-lesson-panel">
        <div class="selected-stage-copy">
          <div class="stage-panel-eyebrow">Lesson Progress</div>
          <div class="stage-title">Region One / The Wild Forest</div>
          <div class="stage-subtitle">Train your heroes. Break the darkness. Return with rewards for the academy.</div>
        </div>
        <div class="stage-actions">
          <button class="control-button" data-view="HEROES" type="button">Trainees</button>
          <button class="battle-button" data-view="CAMPAIGN" type="button">Open Expedition</button>
        </div>
      </section>
    </main>
    ${renderActivityLog()}
    ${renderBottomNav()}
  `;
}

function renderCampaign() {
  const chapter = CHAPTER_DEFINITIONS[0];
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

  return `
    ${renderTopHud('expedition-hud')}
    <main class="screen expedition-location-screen" style="--location-background:url('final-assets/expedition/location-backgrounds/${location.backgroundAsset}')">
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
      <section class="location-route-area">
        ${renderLocationRoute(location, stages, selectedStage, progress)}
        <aside class="location-system-status">
          <div><small>Farming</small><b>${progress.farmingUnlocked ? 'Available' : `Unlock at Stage ${location.farmingUnlockStage}`}</b><span>Minimum Assignment Power ${formatNumber(location.minimumAssignmentPower)}</span></div>
          <div><small>Special Stage</small><b>${progress.complete ? 'Unlocked' : 'Defeat the Location Boss'}</b><span>${progress.complete ? `Resets about every ${location.specialStage.resetHours}h` : 'Not part of the normal route'}</span></div>
        </aside>
      </section>
      ${renderStageDetails(location, selectedStage, progress)}
    </main>
    ${renderActivityLog()}
    ${renderBottomNav()}
  `;
}


function summarizeEnemyComposition(enemies = []) {
  const counts = new Map();
  for (const enemy of enemies) counts.set(enemy.name, (counts.get(enemy.name) || 0) + 1);
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

function renderBattle() {
  const battle = game.battle || game.beginBattle(ui.selectedStageId);
  if (!battle) {
    ui.view = 'CAMPAIGN';
    return renderCampaign();
  }
  const stage = game.getStageList().find((item) => item.id === battle.stageId);
  const threat = game.getStageThreat(stage?.id);
  const enemyComposition = summarizeEnemyComposition(battle.enemies);
  const isBossEncounter = stage?.encounterType === 'BOSS';
  const boss = battle.enemies.find((unit) => unit.isBoss);
  const presentation = getRegionPresentation(stage?.region || 1);
  const playerFormation = resolveBattleFormation(battle.player, 'player');
  const enemyFormation = resolveBattleFormation(battle.enemies, 'enemy');
  const battleStatus = battle.result
    ? battle.result === 'player_win' ? 'Victory' : 'Defeat'
    : !ui.battleStarted
      ? ui.battleRendererReady ? 'Ready · Press Start' : 'Preparing battlefield…'
      : devMode ? `Turn ${battle.tick} · Auto battle` : 'Auto battle in progress';
  return `
    ${renderTopHud()}
    <section class="stage-plate battle-stage-plate ${isBossEncounter ? 'boss-encounter' : ''}">
      <div class="stage-copy">
        <div class="stage-title">${isBossEncounter ? '<span class="battle-encounter-tag">Boss</span>' : ''}${esc(stage?.locationName || 'Wild Forest')} · Stage ${formatNumber(stage?.stage)}</div>
        <div class="stage-subtitle" data-battle-status>${esc(battleStatus)}</div>
      </div>
      <div class="battle-controls">
        <button class="control-button ${ui.battlePaused ? 'active' : ''}" data-action="pause-battle" type="button" aria-label="${ui.battlePaused ? 'Resume battle' : 'Pause battle'}" aria-pressed="${String(ui.battlePaused)}" ${!ui.battleStarted || battle.result ? 'disabled' : ''}>${ui.battlePaused ? 'PLAY' : 'PAUSE'}</button>
        <button class="control-button" data-action="speed-battle" type="button" aria-label="Battle speed ${ui.battleSpeed} times">x${ui.battleSpeed}</button>
        <button class="control-button ${ui.autoUltimates ? 'active' : ''}" data-action="auto-ult" type="button" aria-label="Automatic ultimates" aria-pressed="${String(ui.autoUltimates)}">AUTO</button>
        <button class="control-button" data-view="CAMPAIGN" type="button" aria-label="Exit battle">EXIT</button>
      </div>
    </section>

    <main class="battle-panel phaser-battle-panel battle-backdrop renderer-loading region-${presentation.className} ${battle.stageId?.startsWith('forest-gate-') ? 'battle-bg-forest-gate' : ''} ${isBossEncounter ? 'boss-encounter' : ''}">
      <div class="battle-field-label">
        <span>${isBossEncounter ? 'Boss Gate · ' : ''}${esc(presentation.battleBackdrop)}</span>
        <b data-battle-count>${battle.player.length} VS ${battle.enemies.length}</b>
      </div>
      <div id="phaser-battle-host" class="phaser-battle-host" aria-label="Arcane Academy real-time battle${boss ? ` against ${esc(boss.name)}` : ''}"></div>
      <div class="battle-dom-fallback" aria-label="Simplified battle fallback">
        <div class="battle-lane enemy-lane"></div>
        <div class="battle-lane player-lane"></div>
        <div class="sigil"></div>
        ${enemyFormation.map(renderUnit).join('')}
        ${playerFormation.map(renderUnit).join('')}
        <div class="versus">${battle.player.length} VS ${battle.enemies.length}</div>
        ${renderBattleFloat(battle.lastAction)}
      </div>
      <div class="battle-renderer-state" role="status">Preparing Phaser 4.2.1 battle renderer…</div>
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

    <nav class="hero-deck" aria-label="Trainee ultimate controls">
      ${battle.player.map(renderBattleHeroCard).join('')}
    </nav>
  `;
}
function renderUnit(placement) {
  const unit = placement.unit;
  const hitClass = game.battle?.lastHitId === unit.id ? ' hit' : '';
  const actingClass = game.battle?.lastActorId === unit.id ? ' acting' : '';
  const targetClass = game.battle?.lastTargetId === unit.id ? ' targeted' : '';
  const statuses = battleUnitStatusLabels(unit);
  const formationX = (placement.formationPosition.x / 480) * 100;
  const combatX = (placement.combatPosition.x / 480) * 100;
  const formationY = (placement.formationPosition.y / 700) * 100;
  const renderScale = placement.depthScale * (unit.isBoss ? 1.08 : 1);
  const actionScale = renderScale * 1.035;
  return `
    <div class="unit ${unit.side === 'enemy' ? 'enemy' : 'player'} ${visualClass(unit)}${hitClass}${actingClass}${targetClass} ${unit.isBoss ? 'boss-unit' : ''} ${unit.hp <= 0 ? 'defeated' : ''} ${placement.isMelee ? 'melee-unit' : 'backline-unit'} slot-${placement.slotKind}" style="--formation-x:${formationX.toFixed(3)}%;--combat-x:${combatX.toFixed(3)}%;--formation-y:${formationY.toFixed(3)}%;--unit-render-scale:${renderScale.toFixed(3)};--unit-action-scale:${actionScale.toFixed(3)};--unit-depth:${Math.round(placement.groundY)};left:var(--formation-x);top:var(--formation-y);z-index:var(--unit-depth);">
      <span class="unit-shadow"></span>
      <span class="unit-aura"></span>
      <span class="unit-body"></span>
      <span class="unit-weapon"></span>
      <span class="hp-track"><span class="hp-fill" style="--hp: ${pct(unit.hp, unit.maxHp)};"></span></span>
      <span class="barrier-track" aria-hidden="true"><span class="barrier-fill" style="--barrier: ${pct(unit.barrier || 0, unit.maxHp)};"></span></span>
      <span class="ultimate-track ${unit.ultimateCharge >= 100 ? 'ready' : ''}" aria-hidden="true"><span class="ultimate-fill" style="--charge: ${pct(unit.ultimateCharge || 0, 100)};"></span></span>
      <span class="unit-name">${esc(unit.name)}</span>
      ${statuses.length ? `<span class="unit-status">${esc(statuses.join(' · '))}</span>` : ''}
    </div>
  `;
}

function renderBattleFloat(event) {
  if (!event) return '';
  if (event.type === 'skill') return '';
  const isHeal = event.type === 'heal';
  const isAbility = event.type === 'ultimate' || event.type === 'skill';
  const isBarrier = event.type === 'barrier';
  const isStatus = event.type === 'status';
  const label = isAbility
    ? `${event.type === 'ultimate' ? 'ULT' : 'SKILL'} ${event.abilityName}`
    : isBarrier ? 'BUFF'
      : isStatus ? event.abilityName === 'Stun' ? 'STUN' : 'DEBUFF'
        : event.type === 'damage' && event.amount <= 0 ? `WARD ${event.absorbed || 0}` : `${isHeal ? '+' : '-'}${event.amount}`;
  return `<div class="battle-float ${isHeal ? 'heal' : ''} ${isBarrier ? 'barrier' : ''} ${isStatus ? 'status' : ''} ${isAbility ? event.type : 'damage'}">${esc(label)}</div>`;
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

function renderBattleHeroCard(hero) {
  const displayingCast = ui.ultimateChargeHolds.has(hero.id);
  const displayedCharge = displayingCast ? 100 : hero.ultimateCharge;
  const ready = hero.ultimateCharge >= 100;
  const defeated = hero.hp <= 0;
  const unavailable = defeated || !ui.battleStarted || Boolean(game.battle?.result);
  const hpPercent = Math.round(Math.max(0, Math.min(1, hero.hp / Math.max(1, hero.maxHp))) * 100);
  const chargePercent = Math.round(displayedCharge);
  const ultimateLabel = displayingCast ? `${hero.name} ultimate casting` : ready ? `Use ${hero.ultimateName || 'ultimate'} for ${hero.name}` : `${hero.name} ultimate ${chargePercent} percent charged`;
  return `
    <article class="hero-card ${hero.rarity.toLowerCase()} ${visualClass(hero)} ${ready || displayingCast ? 'ultimate-ready' : ''} ${hpPercent <= 25 && !defeated ? 'low-health' : ''} ${defeated ? 'defeated' : ''}" aria-label="${esc(hero.name)}, ${hpPercent} percent health, ${chargePercent} percent ultimate">
      <div class="card-identity">
        <div class="portrait" aria-hidden="true"><span class="portrait-monogram">${esc(sigilLetters(hero.name, 'AA'))}</span></div>
        <div class="card-name">${esc(hero.name)}</div>
      </div>
      <div class="card-vitals" role="img" aria-label="Health ${hpPercent} percent">
        <span class="card-vital-label">HP</span>
        <div class="card-hp"><span style="--hp: ${pct(hero.hp, hero.maxHp)};"></span></div>
      </div>
      <button class="ultimate-button ${ready && !unavailable ? 'ready' : ''}" style="--charge: ${displayedCharge}%;" data-ult="${hero.id}" type="button" aria-label="${esc(ultimateLabel)}" aria-disabled="${String(unavailable || displayingCast)}" ${unavailable || displayingCast ? 'disabled' : ''}>
        <span>ULT</span>
        <b>${displayingCast ? 'CASTING' : ready ? 'READY' : `${chargePercent}%`}</b>
      </button>
    </article>
  `;
}
function renderBattleResult(battle, stage) {
  const receipt = battle.rewardReceipt;
  const preview = receipt || game.getStageRewardPreview(stage?.id);
  const rewardText = formatRewards(preview.rewards);
  if (!battle.result) {
    if (!ui.battleStarted) return '';
    const latestEvent = battle.events[battle.events.length - 1];
    const liveMessage = battleEventMessage(latestEvent);
    if (!devMode) {
      return `<div class="battle-live-status" role="status" aria-live="polite">${esc(liveMessage)}</div>`;
    }
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
  const won = battle.result === 'player_win';
  if (won && battle.collected) {
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
    <aside class="battle-toast result-toast ${won ? 'won' : 'lost'}">
      <div>
        <div class="toast-title">${won ? 'Victory' : 'Defeated'}</div>
        <div class="toast-meta">${won ? `First-clear reward: ${esc(rewardText)}.` : 'Train trainees or retry this failed attempt.'}</div>
      </div>
      ${won ? '<div class="result-actions"><button class="control-button" data-action="collect" type="button">Claim</button><button class="battle-button" data-action="collect-next" type="button">Claim + Next</button></div>' : '<button class="battle-button" data-action="retry" type="button">Retry</button>'}
    </aside>
  `;
}

function formationPreview(stage) {
  return { deployment: true, stageId: stage.id, player: game.makePlayerCombatants(stage),
    enemies: game.makeEnemyCombatants(stage), events: [], tick: 0, result: null };
}

function renderFormation() {
  const counts = game.getFormationCounts();
  const stage = game.getStageList().find((item) => item.id === ui.formationStageId) || game.getCurrentStage();
  if (!stage) return renderCampaign();
  const preview = formationPreview(stage);
  const positions = resolveDeploymentFormation(preview.player, 'player');
  const threat = game.getStageThreat(stage.id);
  const activeIds = new Set(game.saveData.activeSquad.map((entry) => entry.heroId));
  const picked = game.getHero(ui.formationPickId);
  const occupied = new Map(positions.map((placement) => [
    `${placement.slotKind.toUpperCase()}-${placement.slotIndex}`, placement.unit,
  ]));
  const fieldClass = stage.id.startsWith('forest-gate-') ? 'battle-bg-forest-gate' : '';
  const presentation = getRegionPresentation(stage.region || 1);
  return `
    <main class="formation-deployment" aria-label="Deploy trainees for ${esc(stage.locationName)} stage ${stage.stage}">
      <header class="deployment-heading">
        <button class="deployment-back" data-view="CAMPAIGN" type="button" aria-label="Back to expedition">‹</button>
        <div><small>${esc(stage.locationName)}</small><strong>Stage ${stage.stage}</strong></div>
        <span>${counts.total}<small> / 5</small></span>
      </header>
        <div class="deployment-power"><span>Squad <b>${formatNumber(game.getRosterPower())}</b></span><i aria-hidden="true">VS</i><span>Enemy <b>${formatNumber(threat.enemyPower)}</b></span></div>
      <section class="deployment-field phaser-battle-panel battle-backdrop region-${presentation.className} ${fieldClass}" aria-label="Upcoming battlefield with ${preview.enemies.length} enemies">
        <div id="phaser-battle-host" class="phaser-battle-host" aria-hidden="true"></div>
        <div class="battle-dom-fallback" aria-hidden="true">
          ${resolveDeploymentFormation(preview.enemies, 'enemy').map(renderUnit).join('')}
          ${positions.map(renderUnit).join('')}
        </div>
        <div class="battle-renderer-state" role="status">Preparing battlefield…</div>
        <div class="deployment-plane">
          ${DEPLOYMENT_SLOTS.map(({ row, index, x, y }) => {
            const unit = occupied.get(`${row}-${index}`);
            const selected = unit && unit.id === ui.formationPickId;
            return `<button class="deployment-slot ${unit ? 'occupied' : 'empty'} ${picked ? 'placing' : ''} ${selected ? 'selected' : ''}"
              style="left:${x / 480 * 100}%;top:${(y + 35) / 700 * 100}%"
              data-action="place-formation" data-row="${row}" data-slot="${index}" data-hero="${unit ? esc(unit.id) : ''}" type="button"
              aria-pressed="${Boolean(selected)}" aria-label="${row === 'FRONT' ? 'Forward' : 'Rear'} position ${index + 1}${unit ? `, ${esc(unit.name)}` : ', empty'}">
              <span class="deployment-seal" aria-hidden="true"></span>
            </button>`;
          }).join('')}
        </div>
      </section>
      <section class="deployment-tray">
        <div class="deployment-roster" aria-label="Trainees">
          ${game.heroes.map((hero) => `<button class="deployment-trainee ${activeIds.has(hero.id) ? 'assigned' : ''} ${ui.formationPickId === hero.id ? 'picked' : ''} ${visualClass(hero)}" data-action="pick-formation" data-hero="${esc(hero.id)}" type="button" aria-pressed="${ui.formationPickId === hero.id}" aria-label="${esc(hero.name)}, ${activeIds.has(hero.id) ? 'placed' : 'available'}">
            <span class="deployment-avatar" data-trainee="${esc(hero.heroDefId)}" aria-hidden="true">${esc(sigilLetters(hero.name))}</span><b>${esc(hero.name.split(' ')[0])}</b><small>Lv ${hero.level}</small>
          </button>`).join('')}
        </div>
        <button class="deployment-go" data-action="start-formation-battle" type="button" ${counts.total && game.canBattleStage(stage.id) ? '' : 'disabled'}>START BATTLE</button>
      </section>
    </main>
  `;
}

// Selection is DOM-only: do not destroy/reload the battlefield on every tap.
function refreshFormation(changed = false) {
  const stage = getStageById(ui.formationStageId);
  if (changed && (!stage || !battleRenderer.updateDeployment(formationPreview(stage)))) {
    const scroll = root.querySelector('.deployment-roster')?.scrollLeft || 0;
    render();
    root.querySelector('.deployment-roster')?.scrollTo(scroll, 0);
    return;
  }
  const scroll = root.querySelector('.deployment-roster')?.scrollLeft || 0;
  const template = document.createElement('template');
  template.innerHTML = renderFormation();
  for (const selector of ['.deployment-heading', '.deployment-power', '.deployment-plane', '.deployment-tray', '.battle-dom-fallback']) {
    root.querySelector(selector)?.replaceWith(template.content.querySelector(selector));
  }
  root.querySelector('.deployment-roster')?.scrollTo(scroll, 0);
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

function renderHeroes() {
  const activeIds = new Set(game.saveData.activeSquad.map((entry) => entry.heroId));
  const selectedHero = game.getHero(ui.selectedHeroId)
    || game.heroes.find((hero) => activeIds.has(hero.id))
    || game.heroes[0];
  ui.selectedHeroId = selectedHero?.id || null;
  const launchHeroIds = new Set(HERO_DEFINITIONS.map((definition) => definition.id));
  const ownedLaunchCount = game.heroes.filter((hero) => launchHeroIds.has(hero.heroDefId)).length;
  const launchRegistry = HERO_DEFINITIONS.map((definition, index) => {
    const hero = game.heroes.find((candidate) => candidate.heroDefId === definition.id);
    return hero
      ? renderRosterGridHero(hero, activeIds.has(hero.id), hero.id === selectedHero?.id)
      : renderLockedRosterSlot(index);
  });
  const legacyRegistry = game.heroes
    .filter((hero) => !launchHeroIds.has(hero.heroDefId))
    .map((hero) => renderRosterGridHero(hero, activeIds.has(hero.id), hero.id === selectedHero?.id));
  const selectedStats = selectedHero ? computeHeroStats(selectedHero) : null;
  const selectedXpNeed = selectedHero ? game.xpThreshold(selectedHero) : 0;
  const selectedGoldCost = selectedHero ? game.levelCost(selectedHero) : 0;
  const hasTrainingXp = Boolean(selectedHero && selectedHero.xp >= selectedXpNeed);
  const hasTrainingGold = Boolean(selectedHero && game.currencies[CURRENCY.GOLD] >= selectedGoldCost);
  const canTrain = hasTrainingXp && hasTrainingGold;
  const trainingStatus = !selectedHero
    ? ''
    : canTrain
      ? `Ready · ${formatNumber(selectedGoldCost)} Gold`
      : !hasTrainingXp
        ? `${formatNumber(selectedHero.xp)} / ${formatNumber(selectedXpNeed)} XP`
        : `Need ${formatNumber(selectedGoldCost)} Gold`;
  return `
    ${renderTopHud()}
    <main class="screen roster-screen trainer-screen">
      <section class="trainer-title">
        <div class="kicker">Trainees</div>
        <h1>Trainees</h1>
        <p>Nurture potential. Forge legends.</p>
      </section>
      ${selectedHero ? `
        <section class="selected-trainee ${visualClass(selectedHero)}">
          <div class="selected-trainee-figure">
            <div class="selected-trainee-aura"></div>
            <div class="selected-trainee-portrait ${traineeCardArt(selectedHero) ? 'has-art' : ''}" role="img" aria-label="${esc(selectedHero.name)} academy registry portrait">
              ${traineeCardArt(selectedHero) ? `<img class="selected-trainee-art" src="${traineeCardArt(selectedHero)}" alt="" aria-hidden="true">` : ''}
            </div>
            <div class="selected-trainee-caption">
              <strong>Academy Registry</strong>
              <span>${esc(formatTerm(selectedHero.heroClass))} trainee</span>
            </div>
          </div>
          <article class="selected-trainee-panel">
            <div class="selected-trainee-identity">
              <div>
                <div class="selected-trainee-name">${esc(selectedHero.name)}</div>
                <div class="selected-trainee-stars" aria-label="${Math.min(5, (RARITY_ORDER[selectedHero.rarity] || 0) + 1)} rarity stars">${'★'.repeat(Math.min(5, (RARITY_ORDER[selectedHero.rarity] || 0) + 1))}</div>
              </div>
              <div class="selected-trainee-rarity">${esc(selectedHero.rarity)}</div>
            </div>
            <div class="selected-trainee-level-row">
              <strong>Lv. ${selectedHero.level}</strong>
              <span>${formatNumber(selectedHero.xp)} / ${formatNumber(selectedXpNeed)} XP</span>
            </div>
            <div class="selected-trainee-xp" aria-label="Training experience ${pct(selectedHero.xp, selectedXpNeed)}"><span style="--trainee-xp:${pct(selectedHero.xp, selectedXpNeed)};"></span></div>
            <div class="selected-trainee-upgrade-row">
              <div class="selected-trainee-role">
                <span>${esc(formatTerm(selectedHero.heroClass))}</span>
                <span>${esc(formatTerm(selectedHero.affinity))}</span>
              </div>
              <button class="trainee-upgrade-button battle-button" data-action="level-up" data-hero="${selectedHero.id}" type="button" ${canTrain ? '' : 'disabled'}>Upgrade</button>
            </div>
            <div class="selected-trainee-power"><small>Power</small>${formatNumber(Math.floor(selectedStats.hp * 0.45 + selectedStats.defense * 2.1 + selectedStats.damage * 4.5))}</div>
            <div class="selected-trainee-stats" aria-label="Core statistics">
              <span><small>HP</small><b>${formatNumber(selectedStats.hp)}</b></span>
              <span><small>DEF</small><b>${formatNumber(selectedStats.defense)}</b></span>
              <span><small>DMG</small><b>${formatNumber(selectedStats.damage)}</b></span>
            </div>
            <div class="selected-trainee-skills">
              <span><small>Basic</small><b>${esc(selectedHero.basicAbility?.id || selectedHero.normalAbilityIds?.[0] || 'Basic Attack')}</b></span>
              <span><small>Skill</small><b>${esc(selectedHero.skillAbility?.id || selectedHero.normalAbilityIds?.[1] || 'Skill')}</b></span>
              <span><small>Ultimate</small><b>${esc(selectedHero.ultimateAbility?.id || selectedHero.ultimateAbilityId || 'Ultimate')}</b></span>
            </div>
            <div class="selected-trainee-actions">
              <button class="control-button" data-view="FORMATION" type="button">Formation</button>
            </div>
            <div class="trainee-action-status" role="status">${esc(ui.traineeNotice || trainingStatus)}</div>
          </article>
        </section>
      ` : '<div class="empty-state">No trainees enrolled yet.</div>'}
      <section class="trainee-roster-panel">
        <div class="trainee-roster-head">
          <span>Enrolled Trainees</span>
          <strong>${ownedLaunchCount} / ${HERO_DEFINITIONS.length}</strong>
        </div>
        <div class="trainee-card-grid">
          ${[...launchRegistry, ...legacyRegistry].join('')}
        </div>
      </section>
    </main>
    ${renderActivityLog()}
    ${renderBottomNav()}
  `;
}

function renderRosterGridHero(hero, active, selected) {
  const xpNeed = game.xpThreshold(hero);
  const ready = hero.xp >= xpNeed && game.currencies[CURRENCY.GOLD] >= game.levelCost(hero);
  return `
    <button class="trainee-grid-card ${active ? 'active' : ''} ${selected ? 'selected' : ''} ${ready ? 'training-ready' : ''} ${visualClass(hero)}" data-action="select-trainee" data-hero="${hero.id}" type="button" aria-pressed="${String(selected)}">
      <span class="trainee-grid-portrait ${traineeCardArt(hero) ? 'has-art' : ''}" aria-hidden="true">${traineeCardArt(hero) ? `<img src="${traineeCardArt(hero)}" alt="">` : ''}</span>
      <span class="trainee-grid-copy">
        <strong class="trainee-grid-name">${esc(hero.name)}</strong>
        <span class="trainee-grid-meta">Lv. ${hero.level} · ${esc(formatTerm(hero.heroClass))}</span>
        <span class="trainee-grid-stars">${'★'.repeat(Math.min(5, (RARITY_ORDER[hero.rarity] || 0) + 1))}</span>
      </span>
      <span class="trainee-grid-state">${active ? 'Formation' : esc(formatTerm(hero.affinity))}</span>
      ${ready ? '<span class="trainee-ready-dot" aria-label="Training available"></span>' : ''}
    </button>
  `;
}

function renderLockedRosterSlot(index) {
  return `
    <div class="trainee-grid-card trainee-grid-locked" aria-label="Undiscovered trainee slot ${index + 1}">
      <span class="trainee-grid-portrait" aria-hidden="true"></span>
      <span class="trainee-grid-copy">
        <strong class="trainee-grid-name">Undiscovered</strong>
        <span class="trainee-grid-meta">Registry sealed</span>
        <span class="trainee-grid-stars">···</span>
      </span>
      <span class="trainee-grid-state">Summon</span>
    </div>
  `;
}

function renderRosterHero(hero, active) {
  const stats = computeHeroStats(hero);
  const xpNeed = game.xpThreshold(hero);
  const goldCost = game.levelCost(hero);
  return `
    <article class="roster-card ${active ? 'active' : ''} ${visualClass(hero)}">
      <div class="portrait roster-portrait"></div>
      <div class="roster-copy">
        <div class="roster-title" style="color:${rarityColor(hero.rarity)}">${esc(hero.name)}</div>
        <div class="roster-meta">Lv ${hero.level} ${hero.rarity} ${formatTerm(hero.heroClass)} / ${formatTerm(hero.affinity)}</div>
        <div class="roster-stats">HP ${stats.hp} / DEF ${stats.defense} / DMG ${stats.damage}</div>
        <div class="roster-stats">XP ${formatNumber(hero.xp)} / ${formatNumber(xpNeed)} / Level cost ${formatNumber(goldCost)} gold</div>
      </div>
      <div class="roster-actions">
        <button class="control-button ${active ? 'active' : ''}" data-action="toggle-squad" data-hero="${hero.id}" type="button">${active ? 'FORMATION' : 'ADD'}</button>
        ${active ? '<button class="control-button" data-view="FORMATION" type="button">Formation</button>' : ''}
        <button class="control-button" data-action="level-up" data-hero="${hero.id}" type="button">LVL</button>
      </div>
    </article>
  `;
}

function renderSummon() {
  const banner = game.getBannerConfig(ui.activeBanner);
  const locked = !game.canUseBanner(ui.activeBanner);
  const lastResults = game.saveData.summon.lastResults || [];
  const featuredHeroes = HERO_DEFINITIONS
    .filter((hero) => ui.activeBanner === 'ADVANCED' ? ['EPIC', 'LEGENDARY'].includes(hero.rarity) : ['RARE', 'EPIC', 'LEGENDARY'].includes(hero.rarity))
    .slice(ui.activeBanner === 'ADVANCED' ? -4 : 2, ui.activeBanner === 'ADVANCED' ? undefined : 6);
  const pityCount = game.saveData.summon.pityCounters[ui.activeBanner] || 0;
  return `
    ${renderTopHud()}
    <main class="screen summon-screen ${lastResults.length ? 'has-results' : ''}">
      <section class="summon-title">
        <div class="kicker">Arcane Summon</div>
        <h1>Arcane Summon</h1>
        <p>Enroll exceptional trainees. Shape the future.</p>
      </section>
      <section class="banner-tabs">
        <button class="region-tab ${ui.activeBanner === 'BASIC' ? 'active' : ''}" data-banner="BASIC" type="button">Basic Rite</button>
        <button class="region-tab ${ui.activeBanner === 'ADVANCED' ? 'active' : ''}" data-banner="ADVANCED" type="button">Advanced Rite</button>
      </section>
      <section class="summon-portal ${locked ? 'locked' : ''}">
        <div class="summon-featured-cards">
          ${featuredHeroes.map(renderFeaturedSummonCard).join('')}
        </div>
        <div class="portal-ring"></div>
        <div class="portal-copy">${locked ? 'LOCKED' : `${ui.activeBanner} RITE`}</div>
        <div class="summon-event-strip">
          <span>Featured Trainees</span>
          <strong>${locked ? (ui.activeBanner === 'BASIC' ? 'Clear Forest Gate Stage 3 to unlock' : 'Advanced Rite is not yet unlocked') : `${banner.pityRarity} pity ${pityCount}/${banner.pityMax}`}</strong>
        </div>
      </section>
      <section class="summon-info-row" aria-label="Summon information">
        <article>
          <span>Guarantee</span>
          <strong>Summon 10 times</strong>
          <small>${ui.activeBanner === 'ADVANCED' ? 'Last pull is Rare or higher.' : 'Build pity toward Epic trainees.'}</small>
        </article>
        <article>
          <span>Rates</span>
          <strong>${ui.activeBanner === 'ADVANCED' ? 'Legendary 15%' : 'Epic 3%'}</strong>
          <small>${ui.activeBanner === 'ADVANCED' ? 'Epic 35% / Rare 50%' : 'Rare 14% / Uncommon 28%'}</small>
        </article>
        <article>
          <span>Milestone</span>
          <strong>${pityCount}/${banner.pityMax}</strong>
          <small>${banner.pityRarity} focus track</small>
        </article>
      </section>
      <div class="summon-currency">${esc(CURRENCY_LABEL[banner.currency] || banner.currency)} ${formatNumber(game.saveData.currencies[banner.currency] || 0)}</div>
      <section class="summon-actions">
        <button class="battle-button" data-action="pull" data-count="1" type="button" ${locked ? 'disabled' : ''}>Summon x1 / ${banner.cost1}</button>
        <button class="battle-button" data-action="pull" data-count="10" type="button" ${locked ? 'disabled' : ''}>Summon x10 / ${banner.cost10}</button>
      </section>
      <section class="summon-results ${lastResults.length ? 'has-results' : ''}">
        ${lastResults.length ? lastResults.map(renderSummonResult).join('') : '<div class="empty-state">Arcane Summon results appear here.</div>'}
      </section>
    </main>
    ${renderActivityLog()}
    ${renderBottomNav()}
  `;
}

function renderFeaturedSummonCard(hero) {
  return `
    <article class="featured-summon-card ${hero.rarity.toLowerCase()} ${visualClass(hero)}">
      <div class="featured-portrait"></div>
      <div class="featured-name">${esc(hero.name)}</div>
      <div class="featured-stars">${'★'.repeat(Math.min(5, (RARITY_ORDER[hero.rarity] || 0) + 1))}</div>
    </article>
  `;
}

function renderSummonResult(result) {
  return `
    <article class="pull-card">
      <div class="pull-rarity" style="color:${rarityColor(result.rarity)}">${esc(result.rarity)}</div>
      <div class="pull-name">${esc(result.name)}</div>
      <div class="pull-meta">${result.isNew ? 'NEW' : `${result.shards} shards`}</div>
    </article>
  `;
}

function renderSystems() {
  const quests = game.getQuestList();
  const archiveEntries = [
    { name: 'Luminowl', type: 'Celestial · Spirit', progress: 85, tone: 'ice', detail: 'Messengers of the night sky, Luminowl are said to carry starlight in their feathers.' },
    { name: 'Grove Stag', type: 'Forest · Guardian', progress: 65, tone: 'earth', detail: 'A gentle guardian that marks safe paths through the Wild Forest.' },
    { name: 'Umbral Wraith', type: 'Shadow · Curse', progress: 40, tone: 'shadow', detail: 'A drifting echo of failed expeditions and sealed academy warnings.' },
    { name: 'Crystalback', type: 'Earth · Beast', progress: 50, tone: 'ice', detail: 'Its spine grows with arcane crystal after long exposure to leyline roots.' },
    { name: 'Mist Lynx', type: 'Forest · Spirit', progress: 70, tone: 'earth', detail: 'A watchful familiar that appears before hidden library notes are found.' },
    { name: 'Aether Drake', type: 'Arcane · Drake', progress: 25, tone: 'shadow', detail: 'Rarely seen above academy ruins, it feeds on unstable portal residue.' },
  ];
  const selectedEntry = archiveEntries[0];
  const completedQuests = quests.filter((quest) => quest.claimed || quest.complete).length;
  return `
    ${renderTopHud()}
    <main class="screen systems-screen archive-screen">
      <section class="archive-title">
        <div class="kicker">Archive</div>
        <h1>Archive</h1>
        <p>The knowledge of Arcane Academy and the world beyond. Collect, study, and uncover forgotten truths.</p>
      </section>
      <section class="archive-tabs" aria-label="Archive tabs">
        ${['Creatures', 'Regions', 'Relics', 'Spells', 'Records'].map((tab, index) => `<button class="region-tab ${index === 0 ? 'active' : ''}" type="button">${tab}</button>`).join('')}
      </section>
      <section class="archive-content" aria-label="Archive collection">
        <div class="archive-grid">
          <div class="archive-grid-head">
            <span>Discovered Creatures</span>
            <strong>${archiveEntries.filter((entry) => entry.progress > 0).length}/32</strong>
          </div>
          ${archiveEntries.map((entry, index) => renderArchiveEntry(entry, index === 0)).join('')}
        </div>
        <article class="archive-detail">
          <div class="archive-detail-art affinity-${selectedEntry.tone}"></div>
          <div class="archive-detail-copy">
            <h2>${esc(selectedEntry.name)}</h2>
            <p class="archive-type">${esc(selectedEntry.type)}</p>
            <p>${esc(selectedEntry.detail)}</p>
            <div class="archive-progress-ring">${selectedEntry.progress}%</div>
            <ul>
              <li>Lore Entries 4/5</li>
              <li>Visuals 3/3</li>
              <li>Research Notes 2/2</li>
              <li>Habitat Data 1/2</li>
            </ul>
            <div class="archive-rewards">
              <span>Gold 10K</span>
              <span>XP 5,000</span>
              <span>Crystals 50</span>
            </div>
            <button class="battle-button" type="button">View Lore</button>
          </div>
        </article>
      </section>
      <section class="archive-ledger">
        <article>
          <span>Academy Goals</span>
          <strong>${completedQuests}/${quests.length}</strong>
          <small>Quest records reviewed</small>
        </article>
        <article>
          <span>Expedition Records</span>
          <strong>${game.getCampaignSummary(game.getCurrentStage()?.region || 1).cleared}</strong>
          <small>Wild Forest discoveries</small>
        </article>
        <button class="danger-button" data-action="reset-save" type="button">Reset Save</button>
      </section>
    </main>
    ${renderActivityLog()}
    ${renderBottomNav()}
  `;
}

function renderArchiveEntry(entry, selected = false) {
  return `
    <article class="archive-entry ${selected ? 'selected' : ''} affinity-${entry.tone}">
      <div class="archive-entry-art"></div>
      <strong>${esc(entry.name)}</strong>
      <span>${entry.progress}%</span>
      <div class="archive-entry-bar"><i style="--entry-progress:${entry.progress}%;"></i></div>
    </article>
  `;
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
    CAMPAIGN: renderCampaign,
    FORMATION: renderFormation,
    BATTLE: renderBattle,
    HEROES: renderHeroes,
    SUMMON: renderSummon,
    SYSTEMS: renderSystems,
  };

  battleRenderer.destroy();
  root.classList.toggle('battle-view', ui.view === 'BATTLE' || ui.view === 'FORMATION');
  root.classList.toggle('formation-view', ui.view === 'FORMATION');
  root.innerHTML = `${(views[ui.view] || renderAcademy)()}${renderDevTools()}`;
  syncGameAudio();
  if (ui.view === 'BATTLE' && game.battle) {
    const stage = game.getStageList().find((item) => item.id === game.battle.stageId);
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
        if (ui.deployedFromFormation) startPreparedBattle();
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

root.addEventListener('pointerdown', (event) => {
  if (ui.view !== 'FORMATION' || event.button > 0) return;
  const source = event.target.closest('.deployment-trainee, .deployment-slot.occupied');
  const heroId = source?.dataset.hero;
  if (!source || !heroId) return;
  formationPointerDrag = {
    pointerId: event.pointerId,
    heroId,
    source,
    fromRoster: source.classList.contains('deployment-trainee'),
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
    if (state.fromRoster && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) return;
    const distance = Math.hypot(dx, dy);
    const wantsRosterDrag = state.fromRoster && dy < -10 && Math.abs(dy) > Math.abs(dx) * 0.7;
    if (distance < 9 || (state.fromRoster && !wantsRosterDrag)) return;
    const hero = game.getHero(state.heroId);
    if (!hero) return clearFormationPointerDrag();
    state.dragging = true;
    state.source.classList.add('drag-source');
    root.classList.add('formation-dragging');
    const ghost = document.createElement('div');
    ghost.className = 'deployment-drag-ghost';
    ghost.dataset.trainee = hero.heroDefId || '';
    ghost.textContent = hero.name.split(' ')[0];
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
    clearFormationPointerDrag();
    return;
  }
  event.preventDefault();
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

root.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  if (suppressFormationClick && target.matches('.deployment-trainee, .deployment-slot')) { suppressFormationClick = false; return; }
  void gameAudio.unlock();
  const hasActionCue = ['pull', 'level-up', 'claim-quest', 'claim-idle', 'toggle-squad', 'set-row', 'collect', 'collect-next'].includes(target.dataset.action);
  if (!target.dataset.ult && !hasActionCue) gameAudio.play('ui');

  if (target.dataset.view) {
    setView(target.dataset.view);
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
    if (!stage?.current) return;
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
  if (action === 'open-chapter-map') {
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
  if (action === 'enter-headmaster-hall') {
    game.addLog('Headmaster Hall review opened. Full hall screen is a future academy system.');
    game.save();
    render();
  }
  if (action === 'battle-selected') setView('FORMATION');
  if (action === 'start-formation-battle') prepareBattle(ui.formationStageId);
  if (action === 'pick-formation') {
    const heroId = target.dataset.hero;
    const deployed = game.saveData.activeSquad.some((entry) => entry.heroId === heroId);
    if (deployed) {
      game.removeHeroFromFormation(heroId);
      if (ui.formationPickId === heroId) ui.formationPickId = null;
      refreshFormation(true);
    } else {
      ui.formationPickId = ui.formationPickId === heroId ? null : heroId;
      refreshFormation();
    }
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
  if (action === 'battle-step') {
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
  if (action === 'select-trainee') {
    ui.selectedHeroId = target.dataset.hero;
    ui.traineeNotice = '';
    render();
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
    const result = game.claimQuest(target.dataset.quest);
    if (!result.ok) game.addLog(result.message);
    game.save();
    render();
    gameAudio.play(actionCue(action, result));
  }
  if (action === 'claim-idle') {
    const result = game.claimIdleRewards();
    if (!result.ok) game.addLog(result.message);
    render();
    gameAudio.play(actionCue(action, result));
  }
  if (action === 'pull') {
    const result = game.pull(ui.activeBanner, Number(target.dataset.count));
    if (!result.ok) {
      game.addLog(result.message);
      game.save();
    }
    render();
    gameAudio.play(actionCue(action, result));
  }
  if (action === 'reset-save') {
    game.reset();
    ui.view = 'ACADEMY';
    ui.expeditionMode = 'LOCATION';
    ui.selectedLocationId = game.getActiveLocation()?.id || 'forest-gate';
    ui.selectedStageId = game.getCurrentStage(ui.selectedLocationId)?.id;
    render();
  }
  if (action === 'dev-toggle') {
    ui.devPanelOpen = !ui.devPanelOpen;
    render();
  }
  if (action === 'dev-state') {
    applyDevState(target.dataset.devState);
  }
});

render();
window.requestAnimationFrame(() => { void contentReady().catch((error) => console.warn('Content readiness could not be saved:', error)); });
