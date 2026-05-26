import type { SettingsConfig } from "../config/gameConfig";

type TimingKey =
  | "dasFrames"
  | "arrFrames"
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
  { key: "sdfFramesPerCell", label: "SDF (f/cell)", min: 1, max: 20, step: 1 },
  { key: "lockDelayFrames", label: "Lock (frames)", min: 1, max: 60, step: 1 },
  { key: "gravityFramesPerCell", label: "Gravity (f/cell)", min: 1, max: 120, step: 1 }
];

interface CreateSettingsPanelOptions {
  host: HTMLElement;
  initialSettings: SettingsConfig;
  defaultSettings: SettingsConfig;
  onTimingChange: (timing: SettingsConfig["timing"]) => void;
  onSettingsChange: (settings: SettingsConfig) => void;
}

export const createSettingsPanel = ({
  host,
  initialSettings,
  defaultSettings,
  onTimingChange,
  onSettingsChange
}: CreateSettingsPanelOptions): void => {
  const panel = document.createElement("section");
  panel.className = "settings-panel";
  panel.innerHTML = `<h2>Tuning</h2>`;

  const state: SettingsConfig = structuredClone(initialSettings);
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
  actions.appendChild(resetButton);

  const hint = document.createElement("p");
  hint.className = "settings-hint";
  hint.textContent = "Timing is frame-based and saves automatically.";

  panel.append(controls, actions, hint);
  host.appendChild(panel);
};
