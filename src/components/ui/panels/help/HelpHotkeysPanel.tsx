import Panel from "../Panel";

interface HotkeyRowProps {
  keys: string[];
  description: string;
}

function HotkeyRow({ keys, description }: HotkeyRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-zinc-500">{description}</span>
      <div className="flex gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="px-1.5 py-0.5 bg-zinc-800 text-cyan-400 rounded font-mono"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export default function HelpHotkeysPanel() {
  return (
    <Panel title="Keyboard Shortcuts" defaultOpen>
      <div className="text-xs divide-y divide-zinc-800">
        <HotkeyRow keys={["S"]} description="Toggle sidebar" />
        <HotkeyRow keys={["H"]} description="Toggle HUD" />
        <HotkeyRow keys={["Del", "Bksp"]} description="Delete waypoint" />
        <HotkeyRow keys={["Esc"]} description="Deselect waypoint" />
      </div>
    </Panel>
  );
}
