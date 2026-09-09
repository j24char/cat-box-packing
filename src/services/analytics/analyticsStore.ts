/**
 * Persistence for the local analytics state using AsyncStorage.
 * The anonymous installation id is generated once per installation and kept
 * stable so min/max/avg aggregates stay per-installation (per PRD §7).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsState, createInitialState } from './analyticsTypes';

const STORAGE_KEY = 'cat-box-packing.analytics.v1';

/** Generates a random, anonymous 128-bit installation id. */
export const generateInstallationId = (): string => {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  const groups: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    groups.push(
      bytes
        .slice(i * 4, i * 4 + 4)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
  }
  return groups.join('-');
};

const parseState = (raw: string | null): AnalyticsState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AnalyticsState>;
    if (!parsed || parsed.version !== 1 || typeof parsed.installationId !== 'string') {
      return null;
    }
    const base = createInitialState(parsed.installationId, parsed.createdAtMs ?? Date.now());
    return {
      ...base,
      ...parsed,
      activeDates: parsed.activeDates ?? {},
      levels: parsed.levels ?? {},
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      pendingChanges: typeof parsed.pendingChanges === 'number' ? parsed.pendingChanges : 0,
    };
  } catch {
    return null;
  }
};

/** Loads analytics state or creates a fresh installation. */
export const loadAnalyticsState = async (): Promise<AnalyticsState> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = parseState(raw);
    if (parsed) return parsed;
  } catch {
    // Fall through to a fresh state; analytics must never crash the game.
  }
  return createInitialState(generateInstallationId(), Date.now());
};

/** Best-effort persist – failures are swallowed so gameplay never breaks. */
export const saveAnalyticsState = async (state: AnalyticsState): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage is best-effort.
  }
};