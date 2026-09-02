import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAMPLE_LEVELS } from '../models/Level';

const STORAGE_KEY = 'cat-box-packing-progress-v1';

export interface LevelProgress {
  highestUnlocked: number;
  starsByLevel: Record<string, number>;
}

const DEFAULT_PROGRESS: LevelProgress = {
  highestUnlocked: 1,
  starsByLevel: {},
};

const lastLevelId = SAMPLE_LEVELS[SAMPLE_LEVELS.length - 1]?.id ?? 1;

const parseProgress = (raw: string | null): LevelProgress => {
  if (!raw) return DEFAULT_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as LevelProgress;
    return {
      highestUnlocked: Math.min(lastLevelId, Math.max(1, parsed.highestUnlocked || 1)),
      starsByLevel: parsed.starsByLevel ?? {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
};

export const useLevelProgress = () => {
  const [progress, setProgress] = useState<LevelProgress>(DEFAULT_PROGRESS);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    setProgress(parseProgress(raw));
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordWin = useCallback(async (levelId: number, stars: number) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const current = parseProgress(raw);
    const key = String(levelId);
    const previousStars = current.starsByLevel[key] ?? 0;
    const unlocked = Math.min(lastLevelId, Math.max(current.highestUnlocked, levelId + 1));
    const next: LevelProgress = {
      highestUnlocked: unlocked,
      starsByLevel: {
        ...current.starsByLevel,
        [key]: Math.max(previousStars, stars),
      },
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setProgress(next);
  }, []);

  const isUnlocked = useCallback(
    (levelId: number) => levelId <= progress.highestUnlocked,
    [progress.highestUnlocked]
  );

  const getStars = useCallback(
    (levelId: number) => progress.starsByLevel[String(levelId)] ?? 0,
    [progress.starsByLevel]
  );

  return {
    progress,
    ready,
    refresh,
    recordWin,
    isUnlocked,
    getStars,
  };
};
