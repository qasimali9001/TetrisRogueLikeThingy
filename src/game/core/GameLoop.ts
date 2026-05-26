export interface Updatable {
  update(deltaMs: number): void;
}

export class GameLoop {
  private readonly target: Updatable;
  private running = false;
  private lastTimestamp = 0;
  private frameHandle = 0;

  public constructor(target: Updatable) {
    this.target = target;
  }

  public start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTimestamp = performance.now();
    this.frameHandle = requestAnimationFrame(this.onFrame);
  }

  public stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
  }

  private readonly onFrame = (timestamp: number): void => {
    if (!this.running) {
      return;
    }

    const deltaMs = Math.min(timestamp - this.lastTimestamp, 100);
    this.lastTimestamp = timestamp;
    this.target.update(deltaMs);
    this.frameHandle = requestAnimationFrame(this.onFrame);
  };
}
