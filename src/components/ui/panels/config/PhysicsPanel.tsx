import { useMissionStore } from "@stores/mission";
import Panel from "../Panel";
import Toggle from "../../../shared/Toggle";
import Slider from "../../../shared/Slider";

/** Eccentricity threshold for eccentric drag model (from Koenig et al. 2017) */
const ECCENTRICITY_THRESHOLD = 0.05;

export default function PhysicsPanel() {
  const chief = useMissionStore((state) => state.chief);
  const includeJ2 = useMissionStore((state) => state.includeJ2);
  const includeDrag = useMissionStore((state) => state.includeDrag);
  const daDotDrag = useMissionStore((state) => state.daDotDrag);
  const dexDotDrag = useMissionStore((state) => state.dexDotDrag);
  const deyDotDrag = useMissionStore((state) => state.deyDotDrag);
  const setIncludeJ2 = useMissionStore((state) => state.setIncludeJ2);
  const setIncludeDrag = useMissionStore((state) => state.setIncludeDrag);
  const setDaDotDrag = useMissionStore((state) => state.setDaDotDrag);
  const setDexDotDrag = useMissionStore((state) => state.setDexDotDrag);
  const setDeyDotDrag = useMissionStore((state) => state.setDeyDotDrag);

  // Determine if near-circular orbit (requires arbitrary drag model)
  const isNearCircular = chief.eccentricity < ECCENTRICITY_THRESHOLD;

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

  // For dex/dey: range from -1e-10 (strong) to -1e-12 (weak)
  // Can also be positive, so we use absolute values
  const eccentricityDragToSlider = (drag: number): number => {
    if (drag === 0) return 50; // Center position for zero
    const sign = Math.sign(drag);
    const absVal = Math.abs(drag);
    // Map 1e-12 to 1e-10 to 0-100 scale
    const exp = Math.log10(absVal);
    const normalized = ((exp + 12) / 2) * 100;
    // Use 50 as center, 0-50 for negative, 50-100 for positive
    return sign > 0 ? 50 + normalized / 2 : 50 - normalized / 2;
  };

  const sliderToEccentricityDrag = (slider: number): number => {
    if (slider === 50) return 0;
    const isPositive = slider > 50;
    const normalized = isPositive ? (slider - 50) * 2 : (50 - slider) * 2;
    const exp = (normalized / 100) * 2 - 12;
    const value = Math.pow(10, exp);
    return isPositive ? value : -value;
  };

  const handleDexSliderChange = (value: number) => {
    setDexDotDrag(sliderToEccentricityDrag(value));
  };

  const handleDeySliderChange = (value: number) => {
    setDeyDotDrag(sliderToEccentricityDrag(value));
  };

  // J2/Drag coupling: drag STMs inherently include J2 effects
  // Cannot have drag without J2 (see propagate.ts)
  const handleJ2Change = (value: boolean) => {
    setIncludeJ2(value);
    if (!value && includeDrag) {
      setIncludeDrag(false);
    }
  };

  // Format drag rate for display
  const formatDragRate = (drag: number): string => {
    const exp = Math.round(Math.log10(-drag));
    const mantissa = (-drag / Math.pow(10, exp)).toFixed(1);
    return `${mantissa}×10^${exp}`;
  };

  // Format eccentricity derivative for display (can be positive or negative)
  const formatEccentricityRate = (drag: number): string => {
    if (drag === 0) return "0";
    const sign = drag < 0 ? "-" : "+";
    const absVal = Math.abs(drag);
    const exp = Math.round(Math.log10(absVal));
    const mantissa = (absVal / Math.pow(10, exp)).toFixed(1);
    return `${sign}${mantissa}×10^${exp}`;
  };

  return (
    <Panel title="Physics" defaultOpen>
      <div className="space-y-3">
        <Toggle
          label="Include J2"
          value={includeJ2}
          onChange={handleJ2Change}
        />
        <Toggle
          label="Include Drag"
          value={includeDrag}
          onChange={setIncludeDrag}
          disabled={!includeJ2}
        />

        {includeDrag && (
          <div className="pt-2 border-t border-zinc-800 space-y-4">
            {/* Semi-major axis derivative */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">Drag Rate (ȧ)</span>
                <span className="text-xs font-mono text-cyan-400">
                  {formatDragRate(daDotDrag)} /s
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

            {/* Near-circular orbit: show eccentricity derivatives */}
            {isNearCircular && (
              <>
                <div className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                  Near-circular orbit (e &lt; 0.05): arbitrary drag model
                </div>

                {/* Eccentricity x-component derivative */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">eₓ Rate (ėₓ)</span>
                    <span className="text-xs font-mono text-cyan-400">
                      {formatEccentricityRate(dexDotDrag)} /s
                    </span>
                  </div>
                  <Slider
                    label=""
                    value={eccentricityDragToSlider(dexDotDrag)}
                    onChange={handleDexSliderChange}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-zinc-600 mt-1">
                    <span>-ve</span>
                    <span>0</span>
                    <span>+ve</span>
                  </div>
                </div>

                {/* Eccentricity y-component derivative */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">eᵧ Rate (ėᵧ)</span>
                    <span className="text-xs font-mono text-cyan-400">
                      {formatEccentricityRate(deyDotDrag)} /s
                    </span>
                  </div>
                  <Slider
                    label=""
                    value={eccentricityDragToSlider(deyDotDrag)}
                    onChange={handleDeySliderChange}
                    min={0}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-zinc-600 mt-1">
                    <span>-ve</span>
                    <span>0</span>
                    <span>+ve</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
