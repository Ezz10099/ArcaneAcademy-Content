import { applyContentPatch, validateContentPatch } from '../game/data.js';
import { restorePersistentBackup } from './persistent-storage.js';

const APK_RELEASE_API = 'https://api.github.com/repos/Ezz10099/ArcaneAcademy-Downloads/releases/latest';
const APK_PATCH_NAMES = new Map([
  ['157-a867675', 'patch-6d91de036becb2b4f874fc4ed4b660febd8f5ee04fa3b2753e176fbae5c1503b.bin'],
  ['158-017ff19', 'patch-10179f55c5cc497995228dc6413571b558167cb153f473ae919a1f117bd7250d.bin'],
]);
const VERIFIED_157_PATCH = 'sha256:99f1a66487814ce104306c675ef51e2cb6442a09ee5b8285a9c350e473bc409f';

async function findApkPatch(methods) {
  const build = globalThis.__ARCANE_APK_BUILD__;
  const installed = /^([1-9]\d*)-[0-9a-f]{7}$/.exec(build?.id);
  if (!installed) return null;

  const name = methods.some((method) => method.name === 'apkPatchSource')
    ? (await plugin.apkPatchSource()).name
    : APK_PATCH_NAMES.get(build.id);
  if (!/^patch-[0-9a-f]{64}\.bin$/.test(name)) return null;

  const response = await fetch(APK_RELEASE_API, { cache: 'no-cache' });
  if (!response.ok) return null;
  const { assets } = await response.json();
  if (!Array.isArray(assets)) return null;
  const patch = assets.find((asset) => asset?.name === name && asset.state === 'uploaded');
  if (!Number.isSafeInteger(patch?.size) || patch.size <= 40 || patch.size > 256 * 1024 * 1024) return null;
  if (build.id === '157-a867675' && patch.digest === VERIFIED_157_PATCH) return patch;

  const builds = /^([1-9]\d*-[0-9a-f]{7}) to ([1-9]\d*)-[0-9a-f]{7}$/.exec(patch.label);
  return builds?.[1] === build.id && Number(builds[2]) > Number(installed[1]) ? patch : null;
}

let plugin;
let boot = { available: false, engine: 0, version: 0, label: 'Bundled game' };
let message = '';

async function loadRuntimeGameData() {
  const url = new URL('../../content/game-data.json', import.meta.url);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Game data HTTP ${response.status}`);
  const patch = await response.json();
  validateContentPatch(patch);
  return applyContentPatch(patch);
}

function showRecovery(error) {
  console.error('Runtime initialization rejected:', error);
  const recovery = document.createElement('div');
  recovery.className = 'content-recovery';
  const text = document.createElement('p');
  text.textContent = 'This downloaded game version could not finish starting. Restore the previous or bundled game; your progress is kept.';
  const previous = document.createElement('button');
  previous.textContent = 'Restore previous game';
  const bundled = document.createElement('button');
  bundled.textContent = 'Use bundled game';
  previous.onclick = async () => {
    try {
      await plugin.rollback({ bundled: false });
      await plugin.restart();
    } catch (failure) {
      text.textContent = `${failure.message}. Close and reopen the app to recover automatically.`;
    }
  };
  bundled.onclick = async () => {
    try {
      await plugin.rollback({ bundled: true });
      await plugin.restart();
    } catch (failure) {
      text.textContent = `${failure.message}. Close and reopen the app to recover automatically.`;
    }
  };
  recovery.append(text, previous, bundled);
  document.body.appendChild(recovery);
}

export async function initializeContent() {
  const capacitor = globalThis.Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    plugin = capacitor.Plugins?.ContentUpdates || capacitor.registerPlugin?.('ContentUpdates');
    if (plugin) {
      try {
        boot = await plugin.boot();
      } catch (error) {
        console.warn('Runtime updater unavailable; using bundled game.', error);
      }
      if (boot.restoreSaveBackup) {
        try {
          const backup = JSON.parse(boot.restoreSaveBackup);
          await restorePersistentBackup(backup);
          boot = { ...boot, ...await plugin.saveRestored(), restoreSaveBackup: '' };
        } catch (error) {
          showRecovery(error);
          throw new Error('Pre-update player progress could not be restored safely.', { cause: error });
        }
      }
    }
  }

  try {
    message = await loadRuntimeGameData();
  } catch (error) {
    if (boot.available && plugin) {
      showRecovery(error);
      throw error;
    }
    throw error;
  }
  return boot;
}

export async function contentReady() {
  if (boot.available && plugin) await plugin.healthy();
}

export function contentIdentity() {
  return { ...boot, message };
}

export const formatBytes = (bytes) => bytes < 1024
  ? `${bytes} B`
  : bytes < 1048576
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1048576).toFixed(2)} MB`;

export function mountContentUpdates({ canRestart, flush, backup, resetSave, doc = document }) {
  const dialog = doc.createElement('dialog');
  dialog.className = 'content-dialog';
  dialog.setAttribute('aria-labelledby', 'content-title');
  dialog.innerHTML = `
    <header><h2 id="content-title">Game updates</h2><button data-update="close">Close</button></header>
    <p data-content-version></p>
    <p data-content-message></p>
    <p data-content-status role="status" aria-live="polite"></p>
    <progress hidden aria-label="Download progress"></progress>
    <div class="content-actions">
      <button data-update="check">Check for updates</button>
      <button data-update="download" hidden>Download</button>
      <button data-update="cancel" hidden>Pause download</button>
      <button data-update="restart" hidden>Restart to apply</button>
      <button data-update="apk" aria-describedby="content-apk-help" hidden>Download latest APK update</button>
    </div>
    <button type="button" class="danger-button" data-update="reset-save" hidden>Reset save</button>
    <p id="content-apk-help" hidden></p>
    <details>
      <summary>Update source and recovery</summary>
      <label>Runtime repository
        <input data-content-repo autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Ezz10099/ArcaneAcademy-Content">
      </label>
      <button data-update="source">Save source</button>
      <p>Updates can replace the browser game runtime (UI, gameplay code, data, art and audio). Downloads are manual and progress saves are separate.</p>
      <button data-update="rollback">Restore previous game</button>
      <button data-update="bundled">Use bundled game</button>
      <button data-update="discard">Discard unfinished download</button>
      <small data-content-base></small>
    </details>`;
  doc.body.appendChild(dialog);

  const $ = (selector) => dialog.querySelector(selector);
  const button = (action) => $(`[data-update="${action}"]`);
  const capacitor = globalThis.Capacitor;
  const patchMethods = capacitor?.getPlatform?.() === 'android'
    ? capacitor.PluginHeaders?.find((header) => header.name === 'ContentUpdates')?.methods
    : null;
  button('reset-save').hidden = typeof resetSave !== 'function';
  let busy = false;
  let downloadingRuntime = false;
  let stagedVersion = null;
  let candidate = null;
  let listener;
  let apkCandidate = null;
  let apkCheck;

  const status = (text) => { $('[data-content-status]').textContent = text; };
  const buttons = () => {
    for (const action of ['check', 'source', 'rollback', 'bundled', 'discard']) {
      button(action).disabled = busy || !boot.available || stagedVersion !== null;
    }
    button('download').hidden = !candidate?.available || stagedVersion !== null;
    button('download').disabled = busy;
    const apkVisible = Boolean(apkCandidate) && stagedVersion === null;
    button('apk').hidden = !apkVisible;
    button('apk').disabled = busy || !apkVisible;
    const apkHelp = $('#content-apk-help');
    apkHelp.hidden = !apkVisible;
    apkHelp.textContent = apkVisible
      ? `${formatBytes(apkCandidate.size)} patch. Android asks you to confirm installation.`
      : '';
    button('reset-save').disabled = busy || stagedVersion !== null;
    button('cancel').hidden = !downloadingRuntime;
    button('restart').hidden = stagedVersion === null;
    button('close').disabled = busy;
  };

  function checkApkUpdate() {
    if (apkCheck || !plugin || !patchMethods?.some((method) => method.name === 'installApkPatch')) return;
    apkCandidate = null;
    buttons();
    apkCheck = findApkPatch(patchMethods)
      .catch(() => null)
      .then((patch) => { apkCandidate = patch; })
      .finally(() => {
        apkCheck = null;
        buttons();
      });
  }

  const refresh = () => {
    $('[data-content-version]').textContent = `Game runtime: ${boot.version || 0} · ${boot.label || 'Bundled game'}`;
    $('[data-content-message]').textContent = message;
    $('[data-content-repo]').value = boot.repository || '';
    $('[data-content-base]').textContent = boot.shellId ? `Android shell: ${boot.shellId}` : '';
    buttons();
  };

  async function restart() {
    if (!canRestart()) {
      status('Finish or leave the current battle before restarting.');
      return;
    }
    if (stagedVersion === null) return;
    if (await flush() === false) {
      status('Progress could not be saved. Try again before restarting.');
      return;
    }
    const snapshot = typeof backup === 'function' ? await backup() : null;
    await plugin.activate({
      version: stagedVersion,
      saveBackup: snapshot ? JSON.stringify(snapshot) : '',
    });
    await plugin.restart();
  }

  dialog.addEventListener('cancel', (event) => {
    if (busy) event.preventDefault();
  });

  dialog.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-update]')?.dataset.update;
    if (!action) return;
    if (action === 'close') {
      dialog.close();
      return;
    }
    if (action === 'cancel') {
      if (!downloadingRuntime) return;
      await plugin.cancel();
      status('Pausing download…');
      return;
    }
    if (busy) return;

    try {
      if (action === 'reset-save') {
        if (!resetSave || stagedVersion !== null) return;
        if (!canRestart()) {
          status('Finish or leave the current battle before resetting your save.');
          return;
        }
        if (!globalThis.confirm('Reset your save and start over? This permanently deletes your current game progress.')) return;
        busy = true;
        buttons();
        await resetSave();
        return;
      }

      if (action === 'restart') {
        await restart();
        return;
      }

      busy = true;
      buttons();

      if (action === 'apk') {
        if (!apkCandidate || stagedVersion !== null) return;
        if (!canRestart()) {
          status('Finish or leave the current battle before downloading the APK.');
          return;
        }
        if (await flush() === false) throw new Error('Progress could not be saved. Try again.');
        status(`Downloading APK patch (${formatBytes(apkCandidate.size)})…`);
        try {
          const { opened } = await plugin.installApkPatch();
          if (opened) {
            status('Confirm the update in Android to finish installing.');
          } else {
            apkCandidate = null;
            status('The APK patch is no longer available. Check for updates again.');
          }
        } catch {
          throw new Error('The APK patch could not be installed. Check for updates and try again.');
        }
      } else if (action === 'source') {
        boot = { ...boot, ...await plugin.configure({ repository: $('[data-content-repo]').value.trim() }) };
        candidate = null;
        status('Source saved. Tap Check for updates.');
      } else if (action === 'check') {
        checkApkUpdate();
        status('Checking the game runtime manifest…');
        candidate = await plugin.check();
        status(candidate.available
          ? `${candidate.label} · ${formatBytes(candidate.downloadBytes)} remaining across ${candidate.files} changed/new files. No download until you tap Download.`
          : candidate.label);
        if (candidate.available) button('download').textContent = `Download ${formatBytes(candidate.downloadBytes)}`;
      } else if (action === 'download') {
        if (!candidate?.available || stagedVersion !== null) return;
        downloadingRuntime = true;
        buttons();
        const progress = $('progress');
        progress.hidden = false;
        progress.value = 0;
        progress.max = candidate.downloadBytes || 1;
        listener = await plugin.addListener('progress', (value) => {
          progress.max = value.total || 1;
          progress.value = value.received;
          status(`Downloading ${formatBytes(value.received)} / ${formatBytes(value.total)}…`);
        });
        const staged = await plugin.download();
        stagedVersion = staged.version;
        status('Game update verified and staged. Restart when you are outside a battle.');
      } else if (action === 'rollback' || action === 'bundled') {
        if (!canRestart()) {
          status('Finish or leave the current battle first.');
          return;
        }
        if (!globalThis.confirm(action === 'bundled'
          ? 'Restore the game version bundled in this APK and restart? Your progress will be kept.'
          : 'Restore the previous downloaded game version and restart? Your progress will be kept.')) return;
        if (await flush() === false) throw new Error('Progress could not be saved. Try again.');
        await plugin.rollback({ bundled: action === 'bundled' });
        await plugin.restart();
      } else if (action === 'discard') {
        if (globalThis.confirm('Discard incomplete file bytes? Verified files are kept.')) {
          await plugin.discardPartial();
          candidate = null;
          status('Unfinished bytes discarded. Check again to see the remaining download size.');
        }
      }
    } catch (error) {
      status(error.message || 'Update failed. Your current game version is safe.');
    } finally {
      await listener?.remove();
      listener = null;
      downloadingRuntime = false;
      busy = false;
      $('progress').hidden = true;
      refresh();
    }
  });

  doc.addEventListener('click', (event) => {
    if (!event.target.closest?.('[data-action="content-updates"]')) return;
    if (!busy && !candidate && stagedVersion === null) {
      status(boot.available
        ? boot.notice || (boot.repository
          ? 'Updates download only when you choose.'
          : 'A runtime feed has not been configured yet.')
        : boot.notice || 'Runtime downloads are available in the Android app.');
    }
    refresh();
    if (!dialog.open) {
      dialog.showModal();
      checkApkUpdate();
    }
  });

  refresh();
  return dialog;
}
