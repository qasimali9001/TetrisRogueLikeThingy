import type { ControlActionBindings } from "../../config/gameConfig";
import type { InputAction } from "./inputTypes";

export class KeyboardInput {
  private readonly keysDown = new Set<string>();
  private bindings: ControlActionBindings;

  public constructor(bindings: ControlActionBindings) {
    this.bindings = bindings;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  public setBindings(bindings: ControlActionBindings): void {
    this.bindings = bindings;
  }

  public isActionDown(action: InputAction): boolean {
    return this.bindings[action].some((code) => this.keysDown.has(code));
  }

  public consumeAction(action: InputAction): boolean {
    const candidates = this.bindings[action];
    const found = candidates.find((code) => this.keysDown.has(code));
    if (!found) {
      return false;
    }
    this.keysDown.delete(found);
    return true;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.keysDown.add(event.code);
    if (event.code.startsWith("Arrow") || event.code === "Space") {
      event.preventDefault();
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keysDown.delete(event.code);
  };
}
