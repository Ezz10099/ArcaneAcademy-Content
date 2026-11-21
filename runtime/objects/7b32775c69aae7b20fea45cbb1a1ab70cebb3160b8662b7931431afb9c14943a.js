const BATTLE_ART = './final-assets/battle';

const BATTLEFIELDS = Object.freeze({
  'forest-gate': `${BATTLE_ART}/backgrounds/forest-gate-battlefield.jpg`,
  'sprite-grove': `${BATTLE_ART}/backgrounds/sprite-grove-battlefield.webp`,
  'wolf-den': `${BATTLE_ART}/backgrounds/wolf-den-battlefield.webp`,
});

export function getBattlefieldArt(stageId) {
  const location = Object.keys(BATTLEFIELDS).find((id) => stageId?.startsWith(`${id}-`));
  return location ? { className: `battle-bg-${location}`, src: BATTLEFIELDS[location] } : null;
}

export const LOCATION_ENEMY_ART = Object.freeze({
  'Rune Sprite': { stem: 'rune-sprite', height: 198, ranged: true },
  'Grove Wisp': { stem: 'grove-wisp', height: 186, ranged: true },
  'Prism Archer': { stem: 'prism-archer', height: 248, ranged: true },
  'Prismheart Dryad': { stem: 'prismheart-dryad', height: 303 },
  'Forest Wolf': { stem: 'forest-wolf', height: 170 },
  'Moonfang Hunter': { stem: 'moonfang-hunter', height: 180 },
  'Den Keeper': { stem: 'den-keeper', height: 205 },
  'Denmother Varkai': { stem: 'denmother-varkai', height: 244 },
});

export function locationEnemyArtUrl(stem) {
  return `${BATTLE_ART}/enemies/location-roster/${stem}.webp`;
}
