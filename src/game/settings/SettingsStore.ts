import type { GameConfig, SettingsConfig } from "../config/gameConfig";

const STORAGE_KEY = "tetris-rogue-like-settings";
const STORAGE_VERSION = 1;

interface PersistedSettings {
  version: number;
  settings: SettingsConfig;
}

export class SettingsStore {
  private readonly fallback: SettingsConfig;

  public constructor(defaultConfig: GameConfig) {
    this.fallback = defaultConfig.settings;
  }

  public load(): SettingsConfig {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(this.fallback);
    }

    try {
      const parsed = JSON.parse(raw) as PersistedSettings;
      if (parsed.version !== STORAGE_VERSION) {
        return structuredClone(this.fallback);
      }
      return {
        controls: {
          ...this.fallback.controls,
          ...parsed.settings.controls
        },
        timing: {
          ...this.fallback.timing,
          ...parsed.settings.timing
        }
      };
    } catch {
      return structuredClone(this.fallback);
    }
  }

  public save(settings: SettingsConfig): void {
    const payload: PersistedSettings = {
      version: STORAGE_VERSION,
      settings
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }
}
