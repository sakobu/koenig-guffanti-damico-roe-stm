import { useState } from 'react';

import type { Vector3, Waypoint } from '@orbital';

import { useMissionStore } from '@stores/mission';
import { round2 } from '@utils/formatting';
import { getVelocityPreset } from '@utils/metrics';

import Select from '../../../shared/controls/Select';

type VelocityPreset =
  | 'stationary'
  | 'driftForward'
  | 'driftBackward'
  | 'custom';

const VELOCITY_PRESETS: Record<
  Exclude<VelocityPreset, 'custom'>,
  Vector3 | undefined
> = {
  stationary: undefined,
  driftForward: [0, 0.1, 0],
  driftBackward: [0, -0.1, 0],
};

interface WaypointEditorProps {
  waypoint: Waypoint;
  index: number;
}

export default function WaypointEditor({
  waypoint,
  index,
}: WaypointEditorProps) {
  const updateWaypoint = useMissionStore((s) => s.updateWaypoint);
  const updateWaypointVelocity = useMissionStore(
    (s) => s.updateWaypointVelocity
  );

  // Position state - initialized from waypoint prop (resets via key on parent)
  const [position, setPosition] = useState({
    r: round2(waypoint.position[0]).toString(),
    i: round2(waypoint.position[1]).toString(),
    c: round2(waypoint.position[2]).toString(),
  });

  // Velocity state
  const [velocity, setVelocity] = useState({
    r: round2(waypoint.velocity?.[0] ?? 0).toString(),
    i: round2(waypoint.velocity?.[1] ?? 0).toString(),
    c: round2(waypoint.velocity?.[2] ?? 0).toString(),
  });

  const [isCustomMode, setIsCustomMode] = useState(
    getVelocityPreset(waypoint.velocity) === 'custom'
  );

  // Position handlers
  const handlePositionChange = (axis: 'r' | 'i' | 'c', value: string) => {
    setPosition((prev) => ({ ...prev, [axis]: value }));
  };

  const commitPosition = () => {
    const r = round2(parseFloat(position.r) || 0);
    const i = round2(parseFloat(position.i) || 0);
    const c = round2(parseFloat(position.c) || 0);
    updateWaypoint(index, [r, i, c]);
  };

  // Velocity handlers
  const handleVelocityPresetChange = (preset: string) => {
    if (preset === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      const value = VELOCITY_PRESETS[preset as keyof typeof VELOCITY_PRESETS];
      updateWaypointVelocity(index, value);
    }
  };

  const handleVelocityChange = (axis: 'r' | 'i' | 'c', value: string) => {
    setVelocity((prev) => ({ ...prev, [axis]: value }));
  };

  const commitVelocity = () => {
    const r = round2(parseFloat(velocity.r) || 0);
    const i = round2(parseFloat(velocity.i) || 0);
    const c = round2(parseFloat(velocity.c) || 0);

    if (Math.abs(r) < 0.001 && Math.abs(i) < 0.001 && Math.abs(c) < 0.001) {
      updateWaypointVelocity(index, undefined);
    } else {
      updateWaypointVelocity(index, [r, i, c]);
    }
  };

  const currentPreset = isCustomMode
    ? 'custom'
    : getVelocityPreset(waypoint.velocity);

  const velocityOptions = [
    { value: 'stationary', label: 'Stationary' },
    { value: 'driftForward', label: 'Drift +I (along-track)' },
    { value: 'driftBackward', label: 'Drift -I (retreat)' },
    { value: 'custom', label: 'Custom...' },
  ];

  const inputClass = `w-full px-1.5 py-1 text-xs bg-zinc-800 text-zinc-200 rounded
    border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

  return (
    <div className="border-t border-zinc-700 pt-3 space-y-3">
      {/* Position editing */}
      <div className="space-y-2">
        <label className="block text-sm text-zinc-400">Position (m)</label>
        <div className="grid grid-cols-3 gap-2">
          {(['r', 'i', 'c'] as const).map((axis) => (
            <div key={axis}>
              <label className="block text-xs text-zinc-500 mb-1">
                {axis.toUpperCase()}
              </label>
              <input
                type="number"
                value={position[axis]}
                onChange={(e) => handlePositionChange(axis, e.target.value)}
                onBlur={commitPosition}
                onKeyDown={(e) => e.key === 'Enter' && commitPosition()}
                step="1"
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Velocity editing */}
      <div className="space-y-2">
        <Select
          label="Arrival Velocity"
          value={currentPreset}
          onChange={handleVelocityPresetChange}
          options={velocityOptions}
        />

        {currentPreset === 'custom' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(['r', 'i', 'c'] as const).map((axis) => (
              <div key={axis}>
                <label className="block text-xs text-zinc-500 mb-1">
                  {axis.toUpperCase()} (m/s)
                </label>
                <input
                  type="number"
                  value={velocity[axis]}
                  onChange={(e) => handleVelocityChange(axis, e.target.value)}
                  onBlur={commitVelocity}
                  onKeyDown={(e) => e.key === 'Enter' && commitVelocity()}
                  step="0.01"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
