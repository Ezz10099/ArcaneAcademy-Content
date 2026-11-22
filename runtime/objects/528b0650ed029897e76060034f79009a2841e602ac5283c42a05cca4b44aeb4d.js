const forestGateRoot = document.getElementById('game-root');
const FOREST_GATE_BACKGROUND_ASSET = 'final-assets/expedition/location-backgrounds/forest-gate-route.webp';

function mountCanvasForestBackground(screen) {
  const source = new Image();
  source.decoding = 'async';
  source.fetchPriority = 'high';

  const paintAndMount = () => {
    if (!screen.isConnected || !source.naturalWidth || screen.querySelector('.forest-map-background')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'forest-map-background';
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    screen.prepend(canvas);
    screen.classList.add('background-ready');
  };

  source.src = FOREST_GATE_BACKGROUND_ASSET;

  if (typeof source.decode === 'function') {
    source.decode().then(paintAndMount).catch(() => {
      if (source.complete && source.naturalWidth) paintAndMount();
      else source.addEventListener('load', paintAndMount, { once: true });
    });
  } else if (source.complete && source.naturalWidth) {
    paintAndMount();
  } else {
    source.addEventListener('load', paintAndMount, { once: true });
  }
}

const FOREST_GATE_STAGE_POSITIONS = Object.freeze({
  // Portal feet on the road and the Stage 10 label at the gate threshold.
  1: [24, 83.8],
  2: [39.3, 74.5],
  3: [55.6, 69.6],
  4: [78.4, 62.4],
  5: [61.6, 57],
  6: [40, 54.7],
  7: [16.3, 51.2],
  8: [32.1, 44.5],
  9: [51.7, 40.4],
  10: [75.6, 30.6],
});


const FOREST_GATE_FIREFLIES = Object.freeze([
  [21, 28, -1.4, 7.2, 11],
  [77, 31, -4.8, 8.4, -9],
  [33, 43, -2.2, 6.8, 8],
  [69, 49, -6.1, 9.1, 13],
  [17, 61, -3.6, 7.7, -10],
  [83, 66, -0.7, 8.8, 7],
  [42, 73, -5.3, 7.1, 12],
  [62, 82, -2.9, 9.4, -8],
]);

function buildAmbientEffects() {
  const fireflies = FOREST_GATE_FIREFLIES.map(([x, y, delay, duration, driftX]) => `
    <i class="forest-map-firefly" style="--spark-x:${x}%;--spark-y:${y}%;--spark-delay:${delay}s;--spark-duration:${duration}s;--spark-drift-x:${driftX}px"></i>
  `).join('');
  return `
    <div class="forest-map-effects" aria-hidden="true">
      <i class="forest-map-mist mist-high"></i>
      <i class="forest-map-mist mist-low"></i>
      ${fireflies}
    </div>
  `;
}

function stageNumberFromElement(element) {
  const match = element?.dataset.stage?.match(/forest-gate-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function buildStageNode(stageNumber, currentStage, clearedStages, developerMode) {
  const state = clearedStages.has(stageNumber)
    ? 'cleared'
    : stageNumber === currentStage
      ? 'current'
      : developerMode ? 'available' : 'locked';
  const [x, y] = FOREST_GATE_STAGE_POSITIONS[stageNumber];
  const playable = state === 'current' || developerMode;
  const stateText = state === 'current' ? 'Current stage' : state === 'cleared' ? (developerMode ? 'Cleared stage. Replay available' : 'Cleared stage. Replay unavailable') : developerMode ? 'Available stage' : 'Locked stage';

  const assetState = state === 'locked' ? 'locked' : 'available';
  const gate = stageNumber === 10;
  const clearedMark = state === 'cleared'
    ? '<img class="forest-map-cleared-mark" src="final-assets/expedition/stage-nodes/stage-node-cleared-mark.png" alt="">'
    : '';

  return `
    <button class="forest-map-stage ${state} ${playable ? 'playable' : ''}${gate ? ' gate-landmark' : ''}"
      type="button"
      ${playable ? `data-map-stage="forest-gate-${stageNumber}"` : state === 'locked' ? `data-map-locked="${stageNumber}"` : 'disabled'}
      style="--stage-x:${x}%;--stage-y:${y}%;"
      aria-label="Stage 1-${stageNumber}.${gate ? ' Forest Gate boss.' : ''} ${stateText}."${state === 'current' ? ' aria-current="step"' : ''}>
      ${gate ? clearedMark : `<span class="forest-map-node-art">
        <img class="forest-map-node-image" src="final-assets/expedition/stage-nodes/stage-node-normal-${assetState}.png" alt="">
        ${clearedMark}
      </span>`}
      <span class="forest-map-stage-number">1-${stageNumber}</span>
    </button>
  `;
}

function enhanceForestGate() {
  const screen = forestGateRoot?.querySelector('.expedition-location-screen:not([data-forest-map-enhanced])');
  if (!screen) return;

  const locationTitle = screen.querySelector('.location-header h1')?.textContent?.trim();
  if (locationTitle !== 'Forest Gate') return;

  const currentElement = screen.querySelector('.location-stage-node.current');
  const currentStage = stageNumberFromElement(currentElement);
  const completedLocation = screen.querySelector('.location-completion')?.textContent.trim() === '100%';
  const developerMode = screen.dataset.developerMode === 'true';
  const clearedStages = new Set((screen.dataset.clearedStages || '').split(',').filter(Boolean).map(Number));
  const visibleStages = Array.from({ length: 10 }, (_, index) => index + 1);

  screen.dataset.forestMapEnhanced = 'true';
  screen.classList.add('forest-gate-map-screen');
  screen.style.setProperty('--forest-map-art', `url("${FOREST_GATE_BACKGROUND_ASSET}")`);
  const mapButton = screen.querySelector('[data-action="open-chapter-map"]');
  if (mapButton) {
    mapButton.textContent = 'Map';
    mapButton.setAttribute('aria-label', 'Region Map');
  }

  const stagePanel = screen.querySelector('.location-stage-panel');
  if (completedLocation && !developerMode) stagePanel?.remove();
  else if (stagePanel?.querySelector('[data-view="HEROES"]')) stagePanel.querySelector('.challenge-button')?.remove();

  screen.querySelector('.location-route-area').outerHTML = `
    ${buildAmbientEffects()}
    <div class="forest-map-vignette" aria-hidden="true"></div>
    <section class="forest-map-route" aria-label="Forest Gate stage route">
      ${visibleStages.map((stageNumber) => buildStageNode(stageNumber, currentStage, clearedStages, developerMode)).join('')}
    </section>
    <div class="forest-map-toast" role="status" aria-live="polite"></div>
  `;

  mountCanvasForestBackground(screen);

  forestGateRoot.querySelector('.activity-log')?.remove();
}

function selectStageAndOpenBattle(stageId) {
  const selectBridge = document.createElement('button');
  selectBridge.type = 'button';
  selectBridge.hidden = true;
  selectBridge.dataset.stage = stageId;
  forestGateRoot.appendChild(selectBridge);
  selectBridge.click();
}

function showLockedMessage(stageNumber) {
  const toast = forestGateRoot.querySelector('.forest-map-toast');
  if (!toast) return;
  toast.textContent = `Clear Stage 1-${stageNumber - 1} to unlock this stage.`;
  toast.classList.add('visible');
  window.clearTimeout(showLockedMessage.timeoutId);
  showLockedMessage.timeoutId = window.setTimeout(() => toast.classList.remove('visible'), 2200);
}

if (forestGateRoot) {
  forestGateRoot.addEventListener('click', (event) => {
    const playableStage = event.target.closest('.forest-map-stage.playable');
    if (playableStage) {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectStageAndOpenBattle(playableStage.dataset.mapStage);
      return;
    }

    const lockedStage = event.target.closest('.forest-map-stage.locked');
    if (lockedStage) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showLockedMessage(Number(lockedStage.dataset.mapLocked));
    }
  }, true);

  new MutationObserver(enhanceForestGate).observe(forestGateRoot, { childList: true, subtree: true });
  enhanceForestGate();
}
