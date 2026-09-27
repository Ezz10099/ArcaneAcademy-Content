// Independent of Phaser so the same cues work in the DOM fallback.
export const AUDIO_FILES = Object.freeze({
  ui: '01_ui_select.ogg', hit: '02_melee_hit.ogg', skill: '03_arcane_cast.ogg',
  ultimate: '04_ultimate_release.ogg', victory: '05_victory.ogg', defeat: '06_defeat.ogg',
  academy: 'academy.ogg', expedition: 'expedition.ogg', battle: 'battle.ogg',
  summon: '07_summon.ogg', summonRare: '08_summon_rare.ogg', train: '09_train.ogg',
  reward: '10_reward.ogg', formation: '11_formation.ogg',
  cinderBasic: '12_cinder_basic.wav', yssaBasic: '13_yssa_basic.wav', lumenBasic: '14_lumen_basic.wav',
});
export function selectMusic({ view, result = null }) {
  if (view === 'BATTLE') return result ? null : 'battle';
  if (view === 'CAMPAIGN' || view === 'FORMATION') return 'expedition';
  return 'academy';
}
export function actionCue(action, result) {
  if (!result?.ok) return null;
  if (action === 'pull') return result.results?.some(hero => ['EPIC', 'LEGENDARY'].includes(hero.rarity)) ? 'summonRare' : 'summon';
  return { 'level-up': 'train', 'claim-quest': 'reward', 'claim-idle': 'reward' }[action] || null;
}
const BASIC_ATTACK_CUE_BY_HERO = Object.freeze({
  hero_cinder_vale: 'cinderBasic',
  hero_yssa_driftborn: 'yssaBasic',
  hero_lumen_solis: 'lumenBasic',
});
export function basicAttackCue(event, battle) {
  if (!event || event.type !== 'damage' || event.abilityName === 'Burn' || event.actionKind) return null;
  const actor = battle?.player?.find(unit => unit.id === event.actorId);
  return BASIC_ATTACK_CUE_BY_HERO[actor?.heroDefId] || 'hit';
}
const EFFECT_NAMES = ['ui', 'hit', 'cinderBasic', 'yssaBasic', 'lumenBasic', 'skill', 'ultimate', 'victory', 'defeat', 'summon', 'summonRare', 'train', 'reward', 'formation'];
export const AUDIO_SETTINGS_KEY = 'arcane_academy_audio_v1';
const DEFAULTS = { music: 0.35, effects: 0.7, muted: false };
const clamp = (v, fallback) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;

export function createGameAudio({ storage, Context = globalThis.AudioContext || globalThis.webkitAudioContext,
  fetchAudio = globalThis.fetch, now = () => performance.now(), report = (e) => console.warn('Game audio:', e) } = {}) {
  let saved;
  try { saved = JSON.parse(storage?.getItem(AUDIO_SETTINGS_KEY) || 'null'); } catch { /* Use defaults for invalid settings. */ }
  const settings = { music: clamp(saved?.music, DEFAULTS.music), effects: clamp(saved?.effects, DEFAULTS.effects), muted: saved?.muted === true };
  let context, musicGain, effectsGain, output, musicSource, musicName = null, desiredMusic = 'academy';
  let hidden = false, paused = false, battle = null, cursor = 0, result = null, epoch = 0;
  let error = '', disposed = false;
  const buffers = new Map(), pending = new Map(), failed = new Set(), voices = new Set(), cooldowns = new Map();
  const active = () => !disposed && context?.state === 'running' && !hidden && !paused && !settings.muted;
  const fail = (e) => { error = 'Audio unavailable. Tap Sound to try again.'; report(e); };

  async function load(name) {
    if (buffers.has(name)) return buffers.get(name);
    if (pending.has(name)) return pending.get(name);
    if (failed.has(name)) return null;
    const task = (async () => {
      const response = await fetchAudio(new URL(`../../final-assets/audio/${AUDIO_FILES[name]}`, import.meta.url));
      if (!response.ok) throw new Error(`Audio ${name}: HTTP ${response.status}`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      buffers.set(name, buffer);
      return buffer;
    })().catch((e) => { failed.add(name); fail(e); return null; }).finally(() => pending.delete(name));
    pending.set(name, task);
    return task;
  }

  function stopMusic() {
    if (musicSource) { musicSource.stop(); musicSource.disconnect(); musicSource = null; }
    musicName = null;
  }
  function stopEffects() {
    epoch += 1;
    for (const source of voices) { source.stop(); source.disconnect(); }
    voices.clear();
  }
  function gains() {
    if (!context) return;
    musicGain.gain.setTargetAtTime(settings.music * 0.7, context.currentTime, .04);
    effectsGain.gain.setTargetAtTime(settings.effects * 0.7, context.currentTime, .015);
  }
  function updateMusic() {
    const name = active() && settings.music > 0 ? desiredMusic : null;
    if (!name) { stopMusic(); return; }
    if (musicName === name) return;
    stopMusic();
    // Promise completions recheck current scene; obsolete loads cannot start music.
    void load(name).then((buffer) => {
      if (!buffer || !active() || settings.music <= 0 || desiredMusic !== name || musicName === name) return;
      stopMusic();
      musicSource = context.createBufferSource();
      musicSource.buffer = buffer;
      musicSource.loop = true;
      musicSource.connect(musicGain);
      musicSource.start();
      musicName = name;
    });
  }

  function unlock({ retry = false } = {}) {
    if (disposed || hidden) return Promise.resolve();
    if (retry) { failed.clear(); error = ''; }
    try {
      if (!context) {
        if (!Context) throw new Error('Web Audio is not supported');
        context = new Context();
        musicGain = context.createGain(); effectsGain = context.createGain();
        output = context.createDynamicsCompressor();
        output.threshold.value = -8; output.ratio.value = 8;
        musicGain.connect(output); effectsGain.connect(output); output.connect(context.destination);
        gains();
      }
      return context.resume().then(() => {
        if (hidden || disposed) { void context.suspend().catch(fail); return; }
        updateMusic();
        if (settings.effects > 0 && !settings.muted) {
          for (const name of EFFECT_NAMES) {
            if (!buffers.has(name) && !pending.has(name)) void load(name);
          }
        }
      }).catch(fail);
    } catch (e) { fail(e); return Promise.resolve(); }
  }

  function play(name, { offset = 0, rate = 1 } = {}) {
    if (!EFFECT_NAMES.includes(name) || !active() || settings.effects <= 0) return;
    const at = now(), gap = { ui: 70, hit: 100, cinderBasic: 100, yssaBasic: 100, lumenBasic: 100, skill: 220, ultimate: 500, summon: 300, summonRare: 300, train: 120, reward: 100, formation: 100 }[name] || 0;
    if (at - (cooldowns.get(name) ?? -Infinity) < gap) return;
    cooldowns.set(name, at);
    const token = epoch;
    const start = (buffer) => {
      if (!buffer || !active() || settings.effects <= 0 || token !== epoch || now() - at > 250) return;
      const important = ['ultimate', 'victory', 'defeat', 'summon', 'summonRare'].includes(name);
      if (voices.size >= 4) {
        if (!important) return;
        const oldest = voices.values().next().value;
        oldest.stop(); oldest.disconnect(); voices.delete(oldest);
      }
      const source = context.createBufferSource();
      source.buffer = buffer; source.playbackRate.value = rate;
      source.connect(effectsGain); voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); };
      source.start(0, offset);
    };
    if (buffers.has(name)) start(buffers.get(name));
    else void load(name).then(start);
  }

  function sync(nextBattle, { view, started = false, battlePaused = false, speed = 1, locationId, regionMap = false } = {}) {
    const changed = nextBattle !== battle;
    if (changed) { stopEffects(); battle = nextBattle; cursor = 0; result = null; cooldowns.clear(); }
    const inBattle = view === 'BATTLE' && Boolean(battle);
    const nextPaused = inBattle && started && battlePaused && !battle.result;
    const nextMusic = selectMusic({ view: view === 'BATTLE' && !battle ? 'ACADEMY' : view, locationId, regionMap, result: inBattle ? battle.result : null });
    if (nextPaused !== paused || desiredMusic !== nextMusic) stopEffects();
    paused = nextPaused; desiredMusic = nextMusic;
    updateMusic();
    if (!inBattle) { cursor = battle?.eventSequence || 0; return; }
    const events = (battle.events || []).filter(e => e.eventId > cursor);
    cursor = battle.eventSequence || 0;
    if (battle.result) {
      if (result !== battle.result) {
        result = battle.result;
        stopEffects();
        play(result === 'player_win' ? 'victory' : 'defeat');
      }
      return;
    }
    if (!started || paused || hidden) return;
    // One representative cue per update avoids AoE and x4 audio pile-ups.
    const basicEvent = events.find(e => e.type === 'damage' && e.abilityName !== 'Burn' && !e.actionKind);
    const kind = events.some(e => e.type === 'ultimate' || e.actionKind === 'ultimate') ? 'ultimate'
      : events.some(e => ['skill', 'heal', 'barrier'].includes(e.type) || e.actionKind === 'skill') ? 'skill'
      : basicEvent ? basicAttackCue(basicEvent, battle)
        : events.some(e => e.type === 'damage' && e.abilityName !== 'Burn') ? 'hit' : null;
    if (kind) {
      // Combat events already resolve on this tick: skip the audition's long charge.
      const basicHit = ['hit', 'cinderBasic', 'yssaBasic', 'lumenBasic'].includes(kind);
      play(kind, { offset: kind === 'ultimate' ? .65 : 0, rate: basicHit ? 1 + Math.min(3, Math.max(0, speed - 1)) * .025 : 1 });
    }
  }
  function setHidden(value) {
    hidden = Boolean(value);
    if (hidden) {
      stopEffects(); stopMusic();
      if (context) void context.suspend().catch(fail);
    } else if (context) { void unlock(); }
  }
  function configure(patch) {
    settings.music = clamp(patch.music, settings.music);
    settings.effects = clamp(patch.effects, settings.effects);
    if (typeof patch.muted === 'boolean') settings.muted = patch.muted;
    try { storage?.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { report(e); }
    if (settings.muted || settings.effects === 0) stopEffects();
    gains(); updateMusic();
  }
  function dispose() {
    disposed = true; stopEffects(); stopMusic();
    if (context) void context.close().catch(fail);
  }
  return { unlock, play, sync, setHidden, configure, dispose,
    get settings() { return { ...settings }; },
    get status() { return error || (!context ? 'Sound starts after your first tap.' : settings.muted ? 'Muted' : 'Sound ready'); },
  };
}

export function mountAudioSettings(audio, doc = document) {
  const dialog = doc.createElement('dialog');
  dialog.className = 'audio-dialog';
  dialog.setAttribute('aria-labelledby', 'audio-title');
  dialog.innerHTML = `<form method="dialog"><header><h2 id="audio-title">Sound</h2><button value="close" aria-label="Close sound settings">Close</button></header>
    <label>Music <output data-level="music"></output><input aria-label="Music volume" data-audio="music" type="range" min="0" max="100" step="1"></label>
    <label>Effects <output data-level="effects"></output><input aria-label="Effects volume" data-audio="effects" type="range" min="0" max="100" step="1"></label>
    <label class="audio-mute"><input data-audio="muted" type="checkbox"> Mute all</label>
    <p data-audio-status role="status"></p></form>`;
  doc.body.appendChild(dialog);
  function refresh() {
    for (const key of ['music', 'effects']) {
      const value = Math.round(audio.settings[key] * 100);
      dialog.querySelector(`[data-audio="${key}"]`).value = value;
      dialog.querySelector(`[data-level="${key}"]`).textContent = `${value}%`;
    }
    dialog.querySelector('[data-audio="muted"]').checked = audio.settings.muted;
    dialog.querySelector('[data-audio-status]').textContent = audio.status;
  }
  dialog.addEventListener('input', (event) => {
    const key = event.target.dataset.audio;
    if (!key) return;
    audio.configure({ [key]: key === 'muted' ? event.target.checked : Number(event.target.value) / 100 });
    refresh();
  });
  dialog.addEventListener('change', (event) => {
    if (event.target.dataset.audio === 'effects') audio.play('ui');
  });
  doc.addEventListener('click', (event) => {
    if (!event.target.closest?.('[data-action="audio-settings"]')) return;
    refresh();
    if (!dialog.open) dialog.showModal();
    void audio.unlock({ retry: true }).then(refresh);
  });
  return dialog;
}
