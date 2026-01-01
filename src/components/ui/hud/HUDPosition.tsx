import { useState, useMemo } from "react";
import { useMissionStore } from "../../../stores/mission";
import { ricToROE } from "@orbital";
import type { QuasiNonsingularROE, RelativeState, Vector3 } from "@orbital";
import Select from "../../shared/Select";
import { formatValue } from "../../../utils/formatting";

type CoordinateMode = "ric" | "roe";

const COORD_OPTIONS = [
  { value: "ric", label: "RIC" },
  { value: "roe", label: "ROE" },
];

interface HUDPositionProps {
  position: Vector3;
  velocity: Vector3;
}

export default function HUDPosition({ position, velocity }: HUDPositionProps) {
  const chief = useMissionStore((s) => s.chief);
  const [coordMode, setCoordMode] = useState<CoordinateMode>("ric");

  const roe = useMemo<QuasiNonsingularROE | null>(() => {
    if (coordMode !== "roe") return null;
    try {
      const state: RelativeState = {
        position: [...position] as Vector3,
        velocity: [...velocity] as Vector3,
      };
      return ricToROE(chief, state);
    } catch {
      return null;
    }
  }, [coordMode, position, velocity, chief]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">RIC/ROE</span>
        <Select
          variant="compact"
          size="sm"
          value={coordMode}
          onChange={(v) => setCoordMode(v as CoordinateMode)}
          options={COORD_OPTIONS}
        />
      </div>
      <span className="text-xs text-zinc-500 uppercase tracking-wider">
        Position
      </span>

      {coordMode === "ric" ? (
        <>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
              <span className="text-zinc-500">R</span>
              <span className="font-mono text-zinc-200">
                {formatValue(position[0])}
              </span>
            </div>
            <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
              <span className="text-zinc-500">I</span>
              <span className="font-mono text-zinc-200">
                {formatValue(position[1])}
              </span>
            </div>
            <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
              <span className="text-zinc-500">C</span>
              <span className="font-mono text-zinc-200">
                {formatValue(position[2])}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-600 text-right">m</div>
        </>
      ) : roe ? (
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
            <span className="text-zinc-500">δa</span>
            <span className="font-mono text-zinc-200">
              {formatValue(roe.da, 6)}
            </span>
          </div>
          <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
            <span className="text-zinc-500">δλ</span>
            <span className="font-mono text-zinc-200">
              {formatValue(roe.dlambda, 6)}
            </span>
          </div>
          <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
            <span className="text-zinc-500">δex</span>
            <span className="font-mono text-zinc-200">
              {formatValue(roe.dex, 6)}
            </span>
          </div>
          <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
            <span className="text-zinc-500">δey</span>
            <span className="font-mono text-zinc-200">
              {formatValue(roe.dey, 6)}
            </span>
          </div>
          <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
            <span className="text-zinc-500">δix</span>
            <span className="font-mono text-zinc-200">
              {formatValue(roe.dix, 6)}
            </span>
          </div>
          <div className="bg-zinc-800/50 rounded px-2 py-1 flex justify-between">
            <span className="text-zinc-500">δiy</span>
            <span className="font-mono text-zinc-200">
              {formatValue(roe.diy, 6)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-500 italic">
          ROE conversion unavailable
        </div>
      )}
    </div>
  );
}
