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