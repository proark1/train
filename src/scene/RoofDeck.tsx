import { RoundedBox } from "@react-three/drei";
import { CAR_W, CAR_LEN } from "./BattleCar";
import { METAL_MID, METAL_LIGHT, METAL_DARK, HAZARD, PANEL_DARK, emissive } from "./materials";
import { Crate, Vent } from "./props";

const HALF = CAR_LEN / 2;
const Y = 3.55; // roof walk surface
const EDGE = CAR_W / 2 - 0.15;

function Railing({ side, axis }: { side: 1 | -1; axis: "x" | "z" }) {
  const along = axis === "z" ? CAR_LEN - 0.6 : CAR_W - 0.6;
  const posts = Math.round(along / 2.6);
  return (
    <group
      position={axis === "z" ? [side * EDGE, Y, 0] : [0, Y, side * (HALF - 0.15)]}
      rotation={axis === "z" ? [0, 0, 0] : [0, Math.PI / 2, 0]}
    >
      {/* top + mid rails */}
      {[0.95, 0.5].map((h, i) => (
        <mesh key={i} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, along, 8]} />
          <meshStandardMaterial {...METAL_LIGHT} />
        </mesh>
      ))}
      {Array.from({ length: posts + 1 }).map((_, i) => (
        <mesh key={`p${i}`} position={[0, 0.5, -along / 2 + (i * along) / posts]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 1.0, 8]} />
          <meshStandardMaterial {...METAL_MID} />
        </mesh>
      ))}
    </group>
  );
}

/** Walkable roof: railings, mechanical units, skylights, antenna, cover, open hatch. */
export function RoofDeck() {
  return (
    <group>
      {/* walk surface */}
      <RoundedBox args={[CAR_W - 0.1, 0.12, CAR_LEN]} radius={0.03} smoothness={2} position={[0, Y - 0.06, 0]} receiveShadow castShadow>
        <meshStandardMaterial {...METAL_MID} />
      </RoundedBox>
      {/* anti-slip seams */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[0, Y + 0.005, -HALF + 1 + i * 2.1]}>
          <boxGeometry args={[CAR_W - 0.6, 0.012, 0.06]} />
          <meshStandardMaterial color="#262c34" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      <Railing side={1} axis="z" />
      <Railing side={-1} axis="z" />
      <Railing side={1} axis="x" />
      <Railing side={-1} axis="x" />

      {/* AC / mechanical units */}
      {[-10, 9].map((z, i) => (
        <group key={i} position={[i ? 1.0 : -1.1, Y, z]}>
          <RoundedBox args={[1.6, 0.8, 2.2]} radius={0.06} smoothness={2} position={[0, 0.4, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...PANEL_DARK} />
          </RoundedBox>
          <Vent position={[0, 0.4, 1.12]} size={[1.2, 0.55]} />
          <mesh position={[0, 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.12, 16]} />
            <meshStandardMaterial {...METAL_LIGHT} />
          </mesh>
        </group>
      ))}

      {/* skylight strips (glow from the lights below) */}
      {[-4, 3].map((z, i) => (
        <group key={`sk${i}`}>
          <RoundedBox args={[2.6, 0.1, 1.0]} radius={0.03} smoothness={2} position={[0, Y + 0.02, z]}>
            <meshStandardMaterial {...METAL_DARK} />
          </RoundedBox>
          <mesh position={[0, Y + 0.04, z]}>
            <boxGeometry args={[2.2, 0.04, 0.7]} />
            <meshStandardMaterial {...emissive("#fff0c0", 1.6)} />
          </mesh>
        </group>
      ))}

      {/* open roof hatch (matches the interior ladder at z = -HALF + 5) */}
      <group position={[0, Y, -HALF + 5]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.78, 0.12, 0]}>
            <boxGeometry args={[0.14, 0.24, 1.7]} />
            <meshStandardMaterial {...HAZARD} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`e${s}`} position={[0, 0.12, s * 0.85]}>
            <boxGeometry args={[1.7, 0.24, 0.14]} />
            <meshStandardMaterial {...HAZARD} />
          </mesh>
        ))}
        {/* open lid */}
        <mesh position={[0, 0.55, -1.0]} rotation={[-1.1, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.08, 1.5]} />
          <meshStandardMaterial {...METAL_MID} />
        </mesh>
      </group>

      {/* antenna mast + dish */}
      <group position={[1.3, Y, 14]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 2.8, 8]} />
          <meshStandardMaterial {...METAL_LIGHT} />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.09, 12, 8]} />
          <meshStandardMaterial {...emissive("#ff5a5a", 2)} />
        </mesh>
        <mesh position={[0.25, 1.9, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.4, 0.4, 0.06, 16]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
      </group>

      {/* roof cover */}
      <Crate position={[-1.5, Y, -2]} rotation={[0, 0.5, 0]} size={1.1} color="#8a7d52" />
      <Crate position={[1.6, Y, 1]} rotation={[0, -0.3, 0]} size={1} color="#b5732f" />
      <Crate position={[-1.3, Y, 12]} rotation={[0, 0.2, 0]} size={0.95} color="#9c5f2e" />
    </group>
  );
}
