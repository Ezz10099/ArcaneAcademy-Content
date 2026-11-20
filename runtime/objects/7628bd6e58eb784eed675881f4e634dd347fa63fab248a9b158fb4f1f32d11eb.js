const forestGateRoot = document.getElementById('game-root');
const FOREST_GATE_BACKGROUND_ASSET = 'final-assets/expedition/location-backgrounds/forest-gate-1-1.jpg?v=20260731-resilient-v2';
const FOREST_GATE_EMISSIVE_ASSETS = Object.freeze([
  'final-assets/expedition/location-backgrounds/forest-gate-emissive-1.svg?v=20260804-emissive-restored-v1',
  'final-assets/expedition/location-backgrounds/forest-gate-emissive-2.svg?v=20260804-emissive-restored-v1',
  'final-assets/expedition/location-backgrounds/forest-gate-emissive-3.svg?v=20260804-emissive-restored-v1',
]);

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
  // Feet of the portals on the right-side cobbles, steps and landings.
  1: [53, 93.5],
  2: [46.9, 84.6],
  3: [54.7, 77.1],
  4: [55.8, 68.8],
  5: [62.8, 62.4],
  6: [65.6, 54.8],
  7: [65, 47.4],
  8: [55.9, 40.1],
  9: [52.1, 33.4],
  10: [61.6, 26.8],
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
  const emissiveLayers = FOREST_GATE_EMISSIVE_ASSETS.map((asset, index) => `
    <img class="forest-map-emissive-layer group-${index + 1}" src="${asset}" alt="" loading="eager" decoding="async">
  `).join('');

  return `
    <div class="forest-map-effects" aria-hidden="true">
      <i class="forest-map-mist mist-high"></i>
      <i class="forest-map-mist mist-low"></i>
      <i class="forest-map-gate-aura"></i>
      <div class="forest-map-emissive">${emissiveLayers}</div>
      ${fireflies}
    </div>
  `;
}

function stageNumberFromElement(element) {
  const match = element?.dataset.stage?.match(/forest-gate-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function buildStageNode(stageNumber, currentStage, completedLocation) {
  const state = completedLocation || stageNumber < currentStage
    ? 'cleared'
    : stageNumber === currentStage
      ? 'current'
      : 'locked';
  const [x, y] = FOREST_GATE_STAGE_POSITIONS[stageNumber];
  const playable = state === 'current';
  const stateText = state === 'current' ? 'Current stage' : state === 'cleared' ? 'Cleared stage. Replay unavailable' : 'Locked stage';

  const assetState = state === 'locked' ? 'locked' : 'available';

  return `
    <button class="forest-map-stage ${state} ${playable ? 'playable' : ''}"
      type="button"
      ${playable ? `data-map-stage="forest-gate-${stageNumber}"` : state === 'locked' ? `data-map-locked="${stageNumber}"` : 'disabled'}
      style="--stage-x:${x}%;--stage-y:${y}%;"
      aria-label="Stage 1-${stageNumber}. ${stateText}."${playable ? ' aria-current="step"' : ''}>
      <span class="forest-map-node-art">
        <img class="forest-map-node-image" src="final-assets/expedition/stage-nodes/stage-node-normal-${assetState}.png" alt="">
        ${state === 'cleared' ? '<img class="forest-map-cleared-mark" src="final-assets/expedition/stage-nodes/stage-node-cleared-mark.png" alt="">' : ''}
      </span>
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
  const completedLocation = !currentStage && screen.querySelectorAll('.location-stage-node.cleared').length === 10;
  const resolvedCurrent = currentStage || 11;
  // Keep the entire route visible while only the current uncleared stage remains interactive.
  const visibleStages = Array.from({ length: 10 }, (_, index) => index + 1);

  const regionMapAvailable = Boolean(screen.querySelector('[data-action="open-chapter-map"]'));

  screen.dataset.forestMapEnhanced = 'true';
  screen.classList.add('forest-gate-map-screen');
  screen.innerHTML = `
    ${buildAmbientEffects()}\n    <div class="forest-map-vignette" aria-hidden="true"></div>
    <header class="forest-map-titlebar">
      <div class="forest-map-titlecopy">
        <h1>Forest Gate</h1>
        <span>The Wild Forest · Region One</span>
      </div>
      <div class="forest-map-title-actions">
        ${regionMapAvailable ? '<button class="forest-map-chapter-button" data-action="open-chapter-map" type="button">Map</button>' : ''}
      </div>
    </header>
    <section class="forest-map-route" aria-label="Forest Gate stage route">
      ${visibleStages.map((stageNumber) => buildStageNode(stageNumber, resolvedCurrent, completedLocation)).join('')}
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
