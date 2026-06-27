import { Lighting } from "./Lighting";
import { WorldStream } from "./WorldStream";
import { InteriorCar } from "./InteriorCar";

/** §19.A (b) — one walkable carriage interior; the streaming world shows through windows. */
export function InteriorScene() {
  return (
    <group>
      <Lighting />
      <WorldStream />
      {/* raise the deck to train height so windows look out at the horizon */}
      <group position={[0, 0.6, 0]}>
        <InteriorCar />
      </group>
    </group>
  );
}
