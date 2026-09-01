// src/utils/gridSolver.ts

import { CatPiece, GridCoordinates } from '../models/Cat';
import { BoxGridConfig } from '../models/Level';

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
  const { rows, cols, mask } = gridConfig;
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
 * Checks if all required cats for the level are completely placed on the board.
 */
export const isLevelComplete = (
  allLevelCats: CatPiece[],
  placedCats: CatPiece[],
  gridConfig: BoxGridConfig
): boolean => {
  if (placedCats.length !== allLevelCats.length) return false;

  return placedCats.every((cat) => {
    if (!cat.currentPosition) return false;
    return isValidPlacement(
      cat,
      cat.currentPosition,
      gridConfig,
      placedCats.filter((c) => c.id !== cat.id)
    );
  });
};