import type { AttackConfig } from "../../config/gameConfig";
import { calculateAttack } from "./attackCalculator";

export type ClearType =
  | "none"
  | "single"
  | "double"
  | "triple"
  | "tetris"
  | "tspin-single"
  | "tspin-double"
  | "tspin-triple"
  | "tspin-mini";

export interface LockResolutionInput {
  linesCleared: number;
  isTSpin: boolean;
  isMini: boolean;
  perfectClear: boolean;
}

export interface CombatState {
  comboChain: number;
  backToBackChain: boolean;
}

export interface LockResolutionResult {
  clearType: ClearType;
  linesCleared: number;
  comboChain: number;
  backToBackChain: boolean;
  attackSent: number;
  perfectClear: boolean;
  isTSpin: boolean;
  isMini: boolean;
}

const getClearType = (input: LockResolutionInput): ClearType => {
  if (input.linesCleared === 0) {
    return "none";
  }
  if (input.isTSpin) {
    if (input.isMini) {
      return "tspin-mini";
    }
    if (input.linesCleared === 1) {
      return "tspin-single";
    }
    if (input.linesCleared === 2) {
      return "tspin-double";
    }
    return "tspin-triple";
  }
  if (input.linesCleared === 1) {
    return "single";
  }
  if (input.linesCleared === 2) {
    return "double";
  }
  if (input.linesCleared === 3) {
    return "triple";
  }
  return "tetris";
};

const isDifficultClear = (clearType: ClearType): boolean =>
  clearType === "tetris" ||
  clearType === "tspin-single" ||
  clearType === "tspin-double" ||
  clearType === "tspin-triple" ||
  clearType === "tspin-mini";

export const resolveLockCombat = (
  attackConfig: AttackConfig,
  previousState: CombatState,
  input: LockResolutionInput
): LockResolutionResult => {
  const clearType = getClearType(input);
  const didClear = input.linesCleared > 0;
  const nextComboChain = didClear ? previousState.comboChain + 1 : -1;
  const difficult = isDifficultClear(clearType);
  const b2bBonusActive = difficult && previousState.backToBackChain;
  const nextBackToBackChain = didClear ? difficult : previousState.backToBackChain;

  const attackSent = didClear
    ? calculateAttack(attackConfig, {
        linesCleared: input.linesCleared,
        isTSpin: input.isTSpin,
        isMini: input.isMini,
        comboChain: nextComboChain,
        backToBackActive: b2bBonusActive,
        perfectClear: input.perfectClear
      })
    : 0;

  return {
    clearType,
    linesCleared: input.linesCleared,
    comboChain: nextComboChain,
    backToBackChain: nextBackToBackChain,
    attackSent,
    perfectClear: input.perfectClear,
    isTSpin: input.isTSpin,
    isMini: input.isMini
  };
};
