const BATTLE_ART = './final-assets/battle';

const BATTLEFIELDS = Object.freeze({
  'forest-gate': `${BATTLE_ART}/backgrounds/forest-gate-battlefield.jpg`,
  'sprite-grove': `${BATTLE_ART}/backgrounds/sprite-grove-battlefield.webp`,
  'wolf-den': `${BATTLE_ART}/backgrounds/wolf-den-battlefield.webp`,
  'ancient-roots': `${BATTLE_ART}/backgrounds/ancient-roots-battlefield.webp`,
});

export function getBattlefieldArt(stageId) {
  const location = Object.keys(BATTLEFIELDS).find((id) => stageId?.startsWith(`${id}-`));
  return location ? { className: `battle-bg-${location}`, src: BATTLEFIELDS[location] } : null;
}

export const LOCATION_ENEMY_ART = Object.freeze({
  'Root Warden': { stem: 'root-warden', height: 220 },
  'Buried Seer': { stem: 'buried-seer', height: 220, ranged: true },
  'Thornbound Mage': { stem: 'thornbound-mage', height: 220, ranged: true },
  'Root-Crown Colossus': { stem: 'root-crown-colossus', height: 295 },
  'Elder Rootseer': { stem: 'elder-rootseer', height: 220, ranged: true },
  'Violet Stalker': { stem: 'violet-stalker', height: 220 },
  'Cursehorn Beast': { stem: 'cursehorn-beast', height: 220 },
  'Umbral Keeper': { stem: 'umbral-keeper', height: 220, ranged: true },
  'Hollow Antler': { stem: 'hollow-antler', height: 220 },
  'Violet Sovereign': { stem: 'violet-sovereign', height: 295 },
  'Violet Antler Lord': { stem: 'violet-antler-lord', height: 220, ranged: true },
  'Heartbound Guard': { stem: 'heartbound-guard', height: 220 },
  'Cursed Arcanist': { stem: 'cursed-arcanist', height: 220, ranged: true },
  'Wild Magic Echo': { stem: 'wild-magic-echo', height: 220, ranged: true },
  'Heartwood Tyrant': { stem: 'heartwood-tyrant', height: 295 },
  'Cursed Heart Avatar': { stem: 'cursed-heart-avatar', height: 220, ranged: true },
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
