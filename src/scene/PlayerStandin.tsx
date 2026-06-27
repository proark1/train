/** A ~1.8m humanoid stand-in so interior/exterior scale reads correctly (§19.A). */
export function PlayerStandin({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.34, 1.0, 6, 12]} />
        <meshStandardMaterial color="#3b6fe0" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.27, 16, 12]} />
        <meshStandardMaterial color="#f0c9a0" roughness={0.7} />
      </mesh>
    </group>
  );
}
