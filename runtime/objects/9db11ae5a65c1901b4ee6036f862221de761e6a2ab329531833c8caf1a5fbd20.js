import { samplePose, blendPose, getClip } from './stage1-rig-core.js';
// Reusable character-agnostic animation player for Arcane Animator v7 projects.
// Host owns world position, battle rules, and presentation clock (deltaMs).
// Zero setInterval, zero wall clocks, zero Phaser or DOM dependencies.


export function createAnimationPlayer({ project, manifestEntry, initialState = 'idle' }) {
  if (!project || !manifestEntry) {
    throw new Error('createAnimationPlayer requires project and manifestEntry');
  }

  const fps = project.fps || 24;
  const stateDefs = manifestEntry.states || {};

  let stateKey = initialState;
  let stateDef = stateDefs[initialState] || Object.values(stateDefs)[0];
  let clip = getClip(project, stateDef.clip);
  let frame = 0;
  let completed = false;

  // Shortest-angle transition blend state
  let blendFromPose = null;
  let blendElapsedMs = 0;
  let blendDurationMs = 0;

  // Per-playback marker deduplication & active action metadata
  let firedMarkers = new Set();
  let activePayload = null;
  let onMarkerCb = null;
  let onCompleteCb = null;

  let currentPose = samplePose(project, clip.name, 0);
  let revision = 0;

  function evaluatePose() {
    const sampled = samplePose(project, clip.name, frame);
    if (blendFromPose && blendDurationMs > 0 && blendElapsedMs < blendDurationMs) {
      currentPose = blendPose(blendFromPose, sampled, blendElapsedMs / blendDurationMs);
    } else {
      blendFromPose = null;
      currentPose = sampled;
    }
    return currentPose;
  }

  function fireCrossedMarkers(prevFrame, nextFrame, wrapped) {
    const markers = stateDef.markers || [];
    if (!markers.length || !onMarkerCb) return true;
    const activeRevision = revision;

    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      if (firedMarkers.has(i)) continue;
      const crossed = wrapped
        ? (m.frame > prevFrame || m.frame <= nextFrame)
        : (m.frame >= prevFrame && m.frame <= nextFrame && (nextFrame > prevFrame || m.frame === 0));
      if (crossed) {
        firedMarkers.add(i);
        // Use exact contact pose even when a rendered frame is skipped.
        currentPose = samplePose(project, clip.name, m.frame);
        onMarkerCb({
          pose: currentPose,
          state: stateKey,
          clip: clip.name,
          frame: m.frame,
          type: m.type,
          anchor: m.anchor || null,
          payload: activePayload,
        });
        if (revision !== activeRevision) return false;
      }
    }
    return true;
  }

  function play(nextStateKey, options = {}) {
    const nextDef = stateDefs[nextStateKey];
    if (!nextDef) throw new Error(`Unknown manifest state: ${nextStateKey}`);

    const {
      blendMs = nextDef.blendMs ?? 80,
      restart = true,
      payload = null,
      onMarker = null,
      onComplete = null,
      startFrame = 0,
    } = options;

    if (!restart && stateKey === nextStateKey && !completed) {
      if (onMarker) onMarkerCb = onMarker;
      if (onComplete) onCompleteCb = onComplete;
      if (payload !== undefined) activePayload = payload;
      return currentPose;
    }

    revision += 1;
    // Capture live pose for shortest-angle blend
    blendFromPose = blendMs > 0 ? JSON.parse(JSON.stringify(currentPose)) : null;
    blendElapsedMs = 0;
    blendDurationMs = Math.max(0, blendMs);

    stateKey = nextStateKey;
    stateDef = nextDef;
    clip = getClip(project, stateDef.clip);
    frame = Math.max(0, Math.min(clip.durationFrames, startFrame));
    completed = false;
    firedMarkers = new Set();
    activePayload = payload;
    onMarkerCb = onMarker;
    onCompleteCb = onComplete;

    evaluatePose();
    // Fire frame-0 markers immediately if present
    fireCrossedMarkers(0, frame, false);
    return currentPose;
  }

  function playClip(clipName, options = {}) {
    const {
      loop = true,
      blendMs = 80,
      markers = [],
      startFrame = 0,
      onMarker = null,
      onComplete = null,
      payload = null,
    } = options;
    const targetClip = getClip(project, clipName);
    revision += 1;
    blendFromPose = blendMs > 0 ? JSON.parse(JSON.stringify(currentPose)) : null;
    blendElapsedMs = 0;
    blendDurationMs = Math.max(0, blendMs);

    stateKey = `__clip:${clipName}`;
    stateDef = { clip: clipName, loop, markers, blendMs, rootMotion: 'in-place' };
    clip = targetClip;
    frame = Math.max(0, Math.min(clip.durationFrames, startFrame));
    completed = false;
    firedMarkers = new Set();
    activePayload = payload;
    onMarkerCb = onMarker;
    onCompleteCb = onComplete;
    return evaluatePose();
  }

  function advanceFrames(deltaFrames, deltaMsForBlend) {
    if (blendFromPose && blendDurationMs > 0) {
      blendElapsedMs += Math.max(0, deltaMsForBlend);
    }
    if (completed || deltaFrames <= 0) {
      return evaluatePose();
    }

    const prevFrame = frame;
    const dur = clip.durationFrames;
    if (stateDef.loop) {
      const rawNext = frame + deltaFrames;
      const wrapped = rawNext >= dur;
      if (wrapped) {
        if (!fireCrossedMarkers(prevFrame, dur, false)) return currentPose;
        firedMarkers.clear();
        frame = rawNext % dur;
        if (!fireCrossedMarkers(0, frame, false)) return currentPose;
      } else {
        frame = rawNext;
        if (!fireCrossedMarkers(prevFrame, frame, false)) return currentPose;
      }
    } else {
      frame = Math.min(dur, frame + deltaFrames);
      if (!fireCrossedMarkers(prevFrame, frame, false)) return currentPose;
      if (frame >= dur && !completed) {
        completed = true;
        evaluatePose();
        if (onCompleteCb) {
          const cb = onCompleteCb;
          const payload = activePayload;
          onCompleteCb = null;
          cb({ state: stateKey, clip: clip.name, payload });
        }
        return currentPose;
      }
    }
    return evaluatePose();
  }

  function update(deltaMs) {
    const dt = Math.max(0, Number(deltaMs) || 0);
    const deltaFrames = (dt / 1000) * fps;
    return advanceFrames(deltaFrames, dt);
  }

  // Distance-driven locomotion phase prevents foot sliding at any world speed
  function advanceByDistance(worldDistanceMoved, deltaMs) {
    const scale = manifestEntry.scale || 1;
    const strideRig = stateDef.strideRigUnits || 112;
    const strideWorld = strideRig * scale;
    const deltaFrames = strideWorld > 0 ? (Math.abs(worldDistanceMoved) / strideWorld) * clip.durationFrames : 0;
    return advanceFrames(deltaFrames, Math.max(0, Number(deltaMs) || 0));
  }

  function setFrame(targetFrame) {
    frame = Math.max(0, Math.min(clip.durationFrames, targetFrame));
    blendFromPose = null;
    completed = !stateDef.loop && frame >= clip.durationFrames;
    return evaluatePose();
  }

  function cancelPendingCallbacks() {
    revision += 1;
    onMarkerCb = null;
    onCompleteCb = null;
    activePayload = null;
  }

  return {
    play,
    playClip,
    update,
    advanceByDistance,
    setFrame,
    cancelPendingCallbacks,
    getPose: () => currentPose,
    getState: () => stateKey,
    getClipName: () => clip.name,
    getFrame: () => frame,
    getDurationFrames: () => clip.durationFrames,
    isCompleted: () => completed,
  };
}

