// src/models/Level.ts

import { CatBreed, CatPiece, CatPose, getCatShape } from './Cat';

export type ObstacleType = 'catnip' | 'cucumber';

export interface Obstacle {
  type: ObstacleType;
  x: number;
  y: number;
}

export interface BoxGridConfig {
  rows: number;
  cols: number;
  /**
   * Defines blocked or unplayable cells inside the grid (e.g. cardboard dividers).
   * 1 = playable cell, 0 = blocked/wall cell.
   */
  mask?: number[][];
  /**
   * Obstacles placed on the grid (catnip toys and cucumbers).
   */
  obstacles?: Obstacle[];
}

export interface Level {
  id: number;
  title: string;
  maxMoves: number;
  targetScore: number;
  targetTime: number; // Target completion time in seconds
  gridConfig: BoxGridConfig;
  availableCats: CatPiece[];
}

const makeCat = (levelId: number, index: number, breed: CatBreed, pose: CatPose): CatPiece => ({
  id: `cat-${levelId}-${index}`,
  breed,
  pose,
  isAwake: pose !== 'curl',
  shapeMatrix: getCatShape(pose),
});

const createLevel = (
  id: number,
  title: string,
  rows: number,
  cols: number,
  cats: Array<{ breed: CatBreed; pose: CatPose }>,
  mask?: number[][],
  obstacles?: Obstacle[],
  targetTime?: number
): Level => ({
  id,
  title,
  maxMoves: cats.length * 6,
  targetScore: id * 1000,
  targetTime: targetTime ?? 60 + id * 5,
  gridConfig: { rows, cols, mask, obstacles },
  availableCats: cats.map((cat, index) => makeCat(id, index + 1, cat.breed, cat.pose)),
});

/**
 * Handcrafted packing levels. Cell counts match playable tiles; pieces fit with rotation.
 */
export const SAMPLE_LEVELS: Level[] = [
  createLevel(1, 'Cozy Corner', 2, 2, [{ breed: 'orange', pose: 'curl' }]),
  createLevel(2, 'Nap Buddies', 3, 2, [
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
    { breed: 'tuxedo', pose: 'stretch' },
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
      { breed: 'black', pose: 'loaf' },
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
    { breed: 'white', pose: 'loaf' },
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
  // Levels 11-15: Obstacles Introduced (Standing Cats, Catnip, Cucumbers)
  createLevel(
    11,
    'First Obstacle',
    4,
    4,
    [
      { breed: 'orange', pose: 'standing' },
      { breed: 'calico', pose: 'curl' },
      { breed: 'tabby', pose: 'loaf' },
      { breed: 'white', pose: 'kitten' },
    ],
    undefined,
    [{ type: 'catnip', x: 1, y: 1 }],
    90
  ),
  createLevel(
    12,
    'Cucumber Alert',
    4,
    4,
    [
      { breed: 'silver', pose: 'standing' },
      { breed: 'tuxedo', pose: 'curl' },
      { breed: 'white', pose: 'curl' },
      { breed: 'orange', pose: 'kitten' },
    ],
    undefined,
    [{ type: 'cucumber', x: 2, y: 2 }],
    90
  ),
  createLevel(
    13,
    'Catnip Corner',
    4,
    4,
    [
      { breed: 'black', pose: 'standing' },
      { breed: 'orange', pose: 'stretch' },
      { breed: 'calico', pose: 'curl' },
    ],
    undefined,
    [
      { type: 'catnip', x: 0, y: 0 },
      { type: 'catnip', x: 3, y: 3 },
    ],
    100
  ),
  createLevel(
    14,
    'Cucumber Wall',
    4,
    5,
    [
      { breed: 'silver', pose: 'standing' },
      { breed: 'tuxedo', pose: 'standing' },
      { breed: 'white', pose: 'curl' },
      { breed: 'orange', pose: 'sitting' },
    ],
    undefined,
    [
      { type: 'cucumber', x: 2, y: 0 },
      { type: 'cucumber', x: 2, y: 3 },
    ],
    100
  ),
  createLevel(
    15,
    'Mixed Obstacles',
    5,
    5,
    [
      { breed: 'black', pose: 'standing' },
      { breed: 'silver', pose: 'standing' },
      { breed: 'orange', pose: 'stretch' },
      { breed: 'calico', pose: 'curl' },
      { breed: 'tabby', pose: 'kitten' },
      { breed: 'white', pose: 'sitting' },
    ],
    [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ],
    [
      { type: 'catnip', x: 0, y: 0 },
      { type: 'cucumber', x: 4, y: 4 },
    ],
    110
  ),
  // Levels 16-20: Master Levels (tight grids, fast timers, multi-obstacles)
  createLevel(
    16,
    'Tight Squeeze',
    4,
    4,
    [
      { breed: 'tuxedo', pose: 'standing' },
      { breed: 'white', pose: 'curl' },
      { breed: 'black', pose: 'sitting' },
      { breed: 'orange', pose: 'kitten' },
      { breed: 'calico', pose: 'kitten' },
    ],
    [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ],
    [
      { type: 'catnip', x: 1, y: 1 },
      { type: 'cucumber', x: 2, y: 2 },
    ],
    75
  ),
  createLevel(
    17,
    'Obstacle Maze',
    5,
    5,
    [
      { breed: 'silver', pose: 'standing' },
      { breed: 'calico', pose: 'standing' },
      { breed: 'tabby', pose: 'stretch' },
      { breed: 'white', pose: 'sitting' },
    ],
    [
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
    ],
    [
      { type: 'catnip', x: 0, y: 0 },
      { type: 'cucumber', x: 4, y: 0 },
      { type: 'catnip', x: 4, y: 4 },
    ],
    80
  ),
  createLevel(
    18,
    'Double Trouble',
    5,
    5,
    [
      { breed: 'black', pose: 'standing' },
      { breed: 'tuxedo', pose: 'standing' },
      { breed: 'silver', pose: 'standing' },
      { breed: 'orange', pose: 'curl' },
    ],
    undefined,
    [
      { type: 'cucumber', x: 1, y: 1 },
      { type: 'cucumber', x: 3, y: 3 },
      { type: 'catnip', x: 0, y: 4 },
    ],
    70
  ),
  createLevel(
    19,
    'Cucumber Fortress',
    5,
    5,
    [
      { breed: 'white', pose: 'standing' },
      { breed: 'orange', pose: 'standing' },
      { breed: 'tabby', pose: 'stretch' },
      { breed: 'black', pose: 'curl' },
    ],
    [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ],
    [
      { type: 'cucumber', x: 0, y: 0 },
      { type: 'cucumber', x: 4, y: 0 },
      { type: 'cucumber', x: 0, y: 4 },
      { type: 'cucumber', x: 4, y: 4 },
      { type: 'catnip', x: 2, y: 2 },
    ],
    65
  ),
  createLevel(
    20,
    'The Grand Box',
    6,
    6,
    [
      { breed: 'calico', pose: 'standing' },
      { breed: 'tuxedo', pose: 'standing' },
      { breed: 'silver', pose: 'standing' },
      { breed: 'black', pose: 'standing' },
      { breed: 'orange', pose: 'loaf' },
      { breed: 'white', pose: 'curl' },
    ],
    [
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    [
      { type: 'catnip', x: 1, y: 1 },
      { type: 'cucumber', x: 4, y: 1 },
      { type: 'catnip', x: 1, y: 4 },
      { type: 'cucumber', x: 4, y: 4 },
    ],
    60
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

export const starsFromTime = (elapsedSeconds: number, targetTime: number): number => {
  if (elapsedSeconds <= targetTime) return 3;
  if (elapsedSeconds <= targetTime * 1.5) return 2;
  return 1;
};

export const starsFromJumpOuts = (jumpOutCount: number): number => {
  if (jumpOutCount <= 0) return 3;
  if (jumpOutCount <= 2) return 2;
  return 1;
};
