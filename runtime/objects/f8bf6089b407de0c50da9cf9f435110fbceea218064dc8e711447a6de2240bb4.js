const expeditionRoot = document.getElementById('game-root');

function resolveLocationBackground(screen) {
  const currentValue = screen.style.getPropertyValue('--location-background');
  const match = currentValue.match(/location-backgrounds\/([^'"\)]+)/);
  if (!match) return;

  const filename = match[1];
  if (filename === 'sprite-grove-route.webp') return;
  const assetPath = filename === 'forest-gate.jpg'
    ? 'final-assets/expedition/location-backgrounds/forest-gate-1-1.jpg'
    : `final-assets/expedition/location-preview/${filename}`;

  screen.style.setProperty('--location-background', `url("${assetPath}")`);
}

function syncExpeditionAssetPaths() {
  expeditionRoot?.querySelectorAll('.expedition-location-screen').forEach(resolveLocationBackground);
}

if (expeditionRoot) {
  new MutationObserver(syncExpeditionAssetPaths).observe(expeditionRoot, { childList: true, subtree: true });
  syncExpeditionAssetPaths();
}
