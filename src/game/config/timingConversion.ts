import type { SettingsConfig, TimingConfig } from "./gameConfig";

const FRAMES_PER_SECOND = 60;
const MS_PER_FRAME = 1000 / FRAMES_PER_SECOND;

export const timingSettingsToRuntimeTiming = (
  timingSettings: SettingsConfig["timing"]
): TimingConfig => ({
  dasMs: timingSettings.dasFrames * MS_PER_FRAME,
  arrMs: timingSettings.arrFrames * MS_PER_FRAME,
  lockDelayMs: timingSettings.lockDelayFrames * MS_PER_FRAME,
  gravityCellsPerSecond: FRAMES_PER_SECOND / Math.max(1, timingSettings.gravityFramesPerCell),
  sdfCellsPerSecond: FRAMES_PER_SECOND / Math.max(1, timingSettings.sdfFramesPerCell)
});
