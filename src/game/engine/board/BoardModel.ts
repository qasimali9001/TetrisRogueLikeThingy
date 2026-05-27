import type { BoardConfig, PieceType } from "../../config/gameConfig";

export type BoardCell = PieceType | null;

export interface CellPosition {
  x: number;
  y: number;
}

export class BoardModel {
  readonly width: number;
  readonly visibleHeight: number;
  readonly hiddenRows: number;
  readonly totalHeight: number;
  private readonly grid: BoardCell[][];

  public constructor(config: BoardConfig) {
    this.width = config.width;
    this.visibleHeight = config.visibleHeight;
    this.hiddenRows = config.hiddenRows;
    this.totalHeight = this.visibleHeight + this.hiddenRows;
    this.grid = Array.from({ length: this.totalHeight }, () =>
      Array.from({ length: this.width }, () => null)
    );
  }

  public isInside(position: CellPosition): boolean {
    return (
      position.x >= 0 &&
      position.x < this.width &&
      position.y >= 0 &&
      position.y < this.totalHeight
    );
  }

  public getCell(position: CellPosition): BoardCell {
    if (!this.isInside(position)) {
      return null;
    }
    return this.grid[position.y][position.x];
  }

  public setCell(position: CellPosition, value: BoardCell): void {
    if (!this.isInside(position)) {
      return;
    }
    this.grid[position.y][position.x] = value;
  }

  public isOccupied(position: CellPosition): boolean {
    return this.getCell(position) !== null;
  }

  public clearLines(): number {
    let cleared = 0;
    const keptRows: BoardCell[][] = [];

    for (const row of this.grid) {
      if (row.every((cell) => cell !== null)) {
        cleared += 1;
      } else {
        keptRows.push([...row]);
      }
    }

    while (keptRows.length < this.totalHeight) {
      keptRows.unshift(Array.from({ length: this.width }, () => null));
    }

    for (let y = 0; y < this.totalHeight; y += 1) {
      this.grid[y] = keptRows[y];
    }

    return cleared;
  }

  public isCompletelyEmpty(): boolean {
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell !== null) {
          return false;
        }
      }
    }
    return true;
  }

  public clearAll(): void {
    for (let y = 0; y < this.totalHeight; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.grid[y][x] = null;
      }
    }
  }

  public addGarbageLine(holeColumn: number): boolean {
    const overflowed = this.grid[0].some((cell) => cell !== null);
    const clampedHole = Math.max(0, Math.min(this.width - 1, holeColumn));
    const garbageRow: BoardCell[] = Array.from({ length: this.width }, (_, x) =>
      x === clampedHole ? null : "Z"
    );
    this.grid.shift();
    this.grid.push(garbageRow);
    return overflowed;
  }

  public getVisibleRows(): BoardCell[][] {
    return this.grid.slice(this.hiddenRows).map((row) => [...row]);
  }
}
