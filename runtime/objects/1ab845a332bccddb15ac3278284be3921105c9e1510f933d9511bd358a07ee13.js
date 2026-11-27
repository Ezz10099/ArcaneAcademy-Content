// The approved Gemini art is shared by battles, formation, cards and archive.
export const APPROVED_CHARACTER_ART = {"cinder":{"standee":"final-assets/battle/approved-rigs/cinder-vale-idle.svg","portrait":"final-assets/battle/approved-rigs/cinder-vale-portrait.svg","top":-107.41320317075687,"headHeight":138.55139377562386,"registeredScale":1.2933828748789369,"ground":140,"maxY":146.1251285436577},"forestScout":{"standee":"final-assets/battle/approved-rigs/forest-scout-idle.svg","portrait":"final-assets/battle/approved-rigs/forest-scout-portrait.svg","top":-151.19036195490926,"headHeight":141.2266026947492,"registeredScale":1.2688827499966666,"ground":101,"maxY":104.00539780375958}};
export function approvedRigFamily(unit) {
  if (!unit) return null;
  if ((unit.heroDefId === 'hero_cinder_vale' || unit.id === 'hero_cinder_vale') && unit.side !== 'enemy') return 'cinder';
  if (unit.name === 'Forest Scout' && unit.side !== 'player') return 'forestScout';
  return null;
}
export function approvedCharacterArt(unit) {
  return APPROVED_CHARACTER_ART[approvedRigFamily(unit)] || null;
}
