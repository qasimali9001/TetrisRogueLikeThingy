import type { SettingsConfig } from "../config/gameConfig";
import type { GameMode } from "../core/GameState";

type TimingKey =
  | "dasFrames"
  | "arrFrames"
  | "dcdFrames"
  | "sdfFramesPerCell"
  | "lockDelayFrames"
  | "gravityFramesPerCell";

interface SliderDefinition {
  key: TimingKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDefinition[] = [
  { key: "dasFrames", label: "DAS (frames)", min: 0, max: 30, step: 1 },
  { key: "arrFrames", label: "ARR (frames)", min: 0, max: 10, step: 1 },
  { key: "dcdFrames", label: "DCD (frames)", min: 0, max: 10, step: 1 },
  { key: "sdfFramesPerCell", label: "SDF (f/cell)", min: 1, max: 20, step: 1 },
  { key: "lockDelayFrames", label: "Lock (frames)", min: 1, max: 60, step: 1 },
  { key: "gravityFramesPerCell", label: "Gravity (f/cell)", min: 1, max: 120, step: 1 }
];

interface CreateSettingsPanelOptions {
  host: HTMLElement;
  initialSettings: SettingsConfig;
  defaultSettings: SettingsConfig;
  initialMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onTimingChange: (timing: SettingsConfig["timing"]) => void;
  onSettingsChange: (settings: SettingsConfig) => void;
  onBoardReset: () => void;
}

export const createSettingsPanel = ({
  host,
  initialSettings,
  defaultSettings,
  initialMode,
  onModeChange,
  onTimingChange,
  onSettingsChange,
  onBoardReset
}: CreateSettingsPanelOptions): void => {
  const panel = document.createElement("section");
  panel.className = "settings-panel";
  panel.innerHTML = `<h2>Tuning</h2>`;

  const state: SettingsConfig = structuredClone(initialSettings);
  let modeState: GameMode = initialMode;
  const controls = document.createElement("div");
  controls.className = "settings-grid";
  const sliderInputs = new Map<TimingKey, HTMLInputElement>();
  const sliderValues = new Map<TimingKey, HTMLSpanElement>();

  for (const slider of SLIDERS) {
    const row = document.createElement("label");
    row.className = "settings-row";

    const name = document.createElement("span");
    name.textContent = slider.label;

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.value = String(state.timing[slider.key]);

    const valueText = document.createElement("span");
    valueText.className = "settings-value";
    valueText.textContent = input.value;
    sliderInputs.set(slider.key, input);
    sliderValues.set(slider.key, valueText);

    input.addEventListener("input", () => {
      const parsed = Number(input.value);
      state.timing[slider.key] = parsed;
      valueText.textContent = input.value;
      onTimingChange({ ...state.timing });
      onSettingsChange(structuredClone(state));
    });

    row.append(name, input, valueText);
    controls.append(row);
  }

  const actions = document.createElement("div");
  actions.className = "settings-actions";
  const modeRow = document.createElement("div");
  modeRow.className = "mode-toggle";
  const modeLabel = document.createElement("span");
  modeLabel.textContent = "Mode";
  const modeSelect = document.createElement("select");
  modeSelect.className = "mode-select";
  modeSelect.innerHTML = `
    <option value="zen">Practice (Zen)</option>
    <option value="vs">VS (AI)</option>
  `;
  modeSelect.value = modeState;
  modeSelect.addEventListener("change", () => {
    modeState = modeSelect.value === "zen" ? "zen" : "vs";
    onModeChange(modeState);
  });
  modeRow.append(modeLabel, modeSelect);

  const resetButton = document.createElement("button");
  resetButton.className = "settings-reset";
  resetButton.type = "button";
  resetButton.textContent = "Reset Timing";
  resetButton.addEventListener("click", () => {
    state.timing = structuredClone(defaultSettings.timing);
    for (const slider of SLIDERS) {
      const nextValue = String(state.timing[slider.key]);
      const input = sliderInputs.get(slider.key);
      const valueText = sliderValues.get(slider.key);
      if (input) {
        input.value = nextValue;
      }
      if (valueText) {
        valueText.textContent = nextValue;
      }
    }
    onTimingChange({ ...state.timing });
    onSettingsChange(structuredClone(state));
  });
  const resetBoardButton = document.createElement("button");
  resetBoardButton.className = "settings-reset";
  resetBoardButton.type = "button";
  resetBoardButton.textContent = "Reset Board (R)";
  resetBoardButton.addEventListener("click", onBoardReset);

  actions.append(resetButton, resetBoardButton);

  const hint = document.createElement("p");
  hint.className = "settings-hint";
  hint.textContent = "Timing is frame-based and saves automatically.";

  panel.append(modeRow, controls, actions, hint);
  host.appendChild(panel);
};
