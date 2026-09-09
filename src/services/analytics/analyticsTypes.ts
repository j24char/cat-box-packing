/**
 * Pure types, date helpers and aggregation logic for the anonymous analytics
 * engine. This module has NO dependency on React Native / AsyncStorage so it
 * can be unit-tested in isolation.
 */

export const DAY_MS = 86_400_000;
export const MAX_SESSION_HISTORY = 1000;
export const APP_VERSION = '1.0.0';

const pad2 = (n: number): string => (n < 10 ? '0' : '') + n;

/** Local-timezone calendar date key `YYYY-MM-DD`. */
export const toDateKey = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** Shift a `YYYY-MM-DD` key by `days` (may be negative). */
export const addDaysToKey = (key: string, days: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days, 12, 0, 0).getTime());
};

/** Milliseconds at noon local time for a `YYYY-MM-DD` key. */
export const dateKeyToMs = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
};

/** The physics-level interactions the PRD cares about: drag & drop, rotate. */
export type InteractionKind = 'drag' | 'drop' | 'rotate';

export interface LevelAnalytics {
  /** Number of level sessions / attempts opened. */
  attempts: number;
  /** Number of successful completions. */
  completions: number;
  /** Sum of interactions across all attempts (avg = sum / attempts). */
  interactionsSum: number;
  interactionsMin: number | null;
  interactionsMax: number | null;
  /** Completion durations (seconds) for min/max/avg reporting. */
  durationsSum: number;
  durationsMin: number | null;
  durationsMax: number | null;
}

export const emptyLevelAnalytics = (): LevelAnalytics => ({
  attempts: 0,
  completions: 0,
  interactionsSum: 0,
  interactionsMin: null,
  interactionsMax: null,
  durationsSum: 0,
  durationsMin: null,
  durationsMax: null,
});

export interface CurrentAttempt {
  levelId: number;
  startedAtMs: number;
  interactions: number;
}

export interface AnalyticsState {
  version: 1;
  installationId: string;
  createdAtMs: number;
  /** Finished app session durations in seconds (bounded history). */
  sessions: number[];
  /** Open app session markers so we can finalize on the next launch. */
  openSessionStartedAtMs: number | null;
  openSessionLastActiveAtMs: number | null;
  /** First calendar date the app was used — anchor for retention. */
  firstActiveDate: string | null;
  /** Calendar date -> number of sessions started that day. */
  activeDates: Record<string, number>;
  /** Per-level aggregates keyed by level id string. */
  levels: Record<string, LevelAnalytics>;
  currentAttempt: CurrentAttempt | null;
  lastSyncedAtMs: number | null;
  /** Number of local changes that happened after the last successful sync. */
  pendingChanges: number;
}
export const createInitialState = (installationId: string, now: number): AnalyticsState => ({
  version: 1,
  installationId,
  createdAtMs: now,
  sessions: [],
  openSessionStartedAtMs: null,
  openSessionLastActiveAtMs: null,
  firstActiveDate: null,
  activeDates: {},
  levels: {},
  currentAttempt: null,
  lastSyncedAtMs: null,
  pendingChanges: 0,
});

const minOr = (a: number | null, b: number): number => (a === null ? b : Math.min(a, b));
const maxOr = (a: number | null, b: number): number => (a === null ? b : Math.max(a, b));

/** Merge an interaction/duration sample into a level's running aggregates. */
export const mergeLevelSample = (
  level: LevelAnalytics,
  sample: { interactions: number; completed: boolean; durationSec: number | null }
): void => {
  level.attempts += 1;
  level.interactionsSum += sample.interactions;
  level.interactionsMin = minOr(level.interactionsMin, sample.interactions);
  level.interactionsMax = maxOr(level.interactionsMax, sample.interactions);
  if (sample.completed && sample.durationSec != null) {
    level.completions += 1;
    level.durationsSum += sample.durationSec;
    level.durationsMin = minOr(level.durationsMin, sample.durationSec);
    level.durationsMax = maxOr(level.durationsMax, sample.durationSec);
  }
};

export const round1 = (value: number): number => Math.round(value * 10) / 10;

export interface RetentionReport {
  firstActiveDate: string | null;
  d1: boolean;
  d2: boolean;
  d7: boolean;
  d14: boolean;
  d30: boolean;
  /** Whether enough time has elapsed to judge that retention window. */
  d1Mature: boolean;
  d2Mature: boolean;
  d7Mature: boolean;
  d14Mature: boolean;
  d30Mature: boolean;
}

export const retentionReport = (
  state: AnalyticsState,
  now: number = Date.now()
): RetentionReport => {
  const first = state.firstActiveDate;
  const activeOn = (offset: number): boolean =>
    first != null && (state.activeDates[addDaysToKey(first, offset)] ?? 0) > 0;
  const mature = (offset: number): boolean =>
    first != null && now - dateKeyToMs(first) >= offset * DAY_MS;

  return {
    firstActiveDate: first,
    d1: activeOn(1),
    d2: activeOn(2),
    d7: activeOn(7),
    d14: activeOn(14),
    d30: activeOn(30),
    d1Mature: mature(1),
    d2Mature: mature(2),
    d7Mature: mature(7),
    d14Mature: mature(14),
    d30Mature: mature(30),
  };
};
export interface LevelStatsReport {
  levelId: number;
  attempts: number;
  completions: number;
  interactionsMin: number | null;
  interactionsMax: number | null;
  interactionsAvg: number | null;
  durationMin: number | null;
  durationMax: number | null;
  durationAvg: number | null;
}

export interface AnalyticsSnapshot {
  installationId: string;
  appVersion: string;
  createdAtMs: number;
  sessionCount: number;
  sessionDurationMinSec: number | null;
  sessionDurationMaxSec: number | null;
  sessionDurationAvgSec: number | null;
  levelsCompleted: number;
  levelStats: LevelStatsReport[];
  retention: RetentionReport;
  activeDates: Record<string, number>;
  lastSyncedAtMs: number | null;
  pendingChanges: number;
}

export const computeSnapshot = (
  state: AnalyticsState,
  now: number = Date.now()
): AnalyticsSnapshot => {
  const sessionDurationMinSec = state.sessions.length ? Math.min(...state.sessions) : null;
  const sessionDurationMaxSec = state.sessions.length ? Math.max(...state.sessions) : null;
  const sum = state.sessions.reduce((total, value) => total + value, 0);
  const sessionDurationAvgSec =
    state.sessions.length ? round1(sum / state.sessions.length) : null;

  const levelIds = Object.keys(state.levels).map(Number).sort((a, b) => a - b);
  const levelStats = levelIds.map<LevelStatsReport>((levelId) => {
    const level = state.levels[String(levelId)];
    return {
      levelId,
      attempts: level.attempts,
      completions: level.completions,
      interactionsMin: level.interactionsMin,
      interactionsMax: level.interactionsMax,
      interactionsAvg: level.attempts ? round1(level.interactionsSum / level.attempts) : null,
      durationMin: level.durationsMin,
      durationMax: level.durationsMax,
      durationAvg: level.completions ? round1(level.durationsSum / level.completions) : null,
    };
  });

  return {
    installationId: state.installationId,
    appVersion: APP_VERSION,
    createdAtMs: state.createdAtMs,
    sessionCount: state.sessions.length,
    sessionDurationMinSec,
    sessionDurationMaxSec,
    sessionDurationAvgSec,
    levelsCompleted: levelStats.reduce((total, level) => total + level.completions, 0),
    levelStats,
    retention: retentionReport(state, now),
    activeDates: { ...state.activeDates },
    lastSyncedAtMs: state.lastSyncedAtMs,
    pendingChanges: state.pendingChanges,
  };
};