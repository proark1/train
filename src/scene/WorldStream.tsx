import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { TIERS } from "../engine/quality";

const CHUNK = 42; // metres of world per recycled chunk
const WIDTH = 96;

// deterministic per-chunk layout (no Math.random in the hot path)
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRASS = "#74c947";
const GRASS2 = "#63b93c";
const DIRT = "#b98a52";

function Tree({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh castShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 2, 6]} />
        <meshStandardMaterial color="#7a5230" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 2.7, 0]}>
        <icosahedronGeometry args={[1.25, 0]} />
        <meshStandardMaterial color="#3fae57" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function House({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[7, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 4.6, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[5.4, 2.6, 4]} />
        <meshStandardMaterial color="#9b3b3b" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function Pole({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 4, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 8, 6]} />
        <meshStandardMaterial color="#5a4632" roughness={0.9} />
      </mesh>
      <mesh position={[0, 7.3, 0]}>
        <boxGeometry args={[2.4, 0.18, 0.18]} />
        <meshStandardMaterial color="#4a3a28" />
      </mesh>
    </group>
  );
}

function Chunk({ index }: { index: number }) {
  const content = useMemo(() => {
    const rng = mulberry32(index * 911 + 7);
    const trees = Array.from({ length: 3 }, () => ({
      x: -20 - rng() * 22,
      z: -CHUNK / 2 + rng() * CHUNK,
      s: 0.8 + rng() * 0.8,
    }));
    const houses =
      rng() > 0.45
        ? [
            {
              x: 20 + rng() * 16,
              z: -CHUNK / 2 + rng() * CHUNK,
              color: ["#e8b04b", "#5aa9e0", "#e07a5a", "#7ac96a", "#c98ad6"][Math.floor(rng() * 5)],
            },
          ]
        : [];
    const poles = [{ x: -7.2, z: -CHUNK / 4 }, { x: -7.2, z: CHUNK / 4 }];
    // sleepers (railway ties) sell the motion under the static rails
    const sleepers = Array.from({ length: 14 }, (_, i) => -CHUNK / 2 + (i + 0.5) * (CHUNK / 14));
    return { trees, houses, poles, sleepers, tint: index % 2 === 0 ? GRASS : GRASS2 };
  }, [index]);

  return (
    <group>
      {/* grass ground */}
      <mesh receiveShadow position={[0, -0.2, 0]}>
        <boxGeometry args={[WIDTH, 0.4, CHUNK]} />
        <meshStandardMaterial color={content.tint} roughness={1} />
      </mesh>
      {/* track bed */}
      <mesh receiveShadow position={[0, -0.08, 0]}>
        <boxGeometry args={[7.5, 0.3, CHUNK]} />
        <meshStandardMaterial color={DIRT} roughness={1} />
      </mesh>
      {content.sleepers.map((z, i) => (
        <mesh key={i} receiveShadow position={[0, 0.06, z]}>
          <boxGeometry args={[6, 0.16, 0.9]} />
          <meshStandardMaterial color="#6b4a2f" roughness={0.95} />
        </mesh>
      ))}
      {content.trees.map((t, i) => (
        <Tree key={i} {...t} />
      ))}
      {content.houses.map((h, i) => (
        <House key={i} {...h} />
      ))}
      {content.poles.map((p, i) => (
        <Pole key={i} {...p} />
      ))}
    </group>
  );
}

/**
 * The "static train, recycled world" technique (PLAN.md §6). The train stays at the
 * origin; chunks translate toward +Z at `speed` and recycle when they pass behind, so
 * the world is infinite and renderer.info stays flat. Draw distance scales with tier.
 */
export function WorldStream() {
  const speed = useStore((s) => s.speed);
  const tier = useStore((s) => s.tier);
  const count = TIERS[tier].drawChunks;
  const groups = useRef<(THREE.Group | null)[]>([]);
  const total = count * CHUNK;
  const recycleZ = CHUNK * 1.5; // a little behind the train

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05) * speed;
    for (const g of groups.current) {
      if (!g) continue;
      g.position.z += d;
      if (g.position.z > recycleZ) g.position.z -= total;
    }
  });

  return (
    <group>
      {/* two continuous steel rails (static; the moving sleepers sell the speed) */}
      <mesh position={[-1.5, 0.16, 0]}>
        <boxGeometry args={[0.22, 0.22, total + CHUNK * 2]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[1.5, 0.16, 0]}>
        <boxGeometry args={[0.22, 0.22, total + CHUNK * 2]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.85} roughness={0.35} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={[0, 0, -total + (i + 1) * CHUNK]}
        >
          <Chunk index={i} />
        </group>
      ))}
    </group>
  );
}
