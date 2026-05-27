import type { GameConfig, PieceType, TimingConfig } from "../config/gameConfig";
import type { EngineViewState } from "../core/GameState";
import { BoardModel } from "./board/BoardModel";
import type { ClearType } from "./combat/lineClearModel";
import { resolveLockCombat } from "./combat/lineClearModel";
import { GarbageQueue } from "./garbage/GarbageQueue";
import { HorizontalRepeatController } from "./input/horizontalRepeat";
import { KeyboardInput } from "./input/KeyboardInput";
import { createSpawnPiece, type ActivePiece } from "./pieces/activePiece";
import { BagRandomizer } from "./pieces/bagRandomizer";
import { pieceDefinitions } from "./pieces/pieceDefinitions";
import { getPieceCells, isPiecePositionValid, lockPieceToBoard } from "./pieces/piecePhysics";
import { getSrsKickOffsets } from "./rotation/srs";

export class TetrisEngine {
  private readonly config: GameConfig;
  private readonly board: BoardModel;
  private readonly randomizer = new BagRandomizer();
  private readonly garbageQueue = new GarbageQueue();
  private readonly input: KeyboardInput;
  private readonly horizontalRepeat: HorizontalRepeatController;
  private timing: TimingConfig;

  private activePiece: ActivePiece | null = null;
  private holdPiece: PieceType | null = null;
  private holdConsumedThisTurn = false;

  private gravityAccumulatorMs = 0;
  private softDropAccumulatorMs = 0;
  private lockTimerMs = 0;
  private lockResetCount = 0;
  private readonly maxLockResets = 15;
  private lastSuccessfulAction: "none" | "move" | "rotate" | "fall" | "hold" = "none";
  private lastRotationKickIndex: number | null = null;

  private comboChain = -1;
  private backToBackChain = false;
  private lastAttackSent = 0;
  private lastClearType: ClearType = "none";

  public constructor(config: GameConfig, input: KeyboardInput) {
    this.config = config;
    this.board = new BoardModel(config.board);
    this.input = input;
    this.timing = structuredClone(config.timing);
    this.horizontalRepeat = new HorizontalRepeatController({
      dasMs: this.timing.dasMs,
      arrMs: this.timing.arrMs,
      dcdMs: this.timing.dcdMs
    });
    this.spawnNewPiece();
  }

  public updateTiming(timing: TimingConfig): void {
    this.timing = structuredClone(timing);
    this.horizontalRepeat.setConfig({
      dasMs: this.timing.dasMs,
      arrMs: this.timing.arrMs,
      dcdMs: this.timing.dcdMs
    });
  }

  public update(deltaMs: number): void {
    if (this.input.consumeAction("resetBoard")) {
      this.resetBoard();
      return;
    }

    if (!this.activePiece) {
      return;
    }

    this.processRotationInput();
    this.processHorizontalInput(deltaMs);
    this.processHoldInput();
    if (this.processHardDropInput()) {
      return;
    }
    this.processVerticalMovement(deltaMs);
  }

  public getViewState(): EngineViewState {
    const activePiece = this.activePiece;
    const activeCells = activePiece
      ? getPieceCells(activePiece)
          .filter((cell) => cell.y >= this.board.hiddenRows)
          .map((cell) => ({
            x: cell.x,
            y: cell.y - this.board.hiddenRows,
            type: activePiece.type
          }))
      : [];

    const ghostY = this.computeGhostY();
    const ghostCells =
      activePiece && ghostY !== null
        ? getPieceCells({ ...activePiece, y: ghostY })
            .filter((cell) => cell.y >= this.board.hiddenRows)
            .map((cell) => ({ x: cell.x, y: cell.y - this.board.hiddenRows }))
        : [];

    return {
      board: this.board.getVisibleRows(),
      activeCells,
      ghostCells,
      holdPiece: this.holdPiece,
      nextQueue: this.randomizer.peek(this.config.queue.previewSize),
      pendingGarbage: this.garbageQueue.pendingLines(),
      comboChain: this.comboChain,
      backToBackChain: this.backToBackChain,
      lastAttackSent: this.lastAttackSent,
      lastClearType: this.lastClearType
    };
  }

  public resetBoard(): void {
    this.board.clearAll();
    this.randomizer.reset();
    this.garbageQueue.clear();
    this.horizontalRepeat.reset();
    this.activePiece = null;
    this.holdPiece = null;
    this.holdConsumedThisTurn = false;
    this.comboChain = -1;
    this.backToBackChain = false;
    this.lastAttackSent = 0;
    this.lastClearType = "none";
    this.lastSuccessfulAction = "none";
    this.lastRotationKickIndex = null;
    this.resetFallAccumulators();
    this.spawnNewPiece();
  }

  private spawnNewPiece(): void {
    const next = this.randomizer.next();
    const spawnY = this.board.hiddenRows - 2;
    const spawnRotation = pieceDefinitions[next].spawnRotation;
    this.activePiece = createSpawnPiece(next, this.board.width, spawnY, spawnRotation);
    this.holdConsumedThisTurn = false;
    this.lastSuccessfulAction = "none";
    this.lastRotationKickIndex = null;
    this.lockResetCount = 0;
    this.lockTimerMs = 0;

    if (!this.activePiece || !isPiecePositionValid(this.board, this.activePiece)) {
      this.activePiece = null;
      return;
    }

    // TETR.IO-like DCD: apply DAS cut when a piece is spawned.
    this.horizontalRepeat.applyDasCutDelay();
  }

  private processRotationInput(): void {
    if (!this.activePiece) {
      return;
    }
    const wasGrounded = this.isGrounded();
    if (this.input.consumeAction("rotateCw")) {
      this.tryRotate(1, wasGrounded);
    } else if (this.input.consumeAction("rotateCcw")) {
      this.tryRotate(-1, wasGrounded);
    } else if (this.input.consumeAction("rotate180")) {
      this.tryRotate(2, wasGrounded);
    }
  }

  private processHorizontalInput(deltaMs: number): void {
    const leftDown = this.input.isActionDown("moveLeft");
    const rightDown = this.input.isActionDown("moveRight");
    const direction: -1 | 0 | 1 = leftDown === rightDown ? 0 : leftDown ? -1 : 1;
    const moveSteps = this.horizontalRepeat.update(deltaMs, direction);
    if (moveSteps !== 0) {
      const wasGrounded = this.isGrounded();
      const moved = this.tryMove(moveSteps, 0);
      this.applyGroundedLockReset(wasGrounded, moved);
    }
  }

  private processHoldInput(): void {
    if (!this.activePiece || !this.config.queue.allowHold) {
      return;
    }
    if (!this.input.consumeAction("hold")) {
      return;
    }
    if (this.config.queue.holdLockoutEnabled && this.holdConsumedThisTurn) {
      return;
    }

    const incomingType = this.activePiece.type;
    if (this.holdPiece) {
      const spawnRotation = pieceDefinitions[this.holdPiece].spawnRotation;
      this.activePiece = createSpawnPiece(
        this.holdPiece,
        this.board.width,
        this.board.hiddenRows - 2,
        spawnRotation
      );
    } else {
      this.spawnNewPiece();
    }
    this.holdPiece = incomingType;
    this.holdConsumedThisTurn = true;
    this.lastSuccessfulAction = "hold";
    this.lastRotationKickIndex = null;
    this.resetFallAccumulators();
  }

  private processHardDropInput(): boolean {
    if (!this.activePiece) {
      return false;
    }
    if (!this.input.consumeAction("hardDrop")) {
      return false;
    }
    const ghostY = this.computeGhostY();
    if (ghostY === null) {
      return false;
    }
    this.activePiece.y = ghostY;
    this.lastSuccessfulAction = "fall";
    this.lastRotationKickIndex = null;
    this.lockActivePiece();
    return true;
  }

  private processVerticalMovement(deltaMs: number): void {
    if (!this.activePiece) {
      return;
    }

    const gravityStepMs = 1000 / this.timing.gravityCellsPerSecond;
    this.gravityAccumulatorMs += deltaMs;

    while (this.gravityAccumulatorMs >= gravityStepMs) {
      this.gravityAccumulatorMs -= gravityStepMs;
      if (!this.tryMove(0, 1, "fall")) {
        break;
      }
    }

    if (this.input.isActionDown("softDrop")) {
      const softStepMs = 1000 / this.timing.sdfCellsPerSecond;
      this.softDropAccumulatorMs += deltaMs;
      while (this.softDropAccumulatorMs >= softStepMs) {
        this.softDropAccumulatorMs -= softStepMs;
        if (!this.tryMove(0, 1, "fall")) {
          break;
        }
      }
    } else {
      this.softDropAccumulatorMs = 0;
    }

    if (!this.canMove(0, 1)) {
      this.lockTimerMs += deltaMs;
      if (this.lockTimerMs >= this.timing.lockDelayMs) {
        this.lockActivePiece();
      }
    } else {
      this.lockTimerMs = 0;
    }
  }

  private tryMove(dx: number, dy: number, actionType: "move" | "fall" = "move"): boolean {
    if (!this.activePiece) {
      return false;
    }
    const moved: ActivePiece = { ...this.activePiece, x: this.activePiece.x + dx, y: this.activePiece.y + dy };
    if (!isPiecePositionValid(this.board, moved)) {
      return false;
    }
    this.activePiece = moved;
    this.lastSuccessfulAction = actionType;
    this.lastRotationKickIndex = null;
    return true;
  }

  private canMove(dx: number, dy: number): boolean {
    if (!this.activePiece) {
      return false;
    }
    const moved: ActivePiece = { ...this.activePiece, x: this.activePiece.x + dx, y: this.activePiece.y + dy };
    return isPiecePositionValid(this.board, moved);
  }

  private tryRotate(direction: -1 | 1 | 2, wasGrounded: boolean): void {
    if (!this.activePiece) {
      return;
    }
    const from = this.activePiece.rotation;
    const to = (from + direction + 4) % 4;
    const kicks = getSrsKickOffsets(this.activePiece.type, from, to);

    for (let index = 0; index < kicks.length; index += 1) {
      const kick = kicks[index];
      const candidate: ActivePiece = {
        ...this.activePiece,
        rotation: to,
        x: this.activePiece.x + kick.x,
        y: this.activePiece.y - kick.y
      };
      if (isPiecePositionValid(this.board, candidate)) {
        this.activePiece = candidate;
        this.lastSuccessfulAction = "rotate";
        this.lastRotationKickIndex = index;
        // TETR.IO-like DCD: apply DAS cut on successful rotations.
        this.horizontalRepeat.applyDasCutDelay();
        this.applyGroundedLockReset(wasGrounded, true);
        return;
      }
    }
  }

  private computeGhostY(): number | null {
    if (!this.activePiece) {
      return null;
    }
    let ghost = { ...this.activePiece };
    while (isPiecePositionValid(this.board, { ...ghost, y: ghost.y + 1 })) {
      ghost = { ...ghost, y: ghost.y + 1 };
    }
    return ghost.y;
  }

  private lockActivePiece(): void {
    if (!this.activePiece) {
      return;
    }
    const lockedPiece = this.activePiece;
    lockPieceToBoard(this.board, lockedPiece);
    const linesCleared = this.board.clearLines();
    const spin = this.detectTSpin(lockedPiece, this.lastSuccessfulAction === "rotate", linesCleared);
    const perfectClear = linesCleared > 0 && this.board.isCompletelyEmpty();

    const lockResult = resolveLockCombat(
      this.config.attack,
      { comboChain: this.comboChain, backToBackChain: this.backToBackChain },
      {
        linesCleared,
        isTSpin: spin.isTSpin,
        isMini: spin.isMini,
        perfectClear
      }
    );

    this.comboChain = lockResult.comboChain;
    this.backToBackChain = lockResult.backToBackChain;
    this.lastClearType = lockResult.clearType;
    this.lastAttackSent = this.garbageQueue.cancel(lockResult.attackSent);

    this.resetFallAccumulators();
    this.spawnNewPiece();
  }

  private resetFallAccumulators(): void {
    this.gravityAccumulatorMs = 0;
    this.softDropAccumulatorMs = 0;
    this.lockTimerMs = 0;
  }

  private isGrounded(): boolean {
    return !this.canMove(0, 1);
  }

  private applyGroundedLockReset(wasGrounded: boolean, didManipulate: boolean): void {
    if (!didManipulate || !this.activePiece) {
      return;
    }
    const groundedNow = this.isGrounded();
    if (wasGrounded && this.lockResetCount < this.maxLockResets) {
      this.lockTimerMs = 0;
      this.lockResetCount += 1;
      return;
    }
    if (!groundedNow) {
      this.lockTimerMs = 0;
    }
  }

  private detectTSpin(
    piece: ActivePiece,
    lastActionWasRotation: boolean,
    linesCleared: number
  ): { isTSpin: boolean; isMini: boolean } {
    if (!lastActionWasRotation || piece.type !== "T") {
      return { isTSpin: false, isMini: false };
    }
    const pivot = { x: piece.x, y: piece.y };
    const corners = [
      { x: pivot.x - 1, y: pivot.y - 1 },
      { x: pivot.x + 1, y: pivot.y - 1 },
      { x: pivot.x - 1, y: pivot.y + 1 },
      { x: pivot.x + 1, y: pivot.y + 1 }
    ];
    const occupiedCorners = corners.reduce((count, corner) => {
      if (!this.board.isInside(corner)) {
        return count + 1;
      }
      return this.board.isOccupied(corner) ? count + 1 : count;
    }, 0);

    if (occupiedCorners < 3) {
      return { isTSpin: false, isMini: false };
    }

    const frontCorners = this.getTPieceFrontCorners(piece);
    const occupiedFrontCorners = frontCorners.reduce((count, corner) => {
      if (!this.board.isInside(corner) || this.board.isOccupied(corner)) {
        return count + 1;
      }
      return count;
    }, 0);

    const usedMiniUpgradeKick = this.lastRotationKickIndex === 4;
    const isMini =
      linesCleared <= 1 && occupiedFrontCorners < 2 && !usedMiniUpgradeKick;

    return { isTSpin: true, isMini };
  }

  private getTPieceFrontCorners(piece: ActivePiece): Array<{ x: number; y: number }> {
    const pivot = { x: piece.x, y: piece.y };
    switch (piece.rotation % 4) {
      case 0:
        return [
          { x: pivot.x - 1, y: pivot.y - 1 },
          { x: pivot.x + 1, y: pivot.y - 1 }
        ];
      case 1:
        return [
          { x: pivot.x + 1, y: pivot.y - 1 },
          { x: pivot.x + 1, y: pivot.y + 1 }
        ];
      case 2:
        return [
          { x: pivot.x - 1, y: pivot.y + 1 },
          { x: pivot.x + 1, y: pivot.y + 1 }
        ];
      default:
        return [
          { x: pivot.x - 1, y: pivot.y - 1 },
          { x: pivot.x - 1, y: pivot.y + 1 }
        ];
    }
  }

}
