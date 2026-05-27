export type CombatOutcome = "ongoing" | "victory" | "defeat";

export interface CombatLoopState {
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  totalDamageDealt: number;
  lastDamageDealt: number;
  outcome: CombatOutcome;
}

export class CombatLoopOrchestrator {
  private readonly enemyName: string;
  private readonly enemyMaxHp: number;
  private enemyHp: number;
  private totalDamageDealt = 0;
  private lastDamageDealt = 0;
  private outcome: CombatOutcome = "ongoing";

  public constructor(enemyName: string, enemyMaxHp: number) {
    this.enemyName = enemyName;
    this.enemyMaxHp = enemyMaxHp;
    this.enemyHp = enemyMaxHp;
  }

  public reset(): void {
    this.enemyHp = this.enemyMaxHp;
    this.totalDamageDealt = 0;
    this.lastDamageDealt = 0;
    this.outcome = "ongoing";
  }

  public applyPlayerDamage(damage: number): number {
    if (this.outcome !== "ongoing" || damage <= 0) {
      this.lastDamageDealt = 0;
      return this.enemyHp;
    }

    this.lastDamageDealt = damage;
    this.totalDamageDealt += damage;
    this.enemyHp = Math.max(this.enemyHp - damage, 0);
    if (this.enemyHp === 0) {
      this.outcome = "victory";
    }
    return this.enemyHp;
  }

  public markPlayerDefeat(): void {
    if (this.outcome !== "victory") {
      this.outcome = "defeat";
    }
  }

  public isActive(): boolean {
    return this.outcome === "ongoing";
  }

  public getState(): CombatLoopState {
    return {
      enemyName: this.enemyName,
      enemyHp: this.enemyHp,
      enemyMaxHp: this.enemyMaxHp,
      totalDamageDealt: this.totalDamageDealt,
      lastDamageDealt: this.lastDamageDealt,
      outcome: this.outcome
    };
  }
}
