import { useMissionStore } from "../../stores/mission";
import Panel from "./Panel";
import Toggle from "../shared/Toggle";
import Slider from "../shared/Slider";

export default function PhysicsPanel() {
  const includeJ2 = useMissionStore((state) => state.includeJ2);
  const includeDrag = useMissionStore((state) => state.includeDrag);
  const daDotDrag = useMissionStore((state) => state.daDotDrag);
  const setIncludeJ2 = useMissionStore((state) => state.setIncludeJ2);
  const setIncludeDrag = useMissionStore((state) => state.setIncludeDrag);
  const setDaDotDrag = useMissionStore((state) => state.setDaDotDrag);

  // Convert scientific notation to slider-friendly values
  // daDotDrag ranges from -1e-9 (strong) to -1e-11 (weak)
  // Map to 1-100 scale for slider, then convert back
  const dragToSlider = (drag: number): number => {
    // -1e-9 = 100, -1e-10 = 50, -1e-11 = 1
    const exp = Math.log10(-drag);
    return Math.round(((exp + 11) / 2) * 100);
  };

  const sliderToDrag = (slider: number): number => {
    // Reverse: 100 = -1e-9, 50 = -1e-10, 1 = -1e-11
    const exp = (slider / 100) * 2 - 11;
    return -Math.pow(10, exp);
  };

  const sliderValue = dragToSlider(daDotDrag);

  const handleDragSliderChange = (value: number) => {
    setDaDotDrag(sliderToDrag(value));
  };

  // Format drag rate for display
  const formatDragRate = (drag: number): string => {
    const exp = Math.round(Math.log10(-drag));
    const mantissa = (-drag / Math.pow(10, exp)).toFixed(1);
    return `${mantissa}×10^${exp}`;
  };

  return (
    <Panel title="Physics" defaultOpen>
      <div className="space-y-3">
        <Toggle
          label="Include J2"
          value={includeJ2}
          onChange={setIncludeJ2}
        />
        <Toggle
          label="Include Drag"
          value={includeDrag}
          onChange={setIncludeDrag}
        />

        {includeDrag && (
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-zinc-400">Drag Rate (ȧ)</span>
              <span className="text-xs font-mono text-cyan-400">
                {formatDragRate(daDotDrag)} m/s
              </span>
            </div>
            <Slider
              label=""
              value={sliderValue}
              onChange={handleDragSliderChange}
              min={1}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
