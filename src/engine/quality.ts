import type { Tier } from "../store";

/**
 * Quality-tier matrix (PLAN.md §24.2, trimmed to what the look-dev slice exercises).
 * `tier` is the CEILING the user picks; an adaptive scaler would float down within it
 * at runtime (not yet implemented in this slice — see §6 / §24.1).
 *
 * ULTRA is flagged native-only in the plan; in the browser slice it is selectable so the
 * look can be compared, but it is labelled accordingly in the UI.
 */
export interface TierSettings {
  label: string;
  dpr: number; // device-pixel-ratio cap (render scale proxy)
  shadows: boolean;
  shadowMapSize: number;
  cascades: number; // informational (single dir light here)
  drawChunks: number; // world-recycle draw distance (number of ground chunks)
  maxAnisotropy: number;
  bloomAllowed: boolean;
  aoAllowed: boolean;
  nativeOnly: boolean;
  enemyCap: number; // informational placeholder for §9 agent cap
}

export const TIERS: Record<Tier, TierSettings> = {
  low: {
    label: "Low",
    dpr: 0.75,
    shadows: false,
    shadowMapSize: 1024,
    cascades: 1,
    drawChunks: 6,
    maxAnisotropy: 2,
    bloomAllowed: false,
    aoAllowed: false,
    nativeOnly: false,
    enemyCap: 50,
  },
  mid: {
    label: "Mid",
    dpr: 1,
    shadows: true,
    shadowMapSize: 2048,
    cascades: 2,
    drawChunks: 8,
    maxAnisotropy: 4,
    bloomAllowed: true,
    aoAllowed: true,
    nativeOnly: false,
    enemyCap: 90,
  },
  high: {
    label: "High",
    dpr: 1.5,
    shadows: true,
    shadowMapSize: 2048,
    cascades: 3,
    drawChunks: 11,
    maxAnisotropy: 8,
    bloomAllowed: true,
    aoAllowed: true,
    nativeOnly: false,
    enemyCap: 120,
  },
  ultra: {
    label: "Ultra",
    dpr: 2,
    shadows: true,
    shadowMapSize: 4096,
    cascades: 4,
    drawChunks: 14,
    maxAnisotropy: 16,
    bloomAllowed: true,
    aoAllowed: true,
    nativeOnly: true,
    enemyCap: 200,
  },
};
