import { RoundedBox } from "@react-three/drei";
import { METAL_DARK, METAL_LIGHT, METAL_MID, WOOD, HAZARD, PLASTIC, emissive, RUBBER } from "./materials";

type V3 = [number, number, number];

/** A supply crate — rounded body + corner brackets + a hazard band. */
export function Crate({ position, rotation = [0, 0, 0], size = 1, color = "#c98a3c" }: { position: V3; rotation?: V3; size?: number; color?: string }) {
  const s = size;
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[s, s * 0.9, s]} radius={0.04} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial {...(color.startsWith("#") ? { ...WOOD, color } : WOOD)} />
      </RoundedBox>
      {/* corner brackets */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <RoundedBox key={`${sx}${sz}`} args={[0.12, s * 0.9, 0.12]} radius={0.02} smoothness={2} position={[sx * (s / 2 - 0.06), 0, sz * (s / 2 - 0.06)]} castShadow>
            <meshStandardMaterial {...METAL_DARK} />
          </RoundedBox>
        ))
      )}
      <mesh position={[0, 0, s / 2 + 0.001]}>
        <planeGeometry args={[s * 0.7, 0.16]} />
        <meshStandardMaterial {...HAZARD} />
      </mesh>
    </group>
  );
}

export function CrateStack({ position, rotation = [0, 0, 0] }: { position: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Crate position={[0, 0.45, 0]} size={1} color="#b5732f" />
      <Crate position={[0.15, 1.35, -0.1]} rotation={[0, 0.3, 0]} size={0.9} color="#8a7d52" />
      <Crate position={[-0.7, 0.42, 0.6]} rotation={[0, -0.5, 0]} size={0.85} color="#9c5f2e" />
    </group>
  );
}

/** A fuel/chem barrel with rings + a colored band. */
export function Barrel({ position, rotation = [0, 0, 0], color = "#c33b3b" }: { position: V3; rotation?: V3; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 1.1, 24]} />
        <meshStandardMaterial {...PLASTIC(color)} />
      </mesh>
      {[0.3, 0.55, 0.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.37, 0.025, 8, 24]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, 0.37]}>
        <planeGeometry args={[0.32, 0.32]} />
        <meshStandardMaterial {...HAZARD} />
      </mesh>
    </group>
  );
}

/** An A-frame hazard barricade for cover. */
export function Barricade({ position, rotation = [0, 0, 0] }: { position: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[2.0, 0.7, 0.12]} radius={0.04} smoothness={2} position={[0, 0.85, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...HAZARD} />
      </RoundedBox>
      {/* diagonal stripes hint via dark slats */}
      {[-0.7, -0.2, 0.3, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.85, 0.07]} rotation={[0, 0, 0.5]}>
          <planeGeometry args={[0.14, 0.66]} />
          <meshStandardMaterial color="#1f232b" />
        </mesh>
      ))}
      {[-0.85, 0.85].map((x) => (
        <RoundedBox key={x} args={[0.12, 1.0, 0.5]} radius={0.03} smoothness={2} position={[x, 0.5, 0]} castShadow>
          <meshStandardMaterial {...METAL_MID} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** A wooden shipping pallet. */
export function Pallet({ position, rotation = [0, 0, 0] }: { position: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      {[-0.55, 0, 0.55].map((z, i) => (
        <mesh key={i} position={[0, 0.12, z]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.1, 0.18]} />
          <meshStandardMaterial {...WOOD} />
        </mesh>
      ))}
      {[-0.55, 0, 0.55].map((x, i) => (
        <mesh key={`b${i}`} position={[x, 0.04, 0]} castShadow>
          <boxGeometry args={[0.16, 0.16, 1.3]} />
          <meshStandardMaterial {...WOOD} />
        </mesh>
      ))}
    </group>
  );
}

/** Hanging grab strap from a ceiling rail. */
export function Strap({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.03, 0.4, 0.015]} />
        <meshStandardMaterial {...RUBBER} />
      </mesh>
      <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.018, 8, 16]} />
        <meshStandardMaterial color="#d8a23a" metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** A backlit signage / poster panel. */
export function Sign({ position, rotation = [0, 0, 0], color = "#3aa0c9", w = 0.9, h = 0.5 }: { position: V3; rotation?: V3; color?: string; w?: number; h?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.08, h + 0.08, 0.05]} radius={0.02} smoothness={2}>
        <meshStandardMaterial {...METAL_DARK} />
      </RoundedBox>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial {...emissive(color, 0.6)} />
      </mesh>
    </group>
  );
}

/** Recessed glowing ceiling light strip. */
export function LightStrip({ position, length, color = "#fff2cf" }: { position: V3; length: number; color?: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.55, 0.12, length]} radius={0.03} smoothness={2} position={[0, 0.06, 0]}>
        <meshStandardMaterial {...METAL_LIGHT} />
      </RoundedBox>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.42, 0.05, length - 0.3]} />
        <meshStandardMaterial {...emissive(color, 2.4)} />
      </mesh>
    </group>
  );
}

/** A ceiling/wall vent grille (adds mechanical detail cheaply). */
export function Vent({ position, rotation = [0, 0, 0], size = [0.8, 0.4] as [number, number] }: { position: V3; rotation?: V3; size?: [number, number] }) {
  const [w, h] = size;
  const bars = Math.max(3, Math.round(h / 0.08));
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.06, h + 0.06, 0.05]} radius={0.02} smoothness={2}>
        <meshStandardMaterial {...METAL_DARK} />
      </RoundedBox>
      {Array.from({ length: bars }).map((_, i) => (
        <mesh key={i} position={[0, -h / 2 + (i + 0.5) * (h / bars), 0.03]}>
          <boxGeometry args={[w, h / bars * 0.5, 0.02]} />
          <meshStandardMaterial {...METAL_MID} />
        </mesh>
      ))}
    </group>
  );
}
