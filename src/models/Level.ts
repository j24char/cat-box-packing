// src/models/Level.ts

import { CatBreed, CatPiece, CatPose, getCatShape } from './Cat';

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

const makeCat = (levelId: number, index: number, breed: CatBreed, pose: CatPose): CatPiece => ({
  id: `cat-${levelId}-${index}`,
  breed,
  pose,
  isAwake: pose !== 'sitting',
  shapeMatrix: getCatShape(pose),
});

const createLevel = (
  id: number,
  title: string,
  rows: number,
  cols: number,
  cats: Array<{ breed: CatBreed; pose: CatPose }>,
  mask?: number[][]
): Level => ({
  id,
  title,
  maxMoves: cats.length * 6,
  targetScore: id * 1000,
  gridConfig: { rows, cols, mask },
  availableCats: cats.map((cat, index) => makeCat(id, index + 1, cat.breed, cat.pose)),
});

/**
 * Handcrafted packing levels. Cell counts match playable tiles; pieces fit with rotation.
 */
export const SAMPLE_LEVELS: Level[] = [
  createLevel(1, 'Cozy Corner', 2, 2, [{ breed: 'orange', pose: 'curl' }]),
  createLevel(2, 'Nap Buddies', 2, 3, [
    { breed: 'calico', pose: 'curl' },
    { breed: 'tabby', pose: 'sitting' },
  ]),
  createLevel(
    3,
    'Tight Spaces',
    3,
    3,
    [
      { breed: 'silver', pose: 'stretch' },
      { breed: 'tuxedo', pose: 'stretch' },
    ],
    [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]
  ),
  createLevel(4, 'Open Floor', 3, 3, [
    { breed: 'black', pose: 'curl' },
    { breed: 'white', pose: 'stretch' },
    { breed: 'orange', pose: 'kitten' },
  ]),
  createLevel(5, 'Long Box', 3, 4, [
    { breed: 'calico', pose: 'loaf' },
    { breed: 'tabby', pose: 'curl' },
    { breed: 'silver', pose: 'sitting' },
    { breed: 'tuxedo', pose: 'sitting' },
  ]),
  createLevel(
    6,
    'Missing Corner',
    4,
    4,
    [
      { breed: 'orange', pose: 'loaf' },
      { breed: 'black', pose: 'stretch' },
      { breed: 'white', pose: 'curl' },
      { breed: 'calico', pose: 'sitting' },
      { breed: 'tabby', pose: 'kitten' },
    ],
    [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 0],
    ]
  ),
  createLevel(7, 'Full House', 4, 4, [
    { breed: 'silver', pose: 'loaf' },
    { breed: 'tuxedo', pose: 'loaf' },
    { breed: 'orange', pose: 'stretch' },
    { breed: 'calico', pose: 'curl' },
  ]),
  createLevel(
    8,
    'Cardboard Divider',
    4,
    4,
    [
      { breed: 'tabby', pose: 'loaf' },
      { breed: 'black', pose: 'curl' },
      { breed: 'white', pose: 'stretch' },
      { breed: 'silver', pose: 'sitting' },
    ],
    [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 0],
      [1, 1, 1, 0],
    ]
  ),
  createLevel(9, 'Wide Crate', 4, 5, [
    { breed: 'orange', pose: 'loaf' },
    { breed: 'calico', pose: 'loaf' },
    { breed: 'tabby', pose: 'stretch' },
    { breed: 'tuxedo', pose: 'stretch' },
    { breed: 'white', pose: 'curl' },
  ]),
  createLevel(
    10,
    'Grand Packing',
    5,
    5,
    [
      { breed: 'black', pose: 'loaf' },
      { breed: 'silver', pose: 'loaf' },
      { breed: 'orange', pose: 'stretch' },
      { breed: 'calico', pose: 'stretch' },
      { breed: 'tabby', pose: 'curl' },
      { breed: 'white', pose: 'kitten' },
    ],
    [
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
    ]
  ),
];

export const getLevelById = (id: number): Level =>
  SAMPLE_LEVELS.find((lvl) => lvl.id === id) || SAMPLE_LEVELS[0];

export const getNextLevelId = (id: number): number | null => {
  const index = SAMPLE_LEVELS.findIndex((lvl) => lvl.id === id);
  if (index < 0 || index >= SAMPLE_LEVELS.length - 1) {
    return null;
  }
  return SAMPLE_LEVELS[index + 1].id;
};

export const starsFromJumpOuts = (jumpOutCount: number): number => {
  if (jumpOutCount <= 0) return 3;
  if (jumpOutCount <= 2) return 2;
  return 1;
};
