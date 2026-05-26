export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export interface BoardConfig {
  width: number;
  visibleHeight: number;
  hiddenRows: number;
}

export interface TimingConfig {
  gravityCellsPerSecond: number;
  lockDelayMs: number;
  dasMs: number;
  arrMs: number;
  sdfCellsPerSecond: number;
}

export interface AttackConfig {
  lineClear: Record<1 | 2 | 3 | 4, number>;
  tSpin: Record<1 | 2 | 3, number>;
  tSpinMini: Record<0 | 1 | 2, number>;
  b2bBonus: number;
  comboByChain: number[];
  perfectClearBonus: number;
}

export interface QueueConfig {
  previewSize: number;
  allowHold: boolean;
  holdLockoutEnabled: boolean;
}

export interface ControlActionBindings {
  moveLeft: string[];
  moveRight: string[];
  softDrop: string[];
  hardDrop: string[];
  rotateCw: string[];
  rotateCcw: string[];
  rotate180: string[];
  hold: string[];
}

export interface SettingsConfig {
  controls: ControlActionBindings;
  timing: {
    dasFrames: number;
    arrFrames: number;
    sdfFramesPerCell: number;
    lockDelayFrames: number;
    gravityFramesPerCell: number;
  };
}

export interface GameConfig {
  board: BoardConfig;
  timing: TimingConfig;
  attack: AttackConfig;
  queue: QueueConfig;
  settings: SettingsConfig;
}

// Baseline tuned to feel close to modern clients and easy to tweak in one place.
export const defaultGameConfig: GameConfig = {
  board: {
    width: 10,
    visibleHeight: 20,
    hiddenRows: 20
  },
  timing: {
    gravityCellsPerSecond: 1,
    lockDelayMs: 500,
    dasMs: 167,
    arrMs: 33,
    sdfCellsPerSecond: 30
  },
  attack: {
    lineClear: { 1: 0, 2: 1, 3: 2, 4: 4 },
    tSpin: { 1: 2, 2: 4, 3: 6 },
    tSpinMini: { 0: 0, 1: 0, 2: 1 },
    b2bBonus: 1,
    comboByChain: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5],
    perfectClearBonus: 10
  },
  queue: {
    previewSize: 5,
    allowHold: true,
    holdLockoutEnabled: true
  },
  settings: {
    controls: {
      moveLeft: ["ArrowLeft"],
      moveRight: ["ArrowRight"],
      softDrop: ["ArrowDown"],
      hardDrop: ["Space"],
      rotateCw: ["ArrowUp", "KeyX"],
      rotateCcw: ["KeyZ"],
      rotate180: ["KeyA"],
      hold: ["ShiftLeft", "KeyC"]
    },
    timing: {
      dasFrames: 10,
      arrFrames: 2,
      sdfFramesPerCell: 2,
      lockDelayFrames: 30,
      gravityFramesPerCell: 60
    }
  }
};
