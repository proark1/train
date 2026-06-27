import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { TIERS } from "./quality";

/**
 * Lives inside the Canvas. Applies the active tier's render settings and samples a
 * lightweight perf readout from renderer.info (§19.C / §24.5). info.autoReset is disabled
 * and reset manually each frame so the draw-call count includes the post-processing
 * passes (otherwise EffectComposer leaves it reading just the final fullscreen pass).
 */
export function QualityController() {
  const tier = useStore((s) => s.tier);
  const setPerf = useStore((s) => s.setPerf);
  const { gl, setDpr } = useThree();

  useEffect(() => {
    const t = TIERS[tier];
    setDpr(Math.min(window.devicePixelRatio || 1, t.dpr));
    gl.shadowMap.enabled = t.shadows;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.needsUpdate = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.98;
    gl.info.autoReset = false;
  }, [tier, gl, setDpr]);

  const acc = useRef({ frames: 0, time: 0, calls: 0, tris: 0 });

  useFrame((_, delta) => {
    const a = acc.current;
    // read the previous frame's accumulated totals, then reset for this frame
    a.calls = gl.info.render.calls;
    a.tris = gl.info.render.triangles;
    gl.info.reset();

    a.frames += 1;
    a.time += delta;
    if (a.time >= 0.4) {
      const fps = a.frames / a.time;
      const isWebGL2 = (gl as THREE.WebGLRenderer).capabilities?.isWebGL2;
      setPerf({
        fps: Math.round(fps),
        ms: Math.round((1000 / fps) * 10) / 10,
        calls: a.calls,
        tris: a.tris,
        backend: isWebGL2 ? "WebGL2" : "WebGL",
      });
      a.frames = 0;
      a.time = 0;
    }
  });

  return null;
}
