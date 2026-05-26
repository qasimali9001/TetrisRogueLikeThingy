import { Application, Container, Graphics, Text } from "pixi.js";
import type { EngineViewState } from "../core/GameState";
import type { PieceType } from "../config/gameConfig";

const CELL_SIZE = 28;
const BOARD_X = 260;
const BOARD_Y = 40;

const PIECE_COLORS: Record<PieceType, number> = {
  I: 0x36e4ff,
  O: 0xfef244,
  T: 0xb967ff,
  S: 0x59d972,
  Z: 0xff5e6c,
  J: 0x5887ff,
  L: 0xffab4d
};

export class PixiRenderer {
  private readonly app: Application;
  private readonly root = new Container();
  private readonly boardLayer = new Graphics();
  private readonly activeLayer = new Graphics();
  private readonly ghostLayer = new Graphics();
  private readonly frameLayer = new Graphics();
  private readonly hudText = new Text({
    text: "",
    style: {
      fontFamily: "monospace",
      fontSize: 16,
      fill: 0xd6e8ff
    }
  });

  public constructor(app: Application) {
    this.app = app;
    this.app.stage.addChild(this.root);
    this.root.addChild(this.boardLayer, this.ghostLayer, this.activeLayer, this.frameLayer);
    this.hudText.position.set(20, 30);
    this.root.addChild(this.hudText);
  }

  public render(state: EngineViewState): void {
    this.boardLayer.clear();
    this.activeLayer.clear();
    this.ghostLayer.clear();
    this.frameLayer.clear();

    const visibleHeight = state.board.length;
    const width = state.board[0]?.length ?? 0;

    this.frameLayer.rect(BOARD_X - 2, BOARD_Y - 2, width * CELL_SIZE + 4, visibleHeight * CELL_SIZE + 4);
    this.frameLayer.stroke({ color: 0x71f2ff, width: 2 });

    for (let y = 0; y < visibleHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cell = state.board[y][x];
        this.drawCell(this.boardLayer, x, y, cell ? PIECE_COLORS[cell] : 0x10192a, cell ? 0.95 : 0.2);
      }
    }

    for (const cell of state.ghostCells) {
      if (cell.y >= 0 && cell.y < visibleHeight) {
        this.drawCell(this.ghostLayer, cell.x, cell.y, 0x9ec7ff, 0.15);
      }
    }

    for (const cell of state.activeCells) {
      if (cell.y >= 0 && cell.y < visibleHeight) {
        this.drawCell(this.activeLayer, cell.x, cell.y, PIECE_COLORS[cell.type], 1);
      }
    }

    this.hudText.text = [
      `Clear: ${state.lastClearType}`,
      `Combo: ${Math.max(state.comboChain, 0)}`,
      `B2B: ${state.backToBackChain ? "ON" : "OFF"}`,
      `Attack: ${state.lastAttackSent}`,
      `Incoming: ${state.pendingGarbage}`
    ].join("\n");
  }

  private drawCell(layer: Graphics, x: number, y: number, color: number, alpha: number): void {
    const drawX = BOARD_X + x * CELL_SIZE;
    const drawY = BOARD_Y + y * CELL_SIZE;
    layer.rect(drawX, drawY, CELL_SIZE - 1, CELL_SIZE - 1);
    layer.fill({ color, alpha });
  }
}
