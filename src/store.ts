import { create } from "zustand";

export type SceneId = "exterior" | "interior";
export type Tier = "low" | "mid" | "high" | "ultra";
export type ControlMode = "orbit" | "fly";

export interface PerfSample {
  fps: number;
  ms: number;
  calls: number;
  tris: number;
  backend: string;
}

interface LookDevState {
  scene: SceneId;
  tier: Tier;
  control: ControlMode;
  photoMode: boolean;
  autoRotate: boolean;
  // effect toggles (clamped by tier in PostFX)
  bloom: boolean;
  vignette: boolean;
  grain: boolean;
  // world / lighting
  timeOfDay: number; // 0..1 → sun elevation
  speed: number; // world scroll speed (m/s)
  // live perf readout (written from inside the canvas)
  perf: PerfSample;

  setScene: (s: SceneId) => void;
  setTier: (t: Tier) => void;
  setControl: (c: ControlMode) => void;
  toggle: (k: "photoMode" | "autoRotate" | "bloom" | "vignette" | "grain") => void;
  setTimeOfDay: (v: number) => void;
  setSpeed: (v: number) => void;
  setPerf: (p: PerfSample) => void;
}

export const useStore = create<LookDevState>((set) => ({
  scene: "exterior",
  tier: "high",
  control: "orbit",
  photoMode: false,
  autoRotate: true,
  bloom: true,
  vignette: true,
  grain: true,
  timeOfDay: 0.45,
  speed: 26,
  perf: { fps: 0, ms: 0, calls: 0, tris: 0, backend: "—" },

  setScene: (scene) => set({ scene }),
  setTier: (tier) => set({ tier }),
  setControl: (control) => set({ control }),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<LookDevState>),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setSpeed: (speed) => set({ speed }),
  setPerf: (perf) => set({ perf }),
}));
