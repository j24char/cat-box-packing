export type CatPose = 'curl' | 'stretch' | 'sitting' | 'loaf' | 'kitten';
export type CatBreed = 'calico' | 'tabby' | 'orange' | 'silver' | 'tuxedo' | 'black' | 'white';

export interface GridCoordinates {
  x: number;
  y: number;
}

export interface CatPiece {
  id: string;
  breed: CatBreed;
  pose: CatPose;
  isAwake: boolean;
  shapeMatrix: number[][]; // e.g. [[1, 1], [0, 1]] for polyomino fitting
  currentPosition?: GridCoordinates;
}

export const CAT_SHAPES: Record<CatPose, number[][]> = {
  curl: [
    [1, 1],
    [1, 1],
  ],
  stretch: [
    [1, 1, 1],
    [1, 0, 0],
  ],
  sitting: [[1, 1]],
  loaf: [[1, 1, 1, 1]],
  kitten: [[1]],
};

export const getCatShape = (pose: CatPose): number[][] => CAT_SHAPES[pose] ?? CAT_SHAPES.kitten;

export const getCatCellCount = (shapeMatrix: number[][]): number =>
  shapeMatrix.reduce((total, row) => total + row.reduce((rowTotal, cell) => rowTotal + (cell ? 1 : 0), 0), 0);

export const getCatShapeSize = (shapeMatrix: number[][]) => ({
  width: Math.max(...shapeMatrix.map((row) => row.length), 1),
  height: shapeMatrix.length || 1,
});