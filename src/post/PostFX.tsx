import { EffectComposer, Bloom, Vignette, Noise, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useStore } from "../store";
import { TIERS } from "../engine/quality";

/**
 * WebGL2 post stack (pmndrs/postprocessing) — the §5/§19.B fallback chain, used here as
 * the slice's primary path. Bloom lifts emissive (muzzle/alien-glow register), plus a
 * vignette + light grain LUT-substitute. Effects are clamped by the active tier.
 */
export function PostFX() {
  const { bloom, vignette, grain, tier, photoMode } = useStore((s) => ({
    bloom: s.bloom,
    vignette: s.vignette,
    grain: s.grain,
    tier: s.tier,
    photoMode: s.photoMode,
  }));
  const t = TIERS[tier];
  const effects: JSX.Element[] = [];

  if (bloom && t.bloomAllowed) {
    effects.push(
      <Bloom
        key="bloom"
        intensity={0.7}
        luminanceThreshold={1.12}
        luminanceSmoothing={0.22}
        mipmapBlur
        radius={0.6}
      />
    );
  }
  if (grain && !photoMode) {
    effects.push(<Noise key="noise" opacity={0.035} premultiply blendFunction={BlendFunction.OVERLAY} />);
  }
  if (vignette) {
    effects.push(<Vignette key="vig" offset={0.32} darkness={0.72} eskil={false} />);
  }
  // SMAA last for clean edges (cheap on every tier)
  effects.push(<SMAA key="smaa" />);

  return (
    <EffectComposer multisampling={0}>{effects}</EffectComposer>
  );
}
