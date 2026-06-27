import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { TIERS } from "./quality";

/**
 * Lives inside the Canvas. Applies the active tier's render settings (DPR, shadows,
 * tone mapping) and samples a lightweight perf readout from renderer.info — the
 * "custom lightweight HUD reading renderer.info" the plan calls for (§19.C / §24.5).
 */
export function QualityController() {
  const tier = useStore((s) => s.tier);
  const setPerf = useStore((s) => s.setPerf);
  const { gl, setDpr } = useThree();

  // Apply tier render settings.
  useEffect(() => {
    const t = TIERS[tier];
    setDpr(Math.min(window.devicePixelRatio || 1, t.dpr));
    gl.shadowMap.enabled = t.shadows;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.needsUpdate = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.95;
  }, [tier, gl, setDpr]);

  // Sample perf every ~0.4s without allocating in the hot path.
  const acc = useRef({ frames: 0, time: 0 });

  useFrame((_, delta) => {
    const a = acc.current;
    a.frames += 1;
    a.time += delta;
    if (a.time >= 0.4) {
      const fps = a.frames / a.time;
      const info = gl.info.render;
      const isWebGL2 = (gl as THREE.WebGLRenderer).capabilities?.isWebGL2;
      setPerf({
        fps: Math.round(fps),
        ms: Math.round((1000 / fps) * 10) / 10,
        calls: info.calls,
        tris: info.triangles,
        backend: isWebGL2 ? "WebGL2" : "WebGL",
      });
      a.frames = 0;
      a.time = 0;
    }
  });

  return null;
}
