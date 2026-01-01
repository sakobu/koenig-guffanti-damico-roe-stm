import { Play, Pause, RotateCcw } from "lucide-react";
import { useMissionStore } from "@stores/mission";
import { useSimulationStore, formatTime } from "@stores/simulation";
import Button from "../../shared/Button";
import Select from "../../shared/Select";
import Slider from "../../shared/Slider";

const SPEED_OPTIONS = [
  { value: "1", label: "1x" },
  { value: "50", label: "50x" },
  { value: "100", label: "100x" },
  { value: "500", label: "500x" },
];

export default function HUDPlayback() {
  const trajectoryPoints = useMissionStore((s) => s.trajectoryPoints);
  const missionPlan = useMissionStore((s) => s.missionPlan);

  const time = useSimulationStore((s) => s.time);
  const playing = useSimulationStore((s) => s.playing);
  const speed = useSimulationStore((s) => s.speed);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const reset = useSimulationStore((s) => s.reset);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const setTime = useSimulationStore((s) => s.setTime);

  const totalTime = missionPlan?.totalTime ?? 0;

  const handleScrub = (newTime: number) => {
    setTime(newTime, trajectoryPoints);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Reset */}
        <Button size="icon" onClick={reset} title="Reset">
          <RotateCcw size={14} className="text-zinc-300" />
        </Button>

        {/* Play/Pause */}
        <Button
          variant="primary"
          size="icon"
          onClick={playing ? pause : play}
          disabled={!missionPlan || trajectoryPoints.length === 0}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause size={14} className="text-white" />
          ) : (
            <Play size={14} className="text-white" />
          )}
        </Button>

        {/* Speed Selector */}
        <div className="flex-1">
          <Select
            variant="compact"
            value={speed.toString()}
            onChange={(v) => setSpeed(parseInt(v))}
            options={SPEED_OPTIONS}
            prefix="Speed:"
          />
        </div>
      </div>

      {/* Progress Slider */}
      <Slider
        value={time}
        onChange={handleScrub}
        min={0}
        max={totalTime || 1}
        step={1}
        disabled={totalTime === 0}
      />
      <div className="flex justify-between text-xs font-mono text-zinc-400">
        <span>{formatTime(time)}</span>
        <span>{formatTime(totalTime)}</span>
      </div>
    </div>
  );
}
