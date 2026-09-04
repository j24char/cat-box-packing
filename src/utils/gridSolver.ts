// src/utils/gridSolver.ts

import { CatPiece, GridCoordinates } from '../models/Cat';
import { BoxGridConfig } from '../models/Level';

/**
 * Rotates a matrix 90 degrees clockwise.
 * @param matrix The input matrix to rotate.
 * @returns The rotated matrix.
 */
export function rotateMatrix(matrix: number[][]): number[][] {
  if (!matrix.length || !matrix[0]?.length) {
    return matrix.map((row) => [...row]);
  }
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }

  return rotated;
}

/**
 * Checks if a cat piece's matrix overlaps with any unplayable/blocked mask cells
 * or extends outside the board boundaries.
 */
export const isValidPlacement = (
  cat: CatPiece,
  targetCoords: GridCoordinates,
  gridConfig: BoxGridConfig,
  existingCats: CatPiece[]
): boolean => {
  const { rows, cols, mask, obstacles } = gridConfig;
  const { shapeMatrix } = cat;

  for (let r = 0; r < shapeMatrix.length; r++) {
    for (let c = 0; c < shapeMatrix[r].length; c++) {
      if (shapeMatrix[r][c] === 1) {
        const boardX = targetCoords.x + c;
        const boardY = targetCoords.y + r;

        // Check horizontal & vertical boundary limits
        if (boardX < 0 || boardX >= cols || boardY < 0 || boardY >= rows) {
          return false;
        }

        // Check if cell is blocked by cardboard divider or unplayable mask
        if (mask && mask[boardY]?.[boardX] === 0) {
          return false;
        }

        // Check if cell is occupied by an obstacle (catnip or cucumber)
        if (obstacles?.some((ob) => ob.x === boardX && ob.y === boardY)) {
          return false;
        }

        // Check collision against other already placed cat pieces
        for (const placedCat of existingCats) {
          if (placedCat.id === cat.id || !placedCat.currentPosition) continue;

          if (isCellOccupiedByCat(placedCat, boardX, boardY)) {
            return false;
          }
        }
      }
    }
  }

  // Cucumber rule: only sleeping cats (curl) can be placed adjacent to cucumbers
  if (obstacles && cat.isAwake) {
    const cucumberCells = obstacles
      .filter((ob) => ob.type === 'cucumber')
      .map((ob) => ({ x: ob.x, y: ob.y }));

    for (const cell of cucumberCells) {
      // Check if any part of the cat is adjacent to a cucumber
      for (let r = 0; r < shapeMatrix.length; r++) {
        for (let c = 0; c < shapeMatrix[r].length; c++) {
          if (shapeMatrix[r][c] !== 1) continue;
          const boardX = targetCoords.x + c;
          const boardY = targetCoords.y + r;

          const isAdjacent =
            Math.abs(boardX - cell.x) + Math.abs(boardY - cell.y) === 1;
          if (isAdjacent) {
            return false;
          }
        }
      }
    }
  }

  return true;
};

/**
 * Determines whether a specific board cell (x, y) is occupied by a cat piece shape matrix.
 */
export const isCellOccupiedByCat = (
  cat: CatPiece,
  cellX: number,
  cellY: number
): boolean => {
  if (!cat.currentPosition) return false;

  const relX = cellX - cat.currentPosition.x;
  const relY = cellY - cat.currentPosition.y;

  if (
    relY >= 0 &&
    relY < cat.shapeMatrix.length &&
    relX >= 0 &&
    relX < cat.shapeMatrix[relY].length
  ) {
    return cat.shapeMatrix[relY][relX] === 1;
  }

  return false;
};

/**
 * Checks whether the whole playable board is filled by placed cats.
 */
export const isLevelComplete = (
  allLevelCats: CatPiece[],
  placedCats: CatPiece[],
  gridConfig: BoxGridConfig
): boolean => {
  const mask = gridConfig.mask ?? Array.from({ length: gridConfig.rows }, () => Array(gridConfig.cols).fill(1));
  const obstacles = gridConfig.obstacles ?? [];

  // Count playable cells excluding mask-blocked cells and obstacle cells
  let playableCellCount = 0;
  for (let y = 0; y < gridConfig.rows; y++) {
    for (let x = 0; x < gridConfig.cols; x++) {
      if (mask[y]?.[x] === 0) continue;
      if (obstacles.some((ob) => ob.x === x && ob.y === y)) continue;
      playableCellCount++;
    }
  }

  const filledCells = new Set<string>();

  for (const cat of placedCats) {
    if (!cat.currentPosition) return false;

    for (let r = 0; r < cat.shapeMatrix.length; r++) {
      for (let c = 0; c < cat.shapeMatrix[r].length; c++) {
        if (cat.shapeMatrix[r][c] === 0) continue;

        const boardX = cat.currentPosition.x + c;
        const boardY = cat.currentPosition.y + r;

        if (boardX < 0 || boardX >= gridConfig.cols || boardY < 0 || boardY >= gridConfig.rows) {
          return false;
        }

        if (mask[boardY]?.[boardX] === 0) {
          return false;
        }

        if (obstacles.some((ob) => ob.x === boardX && ob.y === boardY)) {
          return false;
        }

        filledCells.add(`${boardX},${boardY}`);
      }
    }
  }

  return filledCells.size === playableCellCount && placedCats.length === allLevelCats.length;
};

export const getOccupiedCells = (
  shapeMatrix: number[][],
  origin: GridCoordinates
): GridCoordinates[] => {
  const cells: GridCoordinates[] = [];

  for (let r = 0; r < shapeMatrix.length; r++) {
    for (let c = 0; c < shapeMatrix[r].length; c++) {
      if (shapeMatrix[r][c] === 1) {
        cells.push({ x: origin.x + c, y: origin.y + r });
      }
    }
  }

  return cells;
};