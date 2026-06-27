import { Environment, Lightformer } from "@react-three/drei";

/**
 * Self-contained image-based lighting: a baked cubemap built from a few Lightformers
 * (no external HDRI fetch). Gives metals/glass real reflections + soft ambient — one of
 * the biggest "looks premium" levers (§5 IBL).
 */
export function SceneEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      {/* warm key */}
      <Lightformer intensity={2.4} position={[0, 6, -10]} scale={[14, 7, 1]} color="#fff1d8" />
      {/* cool sky fill from above */}
      <Lightformer intensity={1.4} position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[18, 18, 1]} color="#a9c6ff" />
      {/* side bounces */}
      <Lightformer intensity={1.1} position={[-10, 3, 4]} scale={[8, 8, 1]} color="#bcd4ff" />
      <Lightformer intensity={1.1} position={[10, 3, 4]} scale={[8, 8, 1]} color="#ffdcb0" />
      {/* ground bounce */}
      <Lightformer intensity={0.7} position={[0, -6, 6]} rotation={[-Math.PI / 2, 0, 0]} scale={[16, 16, 1]} color="#7fae6a" />
    </Environment>
  );
}
