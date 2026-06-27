import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useStore } from "./store";
import { QualityController } from "./engine/QualityController";
import { ExteriorScene } from "./scene/ExteriorScene";
import { InteriorScene } from "./scene/InteriorScene";
import { PostFX } from "./post/PostFX";
import { ControlPanel } from "./ui/ControlPanel";
import { PerfHud } from "./ui/PerfHud";

const VIEWS = {
  exterior: { pos: [24, 11, -22] as const, tgt: [0, 3, 16] as const },
  interior: { pos: [0, 2.5, 8] as const, tgt: [0, 1.9, -4] as const },
};

/** Camera + orbit controls; re-frames on scene change. Orbit is the §19.C turntable. */
function Rig() {
  const scene = useStore((s) => s.scene);
  const autoRotate = useStore((s) => s.autoRotate);
  const photoMode = useStore((s) => s.photoMode);
  const controls = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    const v = VIEWS[scene];
    camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
    if (controls.current) {
      controls.current.target.set(v.tgt[0], v.tgt[1], v.tgt[2]);
      controls.current.update();
    }
  }, [scene, camera]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate && !photoMode && scene === "exterior"}
      autoRotateSpeed={0.5}
      minDistance={2.5}
      maxDistance={90}
      maxPolarAngle={Math.PI * 0.86}
    />
  );
}

export function App() {
  const scene = useStore((s) => s.scene);
  const photoMode = useStore((s) => s.photoMode);
  const toggle = useStore((s) => s.toggle);

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 50, near: 0.1, far: 1600, position: [24, 11, -22] }}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      >
        <color attach="background" args={["#bcd8f5"]} />
        <fog attach="fog" args={["#cfe2f5", 120, 640]} />
        <QualityController />
        <Rig />
        {scene === "exterior" ? <ExteriorScene /> : <InteriorScene />}
        <PostFX />
      </Canvas>

      {!photoMode && (
        <div className="overlay">
          <ControlPanel />
          <PerfHud />
        </div>
      )}

      {photoMode && (
        <>
          <div className="photo-tag">Photo Mode — clean capture</div>
          <button
            className="panel"
            style={{
              position: "absolute",
              bottom: 14,
              right: 14,
              zIndex: 20,
              padding: "8px 14px",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 12,
            }}
            onClick={() => toggle("photoMode")}
          >
            Exit Photo Mode
          </button>
        </>
      )}
    </>
  );
}
