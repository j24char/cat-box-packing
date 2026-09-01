// src/hooks/useGameState.ts

import { useState, useCallback } from 'react';
import { CatPiece, GridCoordinates } from '../models/Cat';
import { Level, SAMPLE_LEVELS } from '../models/Level';
import { isValidPlacement, isLevelComplete } from '../utils/gridSolver';

export interface GameState {
  currentLevel: Level;
  unpackedCats: CatPiece[];
  placedCats: CatPiece[];
  movesLeft: number;
  score: number;
  isComplete: boolean;
}

export const useGameState = (initialLevelId: number = 1) => {
  const getLevelById = (id: number): Level =>
    SAMPLE_LEVELS.find((lvl) => lvl.id === id) || SAMPLE_LEVELS[0];

  const [level, setLevel] = useState<Level>(() => getLevelById(initialLevelId));
  const [unpackedCats, setUnpackedCats] = useState<CatPiece[]>(level.availableCats);
  const [placedCats, setPlacedCats] = useState<CatPiece[]>([]);
  const [history, setHistory] = useState<CatPiece[][]>([]);
  const [movesLeft, setMovesLeft] = useState<number>(level.maxMoves);
  const [score, setScore] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Initialize or switch to a new level
  const loadLevel = useCallback((levelId: number) => {
    const newLevel = getLevelById(levelId);
    setLevel(newLevel);
    setUnpackedCats(newLevel.availableCats);
    setPlacedCats([]);
    setHistory([]);
    setMovesLeft(newLevel.maxMoves);
    setScore(0);
    setIsComplete(false);
  }, []);

  // Place or move a cat piece onto the grid
  const placeCat = useCallback(
    (catId: string, targetCoords: GridCoordinates) => {
      if (movesLeft <= 0 || isComplete) return false;

      // Locate cat in either unpacked tray or active board
      const cat =
        unpackedCats.find((c) => c.id === catId) ||
        placedCats.find((c) => c.id === catId);

      if (!cat) return false;

      const updatedCat: CatPiece = {
        ...cat,
        currentPosition: targetCoords,
      };

      // Validate collision & bounds
      const otherPlacedCats = placedCats.filter((c) => c.id !== catId);
      const valid = isValidPlacement(
        updatedCat,
        targetCoords,
        level.gridConfig,
        otherPlacedCats
      );

      if (!valid) return false;

      // Save state for undo
      setHistory((prev) => [...prev, placedCats]);

      const newPlacedCats = [...otherPlacedCats, updatedCat];
      const newUnpackedCats = unpackedCats.filter((c) => c.id !== catId);

      setPlacedCats(newPlacedCats);
      setUnpackedCats(newUnpackedCats);
      setMovesLeft((prev) => Math.max(0, prev - 1));

      // Check win condition
      const completed = isLevelComplete(
        level.availableCats,
        newPlacedCats,
        level.gridConfig
      );

      if (completed) {
        setIsComplete(true);
        setScore(level.targetScore + movesLeft * 100);
      }

      return true;
    },
    [unpackedCats, placedCats, movesLeft, isComplete, level]
  );

  // Undo the last move
  const undoMove = useCallback(() => {
    if (history.length === 0 || isComplete) return;

    const previousPlacedState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPlacedCats(previousPlacedState);

    // Recalculate remaining unpacked cats
    const placedIds = new Set(previousPlacedState.map((c) => c.id));
    setUnpackedCats(level.availableCats.filter((c) => !placedIds.has(c.id)));
    setMovesLeft((prev) => prev + 1);
  }, [history, isComplete, level]);

  // Restart current level
  const resetLevel = useCallback(() => {
    loadLevel(level.id);
  }, [level.id, loadLevel]);

  return {
    level,
    unpackedCats,
    placedCats,
    movesLeft,
    score,
    isComplete,
    loadLevel,
    placeCat,
    undoMove,
    resetLevel,
  };
};

export default useGameState;