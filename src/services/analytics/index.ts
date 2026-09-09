/**
 * Anonymous analytics service (PRD §7).
 *
 * Tracks, locally persists and (best-effort) uploads the required metrics per
 * installation:
 *   - Gameplay duration  : min / max / avg session time
 *   - Level interactions : min / max / avg drag&drop + rotate count per level
 *   - Sessions           : number of app sessions
 *   - Retention          : D1 / D2 / D7 / D14 / D30
 *   - Level completion   : number of levels completed
 *
 * All public methods are asynchronous, serialized through an internal queue so
 * concurrent callers cannot corrupt the persisted state, and are designed to
 * never throw to the caller (analytics must never crash the game).
 */

import {
  AnalyticsSnapshot,
  AnalyticsState,
  InteractionKind,
  computeSnapshot,
  mergeLevelSample,
} from './analyticsTypes';
import { loadAnalyticsState, saveAnalyticsState } from './analyticsStore';
import { pushSnapshotToFirebase } from './firebaseClient';

export type { AnalyticsSnapshot, AnalyticsState, InteractionKind } from './analyticsTypes';

export interface SyncResult {
  ok: boolean;
  syncedAtMs: number | null;
  error: string | null;
}

type Mutator = (state: AnalyticsState) => void;

class AnalyticsService {
  private state: AnalyticsState | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  /** Serializes mutations to avoid concurrent-write corruption. */
  private run<T>(fn: (state: AnalyticsState) => T): Promise<T> {
    const task = this.queue.then(async () => {
      if (!this.state) {
        this.state = await loadAnalyticsState();
      }
      const result = fn(this.state);
      await saveAnalyticsState(this.state);
      return result;
    });
    // Keep the queue alive even if one task throws.
    this.queue = task.catch(() => undefined);
    return task;
  }

  private mutate(fn: Mutator): Promise<void> {
    return this.run((state) => fn(state)).then(() => undefined);
  }

  /** Loads persisted state (e.g. during app boot) without mutating it. */
  prepare(): Promise<void> {
    return this.run(() => undefined).then(() => undefined).catch(() => undefined);
  }

  /**
   * Starts a new app session. Any unfinished previous session (from a crash or
   * a hard app kill) is finalized using its last known activity timestamp.
   */
  startSession(): Promise<void> {
    return this.mutate((state) => {
      const now = Date.now();
      this.finalizeOpenSession(state, now);
      state.openSessionStartedAtMs = now;
      state.openSessionLastActiveAtMs = now;
      const dateKey = this.dateKey(now);
      state.activeDates[dateKey] = (state.activeDates[dateKey] ?? 0) + 1;
      if (!state.firstActiveDate) state.firstActiveDate = dateKey;
      state.pendingChanges += 1;
    });
  }

  /** Marks activity in the current session (heartbeat from the app). */
  touch(): Promise<void> {
    return this.mutate((state) => {
      if (state.openSessionStartedAtMs != null) {
        state.openSessionLastActiveAtMs = Date.now();
        state.pendingChanges += 1;
      }
    });
  }

  /** Finalizes the current session (used when the app is being backgrounded). */
  endSession(): Promise<void> {
    return this.mutate((state) => this.finalizeOpenSession(state, Date.now()));
  }

  private finalizeOpenSession(state: AnalyticsState, now: number): void {
    const startedAt = state.openSessionStartedAtMs;
    if (startedAt == null) return;
    const lastActive = state.openSessionLastActiveAtMs ?? startedAt;
    const durationSec = Math.max(1, Math.round((lastActive - startedAt) / 1000));
    state.sessions.push(durationSec);
    if (state.sessions.length > 1000) {
      state.sessions = state.sessions.slice(-1000);
    }
    state.openSessionStartedAtMs = null;
    state.openSessionLastActiveAtMs = null;
    state.pendingChanges += 1;
  }
/** Opens a level attempt, finalizing any previous unfinished attempt. */
  beginLevelAttempt(levelId: number): Promise<void> {
    return this.mutate((state) => {
      if (state.currentAttempt && state.currentAttempt.levelId === levelId) return;
      this.finalizeCurrentAttempt(state);
      state.currentAttempt = { levelId, startedAtMs: Date.now(), interactions: 0 };
      state.pendingChanges += 1;
    });
  }

  /** Records a single drag / drop / rotate interaction in the open attempt. */
  trackInteraction(_kind: InteractionKind): Promise<void> {
    return this.mutate((state) => {
      if (!state.currentAttempt) return;
      state.currentAttempt.interactions += 1;
      state.pendingChanges += 1;
    });
  }

  /**
   * Finalizes the current level attempt. A completed attempt also records its
   * duration so per-level completion-time stats (and the completion count)
   * are accurate.
   */
  endLevelAttempt(options?: { completed?: boolean; durationSec?: number }): Promise<void> {
    return this.mutate((state) => {
      const attempt = state.currentAttempt;
      if (!attempt) return;
      state.currentAttempt = null;
      const level = state.levels[String(attempt.levelId)] ?? createEmptyLevelMetrics();
      mergeLevelSample(level, {
        interactions: attempt.interactions,
        completed: options?.completed === true,
        durationSec: options?.completed === true ? (options.durationSec ?? 0) : null,
      });
      state.levels[String(attempt.levelId)] = level;
      state.pendingChanges += 1;
    });
  }

  /** Convenience: finalizes the open attempt as a successful level completion. */
  completeLevel(levelId: number, durationSec: number): Promise<void> {
    return this.mutate((state) => {
      const attempt = state.currentAttempt;
      if (!attempt || attempt.levelId !== levelId) return;
      state.currentAttempt = null;
      const level = state.levels[String(levelId)] ?? createEmptyLevelMetrics();
      mergeLevelSample(level, { interactions: attempt.interactions, completed: true, durationSec });
      state.levels[String(levelId)] = level;
      state.pendingChanges += 1;
    });
  }

  /** Returns the current computed snapshot for reporting/upload. */
  getSnapshot(): Promise<AnalyticsSnapshot> {
    return this.run((state) => computeSnapshot(state, Date.now()));
  }

  /**
   * Best-effort upload of the current snapshot to Firebase Firestore.
   * Never throws — the SyncResult carries the outcome instead.
   */
  async flush(): Promise<SyncResult> {
    try {
      const snapshot = await this.getSnapshot();
      await pushSnapshotToFirebase(snapshot);
      await this.mutate((state) => {
        state.lastSyncedAtMs = Date.now();
        state.pendingChanges = 0;
      });
      return { ok: true, syncedAtMs: Date.now(), error: null };
    } catch (error) {
      return {
        ok: false,
        syncedAtMs: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private finalizeCurrentAttempt(state: AnalyticsState): void {
    const attempt = state.currentAttempt;
    if (!attempt) return;
    state.currentAttempt = null;
    const level = state.levels[String(attempt.levelId)] ?? createEmptyLevelMetrics();
    mergeLevelSample(level, {
      interactions: attempt.interactions,
      completed: false,
      durationSec: null,
    });
    state.levels[String(attempt.levelId)] = level;
    state.pendingChanges += 1;
  }

  private dateKey(ts: number): string {
    const d = new Date(ts);
    const pad = (n: number) => (n < 10 ? '0' : '') + n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}

const createEmptyLevelMetrics = (): {
  attempts: number;
  completions: number;
  interactionsSum: number;
  interactionsMin: number | null;
  interactionsMax: number | null;
  durationsSum: number;
  durationsMin: number | null;
  durationsMax: number | null;
} => ({
  attempts: 0,
  completions: 0,
  interactionsSum: 0,
  interactionsMin: null,
  interactionsMax: null,
  durationsSum: 0,
  durationsMin: null,
  durationsMax: null,
});

/** Singleton analytics instance used across the whole app. */
export const analytics = new AnalyticsService();

export default analytics;