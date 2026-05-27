import { Application, Container, Graphics, Text } from "pixi.js";
import type { EngineViewState } from "../core/GameState";
import type { PieceType } from "../config/gameConfig";
import { pieceDefinitions } from "../engine/pieces/pieceDefinitions";

const CELL_SIZE = 28;
const PREVIEW_CELL_SIZE = 12;
const BOARD_X = 280;
const BOARD_Y = 40;
const HOLD_PANEL_X = 132;
const NEXT_PANEL_X = 592;
const PREVIEW_PANEL_WIDTH = 130;
const HOLD_PANEL_HEIGHT = 94;
const NEXT_SLOT_HEIGHT = 44;
const COMBAT_PANEL_X = NEXT_PANEL_X;
const COMBAT_PANEL_Y = BOARD_Y + 252;
const COMBAT_PANEL_WIDTH = PREVIEW_PANEL_WIDTH;
const COMBAT_PANEL_HEIGHT = 142;

const PIECE_COLORS: Record<PieceType, number> = {
  I: 0x00c8ff,
  O: 0xffd800,
  T: 0xa000f0,
  S: 0x00e436,
  Z: 0xff004d,
  J: 0x1e65f3,
  L: 0xff8c1a
};

export class PixiRenderer {
  private readonly app: Application;
  private readonly root = new Container();
  private readonly boardLayer = new Graphics();
  private readonly activeLayer = new Graphics();
  private readonly ghostLayer = new Graphics();
  private readonly frameLayer = new Graphics();
  private readonly uiLayer = new Graphics();
  private readonly hudText = new Text({
    text: "",
    style: {
      fontFamily: "monospace",
      fontSize: 14,
      fill: 0xd6e8ff
    }
  });
  private readonly holdLabel = new Text({
    text: "HOLD",
    style: {
      fontFamily: "monospace",
      fontSize: 13,
      fill: 0x9ec7ff
    }
  });
  private readonly nextLabel = new Text({
    text: "NEXT",
    style: {
      fontFamily: "monospace",
      fontSize: 13,
      fill: 0x9ec7ff
    }
  });
  private readonly combatTitleText = new Text({
    text: "",
    style: {
      fontFamily: "monospace",
      fontSize: 13,
      fill: 0x9ec7ff
    }
  });
  private readonly combatHpText = new Text({
    text: "",
    style: {
      fontFamily: "monospace",
      fontSize: 12,
      fill: 0xd6e8ff
    }
  });
  private readonly combatDamageText = new Text({
    text: "",
    style: {
      fontFamily: "monospace",
      fontSize: 18,
      fill: 0xffa8bf
    }
  });
  private readonly combatMetaText = new Text({
    text: "",
    style: {
      fontFamily: "monospace",
      fontSize: 12,
      fill: 0xd6e8ff
    }
  });

  public constructor(app: Application) {
    this.app = app;
    this.app.stage.addChild(this.root);
    this.root.addChild(this.boardLayer, this.ghostLayer, this.activeLayer, this.frameLayer, this.uiLayer);
    this.hudText.position.set(16, 16);
    this.holdLabel.position.set(HOLD_PANEL_X + 8, BOARD_Y + 6);
    this.nextLabel.position.set(NEXT_PANEL_X + 8, BOARD_Y + 6);
    this.combatTitleText.position.set(COMBAT_PANEL_X + 8, COMBAT_PANEL_Y + 6);
    this.combatHpText.position.set(COMBAT_PANEL_X + 8, COMBAT_PANEL_Y + 26);
    this.combatDamageText.position.set(COMBAT_PANEL_X + 8, COMBAT_PANEL_Y + 88);
    this.combatMetaText.position.set(COMBAT_PANEL_X + 8, COMBAT_PANEL_Y + 118);
    this.root.addChild(this.hudText);
    this.root.addChild(
      this.holdLabel,
      this.nextLabel,
      this.combatTitleText,
      this.combatHpText,
      this.combatDamageText,
      this.combatMetaText
    );
  }

  public render(state: EngineViewState): void {
    this.boardLayer.clear();
    this.activeLayer.clear();
    this.ghostLayer.clear();
    this.frameLayer.clear();
    this.uiLayer.clear();

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
      `Mode: ${state.mode === "vs" ? "VS AI" : "ZEN PRACTICE"}`,
      `Clear: ${state.lastClearType}`,
      `Combo: ${Math.max(state.comboChain, 0)}`,
      `B2B: ${state.backToBackChain ? "ON" : "OFF"}`,
      `Attack: ${state.lastAttackSent}`,
      `Incoming: ${state.pendingGarbage}`,
      `Countered: ${state.combat.lastCounteredLines}`,
      `Shield: ${state.combat.shieldLines} (+${state.combat.lastShieldGain})`,
      `Enemy Attack In: ${(state.combat.msUntilNextAttack / 1000).toFixed(1)}s`
    ].join("\n");

    if (state.mode === "vs") {
      this.combatTitleText.text = `${state.combat.enemyName} (${state.combat.outcome.toUpperCase()})`;
      this.combatHpText.text = `HP ${state.combat.enemyHp} / ${state.combat.enemyMaxHp}`;
      this.combatDamageText.text =
        state.combat.lastDamageDealt > 0 ? `-${state.combat.lastDamageDealt} DMG` : "-0 DMG";
      this.combatDamageText.style.fill = state.combat.lastDamageDealt > 0 ? 0xff6f96 : 0x6d7f99;
      this.combatMetaText.text = state.combat.hasIncomingAttack
        ? `INCOMING ${state.combat.incomingAttackLines}L • Counter ${(
            state.combat.counterWindowMsRemaining / 1000
          ).toFixed(1)}s`
        : `Enemy charging • Next ${(state.combat.msUntilNextAttack / 1000).toFixed(1)}s`;
      this.combatMetaText.text += ` • Shield ${state.combat.shieldLines} • Total ${state.combat.totalDamageDealt}`;
      this.drawCombatHud(state);
    } else {
      this.combatTitleText.text = "ZEN MODE";
      this.combatHpText.text = "No enemy garbage pressure";
      this.combatDamageText.text = "";
      this.combatMetaText.text = "Practice movement and consistency";
      this.uiLayer.rect(COMBAT_PANEL_X, COMBAT_PANEL_Y, COMBAT_PANEL_WIDTH, COMBAT_PANEL_HEIGHT);
      this.uiLayer.fill({ color: 0x0f1424, alpha: 0.9 });
      this.uiLayer.stroke({ color: 0x71f2ff, width: 2 });
    }
    this.drawHoldPanel(state.holdPiece);
    this.drawNextPanel(state.nextQueue);
  }

  private drawCombatHud(state: EngineViewState): void {
    const hpRatio =
      state.combat.enemyMaxHp > 0
        ? Math.max(0, Math.min(1, state.combat.enemyHp / state.combat.enemyMaxHp))
        : 0;

    this.uiLayer.rect(COMBAT_PANEL_X, COMBAT_PANEL_Y, COMBAT_PANEL_WIDTH, COMBAT_PANEL_HEIGHT);
    this.uiLayer.fill({ color: 0x0f1424, alpha: 0.9 });
    this.uiLayer.stroke({ color: 0x71f2ff, width: 2 });

    this.uiLayer.rect(COMBAT_PANEL_X + 8, COMBAT_PANEL_Y + 46, COMBAT_PANEL_WIDTH - 16, 16);
    this.uiLayer.fill({ color: 0x321b2d, alpha: 1 });

    this.uiLayer.rect(
      COMBAT_PANEL_X + 8,
      COMBAT_PANEL_Y + 46,
      Math.round((COMBAT_PANEL_WIDTH - 16) * hpRatio),
      16
    );
    this.uiLayer.fill({ color: 0xff4b7d, alpha: 1 });

    this.uiLayer.rect(COMBAT_PANEL_X + 8, COMBAT_PANEL_Y + 66, COMBAT_PANEL_WIDTH - 16, 14);
    this.uiLayer.fill({ color: 0x1a2333, alpha: 1 });

    const timerFill = state.combat.hasIncomingAttack
      ? state.combat.counterWindowProgress
      : state.combat.nextAttackCycleProgress;
    const timerColor = state.combat.hasIncomingAttack ? 0xffb347 : 0x4ab8ff;
    this.uiLayer.rect(
      COMBAT_PANEL_X + 8,
      COMBAT_PANEL_Y + 66,
      Math.round((COMBAT_PANEL_WIDTH - 16) * timerFill),
      14
    );
    this.uiLayer.fill({ color: timerColor, alpha: 1 });

    this.uiLayer.rect(COMBAT_PANEL_X + 8, COMBAT_PANEL_Y + 66, COMBAT_PANEL_WIDTH - 16, 14);
    this.uiLayer.stroke({ color: 0x2f4d6b, width: 1 });
  }

  private drawCell(layer: Graphics, x: number, y: number, color: number, alpha: number): void {
    const drawX = BOARD_X + x * CELL_SIZE;
    const drawY = BOARD_Y + y * CELL_SIZE;
    layer.rect(drawX, drawY, CELL_SIZE - 1, CELL_SIZE - 1);
    layer.fill({ color, alpha });
  }

  private drawHoldPanel(holdPiece: PieceType | null): void {
    this.uiLayer.rect(HOLD_PANEL_X, BOARD_Y, PREVIEW_PANEL_WIDTH, HOLD_PANEL_HEIGHT);
    this.uiLayer.fill({ color: 0x0f1424, alpha: 0.7 });
    this.uiLayer.stroke({ color: 0x71f2ff, width: 2 });
    this.uiLayer.rect(HOLD_PANEL_X, BOARD_Y + 24, PREVIEW_PANEL_WIDTH, HOLD_PANEL_HEIGHT - 24);
    this.uiLayer.stroke({ color: 0x2f4d6b, width: 1 });

    if (holdPiece) {
      this.drawMiniPiece(
        holdPiece,
        HOLD_PANEL_X + Math.round(PREVIEW_PANEL_WIDTH / 2),
        BOARD_Y + 56
      );
    }
  }

  private drawNextPanel(nextQueue: PieceType[]): void {
    const panelHeight = 24 + nextQueue.length * NEXT_SLOT_HEIGHT;
    this.uiLayer.rect(NEXT_PANEL_X, BOARD_Y, PREVIEW_PANEL_WIDTH, panelHeight);
    this.uiLayer.fill({ color: 0x0f1424, alpha: 0.7 });
    this.uiLayer.stroke({ color: 0x71f2ff, width: 2 });

    for (let i = 0; i < nextQueue.length; i += 1) {
      const panelY = BOARD_Y + 24 + i * NEXT_SLOT_HEIGHT;
      this.uiLayer.rect(NEXT_PANEL_X, panelY, PREVIEW_PANEL_WIDTH, NEXT_SLOT_HEIGHT);
      this.uiLayer.stroke({ color: 0x2f4d6b, width: 1 });
      this.drawMiniPiece(nextQueue[i], NEXT_PANEL_X + Math.round(PREVIEW_PANEL_WIDTH / 2), panelY + 22);
    }
  }

  private drawMiniPiece(pieceType: PieceType, centerX: number, centerY: number): void {
    const definition = pieceDefinitions[pieceType];
    const shape = definition.rotations[definition.spawnRotation];
    const minX = Math.min(...shape.map((b) => b.x));
    const maxX = Math.max(...shape.map((b) => b.x));
    const minY = Math.min(...shape.map((b) => b.y));
    const maxY = Math.max(...shape.map((b) => b.y));
    const width = (maxX - minX + 1) * PREVIEW_CELL_SIZE;
    const height = (maxY - minY + 1) * PREVIEW_CELL_SIZE;
    const originX = Math.round(centerX - width / 2);
    const originY = Math.round(centerY - height / 2);

    for (const block of shape) {
      const x = originX + (block.x - minX) * PREVIEW_CELL_SIZE;
      const y = originY + (block.y - minY) * PREVIEW_CELL_SIZE;
      this.uiLayer.rect(x, y, PREVIEW_CELL_SIZE - 1, PREVIEW_CELL_SIZE - 1);
      this.uiLayer.fill({ color: PIECE_COLORS[pieceType], alpha: 1 });
    }
  }
}
