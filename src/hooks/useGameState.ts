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
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [mouseActive, setMouseActive] = useState<boolean>(false);

  const bumpAction = () => setActionNonce((value) => value + 1);

  const loadLevel = useCallback((levelId: number) => {
    const newLevel = getLevelById(levelId);
    setLevel(newLevel);
    setUnpackedCats(newLevel.availableCats.map(cloneCatPiece));
    setPlacedCats([]);
    setIsComplete(false);
    setJumpOutCount(0);
    setEjectedCatId(null);
    setElapsedSeconds(0);
    setMouseActive(false);
    bumpAction();
  }, []);

  useEffect(() => {
    loadLevel(initialLevelId);
  }, [initialLevelId, loadLevel]);

  // Timer: increment elapsed seconds while playing
  useEffect(() => {
    if (isComplete) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isComplete, level.id]);

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

      const findCatInLists = () =>
        unpackedCats.find((c) => c.id === catId) || placedCats.find((c) => c.id === catId);
      const cat = findCatInLists();
      if (!cat) return false;

      // Only Stretching and Loaf cats can be rotated
      if (cat.pose !== 'stretch' && cat.pose !== 'loaf') return false;

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

  // Check if a cat is adjacent to a catnip toy (disables boredom)
  const isCatAdjacentToCatnip = useCallback(
    (cat: CatPiece) => {
      if (!cat.currentPosition) return false;
      const catnipCells = level.gridConfig.obstacles?.filter((ob) => ob.type === 'catnip') ?? [];

      for (let r = 0; r < cat.shapeMatrix.length; r++) {
        for (let c = 0; c < cat.shapeMatrix[r].length; c++) {
          if (cat.shapeMatrix[r][c] !== 1) continue;
          const boardX = cat.currentPosition.x + c;
          const boardY = cat.currentPosition.y + r;

          for (const nip of catnipCells) {
            const isAdjacent = Math.abs(boardX - nip.x) + Math.abs(boardY - nip.y) === 1;
            if (isAdjacent) return true;
          }
        }
      }
      return false;
    },
    [level.gridConfig.obstacles]
  );

  const ejectRandomCat = useCallback(() => {
    if (isComplete || placedCats.length === 0) return false;

    // Only awake cats that are NOT adjacent to catnip can be ejected
    const eligibleCats = placedCats.filter(
      (c) => c.isAwake && !isCatAdjacentToCatnip(c)
    );
    if (eligibleCats.length === 0) return false;

    const pick = eligibleCats[Math.floor(Math.random() * eligibleCats.length)];
    return unplaceCat(pick.id, { ejected: true });
  }, [isComplete, placedCats, unplaceCat, isCatAdjacentToCatnip]);

  // Mouse distraction: all awake cats jump out of the box
  const triggerMouseDistraction = useCallback(() => {
    if (isComplete || placedCats.length === 0) return false;
    setMouseActive(true);

    // Eject all awake placed cats
    const awakePlaced = placedCats.filter((c) => c.isAwake);
    if (awakePlaced.length > 0) {
      const nextPlacedCats = placedCats.filter((c) => !c.isAwake);
      const nextUnpackedCats = [
        ...unpackedCats,
        ...awakePlaced.map((c) => ({ ...c, currentPosition: undefined })),
      ];
      setPlacedCats(nextPlacedCats);
      setUnpackedCats(nextUnpackedCats);
      setIsComplete(false);
      setJumpOutCount((count) => count + awakePlaced.length);
      setEjectedCatId(awakePlaced[0].id);
      bumpAction();
    }

    // Deactivate mouse after a short delay
    setTimeout(() => setMouseActive(false), 1500);
    return true;
  }, [isComplete, placedCats, unpackedCats]);

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
    elapsedSeconds,
    mouseActive,
    loadLevel,
    placeCat,
    unplaceCat,
    rotateCat,
    ejectRandomCat,
    triggerMouseDistraction,
    resetLevel,
  };
};

export default useGameState;
