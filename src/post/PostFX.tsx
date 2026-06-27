import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  SMAA,
  N8AO,
  HueSaturation,
  BrightnessContrast,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useStore } from "../store";
import { TIERS } from "../engine/quality";

/**
 * Polished post stack (§5/§19.B). N8AO contact shadows are the single biggest lift from
 * "flat grey-box" to "grounded + premium"; a saturation/contrast grade keeps the
 * vibrant-cartoon punch; bloom lifts emissive. All clamped by the active tier.
 */
export function PostFX() {
  const { bloom, vignette, grain, ao, tier, photoMode } = useStore((s) => ({
    bloom: s.bloom,
    vignette: s.vignette,
    grain: s.grain,
    ao: s.ao,
    tier: s.tier,
    photoMode: s.photoMode,
  }));
  const t = TIERS[tier];
  const effects: JSX.Element[] = [];

  if (ao && t.aoAllowed) {
    effects.push(
      <N8AO
        key="ao"
        aoRadius={1.4}
        distanceFalloff={1.0}
        intensity={3.2}
        color="#0a0a14"
        halfRes={tier !== "ultra"}
        quality={tier === "ultra" ? "high" : "medium"}
      />
    );
  }
  if (bloom && t.bloomAllowed) {
    effects.push(
      <Bloom key="bloom" intensity={0.72} luminanceThreshold={1.05} luminanceSmoothing={0.22} mipmapBlur radius={0.62} />
    );
  }
  // grade: a touch more saturation + contrast for the vibrant-cartoon register
  effects.push(<HueSaturation key="hs" saturation={0.14} hue={0} />);
  effects.push(<BrightnessContrast key="bc" brightness={0.01} contrast={0.09} />);
  if (grain && !photoMode) {
    effects.push(<Noise key="noise" opacity={0.03} premultiply blendFunction={BlendFunction.OVERLAY} />);
  }
  if (vignette) {
    effects.push(<Vignette key="vig" offset={0.3} darkness={0.74} eskil={false} />);
  }
  effects.push(<SMAA key="smaa" />);

  return <EffectComposer multisampling={0}>{effects}</EffectComposer>;
}
