// src/hooks/useGameState.ts

import { useState, useCallback, useEffect } from 'react';
import { CatPiece, GridCoordinates, cloneCatPiece } from '../models/Cat';
import { Level, getLevelById } from '../models/Level';
import { isValidPlacement, isLevelComplete, rotateMatrix } from '../utils/gridSolver';

export const useGameState = (initialLevelId: number = 1) => {
  const [level, setLevel] = useState<Level>(() => getLevelById(initialLevelId));
  const [unpackedCats, setUnpackedCats] = useState<CatPiece[]>(() =>
    getLevelById(initialLevelId).availableCats.map(cloneCatPiece)
  );
  const [placedCats, setPlacedCats] = useState<CatPiece[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [jumpOutCount, setJumpOutCount] = useState<number>(0);
  const [ejectedCatId, setEjectedCatId] = useState<string | null>(null);
  const [actionNonce, setActionNonce] = useState<number>(0);

  const bumpAction = () => setActionNonce((value) => value + 1);

  const loadLevel = useCallback((levelId: number) => {
    const newLevel = getLevelById(levelId);
    setLevel(newLevel);
    setUnpackedCats(newLevel.availableCats.map(cloneCatPiece));
    setPlacedCats([]);
    setIsComplete(false);
    setJumpOutCount(0);
    setEjectedCatId(null);
    bumpAction();
  }, []);

  useEffect(() => {
    loadLevel(initialLevelId);
  }, [initialLevelId, loadLevel]);

  const findCat = (catId: string, unpacked: CatPiece[], placed: CatPiece[]) =>
    unpacked.find((c) => c.id === catId) || placed.find((c) => c.id === catId);

  const placeCat = useCallback(
    (catId: string, targetCoords: GridCoordinates) => {
      if (isComplete) return false;

      const cat = findCat(catId, unpackedCats, placedCats);
      if (!cat) return false;

      const updatedCat: CatPiece = {
        ...cat,
        currentPosition: targetCoords,
      };

      const otherPlacedCats = placedCats.filter((c) => c.id !== catId);
      const valid = isValidPlacement(
        updatedCat,
        targetCoords,
        level.gridConfig,
        otherPlacedCats
      );

      if (!valid) return false;

      const newPlacedCats = [...otherPlacedCats, updatedCat];
      const newUnpackedCats = unpackedCats.filter((c) => c.id !== catId);

      setPlacedCats(newPlacedCats);
      setUnpackedCats(newUnpackedCats);
      setEjectedCatId(null);
      bumpAction();

      const completed = isLevelComplete(
        level.availableCats,
        newPlacedCats,
        level.gridConfig
      );

      if (completed) {
        setIsComplete(true);
      }

      return true;
    },
    [unpackedCats, placedCats, isComplete, level]
  );

  const unplaceCat = useCallback(
    (catId: string, options?: { ejected?: boolean }) => {
      const cat = placedCats.find((c) => c.id === catId);
      if (!cat) return false;

      const nextPlacedCats = placedCats.filter((c) => c.id !== catId);
      const nextUnpackedCats = [
        ...unpackedCats,
        { ...cat, currentPosition: undefined },
      ];

      setPlacedCats(nextPlacedCats);
      setUnpackedCats(nextUnpackedCats);
      setIsComplete(false);

      if (options?.ejected) {
        setJumpOutCount((count) => count + 1);
        setEjectedCatId(catId);
      } else {
        setEjectedCatId(null);
      }

      bumpAction();
      return true;
    },
    [placedCats, unpackedCats]
  );

  const rotateCat = useCallback(
    (catId: string) => {
      if (isComplete) return false;

      const unpacked = unpackedCats.find((c) => c.id === catId);
      if (unpacked) {
        setUnpackedCats((prev) =>
          prev.map((c) =>
            c.id === catId ? { ...c, shapeMatrix: rotateMatrix(c.shapeMatrix) } : c
          )
        );
        bumpAction();
        return true;
      }

      const placed = placedCats.find((c) => c.id === catId);
      if (!placed || !placed.currentPosition) return false;

      const rotated: CatPiece = {
        ...placed,
        shapeMatrix: rotateMatrix(placed.shapeMatrix),
      };
      const others = placedCats.filter((c) => c.id !== catId);

      if (!isValidPlacement(rotated, placed.currentPosition, level.gridConfig, others)) {
        return false;
      }

      setPlacedCats([...others, rotated]);
      bumpAction();
      return true;
    },
    [unpackedCats, placedCats, isComplete, level]
  );

  const ejectRandomCat = useCallback(() => {
    if (isComplete || placedCats.length === 0) return false;
    const pick = placedCats[Math.floor(Math.random() * placedCats.length)];
    return unplaceCat(pick.id, { ejected: true });
  }, [isComplete, placedCats, unplaceCat]);

  const resetLevel = useCallback(() => {
    loadLevel(level.id);
  }, [level.id, loadLevel]);

  return {
    level,
    unpackedCats,
    placedCats,
    isComplete,
    jumpOutCount,
    ejectedCatId,
    actionNonce,
    loadLevel,
    placeCat,
    unplaceCat,
    rotateCat,
    ejectRandomCat,
    resetLevel,
  };
};

export default useGameState;
