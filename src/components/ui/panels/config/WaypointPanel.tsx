import { useEffect } from 'react';

import { Gauge } from 'lucide-react';

import { useMissionStore } from '@stores/mission';
import { hasVelocity } from '@utils/metrics';

import Button from '../../../shared/controls/Button';
import Panel from '../Panel';
import WaypointEditor from './WaypointEditor';

export default function WaypointPanel() {
  const waypoints = useMissionStore((s) => s.waypoints);
  const selectedIndex = useMissionStore((s) => s.selectedWaypointIndex);
  const selectWaypoint = useMissionStore((s) => s.selectWaypoint);
  const removeWaypoint = useMissionStore((s) => s.removeWaypoint);
  const clearWaypoints = useMissionStore((s) => s.clearWaypoints);

  const selectedWaypoint =
    selectedIndex !== null ? waypoints[selectedIndex] : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        selectWaypoint(null);
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedIndex !== null
      ) {
        e.preventDefault();
        removeWaypoint(selectedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, selectWaypoint, removeWaypoint]);

  return (
    <Panel title="Waypoints" defaultOpen>
      <div className="space-y-3">
        <div className="text-xs text-zinc-500">Shift+click on grid to add</div>

        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={() =>
              selectedIndex !== null && removeWaypoint(selectedIndex)
            }
            disabled={selectedIndex === null}
            className="flex-1"
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            onClick={clearWaypoints}
            disabled={waypoints.length === 0}
          >
            Clear
          </Button>
        </div>

        {/* Waypoint list */}
        {waypoints.length > 0 ? (
          <div className="space-y-1">
            {waypoints.map((wp, i) => (
              <div
                key={i}
                onClick={() => selectWaypoint(i)}
                className={`text-xs font-mono px-2 py-1 rounded cursor-pointer
                  transition-colors flex items-center justify-between ${
                    selectedIndex === i
                      ? 'bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/50'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                  }`}
              >
                <span>
                  WP{i + 1}: [{Math.round(wp.position[0])},{' '}
                  {Math.round(wp.position[1])}, {Math.round(wp.position[2])}]
                </span>
                {hasVelocity(wp.velocity) && (
                  <span title="Has drift velocity">
                    <Gauge size={12} className="text-cyan-400 ml-2" />
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-zinc-600 italic">No waypoints</div>
        )}

        {/* Editor - key causes remount on selection change */}
        {selectedWaypoint && selectedIndex !== null && (
          <WaypointEditor
            key={selectedIndex}
            waypoint={selectedWaypoint}
            index={selectedIndex}
          />
        )}
      </div>
    </Panel>
  );
}
