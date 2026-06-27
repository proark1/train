import { Lighting } from "./Lighting";
import { WorldStream } from "./WorldStream";
import { Train } from "./Train";

/** §19.A (a) — the exterior hero shot: parked train, world streaming past. */
export function ExteriorScene() {
  return (
    <group>
      <Lighting />
      <WorldStream />
      <Train />
    </group>
  );
}
