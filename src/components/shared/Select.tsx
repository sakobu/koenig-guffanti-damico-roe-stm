import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: SelectProps) {
  return (
    <div className="space-y-1">
      <label
        className={`block text-sm ${
          disabled ? "text-zinc-600" : "text-zinc-400"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            e.target.blur(); // Remove focus after selection
          }}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm bg-zinc-800 text-zinc-200 rounded
            border border-zinc-700 appearance-none cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown size={16} className="text-zinc-400" />
        </div>
      </div>
    </div>
  );
}
