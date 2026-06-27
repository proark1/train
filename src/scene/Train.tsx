import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { METAL_DARK, METAL_MID, METAL_LIGHT, PAINT, PANEL, emissive } from "./materials";

const BODY = 11;
const SPACING = 13;

function Wheels({ length, color = "#23272f" }: { length: number; color?: string }) {
  const n = 3;
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const z = -length / 2 + 1.6 + (i * (length - 3.2)) / (n - 1);
        return [-1.55, 1.55].map((x) => (
          <group key={`${i}-${x}`} position={[x, 0.55, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.62, 0.62, 0.32, 18]} />
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.28, 0.28, 0.36, 12]} />
              <meshStandardMaterial {...METAL_LIGHT} />
            </mesh>
          </group>
        ));
      })}
    </group>
  );
}

function WindowStrip({ length, glow }: { length: number; glow: string }) {
  return [-1.55, 1.55].map((x) => (
    <group key={x}>
      <RoundedBox args={[0.1, 1.0, length - 2.2]} radius={0.04} smoothness={2} position={[x, 2.35, 0]}>
        <meshStandardMaterial {...emissive(glow, 1.6)} />
      </RoundedBox>
      {/* frame */}
      <RoundedBox args={[0.14, 1.2, length - 2.0]} radius={0.05} smoothness={2} position={[x - Math.sign(x) * 0.02, 2.35, 0]}>
        <meshStandardMaterial {...METAL_DARK} />
      </RoundedBox>
    </group>
  ));
}

function Car({ z, color, glow }: { z: number; color: string; glow: string }) {
  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[3.3, 3.0, BODY]} radius={0.22} smoothness={4} position={[0, 2.0, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...PAINT(color)} />
      </RoundedBox>
      {/* skirt / underframe */}
      <RoundedBox args={[3.0, 0.9, BODY]} radius={0.1} smoothness={2} position={[0, 0.75, 0]} castShadow>
        <meshStandardMaterial {...METAL_DARK} />
      </RoundedBox>
      {/* roof */}
      <RoundedBox args={[3.05, 0.5, BODY]} radius={0.2} smoothness={3} position={[0, 3.6, 0]} castShadow>
        <meshStandardMaterial {...PANEL} />
      </RoundedBox>
      {/* roof vents */}
      {[-3, 0, 3].map((vz, i) => (
        <mesh key={i} position={[0, 3.9, vz]} castShadow>
          <cylinderGeometry args={[0.28, 0.32, 0.35, 12]} />
          <meshStandardMaterial {...METAL_MID} />
        </mesh>
      ))}
      <WindowStrip length={BODY} glow={glow} />
      <Wheels length={BODY} />
      {/* couplers + buffers */}
      <mesh position={[0, 1.0, BODY / 2 + 0.45]}>
        <boxGeometry args={[0.5, 0.5, 0.9]} />
        <meshStandardMaterial {...METAL_DARK} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 1.2, BODY / 2 + 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.4, 12]} />
          <meshStandardMaterial {...METAL_LIGHT} />
        </mesh>
      ))}
    </group>
  );
}

function Locomotive() {
  return (
    <group position={[0, 0, 0]}>
      <RoundedBox args={[3.4, 3.4, 4]} radius={0.24} smoothness={4} position={[0, 2.4, 2.8]} castShadow receiveShadow>
        <meshStandardMaterial {...PAINT("#d83b3b")} />
      </RoundedBox>
      {/* cab windows */}
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} position={[x + Math.sign(x) * 0.01, 3.0, 2.8]}>
          <boxGeometry args={[0.06, 1.0, 2.4]} />
          <meshStandardMaterial {...emissive("#bfe9ff", 0.8)} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.1, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 6, 24]} />
        <meshStandardMaterial {...PAINT("#c0322f")} />
      </mesh>
      {/* boiler bands */}
      {[-3.6, -2.2, -0.8].map((z, i) => (
        <mesh key={i} position={[0, 2.1, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.52, 0.06, 8, 24]} />
          <meshStandardMaterial {...METAL_LIGHT} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.1, -4.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.56, 1.56, 0.5, 24]} />
        <meshStandardMaterial {...METAL_DARK} />
      </mesh>
      <mesh castShadow position={[0, 4.0, -3.2]}>
        <cylinderGeometry args={[0.55, 0.72, 1.6, 16]} />
        <meshStandardMaterial {...METAL_DARK} />
      </mesh>
      <mesh castShadow position={[0, 4.7, -3.2]}>
        <cylinderGeometry args={[0.7, 0.6, 0.4, 16]} />
        <meshStandardMaterial {...METAL_MID} />
      </mesh>
      <mesh castShadow position={[0, 3.95, -1]}>
        <sphereGeometry args={[0.72, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f0c542" metalness={0.6} roughness={0.3} envMapIntensity={1.4} />
      </mesh>
      {/* headlight */}
      <mesh position={[0, 2.4, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 18]} />
        <meshStandardMaterial {...emissive("#fff0b0", 3)} />
      </mesh>
      <pointLight position={[0, 2.4, -6]} intensity={6} distance={26} color="#fff1c0" />
      {/* cowcatcher */}
      <mesh castShadow position={[0, 1.0, -5.3]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[2.8, 1.6, 0.3]} />
        <meshStandardMaterial {...METAL_DARK} />
      </mesh>
      <Wheels length={9} color="#1b1e25" />
    </group>
  );
}

/** Exterior hero train: locomotive + 3 carriages, parked at world origin (§19.A). */
export function Train() {
  return (
    <group>
      <Locomotive />
      <Car z={SPACING} color="#f2b441" glow="#7df0ff" />
      <Car z={SPACING * 2} color="#3ec6a8" glow="#b9ff5e" />
      <Car z={SPACING * 3} color="#5a8ff0" glow="#ff7de0" />
    </group>
  );
}

export const TRAIN_CENTER = new THREE.Vector3(0, 2.2, SPACING * 1.5);
