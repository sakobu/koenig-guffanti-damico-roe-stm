interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  primary: "bg-cyan-600 hover:bg-cyan-500 text-white",
  secondary: "bg-zinc-700 hover:bg-zinc-600 text-zinc-300",
  danger: "bg-red-600 hover:bg-red-500 text-white",
};

export default function Button({
  variant = "secondary",
  disabled = false,
  onClick,
  children,
  className = "",
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 text-sm font-medium rounded transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
