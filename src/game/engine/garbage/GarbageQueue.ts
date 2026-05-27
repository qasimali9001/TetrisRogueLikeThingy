export interface GarbagePacket {
  amount: number;
  holeColumn: number;
}

export class GarbageQueue {
  private readonly queue: GarbagePacket[] = [];

  public enqueue(packet: GarbagePacket): void {
    if (packet.amount <= 0) {
      return;
    }
    this.queue.push(packet);
  }

  public cancel(linesCanceled: number): number {
    let remaining = Math.max(linesCanceled, 0);
    while (remaining > 0 && this.queue.length > 0) {
      const front = this.queue[0];
      if (front.amount <= remaining) {
        remaining -= front.amount;
        this.queue.shift();
      } else {
        front.amount -= remaining;
        remaining = 0;
      }
    }
    return remaining;
  }

  public popNext(): GarbagePacket | undefined {
    return this.queue.shift();
  }

  public pendingLines(): number {
    return this.queue.reduce((sum, packet) => sum + packet.amount, 0);
  }

  public snapshot(): GarbagePacket[] {
    return this.queue.map((packet) => ({ ...packet }));
  }

  public clear(): void {
    this.queue.length = 0;
  }
}
