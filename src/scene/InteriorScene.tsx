import { Lighting } from "./Lighting";
import { WorldStream } from "./WorldStream";
import { BattleCar } from "./BattleCar";
import { RoofDeck } from "./RoofDeck";

/** §19.A (b) — a large open battle-carriage + walkable roof; the world streams past outside. */
export function InteriorScene() {
  return (
    <group>
      <Lighting />
      <WorldStream />
      {/* raise to train-deck height so windows + roof look out over the world */}
      <group position={[0, 0.8, 0]}>
        <BattleCar />
        <RoofDeck />
      </group>
    </group>
  );
}
