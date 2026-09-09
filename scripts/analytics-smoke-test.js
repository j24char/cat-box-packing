// Smoke tests for the pure analytics logic + plist parser (PRD §7).
//
// Usage: node scripts/analytics-smoke-test.js
// (compiles the pure TS modules to .build-test/ then runs assertions)

const { execSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, '.build-test');

execSync(
  `npx tsc src/services/firebaseConfig.ts src/services/analytics/analyticsTypes.ts --ignoreConfig --outDir "${buildDir}" --module commonjs --target es2020 --skipLibCheck`,
  { cwd: root, stdio: 'inherit' }
);

const assert = require('node:assert/strict');
const { parsePlistConfig } = require(path.join(buildDir, 'firebaseConfig.js'));
const {
  createInitialState,
  computeSnapshot,
  mergeLevelSample,
  addDaysToKey,
  toDateKey,
} = require(path.join(buildDir, 'analytics', 'analyticsTypes.js'));

// 1. plist parser reads Firebase info
const cfg = parsePlistConfig(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>API_KEY</key>
	<string>AIzaSyDdTbd1DV7kUIj_uuCyjA7s32pwGzSKZUM</string>
	<key>GCM_SENDER_ID</key>
	<string>770686235964</string>
	<key>BUNDLE_ID</key>
	<string>com.j24char.catboxpacking</string>
	<key>PROJECT_ID</key>
	<string>catboxpacking</string>
	<key>STORAGE_BUCKET</key>
	<string>catboxpacking.firebasestorage.app</string>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
</dict>
</plist>`);
assert.equal(cfg.apiKey, 'AIzaSyDdTbd1DV7kUIj_uuCyjA7s32pwGzSKZUM');
assert.equal(cfg.projectId, 'catboxpacking');
assert.equal(cfg.gcmSenderId, '770686235964');
assert.equal(cfg.analyticsEnabled, false);
assert.equal(JSON.stringify(cfg.storageBucket), '"catboxpacking.firebasestorage.app"');
console.log('PASS plist parser');

// 2. initial state + dates
const now = Date.parse('2026-09-01T12:00:00');
const st = createInitialState('aaaa-bbbb-cccc-dddd', now);
assert.equal(toDateKey(now), '2026-09-01');
assert.equal(addDaysToKey('2026-09-01', 7), '2026-09-08');
assert.equal(addDaysToKey('2026-09-01', 14), '2026-09-15');

// 3. level aggregation min/max/avg
const level0 = { attempts: 0, completions: 0, interactionsSum: 0, interactionsMin: null, interactionsMax: null, durationsSum: 0, durationsMin: null, durationsMax: null };
mergeLevelSample(level0, { interactions: 5, completed: true, durationSec: 120 });
mergeLevelSample(level0, { interactions: 8, completed: true, durationSec: 60 });
mergeLevelSample(level0, { interactions: 2, completed: false, durationSec: null });
assert.equal(level0.attempts, 3);
assert.equal(level0.completions, 2);
assert.equal(level0.interactionsMin, 2);
assert.equal(level0.interactionsMax, 8);
assert.equal(level0.interactionsSum, 15);
assert.equal(level0.durationsMin, 60);
assert.equal(level0.durationsMax, 120);

// 4. snapshot computation
st.sessions = [30, 120, 90];
st.levels['1'] = level0;
st.firstActiveDate = '2026-09-01';
st.activeDates['2026-09-01'] = 1;
st.activeDates['2026-09-02'] = 1;
const snap = computeSnapshot(st, Date.parse('2026-09-02T12:00:00'));
assert.equal(snap.sessionCount, 3);
assert.equal(snap.sessionDurationMinSec, 30);
assert.equal(snap.sessionDurationMaxSec, 120);
assert.equal(snap.sessionDurationAvgSec, 80);
assert.equal(snap.levelsCompleted, 2);
assert.equal(snap.levelStats[0].interactionsAvg, 5);
assert.equal(snap.levelStats[0].interactionsMin, 2);
assert.equal(snap.levelStats[0].interactionsMax, 8);
assert.equal(snap.levelStats[0].durationAvg, 90);

// 5. retention
console.log('D1=', snap.retention.d1, 'D2=', snap.retention.d2, 'D7=', snap.retention.d7);
assert.equal(snap.retention.d1, true);
assert.equal(snap.retention.d2, false);
assert.equal(snap.retention.d7, false);
assert.equal(snap.retention.d1Mature, true);
assert.equal(snap.retention.d2Mature, false);

console.log('ALL ANALYTICS SMOKE TESTS PASSED');