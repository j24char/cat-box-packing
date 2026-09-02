// src/models/Level.ts

import { CatBreed, CatPiece, CatPose, getCatCellCount, getCatShape } from './Cat';

export interface BoxGridConfig {
  rows: number;
  cols: number;
  /**
   * Defines blocked or unplayable cells inside the grid (e.g. cardboard dividers).
   * 1 = playable cell, 0 = blocked/wall cell.
   */
  mask?: number[][];
}

export interface Level {
  id: number;
  title: string;
  maxMoves: number;
  targetScore: number;
  gridConfig: BoxGridConfig;
  availableCats: CatPiece[];
}

const BREEDS: CatBreed[] = ['calico', 'tabby', 'orange', 'silver', 'tuxedo', 'black', 'white'];

const getPlayableCellCount = (gridConfig: BoxGridConfig): number => {
  const rows = gridConfig.mask ?? Array.from({ length: gridConfig.rows }, () => Array(gridConfig.cols).fill(1));
  return rows.reduce((total, row) => total + row.reduce((rowTotal, cell) => rowTotal + (cell === 0 ? 0 : 1), 0), 0);
};

const generateLevelCats = (levelId: number, gridConfig: BoxGridConfig): CatPiece[] => {
  const playableCellCount = getPlayableCellCount(gridConfig);
  let remainingCells = Math.max(playableCellCount, 1);
  const generatedCats: CatPiece[] = [];

  while (remainingCells > 0) {
    let selectedPose: CatPose;
    let cellCount: number;

    if (remainingCells >= 4) {
      const largeOptions: CatPose[] = ['curl', 'stretch', 'loaf'];
      selectedPose = largeOptions[(levelId + generatedCats.length) % largeOptions.length];
      cellCount = 4;
    } else if (remainingCells === 3) {
      selectedPose = 'sitting';
      cellCount = 2;
    } else if (remainingCells >= 2) {
      selectedPose = 'sitting';
      cellCount = 2;
    } else {
      selectedPose = 'kitten';
      cellCount = 1;
    }

    const shapeMatrix = getCatShape(selectedPose);
    generatedCats.push({
      id: `cat-${levelId}-${generatedCats.length + 1}`,
      breed: BREEDS[(levelId + generatedCats.length) % BREEDS.length],
      pose: selectedPose,
      isAwake: selectedPose !== 'sitting',
      shapeMatrix,
    });

    remainingCells -= cellCount;
  }

  return generatedCats;
};

const createLevel = (id: number, title: string, rows: number, cols: number, maxMoves: number, targetScore: number, mask?: number[][]): Level => ({
  id,
  title,
  maxMoves,
  targetScore,
  gridConfig: { rows, cols, mask },
  availableCats: generateLevelCats(id, { rows, cols, mask }),
});

/**
 * Sample levels for Cat Box Packing
 */
export const SAMPLE_LEVELS: Level[] = [
  createLevel(1, 'Level 1 - Cozy Corner', 2, 2, 10, 1000, [
    [1, 1],
    [1, 1],
  ]),
  createLevel(2, 'Level 2 - Tight Spaces', 3, 3, 15, 2000, [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ]),
  createLevel(3, 'Level 3 - Open Floor', 4, 4, 20, 3000, [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
  ]),
  createLevel(14, 'Level 14 - Cardboard Chaos', 4, 4, 20, 4850, [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 0],
    [1, 1, 1, 1],
  ]),
];