interface HUDMetricsProps {
  distance: number;
  distanceTraveled: number;
}

export default function HUDMetrics({
  distance,
  distanceTraveled,
}: HUDMetricsProps) {
  return (
    <div className="space-y-1 border-t border-zinc-700 pt-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-500">Range:</span>
        <span className="font-mono text-cyan-400">{distance.toFixed(2)} m</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-500">Traveled:</span>
        <span className="font-mono text-cyan-400">
          {distanceTraveled.toFixed(2)} m
        </span>
      </div>
    </div>
  );
}
