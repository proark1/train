import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * First-person fly/walk camera (§19.C free-fly). Click the canvas to capture the mouse
 * (look around), WASD to move, Space/C to rise/fall, Shift to sprint, Esc to release.
 * No collision — it's a look-dev explore cam, bounded to a sane volume around the train.
 */
export function ExploreControls({ start = [0, 2.4, 9] as [number, number, number] }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const dir = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const move = useRef(new THREE.Vector3());
  const UP = useRef(new THREE.Vector3(0, 1, 0));

  useEffect(() => {
    camera.position.set(start[0], start[1], start[2]);
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, dt) => {
    const k = keys.current;
    const sprint = k["ShiftLeft"] || k["ShiftRight"] ? 2.4 : 1;
    const speed = 7 * sprint * Math.min(dt, 0.05);
    camera.getWorldDirection(dir.current);
    right.current.crossVectors(dir.current, UP.current).normalize();
    const m = move.current.set(0, 0, 0);
    if (k["KeyW"]) m.add(dir.current);
    if (k["KeyS"]) m.addScaledVector(dir.current, -1);
    if (k["KeyD"]) m.add(right.current);
    if (k["KeyA"]) m.addScaledVector(right.current, -1);
    if (k["Space"]) m.y += 1;
    if (k["KeyC"] || k["ControlLeft"]) m.y -= 1;
    if (m.lengthSq() > 0) camera.position.addScaledVector(m.normalize(), speed);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -45, 45);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.6, 22);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -45, 45);
  });

  return <PointerLockControls />;
}
