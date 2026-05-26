import { BoardModel, type CellPosition } from "../board/BoardModel";
import type { ActivePiece } from "./activePiece";
import { pieceDefinitions } from "./pieceDefinitions";

export const getPieceCells = (piece: ActivePiece): CellPosition[] => {
  const def = pieceDefinitions[piece.type];
  return def.rotations[piece.rotation].map((block) => ({
    x: piece.x + block.x,
    y: piece.y + block.y
  }));
};

export const isPiecePositionValid = (board: BoardModel, piece: ActivePiece): boolean =>
  getPieceCells(piece).every((cell) => {
    if (!board.isInside(cell)) {
      return false;
    }
    return !board.isOccupied(cell);
  });

export const lockPieceToBoard = (board: BoardModel, piece: ActivePiece): void => {
  for (const cell of getPieceCells(piece)) {
    board.setCell(cell, piece.type);
  }
};
