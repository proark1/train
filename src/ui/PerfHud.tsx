import { useStore } from "../store";

function fpsClass(fps: number) {
  if (fps >= 55) return "fps-good";
  if (fps >= 30) return "fps-warn";
  return "fps-bad";
}

/** Lightweight perf HUD reading renderer.info (§19.C / §24.5). */
export function PerfHud() {
  const perf = useStore((s) => s.perf);
  const tier = useStore((s) => s.tier);

  return (
    <div className="panel perf">
      <div className="big">
        <span className={fpsClass(perf.fps)}>{perf.fps}</span> <small>FPS · {perf.ms}ms</small>
      </div>
      <div className="grid">
        <span>Draw calls</span>
        <b>{perf.calls}</b>
        <span>Triangles</span>
        <b>{perf.tris.toLocaleString()}</b>
        <span>Tier</span>
        <b style={{ textTransform: "capitalize" }}>{tier}</b>
      </div>
      <div className="backend">▸ {perf.backend} renderer</div>
    </div>
  );
}
