interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "sm" | "icon";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const variantStyles = {
  primary: "bg-cyan-600 hover:bg-cyan-500 text-white",
  secondary: "bg-zinc-700 hover:bg-zinc-600 text-zinc-300",
  danger: "bg-red-600 hover:bg-red-500 text-white",
};

const sizeStyles = {
  default: "px-3 py-2 text-sm",
  sm: "px-2 py-1.5 text-xs",
  icon: "p-2",
};

export default function Button({
  variant = "secondary",
  size = "default",
  disabled = false,
  onClick,
  children,
  className = "",
  title,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`font-medium rounded transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}
