import { Application } from "pixi.js";
import { defaultGameConfig } from "./config/gameConfig";
import { GameLoop } from "./core/GameLoop";
import { TetrisEngine } from "./engine/TetrisEngine";
import { KeyboardInput } from "./engine/input/KeyboardInput";
import { PixiRenderer } from "./rendering/PixiRenderer";
import { SettingsStore } from "./settings/SettingsStore";

export const bootstrapGame = async (): Promise<void> => {
  const host = document.getElementById("app");
  if (!host) {
    throw new Error("Missing #app root.");
  }

  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0
  });
  host.appendChild(app.canvas);

  const settingsStore = new SettingsStore(defaultGameConfig);
  const settings = settingsStore.load();
  const keyboardInput = new KeyboardInput(settings.controls);

  const engine = new TetrisEngine(defaultGameConfig, keyboardInput);
  const renderer = new PixiRenderer(app);
  const gameLoop = new GameLoop({
    update: (deltaMs) => {
      engine.update(deltaMs);
      renderer.render(engine.getViewState());
    }
  });

  gameLoop.start();
};
