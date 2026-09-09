// Integration test for the full analytics service (PRD §7) with mocked
// AsyncStorage and a stubbed Firebase REST network layer.
//
// Usage: node scripts/analytics-integration-test.js

const { execSync } = require('node:child_process');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, '.build-test');

// Compile the pure TS modules into .build-test for direct require() testing.
execSync(
  `npx tsc src/services/firebaseConfig.ts src/services/analytics/analyticsTypes.ts src/services/analytics/analyticsStore.ts src/services/analytics/firebaseClient.ts src/services/analytics/index.ts --ignoreConfig --outDir "${buildDir}" --module commonjs --target es2020 --skipLibCheck`,
  { cwd: root, stdio: 'inherit' }
);

// Provide a mocked @react-native-async-storage/async-storage for the compiled
// modules to resolve (strictest path wins in Node's module resolution).
const mockDir = path.join(buildDir, 'node_modules', '@react-native-async-storage', 'async-storage');
fs.mkdirSync(mockDir, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'mocks', 'async-storage.js'), path.join(mockDir, 'index.js'));

// --- Stub the global fetch so no real network happens -----------------------
const calls = [];
globalThis.fetch = async (url, init) => {
  calls.push({ url, init });
  const body = JSON.parse(init.body || '{}');
  if (url.includes('identitytoolkit.googleapis.com')) {
    return {
      status: 200,
      text: async () => JSON.stringify({
        localId: 'anon-user-123',
        idToken: 'fake-id-token',
        refreshToken: 'fake-refresh',
        expiresIn: '3600',
      }),
    };
  }
  if (url.includes('securetoken.googleapis.com')) {
    return {
      status: 200,
      text: async () => JSON.stringify({
        id_token: 'refreshed-fake-token',
        refresh_token: 'fake-refresh',
        expires_in: '3600',
      }),
    };
  }
  if (url.includes('firestore.googleapis.com')) {
    return { status: 200, text: async () => '{}' };
  }
  throw new Error(`unexpected url: ${url}`);
};

const { analytics } = require(path.join(buildDir, 'analytics', 'index.js'));

const run = async () => {
  // Fresh install
  await analytics.prepare();
  const before = await analytics.getSnapshot();
  assert.ok(before.installationId.length > 0, 'installation id generated');
  const installationId = before.installationId;

  // Simulate 3 sessions
  for (let i = 0; i < 3; i += 1) {
    await analytics.startSession();
    await analytics.touch();
    await analytics.endSession();
  }

  const afterSessions = await analytics.getSnapshot();
  assert.equal(afterSessions.sessionCount, 3, 'session count');
  assert.ok(afterSessions.sessionDurationMinSec >= 1, 'min duration');
  assert.ok(afterSessions.sessionDurationMaxSec >= afterSessions.sessionDurationMinSec);

  // Level progress: level 1 two attempts, one completed
  await analytics.beginLevelAttempt(1);
  await analytics.trackInteraction('drag');
  await analytics.trackInteraction('drop');
  await analytics.trackInteraction('rotate');
  await analytics.completeLevel(1, 90);

  await analytics.beginLevelAttempt(1);
  await analytics.trackInteraction('drag');
  await analytics.trackInteraction('drag');
  await analytics.trackInteraction('drop');
  await analytics.trackInteraction('rotate');
  await analytics.trackInteraction('drop');
  await analytics.endLevelAttempt({ completed: false });

  // Level 2 one attempt, completed quickly
  await analytics.beginLevelAttempt(2);
  await analytics.trackInteraction('drag');
  await analytics.trackInteraction('drag');
  await analytics.trackInteraction('drop');
  await analytics.completeLevel(2, 45);

  const snap = await analytics.getSnapshot();
  assert.equal(snap.levelsCompleted, 2, 'levels completed');
  const level1 = snap.levelStats.find((l) => l.levelId === 1);
  assert.ok(level1, 'level 1 stats exist');
  assert.equal(level1.attempts, 2, 'level 1 attempts');
  assert.equal(level1.completions, 1, 'level 1 completions');
  assert.equal(level1.interactionsMin, 3, 'level 1 min interactions');
  assert.equal(level1.interactionsMax, 5, 'level 1 max interactions');
  assert.equal(level1.interactionsAvg, 4, 'level 1 avg interactions');
  assert.equal(level1.durationMin, 90, 'level 1 min duration');
  assert.equal(level1.durationMax, 90, 'level 1 max duration');

  const level2 = snap.levelStats.find((l) => l.levelId === 2);
  assert.equal(level2.interactionsMin, 3, 'level 2 interactions');
  assert.equal(level2.durationMax, 45, 'level 2 duration');

  // Flush: expect a Firestore write plus an anonymous sign-in/refresh
  const result = await analytics.flush();
  assert.ok(result.ok, `flush ok (${result.error})`);
  assert.ok(result.syncedAtMs != null, 'syncedAtMs set');
  const signedAfterFlush = await analytics.getSnapshot();
  assert.equal(signedAfterFlush.pendingChanges, 0, 'pending changes cleared after sync');

  const firestoreCalls = calls.filter((c) => c.url.includes('firestore.googleapis.com'));
  assert.ok(firestoreCalls.length >= 1, 'firestore push attempted');
  const pushed = JSON.parse(firestoreCalls[0].init.body);
  const doc = pushed.writes[0].document;
  assert.ok(doc.name.includes('catBoxAnalytics'), 'correct collection');
  const fields = doc.fields;
  assert.equal(fields.installationId.stringValue, installationId, 'installation id in payload');
  assert.equal(fields.sessionCount.integerValue, 3, 'session count in payload');
  assert.equal(fields.levelsCompleted.integerValue, 2, 'completions in payload');
  assert.equal(fields.levelStats.arrayValue.values.length, 2, 'per-level stats in payload');
  assert.ok(doc.fields.activeDates.mapValue, 'active dates map present');
  assert.ok(doc.fields.retention.mapValue, 'retention map present');

  // Retention: sessions started today => D1..D30 not yet mature
  assert.equal(snap.retention.firstActiveDate != null, true);
  assert.equal(snap.retention.d1Mature, false, 'd1 not mature yet');

  // Persistence: a fresh service instance reads the same installation
  const { analytics: second } = require(path.join(buildDir, 'analytics', 'index.js'));
  const reloaded = await second.getSnapshot();
  assert.equal(reloaded.installationId, installationId, 'installation id persisted');

  console.log('ALL ANALYTICS INTEGRATION TESTS PASSED');
};

run().catch((error) => {
  console.error('INTEGRATION TEST FAILED:', error);
  process.exitCode = 1;
});