/**
 * Firebase collection client for anonymous analytics (PRD §7).
 *
 * Firebase's JS/RN SDK does not expose the Firebase Analytics measurement
 * pipeline (that pipeline is iOS/Android SDK-only and requires a measurement
 * id + api secret that this project's plist does not contain). Instead we use
 * the two Firebase REST APIs that work on any HTTP client with only the
 * information available in `GoogleService-Info.plist`:
 *
 *   1. Identity Toolkit  -> `accounts:signUp` creates an *anonymous* Firebase
 *                           Auth user and returns an id token (no email, no
 *                           PII, no password, no user consent dialog).
 *   2. Cloud Firestore    -> `documents:commit` writes the aggregated
 *                           per-installation analytics document under the
 *                           `catBoxAnalytics` collection using the id token
 *                           as a Bearer token.
 *
 * All failures are swallowed by the caller in `analytics/index.ts` – analytics
 * is strictly best-effort and must never crash or block gameplay.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../firebaseConfig';
import { AnalyticsSnapshot } from './analyticsTypes';

const AUTH_STORAGE_KEY = 'cat-box-packing.firebase-auth.v1';

/** Shape of the anonymous auth credentials we cache. */
interface CachedAuth {
  localId: string;
  idToken: string;
  refreshToken: string;
  expiresAtMs: number;
}

interface HttpJsonOptions {
  headers?: Record<string, string>;
  body?: unknown;
}

const JSON_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

/**
 * Minimal HTTP POST helper. React Native 0.86 ships a global `fetch`, so we
 * prefer it and fall back to a plain XMLHttpRequest if it is missing.
 * All network errors surface as thrown Errors for the caller to catch.
 */
const httpJson = async (
  url: string,
  options: HttpJsonOptions = {}
): Promise<{ status: number; body: Record<string, unknown> }> => {
  const headers = { ...(options.headers ?? {}) };
  const bodyText = options.body === undefined ? undefined : JSON.stringify(options.body);

  const request = (): Promise<{ status: number; text: string } | null> => {
    const globalFetch = (globalThis as { fetch?: typeof fetch }).fetch;
    if (typeof globalFetch === 'function') {
      return globalFetch(url, {
        method: 'POST',
        headers,
        body: bodyText,
      }).then(async (response) => ({
        status: response.status,
        text: await response.text(),
      }));
    }
    // Legacy fallback for environments without global fetch.
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]));
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) resolve({ status: xhr.status, text: xhr.responseText });
      };
      xhr.onerror = () => resolve(null);
      xhr.send(bodyText);
    });
  };

  const result = await request();
  if (result === null) throw new Error('analytics: network request failed');
  let body: Record<string, unknown> = {};
  try {
    body = result.text ? (JSON.parse(result.text) as Record<string, unknown>) : {};
  } catch {
    body = {};
  }
  return { status: result.status, body };
};

const loadCachedAuth = async (): Promise<CachedAuth | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CachedAuth) : null;
  } catch {
    return null;
  }
};

const saveCachedAuth = async (auth: CachedAuth | null): Promise<void> => {
  try {
    if (auth) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // best-effort
  }
};

/** Creates an anonymous Firebase Auth user and returns fresh credentials. */
const signInAnonymously = async (): Promise<CachedAuth> => {
  if (!FIREBASE_CONFIG.apiKey) throw new Error('analytics: Firebase API key missing');
  const { status, body } = await httpJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_CONFIG.apiKey}`,
    { headers: JSON_HEADERS, body: { returnSecureToken: true } }
  );
  const idToken = typeof body.idToken === 'string' ? body.idToken : '';
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
  const localId = typeof body.localId === 'string' ? body.localId : '';
  if (status < 200 || status >= 300 || !idToken) {
    throw new Error(`analytics: anonymous sign-in failed (${status})`);
  }
  const auth: CachedAuth = {
    localId,
    idToken,
    refreshToken,
    expiresAtMs: Date.now() + 55 * 60 * 1000,
  };
  await saveCachedAuth(auth);
  return auth;
};

/** Refreshes an expired id token; falls back to a fresh anonymous account. */
const ensureIdToken = async (): Promise<CachedAuth> => {
  const cached = await loadCachedAuth();
  if (cached && cached.idToken && cached.expiresAtMs > Date.now() + 60_000) {
    return cached;
  }
  if (cached && cached.refreshToken) {
    try {
      const { status, body } = await httpJson(
        `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_CONFIG.apiKey}`,
        {
          headers: JSON_HEADERS,
          body: {
            grant_type: 'refresh_token',
            refresh_token: cached.refreshToken,
          },
        }
      );
      const idToken = typeof body.id_token === 'string' ? body.id_token : '';
      const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';
      if (status >= 200 && status < 300 && idToken) {
        const nextAuth: CachedAuth = {
          ...cached,
          idToken,
          refreshToken: refreshToken || cached.refreshToken,
          expiresAtMs: Date.now() + 55 * 60 * 1000,
        };
        await saveCachedAuth(nextAuth);
        return nextAuth;
      }
    } catch {
      // fall through to a brand-new anonymous account
    }
  }
  return signInAnonymously();
};

/** A single Firestore REST field value (type tag + payload). */
interface FirestoreField {
  nullValue?: null;
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: number;
  doubleValue?: number;
  mapValue?: { fields: Record<string, FirestoreField> };
  arrayValue?: { values: FirestoreField[] };
}

/** Recursively converts JS values into Firestore REST field values. */
const toFirestoreField = (value: unknown): FirestoreField => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) 
      ? { integerValue: String(value) } 
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreField) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreField> = {};
    for (const [key, child] of Object.entries(value)) {
      fields[key] = toFirestoreField(child);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
};

export const pushSnapshotToFirebase = async (snapshot: AnalyticsSnapshot): Promise<void> => {
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    throw new Error('analytics: Firebase config incomplete');
  }

  const auth = await ensureIdToken();
  // Valid document path: collection 'catBoxAnalytics', document ID = installationId
  const documentName = `projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/catBoxAnalytics/${snapshot.installationId}`;

  const payload: Record<string, unknown> = {
    installationId: snapshot.installationId,
    appVersion: snapshot.appVersion,
    createdAtMs: snapshot.createdAtMs,
    sessionCount: snapshot.sessionCount,
    sessionDurationMinSec: snapshot.sessionDurationMinSec,
    sessionDurationMaxSec: snapshot.sessionDurationMaxSec,
    sessionDurationAvgSec: snapshot.sessionDurationAvgSec,
    levelsCompleted: snapshot.levelsCompleted,
    levelStats: snapshot.levelStats,
    retention: snapshot.retention,
    activeDates: snapshot.activeDates,
  };

  const { status } = await httpJson(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents:commit?key=${FIREBASE_CONFIG.apiKey}`,
    {
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${auth.idToken}`,
      },
      body: {
        writes: [
          {
            update: {
              name: documentName,
              fields: toFirestoreField(payload).mapValue?.fields ?? {},
            },
          },
        ],
      },
    }
  );

  if (status < 200 || status >= 300) {
    throw new Error(`analytics: Firestore push failed (${status})`);
  }
};
/** Helper so the stats screen can render Firebase config state (for debugging). */
export const isFirebaseConfigured = (): boolean =>
  Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

export const firebaseProjectId = (): string => FIREBASE_CONFIG.projectId;