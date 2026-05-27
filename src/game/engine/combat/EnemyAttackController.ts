import type { EnemyAttackConfig } from "../../config/gameConfig";
import type { GarbageQueue } from "../garbage/GarbageQueue";

interface PendingIncomingAttack {
  amount: number;
  holeColumn: number;
  remainingMs: number;
}

export interface EnemyAttackUiState {
  hasIncomingAttack: boolean;
  incomingAttackLines: number;
  counterWindowMsRemaining: number;
  counterWindowMsTotal: number;
  counterWindowProgress: number;
  msUntilNextAttack: number;
  nextAttackCycleProgress: number;
}

export class EnemyAttackController {
  private readonly config: EnemyAttackConfig;
  private cooldownMs: number;
  private patternIndex = 0;
  private pendingAttack: PendingIncomingAttack | null = null;

  public constructor(config: EnemyAttackConfig) {
    this.config = {
      ...config,
      holePattern: config.holePattern.length > 0 ? config.holePattern : [4]
    };
    this.cooldownMs = this.config.intervalMs;
  }

  public update(deltaMs: number, garbageQueue: GarbageQueue): void {
    if (this.pendingAttack) {
      this.pendingAttack.remainingMs = Math.max(this.pendingAttack.remainingMs - deltaMs, 0);
      if (this.pendingAttack.remainingMs <= 0) {
        garbageQueue.enqueue({
          amount: this.pendingAttack.amount,
          holeColumn: this.pendingAttack.holeColumn
        });
        this.pendingAttack = null;
      }
    }

    this.cooldownMs = Math.max(this.cooldownMs - deltaMs, 0);
    if (!this.pendingAttack && this.cooldownMs <= 0) {
      this.spawnPendingAttack();
      this.cooldownMs = this.config.intervalMs;
    }
  }

  public reset(): void {
    this.cooldownMs = this.config.intervalMs;
    this.patternIndex = 0;
    this.pendingAttack = null;
  }

  public counterIncoming(linesSent: number): number {
    if (!this.pendingAttack || linesSent <= 0) {
      return 0;
    }

    const consumed = Math.min(linesSent, this.pendingAttack.amount);
    this.pendingAttack.amount -= consumed;
    if (this.pendingAttack.amount <= 0) {
      this.pendingAttack = null;
    }
    return consumed;
  }

  public hasIncomingAttack(): boolean {
    return this.pendingAttack !== null;
  }

  public getUiState(): EnemyAttackUiState {
    if (this.pendingAttack) {
      const progress =
        this.config.counterWindowMs > 0
          ? Math.max(Math.min(this.pendingAttack.remainingMs / this.config.counterWindowMs, 1), 0)
          : 0;
      return {
        hasIncomingAttack: true,
        incomingAttackLines: this.pendingAttack.amount,
        counterWindowMsRemaining: this.pendingAttack.remainingMs,
        counterWindowMsTotal: this.config.counterWindowMs,
        counterWindowProgress: progress,
        msUntilNextAttack: this.pendingAttack.remainingMs,
        nextAttackCycleProgress: 1
      };
    }

    const cycleProgress =
      this.config.intervalMs > 0
        ? Math.max(Math.min(1 - this.cooldownMs / this.config.intervalMs, 1), 0)
        : 0;
    return {
      hasIncomingAttack: false,
      incomingAttackLines: 0,
      counterWindowMsRemaining: 0,
      counterWindowMsTotal: this.config.counterWindowMs,
      counterWindowProgress: 0,
      msUntilNextAttack: this.cooldownMs,
      nextAttackCycleProgress: cycleProgress
    };
  }

  private spawnPendingAttack(): void {
    const holeColumn = this.config.holePattern[this.patternIndex % this.config.holePattern.length];
    this.patternIndex += 1;
    this.pendingAttack = {
      amount: this.config.packetAmount,
      holeColumn,
      remainingMs: this.config.counterWindowMs
    };
  }
}
