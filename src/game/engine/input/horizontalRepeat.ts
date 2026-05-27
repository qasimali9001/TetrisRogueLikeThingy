interface RepeatConfig {
  dasMs: number;
  arrMs: number;
  dcdMs: number;
}

interface RepeatState {
  activeDirection: -1 | 0 | 1;
  elapsedMs: number;
  repeating: boolean;
}

export class HorizontalRepeatController {
  private config: RepeatConfig;
  private dasCutRemainingMs = 0;
  private state: RepeatState = {
    activeDirection: 0,
    elapsedMs: 0,
    repeating: false
  };

  public constructor(config: RepeatConfig) {
    this.config = config;
  }

  public setConfig(config: RepeatConfig): void {
    this.config = config;
  }

  public reset(): void {
    this.state = { activeDirection: 0, elapsedMs: 0, repeating: false };
    this.dasCutRemainingMs = 0;
  }

  public applyDasCutDelay(): void {
    if (this.config.dcdMs <= 0 || this.state.activeDirection === 0) {
      return;
    }
    this.dasCutRemainingMs = Math.max(this.dasCutRemainingMs, this.config.dcdMs);
  }

  public update(deltaMs: number, direction: -1 | 0 | 1): number {
    if (direction === 0) {
      this.state = { activeDirection: 0, elapsedMs: 0, repeating: false };
      this.dasCutRemainingMs = 0;
      return 0;
    }

    if (direction !== this.state.activeDirection) {
      this.state = { activeDirection: direction, elapsedMs: 0, repeating: false };
      this.dasCutRemainingMs = 0;
      return direction;
    }

    if (this.dasCutRemainingMs > 0) {
      this.dasCutRemainingMs = Math.max(0, this.dasCutRemainingMs - deltaMs);
      return 0;
    }

    this.state.elapsedMs += deltaMs;
    if (!this.state.repeating && this.state.elapsedMs >= this.config.dasMs) {
      this.state.repeating = true;
      this.state.elapsedMs = 0;
      return direction;
    }

    if (this.state.repeating) {
      if (this.config.arrMs <= 0) {
        return direction;
      }
      if (this.state.elapsedMs >= this.config.arrMs) {
        this.state.elapsedMs = 0;
        return direction;
      }
    }

    return 0;
  }
}
