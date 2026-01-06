import { useDeviceType } from '@hooks/useDeviceType';

import Panel from '../Panel';

export default function HelpWaypointsPanel() {
  const { isTouchPrimary } = useDeviceType();

  return (
    <Panel title="Adding Waypoints" defaultOpen>
      <div className="space-y-3 text-xs text-zinc-500">
        {isTouchPrimary ? (
          <>
            <p>
              <span className="text-cyan-400">Long-press</span> (~0.5s) on the
              grid plane to add a waypoint.
            </p>
            <p>
              <span className="text-zinc-400">Drag</span> any waypoint to
              reposition it in the R-I plane.
            </p>
            <p>
              <span className="text-zinc-400">Two-finger vertical drag</span> to
              adjust the C (cross-track) axis when a waypoint is selected.
            </p>
          </>
        ) : (
          <>
            <p>
              <kbd className="px-1.5 py-0.5 bg-zinc-800 text-cyan-400 rounded font-mono">
                Shift
              </kbd>
              {' + click'} on the grid plane to add a waypoint.
            </p>
            <p>
              <span className="text-zinc-400">Drag</span> any waypoint to
              reposition it in the R-I plane.
            </p>
            <p>
              <span className="text-zinc-400">Scroll</span> to adjust the C
              (cross-track) axis — while selected (trackpad) or while dragging
              (mouse).
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}
