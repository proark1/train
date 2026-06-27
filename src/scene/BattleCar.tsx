import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import {
  FLOOR,
  PANEL,
  PANEL_DARK,
  METAL_DARK,
  METAL_MID,
  METAL_LIGHT,
  HAZARD,
  GLASS,
  PLASTIC,
} from "./materials";
import { CrateStack, Barrel, Barricade, Pallet, Strap, Sign, LightStrip, Vent } from "./props";
import { PlayerStandin } from "./PlayerStandin";

export const CAR_W = 6.4; // outer width
const IW = 3.0; // interior half-width (wall inner face)
export const CAR_LEN = 34;
const HALF = CAR_LEN / 2;
const CEIL = 3.3;

function SideWall({ side }: { side: 1 | -1 }) {
  const x = side * IW;
  const ribZs = useMemo(() => Array.from({ length: 11 }, (_, i) => -HALF + 1.6 + (i * (CAR_LEN - 3.2)) / 10), []);
  const bayZs = useMemo(() => ribZs.slice(0, -1).map((z, i) => (z + ribZs[i + 1]) / 2), [ribZs]);

  return (
    <group>
      {/* kick rail */}
      <RoundedBox args={[0.24, 0.5, CAR_LEN]} radius={0.04} smoothness={2} position={[x, 0.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...PANEL_DARK} />
      </RoundedBox>
      {/* waist paneling */}
      <RoundedBox args={[0.2, 0.95, CAR_LEN]} radius={0.04} smoothness={2} position={[x, 0.95, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...PANEL} />
      </RoundedBox>
      {/* upper header */}
      <RoundedBox args={[0.22, 0.75, CAR_LEN]} radius={0.04} smoothness={2} position={[x, 2.95, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...PANEL_DARK} />
      </RoundedBox>
      {/* window glass per bay (single quad — no front+back double-face) */}
      {bayZs.map((z, i) => (
        <mesh key={`g${i}`} position={[x, 1.95, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.5, 1.15]} />
          <meshStandardMaterial {...GLASS} />
        </mesh>
      ))}
      {/* window ribs / mullions */}
      {ribZs.map((z, i) => (
        <RoundedBox key={`r${i}`} args={[0.3, 1.4, 0.3]} radius={0.05} smoothness={2} position={[x, 1.95, z]} castShadow>
          <meshStandardMaterial {...METAL_MID} />
        </RoundedBox>
      ))}
      {/* a built-in bench every other bay (cover + transit feel) */}
      {bayZs.filter((_, i) => i % 2 === 0).map((z, i) => (
        <group key={`b${i}`} position={[x - side * 0.55, 0, z]}>
          <RoundedBox args={[0.9, 0.18, 2.0]} radius={0.06} smoothness={3} position={[0, 0.55, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...PLASTIC(i % 2 ? "#3aa0c9" : "#e08a3a")} />
          </RoundedBox>
          <RoundedBox args={[0.2, 0.8, 2.0]} radius={0.06} smoothness={3} position={[side * 0.4, 0.95, 0]} castShadow>
            <meshStandardMaterial {...PLASTIC(i % 2 ? "#3aa0c9" : "#e08a3a")} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function EndBulkhead({ z, dir }: { z: number; dir: 1 | -1 }) {
  return (
    <group position={[0, 0, z]}>
      {/* side panels leaving a doorway */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[IW - 1.1, CEIL, 0.25]} radius={0.05} smoothness={2} position={[s * (IW / 2 + 0.05), CEIL / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...PANEL} />
        </RoundedBox>
      ))}
      {/* header over door */}
      <RoundedBox args={[2.6, CEIL - 2.3, 0.25]} radius={0.05} smoothness={2} position={[0, CEIL - (CEIL - 2.3) / 2, 0]} castShadow>
        <meshStandardMaterial {...PANEL_DARK} />
      </RoundedBox>
      {/* hazard frame around the doorway */}
      {[-1, 1].map((s) => (
        <mesh key={`hz${s}`} position={[s * 1.1, 1.15, dir * 0.14]}>
          <boxGeometry args={[0.12, 2.3, 0.04]} />
          <meshStandardMaterial {...HAZARD} />
        </mesh>
      ))}
      <Sign position={[0, 2.55, dir * 0.14]} color="#e0563a" w={1.2} h={0.32} />
      {/* vestibule glimpse: a short corridor + the next car's connector door */}
      <group position={[0, 0, dir * 1.4]}>
        <mesh position={[0, CEIL / 2, dir * 1.0]}>
          <boxGeometry args={[2.2, CEIL, 0.15]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
        <mesh position={[0, 1.15, dir * 0.95]}>
          <boxGeometry args={[1.3, 2.1, 0.06]} />
          <meshStandardMaterial color="#1b2029" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* connector floor */}
        <mesh position={[0, 0.02, dir * 0.5]} receiveShadow>
          <boxGeometry args={[2.0, 0.06, 1.2]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
      </group>
    </group>
  );
}

/** A large, open, dressable carriage interior built for movement + combat (PLAN.md §9/§19). */
export function BattleCar() {
  const lightZs = useMemo(() => [-12, -4, 4, 12], []);

  return (
    <group>
      {/* floor */}
      <RoundedBox args={[CAR_W, 0.2, CAR_LEN]} radius={0.04} smoothness={2} position={[0, -0.1, 0]} receiveShadow>
        <meshStandardMaterial {...FLOOR} />
      </RoundedBox>
      {/* floor panel seams + centre runner */}
      <mesh position={[0, 0.011, 0]} receiveShadow>
        <boxGeometry args={[1.5, 0.02, CAR_LEN - 1]} />
        <meshStandardMaterial color="#3a444f" metalness={0.4} roughness={0.5} />
      </mesh>
      {Array.from({ length: 11 }).map((_, i) => (
        <mesh key={`seam${i}`} position={[0, 0.012, -HALF + 1.5 + i * 3]} receiveShadow>
          <boxGeometry args={[CAR_W - 0.4, 0.02, 0.05]} />
          <meshStandardMaterial color="#222831" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}
      {/* hazard stripes near each doorway */}
      {[-HALF + 1.2, HALF - 1.2].map((z, i) => (
        <mesh key={`hz${i}`} position={[0, 0.013, z]}>
          <boxGeometry args={[2.4, 0.02, 0.5]} />
          <meshStandardMaterial {...HAZARD} />
        </mesh>
      ))}

      {/* ceiling */}
      <RoundedBox args={[CAR_W, 0.2, CAR_LEN]} radius={0.04} smoothness={2} position={[0, CEIL + 0.1, 0]} receiveShadow>
        <meshStandardMaterial {...PANEL} />
      </RoundedBox>
      {/* ceiling ribs */}
      {Array.from({ length: 17 }).map((_, i) => (
        <mesh key={`crib${i}`} position={[0, CEIL - 0.02, -HALF + 1 + i * 2]}>
          <boxGeometry args={[CAR_W - 0.6, 0.1, 0.12]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
      ))}
      {/* two rows of glowing light strips */}
      {[-1.2, 1.2].map((x) => (
        <group key={x}>
          {lightZs.map((z, i) => (
            <LightStrip key={i} position={[x, CEIL - 0.06, z]} length={5.5} />
          ))}
        </group>
      ))}
      {/* vents */}
      {[-8, 0, 8].map((z, i) => (
        <Vent key={i} position={[0, CEIL - 0.04, z]} rotation={[Math.PI / 2, 0, 0]} size={[1.0, 0.5]} />
      ))}

      {/* grab rails + straps */}
      {[-1.4, 1.4].map((x) => (
        <group key={`rail${x}`}>
          <mesh position={[x, 2.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, CAR_LEN - 3, 10]} />
            <meshStandardMaterial {...METAL_LIGHT} />
          </mesh>
          {Array.from({ length: 9 }).map((_, i) => (
            <Strap key={i} position={[x, 2.55, -HALF + 3 + i * 3.5]} />
          ))}
        </group>
      ))}

      <SideWall side={1} />
      <SideWall side={-1} />
      <EndBulkhead z={-HALF} dir={-1} />
      <EndBulkhead z={HALF} dir={1} />

      {/* roof hatch (open) with a ladder — narrative access to the roof deck */}
      <group position={[0, 0, -HALF + 5]}>
        <mesh position={[0, CEIL + 0.12, 0]}>
          <boxGeometry args={[1.5, 0.05, 1.5]} />
          <meshStandardMaterial {...METAL_DARK} />
        </mesh>
        {/* hatch hole frame */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.8, CEIL + 0.1, 0]}>
            <boxGeometry args={[0.12, 0.18, 1.6]} />
            <meshStandardMaterial {...HAZARD} />
          </mesh>
        ))}
        {/* ladder */}
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, CEIL / 2, 0.7]}>
            <cylinderGeometry args={[0.04, 0.04, CEIL, 8]} />
            <meshStandardMaterial {...METAL_MID} />
          </mesh>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`rung${i}`} position={[0, 0.4 + i * 0.45, 0.7]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
            <meshStandardMaterial {...METAL_MID} />
          </mesh>
        ))}
      </group>

      {/* signage + emergency kit */}
      <Sign position={[IW - 0.12, 2.5, -2]} rotation={[0, -Math.PI / 2, 0]} color="#3aa0c9" />
      <Sign position={[-IW + 0.12, 2.5, 6]} rotation={[0, Math.PI / 2, 0]} color="#7ac96a" />
      <mesh position={[IW - 0.25, 1.4, 10]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.6, 12]} />
        <meshStandardMaterial {...PLASTIC("#cf3030")} />
      </mesh>

      {/* ---- COVER / COMBAT LAYOUT (sightlines + cover, aisle stays passable) ---- */}
      <CrateStack position={[-1.7, 0, -9]} rotation={[0, 0.4, 0]} />
      <CrateStack position={[1.9, 0, -2]} rotation={[0, -0.6, 0]} />
      <CrateStack position={[-1.8, 0, 7]} rotation={[0, 0.2, 0]} />
      <Barricade position={[0.2, 0, -5.5]} rotation={[0, Math.PI / 2, 0]} />
      <Barricade position={[-0.3, 0, 11]} rotation={[0, Math.PI / 2 + 0.2, 0]} />
      <Barrel position={[1.9, 0, -11]} color="#c33b3b" />
      <Barrel position={[2.1, 0, -10.2]} color="#3a7bc9" />
      <Barrel position={[-2.0, 0, 1]} color="#3a7bc9" />
      <Barrel position={[1.7, 0, 13]} color="#c33b3b" />
      <Pallet position={[-1.9, 0, 4]} rotation={[0, 0.3, 0]} />
      <Pallet position={[1.6, 0, 8]} rotation={[0, -0.2, 0]} />
      <CrateStack position={[1.7, 0, 14.5]} rotation={[0, -0.3, 0]} />

      {/* scale reference */}
      <PlayerStandin position={[0.4, 0, 0]} />
      <PlayerStandin position={[-0.6, 0, -6]} />
    </group>
  );
}
