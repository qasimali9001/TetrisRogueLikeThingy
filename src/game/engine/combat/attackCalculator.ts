import type { AttackConfig } from "../../config/gameConfig";

export interface AttackContext {
  linesCleared: number;
  isTSpin: boolean;
  isMini: boolean;
  comboChain: number;
  backToBackActive: boolean;
  perfectClear: boolean;
}

export const calculateAttack = (
  config: AttackConfig,
  context: AttackContext
): number => {
  let base = 0;

  if (context.isTSpin) {
    if (context.isMini) {
      const key = Math.min(context.linesCleared, 2) as 0 | 1 | 2;
      base += config.tSpinMini[key];
    } else if (context.linesCleared >= 1 && context.linesCleared <= 3) {
      base += config.tSpin[context.linesCleared as 1 | 2 | 3];
    }
  } else if (context.linesCleared >= 1 && context.linesCleared <= 4) {
    base += config.lineClear[context.linesCleared as 1 | 2 | 3 | 4];
  }

  if (context.backToBackActive && base > 0) {
    base += config.b2bBonus;
  }

  if (context.comboChain > 0) {
    const comboIndex = Math.min(context.comboChain, config.comboByChain.length - 1);
    base += config.comboByChain[comboIndex];
  }

  if (context.perfectClear) {
    base += config.perfectClearBonus;
  }

  return base;
};
