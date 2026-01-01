import Panel from "../Panel";

export default function HelpCameraPanel() {
  return (
    <Panel title="Camera Controls" defaultOpen={false}>
      <div className="space-y-3 text-xs text-zinc-400">
        <p>
          <span className="text-zinc-300">Scroll</span> to zoom in/out.
        </p>
        <p>
          <span className="text-zinc-300">Click and drag</span> to rotate the
          view around the Chief spacecraft.
        </p>
      </div>
    </Panel>
  );
}
