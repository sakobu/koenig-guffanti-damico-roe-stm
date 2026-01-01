import { useState } from 'react';

import { AlertTriangle, Check, ChevronDown, X } from 'lucide-react';

import type { ManeuverLeg } from '@orbital';

import { useMissionStore } from '@stores/mission';
import { formatPosition } from '@utils/formatting';

import Panel from '../Panel';

/**
 * Expandable row for displaying leg details
 */
function LegRow({
  leg,
  index,
  isExpanded,
  onToggle,
}: {
  leg: ManeuverLeg;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded overflow-hidden">
      {/* Collapsed header - always visible */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-2 py-1.5 text-xs
          transition-colors cursor-pointer
          ${isExpanded ? 'bg-zinc-700/50' : 'bg-zinc-800/50 hover:bg-zinc-700/50'}`}
      >
        <span className="font-mono text-zinc-300">
          Leg {index + 1}: {leg.totalDeltaV.toFixed(3)} m/s
        </span>
        <div className="flex items-center gap-2">
          {!leg.converged && (
            <span title="Did not converge">
              <AlertTriangle size={14} className="text-amber-400" />
            </span>
          )}
          <ChevronDown
            size={12}
            className={`text-zinc-500 transition-transform duration-200
              ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
          />
        </div>
      </button>

      {/* Expanded details */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out
          ${isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pl-3 py-2 border-l-2 border-cyan-600 bg-zinc-800/30 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">From</span>
            <span className="font-mono text-zinc-400">
              {formatPosition(leg.from)} m
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">To</span>
            <span className="font-mono text-zinc-400">
              {formatPosition(leg.to)} m
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">TOF</span>
            <span className="font-mono text-zinc-400">
              {(leg.tof / 60).toFixed(1)} min
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Departure ΔV</span>
            <span className="font-mono text-cyan-400">
              {leg.burn1.magnitude.toFixed(4)} m/s
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Arrival ΔV</span>
            <span className="font-mono text-cyan-400">
              {leg.burn2.magnitude.toFixed(4)} m/s
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Converged</span>
            {leg.converged ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <X size={14} className="text-red-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPanel() {
  const missionPlan = useMissionStore((state) => state.missionPlan);

  // Track which leg is expanded (null = all collapsed)
  const [expandedLeg, setExpandedLeg] = useState<number | null>(null);

  const handleToggleLeg = (index: number) => {
    setExpandedLeg((prev) => (prev === index ? null : index));
  };

  if (!missionPlan) {
    return (
      <Panel title="Results" defaultOpen>
        <div className="text-xs text-zinc-600 italic">
          Add waypoints to see mission results
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Results" defaultOpen>
      <div className="space-y-3">
        {/* Summary section */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Total ΔV:</span>
            <span className="font-mono text-cyan-400">
              {missionPlan.totalDeltaV.toFixed(4)} m/s
            </span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Total TOF:</span>
            <span className="font-mono text-cyan-400">
              {(missionPlan.totalTime / 60).toFixed(1)} min
            </span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Converged:</span>
            {missionPlan.converged ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <X size={14} className="text-red-400" />
            )}
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Legs:</span>
            <span className="font-mono text-zinc-300">
              {missionPlan.legs.length}
            </span>
          </div>
        </div>

        {/* Per-leg breakdown */}
        {missionPlan.legs.length > 0 && (
          <div className="pt-2 border-t border-zinc-800 space-y-1">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Per-Leg Breakdown
            </div>
            {missionPlan.legs.map((leg, i) => (
              <LegRow
                key={i}
                leg={leg}
                index={i}
                isExpanded={expandedLeg === i}
                onToggle={() => handleToggleLeg(i)}
              />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
