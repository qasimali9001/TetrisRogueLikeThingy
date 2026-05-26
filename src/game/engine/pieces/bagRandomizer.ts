import type { PieceType } from "../../config/gameConfig";

const ALL_PIECES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export class BagRandomizer {
  private queue: PieceType[] = [];
  private readonly random: () => number;

  public constructor(random: () => number = Math.random) {
    this.random = random;
  }

  public next(): PieceType {
    this.refillIfNeeded();
    const nextPiece = this.queue.shift();
    if (!nextPiece) {
      throw new Error("BagRandomizer produced an empty queue.");
    }
    return nextPiece;
  }

  public peek(count: number): PieceType[] {
    while (this.queue.length < count) {
      this.queue.push(...this.createShuffledBag());
    }
    return this.queue.slice(0, count);
  }

  private refillIfNeeded(): void {
    if (this.queue.length === 0) {
      this.queue = this.createShuffledBag();
    }
  }

  private createShuffledBag(): PieceType[] {
    const bag = [...ALL_PIECES];
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }
}
