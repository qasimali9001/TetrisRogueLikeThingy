import type { PieceType } from "../../config/gameConfig";

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

export const createSpawnPiece = (
  type: PieceType,
  boardWidth: number,
  spawnY: number
): ActivePiece => ({
  type,
  rotation: 0,
  x: Math.floor(boardWidth / 2),
  y: spawnY
});
