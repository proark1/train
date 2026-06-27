/**
 * Shared material prop-spreads for a consistent, less-"cheap" look: physically-plausible
 * metal/plastic/glass that the §SceneEnvironment IBL can reflect. Spread into
 * <meshStandardMaterial {...METAL} /> so the scene stays declarative.
 */
export const METAL_DARK = { color: "#39414f", metalness: 0.65, roughness: 0.42, envMapIntensity: 1.1 };
export const METAL_MID = { color: "#737f8c", metalness: 0.7, roughness: 0.38, envMapIntensity: 1.2 };
export const METAL_LIGHT = { color: "#aeb8c4", metalness: 0.75, roughness: 0.3, envMapIntensity: 1.3 };
export const PANEL = { color: "#cdd3da", metalness: 0.2, roughness: 0.55, envMapIntensity: 0.9 };
export const PANEL_DARK = { color: "#2b313c", metalness: 0.35, roughness: 0.5, envMapIntensity: 0.9 };
export const FLOOR = { color: "#2f3742", metalness: 0.45, roughness: 0.45, envMapIntensity: 0.8 };
export const RUBBER = { color: "#1c1f26", metalness: 0.1, roughness: 0.85 };
export const WOOD = { color: "#a06a38", metalness: 0.0, roughness: 0.75 };
export const PLASTIC = (color: string) => ({ color, metalness: 0.1, roughness: 0.5, envMapIntensity: 0.7 });
export const PAINT = (color: string) => ({ color, metalness: 0.25, roughness: 0.45, envMapIntensity: 0.9 });
export const HAZARD = { color: "#f2c037", metalness: 0.25, roughness: 0.5 };
export const RUST = { color: "#8a5a3a", metalness: 0.3, roughness: 0.8 };

export const GLASS = {
  color: "#bfe6ff",
  metalness: 0.0,
  roughness: 0.06,
  transparent: true,
  opacity: 0.16,
  envMapIntensity: 2.0,
};

export const emissive = (color: string, intensity = 2) => ({
  color,
  emissive: color,
  emissiveIntensity: intensity,
  toneMapped: false,
});
