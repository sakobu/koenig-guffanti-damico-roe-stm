import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface PanelProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function Panel({
  title,
  defaultOpen = true,
  children,
}: PanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-zinc-800 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="text-xs text-zinc-500 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-500 transition-transform duration-200
            ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out
          ${isOpen ? "max-h-250 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
}
