import type { Vector3 } from "@orbital";
import { formatValue } from "../../../utils/formatting";

interface HUDVelocityProps {
  velocity: Vector3;
}

export default function HUDVelocity({ velocity }: HUDVelocityProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">
        Velocity
      </span>
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
          <span className="text-zinc-500">Ṙ</span>
          <span className="font-mono text-zinc-200">
            {formatValue(velocity[0], 4)}
          </span>
        </div>
        <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
          <span className="text-zinc-500">İ</span>
          <span className="font-mono text-zinc-200">
            {formatValue(velocity[1], 4)}
          </span>
        </div>
        <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
          <span className="text-zinc-500">Ċ</span>
          <span className="font-mono text-zinc-200">
            {formatValue(velocity[2], 4)}
          </span>
        </div>
      </div>
      <div className="text-[10px] text-zinc-600 text-right">m/s</div>
    </div>
  );
}
