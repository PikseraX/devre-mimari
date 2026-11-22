const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { createAdPolicy } = require('../adPolicy.js');

const root = path.resolve(__dirname, '..');
const pluginSrc = fs.readFileSync(path.join(root, 'node_modules', 'react-native-google-mobile-ads', 'plugin', 'build', 'index.js'), 'utf8');
const knownMatch = pluginSrc.match(/KNOWN_PLUGIN_PARAMETER_KEYS\s*=\s*\[([\s\S]*?)\]/);
const KNOWN_PLUGIN_PARAMETER_KEYS = [...knownMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1]);

test('interstitial ad policy enforces onboarding protection, 3-round threshold, and 5-minute cooldown', () => {
  let clock = 1_000_000;
  const policy = createAdPolicy({}, () => clock);

  assert.equal(policy.isEligible(), false);
  policy.recordRound();
  assert.equal(policy.isEligible(), false);
  policy.recordRound();
  assert.equal(policy.isEligible(), false);

  policy.recordRound();
  assert.equal(policy.isEligible(), true);
  policy.markShown();
  assert.equal(policy.isEligible(), false);

  policy.recordRound();
  policy.recordRound();
  policy.recordRound();
  clock += 4 * 60 * 1000;
  assert.equal(policy.isEligible(), false);

  clock += 60 * 1000;
  assert.equal(policy.isEligible(), true);
  policy.markShown();

  clock += 10 * 60 * 1000;
  policy.recordRound();
  policy.recordRound();
  assert.equal(policy.isEligible(), false);
  policy.recordRound();
  assert.equal(policy.isEligible(), true);
});

test('app.json AdMob plugin uses valid SDK v17 parameter keys and App IDs', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const entry = appJson.expo.plugins.find(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads');
  assert.ok(entry, 'react-native-google-mobile-ads plugin missing from app.json');
  const opts = entry[1];
  const known = new Set(KNOWN_PLUGIN_PARAMETER_KEYS);
  for (const key of Object.keys(opts)) {
    assert.ok(known.has(key), `Unknown AdMob plugin key: ${key}`);
  }
  assert.equal(opts.androidAppId, 'ca-app-pub-5635814061302700~1419269626');
  assert.match(opts.iosAppId, /^ca-app-pub-\d+~\d+$/);
  assert.ok(Array.isArray(opts.skAdNetworkItems) && opts.skAdNetworkItems.length > 0);
});

test('WebView bridge posts round_completed and natural_break ad events', async () => {
  const src = fs.readFileSync(path.join(root, 'generated', 'game-html.js'), 'utf8');
  const html = JSON.parse(src.match(/export default ("[\s\S]*");\s*$/)[1]);
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const context = await browser.newContext({ viewport: { width: 412, height: 915 }, offline: true });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__postedMessages = [];
      window.ReactNativeWebView = {
        postMessage(data) { window.__postedMessages.push(JSON.parse(data)); }
      };
    });
    await page.route('https://devremimari.invalid/**', route => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    await page.goto('https://devremimari.invalid/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      showWinModal(3, 50, 'Test Win');
    });
    await page.click('#btn-next-level');
    await page.waitForTimeout(100);

    const adEvents = await page.evaluate(() => window.__postedMessages.filter(m => m.type === 'ad_event').map(m => m.event));
    assert.deepEqual(adEvents, ['round_completed', 'natural_break']);

    // Verify IAP store buttons, native price sync, Watt grant, and ad-free lock
    await page.evaluate(() => {
      window.__onNativeIapState({
        adFree: false,
        busy: false,
        prices: {
          devre_reklamlari_kaldir: '₺49,99',
          devre_watt_500: '₺19,99',
          devre_watt_1500: '₺44,99',
          devre_watt_4000: '₺89,99',
        },
        message: '',
      });
    });
    const beforeWatts = await page.evaluate(() => state.totalWatt);
    await page.evaluate(() => {
      document.getElementById('btn-iap-watt-500').click();
      document.getElementById('btn-iap-restore').click();
      window.__onNativeWattGrant(500, '+500 W Enerji Paketi');
      window.__onNativeIapState({ adFree: true, busy: false, message: '✅ Reklamlar kalıcı olarak kaldırıldı!' });
    });
    const iapResult = await page.evaluate(() => ({
      watts: state.totalWatt,
      removeDisabled: document.getElementById('btn-iap-remove-ads').disabled,
      removeText: document.getElementById('btn-iap-remove-ads').textContent,
      watt500Price: document.querySelector('[data-iap-id="devre_watt_500"] .iap-price').textContent,
      iapMessages: window.__postedMessages.filter(m => m.type === 'iap'),
    }));
    assert.equal(iapResult.watts, beforeWatts + 500);
    assert.equal(iapResult.removeDisabled, true);
    assert.equal(iapResult.removeText, '✅ Aktif');
    assert.equal(iapResult.watt500Price, '₺19,99');
    assert.deepEqual(iapResult.iapMessages, [
      { type: 'iap', action: 'purchase', productId: 'devre_watt_500' },
      { type: 'iap', action: 'restore', productId: null },
    ]);

    // 1) Test Undo lock on early levels (1-25), Undo unlock at level 26+ / custom, delta badges, and onboarding tip
    const earlyUndoCheck = await page.evaluate(() => {
      state.isCustomMode = false;
      state.isDailyMode = false;
      state.isMarathonMode = false;
      state.isMeltdownMode = false;
      state.isBlitzMode = false;
      initLevel(1);
      const badge = document.getElementById('undo-badge').textContent;
      const undosLeft = state.undosLeft;
      const before00 = state.grid[0][0];
      onCellClick(0, 0);
      const afterClick00 = state.grid[0][0];
      document.getElementById('btn-undo').click();
      return { badge, undosLeft, before00, afterClick00, afterBlockedUndo00: state.grid[0][0] };
    });
    assert.equal(earlyUndoCheck.badge, '🔒26');
    assert.equal(earlyUndoCheck.undosLeft, 0);
    assert.notEqual(earlyUndoCheck.afterClick00, earlyUndoCheck.before00);
    assert.equal(earlyUndoCheck.afterBlockedUndo00, earlyUndoCheck.afterClick00);

    await page.evaluate(() => {
      state.seenMechanics = [];
      loadCustomCodeAndPlay('DM-21' + 'N1'.repeat(15));
    });
    const mechCheck = await page.evaluate(() => {
      const seenAfter = state.seenMechanics.slice();
      const statusText = document.getElementById('status-banner').textContent;
      const deltaCount = [...document.querySelectorAll('#row-targets span, #col-targets span')]
        .filter(el => /^[+-]\d+$/.test(el.textContent.trim())).length;
      const beforeGrid00 = state.grid[0][0];
      const beforeMoves = state.moves;
      const beforeUndos = state.undosLeft;
      onCellClick(0, 0);
      const afterClick00 = state.grid[0][0];
      const afterClickMoves = state.moves;
      document.getElementById('btn-undo').click();
      return {
        seenIncludes2x: seenAfter.includes('mul2'),
        statusHasTip: statusText.includes('2x'),
        deltaCount,
        beforeGrid00,
        afterClick00,
        afterUndo00: state.grid[0][0],
        beforeMoves,
        afterClickMoves,
        afterUndoMoves: state.moves,
        beforeUndos,
        afterUndoUndos: state.undosLeft,
      };
    });
    assert.equal(mechCheck.seenIncludes2x, true);
    assert.equal(mechCheck.statusHasTip, true);
    assert.ok(mechCheck.deltaCount > 0, 'Expected remaining voltage delta badges on target pods');
    assert.notEqual(mechCheck.afterClick00, mechCheck.beforeGrid00);
    assert.equal(mechCheck.afterUndo00, mechCheck.beforeGrid00);
    assert.equal(mechCheck.afterUndoMoves, mechCheck.beforeMoves);
    assert.equal(mechCheck.beforeUndos, 2);
    assert.equal(mechCheck.afterUndoUndos, 1);

    // 2) Test Rewarded Ads (fuse continue & wheel free spin)
    const rewardCheck = await page.evaluate(() => {
      window.__postedMessages = [];
      state.fuses = 0;
      state.isGameOver = true;
      state.rewardedFuseUsed = false;
      requestNativeRewardedAd('fuse');
      window.__onNativeRewardEarned('fuse');
      const fusesAfter = state.fuses;
      const gameOverAfter = state.isGameOver;

      state.wheelFreeSpins = 0;
      requestNativeRewardedAd('wheel');
      window.__onNativeRewardEarned('wheel');
      const spinsAfter = state.wheelFreeSpins;
      const rewardMsgs = window.__postedMessages.filter(m => m.type === 'rewarded_ad').map(m => m.rewardType);
      return { fusesAfter, gameOverAfter, spinsAfter, rewardMsgs };
    });
    assert.equal(rewardCheck.fusesAfter, 1);
    assert.equal(rewardCheck.gameOverAfter, false);
    assert.equal(rewardCheck.spinsAfter, 1);
    assert.deepEqual(rewardCheck.rewardMsgs, ['fuse', 'wheel']);

    // 3) Test 12-language localization modal & lossless round-trip
    const i18nCheck = await page.evaluate(() => {
      document.getElementById('btn-menu-lang').click();
      const langCount = document.querySelectorAll('#lang-list-grid button').length;
      window.DevreI18n.setLang('en');
      const enBtn = document.getElementById('btn-menu-lang').textContent;
      const enPlay = document.getElementById('btn-start-career').textContent;
      window.DevreI18n.setLang('ja');
      const jaBtn = document.getElementById('btn-menu-lang').textContent;
      const jaPlay = document.getElementById('btn-start-career').textContent;
      window.DevreI18n.setLang('zh-CN');
      const zhBtn = document.getElementById('btn-menu-lang').textContent;
      window.DevreI18n.setLang('tr');
      const trBtn = document.getElementById('btn-menu-lang').textContent;
      const trPlay = document.getElementById('btn-start-career').textContent;
      return { langCount, enBtn, enPlay, jaBtn, jaPlay, zhBtn, trBtn, trPlay };
    });
    assert.equal(i18nCheck.langCount, 12);
    assert.equal(i18nCheck.enBtn, '🌐 EN');
    assert.match(i18nCheck.enPlay, /CONNECT TO GRID/);
    assert.equal(i18nCheck.jaBtn, '🌐 JA');
    assert.match(i18nCheck.jaPlay, /グリッドに接続/);
    assert.equal(i18nCheck.zhBtn, '🌐 ZH');
    assert.equal(i18nCheck.trBtn, '🌐 TR');
    assert.match(i18nCheck.trPlay, /ŞEBEKEYE BAĞLAN/);

    // 4) Test Haptics, High Contrast, Streak Freeze, 2x Rewarded Video, and Era 3 Unlock Modal
    const extraCheck = await page.evaluate(() => {
      window.__postedMessages = [];
      state.hapticsEnabled = true;
      triggerHaptic('light');
      const hapticCountOn = window.__postedMessages.filter(m => m.type === 'haptic').length;
      document.getElementById('btn-toggle-haptics').click();
      window.__postedMessages = [];
      triggerHaptic('light');
      const hapticCountOff = window.__postedMessages.filter(m => m.type === 'haptic').length;

      // High Contrast toggle
      document.getElementById('btn-toggle-contrast').click();
      const contrastOn = document.body.classList.contains('high-contrast');

      // Streak Freeze: buy + rewarded + preserve streak on lose
      state.totalWatt = 200;
      state.streakFreezes = 0;
      document.getElementById('btn-buy-streak-freeze').click();
      const freezesAfterBuy = state.streakFreezes;
      const wattAfterBuy = state.totalWatt;
      window.__onNativeRewardEarned('streak_freeze');
      const freezesAfterReward = state.streakFreezes;
      state.streak = 7;
      state.isCustomMode = false;
      showLoseModal('Test');
      const streakPreserved = state.streak;
      const freezesAfterLose = state.streakFreezes;

      // 2x Rewarded Video on Win
      const beforeDoubleWatt = state.totalWatt;
      showWinModal(3, 25, 'Win');
      const doubleVisibleBefore = !document.getElementById('btn-reward-double').classList.contains('hidden');
      window.__onNativeRewardEarned('double_watt');
      const afterDoubleWatt = state.totalWatt;
      const doubleVisibleAfter = !document.getElementById('btn-reward-double').classList.contains('hidden');

      // Era 3 Unlock Modal (Level 26)
      document.getElementById('main-menu-overlay').classList.add('hidden');
      document.getElementById('result-modal').classList.add('hidden');
      state.seenEras = [1];
      initLevel(26);
      const eraModalOpen = !document.getElementById('era-unlock-modal').classList.contains('hidden');
      const eraBonusVisible = !document.getElementById('era-unlock-bonus').classList.contains('hidden');
      document.getElementById('btn-close-era-unlock').click();
      initLevel(27);
      const eraModalReopened = !document.getElementById('era-unlock-modal').classList.contains('hidden');

      return {
        hapticCountOn, hapticCountOff, contrastOn,
        freezesAfterBuy, wattAfterBuy, freezesAfterReward,
        streakPreserved, freezesAfterLose,
        doubleVisibleBefore, wattGainFromDouble: afterDoubleWatt - beforeDoubleWatt, doubleVisibleAfter,
        eraModalOpen, eraBonusVisible, eraModalReopened
      };
    });
    assert.ok(extraCheck.hapticCountOn >= 1);
    assert.equal(extraCheck.hapticCountOff, 0);
    assert.equal(extraCheck.contrastOn, true);
    assert.equal(extraCheck.freezesAfterBuy, 1);
    assert.equal(extraCheck.wattAfterBuy, 50);
    assert.equal(extraCheck.freezesAfterReward, 2);
    assert.equal(extraCheck.streakPreserved, 7);
    assert.equal(extraCheck.freezesAfterLose, 1);
    assert.equal(extraCheck.doubleVisibleBefore, true);
    assert.equal(extraCheck.wattGainFromDouble, 25);
    assert.equal(extraCheck.doubleVisibleAfter, false);
    assert.equal(extraCheck.eraModalOpen, true);
    assert.equal(extraCheck.eraBonusVisible, true);
    assert.equal(extraCheck.eraModalReopened, false);

    // 5) Test Quick-Zero (forcedDir='zero'), Ambient Toggle, Career Stats, and Weekly 5-Stage Challenge
    const new4Check = await page.evaluate(() => {
      // Quick-zero
      loadCustomCodeAndPlay('DM-N2' + 'N1'.repeat(15));
      onCellClick(0, 0, null, 1); // 0 -> 1
      onCellClick(0, 0, null, 1); // 1 -> 2
      const valBeforeZero = state.grid[0][0];
      onCellClick(0, 0, null, 'zero');
      const valAfterZero = state.grid[0][0];

      // Ambient toggle & Career Stats
      state.totalLevelsSolved = 10;
      state.totalThreeStars = 7;
      state.bestStreak = 5;
      document.getElementById('btn-open-account').click();
      const statSolved = document.getElementById('stat-solved').textContent;
      const statRate = document.getElementById('stat-3star-rate').textContent;
      const beforeAmbient = state.ambientEnabled;
      document.getElementById('btn-toggle-ambient').click();
      const afterAmbient = state.ambientEnabled;
      document.getElementById('btn-toggle-ambient').click(); // restore off
      document.getElementById('btn-close-account').click();

      // Weekly 5-Stage Challenge
      document.getElementById('btn-start-weekly').click();
      const weeklyActive = state.isWeeklyMode;
      const weeklyBadge = document.getElementById('level-badge').textContent;
      const weeklyUndoUnlocked = isUndoUnlocked();
      // Simulate Stage 5 win
      state.weeklyStage = 5;
      state.weeklyCompletedKey = '';
      const beforeWeeklyWatt = state.totalWatt;
      const beforeWeeklyHints = state.tools.hint;
      for (let r = 0; r < state.gridSize; r++) {
        for (let c = 0; c < state.gridSize; c++) {
          state.grid[r][c] = state.solutionGrid[r][c];
        }
      }
      state.acPhase = (state.minMoves % 2 === 0) ? 1 : -1;
      checkWinCondition();
      return {
        valBeforeZero,
        valAfterZero,
        statSolved,
        statRate,
        beforeAmbient,
        afterAmbient,
        weeklyActive,
        weeklyBadge,
        weeklyUndoUnlocked,
        weeklyWattGain: state.totalWatt - beforeWeeklyWatt,
        weeklyHintGain: state.tools.hint - beforeWeeklyHints,
        weeklyDoneKey: state.weeklyCompletedKey === getCurrentWeekKey(),
      };
    });
    assert.equal(new4Check.valBeforeZero, 2);
    assert.equal(new4Check.valAfterZero, 0);
    assert.equal(new4Check.statSolved, '10');
    assert.equal(new4Check.statRate, '%70');
    assert.equal(new4Check.beforeAmbient, false);
    assert.equal(new4Check.afterAmbient, true);
    assert.equal(new4Check.weeklyActive, true);
    assert.equal(new4Check.weeklyBadge, '🏆 HAFTALIK (1/5)');
    assert.equal(new4Check.weeklyUndoUnlocked, true);
    assert.ok(new4Check.weeklyWattGain >= 120);
    assert.equal(new4Check.weeklyHintGain, 1);
    assert.equal(new4Check.weeklyDoneKey, true);

    await context.close();
  } finally {
    await browser.close();
  }
});
