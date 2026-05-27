import type { PieceType } from "../config/gameConfig";
import type { BoardCell } from "../engine/board/BoardModel";
import type { ClearType } from "../engine/combat/lineClearModel";
import type { CombatOutcome } from "../engine/combat/CombatLoopOrchestrator";

export type GameMode = "zen" | "vs";

export interface CombatViewState {
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  totalDamageDealt: number;
  lastDamageDealt: number;
  shieldLines: number;
  lastShieldGain: number;
  lastCounteredLines: number;
  outcome: CombatOutcome;
  hasIncomingAttack: boolean;
  incomingAttackLines: number;
  counterWindowMsRemaining: number;
  counterWindowMsTotal: number;
  counterWindowProgress: number;
  msUntilNextAttack: number;
  nextAttackCycleProgress: number;
}

export interface EngineViewState {
  mode: GameMode;
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
  combat: CombatViewState;
}
