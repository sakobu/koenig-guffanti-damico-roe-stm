interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({
  label,
  value,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${disabled ? "text-zinc-600" : "text-zinc-400"}`}
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer
          rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900
          disabled:opacity-50 disabled:cursor-not-allowed
          ${value ? "bg-cyan-500" : "bg-zinc-600"}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${value ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
