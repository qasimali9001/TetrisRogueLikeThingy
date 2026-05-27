import type { DamageConfig, ShieldConfig } from "../../config/gameConfig";
import type { LockResolutionResult } from "./lineClearModel";

const resolveBaseDamage = (damageConfig: DamageConfig, lockResult: LockResolutionResult): number => {
  if (lockResult.clearType === "none" || lockResult.clearType === "tspin-mini") {
    return 0;
  }

  if (lockResult.clearType === "single") {
    return damageConfig.lineClearBase[1];
  }
  if (lockResult.clearType === "double") {
    return damageConfig.lineClearBase[2];
  }
  if (lockResult.clearType === "triple") {
    return damageConfig.lineClearBase[3];
  }
  if (lockResult.clearType === "tetris") {
    return damageConfig.lineClearBase[4];
  }
  if (lockResult.clearType === "tspin-single") {
    return damageConfig.tSpinBase[1];
  }
  if (lockResult.clearType === "tspin-double") {
    return damageConfig.tSpinBase[2];
  }
  return damageConfig.tSpinBase[3];
};

export const resolveEnemyDamage = (
  damageConfig: DamageConfig,
  lockResult: LockResolutionResult
): number => {
  const baseDamage = resolveBaseDamage(damageConfig, lockResult);
  if (baseDamage <= 0) {
    return 0;
  }

  const comboMultiplier = Math.min(
    1 + Math.max(lockResult.comboChain, 0) * damageConfig.comboMultiplierStep,
    damageConfig.maxComboMultiplier
  );
  const b2bMultiplier = lockResult.b2bBonusApplied ? damageConfig.b2bDifficultMultiplier : 1;
  let damage = Math.round(baseDamage * comboMultiplier * b2bMultiplier);

  if (lockResult.perfectClear) {
    damage += damageConfig.perfectClearBonus;
  }

  return Math.max(damage, 0);
};

export const resolveShieldGain = (
  shieldConfig: ShieldConfig,
  lockResult: LockResolutionResult
): number => {
  let shield = 0;
  if (lockResult.clearType === "tetris") {
    shield += shieldConfig.tetrisShield;
  } else if (lockResult.clearType === "tspin-double") {
    shield += shieldConfig.tSpinDoubleShield;
  } else if (lockResult.clearType === "tspin-triple") {
    shield += shieldConfig.tSpinTripleShield;
  }

  if (lockResult.b2bBonusApplied && shield > 0) {
    shield += shieldConfig.b2bBonusShield;
  }
  return shield;
};
