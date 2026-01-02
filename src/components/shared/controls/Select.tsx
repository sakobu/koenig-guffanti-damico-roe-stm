import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  variant?: 'default' | 'compact';
  size?: 'default' | 'sm';
  prefix?: string;
}

const sizeStyles = {
  default: 'pl-2 pr-6 py-2 text-xs',
  sm: 'pl-2 pr-5 py-0.5 text-xs',
};

export default function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
  variant = 'default',
  size = 'default',
  prefix,
}: SelectProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={isCompact ? '' : 'space-y-1'}>
      {label && !isCompact && (
        <label
          className={`block text-sm ${
            disabled ? 'text-zinc-600' : 'text-zinc-400'
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            e.target.blur();
          }}
          disabled={disabled}
          className={`w-full bg-zinc-800 text-zinc-200 rounded
            border border-zinc-700 appearance-none cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isCompact ? sizeStyles[size] : 'px-3 py-2 text-sm'}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {prefix ? `${prefix} ${option.label}` : option.label}
            </option>
          ))}
        </select>
        <div
          className={`absolute inset-y-0 right-0 flex items-center pointer-events-none
          ${isCompact ? 'pr-1.5' : 'pr-2'}`}
        >
          <ChevronDown
            size={isCompact || size === 'sm' ? 12 : 16}
            className="text-zinc-400"
          />
        </div>
      </div>
    </div>
  );
}
