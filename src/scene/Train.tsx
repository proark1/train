import * as THREE from "three";

const BODY = 11; // vehicle body length
const SPACING = 13; // distance between vehicle centres

function Wheels({ length, color = "#2a2f3a" }: { length: number; color?: string }) {
  const n = 3;
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const z = -length / 2 + 1.6 + (i * (length - 3.2)) / (n - 1);
        return [-1.55, 1.55].map((x) => (
          <mesh key={`${i}-${x}`} position={[x, 0.55, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.62, 0.62, 0.35, 16]} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
          </mesh>
        ));
      })}
    </group>
  );
}

function WindowStrip({ length, glow }: { length: number; glow: string }) {
  return [-1.52, 1.52].map((x) => (
    <mesh key={x} position={[x, 2.35, 0]}>
      <boxGeometry args={[0.08, 0.9, length - 2.4]} />
      <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.8} toneMapped={false} />
    </mesh>
  ));
}

function Car({ z, color, glow }: { z: number; color: string; glow: string }) {
  return (
    <group position={[0, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[3.2, 3, BODY]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* rounded-ish roof */}
      <mesh castShadow position={[0, 3.65, 0]}>
        <boxGeometry args={[3.0, 0.5, BODY]} />
        <meshStandardMaterial color={"#e9eef5"} roughness={0.6} />
      </mesh>
      <WindowStrip length={BODY} glow={glow} />
      <Wheels length={BODY} />
      {/* couplers */}
      <mesh position={[0, 1, BODY / 2 + 0.4]}>
        <boxGeometry args={[0.5, 0.5, 0.9]} />
        <meshStandardMaterial color="#3a3f4a" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

function Locomotive() {
  return (
    <group position={[0, 0, 0]}>
      {/* cab */}
      <mesh castShadow receiveShadow position={[0, 2.4, 2.8]}>
        <boxGeometry args={[3.3, 3.4, 4]} />
        <meshStandardMaterial color="#d83b3b" roughness={0.45} />
      </mesh>
      {/* boiler */}
      <mesh castShadow position={[0, 2.1, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 6, 20]} />
        <meshStandardMaterial color="#c0322f" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* boiler front cap */}
      <mesh castShadow position={[0, 2.1, -4.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.55, 1.55, 0.5, 20]} />
        <meshStandardMaterial color="#2b2f3a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* chimney */}
      <mesh castShadow position={[0, 4, -3.2]}>
        <cylinderGeometry args={[0.55, 0.7, 1.6, 14]} />
        <meshStandardMaterial color="#22262f" roughness={0.7} />
      </mesh>
      {/* dome */}
      <mesh castShadow position={[0, 3.9, -1]}>
        <sphereGeometry args={[0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f0c542" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* headlight (emissive — feeds bloom) */}
      <mesh position={[0, 2.4, -5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 16]} />
        <meshStandardMaterial color="#fff6c0" emissive="#fff0b0" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.4, -6]} intensity={6} distance={26} color="#fff1c0" />
      {/* cowcatcher */}
      <mesh castShadow position={[0, 1, -5.3]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[2.8, 1.6, 0.3]} />
        <meshStandardMaterial color="#3a3f4a" metalness={0.5} roughness={0.5} />
      </mesh>
      <Wheels length={9} color="#1f232c" />
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
