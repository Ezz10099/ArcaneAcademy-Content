import { ARCANE_SAVE_KEYS, restorePersistentBackup } from './persistent-storage.js';

export const SETTINGS_KEY = 'arcane_academy_device_settings_v1';
export const IMPORT_RECOVERY_KEY = 'arcane_academy_before_import_v1';
const MAX_BACKUP = 2 * 1024 * 1024;
const REMINDER_ID = 74001;
const TEST_ID = 74002;
const native = (name) => globalThis.Capacitor?.isNativePlatform?.()
  ? globalThis.Capacitor.Plugins?.[name] : null;

export function validateSaveFile(text, maxVersion) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP) throw new Error('Backup exceeds 2 MiB.');
  let file;
  try { file = JSON.parse(text); } catch { throw new Error('This is not a valid JSON backup.'); }
  if (file?.game !== 'Arcane Academy' || file.schema !== 1 || file.backup?.schema !== 1) throw new Error('Choose an Arcane Academy backup file.');
  const values = file.backup.values;
  if (!values || typeof values !== 'object' || Array.isArray(values) || !values[ARCANE_SAVE_KEYS[0]]) throw new Error('Backup has no current game save.');
  for (const [key, raw] of Object.entries(values)) {
    if (!ARCANE_SAVE_KEYS.includes(key) || typeof raw !== 'string') throw new Error('Backup contains an unsupported save key.');
    let save;
    try { save = JSON.parse(raw); } catch { throw new Error('Backup contains damaged save data.'); }
    if (key !== ARCANE_SAVE_KEYS[0]) {
      // Older install keys are migration inputs, not current-format saves.
      // GameSession.normalizeSave accepts an object and supplies newer fields.
      if (!save || typeof save !== 'object' || Array.isArray(save)) throw new Error('Backup contains damaged legacy save data.');
      continue;
    }
    if (!Number.isInteger(save?.version) || save.version < 1 || save.version > maxVersion) throw new Error('This backup needs a compatible game version.');
    if (!Array.isArray(save.heroes) || save.heroes.length === 0 || save.heroes.length > 10000
      || save.heroes.some(h => !h || typeof h.id !== 'string' || typeof h.heroDefId !== 'string')
      || !Array.isArray(save.activeSquad) || !save.currencies || Array.isArray(save.currencies)
      || typeof save.currencies !== 'object'
      || Object.values(save.currencies).some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0)
      || !Number.isFinite(save.lastSaveTime)) throw new Error('Backup has invalid game data.');
  }
  return file;
}

export async function replaceSaveSafely(backup, { storage, restore = restorePersistentBackup }) {
  if (await storage.flush() === false) throw new Error('Current progress could not be saved.');
  const previous = await storage.snapshot();
  storage.setItem(IMPORT_RECOVERY_KEY, JSON.stringify(previous));
  if (await storage.flush() === false) throw new Error('Could not preserve progress before importing.');
  try { await restore(backup); }
  catch (error) {
    try { await restore(previous); }
    catch { throw new Error('Import and rollback failed. Keep the app installed; your pre-import backup is retained.'); }
    throw new Error(`Import failed; previous progress restored. ${error.message || ''}`);
  }
}

export function mountGameSettings({ audio, storage, game, canRestore, onSuspend, onBack, doc = document }) {
  let saved;
  try { saved = JSON.parse(storage.getItem(SETTINGS_KEY) || '{}'); } catch { saved = {}; }
  const settings = { haptics: saved?.haptics === true, notifications: saved?.notifications === true };
  const haptics = native('Haptics');
  const notifications = native('LocalNotifications');
  const documents = native('ArcaneDocuments');
  const share = native('Share');
  const app = native('App');
  const updates = native('ContentUpdates');
  let busy = false;
  let restoring = false;
  let background = false;
  let reminderQueue = Promise.resolve();
  const dialog = doc.createElement('dialog');
  dialog.className = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settings-title');
  dialog.innerHTML = `
    <header><h2 id="settings-title">Settings</h2><button data-setting-action="close">Close</button></header>
    <p data-settings-status role="status" aria-live="polite">Progress is saved on this device.</p>
    <section><h3>Sound & touch</h3>
      <label>Music <output data-level="music"></output><input data-sound="music" aria-label="Music volume" type="range" min="0" max="100"></label>
      <label>Sound effects <output data-level="effects"></output><input data-sound="effects" aria-label="Sound effects volume" type="range" min="0" max="100"></label>
      <label class="setting-check"><input data-sound="muted" type="checkbox">Mute all sound</label>
      <label class="setting-check"><input data-device="haptics" type="checkbox">Vibration feedback</label>
      <button data-setting-action="vibrate">Test vibration</button>
    </section>
    <section><h3>Notifications</h3>
      <label class="setting-check"><input data-device="notifications" type="checkbox">Academy reminders</label>
      <p>One optional reminder about four hours after leaving. Android may delay delivery.</p>
      <button data-setting-action="notify">Test notification</button>
    </section>
    <section><h3>Progress & account</h3>
      <p>Your current save stays on this device. Export a backup before changing phones or removing the app.</p>
      <div class="settings-actions"><button data-setting-action="export">Save backup file</button><button data-setting-action="import">Import backup</button>
      <button data-setting-action="share-backup">Share backup</button><button data-setting-action="undo-import">Restore pre-import save</button></div>
      <div class="settings-planned"><strong>Google account & cloud saves</strong><span>Not connected yet</span><p>Sign-in, cloud backup, restore and cross-device progress are planned. Google cloud sync is not enabled.</p><button disabled>Connect Google account</button></div>
    </section>
    <section><h3>Purchases</h3><p>Purchases are not available in this development build. There are no paid offers.</p>
      <div class="settings-actions"><button disabled>Open store</button><button disabled>Restore purchases</button></div>
    </section>
    <section><h3>Game updates</h3><p>Downloads start only when you choose. Interrupted downloads can continue through Updates.</p>
      <button data-setting-action="updates">Open updates & recovery</button>
      <div class="settings-planned"><strong>Import a downloaded update</strong><span>Planned</span><p>Update-file import is not available yet. Use the in-app downloader.</p><button disabled>Choose update file</button></div>
    </section>
    <section><h3>Sharing & support</h3><div class="settings-actions"><button data-setting-action="share">Share game details</button><button data-setting-action="diagnostics">Share diagnostic report</button></div><p>Diagnostic reports contain build and update information, not your save or purchase receipts.</p></section>
    <details><summary>Other planned options</summary><p>Graphics quality, frame-rate controls, reduced battle effects, reduced motion, language and text size, achievements and leaderboards.</p><p>These options are not active yet.</p></details>
    <small data-settings-build></small>`;
  doc.body.appendChild(dialog);
  const $ = (s) => dialog.querySelector(s);
  const status = (text) => { $('[data-settings-status]').textContent = text; };
  const persist = async () => {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (await storage.flush() === false) throw new Error('Settings could not be saved.');
  };
  const refresh = () => {
    for (const key of ['music', 'effects']) {
      const value = Math.round(audio.settings[key] * 100);
      $(`[data-sound="${key}"]`).value = value;
      $(`[data-level="${key}"]`).value = `${value}%`;
    }
    $('[data-sound="muted"]').checked = audio.settings.muted;
    for (const key of ['haptics', 'notifications']) $(`[data-device="${key}"]`).checked = settings[key];
    $('[data-device="haptics"]').disabled = !haptics || busy;
    $('[data-device="notifications"]').disabled = !notifications || busy;
    for (const button of dialog.querySelectorAll('[data-setting-action]')) {
      const action = button.dataset.settingAction;
      button.disabled = busy || (['export', 'import'].includes(action) && !documents)
        || (['share-backup', 'diagnostics'].includes(action) && (!documents || !share))
        || (action === 'share' && !share) || (action === 'vibrate' && !haptics)
        || (action === 'notify' && (!notifications || !settings.notifications))
        || (action === 'undo-import' && !storage.getItem(IMPORT_RECOVERY_KEY));
    }
    $('[data-settings-build]').textContent = `Build ${globalThis.__ARCANE_APK_BUILD__?.id || 'browser'} · ${storage.persistenceMode}`;
  };
  const updateReminder = () => {
    if (!notifications) return Promise.resolve();
    reminderQueue = reminderQueue.catch(() => {}).then(async () => {
      await notifications.cancel({ notifications: [{ id: REMINDER_ID }] });
      if (!background || !settings.notifications) return;
      if ((await notifications.checkPermissions()).display !== 'granted') return;
      await notifications.schedule({ notifications: [{ id: REMINDER_ID, title: 'Arcane Academy',
        body: 'Your academy awaits. Return when you are ready.', channelId: 'academy-reminders',
        schedule: { at: new Date(Date.now() + 4 * 60 * 60 * 1000) } }] });
    });
    return reminderQueue;
  };
  async function snapshotFile() {
    game.save();
    if (await storage.flush() === false) throw new Error('Progress could not be saved.');
    return JSON.stringify({ game: 'Arcane Academy', schema: 1, exportedAt: new Date().toISOString(),
      build: globalThis.__ARCANE_APK_BUILD__?.id || 'browser', backup: await storage.snapshot() });
  }
  async function shareTextFile(text, backup = false) {
    const { fileUri } = await documents.prepareShare({ text, backup });
    await share.share({ title: backup ? 'Arcane Academy backup' : 'Arcane Academy diagnostics', files: [fileUri] });
  }
  async function restoreFile(file) {
    if (!canRestore()) throw new Error('Leave the battle before importing progress.');
    if (!globalThis.confirm('Replace current progress with this backup? A pre-import recovery copy will be kept.')) return;
    game.save();
    restoring = true;
    try { await replaceSaveSafely(file.backup, { storage }); }
    catch (error) { restoring = false; throw error; }
    status('Backup imported. Restarting…');
    globalThis.location.reload();
  }
  dialog.addEventListener('input', (event) => {
    const key = event.target.dataset.sound;
    if (!key) return;
    audio.configure({ [key]: key === 'muted' ? event.target.checked : Number(event.target.value) / 100 });
    refresh();
  });
  dialog.addEventListener('change', async (event) => {
    const key = event.target.dataset.device;
    if (!key || busy) return;
    busy = true;
    const requested = event.target.checked;
    refresh();
    try {
      if (key === 'notifications' && requested) {
        const permission = await notifications.requestPermissions();
        if (permission.display !== 'granted') throw new Error('Notifications are blocked. You can enable them in Android app settings.');
        await notifications.createChannel({ id: 'academy-reminders', name: 'Academy reminders', importance: 3 });
      }
      settings[key] = requested;
      await persist();
      if (key === 'notifications') {
        if (!requested) await notifications.cancel({ notifications: [{ id: REMINDER_ID }, { id: TEST_ID }] });
        await updateReminder();
      }
      if (key === 'haptics' && requested) await haptics.impact({ style: 'LIGHT' });
      status('Preference saved.');
    } catch (error) { status(error.message || 'Could not change this setting.'); }
    finally { busy = false; refresh(); }
  });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('click', async event => {
    const action = event.target.closest('[data-setting-action]')?.dataset.settingAction;
    if (!action || busy) return;
    if (action === 'close') { dialog.close(); return; }
    if (action === 'updates') {
      dialog.close(); doc.querySelector('[data-action="content-updates"]')?.click(); return;
    }
    busy = true; refresh();
    try {
      if (action === 'vibrate') { await haptics.impact({ style: 'MEDIUM' }); status('Vibration requested. Device settings can suppress it.'); }
      if (action === 'notify') {
        if ((await notifications.checkPermissions()).display !== 'granted') throw new Error('Enable notifications in Android app settings.');
        await notifications.schedule({ notifications: [{ id: TEST_ID, title: 'Arcane Academy',
          body: 'Notifications are working.', channelId: 'academy-reminders' }] });
        status('Test notification sent. Check your notification shade.');
      }
      if (action === 'export') {
        const result = await documents.exportText({ text: await snapshotFile(), name: `Arcane-Academy-${new Date().toISOString().slice(0,10)}.json` });
        status(result.cancelled ? 'Export cancelled.' : 'Backup saved to the file you selected.');
      }
      if (action === 'share-backup') { await shareTextFile(await snapshotFile(), true); status('Backup sharing opened.'); }
      if (action === 'import') {
        if (!canRestore()) throw new Error('Leave the battle before importing progress.');
        const result = await documents.importText();
        if (result.cancelled) status('Import cancelled.');
        else await restoreFile(validateSaveFile(result.text, game.saveData.version));
      }
      if (action === 'undo-import') {
        const backup = JSON.parse(storage.getItem(IMPORT_RECOVERY_KEY));
        await restoreFile(validateSaveFile(JSON.stringify({ game: 'Arcane Academy', schema: 1, backup }), game.saveData.version));
      }
      if (action === 'share') {
        await share.share({ title: 'Arcane Academy', text: `Arcane Academy — a portrait fantasy squad RPG. Development build ${globalThis.__ARCANE_APK_BUILD__?.id || 'preview'}.` });
        status('Sharing opened.');
      }
      if (action === 'diagnostics') {
        let runtime = {};
        try { runtime = await updates?.status() || {}; } catch { /* Report basic build if updater is unavailable. */ }
        await shareTextFile(JSON.stringify({ app: 'Arcane Academy', build: globalThis.__ARCANE_APK_BUILD__,
          timestamp: new Date().toISOString(), storage: storage.persistenceMode,
          runtime: { shellId: runtime.shellId, version: runtime.version, label: runtime.label, notice: runtime.notice },
          device: { userAgent: navigator.userAgent, width: innerWidth, height: innerHeight } }, null, 2));
        status('Diagnostic sharing opened.');
      }
    } catch (error) { status(error.message || 'Action could not be completed.'); }
    finally { busy = false; refresh(); }
  });
  doc.addEventListener('click', event => {
    const button = event.target.closest?.('button');
    if (!button || button.disabled) return;
    if (settings.haptics && haptics && button.dataset.settingAction !== 'vibrate') void haptics.impact({ style: 'LIGHT' }).catch(() => {});
    if (!button.matches('[data-action="game-settings"]')) return;
    refresh(); if (!dialog.open) dialog.showModal();
  });
  const lifecycle = active => {
    const changed = background === active;
    background = !active;
    audio.setHidden(!active);
    if (!active && changed && !restoring) { onSuspend(); void storage.flush(); }
    void updateReminder().catch(error => { if (dialog.open) status(error.message); });
  };
  doc.addEventListener('visibilitychange', () => lifecycle(!doc.hidden));
  if (app) {
    void app.addListener('appStateChange', ({ isActive }) => lifecycle(isActive));
    void app.addListener('backButton', () => {
      const open = [...doc.querySelectorAll('dialog[open]')].at(-1);
      if (open) {
        if (open === dialog && busy) return;
        if (open.dispatchEvent(new Event('cancel', { cancelable: true }))) open.close();
        return;
      }
      onBack();
    });
  }
  void updateReminder().catch(() => {});
  refresh();
  return dialog;
}
