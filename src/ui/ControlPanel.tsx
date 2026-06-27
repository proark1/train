import { useStore, type SceneId, type Tier, type ControlMode } from "../store";
import { TIERS } from "../engine/quality";

const SCENES: { id: SceneId; label: string }[] = [
  { id: "exterior", label: "Exterior" },
  { id: "interior", label: "Interior" },
];
const CAMERAS: { id: ControlMode; label: string }[] = [
  { id: "orbit", label: "Orbit" },
  { id: "fly", label: "Explore" },
];
const TIER_IDS: Tier[] = ["low", "mid", "high", "ultra"];

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.id} className={value === o.id ? "active" : ""} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <label className="check">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={onChange} />
    </label>
  );
}

export function ControlPanel() {
  const s = useStore();

  return (
    <div className="panel controls">
      <h1>ENDLESS TRAIN — Visual Slice</h1>
      <p className="sub">Phase 0 look-dev (PLAN.md §19) · grey-box / procedural art</p>

      <div className="row">
        <label>Scene</label>
        <Seg value={s.scene} options={SCENES} onChange={s.setScene} />
      </div>

      <div className="row">
        <label>Camera</label>
        <Seg value={s.control} options={CAMERAS} onChange={s.setControl} />
      </div>

      <div className="row">
        <label>Quality tier</label>
        <Seg
          value={s.tier}
          options={TIER_IDS.map((id) => ({
            id,
            label: TIERS[id].label + (TIERS[id].nativeOnly ? "*" : ""),
          }))}
          onChange={s.setTier}
        />
      </div>

      <div className="row">
        <label>Post FX</label>
        <Check label="Ambient occlusion" value={s.ao} onChange={() => s.toggle("ao")} />
        <Check label="Bloom" value={s.bloom} onChange={() => s.toggle("bloom")} />
        <Check label="Vignette" value={s.vignette} onChange={() => s.toggle("vignette")} />
        <Check label="Film grain" value={s.grain} onChange={() => s.toggle("grain")} />
        {s.scene === "exterior" && s.control === "orbit" && (
          <Check label="Auto-rotate" value={s.autoRotate} onChange={() => s.toggle("autoRotate")} />
        )}
      </div>

      <div className="row">
        <label>Time of day</label>
        <div className="slider">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.timeOfDay}
            onChange={(e) => s.setTimeOfDay(parseFloat(e.target.value))}
          />
          <span className="val">{Math.round(s.timeOfDay * 100)}</span>
        </div>
      </div>

      <div className="row">
        <label>Train speed</label>
        <div className="slider">
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={s.speed}
            onChange={(e) => s.setSpeed(parseFloat(e.target.value))}
          />
          <span className="val">{s.speed}</span>
        </div>
      </div>

      <div className="row">
        <button
          className="seg"
          style={{ width: "100%", justifyContent: "center", color: "var(--text)", cursor: "pointer" }}
          onClick={() => s.toggle("photoMode")}
        >
          📷 Photo Mode (hide HUD)
        </button>
      </div>

      <p className="hint">
        {s.control === "orbit" ? (
          <>Drag to orbit · scroll to zoom.</>
        ) : (
          <><b>Explore:</b> click to look · <b>WASD</b> move · <b>Space/C</b> up/down · <b>Shift</b> sprint · <b>Esc</b> release.</>
        )}{" "}
        <b>*Ultra</b> is native-Steam-only in the plan (selectable here to compare). Art is procedural grey-box.
      </p>
    </div>
  );
}
