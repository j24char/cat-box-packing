// src/hooks/useAnalytics.ts

import { useCallback, useEffect, useState } from 'react';
import { analytics, AnalyticsSnapshot, SyncResult } from '../services/analytics';

interface UseAnalyticsResult {
  snapshot: AnalyticsSnapshot | null;
  ready: boolean;
  syncResult: SyncResult | null;
  refresh: () => Promise<void>;
  flush: () => Promise<SyncResult>;
}

/**
 * React hook exposing the anonymous analytics service. `flush()` is a
 * best-effort Firebase upload and never throws.
 */
export const useAnalytics = (): UseAnalyticsResult => {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const refresh = useCallback(async () => {
    const current = await analytics.getSnapshot();
    setSnapshot(current);
    setReady(true);
  }, []);

  const flush = useCallback(async () => {
    const result = await analytics.flush();
    setSyncResult(result);
    await refresh();
    return result;
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { snapshot, ready, syncResult, refresh, flush };
};

export default useAnalytics;