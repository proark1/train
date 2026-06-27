import { PlayerStandin } from "./PlayerStandin";

const L = 17; // car interior length
const HALF = L / 2;
const X = 1.62; // wall half-width
const H = 2.62; // ceiling height

const SHELL = "#eae7df";
const ACCENT = "#d8554a";
const SEAT = "#3aa0c9";
const SEAT2 = "#e8a33c";

function Seat({ z, side }: { z: number; side: 1 | -1 }) {
  const x = side * 1.05;
  const color = side === 1 ? SEAT : SEAT2;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.95, 0.25, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[side * 0.42, 1.0, 0]}>
        <boxGeometry args={[0.12, 0.85, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Pole({ z }: { z: number }) {
  return (
    <mesh castShadow position={[0, 1.3, z]}>
      <cylinderGeometry args={[0.05, 0.05, 2.6, 10]} />
      <meshStandardMaterial color="#b9c2cc" metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

function EndWall({ z, dir }: { z: number; dir: 1 | -1 }) {
  return (
    <group position={[0, 0, z]}>
      {/* side panels leaving a door gap */}
      {[-1, 1].map((s) => (
        <mesh key={s} receiveShadow position={[s * 1.12, H / 2, 0]}>
          <boxGeometry args={[0.78, H, 0.18]} />
          <meshStandardMaterial color={SHELL} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, H - 0.35, 0]}>
        <boxGeometry args={[1.5, 0.7, 0.18]} />
        <meshStandardMaterial color={ACCENT} roughness={0.6} />
      </mesh>
      {/* recessed connector door */}
      <mesh position={[0, 1.05, dir * 0.12]}>
        <boxGeometry args={[1.3, 2.1, 0.1]} />
        <meshStandardMaterial color="#2c3340" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * One walkable carriage interior at gameplay scale (§19.A). Open window band so the
 * streaming world shows through; emissive ceiling strip; seats/poles for scale + dressing.
 */
export function InteriorCar() {
  const pillars = Array.from({ length: 7 }, (_, i) => -HALF + 1.4 + i * ((L - 2.8) / 6));
  const seats = [-5.5, -2.2, 1.1, 4.4];

  return (
    <group>
      {/* floor */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[3.3, 0.12, L]} />
        <meshStandardMaterial color="#46505e" roughness={0.85} />
      </mesh>
      {/* aisle runner */}
      <mesh receiveShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[1.1, 0.04, L - 0.4]} />
        <meshStandardMaterial color={ACCENT} roughness={0.8} />
      </mesh>
      {/* ceiling */}
      <mesh receiveShadow position={[0, H, 0]}>
        <boxGeometry args={[3.3, 0.12, L]} />
        <meshStandardMaterial color={SHELL} roughness={0.8} />
      </mesh>
      {/* glowing ceiling light strip (feeds bloom) */}
      <mesh position={[0, H - 0.1, 0]}>
        <boxGeometry args={[0.5, 0.06, L - 1.5]} />
        <meshStandardMaterial color="#fff4d6" emissive="#fff0c0" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, H - 0.3, -4]} intensity={3} distance={12} color="#fff2cf" />
      <pointLight position={[0, H - 0.3, 4]} intensity={3} distance={12} color="#fff2cf" />

      {/* side walls: low waist wall + upper header, leaving an open window band */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh castShadow receiveShadow position={[s * X, 0.65, 0]}>
            <boxGeometry args={[0.14, 1.2, L]} />
            <meshStandardMaterial color={SHELL} roughness={0.7} />
          </mesh>
          <mesh castShadow receiveShadow position={[s * X, 2.35, 0]}>
            <boxGeometry args={[0.14, 0.55, L]} />
            <meshStandardMaterial color={SHELL} roughness={0.7} />
          </mesh>
          {/* tinted glass in the window band */}
          <mesh position={[s * X, 1.6, 0]}>
            <boxGeometry args={[0.04, 0.9, L - 0.6]} />
            <meshStandardMaterial color="#bfe9ff" transparent opacity={0.16} roughness={0.1} metalness={0.1} />
          </mesh>
          {/* window pillars */}
          {pillars.map((z, i) => (
            <mesh key={i} castShadow position={[s * X, 1.6, z]}>
              <boxGeometry args={[0.16, 0.95, 0.16]} />
              <meshStandardMaterial color={ACCENT} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      <EndWall z={-HALF} dir={-1} />
      <EndWall z={HALF} dir={1} />

      {seats.map((z, i) => (
        <group key={i}>
          <Seat z={z} side={1} />
          <Seat z={z} side={-1} />
        </group>
      ))}
      {[-6.5, -2, 2.5, 6.5].map((z, i) => (
        <Pole key={i} z={z} />
      ))}

      <PlayerStandin position={[0.2, 0.12, -1]} />
    </group>
  );
}
