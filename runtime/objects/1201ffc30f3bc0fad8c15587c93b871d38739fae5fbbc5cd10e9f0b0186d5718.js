import { applyContentPatch, validateContentPatch } from '../game/data.js';
import { restorePersistentBackup } from './persistent-storage.js';

const LATEST_ANDROID_APK = 'https://github.com/Ezz10099/ArcaneAcademy-Downloads/releases/latest/download/Arcane-Academy.apk';

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
      <button data-update="apk" aria-describedby="content-apk-help" hidden>Download latest APK</button>
      <button data-update="apk-full" hidden>Download full APK</button>
    </div>
    <button type="button" class="danger-button" data-update="reset-save" hidden>Reset save</button>
    <p id="content-apk-help" hidden>Android asks for confirmation when you open the downloaded APK.</p>
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
  const android = globalThis.Capacitor?.getPlatform?.() === 'android';
  button('apk').hidden = !android;
  button('reset-save').hidden = typeof resetSave !== 'function';
  $('#content-apk-help').hidden = !android;
  let busy = false;
  let stagedVersion = null;
  let candidate = null;
  let listener;

  const status = (text) => { $('[data-content-status]').textContent = text; };
  const buttons = () => {
    for (const action of ['check', 'source', 'rollback', 'bundled', 'discard']) {
      button(action).disabled = busy || !boot.available || stagedVersion !== null;
    }
    button('download').hidden = !candidate?.available || stagedVersion !== null;
    button('download').disabled = busy;
    button('apk').disabled = busy;
    button('reset-save').disabled = busy || stagedVersion !== null;
    button('apk-full').disabled = busy;
    button('cancel').hidden = !busy;
    button('restart').hidden = stagedVersion === null;
    button('close').disabled = busy;
  };

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

      if ((action === 'apk' || action === 'apk-full') && android) {
        if (!canRestart()) {
          status('Finish or leave the current battle before downloading the APK.');
          return;
        }
        if (await flush() === false) throw new Error('Progress could not be saved. Try again.');
        const supportsPatch = globalThis.Capacitor?.PluginHeaders?.some(
          (header) => header.name === 'ContentUpdates'
            && header.methods?.some((method) => method.name === 'installApkPatch'),
        );
        if (action === 'apk' && supportsPatch && plugin) {
          status('Checking for an APK patch…');
          try {
            if ((await plugin.installApkPatch()).opened) {
              status('Confirm the update in Android to finish installing.');
              return;
            }
            status('No patch is available for this version. Use Download full APK.');
          } finally {
            button('apk-full').hidden = false;
          }
          return;
        }
        doc.defaultView.location.assign(LATEST_ANDROID_APK);
      } else if (action === 'source') {
        boot = { ...boot, ...await plugin.configure({ repository: $('[data-content-repo]').value.trim() }) };
        candidate = null;
        status('Source saved. Tap Check for updates.');
      } else if (action === 'check') {
        status('Checking the game runtime manifest…');
        candidate = await plugin.check();
        status(candidate.available
          ? `${candidate.label} · ${formatBytes(candidate.downloadBytes)} remaining across ${candidate.files} changed/new files. No download until you tap Download.`
          : candidate.label);
        if (candidate.available) button('download').textContent = `Download ${formatBytes(candidate.downloadBytes)}`;
      } else if (action === 'download') {
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
    if (!dialog.open) dialog.showModal();
  });

  refresh();
  return dialog;
}
