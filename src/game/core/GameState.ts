import type { PieceType } from "../config/gameConfig";
import type { BoardCell } from "../engine/board/BoardModel";
import type { ClearType } from "../engine/combat/lineClearModel";

export interface EngineViewState {
  board: BoardCell[][];
  activeCells: Array<{ x: number; y: number; type: PieceType }>;
  ghostCells: Array<{ x: number; y: number }>;
  holdPiece: PieceType | null;
  nextQueue: PieceType[];
  pendingGarbage: number;
  comboChain: number;
  backToBackChain: boolean;
  lastAttackSent: number;
  lastClearType: ClearType;
}
