interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  showEndLabels?: boolean;
}

export default function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
  formatValue,
  showEndLabels = false,
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString();
  const displayMin = formatValue ? formatValue(min) : min.toString();
  const displayMax = formatValue ? formatValue(max) : max.toString();

  return (
    <div className="space-y-1">
      {label && !showEndLabels && (
        <div className="flex items-center justify-between">
          <span
            className={`text-sm ${disabled ? "text-zinc-600" : "text-zinc-400"}`}
          >
            {label}
          </span>
          <span
            className={`text-sm font-mono ${
              disabled ? "text-zinc-600" : "text-cyan-400"
            }`}
          >
            {displayValue}
            {unit && !formatValue && <span className="text-zinc-500 ml-0.5">{unit}</span>}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-cyan-500
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-cyan-500
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
      />
      {showEndLabels && (
        <div className="flex justify-between text-xs font-mono text-zinc-400">
          <span>{displayMin}</span>
          <span>{displayMax}</span>
        </div>
      )}
    </div>
  );
}
