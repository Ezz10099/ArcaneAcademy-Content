import { LOCATION_DEFINITIONS, STAGE_DEFINITIONS } from './data.js';

const ARCHIVE_ROOT = 'final-assets/archive';
const MONSTER_LORE = new Map([
  ['Forest Scout', ['forest-scout', 'Twigs and moss knit into a quick woodland sentry. The blue light in its eyes is often the first sign that the forest is watching.']],
  ['Briar Guard', ['briar-guard', 'Interwoven thorns form a shield around this guardian. It plants its roots across narrow paths and holds the ground while other creatures gather behind it.']],
  ['Lantern Moth', ['lantern-moth', 'The glow below its veined wings can be mistaken for a trail lantern. It drifts through the darkest stretches of the Forest Gate.']],
  ['Rime Scout', ['rime-scout', 'Frost clings to this scout’s branches even under a warm moon. Its slashes carry a chill that can interrupt a trainee’s next action.']],
  ['Ember Moth', ['ember-moth', 'A red glow pulses through its wings. The heat that trails behind it can leave a burning mark long after the moth flies past.']],
  ['Gatewood Warden', ['gatewood-warden', 'A towering sentinel in bark armor guards the far end of the Forest Gate. Its shield carries the same old blue runes that illuminate the trail.']],
]);

const REFERENCE_CREATURES = [
  ['luminowl', 'Luminowl', 'Celestial · Spirit', 'Messengers of the night sky, Luminowls are said to carry starlight in their feathers. They appear to those who seek wisdom with a pure heart.'],
  ['grove-stag', 'Grove Stag', 'Forest · Beast', 'A quiet woodland guardian with branchlike antlers. A glimpse of its green eyes can lead travelers back to a safe path.'],
  ['umbral-wraith', 'Umbral Wraith', 'Shadow · Spirit', 'A cloaked presence that drifts through abandoned halls. Its violet glow sometimes lingers after the apparition has passed.'],
  ['crystalback', 'Crystalback', 'Crystal · Beast', 'Blue crystals grow from this creature’s stone shell. Their light betrays its hiding place in caves that would otherwise be pitch-black.'],
  ['mist-lynx', 'Mist Lynx', 'Frost · Beast', 'A tuft-eared hunter with a silver coat. Its tracks quickly vanish in the fog that gathers around icy woodland paths.'],
  ['aether-drake', 'Aether Drake', 'Aether · Dragon', 'Blue-violet sparks follow this winged drake. It is drawn to caves where aether collects in the stone.'],
];

const percent = (complete, total) => total ? Math.round(100 * complete / total) : 0;

function monsterCollection(game) {
  const entries = new Map();
  const progressByLocation = new Map(LOCATION_DEFINITIONS.map((location) => [
    location.id, game.getLocationProgress(location.id),
  ]));
  const cleared = game.getClearedStageIds();

  for (const stage of STAGE_DEFINITIONS) {
    const location = progressByLocation.get(stage.locationId);
    const isCleared = cleared.has(stage.id);
    const isCurrent = location?.unlocked && location.currentStageId === stage.id;
    const observed = new Set();
    for (const enemy of stage.enemies) {
      if (observed.has(enemy.name)) continue;
      observed.add(enemy.name);
      const [artName, lore] = MONSTER_LORE.get(enemy.name) || [];
      const entry = entries.get(enemy.name) || {
        id: enemy.name, name: enemy.name, type: [enemy.affinity, enemy.heroClass].filter(Boolean).join(' · '),
        art: artName ? `${ARCHIVE_ROOT}/${artName}.webp` : '',
        lore, seen: false, completed: 0, total: 0, habitats: new Set(),
      };
      entry.seen ||= isCleared || Boolean(isCurrent);
      entry.completed += Number(isCleared);
      entry.total += 1;
      if ((isCleared || isCurrent) && location) entry.habitats.add(location.location.name);
      entries.set(enemy.name, entry);
    }
  }

  return [...entries.values()].map(({ habitats, ...entry }) => ({
    ...entry,
    progress: percent(entry.completed, entry.total),
    progressLabel: 'Encounters cleared',
    habitats: [...habitats],
  }));
}

export function getArchiveEntries(game, category) {
  if (category === 'regions') return LOCATION_DEFINITIONS.map((location) => {
    const progress = game.getLocationProgress(location.id);
    return {
      id: location.id, name: location.name, type: 'Wild Forest',
      art: location.id === 'forest-gate'
        ? 'final-assets/expedition/location-backgrounds/forest-gate-1-1.jpg'
        : `final-assets/expedition/location-preview/${location.backgroundAsset}`,
      lore: location.description, seen: progress.unlocked,
      completed: progress.cleared, total: progress.total, progress: progress.percent, progressLabel: 'Stages cleared',
    };
  });
  if (category === 'creatures') return REFERENCE_CREATURES.map(([id, name, type, lore]) => ({
    id, name, type, lore, seen: true, art: `${ARCHIVE_ROOT}/${id}.webp`,
  }));
  return monsterCollection(game);
}
