# Endless Train — Phase 0 Visual Quality Slice

The look-dev showcase from [`PLAN.md`](PLAN.md) §19 — built **first**, before any gameplay, to judge whether the 3D quality bar is met.

It is **not a game**: it renders the **exterior hero train** (parked at the origin with the world streaming past — the §6 "static train, recycled chunks" technique) and **one walkable interior carriage**, with a showcase control panel (scene switch, quality tiers, post-FX toggles, time-of-day, photo mode) and a live perf HUD reading `renderer.info`.

> Art is **procedural grey-box** (no Synty/Quaternius assets yet). This pass validates the *framework* — lighting, post stack, world-streaming, quality tiers, cameras, perf HUD. Dropping in real assets + the WebGPU/TSL path are the next steps (§19.B / §24).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Build: `npm run build` · Preview: `npm run preview`

## Controls
Drag to orbit · scroll to zoom. Use the left panel to switch **Exterior / Interior**, change **quality tier** (Low/Mid/High/Ultra\*), toggle **Bloom / Vignette / Grain**, scrub **time of day** + **train speed**, and enter **Photo Mode**. \*Ultra is native-Steam-only in the plan; selectable here to compare.

## Stack
React 18 · TypeScript · Vite · Three.js + React-Three-Fiber + drei · @react-three/postprocessing (WebGL2 path) · Zustand.

## Status vs the plan (§19)
- ✅ Exterior hero shot + world streaming · ✅ interior carriage · ✅ orbit camera + photo mode · ✅ perf HUD · ✅ Low/Mid/High/Ultra tiers · ✅ Bloom/Vignette/Grain post
- ⬜ Real assets (Synty/HDRI) · ⬜ WebGPU/TSL renderer + GTAO/volumetric god-rays · ⬜ baked lighting · ⬜ free-fly interior cam · ⬜ adaptive auto-tier (detect-gpu)
