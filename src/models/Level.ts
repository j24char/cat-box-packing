// src/models/Level.ts

import { CatPiece } from './Cat';

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

/**
 * Sample levels for Cat Box Packing
 */
export const SAMPLE_LEVELS: Level[] = [
  {
    id: 1,
    title: 'Level 1 - Cozy Corner',
    maxMoves: 10,
    targetScore: 1000,
    gridConfig: {
      rows: 2,
      cols: 2,
      mask: [
        [1, 1],
        [1, 1],
      ],
    },
    availableCats: [
      {
        id: 'cat-1',
        breed: 'calico',
        pose: 'curl',
        isAwake: false,
        shapeMatrix: [[1, 1]],
      },
      {
        id: 'cat-2',
        breed: 'orange',
        pose: 'loaf',
        isAwake: false,
        shapeMatrix: [[1, 1]],
      },
    ],
  },
  {
    id: 14,
    title: 'Level 14 - Cardboard Chaos',
    maxMoves: 20,
    targetScore: 4850,
    gridConfig: {
      rows: 4,
      cols: 4,
      mask: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 0],
        [1, 1, 1, 1],
      ],
    },
    availableCats: [
      {
        id: 'cat-14-1',
        breed: 'calico',
        pose: 'curl',
        isAwake: false,
        shapeMatrix: [
          [1, 1],
          [1, 0],
        ],
      },
      {
        id: 'cat-14-2',
        breed: 'black',
        pose: 'stretch',
        isAwake: true,
        shapeMatrix: [[1, 1, 1]],
      },
      {
        id: 'cat-14-3',
        breed: 'tabby',
        pose: 'loaf',
        isAwake: false,
        shapeMatrix: [[1, 1]],
      },
      {
        id: 'cat-14-4',
        breed: 'silver',
        pose: 'sitting',
        isAwake: false,
        shapeMatrix: [[1]],
      },
    ],
  },
];