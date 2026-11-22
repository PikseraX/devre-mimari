const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../generated/game-html.js'), 'utf8');
const html = JSON.parse(source.slice(source.indexOf('export default ') + 15).trim().replace(/;$/, ''));
// Exercise the actual source builder used by App, including replacement-string handling.
const app = fs.readFileSync(path.join(__dirname, '../App.js'), 'utf8');
const builderStart = app.indexOf('    const data = JSON.stringify(initialSave)');
const builderEnd = app.indexOf('\n  }, [initialSave]);', builderStart);
assert.ok(builderStart >= 0 && builderEnd > builderStart);
const buildNativeSource = Function('gameHtml', 'initialSave', app.slice(builderStart, builderEnd));

test('custom codes reject malformed input without changing the active game', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const { page, errors } = await openGame(browser);
    const results = await page.evaluate(() => {
      state.isBlitzMode = true;
      initLevel(1);
      startBlitzTimer();
      const before = JSON.stringify(state);
      const timer = blitzInterval;
      const valid = 'DM-' + 'N1'.repeat(16);
      const invalid = [valid + 'EXTRA', valid.slice(0, -1), 'DM-' + 'Q1'.repeat(16),
        'DM-' + 'N9'.repeat(16), 'DM-' + 'N?'.repeat(16), 'XX-' + 'N1'.repeat(16), 'DM-' + 'N0'.repeat(16)];
      return invalid.map(code => {
        loadCustomCodeAndPlay(code);
        return { unchanged: JSON.stringify(state) === before && blitzInterval === timer,
          rejected: !document.getElementById('custom-code-feedback').classList.contains('hidden') };
      });
    });
    for (const result of results) assert.deepEqual(result, { unchanged: true, rejected: true });
    const accepted = await page.evaluate(() => {
      initEditor();
      const editorCode = document.getElementById('editor-share-code').value;
      loadCustomCodeAndPlay('  ' + editorCode.toLowerCase() + '  ');
      return { custom: state.isCustomMode, code: state.customShareCode, editorCode, size: state.gridSize };
    });
    assert.equal(accepted.custom, true);
    assert.equal(accepted.code, accepted.editorCode);
    assert.equal(accepted.size, 4);
    for (const type of ['N', 'X', 'F', '2', '3', 'M', 'A', 'T', 'S', 'I']) {
      const result = await page.evaluate(type => {
        const code = 'DM-' + type + '1' + 'N1'.repeat(15);
        loadCustomCodeAndPlay(code);
        return state.customShareCode === code && state.isCustomMode;
      }, type);
      assert.equal(result, true, type);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('legacy restore has the same result in a fresh and populated profile', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const clean = await openGame(browser);
    const dirty = await openGame(browser);
    await dirty.page.evaluate(() => {
      state.tools = { hint: 99, repair: 88, boost: 77 };
      state.hardwareOwned = { hw_fuse: true };
      state.themesOwned = { default: true, gold: true };
      state.activeTheme = 'gold';
      state.wheelFreeSpins = 9;
      state.unlockedBadges = { 40: true };
      state.quests.endgame.forEach(q => { q.claimed = true; });
      sfx.enabled = false;
    });
    const restore = async page => page.evaluate(() => {
      const code = 'DMBK-' + btoa(unescape(encodeURIComponent(JSON.stringify({ b: 12, w: 345, n: 'Eski kayıt', st: { 1: 3 } }))));
      return { ok: restoreBackupCode(code), saved: JSON.parse(window.__nativeSave) };
    });
    const first = await restore(clean.page), second = await restore(dirty.page);
    assert.equal(first.ok, true);
    assert.deepEqual(second, first);
    assert.deepEqual(second.saved.tools, { hint: 2, repair: 2, boost: 1 });
    assert.deepEqual(second.saved.hardwareOwned, {});
    assert.equal(second.saved.activeTheme, 'default');
    assert.equal(second.saved.soundEnabled, true);
    const explicit = await dirty.page.evaluate(() => {
      const payload = { ...buildSavePayload(), tools: { hint: 0, repair: 0, boost: 0 },
        wheelFreeSpins: 0, mysteryFreeAvailable: false, soundEnabled: false, totalWatt: 0 };
      return { ok: restoreBackupCode('DMBK-' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))))), saved: JSON.parse(window.__nativeSave) };
    });
    assert.equal(explicit.ok, true);
    assert.equal(explicit.saved.totalWatt, 0);
    assert.equal(explicit.saved.wheelFreeSpins, 0);
    assert.equal(explicit.saved.mysteryFreeAvailable, false);
    assert.equal(explicit.saved.soundEnabled, false);
    assert.deepEqual(explicit.saved.tools, { hint: 0, repair: 0, boost: 0 });
    assert.deepEqual([...clean.errors, ...dirty.errors], []);
  } finally { await browser.close(); }
});

test('first mystery chest after midnight is free and remains claimed after restart', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const { page, errors } = await openGame(browser, null, '2026-11-19T23:59:00+03:00');
    await page.evaluate(() => { state.mysteryFreeAvailable = false; state.totalWatt = 150; Math.random = () => 0; });
    await page.clock.setSystemTime(new Date('2026-11-20T00:01:00+03:00'));
    const first = await page.evaluate(() => {
      document.getElementById('btn-open-mystery').click();
      return JSON.parse(window.__nativeSave);
    });
    assert.equal(first.totalWatt, 150);
    assert.equal(first.tools.hint, 3);
    assert.equal(first.mysteryFreeAvailable, false);
    assert.equal(first.lastDailyResetDate, '2026-11-20');
    const restarted = await openGame(browser, JSON.stringify(first), '2026-11-20T00:02:00+03:00');
    const second = await restarted.page.evaluate(() => {
      Math.random = () => 0;
      document.getElementById('btn-open-mystery').click();
      return JSON.parse(window.__nativeSave);
    });
    assert.equal(second.totalWatt, 55);
    assert.equal(second.tools.hint, 4);
    assert.equal(second.mysteryFreeAvailable, false);
    assert.deepEqual([...errors, ...restarted.errors], []);
  } finally { await browser.close(); }
});

test('backup quest titles remain text after import and reload', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const { page, errors } = await openGame(browser);
    const title = '<img src="data:image/png;base64,broken" onerror="window.auditMarker=42"> & "Görev"';
    const result = await page.evaluate(title => {
      const payload = buildSavePayload();
      for (const group of ['daily', 'weekly', 'endgame']) payload.quests[group][0].title = title;
      const accepted = restoreBackupCode('DMBK-' + btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
      return { accepted, saved: window.__nativeSave };
    }, title);
    assert.equal(result.accepted, true);
    const reopened = await openGame(browser, result.saved);
    for (const current of [page, reopened.page]) {
      for (const group of ['daily', 'weekly', 'endgame']) {
        await current.evaluate(group => { state.activeQuestTab = group; renderQuestsList(); }, group);
        assert.ok((await current.locator('#quest-list-container').textContent()).includes(title));
        assert.equal(await current.locator('#quest-list-container img').count(), 0);
        assert.equal(await current.evaluate(() => window.auditMarker), undefined);
      }
    }
    assert.deepEqual([...errors, ...reopened.errors], []);
  } finally { await browser.close(); }
});

test('wheel persists payment and prize together, including interrupted spins', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    for (const free of [false, true]) for (let prize = 0; prize < 5; prize++) {
      const { page, errors } = await openGame(browser);
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      const result = await page.evaluate(({ free, prize }) => {
        state.totalWatt = 200;
        state.wheelFreeSpins = free ? 1 : 0;
        sfx.enabled = false;
        Math.random = () => (prize + 0.1) / 5;
        document.getElementById('btn-spin-wheel').click();
        const committed = window.__nativeSave;
        document.getElementById('btn-spin-wheel').click();
        // AppState saves the intermediate screen state when backgrounded.
        saveProgress();
        return { committed, backgrounded: window.__nativeSave };
      }, { free, prize });
      assert.equal(result.backgrounded, result.committed, 'second tap/background cannot charge or reward twice');
      const saved = JSON.parse(result.committed);
      const expectedWatt = (free ? 200 : 80) + (prize === 0 ? 60 : prize === 1 ? 120 : 0);
      const expectedTools = { hint: 2 + (prize === 2 ? 1 : 0), repair: 2 + (prize === 3 ? 1 : 0), boost: 1 + (prize === 4 ? 1 : 0) };
      assert.equal(saved.totalWatt, expectedWatt);
      assert.equal(saved.wheelFreeSpins, 0);
      assert.deepEqual(saved.tools, expectedTools);
      const reopened = await openGame(browser, result.committed);
      assert.deepEqual(await reopened.page.evaluate(() => [state.totalWatt, state.tools, state.wheelFreeSpins, state.isWheelSpinning]), [expectedWatt, expectedTools, 0, false]);
      await page.clock.runFor(800);
      assert.deepEqual(await page.evaluate(() => [state.totalWatt, state.tools, state.isWheelSpinning]), [expectedWatt, expectedTools, false]);
      assert.deepEqual([...errors, ...reopened.errors], []);
      await page.close();
      await reopened.page.close();
    }
    const { page } = await openGame(browser);
    const denied = await page.evaluate(() => {
      state.totalWatt = 119;
      state.wheelFreeSpins = 0;
      document.getElementById('btn-spin-wheel').click();
      return { watt: state.totalWatt, tools: state.tools, spinning: state.isWheelSpinning, writes: messages.length };
    });
    assert.deepEqual(denied, { watt: 119, tools: { hint: 2, repair: 2, boost: 1 }, spinning: false, writes: 0 });
  } finally { await browser.close(); }
});

async function openGame(browser, saved = null, date = null) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Europe/Istanbul' });
  if (date) await page.clock.install({ time: new Date(date) });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { html: nativeHtml } = buildNativeSource(html, saved);
  await page.setContent(nativeHtml.replace('<head>', () => '<head><script>window.messages=[];window.ReactNativeWebView={postMessage:value=>messages.push(JSON.parse(value))};</script>'), { waitUntil: 'load' });
  return { page, errors };
}

test('offline mobile game, persistence bridge, clipboard and background timer', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**/*', route => { requests.push(route.request().url()); return route.abort(); });
    const boot = `<script>window.messages=[]; window.ReactNativeWebView={postMessage:value=>messages.push(JSON.parse(value))}; window.__nativeSave=JSON.stringify({bestLevel:42,totalWatt:321});</script>`;
    await page.setContent(html.replace('<head>', '<head>' + boot), { waitUntil: 'load' });
    assert.equal(await page.evaluate(() => state.bestLevel), 42);
    assert.equal(await page.evaluate(() => state.totalWatt), 321);
    assert.equal(await page.locator('#btn-start-career').isVisible(), true);
    await page.locator('#btn-start-career').click();
    assert.equal(await page.evaluate(() => document.getElementById('main-menu-overlay').classList.contains('hidden')), true);
    assert.ok(await page.locator('.socket-cell').count() > 0);
    const dimensions = await page.locator('#board-wrapper').boundingBox();
    assert.ok(dimensions.width <= 390 && dimensions.x >= -1, 'board fits phone');
    await page.evaluate(() => { state.totalWatt = 777; saveProgress(); copyTextSafe('DM-test'); });
    const messages = await page.evaluate(() => window.messages);
    assert.equal(JSON.parse(messages.filter(m => m.type === 'save').at(-1).value).totalWatt, 777);
    assert.equal(messages.find(m => m.type === 'copy').value, 'DM-test');
    await page.evaluate(() => { window.__nativePaused = true; state.blitzTimeLeft = 60; startBlitzTimer(); });
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => state.blitzTimeLeft), 60);
    await page.evaluate(() => { clearInterval(blitzInterval); window.dispatchEvent(new PopStateEvent('popstate')); });
    assert.equal(await page.locator('#main-menu-overlay').isVisible(), true);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.locator('#btn-start-career').click();
    assert.ok((await page.locator('#board-wrapper').boundingBox()).width <= 768, 'board fits tablet');
    assert.deepEqual(requests, [], 'no external runtime requests');
    assert.deepEqual(errors, [], 'no browser errors');
  } finally { await browser.close(); }
});

test('backup validation, rollback and successful restoration', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const { page, errors } = await openGame(browser);
    const result = await page.evaluate(() => {
      state.totalWatt = 987;
      state.playerName = 'Korunacak kayıt';
      saveProgress();
      const before = JSON.stringify(buildSavePayload());
      const savedBefore = window.__nativeSave;
      const writesBefore = messages.length;
      const backup = value => 'DMBK-' + btoa(unescape(encodeURIComponent(JSON.stringify(value))));
      const valid = buildSavePayload();
      const invalid = [null, [], {}, { ...valid, quests: { daily: {} } },
        { ...valid, quests: { endgame: [null] } },
        { ...valid, quests: { daily: [{ ...valid.quests.daily[0], target: 0 }] } },
        { ...valid, tools: { hint: '2' } }, { ...valid, levelStars: { 1: 4 } },
        { ...valid, totalWatt: -1 }, { ...valid, hardwareOwned: [] },
        { ...valid, activeTheme: 'two classes' }, { ...valid, playerName: {} }];
      const rejected = invalid.map(value => ({
        ok: restoreBackupCode(backup(value)),
        unchanged: JSON.stringify(buildSavePayload()) === before && window.__nativeSave === savedBefore && messages.length === writesBefore,
      }));
      // A rendering failure must roll back the applied state without a disk write.
      const realRender = renderMainMenu;
      renderMainMenu = () => { throw new Error('simulated rendering failure'); };
      const failed = restoreBackupCode(backup({ ...valid, totalWatt: 123, soundEnabled: !sfx.enabled }));
      renderMainMenu = realRender;
      const rollback = !failed && JSON.stringify(buildSavePayload()) === before && window.__nativeSave === savedBefore && messages.length === writesBefore;
      const ok = restoreBackupCode(backup({ ...valid, bestLevel: 42, totalWatt: 654, playerName: 'Yüklenen mühendis' }));
      return { rejected, rollback, ok, saved: window.__nativeSave };
    });
    assert.equal(result.rejected.length, 12);
    for (const value of result.rejected) assert.deepEqual(value, { ok: false, unchanged: true });
    assert.equal(result.rollback, true);
    assert.equal(result.ok, true);
    const reloaded = await openGame(browser, result.saved);
    assert.deepEqual(await reloaded.page.evaluate(() => [state.bestLevel, state.totalWatt, state.playerName]), [42, 654, 'Yüklenen mühendis']);
    assert.deepEqual([...errors, ...reloaded.errors], []);
    const legacy = await openGame(browser, JSON.stringify({ b: 12, w: 345, n: 'Eski kayıt', st: { 1: 3 } }));
    assert.deepEqual(await legacy.page.evaluate(() => [state.bestLevel, state.totalWatt, state.playerName, state.totalStars]), [12, 345, 'Eski kayıt', 3]);
    assert.deepEqual(legacy.errors, []);
  } finally { await browser.close(); }
});

test('native startup preserves dollar patterns and HTML-like names', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    for (const name of ['Normal', '$&', "$'", '$`', '$$', '</script><script>window.injected=true</script>', 'Türkçe İsim 😀']) {
      const { page, errors } = await openGame(browser, JSON.stringify({ bestLevel: 1, playerName: name }));
      assert.equal(await page.evaluate(() => state.playerName), name);
      assert.equal(await page.locator('#menu-player-name').textContent(), name);
      assert.equal(await page.evaluate(() => window.injected), undefined);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
});

test('midnight and week rollover retain the first win in career and meltdown', async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    for (const mode of ['career', 'meltdown']) {
      const { page, errors } = await openGame(browser, null, '2026-11-22T23:59:00+03:00');
      await page.evaluate(mode => {
        state.quests.daily.forEach(q => { q.progress = q.target; q.claimed = true; });
        state.quests.weekly.forEach(q => { q.progress = q.target; q.claimed = true; });
        state.isMeltdownMode = mode === 'meltdown';
        initLevel(1);
      }, mode);
      await page.clock.setSystemTime(new Date('2026-11-23T00:01:00+03:00'));
      const result = await page.evaluate(() => {
        state.grid = state.solutionGrid.map(row => [...row]);
        state.moves = state.minMoves;
        checkWinCondition();
        return {
          day: state.lastDailyResetDate,
          week: state.lastWeeklyResetKey,
          daily: state.quests.daily.find(q => q.type === 'solve'),
          weekly: state.quests.weekly.find(q => q.type === 'solve'),
          saved: JSON.parse(window.__nativeSave),
        };
      });
      assert.equal(result.day, '2026-11-23');
      assert.equal(result.week, '2026-W48');
      for (const q of [result.daily, result.weekly]) {
        assert.equal(q.progress, 1);
        assert.equal(q.claimed, false);
      }
      assert.equal(result.saved.quests.daily.find(q => q.type === 'solve').progress, 1);
      assert.equal(result.saved.quests.weekly.find(q => q.type === 'solve').progress, 1);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
});
