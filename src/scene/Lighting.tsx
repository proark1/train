import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../store";
import { TIERS } from "../engine/quality";

/** Clean vertical-gradient skydome — cartoon-friendly and won't blow out like a PBR sky. */
function GradientSky({ top, bottom }: { top: THREE.Color; bottom: THREE.Color }) {
  const geo = useMemo(() => new THREE.SphereGeometry(1000, 32, 16), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() } },
        vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vPos; uniform vec3 uTop; uniform vec3 uBottom;
          void main(){ float h = clamp(normalize(vPos).y * 0.6 + 0.35, 0.0, 1.0);
            gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(0.0,1.0,h)), 1.0); }`,
      }),
    []
  );

  // update colours in place (material created once)
  useEffect(() => {
    mat.uniforms.uTop.value.copy(top);
    mat.uniforms.uBottom.value.copy(bottom);
  }, [top, bottom, mat]);

  return <mesh geometry={geo} material={mat} />;
}

/** Sun + sky + fill. Sun elevation + sky colours are driven by `timeOfDay`. */
export function Lighting() {
  const timeOfDay = useStore((s) => s.timeOfDay);
  const tier = useStore((s) => s.tier);
  const settings = TIERS[tier];

  const { sunPos, sunDir, intensity, skyTop, skyBottom } = useMemo(() => {
    const t = timeOfDay;
    const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(4, 76, t));
    const azimuth = THREE.MathUtils.degToRad(48);
    const dir = new THREE.Vector3().setFromSphericalCoords(1, Math.PI / 2 - elevation, azimuth);
    // warm low sun → cool high sun
    const top = new THREE.Color().lerpColors(new THREE.Color("#2f6fc8"), new THREE.Color("#3f8de0"), t);
    const bottom = new THREE.Color().lerpColors(new THREE.Color("#ffcf9e"), new THREE.Color("#d6ecff"), t);
    return {
      sunDir: dir,
      sunPos: dir.clone().multiplyScalar(80),
      intensity: THREE.MathUtils.lerp(0.5, 2.4, Math.sin(elevation)),
      skyTop: top,
      skyBottom: bottom,
    };
  }, [timeOfDay]);

  return (
    <>
      <GradientSky top={skyTop} bottom={skyBottom} />
      <hemisphereLight args={["#bcd4ff", "#46402e", 0.5]} />
      <ambientLight intensity={0.14} />
      <directionalLight
        position={sunPos}
        intensity={intensity}
        color={"#fff1d2"}
        castShadow={settings.shadows}
        shadow-mapSize-width={settings.shadowMapSize}
        shadow-mapSize-height={settings.shadowMapSize}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      >
        <orthographicCamera attach="shadow-camera" args={[-34, 34, 34, -34, 1, 180]} />
      </directionalLight>
      {/* cool bounce fill so the cartoon palette stays bright in shadow */}
      <directionalLight position={[-sunDir.x * 40, 18, -sunDir.z * 40]} intensity={0.28} color={"#9fb6ff"} />
    </>
  );
}
