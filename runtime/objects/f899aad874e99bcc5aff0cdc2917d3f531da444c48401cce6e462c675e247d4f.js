const gameRoot = document.getElementById('game-root');
const HUD_ASSET_BASE = 'final-assets/upper-hud';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function readNumberText(element) {
  const source = element?.title || element?.textContent || '0';
  const match = String(source).match(/\d[\d,.]*/);
  return match?.[0] || '0';
}

function renderResource(key, label, value, icon) {
  return `
    <div class="shared-resource shared-resource-${key}">
      <img class="shared-resource-frame" src="${HUD_ASSET_BASE}/resource-bar-frame.png" alt="" aria-hidden="true">
      <img class="shared-resource-icon" src="${icon}" alt="" aria-hidden="true">
      <span class="shared-resource-copy">
        <strong class="shared-resource-value" title="${label}: ${value}">${value}</strong>
        <small>${label}</small>
      </span>
    </div>
  `;
}

function enhanceSharedTopHud(hud) {
  if (hud.dataset.sharedHud === 'true') return;

  const playerName = hud.querySelector('.ruler-title')?.textContent.trim() || 'Academy Master';
  const avatarText = hud.querySelector('.avatar')?.textContent.trim() || 'AA';
  const power = readNumberText(hud.querySelector('.ruler-power'));
  const resources = [...hud.querySelectorAll('.currency[data-currency]')].map((node) => renderResource(
    escapeHtml(node.dataset.currency.toLowerCase()),
    escapeHtml(node.querySelector('.currency-label').textContent.trim()),
    readNumberText(node.querySelector('.currency-value')),
    escapeHtml(node.dataset.icon),
  ));

  hud.className = 'top-hud shared-top-hud';
  hud.dataset.sharedHud = 'true';
  hud.setAttribute('aria-label', 'Player profile and resources');
  hud.innerHTML = `
    <section class="shared-player-cluster" aria-label="Player profile">
      <img class="shared-player-banner" src="${HUD_ASSET_BASE}/player-side-banner.png" alt="" aria-hidden="true">
      <div class="shared-avatar-wrap">
        <span class="avatar shared-player-avatar">${escapeHtml(avatarText)}</span>
        <img class="shared-avatar-frame" src="${HUD_ASSET_BASE}/profile-avatar-frame.png" alt="" aria-hidden="true">
        <img class="shared-level-badge" src="${HUD_ASSET_BASE}/level-iv-badge.png" alt="Academy Level IV badge">
      </div>
      <div class="shared-player-copy">
        <strong class="shared-player-name">${escapeHtml(playerName)}</strong>
        <span class="shared-academy-level">Academy Level IV</span>
        <span class="shared-player-power">Power ${power}</span>
      </div>
    </section>
    ${resources.length ? `<section class="shared-resource-cluster" aria-label="Player resources">${resources.join('')}</section>` : ''}
    <button class="content-updates-button" data-action="content-updates" type="button">Updates</button>
    <button class="audio-settings-button" data-action="game-settings" type="button" aria-label="Game settings">⚙ Settings</button>
  `;
}

function enhanceSharedTopHuds() {
  gameRoot?.querySelectorAll('.top-hud:not([data-shared-hud="true"])').forEach(enhanceSharedTopHud);
}

if (gameRoot) {
  new MutationObserver(enhanceSharedTopHuds).observe(gameRoot, { childList: true, subtree: true });
  enhanceSharedTopHuds();
}
