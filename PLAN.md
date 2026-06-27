# Endless Train: Zombies & Aliens — Master Planning Document

> A high-fidelity 3D browser co-op survivors-on-rails game. This document is the producer's plan: opinionated, fact-checked, and actionable. It plans **for** the stated scope (infinite train, loadout, zombie + alien boarders, premium 3D, P2P co-op, viral browser delivery) — it does not change that scope, but it sets honest expectations where the research over-promised.

> **🔒 Locked decisions (2026-06-27).** The user has committed to four of the §14 forks:
> 1. **Engine → Three.js + React Three Fiber** (WebGPU + WebGL2 fallback).
> 2. **Art direction → vibrant-cartoon** (Fortnite / Crossy Road look — bright, broadly shareable, cohesive on weak GPUs), *not* the gritty Snowpiercer/L4D look. §5 and §10 below reflect this.
> 3. **Platform → desktop-first, mobile-capable** (touch + 30fps mobile tier designed in from day 1; mobile optimized/QA'd after the desktop vertical slice).
> 4. **Netcode → PlayroomKit** (managed signaling + relay + host primitives).
>
> Still open (see §14): boss/meta ambition at MVP, and monetization timing.

---

## 1. Vision & Pillars

**Concept.** You board a train that never stops. In a 15-second lobby you pick one **weapon** and two **items**, then the engine roars out of the station and the run is infinite. Within seconds, zombies claw up the carriage sides and alien creatures drop from tunnels and swoop from the sky, boarding from every edge. You fight them off in third-person, vacuuming XP to level a build from scrappy to godlike across a ~2-minute run, while an L4D-style Director paces the horde between tense tunnels and looted daylight stretches. You die, keep your scrap, watch a 15-second highlight clip auto-pop with your score, and fire a one-click invite link to a friend for co-op. Then you tap restart. The look is **stylized-PBR premium** — the best fidelity the web can ship — not a photoreal AAA console clone.

**Design Pillars**

1. **"One more run" above all.** Sub-3-second restart, scrap is never lost, runs are 90–180s. Every system serves the loop's velocity.
2. **Premium web-native look, honestly scoped.** Top-tier *web* fidelity via stylized-PBR + baked lighting + a modern post stack — readability and 60fps win over polygon count.
3. **Boarding fantasy from 270°.** The core verb is "fight off invaders climbing the train from every side." Third-person camera and knockback/shove-off-the-edge mechanics sell it.
4. **Build-craft in seconds.** Loadout is a *build seed*, not a stat buff. Every pick changes *what you do*, nameable in 5 words ("knockback-shotgun barricade build").
5. **Share is the install funnel.** Co-op invite link + auto-clip + daily seed are designed in from day one, not bolted on.
6. **Fast to first frame.** Sub-2s first paint, <25MB compressed initial download. Load time is the #1 viral lever; we defend it ruthlessly.

---

## 2. Reality Check (read this before celebrating any claim)

The fact-checks override the research. Set expectations here so nobody is surprised in month 3.

**"Best 3D quality in a browser" means top-tier *web-native* fidelity — not modern-AAA-console parity.**
WebGPU + Three.js/Babylon in 2026 is a genuine leap over WebGL2: deferred-style lighting, many dynamic lights, compute particles, GPU culling/skinning, and a modern post stack (bloom, GTAO, SSR, TRAA, DoF). That rivals **last-gen console / stylized-AAA** looks for well-scoped scenes. It does **not** reach across-the-board parity with a current-gen native AAA shooter: the portable WebGPU spec still lacks hardware ray tracing, bindless resources, mesh shaders, and 64-bit atomics, so Nanite/Lumen-class fidelity is absent, emulated at cost, or offloaded to cloud streaming. Browser memory is bounded (default `maxBufferSize` 256 MiB, ~1 GB requestable hardware-permitting). **Our marketing and internal goal is "approaching console-class for a stylized, well-budgeted scene," achieved through art direction and lighting, not brute force.** If a stakeholder demands literal AAA-shooter visuals, that requires a native build or pixel streaming — both of which we reject for this product (see §3 avoid list).

**"Players host themselves / no game server" is true for the *simulation*, false for *connection setup*.**
Truly serverless P2P (no signaling, no STUN, no TURN) only works on a shared LAN or between two unfirewalled public IPs with **manual** SDP exchange — under ~1% of real internet pairings, and modern browsers now obfuscate host IPs as mDNS `.local` names by default. For general internet co-op we **must** run:
- a tiny **always-on signaling server** (WebSocket — a cheap VPS, Cloudflare Worker + Durable Object, or a managed SDK's free tier),
- **STUN** (free public, e.g. Google), and
- a **TURN relay** for the ~15–20% of pairs behind symmetric NAT / CGNAT / corporate firewalls.

If 1 in 6 "invite a friend" attempts silently fails, the viral loop dies. So TURN is not optional. The honest tagline is **"no dedicated *game* server"** — we still pay for cheap connection-brokering infra. We will also offer a zero-server **LAN / manual-code** path as a bonus, not the default.

**60 FPS is a tuned target, not a guarantee — and definitely not on mid-range mobile by default.**
Laptops with integrated GPUs can hold 60fps for a moderately complex stylized scene. **Mid-range phones cannot be assumed to.** Continuous spawning invites GC stutter, WebRTC competes for the main thread, and sustained sessions lose up to ~35% of frame rate to thermal throttling within minutes. **Plan: 60fps desktop target; 30fps locked mobile baseline with adaptive dynamic-quality scaling from day one.** Treat mobile 60 as a stretch goal.

**WebGPU is the right default — but ship the WebGL2 fallback as a first-class path.**
WebGPU reaches ~82–85% of users in mid-2026 (Chrome/Edge desktop + most Android 12+, Safari iOS/iPadOS 26 + macOS Tahoe 26, Firefox on Windows + Apple-Silicon macOS). It excludes iOS ≤18, Firefox-on-Linux, Firefox-on-Android, and older Android GPUs. The ~15–20% on WebGL2 is real, so the fallback renderer (and its separate post-processing stack) is a planned deliverable, not an afterthought. Never architect WebGPU-only.

---

## 3. Recommended Tech Stack

**Primary recommendation:** **Three.js (r180+) with React Three Fiber (R3F) + @react-three/drei, WebGPURenderer (TSL) with automatic WebGL2 fallback, Rapier physics via @react-three/rapier, and PlayroomKit for the connection layer.** Best fidelity-per-kilobyte, smallest first load, largest hiring pool, MIT/zero-license-cost, and the cleanest P2P story for a small team that wants to spend its effort on *fun and fidelity*, not on reinventing ICE/TURN/host-migration.

| Layer | Primary pick | Notes / version |
|---|---|---|
| Renderer | **Three.js WebGPURenderer + TSL**, WebGL2 auto-fallback | r180+ (pin & benchmark; some r182 WebGPU perf/shadow regressions reported vs r170 WebGL) |
| Framework | **React Three Fiber + @react-three/drei** | r3f v9; mutate refs in `useFrame`, never `setState` at 60fps |
| Physics | **Rapier (Rust→WASM)** via @react-three/rapier | rigid bodies, colliders, ragdolls; faster than cannon-es for many bodies |
| Character controller | **ecctrl** (drei ecosystem) or bespoke | constrained train-local locomotion |
| Crowd rendering | **@three.ez/instanced-mesh (InstancedMesh2)** + VAT | per-instance culling, BVH raycast, GPU skinning, LOD |
| Animation | glTF skinned + `AnimationMixer` (hero/close enemies); **VAT** (OpenVAT) for the horde | |
| Post (WebGPU) | Three.js TSL `PostProcessing` nodes: `gtao`, `bloom`, `traa`, `motionBlur`, `dof` | |
| Post (WebGL2) | **pmndrs/postprocessing** + 0beqz **realism-effects** | maintained as a separate, lighter chain |
| Audio | **Howler.js** (audio sprites + HRTF/spatial) over a thin custom **Web Audio** graph (stem mixer, buses, ducking, sample-accurate scheduling) | Opus-in-WebM + MP3 fallback. **All SFX / music / voice generated with ElevenLabs** — see §17 |
| State (UI/meta) | **Zustand** | UI/lobby/meta only — keep it OUT of the 60fps loop |
| Netcode/transport | **PlayroomKit** (managed signaling + relay + host primitives) | fallback: PeerJS + own STUN/TURN |
| Build tooling | **Vite** + TypeScript; `gltf-transform` + `gltfjsx --transform` asset pipeline | |
| Hosting | **Cloudflare Pages** (static) + **Cloudflare Realtime TURN** (1,000 GB/mo free) | itch.io / GitHub Pages also viable |
| Native desktop wrapper | **Electron** (bundled Chromium/Dawn — consistent WebGPU on Win+Mac); NW.js backup; **Tauri rejected** | native Steam SKU only; never the web build (§23.2) |
| Steam integration | **steamworks.js** (achievements, cloud, Trusted-Mode leaderboards, lobbies, overlay) | native only, runs in Electron main/preload (§23.4) |
| Platform-abstraction layer | `Storage` / `NetTransport` / `Achievements` / `Leaderboards` / `AssetSource` / `Tier policy` / `Updates` interfaces | env-selected per build, tree-shaken; `PLATFORM.isNative` gate (§23.2) |

**Alternatives (one-line reason each):**

| Option | When you'd pick it instead |
|---|---|
| **Babylon.js 9.0** | You want one vendor, fewer moving parts: built-in physics (Havok), particles, audio, animation retargeting, clustered lighting — at the cost of a larger bundle and smaller hiring pool. **Strong, defensible backup.** |
| **PlayCanvas (v2.19+)** | A real visual Editor + cloud collaborative workflow is a hard team requirement; best raw mobile framerate; slightly lower WebGPU ceiling, smaller community. |
| **Photon Fusion 2 Shared Mode** | You outgrow PlayroomKit or want cloud-held state (no single host to lose) and host-migration handled; free to 100 CCU, more Unity-centric. |
| **PeerJS / simple-peer** | You want full control of the netcode layer and accept building prediction/snapshots/TURN config yourself. |
| **Geckos.io / Colyseus** | You're willing to run a tiny authoritative Node server (contradicts "host yourself" but gives real anti-cheat + host stability). |

**Explicitly AVOID (with reasons):**

- **Unreal Pixel Streaming — hard avoid.** One cloud GPU per concurrent player (~$0.18–1.00+/user/hour, NVENC-capped, 45–150ms latency). A *free viral* game makes cost scale with success and revenue stay at zero — the exact economics that killed Stadia. Fine only for bounded/monetized demos.
- **Unity WebGL — avoid.** ~10–11MB near-empty builds, heavy WASM/emscripten startup, GC hitches, weak mobile-browser perf, loading-bar (not instant) experience, iOS Safari ~256MB crash threshold. Kills share-and-play conversion.
- **Unreal WebGL/HTML5 — does not exist.** Epic removed HTML5 in UE 4.24; UE5 has no first-party browser export. Only unproven third-party WASM/WebGPU ports.
- **Godot 4 web export — avoid for high fidelity.** Web is limited to the Compatibility (GLES) renderer; Forward+/Mobile pipelines don't run in-browser, no shipped official WebGPU, plus WASM-memory and COOP/COEP header headaches.
- **Raw WebGPU — avoid (for now).** You'd hand-build the renderer, scene graph, glTF/animation, physics integration, culling — months of work Three.js already gives you, with no WebGL2 fallback. Only justified if rendering tech *is* the product.

---

## 4. High-Level Architecture

Two-thread split is the spine: **render/sim on one path, networking off the critical path.**

```
┌───────────────────────── Main Thread (R3F / Three.js) ──────────────────────────┐
│  Renderer (WebGPU→WebGL2)   Game Loop (fixed 30Hz sim + render interp)            │
│  ├─ Scene graph & camera    ├─ ECS-lite (systems over component pools)            │
│  ├─ Post pipeline (TSL/pp)  ├─ World Streaming (static train, recycled chunks)    │
│  ├─ Crowd (InstancedMesh2)  ├─ Spawn/AI Director (host only)                      │
│  ├─ VFX/particle pools      ├─ Combat (hitscan rays + host-spawned projectiles)   │
│  └─ UI / Lobby (React DOM)  └─ Input (KB/mouse, gamepad, touch) + aim assist      │
└──────────────────────────────────────────────────────────────────────────────────┘
            ▲ transferable buffers (positions, events)  │
┌───────────┴──────────────── Web Worker ───────────────▼──────────────────────────┐
│  Netcode: WebRTC DataChannels, serialization, snapshot/delta, reconciliation      │
│  (PlayroomKit-managed) — isolated so a network spike can't stall a frame          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Modules / systems:**

- **Rendering** — WebGPURenderer with WebGL2 fallback; one TSL shader path compiling to WGSL+GLSL where possible; two post-processing stacks (TSL nodes for WebGPU, pmndrs/postprocessing for WebGL2). Quality tiers gate the heavy effects.
- **Game loop / ECS-lite** — fixed-timestep simulation (30Hz) decoupled from render; systems iterate over pooled typed-array component data. No per-frame allocation in the hot path. (Don't over-engineer a full ECS framework; a disciplined systems-over-pools pattern is enough.)
- **World streaming** — train + camera pinned at world origin; chunked terrain/props translate toward the train and recycle through an object pool when they pass the rear. Constant memory, no float drift.
- **Input** — unified abstraction over mouse+KB / gamepad / touch, feeding the same "aim intent" with magnetic aim assist so all input modes feel identical.
- **Netcode** — host-authoritative; host runs Director + enemy AI + damage + items; clients predict own movement/aim and interpolate remote entities ~100ms in the past. Lives in a worker.
- **UI / Lobby** — React DOM overlay (loadout picker, HUD, death screen, leaderboards, invite link). State in Zustand. The lobby and first car must render instantly while the rest streams.
- **Audio** — Howler-managed pools of weapon/impact/ambience cues; kill-streak stingers; XP-vacuum whoosh.
- **Assets** — GLB containers, Draco (static) / meshopt (skinned/morph) geometry, KTX2/Basis textures; progressive/streamed loading keyed by chunk position.

---

## 5. Visual Fidelity Plan

**Art-direction decision (LOCKED): vibrant-cartoon stylized-PBR, not photoreal.** This is the single highest-leverage fidelity choice. Synty/Quaternius proportions, **bright saturated palette and punchy value contrast** (vibrant-cartoon, not the muted gritty option), physically-based materials on hero assets, cheaper toon/matcap/unlit-baked on background props. It looks expensive, ages well, runs on weak GPUs, reads instantly in clips, and lets a small team buy/generate 80% of assets cohesively. The on-rails camera is a gift: fixed forward motion enables aggressive culling, baked lighting, and a tightly budgeted draw distance. Reference looks: **Fortnite / Overwatch** (vibrant stylized-PBR + readability), **Crossy Road / Subway Surfers** (bright, broadly shareable, session feel); keep the *fiction* of a zombie/alien train without inheriting Snowpiercer/L4D's desaturated grit — lean colorful, with neon alien glow and bold blood/ichor for pop. **The dread comes from the ears, not the eyes:** this bright look is deliberately paired with horror-via-audio (§15, §17) — visuals never desaturate to sell fear. Reserve only a *small* lighting-accent dread vocabulary (tunnel swallow, intercom flicker, heartbeat-synced alien glow).

**Lighting — bake the static train, CSM for the moving world.**
- The train interior/exterior is static → **bake lightmaps + bounce GI offline** in Blender, pack into the GLB. Photoreal-feeling soft shadows and GI at near-zero runtime cost.
- Reserve real-time shadows for dynamic objects (enemies, muzzle light, players). Use **CSM** (Three.js core `CSMShadowNode` on WebGPU; `three-csm`/`CSM` addon on WebGL2) for the moving sun over the endless exterior — keep to 2–3 cascades, tight to the train.
- Primary ambient/reflections from one good **HDRI environment map (IBL)** from Poly Haven.

**Post-processing stack.**
- **WebGPU (TSL nodes, r180):** GTAO → selective SSR (metal floors / windows) → selective bloom (lift emissive muzzle flashes + alien glow above 1.0) → camera-velocity motion blur (sells train speed cheaply) → TRAA → LUT color grade → vignette + *subtle* chromatic aberration + film grain.
- **WebGL2 fallback (pmndrs/postprocessing + realism-effects):** BloomEffect, SSAO, SMAA, LUT, vignette, noise; SSGI/motion-blur from realism-effects where budget allows. SSR/volumetrics likely **off by default** on this path.
- **Watch-out:** the two stacks are genuinely separate code — `EffectComposer` does NOT run on WebGPURenderer. Budget for maintaining both. TRAA + motion blur + a fast-moving train is the worst case for ghosting — tune velocity buffers carefully or the speed lines smear.

**Hero atmosphere effect: volumetric light shafts through train windows.** Highest wow-per-risk. On WebGPU use raymarched/froxel volumetrics in TSL; cheaper fallback is screen-space god rays from the sun/headlight + exponential height fog. Quality-gate it; off by default on WebGL2.

**Materials.** `MeshStandardMaterial`/`MeshPhysicalMaterial` on a *small set* of hero surfaces (clearcoat engine, transmission windows); standard/toon/unlit-baked for the rest. Normal maps everywhere to fake detail on low-poly meshes. Rim light on enemies for readability against the train.

**VFX.** Compute-shader particles under WebGPU (huge headroom) for muzzle flashes, blood/goo, sparks, explosions; additive emissive sprites auto-bloom. Pooled, capped decals for bullet holes/blood/scorch that fade with age to bound draw calls.

**Asset formats/compression.** GLB container; **Draco** for static geometry, **meshopt** for anything skinned/morph (Draco discards those); **KTX2/Basis** textures (UASTC for normal/hero, ETC1S for diffuse/secondary). Hard initial-download budget **<25MB compressed** so "click link → playing with a friend" stays snappy.

---

## 6. Performance Plan

**Targets & budgets.**
- Desktop: 60fps (16.6ms/frame). Draw calls <100/frame (struggles past ~500).
- Mobile: locked 30fps (33ms). Draw calls 30–50/frame. **Adaptive quality mandatory**, not optional — sustained runs thermally throttle from 60→~20fps within ~30s.
- `renderer.info.render.calls` is a *flat* budget over an infinite run; a climbing count means a recycling leak.

**Infinite-world technique: static train, recycled chunks.** Train + camera fixed at world origin; world translates toward them. A `LevelGenerator` holds active terrain/prop chunks, moves them each frame, and recycles the rearmost through a pre-warmed pool re-emitted ahead with new content. Constant memory, no float-precision drift, no unbounded allocation. (Reference: classic Three.js endless-runner patterns.)

**Crowds (the core perf cliff).** Native `SkinnedMesh` is CPU-bound past ~100–200. Use **@three.ez/instanced-mesh (InstancedMesh2)** for the horde: collapses thousands of enemies to a few draw calls, with **per-instance frustum culling**, BVH raycasting (doubles as hit detection), per-instance LOD + shadow LOD, and **GPU skinning** via `initSkeleton()`. Bake densest waves to **VAT** (OpenVAT) — animation in the vertex shader, negligible CPU, with randomized per-instance phase to avoid lockstep marching. Reserve true CPU/GPU `SkinnedMesh` for the 1–2 hero/player models and close "boarding" enemies needing IK/blend. **Caveats:** instancing *regresses* without LOD + culling (documented VR case 85→55fps); per-instance frustum culling is NOT automatic — maintain accurate bounds; VAT has no runtime IK/ragdoll and its texture VRAM grows with clip count.

**Pooling & GC avoidance.** Pre-warm pools at load for enemies, projectiles, hit VFX, terrain chunks. In the hot loop: reuse scratch `Vector3`/`Matrix4`/`Quaternion`, typed arrays for instance matrices, zero closures/array-literals per frame. GC pauses are the #1 micro-stutter source.

**Textures/memory.** KTX2/Basis stays GPU-compressed (~10× less VRAM; a 200KB PNG balloons to 20MB+ uncompressed). Atlas enemy/prop textures, share materials so meshes batch. Monitor `renderer.info.memory` for climbing counts; dispose aggressively. Mobile VRAM budgets are tight — per-platform-tier texture budgeting is mandatory.

**Adaptive quality ladder** (auto-steps on rolling frame-time average): dynamic render-scale (50–70% + upscale ≈ 2× FPS) → shadow res/on-off → enemy LOD bias → max concurrent instanced enemies → particle/VFX density → post-processing toggles (SSR, volumetrics, motion blur first to go). Step down on sustained overrun, step up cautiously on headroom.

**Workers.** Move networking + serialization + reconciliation into a Web Worker; post compact transferable buffers to the render thread. Consider OffscreenCanvas later if main-thread contention persists. The goal: a network burst can never stall a frame.

**Profiling toolchain.** stats-gl/stats.js (FPS/CPU/GPU), `renderer.info` (the primary budget gauge), Spector.js (WebGL capture), WebGPU Inspector + `timestamp-query` (GPU pass timing), Chrome DevTools Performance with the GPU lane (catch GC pauses + net-vs-render contention). **Benchmark the WebGPU path per-scene — naive ports can be 2–4× slower than WebGL until instancing/compute are exploited.**

---

## 7. Multiplayer / Netcode Plan

**Scope:** 2-player co-op-vs-AI (architecture scales to 3–4 later). This is the *ideal* P2P case: small N, cheating doesn't ruin others' experience, short sessions.

**Transport:** WebRTC DataChannels, **two channels minimum** —
- *unreliable + unordered* (`ordered:false`, `maxPacketLifeTime:~200`) for high-frequency state (player/enemy/train transforms),
- *reliable + ordered* for events (loadout, spawns, deaths, scores, run-end).
Don't multiplex everything onto one ordered channel — SCTP head-of-line blocking stalls position updates behind a lost reliable packet. Keep messages **≤16KB**, watch `bufferedAmount` and apply backpressure (pause at ~32KB, resume on `onbufferedamountlow`).

**Minimal real infra (the honest list):**
- **Signaling** (always-on WebSocket) — mandatory.
- **STUN** — mandatory, free (Google public).
- **TURN relay** — mandatory for the ~15–20% behind symmetric NAT. **Cloudflare Realtime TURN: 1,000 GB/mo free**, then pay-as-you-go. At ~5–30 KB/s per relayed peer, that free tier covers tens of thousands of sessions. Skipping TURN silently breaks co-op for 1-in-6 pairs and kills the viral loop.

**Recommended layer: PlayroomKit.** Owns signaling + WebRTC + relay, switches WS/WebRTC at runtime, hides peer IPs (avoids the P2P DDoS/harassment vector raw PeerJS exposes), and provides `isHost()/transferHost()/onDisconnect()` host primitives with a generous free tier — the best match for "fun, viral, host yourself, minimal infra." Backup: **Photon Fusion 2 Shared Mode** (cloud-held state, no single host to lose, free to 100 CCU). DIY path: PeerJS/simple-peer + own STUN/TURN (most work).

**Topology: host-authoritative star.** One player's machine is the source of truth (train physics, enemy AI, spawns, hit registration, scoring, items). The other sends inputs and receives state. Single source of truth = no desync class of bugs, the natural fit for a deterministic spawn Director. **Reject deterministic lockstep** (float/iteration-order non-determinism across browsers causes silent desync, and the game advances at the laggiest peer's speed) and **full mesh** (pointless at N=2).

**Sync model (standard fast-action stack):**
- **Client-side prediction** of own character/aim (immediate local feedback: muzzle flash, tracer, recoil).
- **Host reconciliation** — joiner snaps/replays from last acked tick when snapshots disagree; clamp prediction horizon ~100–200ms.
- **Snapshot interpolation** — remote entities (partner, enemies, cars) rendered ~100ms in the past.
- **Lag compensation** — host rewinds enemy positions to the shooter's fire-time so hits feel fair. Because enemies are AI, generosity has zero competitive downside.
- **Tick rate:** 30Hz sim is plenty for co-op-vs-AI; send state 15–30Hz with delta compression. ~5–30 KB/s per peer.

**Host migration: don't build it for v1.** The "Host Migration Graveyard" is real — transferring full state mid-flight is janky for fast games. **If the host leaves, end the run, show the score, offer "play again."** Honest, simple, fits short viral sessions. (Photon Shared Mode sidesteps this via cloud state; PlayroomKit offers `transferHost()` if we want continuation later.)

**Anti-cheat reality:** P2P host-authoritative has near-zero real anti-cheat — a modified host can do anything. **Acceptable for co-op-vs-zombies** (little incentive to cheat against AI). But **any global leaderboard is trivially forgeable** — treat leaderboards as "for fun" / cosmetic, or add server-side replay validation later if virality demands it. Light host-side sanity checks ("client proposes, host disposes": reject >max-speed teleports with ~1.2× jitter tolerance; never trust client-claimed kills).

**Bonus zero-server path:** support LAN / manual SDP-code (paste/QR) play for the rare fully-serverless case — a nice "no infra" story, not the default. Test iOS Safari WebRTC explicitly; it's historically the flakiest target.

---

## 8. Game Design

**Core loop (text diagram):**

```
   ┌──────────── LOBBY (10–20s) ───────────┐
   │ pick 1 WEAPON + 2 ITEMS → DEPART       │
   └───────────────────┬────────────────────┘
                       ▼
   ┌──────── IN-RUN LOOP (repeats ~3–6s, run 90–180s) ────────┐
   │ enemies BOARD (sides/tunnels/sky, ahead & behind)         │
   │      ▼                                                     │
   │ auto-fire / free-aim → kills drop XP shards + scrap        │
   │      ▼                                                     │
   │ XP bar fills → LEVEL UP: pick 1 of 3 upgrades (build beat) │
   │      ▼                                                     │
   │ every N levels → CARRIAGE TRANSITION set-piece / mini-boss │
   │      ▼                                                     │
   │ DIRECTOR paces stress: Build-Up → Peak → Relax (loot)     │
   └───────────────────┬────────────────────────────────────────┘
                       ▼  (3 hits taken, or voluntary extract)
   ┌──────────────── RUN END ────────────────┐
   │ keep scrap · auto-save 15s replay clip   │
   │ score = distance × combo-multiplier      │
   │ daily-seed leaderboard · INVITE LINK     │
   │ → most prominent button: PLAY AGAIN      │
   └───────────────────────────────────────────┘
```

**Loadout model (a build *seed*, not a stat buff).**
- **Weapons — pick 1 (~6–8 at launch):** distinct firing archetypes with in-run **evolution paths** that bias which level-up choices appear. e.g. Rail Shotgun (cone, knocks boarders off), Tesla Coil (auto chain-lightning), Drone Swarm (orbiting), Flamethrower (DoT + boarding-point area denial), Harpoon Cannon (single-target anti-alien), SMG, Sniper (weak-points).
- **Items — pick 2 (~12–16):** **passives** (magnet radius, move speed, crit, +1 reroll) and **actives** (deployable barricade on a boarding ladder, EMP pulse, decoy, deployable sentry turret). Designed for **synergy** (Magnet + Tesla = constant chain procs).
- **Rule:** every slot changes *what you do*, nameable in 5 words. Start with 2–3 weapons unlocked; gate the rest behind meta so the loadout screen *grows* (between-run carrot).

**Progression / meta.** Spend scrap (kept on death — never a zero-progress run) on: (a) new weapons/items for the loadout pool (strongest pull), (b) many tiny stacking starting-stat bumps (compounds without feeling grindy), (c) achievements unlocking characters/skins. **Meta must not trivialize runs** — skill/build stays dominant.

**Difficulty / AI-director pacing.** Per-player **Intensity** (rises on damage taken + nearby kills, decays over time) drives **Build-Up → Peak → Relax**. Above ~0.75 stress, enter relax mode: cut special spawns, drop a health/ammo pickup. The non-stop train naturally encodes the rhythm — tunnels = darkness/tension, daylight stretches = breather + loot. Thresholds and per-player-count multipliers must be **data-driven and tunable**, not hardcoded.

**Scoring.** Score = **distance × kill-combo multiplier** (kills within a rolling ~2.5s window). Multiplier **decays** if you stop killing → pushes constant aggression, prevents turtling. Distance is the universal, comparable, leaderboard-friendly number.

**Juice (non-negotiable for premium feel).** Hit-stop (1–3 frame freeze on heavy hits), capped screen shake scaled to weapon, particle gibs/ichor bursts, chromatic punch + flash shader on big hits, rising kill-streak audio stinger, the VS-style XP-vacuum whoosh on level-up. **Readability first** — cap simultaneous shake/flash so train and threats stay legible.

**Virality (designed in from day 1).** Shared **daily seed** + daily leaderboard; **auto-captured 15s replay clip** (last seconds + best combo) with one-tap vertical MP4/GIF export + score overlay + link back; **co-op invite link = the install funnel**; global/friends/daily leaderboards (friends drives the most return visits); cosmetics visible to your co-op partner and in clips.

**Ethical monetization (Crossy Road playbook).** Cosmetics-only IAP (skins, weapon VFX, train liveries, kill-effect trails — zero gameplay power); a fixed-fee seasonal battle pass with predictable rewards, no essential features locked; opt-in rewarded video ("double this run's scrap," "revive once") — **never forced, no energy gates.** **Avoid** loot boxes / pay-for-power / RNG-on-power (rising legal scrutiny). *Reality note: web rewarded-ad/IAP monetization yields less and has more friction than the mobile Crossy Road precedent — model conservatively.*

---

## 9. Combat & Enemy Systems

**Combat model: third-person over-the-shoulder free-aim with constrained locomotion.** You run along the train roof/cars within a bounded zone; train motion is automatic. Chosen over (a) on-rails turret (caps skill ceiling, makes co-op two static emplacements — keep the turret as an *item*) and (b) FPS (tunnel-vision hides the 270° of boarding threats and the visuals we're selling). Third-person shows the hero, ragdolls, the train, AND your teammate, and works identically on mouse/gamepad/touch with strong **magnetic aim assist** (sticky-aim slowdown near targets + snap-to-nearest on fire via a multi-raycast cone). Aim assist also relaxes netcode strictness since pixel-perfect hits matter less.

**Hit detection: hybrid.** **Hitscan (raycast)** for pistol/SMG/sniper/most zombies — instant, cheap, robust under lag, easy to make feel fair. **Slow visible projectiles** (host-spawned authoritative entities, kept low-count) for shotgun cones, grenades, rockets, energy/alien guns — read beautifully in 3D, add skill. Networked rule: **clients fire instantly for feel (muzzle flash/tracer/recoil) but the HOST decides the hit**, with lag-compensated rewind.

**Weapons & resource models.**

| Weapon | Hit model | Feel hooks |
|---|---|---|
| Pistol | Hitscan semi-auto | reliable, headshot bonus, large-ammo fallback |
| Shotgun | Hitscan cone (5–9 rays) | huge knockback/stagger, board-clearer |
| SMG | Hitscan high-RoF | spray, recoil bloom |
| Sniper | Hitscan + penetration | one-shots tank weak points |
| Energy/Alien | Slow glowing projectile, chain/AoE | overheat instead of reload, pierces |
| Melee | Capsule/arc overlap | always-available, stamina, shoves boarders off |

Ammo+reload for conventional guns (active-reload/reload-cancel for cheap depth); heat/overheat for energy; stamina for melee. **Knockback/stagger is the most important feel stat** — shoving enemies off the edge is a core verb.

**Items/abilities** (all effects **applied by the host**; clients show predicted VFX immediately): grenades (frag/incendiary/EMP-anti-alien), deployable sentry turret, placeable barrier/shield, host-driven slow-mo (so all clients see the same slowdown), heals/revive (down-but-not-out drives co-op tension, L4D-style).

**Enemy archetypes** (L4D/Vermintide special-infected design): Runners (cheap fast swarm, flow-field driven), Brutes/Tanks (high HP, weak-points, spawn sparingly at Peak), Spitters/ranged (lob from beside/below, force prioritization), Climbers/Leapers (latch onto car sides — the "board the train" verb), Flying aliens (ignore navmesh, 3D approach, vertical threat), **Bosses** (scripted, telegraphed, weak-points, Director-triggered at distance/score milestones).

**AI Director (host-only).** Per-player Intensity → Build-Up (trickle commons + occasional specials) → Peak (stop adding pressure) → Relax (no spawns, breathing room, drop ammo/health) → repeat, plus mercy moves (pills→medkit when everyone's low; despawn offscreen enemies ahead). Spawn **outside view, just off the train edges/ahead** so enemies "board" — never pop in on-screen.

**Pathfinding on a moving, multi-level train (the riskiest bespoke system).** Simulate everything in **train-local space** (motion is then free). Define **boarding points** (couplings, ladder rungs, window ledges, roof edges) as graph entry nodes. Use a **flow field** toward players for the common horde (O(grid × goals), not O(agents) — hundreds share one field) + steering (seek/arrive + RVO-style avoidance). Per-agent A* dies at 100+ agents. Flyers ignore the field and use direct 3D steering. Re-bake the boarding-node graph only on car-layout change. **Budget real engineering time here** — standard flow fields assume a static 2D grid; ours is 3D and moving.

**Ragdoll/death VFX.** On death, swap animated skeleton to a **Rapier ragdoll** (spherical joints per limb), apply the killing blow's impulse for satisfying knock-off-the-train deaths. **Cap live ragdolls at ~10–20**, then freeze/fade to static mesh or dissolve VFX. Gibs/decals via instanced meshes.

**Networked-combat fairness.** Host runs the single source of truth (Director, AI, physics, damage, items, ragdolls). Clients predict only own movement/aim + immediate local feedback; host validates, broadcasts, applies lag-compensated rewind. Because enemies are AI, the host can be generous on hit registration with zero competitive downside. Scale enemy count/HP/damage/special-frequency by **difficulty AND player count** (~+60–100% common count for 2P, +1 special per Peak), and **hard-cap active agents at 60–120** for browser perf — let the Director recycle.

---

## 10. Asset Pipeline & Production

**Art direction:** vibrant-cartoon stylized-PBR (LOCKED — see §5). Lock the bright saturated palette + a single lighting recipe early — cohesion sells "premium," not raw fidelity. Favor asset packs already in this register (Synty's brighter kits, Quaternius, Kenney) so buy/generate stays cohesive.

**Sourcing & licensing (commercial browser game):**

| Source | Content | License posture |
|---|---|---|
| **Quaternius** | Low-poly rigged characters/props | **CC0** — ship freely, zombies/aliens base |
| **Kenney** | Props/kits | **CC0** |
| **Poly Haven / AmbientCG** | HDRIs, PBR textures | **CC0** — env lighting/materials |
| **Synty Studios** | Stylized AAA-indie kits (the target look) | Paid one-time; **ship only baked/compiled GLBs, never raw `.blend`/`.fbx`** — verify the specific pack EULA |
| **Mixamo** | Auto-rig + animations | Free commercial; Adobe-owned & stagnant — document provenance, keep fallback (Auto-Rig Pro / AccuRIG / Rigify) |
| **Sketchfab** | Mixed | **Per-model** — filter strictly to CC0/CC-BY, keep a credits file; avoid NC/ND |
| **Meshy 6 (paid) / Rodin** | AI-generated unique enemy/weapon variants | **Use PAID plans for clear commercial ownership**; outputs need retopo/UV/material cleanup — treat AI as a junior blockout artist, not the pipeline |
| **ElevenLabs (paid) — SFX + Voice** | All sound effects + voice/VO | **Generated here**; clean to own/embed commercially on any paid plan (no standalone redistribution of the raw audio) — see §17 licensing |
| **ElevenLabs Music** (committed — all music) | Music & loopable stems | All music generated here; **monetized + multi-platform = "Studio Game" → needs an Enterprise license** (hard launch gate, §13). No fallback source. See §17.6 / §14.7 |

**Net strategy:** one Synty kit (train + environment cohesion) → Quaternius CC0 enemies → Mixamo rig/anim → a few unique hero variants from Meshy paid → Poly Haven HDRIs. One paid Synty purchase is the only required spend.

**Pipeline tools.** Blender hub (kitbash modular train, retopo AI/photo assets, UV/atlas, **bake lightmaps + AO**). Mixamo auto-rig → retarget in Blender (Auto-Rig Pro / Mixamo add-on); **share one rig across zombie variants** so animations retarget for free. Export GLB. **`gltf-transform optimize`** as a build step: Draco (static) / **meshopt (skinned/morph — Draco corrupts these)**, KTX2 (UASTC hero / ETC1S secondary), dedup/prune/weld/resize/instance. For R3F: **`gltfjsx --transform --instance --types`** → reusable typed JSX + optimized GLB. Three.js side: `GLTFLoader` + `DRACOLoader` + `KTX2Loader` with **version-matched decoder/transcoder files on a CDN** (mismatch = silent load failure; mobile KTX2 format support varies).

**MVP asset list (realistic, breadth-light/polish-heavy — ~40–60 unique assets, buildable by 1–2 people in 4–8 weeks):**
- 1 train = ~6–10 modular pieces (floor, 2 wall variants, roof, door, connector, railing, debris) tiled infinitely.
- 3–4 enemy archetypes (2 zombie, 2 alien) sharing **1 humanoid rig**, ~5–15k tris each, 1 atlas each, 4–6 anims (idle/run/climb/attack/death) + flyer variant.
- 3–5 weapons + 4–6 items, low-poly.
- 1 HDRI + 1 baked lighting setup, 1 VFX set (blood/muzzle/goo), 1 UI kit.
- **Audio / VO bank** (ElevenLabs — see §17): ~300 SFX (×3 variations), ~150–220 VO lines (Conductor + 2 survivors + enemy vocals), ~15 music cues / loopable stems — all DAW-curated (LUFS-normalized, trimmed, zero-crossing loop points, radio/horror processing, ffmpeg → webm/opus + mp3) with a manifest feeding Howler sprite maps.
- **Put 80% of effort into lighting/post/instancing (visuals) and the audio/voice layer (the horror)** — that's where "premium" perception is won.

**Multiplayer asset note.** P2P means **each client downloads all assets up front** (not streamed from a server), so the Draco/KTX2 discipline directly sets join time. Hard budget: **<25MB compressed initial download.**

---

## 11. Suggested Project Structure

```
endless-train/
├─ public/
│  ├─ models/            # optimized .glb (draco/meshopt + ktx2)
│  ├─ textures/          # ktx2 / hdri
│  ├─ audio/             # webm/opus + mp3: sfx, voice, music stems (+ sprite maps)
│  └─ decoders/          # version-matched draco + basis transcoder
├─ src/
│  ├─ app/               # React shell, routing, providers
│  ├─ scenes/
│  │  ├─ Lobby/          # loadout picker, invite link, cosmetics
│  │  └─ Run/            # in-run R3F canvas
│  ├─ engine/
│  │  ├─ renderer/       # WebGPU/WebGL2 setup, quality tiers
│  │  ├─ post/           # tsl-pipeline.ts  +  webgl-pipeline.ts (two stacks)
│  │  ├─ loop/           # fixed-timestep sim, interpolation
│  │  ├─ ecs/            # component pools + systems
│  │  ├─ world/          # chunk streaming, object pools
│  │  ├─ crowd/          # InstancedMesh2 + VAT helpers
│  │  ├─ vfx/            # particle/decal/ragdoll pools
│  │  └─ assets/         # loaders, KTX2/draco wiring, manifest
│  ├─ gameplay/
│  │  ├─ combat/         # hitscan, projectiles, lag-comp
│  │  ├─ weapons/        # data-driven weapon defs
│  │  ├─ items/          # passives + actives
│  │  ├─ enemies/        # archetypes, flow-field, boarding graph
│  │  ├─ director/       # AI Director (host-only), tunable curves
│  │  ├─ progression/    # scrap, unlocks, meta
│  │  └─ scoring/        # distance × combo, replay capture
│  ├─ net/
│  │  ├─ worker/         # netcode worker (WebRTC, serialize, reconcile)
│  │  ├─ host/           # authoritative sim glue
│  │  ├─ client/         # prediction + interpolation
│  │  └─ playroom.ts     # PlayroomKit integration (swap point)
│  ├─ ui/                # HUD, death screen, leaderboards (React DOM)
│  ├─ audio/             # stem mixer, buses, ducking, positional-tells, bark queue
│  ├─ state/             # Zustand stores (UI/meta only)
│  └─ config/            # tunable data: director curves, balance tables
├─ tools/                # gltf-transform, gltfjsx, vat-bake, elevenlabs batch-gen (CSV→API→ffmpeg→manifest)
└─ vite.config.ts
```

**Monorepo siblings (added by §19/§20).** The tree above is the game package. Two internal apps live alongside it: **`apps/lookdev/`** (the Phase-0 Visual Slice — a standalone R3F app that *reuses* `src/engine/renderer/` + `src/engine/post/`) and **`apps/audio-console/`** (the ElevenLabs admin UI), plus a key-holding backend (**`functions/api/`** Pages Functions / Hono in prod, or a local Node + better-sqlite3 server) backed by **R2 + D1**. The `tools/` export job (approved audio → ffmpeg → `loudnorm`/loop-trim → audiosprite → Howler manifest → `public/audio/`) bridges the console to the game. Details in §20.1 / §20.5.

---

## 12. Roadmap & Milestones

**Sequence the scope** — "best 3D + roguelite + Director + P2P + virality" is a large surface. Build single-player core loop + juice FIRST, virality next, **co-op last** (it's the highest-risk, lowest-core-value-at-risk system).

**Phase 0 — Visual Quality Slice (BUILD THIS FIRST — full plan in §19).** *Proves FIDELITY before any gameplay exists.* The train-from-outside hero shot + one walkable interior carriage on the locked WebGPU/R3F stack, with a showcase mode (orbit + free-fly cameras, photo mode, perf HUD, WebGPU-vs-WebGL2 toggle) and explicit acceptance criteria — the go/no-go "does it look premium enough to commit?" gate the user asked for. **M0 reuses Phase 0's environment** (same interior + world-recycler shell): grey-box gameplay drops in with zero re-art. Caveat: a pretty slice proves fidelity, *not fun* — so it hands straight off to M0.

**M0 — Thinnest Playable Prototype (the first step).** *Proves the core verb is fun before any fidelity or netcode.* Static train at world origin, world chunks streaming past, ONE weapon (hitscan), placeholder Quaternius zombies as InstancedMesh2 walking up boarding points, third-person camera + aim assist, "3 hits = die," distance score, instant restart. Grey-box art, no post, no co-op, no meta. **Kill criterion: if "shoot boarders on an endless train" isn't fun grey-boxed, stop and rethink before spending on fidelity.**

**M1 — Vertical Slice.** *Proves the premium look + the level-up loop.* Stylized-PBR art on one carriage, baked lighting + CSM + the WebGPU post stack (+ WebGL2 fallback verified), 1-of-3 level-up build beat, 2–3 weapons + 4 items with one real synergy, juice pass (hit-stop/shake/particles/audio), VAT crowd at scale, adaptive quality ladder, profiled to 60fps desktop / 30fps mobile. The "is this premium?" gate.

**M2 — MVP (single-player complete + virality).** *Proves retention + the share loop.* Full Director (Build-Up/Peak/Relax, tunable), 6–8 weapons + 12–16 items, **4–6 enemy archetypes + multiple bosses, scrap/meta-progression + a deeper unlock tree (rich MVP — §14.5)**, daily seed + leaderboards, **auto-clip capture + export**, cosmetics-only store scaffolding. Soft-launch single-player; instrument retention/funnel.

**M3 — Co-op (the install funnel).** *Proves 2-player works and the invite link converts.* PlayroomKit host-authoritative integration, prediction + interpolation + lag comp, two-channel transport in a worker, TURN provisioned (Cloudflare), revive/down states, "host left → end run" UX, invite-link flow. Test iOS Safari WebRTC explicitly.

**M4 — Launch & live.** Performance hardening across device tiers, monetization (ethical, cosmetics + opt-in ads + battle pass), seasonal content cadence, leaderboard "for fun" validation, marketing the co-op clip loop.

**Audio / VO / story track (runs in parallel — see §15–§17):**
- **M0:** placeholder SFX, the train-rumble bed + low-health heartbeat (prove the audio-first dread verb *early*), one weapon SFX with variations.
- **M1:** the adaptive music engine (vertical L0–L3 layers + tunnel/daylight horizontal swap), ducking buses, first Conductor VO pass (Mode A), positional boarding-tells with visual redundancy — part of the "is this premium?" gate.
- **M2:** full Director-driven music (L4 + Build-Up/Peak/Relax), the complete bark library + 3-mode Conductor arc, enemy sound-tells, stinger/heartbeat system, Black Box lore unlocks, intro cinematic; finalize the SFX bank.
- **M3 (co-op):** host-authoritative sound-tell sync, shared-vs-local audio split, survivor cross-talk barks.
- **M4:** localization (ElevenLabs Dubbing), seasonal VO drops, mobile audio-tier hardening; **finalize music licensing (Enterprise quote or non-ElevenLabs replacement).**

**Platform track (web-first; native Steam client is additive — see §23.6):**
- **Phase 0 + M0:** build/iterate **in the browser** for the fastest loop (optionally wrap the Phase-0 slice in Electron from day 1 to validate the bundled-Chromium WebGPU path + the top quality tier on real Win/Mac hardware early).
- **M1:** stand up the **platform-abstraction interfaces** (`Storage` / `NetTransport` / `Tier policy` first) so both builds compile from M1; wire the §24 tier ladder (top tier gated behind `PLATFORM.isNative`).
- **~M3.5 — Steam client (overlaps M3–M4):** Electron packaging (electron-builder: NSIS + DMG, code-sign + macOS notarize), `steamworks.js` (achievements/cloud/leaderboards/rich-presence/overlay), the Steam-lobby↔PlayroomKit invite bridge, the **mandatory AI-content disclosure**, store page + **Steam Deck Verified**, and server-side Trusted-Mode leaderboard validation. Procure Apple Dev + Windows EV cert **early** (lead-time).
- **M4:** both builds ship — free web funnel + paid premium Steam; cross-play live across both (§23.5).

---

## 13. Top Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| "Best AAA visuals" expectation vs real web ceiling | High | High | Set goal as "top-tier web-native / approaching console-class for stylized scenes" up front (§2); win on art direction + lighting, not polygons |
| Mobile 60fps assumed; thermal throttle collapses it | High | High | 30fps locked mobile baseline + adaptive quality ladder from day 1; 60 mobile is a stretch goal |
| iOS Safari / iPad WebGL **memory crash** (~256MB) — distinct from throttle (§22.4 #4) | Med | High | Hard texture/VRAM cap + low-fi mobile asset path; WebKit detection; real-device crash testing (all iOS browsers are WebKit) |
| Crowd perf cliff (skinned enemies) | High | High | InstancedMesh2 + VAT + LOD + per-instance culling + hard 60–120 agent cap; benchmark early |
| TURN omitted → 1-in-6 co-op invites fail | Med | High | Provision Cloudflare TURN (free tier) before co-op ships; PlayroomKit-managed |
| Two post-processing stacks (WebGPU + WebGL2) double the work | High | Med | Plan both as deliverables; gate heavy effects; keep WebGL2 lighter by design |
| Flow-field on a moving multi-level train (bespoke) | Med | High | Train-local sim + baked boarding-node graph; allocate real eng time; spike it in M2 |
| GC stutter from continuous spawning | Med | High | Pre-warm pools, zero hot-loop allocation, monitor `renderer.info` |
| Loadout collapses to one dominant build | Med | Med | Weapon-biased level-up pools, rerolls, ongoing balance passes (data-driven tables) |
| Leaderboard cheating (no authoritative server) | High | Low–Med | Treat leaderboards as "for fun"; cosmetic stakes; optional replay validation later |
| Host leaves → run dies | Med | Med | v1: "host left → end run, play again" UX; no host migration |
| Asset bundle bloats past viral budget | Med | High | Hard <25MB compressed cap; Draco/meshopt/KTX2 enforced in CI build step |
| R3F `setState`-at-60fps tanks framerate | Med | High | Discipline: mutate refs in `useFrame`, Zustand only for UI/meta; lint/review for it |
| WebGPU r180+ perf/shadow regressions vs WebGL | Low–Med | Med | Pin renderer version, benchmark per-scene, keep WebGL2 path solid |
| Web monetization yields less than mobile precedent | Med | Med | Model revenue conservatively; cosmetics + opt-in ads; don't bank on rewarded-video ARPU |
| Scope creep across 5 big systems | High | High | Strict M0→M4 sequencing; co-op last; kill-criterion gate at M0 |
| AI-music adaptivity gap (text-to-music ≠ an adaptive system) | High | Med–High | Author the adaptive engine ourselves in Web Audio; generate/loop-edit stems, not finished tracks (§17) |
| Music licensing — ElevenLabs "Studio Game" Enterprise license (committed, no fallback) | High | High | **Hard launch gate** — secure the Enterprise music license early; SFX/voice unaffected (§17.6, §14.7) |
| Audio main-thread / voice-count budget on mobile | Med | Med | 10–15Hz panner updates, cap voices, drop stems, graceful degradation, iOS test |
| Tonal whiplash — horror overpowers the fun | Med | High | 80/20 audio mix, frequent comedy barks, tunable dread + softening toggle, playtest hard (§15) |
| VO repetition / bark spam | Med | Med | Large tagged bark set + cooldown/priority queue |
| Sub-bass inaudible on laptop/phone speakers | Med | Low | Layer audible mid-bass; never rely on true sub |
| ElevenLabs generation cost / non-determinism / loop seams | Med | Med | Curate a fixed, normalized asset set; budget credits up front |
| Client-side ElevenLabs API-key exposure | High | High | Key strictly server-side (Worker/Pages-Function proxy); never in any bundle; redact `xi-api-key` in logs; per-env key + rotation (§20.1) |
| Admin-console scope creep (it's not a DAW) | Med | Med | Generate-store-curate only; conform/loop/normalize stays in ffmpeg/CI (§20.5) |
| Phase-0 pretty slice doesn't prove fun | Med | High | Build the slice reusable; gate M0 on the grey-box fun test in the same shell (§19.G) |
| ElevenLabs credit cost for a rich catalog (~480 gens + re-rolls) | Med | Med | Subscription-delta cost tracking, soft budget cap, concurrency-aware queue, priority-order gen (§20.6) |
| WebGPU-in-webview on macOS (WKWebView gated to macOS 26+/Apple Silicon, no force flag) | High | High | Electron (bundled Chromium/Dawn) mandatory for native; **Tauri rejected** (§23.2) |
| Two-build maintenance (Win+Mac native × two post stacks × 4 tiers) | Med | Med | One codebase + thin platform-abstraction layer; tier never touches sim; CI both builds (§23.2, §24) |
| Steam AI-content disclosure (mandatory, shown on store page) | High | Med | Author a neutral factual Pre-Generated disclosure; web build unaffected; accept some buyers filter (§23.4) |
| Electron binary/RAM footprint | Low | Low–Med | Real but dominated by multi-GB Steam assets; native-only, never the web build (§23.2) |
| macOS notarization + Windows EV code-signing cert | Med | Med | Procurement lead-time — start early (~M3.5); Apple Dev $99/yr + EV cert (§23.6) |
| Cross-play pool split (if Steam used SDR transport) | — | High | Avoided: one unified WebRTC pool everywhere; Steam = invite veneer only (§23.5) |

---

## 14. Open Decisions for the User

These are genuine forks. **Fork 6 (monetization timing) is the only one still OPEN; forks 1–5, 7, and 8–10 are RESOLVED** (2026-06-27). (Four more player-research forks are resolved in §22.6.)

1. ✅ **RESOLVED → Three.js + R3F.** (vs Babylon.js 9.0.) Smallest load, biggest hiring pool, max fidelity control; we own the "engine layer" by composing libraries.

2. ✅ **RESOLVED → desktop-focused; mobile DEFERRED (post-launch, not an MVP/launch target).** *(Updated 2026-06-27 — was "desktop-first, mobile-capable.")* Build for desktop; the 30fps mobile tier, touch controls, and the iOS-Safari memory-crash guard become **non-blocking/deferred**. The adaptive-quality ladder + memory discipline still earn their keep on low-end *desktop* GPUs. Mobile can be revisited as a post-launch stretch. See §22.6 #4.

3. ✅ **RESOLVED → PlayroomKit (managed).** (vs DIY PeerJS + own STUN/TURN.) Managed signaling + relay + host primitives; hides peer IPs; fastest path to working co-op.

4. ✅ **RESOLVED → vibrant-cartoon.** (vs grounded-gritty.) Bright saturated palette, Fortnite/Crossy-Road reads — broadly shareable, cohesive on weak GPUs, pops in clips; "viral/mass" prioritized over "premium/cinematic." (§5 and §10 updated to match.)

5. ✅ **RESOLVED → rich MVP content.** (vs lean.) Multiple bosses + a deeper unlock tree at MVP. *Tradeoff acknowledged:* more content raises the risk that the fun kill-criterion gets under-tested and stretches the timeline — mitigated by gating on the **Phase-0 Visual Quality Slice (§19)** and an early grey-box fun check **before** pouring in content. (§9, §12 M2 updated to match.)

6. ⬜ **OPEN — Monetization timing: at-launch vs post-retention-proof.** *Recommended: scaffold cosmetics at MVP, switch on monetization only after retention/funnel data validates the loop.* Turning on IAP/ads before the loop is proven wastes integration effort and risks souring early adopters.

7. ✅ **RESOLVED → ElevenLabs for ALL audio (music + SFX + voice/design); no fallback source.** The catch is music licensing: Eleven Music's **"Studio Game" carve-out** means a monetized, multi-platform game's music falls **outside self-serve rights**, so this is now a **committed dependency requiring an Enterprise plan/quote** (or a deliberately single-platform footprint, vetted by counsel). Because there's no fallback music source, **the Enterprise music license is a HARD LAUNCH GATE** (tracked in §13). **Action:** secure it before launch; SFX + voice remain clean on a self-serve Pro plan. See §17.6.

*Four further forks surfaced by player-sentiment research are **RESOLVED in §22.6** (2026-06-27): manual-free-aim default (auto-fire as optional toggle), pure all-ElevenLabs voice (no special framing), daily-seed + friends-first leaderboards, and desktop-focus (mobile deferred — see fork 2 above).*

**Multi-platform forks (resolved 2026-06-27 by §23; the desktop client is the Steam SKU):**

8. ✅ **RESOLVED → packaging = Electron (primary) / NW.js (backup) / Tauri REJECTED.** One Vite/R3F codebase → web build (Cloudflare Pages) + native Win/Mac build (Electron, bundled Chromium/Dawn for a consistent WebGPU path). Tauri rejected because WKWebView WebGPU is gated to macOS 26+/Apple Silicon with no force flag — older-macOS Steam buyers would silently drop to WebGL2. (§23.2)

9. ✅ **RESOLVED → business model = free web funnel → paid premium Steam ($9.99–$14.99), Early-Access first, no MTX at launch.** The free browser build is the viral "ad" for the premium Steam SKU (validated Vampire Survivors model); justify the price with the §24 top tier + authoritative leaderboards + Steamworks + Steam Deck, not by reselling the same bytes. MTX stays a post-retention-data option (governed by still-open fork 6). (§23.4)

10. ✅ **RESOLVED → cross-play = ONE unified WebRTC/PlayroomKit transport everywhere.** Web↔Steam cross-play on a single netcode path behind a `NetTransport` interface; Steam adds a friend-invite/overlay *veneer*, not a transport (SDR parked post-launch). For a 2-player invite game, splitting pools would break the funnel. Host-authoritative sim stays transport-agnostic; **quality tier never touches the simulation** (cross-play correctness wall). (§23.5)

---

## 15. Tone Reconciliation — Cartoon-Horror

**The thesis (LOCKED):** the eyes get *fun*, the ears get *fear*. Visuals stay vibrant-cartoon (Fortnite / Crossy Road, §5); **the horror is delivered almost entirely through audio** — music, SFX, and voice. The juxtaposition is not an accident to be smoothed over; it **is the brand**. You laugh at a cheerful intercom chime, then the Conductor whispers "…do not look out car nine," and the gap between the picture and the sound *is* the scare. This is "spooky-fun" / "cartoon-horror": shareable on sight, genuinely tense in the moment.

**Why this works (and is cheap on a web budget):** horror in games is overwhelmingly an *audio* phenomenon — Dead Space, Amnesia, Resident Evil and Darkwood condition players to read every creak and growl as threat. We get console-class dread from audio we can generate, without spending our (capped) visual budget or breaking the bright, weak-GPU-friendly, clip-friendly look. The fear costs kilobytes, not gigaflops.

**Reference games (the tonal lane):**
- **Luigi's Mansion** — the north star for "child-friendly horror": a theme that sends shivers yet stays nostalgic; Luigi's own frightened humming flips between funny and unsettling.
- **Left 4 Dead** — gallows-humor barks + an **AI Director that paces fear**; specials announced by *sound* before sight (our boarding-tell model, §17).
- **Cult of the Lamb** — cute cult, sinister drones underneath.
- **Plants vs. Zombies** — goofy menace; cartoon-squishy gore that stays broadly shareable.
- **Little Nightmares / Gremlins / Little Shop of Horrors** — adorable-grotesque; cute exterior, real teeth.
- **Stranger Things / Zombieland** — warm Americana with something rotten under it; rules-as-comedy.

### Do / Don't rulebook

**Stays CUTE (the fun-forward channel — visuals & reward):**
- ✅ **Visuals, always.** Bright saturated palette, rounded Synty/Quaternius proportions, neon alien glow, bold cartoon ichor. Never desaturate "for horror" — that breaks the §5 lock.
- ✅ **The player's *feedback* is juicy and arcade-bright.** Pickups, level-ups, kill-streaks → rising arpeggios, sparkles, fanfares. **Fear on threat; dopamine on success.**
- ✅ **Characters & comedy.** The survivor cast and the Conductor's dark jokes keep it a buddy-comedy-under-siege. The deadpan announcer wink is the comic pressure-release.
- ✅ **Gore is exaggerated, not gross.** Squishy, over-the-top splats (PvZ register), never realistic viscera.

**Brings the DREAD (the fear channel — audio, voice, pacing, lighting accents):**
- ✅ **Audio carries ~100% of the fear.** Ever-present low train rumble bed, dissonant drones, detuned music-box motif, risers, stingers, off-screen whispers.
- ✅ **Voice is the scary channel.** A calm, trusted, friendly voice (the Conductor) saying disturbing things with no empathy — the uncanny-valley-of-voice. Whispers only the local player hears.
- ✅ **Enemy sound-tells.** Every special has a distinct vocalization heard *before* it is seen, panned to its bearing (§17).
- ✅ **Pacing = dread.** Engineer *relative* silence in "Relax" (drop to just the rumble bed), so the next Build-Up hits hard.
- ✅ **Lighting accents only.** Within the bright look, reserve a *small* dread vocabulary — a tunnel that swallows the light, a flicker on the intercom, alien glow pulsing in time with a heartbeat. Accent, not a palette shift.

**DON'T:**
- ❌ **Don't let horror win the moment.** ~**80/20**: any beat is ~80% fun-forward, horror is the seasoning that spikes during Build-Up/Peak. If the mix reads as straight horror, we lose the viral/shareable promise. Playtest the split aggressively; ship a tunable "dread" mix level and a streamer/young-audience softening toggle.
- ❌ **Don't leave the player in unresolved dread.** Every dread crest resolves into a fun beat (kill-streak fanfare, goofy splat). Unresolved = horror, not spooky-fun.
- ❌ **Don't desaturate, grime, or gore-up the visuals** to "sell" the horror. The audio sells it; the picture stays bright.
- ❌ **Don't overuse jump-stingers.** Reserve them for boss boarding / surprise Grown so they keep their punch. Dread > jump-scares.
- ❌ **Don't make creature audio cute.** Monsters are primal and wet; only the *player's* feedback and the announcer's wink are friendly.
- ❌ **Don't rely on a scare that's audio-only** for *gameplay* (see §17 boarding-tell redundancy) — but for *tone*, audio-only dread is exactly the point.

**The one-line test:** if a clip is shareable and makes someone **grin-with-a-shiver**, the tone is right.

---

## 16. Story, World & Narrative

### 16.1 Title & premise

**"LAST TRAIN OUT OF SUNNYVALE."** A candy-colored 1960s-retro-futurist America (Crossy Road meets a tourism brochure hiding something). One morning a meteor shower — actually a **seed-drop** — salts the continent with a glittering alien spore, **THE BLOOM**. The Bloom does two things: it grows fast, gorgeous, iridescent fungal coral over everything, and it **reanimates anything dead it touches**. Towns don't go dark — they go *beautiful and wrong*.

**Why an endless train (the loop, justified in-fiction):** the one thing the Bloom can't catch is **velocity through cold air**. The last working evac is **THE EVERGREEN LINE** — a maglev that *physically cannot stop*: braking lets the spore-cloud catch up and seed the cars, and the reactor that outruns the Bloom only stays stable at speed. (Proudly campy B-movie pseudo-science — the Conductor lampshades it so skeptics can't nitpick it.) The train flees the Bloom-front **and** chases the rumored **COLD TERMINUS**, a high-altitude station above the spore line that may not exist. **Stopping = death; the destination is a maybe.** The fiction is *built* to loop.

**Death = reroute, not game over.** Dying is the train being overrun and shunted onto a parallel track — you wake further down the line, same train, new stretch of country. The roguelite restart is diegetic.

### 16.2 The unified threat — one organism, two acts (not two random enemy types)

The Bloom is a **single organism with two growth stages**, which is why zombies *and* aliens belong to one escalating story:

- **Stage 1 — THE RISEN (zombies).** Humans/animals the spore reanimated. Cartoon-shambly, bloom-flowers sprouting from eye sockets, still wearing Sunnyvale's cheerful clothes (mailman, cheerleader, ice-cream man). They **climb the train** because the host instinct is to spread to the fastest-moving biomass — i.e. you.
- **Stage 2 — THE GROWN (aliens).** Risen the Bloom has fully "finished": crystalline, chitinous, glowing — the spore's true intended form once it has enough biomass. They don't climb; they **leap, burrow through cars, and spit spore.** They are what every Risen is *becoming*.

**Escalation is literal botany:** the longer a run goes, the more Risen the AI Director has had time to **ripen into Grown**. Zombies are early-run, aliens are late-run, and the player *watches the threat evolve mid-run* — same enemy family, two acts. **Readability mandate (mobile 30fps tier):** Risen and Grown must read at a glance by silhouette *and* audio signature (organic-wet vs. inorganic-resonant, §17), or the evolution beat is lost.

**The buried reveal (lore-gated):** the Bloom isn't conquering Earth, it's **terraforming it for something that hasn't arrived yet** — and the Cold Terminus signal you're chasing is **bait**.

### 16.3 Tone (ties to §15)

Visuals sunny; dread 100% audio. References: **Zombieland, Left 4 Dead, Snowpiercer, Stranger Things, Gremlins / Little Shop of Horrors.** The picture sells fun, the soundtrack sells fear, the comedy lives in the gap.

### 16.4 The cast

**THE CONDUCTOR — the primary VO device and narrator (the single most important audio asset).** The Evergreen Line's onboard AI, voiced as a 1960s in-flight / emergency-broadcast announcer: warm, paternal, unhurried, reassuring — **the trusted voice we're conditioned to obey, which is exactly what makes him terrifying when he lies.** He does *everything* story-wise: greets you in the lobby, narrates over the intercom, intros bosses, slips dark jokes, and **slowly goes wrong** as the Bloom infiltrates his systems. He runs three delivery modes that *are* the story (no exposition dumps):
- **Mode A — "Welcome aboard"** (early run): cheerful, helpful, jokey. *"Reminder: the emergency brake is decorative. Please enjoy the scenery."*
- **Mode B — "Strain"** (mid run): warmth thins, longer pauses, a flat note creeping in. *"You're doing… so well. Statistically, that won't last."*
- **Mode C — "Wrong"** (boss / deep run / twist): same friendly voice, no empathy; private whispers the other player can't hear. *"[whispers] I lied about the next station. There isn't one."* Late lore reveals the Conductor **isn't sure if he's still a machine or already Bloom** — his glitches are him fighting infection in real time.

**Playable survivors (co-op, 2 players — contrasting silhouettes & voices so barks are distinguishable):**
- **MARISOL "MARI" VEGA** — ex-train mechanic, deadpan, competent. (Weapon affinity: rivet gun / heavy.)
- **DEWEY OKONKWO** — teenage Sunnyvale paperboy, motormouth optimist, comic relief. (Affinity: scrap / improvised, fast.)
- **DR. PETUNIA HOLT** — botanist who *understands* the Bloom and is unsettlingly fond of it. (Affinity: chem / spore tools.)
- **SARGE (B. UDDIN)** — burnt-out mall-cop who thinks he's special forces. (Affinity: big dumb guns.)

Each survivor has a personal **Black Box** lore track and reactive bark sets, so co-op feels like a buddy-comedy under siege; their barks reference the Conductor ("does the intercom guy sound off to you?") to seed the twist via overheard dialogue.

### 16.5 Structure — zones as acts, boss milestones, seasons

**Acts/biomes (the train climbs from drowned suburbs to the cold peak — Snowpiercer-style verticality of threat; also the §17 "tunnel-vs-daylight" music rhythm):**
- **Act I — SUNNYVALE SUBURBS** (Risen only, daylight, comedic): tutorial dread.
- **Act II — THE BLOOM BELT** (overgrown highways, dusk): first Grown appear; the evolution reveal.
- **Act III — DROWNED CITY / SWAMP** (night, fungal neon): Grown-heavy, claustrophobic.
- **Act IV — THE ASCENT** (mountain cold, spore aurora): Bloom thins, Grown are elite.
- **Terminus tease:** the Cold Terminus signal grows louder each act — revealed as bait at the seasonal climax.

**Boss milestones (each a memed silhouette + Conductor intro):** **THE GARDENER** (Act I — a giant Risen florist), **MOTHER STALK** (Act II — first Grown queen), **THE CONDUCTOR'S TWIN** (Act III — a Bloom-grown copy of your own train), **THE FIRST SEED** (Act IV — the thing the Terminus was luring you toward).

**Episodic / seasonal structure (live content & cheap re-engagement):** each **Season = a new stretch of line + a new Act/biome + a new Conductor arc + a new boss + a new playable survivor.** Finales answer one mystery and open the next (does the Terminus exist? what is the First Seed *for?*). This maps perfectly to an ElevenLabs-first pipeline: **each season is mostly a new VO drop** — cheap to produce, high re-engagement.

### 16.6 Narrative delivery — story without slowing the "one more run" loop

**Hard rule: nothing blocks the restart.** Every channel is ambient or opt-in:
1. **Intercom / radio barks (the workhorse).** Conductor + survivor cross-talk, short and reactive, never modal, tied to AI-Director state: calm-travel lines, "swarm incoming" warnings, boss intros, near-death gallows jokes, distance milestones ("You've outrun three towns. They noticed."). A **deep, tagged bark library** so lines rarely repeat. Milestones double as story beats ("Station 4 — wait. We passed Station 1 again.") — the loop *is* the horror: you can never arrive.
2. **Environmental storytelling out the window.** Billboards decaying town-by-town ("WELCOME TO SUNNYVALE — pop. …0"), a Bloom-overgrown school bus, a *previous* Evergreen train half-grown-over on a parallel track (your future), a military line that obviously failed. Wordless plot + great clip backdrops.
3. **Boss intros (3–5s, non-blocking).** Quick parallax camera push as the Conductor names the boss; the run never stops.
4. **Between-run "BLACK BOX" lore unlocks (meta-progression).** After a run you collect **Recovered Recordings** — short pre-rendered VO logs (other passengers, mission control, the Conductor's corrupted backups) — unlocked by distance/boss milestones. This is the *real* story, dripped at the player's pace, and the "I need one more run to hear the next tape" hook. **Must be genuinely compelling (cliffhanger tapes)** or the narrative is invisible.
5. **Intro cinematic (~30s, skippable, once).** Sunny montage → meteor → Bloom over everything → train pulls out as the world goes beautiful-and-wrong. Tone set in one viewing.
6. **Discoverable lore.** Rare **golden ticket-stub** pickups mid-run unlock secret Conductor monologues — reward exploration without gating progress.

### 16.7 Story ↔ gameplay tie-ins (fiction and mechanics agree)

- **Loadout = your evac kit ("what you grabbed running for the train").** Weapons are repurposed Sunnyvale objects (mascot-costume flamethrower, leaf-blower spore-cannon, mailman's "junk mail" shotgun) — keeps the campy tone. Items are **train-system upgrades** (coolant flush, intercom booster, emergency flares) that *also* canonically help the train outrun the Bloom.
- **Enemy archetypes = Bloom growth stages** (Risen → Grown), so rising difficulty *is* the story escalating.
- **AI Director = the Bloom's spread rate.** Its calm/build/peak/relief rhythm is the spore-cloud closing and falling back — and it **drives the audio horror** (§17): in lulls the intercom goes quiet and creepy; on a peak it cuts to panicked cross-talk + the music's horror stinger. The Director conducts the *fear*, not just the spawns (Left 4 Dead, audio-first).
- **Virality hooks:** the cute-vs-creepy clip gap; the co-op invite link framed as "get on the train before it leaves"; "the tape you just heard" Black Box reveals driving speculation; weekly **named-swarm seeds** ("everyone's run this week is haunted by The Gardener").

---

## 17. Audio, Music & Voice — Horror via ElevenLabs

**Library split (LOCKED approach):** **Howler.js** for one-shot SFX via **audio sprites** and its **Spatial plugin** (PannerNode HRTF) for positional pickups/threats, layered over a **thin custom Web Audio graph** for the music stem mixer, buses, ducking, and sample-accurate scheduling that Howler doesn't expose. Three.js has no audio engine, so this layer is bespoke (consistent with §3).

### 17.1 Horror-audio design approach

The dread lives in sound (§15). Core techniques:
- **Dread > jump-scares.** Fear lives in the *moments between*; the ebb primes the next hit. Reserve jump-stingers for boss boarding / surprise Grown so they keep their punch.
- **Engineer *relative* silence.** A non-stop train never gives true silence, so "Relax" drops to **just the rumble bed** — making the next Build-Up jarring. Dynamic range *is* the tool.
- **Low-frequency rumble (the dread floor).** A constant low train rumble, swelled during Build-Up, reads as predator-growl/earthquake danger. **Caveat (fact-checked reality):** true sub-bass below ~40 Hz is inaudible/distorted on laptop and phone speakers — the dominant browser listening setup — so the dread floor must be **layered with audible mid-bass cues** and never *rely* on real sub.
- **"Unsafe" ambience.** Distant, unplaceable sounds (a wet skitter, a child-like giggle far down the carriage) keep players scanning — critical for the 270° boarding threat.
- **Stingers, drones, dissonance, risers, detuned music-box, whispers/breathing** rendered as non-diegetic texture *under* the bright cartoon SFX.
- **Low-health heartbeat — the most reliable dread-on-demand cue.** Slow sub-bass-adjacent thump that quickens as health drops; routed to a dedicated bus that **ducks music** and reads through chaos.
- **Spatial / positional audio for 270° boarding threats (gameplay-critical).** Each boarding enemy's audio is positioned at its world bearing via **PannerNode HRTF** (Howler Spatial plugin), so players *hear* a climber behind-left before they see it — turning the boarding mechanic into an audio-first skill. **Enemy sound-tells (Left 4 Dead model):** every special gets a distinct vocalization heard 0.5–1s *before* it appears, distance encoded as volume + low-pass + reverb send (far = quieter/duller, near = sharp). Example tells: a **Climber** (hull-metal skitter), a **Wailer** (Witch-like sob = don't aggro), a **Spitter** (wet gurgle-hiss), a **Grabber** (off-screen rasping cough). **Accessibility redundancy (required):** poor speakers and hearing differences mean audio-only threat cues disadvantage some players — pair every directional tell with a **visual directional-damage indicator** (and haptics on mobile).
- **Co-op audio split (PlayroomKit, host-authoritative):** *shared* audio (host-synced: Conductor announcements, boss roars, horde bed, which special spawned) vs. *local* audio (per-client: your own hurt grunts, low-health panic, your pickups, Conductor whispers addressed to "you"). The **tell decision must be host-authoritative** even though spatialization is client-side, or the two players hear different threats and the triangulate-by-ear horror breaks.

### 17.2 Adaptive / interactive music architecture (Director-driven)

**HONEST CONSTRAINT (fact-checked, OVERRIDES research):** **text-to-music AI does NOT produce a turnkey interactive/adaptive music system, and does not replace a composer + middleware.** ElevenLabs Music can generate musical *material* — full tracks, section-by-section composition plans, seamless loops (via **enterprise-only Inpainting**), and stem-separated parts (post-hoc source separation, with likely bleed/artifacts and no guaranteed bar-alignment or phase-coherence). The **adaptive layer itself — vertical layering, horizontal re-sequencing, beat-synced transitions, stingers, state-driven mixing — we author and implement ourselves in Web Audio/Howler.** Plan time for (a) building that engine, (b) **cleaning/conforming AI stems to bar-aligned, phase-coherent, loop-ready layers**, and (c) the legal/IP reality that the output is non-exclusive (a competitor could get identical music) and AI-only music has uncertain copyright protection.

**Vertical layering (intensity — follows the Director).** One harmonically/rhythmically locked piece authored as **stems sharing BPM and key** so any combination blends. Map the Director's intensity (enemy count, proximity, player heat) to crossfaded per-stem GainNode levels for graduated, organic escalation with no jarring cuts:
- **L0 Bed** — always on: detuned music-box motif + rumble (the dread floor).
- **L1 Pulse** — light percussion/ostinato; fades in on Build-Up. (Anchor it to the train's rhythmic wheel-clack so music and ambience lock.)
- **L2 Tension** — dissonant drone + risers as enemies approach.
- **L3 Combat** — brass/drums at Peak (full wave / boss).
- **L4 Choir/scream-pad** — only at max intensity (boss boarding). *Dropped on the mobile tier.*

**Horizontal re-sequencing (place/biome — the "tunnel vs. daylight" rhythm).** Swap whole sections on **bar boundaries** via a **quantized transition scheduler** (queue the swap to the next bar/loop point), bridged by a short riser/stinger to mask the seam:
- **Tunnel** = dread palette (drones up, melody stripped, reverb long) — the breath-held passage.
- **Daylight** = relief palette (melody returns, brighter — "you survived").

**Seamless looping & ducking.** Author each stem as a sample-accurate loop; **start all stems from one scheduled AudioContext time and re-anchor at loop points** (independently-started stems phase/drift — a real Web Audio failure mode). Route music to a `musicBus` GainNode and **duck it ~4–6 dB** under dense SFX / VO / heartbeat via `gain.setTargetAtTime` ramps, restoring on calm.

### 17.3 ElevenLabs pipeline (SFX + music + voice)

**SFX — Text to Sound Effects (`eleven_text_to_sound_v2`).** 0.1–30s per generation; best-effort **seamless `loop` flag** (verify each loop for clicks); `prompt_influence` high (~0.7) for literal sounds, low (~0.2) to spin **3–5 variations** per event (randomize index + slight pitch/rate at playback to kill repetition); `duration_seconds` to control length and cost; Opus 48kHz / WAV output. Banks: weapons (arcade-bright, layered transient+tail), Risen/Grown vocalizations & cartoon-squishy gore, **boarding/climbing tells**, train mechanical ambience (looping rumble, wheel-clack, hisses, metal groans), UI, level-up/pickup juice, kill-streak fanfares, low-health heartbeat, the **cheerful-then-distorted intercom chime**.
- **Prompt style:** material + action + character + perspective, e.g. *"chunky cartoon shotgun blast, punchy low-end thump, comic exaggeration, dry, close-mic"*; *"wet squelchy zombie groan, guttural, slightly comedic."*
- **Alien vs. zombie separation:** zombies = human-derived wet organic groans (uncanny ex-human); aliens = inorganic, pitched-wrong, clicking/resonant — best made by **pitch-shift/granular-processing human-vocal output** so a *buried human ghost* survives inside the alien voice.
- **Reality (fact-checked):** SFX precision is approximate (no exact transient/envelope control) — **generate-many-and-curate**, don't expect one-shot perfection.

**Music — Eleven Music (`music_v2`).** Use **composition plans** (per-section style/tempo/key) + `force_instrumental` to generate **matched-tempo/key loopable layers**, or **stem separation** to split one cue into parts; **Inpainting** for loop points / tunnel-vs-daylight variants. Then assemble the adaptive system ourselves (§17.2). Prohibited inputs (all plans): real artist/song/album/label names or distinctive lyrics.

**Voice — Voice Design + the v3 model line.** Build the Conductor and survivors with **Voice Design**; use **Eleven v3** for expressive, tag-directed delivery (`[whispers] [shouts] [nervously] [flat] [cold] [pause]`); stability **0.6–0.85** for consistent Conductor narration, **0.3–0.5** for panicked barks. **Pin one saved Voice ID per character and regenerate from it** — never re-prompt the voice between lines (timbre/loudness drift is real even with a fixed ID). Stream rare contextual barks live with a low-latency model (**Flash v2.5**) but **pre-render the common bark set to cached audio** to cap latency/credit spend; pre-render Black Box logs + cinematic at highest fidelity. Use **Text to Dialogue** for survivor cross-talk, and **Dubbing** for cheap localization to widen the shareable audience. *(Note v3 / inline-tag API availability was alpha/limited at points in 2025 — confirm batch access at production time; fall back to v2 + DAW processing for emotion if gated.)*
- **The "wrong" technique (core cartoon-horror lever):** generate the Conductor's lines **twice** — a clean warm pass and a corrupted/whispered pass — and **crossfade** as infection rises; render per-line variants (clean PA / degraded PA / whisper-no-PA). If the model won't push far enough into "cold/flat" for Mode C, fall back to a **second darker Voice ID**, accepting a slightly weaker same-voice-turning-wrong effect.

**Reality (fact-checked, applies to all three):** output is **non-deterministic** (the `seed` is best-effort, not guaranteed) and **billed per generation/second**; building a large stem library and iterating SFX variations can get costly and produce inconsistent loop seams. **Curate/normalize/loop-edit a fixed final asset set rather than generating audio at runtime.** Record generation dates + prompts (terms are versioned).

### 17.4 Voice / VO plan (scope)

- **Narrator:** the Conductor (§16.4), 3 modes, the story's spine.
- **Barks:** 2+ survivors × ~10 categories (hurt, low-health panic, level-up, revive, kill-streak, last-stand, special-spotted, out-of-ammo, item-pickup, Conductor cross-talk) × 3–5 variants; Director-triggered via a **cooldown + priority queue** (story/danger > flavor) to prevent bark spam shattering immersion in chaos.
- **Enemy vocalizations & sound-tells:** horde bed (loop) + ~5 specials × {far tell, near tell, attack} + layered boss roar (low growl + sub + distorted human scream under a Tank-style horn sting).
- **MVP target ~150–220 lines:** Conductor ~50–70; 2 survivors ~60–90 barks; enemy vocals ~30–45 SFX assets — roughly one day of generation, then QA/normalization.

### 17.5 Web implementation

- **Buses/ducking:** `master ← {musicBus, sfxBus, voiceBus, uiBus, heartbeatBus}`, each a GainNode; duck `musicBus` under voice/heartbeat via `setTargetAtTime` ramps; optional `DynamicsCompressor` on master to glue.
- **270° threat = PannerNode HRTF** (§17.1) with visual/haptic redundancy.
- **iOS / autoplay:** AudioContext starts suspended; **unlock on first tap** (Howler calls `ctx.resume()`; mirror it for the custom graph). Gate run start behind a **"Tap to board"** button.
- **Formats/budget:** ship **Opus-in-WebM** (smallest) with **MP3 fallback** for Safari edge cases; decode loops/music once into AudioBuffers; pack short SFX into **audio sprites** to cut HTTP requests and memory; keep total audio download lean for the §10 <25MB initial budget (P2P = every client downloads all assets up front).
- **Off the render thread:** Web Audio already runs on its own audio thread; keep per-frame JS minimal — **update panner positions + Director intensity at ~10–15 Hz, not every frame** — so audio never competes with the Three.js/WebGPU render or the Rapier step.
- **Mobile tier (30fps):** fewer simultaneous voices, **drop the L4 choir stem**, simplified panning, lower sample rate; the heartbeat + positional-tell system **must degrade gracefully** (browsers throttle/limit concurrent Web Audio voices, and iOS Safari underperforms on decode and limits concurrency) — test a fallback tier explicitly.

### 17.6 Commercial licensing reality (fact-checked — OVERRIDES any rosier research)

- **VOICE and SOUND EFFECTS — clean to ship.** On **any PAID plan** (Starter ~$5 and up), Output is owned by you, the commercial license is **perpetual, royalty-free, and attribution-free** (attribution + non-commercial limits apply **only to the Free plan**), and rights survive cancellation for audio generated while paid. **Pro (~$99/mo)** is the practical entry point for API access + cleaner output. Games are an allowed use. *Pin: SFX/voice output is non-exclusive and AI output may not be copyrightable (your right to *use* is solid; you may not be able to stop others copying identical output).*
- **MUSIC — the landmine.** Eleven Music is governed by **separate Music Model-Specific Terms** with a per-plan commercial-rights table, **not** the blanket voice/SFX license. They define **"Studio Games"** = *video games that are commercialised (sale, advertising, or any monetisation) and made available on **more than one platform***. On **Self-Serve plans, commercial use is permitted EXCEPT for film, TV, and Studio Games.** Our game is monetized and "broadly shareable/viral"; if it lands on more than one platform (web + any store/wrapper or multi-channel distribution) the generated **music likely qualifies as a Studio Game and falls OUTSIDE self-serve rights** — requiring an **Enterprise plan/quote**. Lower tiers can also require a **"Created in collaboration with ElevenLabs"** credit.
  - **Action for shipped music:** (1) get an **Enterprise quote**, OR (2) keep a strict single-platform footprint and re-read the carve-out *with counsel*, OR (3) use Eleven Music **only as prototype/temp-track** and source final music elsewhere. **SFX and voice ship from a self-serve Pro plan with no issue.**
- **Hard prohibitions (all plans, all audio):** do **NOT** ship audio as **standalone files / sample packs / sound libraries** (in-game embedded use only); do **NOT** distribute generated music to streaming platforms (Spotify/Apple Music) even as a separate soundtrack; **Beta Services are carved out** of the commercial license — avoid beta models where you need guaranteed rights.
- **Voice-likeness caveat:** cloning any real person (incl. team members) needs documented consent under 12+ US state likeness laws (CA §3344, NY §50-51, TN ELVIS Act); the **Iconic Voice Marketplace** needs separate per-rights-holder licensing — **avoid for an indie title.** Our cast is **designed** (Voice Design), which sidesteps this.
- **Terms are versioned & fast-moving (2026):** record generation dates/prompts and **re-confirm the live Music Commercial Rights table + pricing before launch.**

---

## 18. Integration Change-Log — Audio/Story Ripple Edits (✅ applied)

*These cross-section edits from the audio/story pass have already been **woven into §3, §5, §10–§14, and §11** above; this list is kept as a record of what moved.*

- **§3 Tech Stack — Audio row:** expand to "**Howler.js** (audio sprites + Spatial/HRTF) **over a thin custom Web Audio graph** (stem mixer, buses, ducking, sample-accurate scheduling); Opus-in-WebM + MP3 fallback. **All SFX/music/voice generated with ElevenLabs.**"
- **§5 Visual Plan:** add a one-line cross-ref that the locked bright look is intentionally paired with **horror-via-audio (§15/§17)** — visuals never desaturate to sell dread; reserve only a *small* lighting-accent dread vocabulary (tunnel swallow, intercom flicker, heartbeat-synced alien glow).
- **§10 Asset Pipeline:** in the sourcing table, split the audio row into **SFX/Voice (ElevenLabs PAID — clean, embed-only)** vs **Music (ElevenLabs prototype-only; Enterprise quote or source elsewhere for ship)**; add the **standalone-distribution ban** note. Expand the **MVP asset list** from "~25–40 audio cues" to a real audio/VO bank: **~300 SFX (×3 variations), ~150–220 VO lines (Conductor + 2 survivors + enemy vocals), ~15 music cues/loopable stems** — all curated/normalized/loop-edited in a DAW (LUFS-normalize, trim, zero-crossing loop points, PA/radio + horror processing, ffmpeg → webm/opus + mp3). Add a manifest step feeding Howler sprite maps.
- **§11 Project Structure:** the existing `src/audio/` grows to hold the **stem mixer, bus graph, ducking, positional-tell system, bark cooldown/priority queue**; add `gameplay/director/` hooks that drive audio intensity; add `tools/` scripts for **batch ElevenLabs generation (CSV → API → ffmpeg → manifest)**.
- **§12 Roadmap — add an audio/VO/story track:**
  - **M0:** placeholder SFX + the train rumble bed + low-health heartbeat (prove the audio-first dread verb early); 1 weapon SFX with variations.
  - **M1:** the **adaptive music engine** (vertical L0–L3 + tunnel/daylight swap), ducking buses, first Conductor VO pass (Mode A), positional boarding-tells with visual redundancy — part of the "is this premium?" gate.
  - **M2:** full Director-driven music (L4 + Build-Up/Peak/Relax), the **complete bark library + 3-mode Conductor arc**, enemy sound-tell set, low-health/stinger system, **Black Box lore unlocks**, intro cinematic; finalize SFX bank.
  - **M3 (co-op):** **host-authoritative sound-tell sync**, shared-vs-local audio split, survivor cross-talk barks.
  - **M4:** localization (Dubbing), seasonal VO drops, mobile audio-tier hardening; **finalize music licensing (Enterprise quote or replacement).**
- **§13 Top Risks — add rows:** (a) **AI-music adaptivity gap** — text-to-music yields material, not an adaptive system; *Med/High* — author the engine ourselves, conform/loop-edit stems. (b) **Music licensing-tier dependency** (Studio Game carve-out) — *Med/High* — Enterprise quote or non-ElevenLabs music for ship; gate before launch. (c) **Audio main-thread/voice-count budget on mobile** — *Med/Med* — 10–15 Hz panner updates, drop stems, graceful degradation, iOS test. (d) **Tonal-whiplash / horror overpowers fun** — *Med/High* — 80/20 mix, frequent comedy barks, tunable dread + softening toggle, aggressive playtest. (e) **VO repetition + bark spam** — *Med/Med* — large tagged bark set, cooldown/priority queue. (f) **Sub-bass inaudible on laptop/phone speakers** — *Med/Low* — layer audible mid-bass; never rely on true sub. (g) **Generation cost/non-determinism + loop seams** — *Med/Med* — curate a fixed normalized asset set, budget credits.
- **§14 Open Decisions:** note the **music-licensing fork** (Enterprise vs single-platform vs source-music-elsewhere) as a new resolve-before-launch decision tied to distribution footprint.
- **Appendix:** the ElevenLabs/audio/story sources below are added (deduped) to the master source list.

## 19. Phase 0 — Visual Quality Slice (BUILD THIS FIRST)

**Why this exists.** Before a single gameplay system is built, the user wants to *see* whether the "best 3D in a browser" bar is met. Phase 0 is a **look-dev showcase** — not a game — that answers one question: *"Does this look premium enough to commit to full production?"* It produces the artifact the go/no-go decision is made on. It sits **before M0** in the roadmap (a new Phase 0; see §12 re-sequence in §21). The hard, repeated caveat: **a pretty slice proves FIDELITY, not FUN** — so every asset and module here is built reusable, and the slice is immediately followed by the M0 grey-box fun test *in this same shell* (§19.G).

**App shape.** A standalone Vite + TypeScript + React Three Fiber app (`apps/lookdev/`, §21) on the locked render stack (Three.js r180+ `WebGPURenderer` with automatic WebGL2 fallback), with **no Rapier, no PlayroomKit, no gameplay**. It deliberately *reuses the production `src/engine/renderer/` and `src/engine/post/` config* so a PASS de-risks the real pipeline rather than throwing away work. Two scenes selectable from a debug menu, sharing **one renderer, one post stack, one HDRI/IBL, and one quality-tier system**.

### 19.A Scene composition

**(A) Exterior hero shot — the orbit/beauty pass.** A hero **locomotive + 2–3 carriages** (one passenger car matching the §19.A interior, one boxcar/flatcar for silhouette variety, plus the loco) on a single straight rail segment with sleepers + ballast. The train sits at world origin and **the world translates toward it** — a dry-run of the locked §6 "static train, recycled chunks" technique on its simplest case: a `LevelGenerator` recycles ~6–10 ground/biome chunks and a sparse prop set (telegraph poles, sign posts, fences, distant Sunnyvale-suburb silhouettes, a tunnel mouth) from a **pre-warmed pool**. Speed is sold by layering cheap cues, *not* blur alone: (1) world translation at the train's velocity, (2) **camera-velocity motion blur** keyed to the orbit/world delta, (3) **near-field passing props** (poles whipping through frame — parallax sells speed more than blur), (4) wheel-spin + subtle vertical bob, (5) optional ground-fog streaks.

**(B) Interior carriage — the playable-scale fight space.** ONE passenger-car interior at **true gameplay scale**: floor, two wall variants with **windows on both sides** (the core of the slice — through them the *same* streaming world rushes by, so interior and exterior share the world sim), ceiling with light fixtures, seats/poles/luggage racks/debris, and a connector door at each end (the boarding-point fiction). A **Synty-proportioned (~1.8m) capsule/blockmesh player stand-in** establishes scale and is the future grey-box player anchor. The hero atmosphere beat lives here: **volumetric light shafts raking through the windows**, sweeping as the (faked) sun angle changes with train heading — the highest wow-per-risk effect.

The "scary ears, cute eyes" rule (§15) holds throughout: bright and saturated; dread is reserved for audio and a tiny lighting-accent vocabulary (a tunnel-swallow darkening, an alien-glow rim).

### 19.B The look-dev recipe (Three.js r180+ / R3F / WebGPURenderer)

**Renderer.** `import { WebGPURenderer } from 'three/webgpu'` — production-ready since r171, with **automatic WebGL2 fallback**, no separate code path for the base scene. Probe `renderer.backend.isWebGPUBackend` (or a capability check) and surface the live backend to the HUD.

**Post stack — WebGPU/TSL path (the premium register).** Use the node-based `PostProcessing`/`RenderPipeline` (the forward-looking replacement for the WebGL-only `EffectComposer`, which does **not** run on `WebGPURenderer`): `pass(scene, camera)` emitting color+depth+normal+velocity via `mrt()`, then chain → **GTAO** (`import { ao } from 'three/addons/tsl/display/GTAONode.js'`; tune `radius`/`samples`/`distanceFallOff`, `useTemporalFiltering` with TRAA) → **selective bloom** on emissive only (muzzle / alien-glow / intercom above 1.0) → **camera-velocity motion blur** (velocity buffer) → **TRAA** → **LUT color grade** → **vignette + subtle chromatic aberration + film grain**. Known worst case (already flagged in §5): TRAA + motion blur + a fast train is the peak ghosting scenario — tune velocity buffers carefully or train edges / speed lines smear.

**Post stack — WebGL2 fallback path (a genuinely separate code path).** pmndrs/postprocessing is **WebGLRenderer/EffectComposer-only** (v6.39.x), so this is real, separate code: `BloomEffect` (selective via layers), SSAO, SMAA, LUT, vignette, noise; SSGI/motion-blur from `0beqz/realism-effects` where budget allows. Volumetrics/SSR **off by default** here. Phase 0 must exercise **both** paths so the maintenance cost (and the fallback's materially lower ceiling) is visible *now*, not at M1.

**Lighting.** **Bake the static carriage** lightmap + AO + bounce GI in Blender, packed into the GLB (photoreal soft shadows/GI at ~zero runtime). **CSM sun** drives the moving exterior world (`CSMShadowNode` on WebGPU; CSM addon on WebGL2), 2–3 cascades tight to the train. Primary ambient/reflections come from the one **HDRI/IBL** (a bright partly-cloudy Poly Haven CC0 sky used as both skybox and IBL, with the CSM sun keyed to the HDRI sun direction).

**Materials (vibrant-cartoon stylized-PBR).** `MeshStandardMaterial`/`MeshPhysicalMaterial` on a small hero set (loco clearcoat metal, window transmission glass); standard/toon/baked-unlit elsewhere; normal maps everywhere to fake detail on low-poly. KTX2/Basis textures. "Premium" *in this bright register* comes from **value contrast + clean baked GI + crisp emissive bloom + one strong hero VFX** — not from grime.

**1–2 hero VFX.** (1) **Volumetric god-rays through the windows** (raymarched/froxel in TSL on WebGPU; screen-space god-rays + exponential height fog as the WebGL2 cheap path). (2) **Sparks/dust motes** drifting in the shafts (WebGPU compute particles; a capped sprite pool on fallback).

### 19.C Showcase Mode

- **Orbit / turntable camera** (exterior hero) — auto-rotate + drag, with framing presets (¾ front, low-angle, side-profile pan).
- **Free-fly + walk camera** (interior) — WASD/pointer-lock fly, plus a constrained eye-height "walk" so the user reads gameplay scale directly.
- **Photo mode** — toggle each effect independently (bloom / GTAO / motion blur / TRAA / god-rays / grain / CA), a time-of-day slider (sun angle + HDRI rotation/exposure), FOV slider, pause-world, and hide-HUD for clean capture.
- **Perf HUD** — FPS, frame time (ms), draw calls + triangles from `renderer.info.render`, geometries/textures from `renderer.info.memory`, and the **active backend (WebGPU vs WebGL2)**. *Grounded tooling note:* **stats-gl is no longer WebGPU-compatible as of r181** (deprecation errors on removed async methods); build a **custom lightweight HUD reading `renderer.info`** (works on both backends) and wire the **WebGPU/Three Inspector's GPU-timestamp feature** for precise per-pass timing on WebGPU. On WebGL2, GPU-timestamp precision is limited — rely on rAF frame-time + `renderer.info` there.
- **Quality-tier + backend switch** — High (WebGPU, full post, volumetrics, high shadow res) vs Mobile (30fps tier: render-scale 0.5–0.7 + upscale, post trimmed to bloom+SMAA+LUT, volumetrics off, shadows low) **plus a manual WebGPU/WebGL2 force toggle**, so the user can A/B all four combinations live on their own device.

### 19.D Validation & acceptance criteria

**Objective gates (measured, from §6 budgets):**
- **60fps desktop** (16.6ms) on a mid GPU; **30fps mobile** (33ms) sustained for **~60s including a thermal check** (a short desktop demo will *falsely* pass — thermal throttle (60→~20fps within ~30s, §6) only shows under sustained mobile load).
- **Draw calls** within the flat budget (<100 desktop target; the exterior here is simple, so expect far fewer).
- **Initial compressed download** < a slice-scoped fraction of the 25MB game budget → **target < ~8–10MB for the slice**; cold load-to-first-frame time logged.
- **WebGPU is not a naive regression** — benchmark per scene to confirm WebGPU isn't 2–4× slower than WebGL2 (the trap if instancing/compute aren't exploited; §13).
- **`renderer.info` stays FLAT while the world recycles** — a climbing count = a pooling leak (the exact bug class the real game must avoid).

**Subjective "does this hit the bar?" checklist (this GATES production):**
1. Does the exterior hero shot make you want to **share** it?
2. Does the interior read as a place you'd want to **fight** in?
3. Do the windows + god-rays + passing world **sell speed and "premium"**?
4. Is it unmistakably the bright **Fortnite/Crossy-Road register**, not muddy?
5. Does the **WebGL2 fallback** still look good enough to ship to non-WebGPU users (judged as a real shippable tier, not an afterthought)?
6. Does the **mobile tier hold 30fps** without looking broken?
7. Is emissive **bloom crisp, not blown out**; **no TRAA/motion-blur ghost-smear** on the train?

**Capture / share for the decision.** Photo-mode 4K screenshots (front / side / interior), a 10–15s orbit clip + a 10–15s interior walk clip (canvas capture → MP4), and a side-by-side WebGPU-vs-WebGL2 still. Host the build on **Cloudflare Pages** (locked hosting) so the user can open it on their own devices.

### 19.E Minimal asset list (just this slice)

- **1 train kit** — loco + passenger car + 1 boxcar/flatcar, modular (Synty "stylized train/railway" kit is the cohesion target; verify EULA, **ship baked/compiled GLB only — never raw .blend/.fbx**). ~6–10 pieces.
- **1 interior carriage** — the same passenger car dressed: seats, poles, racks, lights, debris, 2 window walls, 2 connector doors (kit + Kenney/Quaternius CC0 props).
- **Biome/ground + props** — 1 tiling ground material (Poly Haven/AmbientCG CC0) + ~6 Kenney/Quaternius CC0 props (poles, signs, fences, tunnel mouth, distant houses).
- **1 HDRI** (Poly Haven CC0 bright sky — sky + IBL), **1 LUT**, **1 baked lightmap** for the carriage, **1 hero VFX set** (god-ray volume + spark/dust particles).
- **Player stand-in** — Synty-proportioned capsule/blockmesh (no rig needed yet).
- **Only required spend:** one Synty kit. Everything else CC0.

### 19.F Effort estimate

**~3–4.5 focused weeks, 1–2 people:** ≈1 wk train/interior modeling + bake · ≈1 wk renderer/post/tiers/dual-path · ≈0.5 wk world-recycler + god-rays · ≈0.5–1 wk showcase shell / HUD / photo mode · ≈0.5 wk perf tuning + capture.

### 19.G Reusability mandate & the honest caveat (the key tradeoff)

A pretty slice does **NOT** validate that the GAME is fun — it validates fidelity only. So build for **drop-in**: train-local origin; named sockets/anchors (boarding points, weapon mount, camera rig, light-fixture slots); the carriage as a prefab with a clear playable volume; the world-recycler as the real `LevelGenerator` seed. Then **M0 grey-box (player controller, one weapon, dummy enemies) drops into this exact interior with zero re-art.**

State it explicitly at the gate: **"look bar PASSED → the next milestone (M0) validates FUN in this same shell."** Leave one audio hook in the interior (one ambience loop + one Conductor line slot) so the first assets from the §20 console can be auditioned *in-context* the moment they exist. Where this sits relative to the locked roadmap: **Phase 0 → M0 (grey-box fun test, reuses this environment) → M1 (vertical slice) → M2 (MVP) → M3 (co-op) → M4 (launch)**.

---

## 20. ElevenLabs Audio Admin Console

An **internal** tool — explicitly **NOT part of the game bundle** — that produces, stores, and manages **ALL** game audio (every SFX, music cue, and voice line per §17, generated via the ElevenLabs API per the locked all-ElevenLabs decision §14.7). The operator opens a categorized prompt catalog, clicks **Generate** on a row, the audio is generated through a server-side proxy, the result is **saved/stored**, and the console shows each generated asset with its **file size**, **when it was created**, **duration**, **cost**, and **inline playback**. This is how the entire audio bank gets made.

### 20.1 Architecture & the security requirement (NON-NEGOTIABLE: key server-side)

**The API key must NEVER reach the browser.** Per ElevenLabs' own authentication docs and key-management guidance, a key in any client-side bundle is *"for practical purposes, public"* — trivially extractable via DevTools / the network tab / source maps — and under ElevenLabs' Terms **you remain liable for 100% of usage and abuse under a leaked key**, even after it's stolen. "It's just an internal tool" does not change this: internal consoles are still served to browsers, and keys are account-wide billing credentials, not per-user RBAC tokens. Therefore: **the browser calls *our* backend; only the backend holds the `xi-api-key` and talks to `api.elevenlabs.io`.** The backend also owns what the browser can't safely do — writing blobs to storage, recording trustworthy **server-side `createdAt`**, and reading usage/credits. (For endpoints that support single-use tokens — e.g. realtime streaming — the backend may mint short-lived tokens instead of proxying; but a full admin console needs a proxy for the rest.)

**Recommended (production, fits the locked Cloudflare ecosystem):**
- **Cloudflare Pages + Pages Functions** host the React UI and the API (`functions/api/*`). The key lives as an **encrypted Worker secret** (`env.ELEVENLABS_API_KEY`), never bundled.
- **R2** stores the generated audio blobs (one object key per asset; no egress fees for repo/operator pulls). *Caveat:* a Worker has a **128 MB memory limit**, so **stream the ElevenLabs response straight into `R2.put()`** rather than buffering large WAV/music responses (OOM risk).
- **D1** (edge SQLite, up to 10 GB) stores Prompt + Generation/Asset rows — its relational queries (filter by category/status, join prompt→generations) fit the dashboard far better than KV.
- **Access control:** Cloudflare **Access** (Zero Trust) in front of the Pages app, gated to the team's emails (e.g. `assad.dar@gmail.com`), is the lowest-effort strong gate; or Worker basic-auth / a single shared token for the smallest setup.
- Long **ffmpeg export jobs do NOT belong in a Worker** (no native binaries, CPU-time + 128 MB limits) — run them locally or in CI (GitHub Actions) reading approved assets from R2. Design the pipeline as **two stages**, not one Worker.

**Simpler solo-dev local option:** Node/Express (or **Hono** — same handler code runs on both Workers and Node) + **filesystem** for blobs (`./assets/<category>/<slug>.<ext>`) + **SQLite** (better-sqlite3) for metadata; key in a gitignored `.env`. Zero cloud setup, instant ffmpeg + direct game-repo writes, works offline — but single-machine, no sharing, manual backups.

**The bridge between both:** define **one internal API contract** (`POST /api/prompts/:id/generate`, `GET /api/assets`, `POST /api/assets/:id/approve`, `POST /api/export`) and a `StorageAdapter` / `DbAdapter` interface. **Start local on day one, flip the adapter to R2/D1 when it must become a shared tool** — no UI rewrite. Using Hono lets the same routes run on Express-Node and Pages Functions unchanged. Redact the `xi-api-key` header in any logging/APM middleware so it never leaks into observability.

### 20.2 ElevenLabs API integration (verified, per audio type)

All endpoints are under `https://api.elevenlabs.io`, auth header `xi-api-key`, audio returned as **`application/octet-stream` binary** (default MP3).

- **SFX → `POST /v1/sound-generation`.** Body: `text` (required), `duration_seconds` (0.5–30; null = auto), `prompt_influence` (0–1, default 0.3 — ~0.7 literal / ~0.2 for variation spread), `loop` (boolean, **only on `eleven_text_to_sound_v2`** — exactly what ambience/heartbeat beds need), `model_id` (default `eleven_text_to_sound_v2`). `output_format` is a **query param**.
- **Music → `POST /v1/music`.** Body: `prompt` **XOR** `composition_plan`; `music_length_ms` (3000–600000, prompt-only); `model_id` (`music_v1` default | `music_v2`); `force_instrumental` (prompt-only); `seed` + `respect_sections_durations` (composition_plan-only); `store_for_inpainting`. `POST /v1/music/plan` builds a per-section composition plan and **costs no credits** (rate-limited). **Stems** are a separate endpoint returning a **ZIP** (`stem_variation_id` default `six_stems_v1`). **Inpainting is enterprise-gated.** Music runs ~**900 credits/min (~$0.15/min)**. *Per §17.6/§14.7 this is the licensing landmine* — see §20.6.
- **Voice → `POST /v1/text-to-speech/{voice_id}`.** Body: `text` (required), `model_id` (default `eleven_multilingual_v2`; also `eleven_v3` for expressive inline tags, `eleven_flash_v2_5` for low-latency), `voice_settings` { `stability` 0.5, `similarity_boost` 0.75, `style` 0, `use_speaker_boost` true }, `seed`. `output_format` query param (default `mp3_44100_128`). Enumerate models via `GET /v1/models`.
- **Voice Design → `POST /v1/text-to-voice/design`** (`voice_description`, `text` 100–1000 chars, `model_id`, `guidance_scale` default 5, `loudness`) returns `generated_voice_id` + base64 `previews[]`; persist a chosen preview to a permanent **voice_id** via `POST /v1/text-to-voice`, then **pin that voice_id** per character (§17.3) — never re-prompt the voice per line, or the Conductor/survivors drift across a 150–220-line bank.

**File size, created-at, cost — captured server-side (fact-checked):**
- **File size** is **client/server-computed, not an API field**: read `Content-Length` if present, but the authoritative value is `response.arrayBuffer().byteLength` (or bytes streamed to R2/disk), recorded by the backend at write time as `fileSize`.
- **Created-at** is **NOT in the API response** — set it **server-side** (`Date.now()` / `CURRENT_TIMESTAMP`) at write time (the HTTP `Date` header or local time only); never trust a client value.
- **Duration** comes from the request (`duration_seconds` / `music_length_ms`) and is verified post-export by **ffprobe**.
- **Cost** is tracked in **credits, not characters**: snapshot `character_count` from `GET /v1/user/subscription` **before and after** each call; the delta is that generation's credits → store as `credits` on the Asset and roll up per category/day. (`/v1/user/subscription` also returns `character_limit`, `next_character_count_reset_unix`, tier.)

### 20.3 Data model

**Prompt** (the catalog — authored once, holds ALL prompts):
`id` · `category` (weapons | enemies_vocals | train_ambience | ui | music | conductor_vo | survivor_barks | lore_tapes) · `type` (`sfx` | `music` | `voice`) · `title` · `slug` · `promptText` · `model` · `params` (JSON: duration_seconds, prompt_influence, loop, music_length_ms, voice_settings, output_format) · `voiceId` (voice rows) · `compositionPlan` (music, nullable JSON) · `expectedDurationSec` · `variationCount` · `tags[]` · `createdAt` · `updatedAt`.

**Generation / Asset** (many per Prompt — generate-many-and-curate):
`id` · `promptId` (FK) · `version` (auto-increment per prompt) · `variationLabel` ("A"/"B"…) · `storageKey`/`fileUrl` · `fileSize` (bytes) · `mimeType` · `durationSec` (ffprobe-verified) · `createdAt` (server) · `model` · `paramsSnapshot` (JSON — exact params, since output is non-deterministic) · `seed` (best-effort) · `credits` / `costUsd` · `status` (`generating` | `ready` | `failed` | `approved` | `rejected` | `archived`) · `lufs` (post-analysis) · `exportKeys` (webm/opus + mp3 after export) · `notes`.
**Exactly one `approved` per Prompt** feeds the export bank; everything else is kept for audit/A-B. Storing `promptText` + `paramsSnapshot` + `seed` + `createdAt` on every Asset makes any shipped sound **reproducible-by-storage** (since the API is not reproducible-by-seed).

### 20.4 Dashboard UI

- **Left rail:** the category tree (the banks in §20.7) + type/status/tag/voice filters + full-text **search** over title + promptText + tags.
- **Prompt table:** one row per Prompt → title, type badge, latest-version waveform thumbnail, **size**, **created-at**, **duration**, **cost**, status pill, and a **Generate** button with inline status (`idle → generating (spinner) → ready/failed`). Expand a row to see all generations/versions.
- **Inline player:** waveform (wavesurfer.js) + transport per asset; **A/B variation compare** two versions side-by-side with sync play; loop-preview toggle for ambience/heartbeat to audition seams.
- **Actions:** Generate · **Regenerate** (new version, optionally new seed — history kept, **never auto-overwrite**) · **Batch generate** (select N prompts → queued, concurrency-aware) · **Approve/Final** (marks the canonical asset, demotes the prior approved) · Reject/Archive · edit prompt+params then regenerate.
- **Cost widget:** live remaining credits (subscription endpoint) + spend-this-session + per-category rollup + a soft monthly cap that warns before batch runs.
- A small **review queue** to sweep failures/regens.

### 20.5 Storage + export pipeline (bridge to the game repo, §17/§11)

- **Files:** raw generations at `audio-raw/<category>/<slug>/v<version>.<ext>` (R2 or local mirror); the exported game-ready bank at `audio-export/`.
- **Naming:** `<category>__<slug>__v<version>` for raw; the **final bank uses stable `<category>/<slug>` (no version — the approved one wins)** so the manifest is deterministic.
- **Export step (off-Worker — CI/local):** pull all `approved` assets → **ffmpeg**: encode **`libopus` in WebM** (smallest, primary) **+ MP3** fallback for Safari edge cases; **EBU R128 LUFS-normalize** (`loudnorm`, two-pass) with per-bus targets (dialogue vs SFX vs music, matching the §17.5 bus graph); **loop-trim** ambience/heartbeat to zero-crossing seamless points (ffprobe + trim); then run **`audiosprite`** to pack short SFX into a **Howler sprite atlas** and emit the **sprite manifest** the game consumes (§17.5). Music stems stay as individual decoded loops, **not** sprited.
- **Bridge:** export writes the bank + manifest into `game/public/audio/` (or opens a PR), so the game's Howler loader picks them up — keeping the noisy raw generations *out* of the game repo entirely. This is the same `CSV → API → ffmpeg → manifest` `tools/` pipeline already noted in §11/§18, now driven by the console.

### 20.6 Ops

- **Rate limits / concurrency:** per-plan concurrency is Free 2 / Starter 3 / Creator 5 / **Pro 10** / Scale 15 / Business 15; `429 too_many_concurrent_requests` → **queue, don't blind-retry**. Batch generate runs a worker pool capped at (plan concurrency − 1) with exponential backoff. **Pro (~$99/mo)** is the practical API entry tier.
- **Cost budgeting:** per-asset credits via subscription-delta; dashboard rollups; a soft monthly cap warning before batch runs. **Music is the expensive line** (~$0.15/min) — generate it last and only after the license question resolves.
- **Non-determinism:** store `promptText` + full `paramsSnapshot` + `seed` + `createdAt` on every Asset (`seed` is best-effort, not guaranteed reproducible). Never auto-overwrite; always version + log so any shipped sound is traceable to exactly what produced it and the terms-version at generation time.
- **Music licensing gate (hard launch gate, §14.7/§17.6):** Eleven Music likely qualifies as a **"Studio Game"** (monetized, multi-platform), falling outside self-serve rights → an **Enterprise quote**. The console must **TAG every music asset "prototype/temp"** and **lock the `music` category rows behind a "license required" flag** — do **NOT** generate `mus.*` rows until the Enterprise license is confirmed in writing. SFX + voice are clean on a paid (Pro) plan and can be generated today. *(Terms are versioned/fast-moving in 2026 — re-verify the live Music Commercial Rights table, model_ids, and pricing before any production run and before launch.)*
- **Voice consistency:** pin one saved `voiceId` per character and regenerate every bark/mode from it; v3 inline tags are probabilistic (request 3 variations, audition, never auto-accept take 1); keep an `eleven_multilingual_v2` + DAW-processing fallback for Conductor Mode C if `eleven_v3` batch access is gated at production time.

### 20.7 Seed Prompt Catalog (console seed data)

The console launches pre-seeded with the **v1 catalog** below — **~150–162 catalog rows producing ~470–483 clips** for the RICH MVP (most rows request 3 variations). The full catalog is generated **as console seed data**; what follows is the category summary + realistic per-category counts + a handful of concrete example entries so the shape is tangible. **Generate in priority order so the Phase-0 slice is covered first if quota/time runs short:** Weapons + UI → Train ambience → Enemies → Voice → **Music (last, license-gated)**.

| Category | Catalog rows | ~Clips (incl. variations) | Model |
|---|---|---|---|
| Weapons SFX | ~16 | ~52 | `eleven_text_to_sound_v2` |
| Enemy vocals / tells / bosses | ~30 | ~100 | `eleven_text_to_sound_v2` |
| Train ambience | ~11 | ~28 | `eleven_text_to_sound_v2` |
| UI / juice | ~13 | ~36 | `eleven_text_to_sound_v2` |
| Music stems/cues *(LICENSE-GATED)* | ~11 | ~24 | `music_v2` |
| Voice — Conductor VO (3 modes), survivor barks, intro, lore tapes | ~81 | ~243 | `eleven_v3` |
| **TOTAL** | **~162** | **~483** | |

**Conventions:** SFX → `prompt_influence` 0.5–0.7 (raise toward 0.7 to hold "wrong/detuned/glassy" enemy descriptors, don't lengthen the prompt); `loop` ON only on bed/heartbeat rows (still expect a crossfade/zero-crossing edit). Voice → one pinned `voiceId` per character, inline tags, `stability` Natural (Creative for shouts/Mode C, Robust for "recording" lore tapes), 3 variations each. Tone rule (§15): weapons/UI = punchy candy-bright arcade; enemies/ambience/Conductor-drift = the scary layer.

**Example entries (concrete, abbreviated):**

```
# SFX — Weapons
{ id: "wpn.shotgun.fire",  type: "sfx",  model: "eleven_text_to_sound_v2",
  prompt: "Chunky cartoon pump-shotgun blast, deep thumpy low-end punch with a bright
           crack on top, fast snappy transient, short arcade tail, satisfying and meaty,
           dry, no reverb tail, no music.",
  params: { duration_seconds: 1.2, prompt_influence: 0.6, loop: false, variations: 4 } }

# SFX — Enemy tell (The Grown special)
{ id: "spec.screecher.near", type: "sfx", model: "eleven_text_to_sound_v2",
  prompt: "Piercing detuned alien screech right overhead, glassy ringing metallic
           overtones, synthetic and cold, close and threatening.",
  params: { duration_seconds: 1.0, prompt_influence: 0.7, loop: false, variations: 3 } }

# SFX — Train ambience (signature Conductor-going-wrong tell)
{ id: "intercom.chime.distorted", type: "sfx", model: "eleven_text_to_sound_v2",
  prompt: "A cheerful two-note train intercom chime but DECAYING — pitch sagging,
           bit-crushed, warbling wrong, last note bending downward sinister, unsettling.",
  params: { duration_seconds: 2.5, prompt_influence: 0.6, loop: false, variations: 4 } }

# VOICE — The Conductor, Mode C (broken/menacing), pinned voiceId
{ id: "cond.C.menace", type: "voice", model: "eleven_v3", voiceId: "<conductor_id>",
  prompt: "[distorted][low][slow] You were never leaving Sunnyvale. [sharp] None of you.
           [whispers] The train goes in a circle… and so do you.",
  params: { stability: "Creative", variations: 3 } }

# MUSIC — LICENSE-GATED, do NOT generate until Enterprise license confirmed
{ id: "mus.L2.action", type: "music", model: "music_v2", licenseLocked: true,
  prompt: "Adds full punchy drums + bass and propulsive synth arpeggios over a sparse
           A-minor bed, 128 BPM, arcade-action energy, instrumental, loopable.",
  params: { music_length_ms: 60000, force_instrumental: true, variations: 2 } }
```

*Honest production notes baked into the seed:* music_v2 does **not** return phase-perfect bar-locked loops or true separated stems — every `mus.*` asset needs a manual DAW conform/loop-edit pass (tempo-lock 128 BPM, trim to bar boundaries, level-match the L0–L4 vertical layers) before it works in the §17.2 mixer; the console only produces raw clips. Lean MVP would be roughly half this catalog (1 boss, 2 survivors, ~5 Conductor lines/mode); the **rich** decision (§14.5) roughly doubles the enemy + voice volume, which is where the count lives.

---

## 21. Integration Change-Log — Slice & Console Ripple Edits (✅ applied)

*Woven into §11, §12, §13 (and §14.5 / §14.7) above; kept as a record of what moved.*

- **§12 Roadmap — re-sequence:** insert **"Phase 0 — Visual Quality Slice" BEFORE M0** (new first step). Note that **M0 reuses Phase 0's environment** (the same interior carriage + world-recycler shell) — grey-box gameplay drops in with zero re-art — and that the Phase-0 gate explicitly hands off to M0 with *"look bar PASSED → M0 validates FUN in this same shell."* Mirror the new ordering in §14.5 (which already references the Phase-0 slice as a mitigation).
- **§11 Project Structure — additions:** add **`apps/lookdev/`** (the standalone Phase-0 R3F app, reusing `src/engine/renderer/` + `src/engine/post/`); add an **`apps/audio-console/`** (the admin-console React UI) + a **`server/` or `functions/api/` worker** (the key-holding proxy: Cloudflare Pages Functions/Hono in prod, Node/Express+SQLite locally) backed by **R2 + D1** (or filesystem + better-sqlite3); extend **`tools/`** with the export job (approved assets → ffmpeg → `loudnorm`/loop-trim → audiosprite → Howler manifest → `public/audio/`), kept off-Worker (CI/local).
- **§13 Top Risks — add rows:**
  - **Client-side API-key exposure** — *High/High* — key strictly server-side in a Worker/Pages-Function proxy (never in any bundle); redact the `xi-api-key` header in logs; least-privilege per-environment key with rotation. (Fact-check override: a browser-embedded key is effectively public and you're liable for all usage under it.)
  - **Admin-console scope creep** — *Med/Med* — it's an internal generate-store-curate tool, not a DAW; the conform/loop-edit/normalize pass stays in ffmpeg/CI, not the console.
  - **Pretty-slice-doesn't-prove-fun** — *Med/High* — build Phase 0 reusable; gate M0 on the grey-box fun test in the same shell (§19.G).
  - **ElevenLabs cost/credits for a rich catalog (~480 generations + re-rolls)** — *Med/Med* — subscription-delta cost tracking, soft budget cap, concurrency-aware queue, priority-order generation.
  - *(Already present:* all-music Enterprise/"Studio Game" license is a **hard launch gate**, §13/§17.6/§14.7 — the console enforces it by locking the `music` category until confirmed.)*
- **§14 Open Decisions — status pointer:** **§14.5 (rich MVP)** and **§14.7 (all-ElevenLabs audio)** are **RESOLVED**; this pass operationalizes both — rich MVP via the §20.7 catalog counts, all-ElevenLabs audio via the §20 console (with the music-license gate carried forward as the one remaining launch blocker).

---

---

## 22. Player-Sentiment Research & Plan Adjustments

> A producer-level gap analysis between what real player communities consistently reward/punish (across survivors-likes, co-op horde shooters, browser/.io games, horror, endless-runners, train/mashup niches, and AI-audio reception) and what §1–§21 already commit to. The research below has been filtered through its own fact-checks — **where a single source overstated a claim, the fact-check wins** and is called out. Vocal-minority signals are flagged as such; broad, well-evidenced sentiment is stated plainly. This section does **not** unilaterally churn locked decisions; it tightens what's at risk, surfaces blind spots, and frames the genuine forks as the user's call.

### 22.1 What players consistently LOVE (do more of)

Strongest signals first, distilled across all six research domains:

1. **The paced snowball power-fantasy.** The single most-praised thing in the entire survivors-like canon is the fragile→god arc, *delivered as a constant micro-reward cadence* (Vampire Survivors deliberately tunes a reward roughly every ~23s; kokutech: "barely lets you go a few seconds without something good"). This is the genre's dopamine engine, not a nice-to-have.
2. **Zero-friction instant play + one-link sharing.** The dominant browser-game finding ("instant load, no install, shareable link… dwarfs all other downsides") and the .io distribution moat. A 2-second link that drops a friend straight into a session, no signup, is the highest-leverage growth mechanic in the dataset (the agar.io lesson). Cross-domain, this is the most consistent "love" outside the core loop itself.
3. **A restraint-based AI Director (L4D model).** Beloved as "the product" of co-op horde games — tension through *throttling* the horde and engineering lulls ("it's quiet, too quiet"), keyed to player stress, with telegraphed escalation. Repeatedly the gold-standard quality signal.
4. **Reliable, distance-encoded audio sound-tells as both horror and tactical UI.** "Your ears are your worst enemy" — distinct per-enemy cues heard *before* the threat is seen (strings=far, piano=near). Validated as the highest-leverage lane for an audio-horror game.
5. **Short, decisive runs with instant restart (the "one more run" loop).** 90–180s sits squarely in the proven Brotato/20MTD "short and sweet" sweet spot; players explicitly praise runs that don't overstay their welcome.
6. **Builds that are real DECISIONS with identity and synergy.** Brotato (96% positive) is the gold standard — characters/weapons that change *what you do*, with visible synergies/evolutions and "god run" discovery moments.
7. **Quest/achievement-driven meta-progression that banks every run.** Halls of Torment's loved model: progress through play, not RNG gear grind; an unlucky run still banks something.
8. **Cosmetics-only monetization + opt-in rewarded ads.** Players *actively reward* this (Crossy Road, DRG, Helldivers) and will spend to support devs when money can't buy advantage. Rewarded ads are even *valued* for the control they give.
9. **Cute visuals that AMPLIFY (not dilute) horror via tonal contrast.** Cult of the Lamb dev, Little Nightmares, FNAF/Poppy mascot-horror, RE4's "tonal whiplash" — the cute coat makes the dread land harder *and* doubles as merch/clip-bait. Directly validates "cute eyes, scary ears."
10. **Train settings + zombie-mutates-into-worse-thing.** Train levels read as inherently thrilling; a live 2025–26 train-roguelite wave (Fright Train 89%, Battle Train 85%, Endless Rails) shows the premise is fresh, not gimmicky. Mutating enemies (L4D specials, Las Plagas, headcrabs) are a beloved, expectation-matching pattern.
11. **Per-run emergent variety = shareable clips.** Games that produce a different moment every round generate endless TikTok/Shorts content — the modern viral engine. The AI Director is exactly such a generator.
12. **Daily seed + friends leaderboards.** Same-seed-for-everyone fair competition (Slay the Spire/Spelunky/Isaac) drives return visits; friends boards beat raw global boards for motivation.

### 22.2 What players consistently HATE (avoid / mitigate)

Recurring quit-reasons and backlash triggers, strongest first:

1. **Late-run performance collapse.** The genre-defining deal-breaker — Soulstone's FPS crashing 144→30 under entity/AoE/projectile spam. *Existential* for a high-fidelity **3D browser** survivors-like.
2. **Forced/interstitial ads** (an ad on every death/reload, 15–30s, sound-on, mid-action). The #1 instant-uninstall trigger in platform web games (CrazyGames/Krunker churn). NOTE (fact-check): players are *not* anti-ad — the entire web-games economy is ad-funded and thriving; they reject *intrusive ad UX*, not advertising.
3. **Slow loads / featureless white screens.** ~53% of mobile users abandon past 3s; even beloved games lose players to a no-progress loading screen read as "broken."
4. **Pay-to-win / power monetization.** The most universal hatred ("less like a game, more like a store") — review-bomb-level backlash (Helldivers nerfs, B4B grind). Energy timers and FOMO time-limited passes are close behind.
5. **A punishing/random AI Director.** B4B's "headbutting the more-monsters button" — special spam and unavoidable wipes that feel arbitrary, not earned. The #1 reason an AI-Director game fails.
6. **Unreliable or silent sound-tells** — Darktide disablers that "whisper" and get buried under music, KF2 hordes with "zero audio cues." Fatal for an audio-first design.
7. **P2P connection friction** — "host migration failed," NAT/CGNAT failures on a meaningful share of networks, "we couldn't connect." NOTE (fact-check): this is a real, recurring *vocal-minority friction tax*, NOT an automatic reputation-killer — top P2P co-op hits (PEAK 95%, R.E.P.O. 96%, Lethal Company 97%) stay Overwhelmingly Positive despite the grumbling. It hurts most when the *backend itself fails at launch* or there's no fallback.
8. **Autopilot/shallow build choices.** Declined options that trivially reappear (no opportunity cost), "two-node" upgrade trees that feel like "grabbing random stuff."
9. **Grindy/RNG-gated meta-progression** OR unlocks that force taking *weaker* builds (Death Must Die, DRG:Survivor). A run that banks nothing on a bad night kills "one more run."
10. **Clone-feel / sameness fatigue.** Saturation is the top long-term fatigue driver; "no class feels different." NOTE (fact-check): "grindy meta-progression is the #1 quit reason" is **overstated** — the real primary churn driver for survivors-likes is **novelty decay + thin content cadence**, with meta-progression a polarizing second-order factor.
11. **Manual-fire fatigue / nauseating mobile controls.** 20MTD's "finger cramping" from mandatory fire; over-sensitive cameras and move-vs-zoom gesture conflicts causing motion sickness.
12. **Cheated leaderboards.** Visibly-faked top scores collapse score-chasing motivation; client-authoritative scores are trivially forged.
13. **AI-generated VOICE specifically** (the true flashpoint — see §22.5). NOTE (fact-check): AI *music* and *SFX* are far less scrutinized; the backlash concentrates on AI **voice acting** in high-profile **paid/AAA** titles, not on free indie/web games.
14. **Power-fantasy that "kills the horror."** Abundant ammo/easy kills turns horror into a shooter (RE5/6 backlash). NOTE (fact-check): the realistic ceiling for an action-survivors loop is *tension/unease*, **not dread** — don't promise "scary."
15. **Tonal confusion / "cute that forgot to be scary."** Cute-creepy fails when the dread is underpowered and the cuteness dominates.

### 22.3 Gap analysis vs our plan

**(a) ALREADY NAILED — the plan already aligns with strong player sentiment:**

- **Short 90–180s runs + sub-3s restart + scrap-never-lost** (§1, §8) → directly in the proven "short and sweet / one more run" sweet spot, and §8's "never a zero-progress run" pre-empts the most-hated meta-progression failure.
- **L4D-style restraint Director** (§8, §9, §16.7) — Build-Up→Peak→**Relax**, per-player Intensity, mercy moves, spawn-off-screen. This is *textbook* the loved model and explicitly rejects the B4B spam failure.
- **Reliable, distance-encoded, host-authoritative sound-tells with visual+haptic redundancy** (§17.1) — answers the Darktide/KF2 "silent/buried tell" failure *and* the accessibility critique head-on. Among the strongest alignments in the plan.
- **Cute eyes / scary ears via tonal contrast** (§5, §15, §16) — squarely the validated cute-amplifies-horror finding, with an explicit 80/20 mix and a softening toggle.
- **One-click invite link + auto-clip + daily seed + friends leaderboards** (§1, §8) — the exact viral primitives the browser/.io and endless-runner research credits most.
- **Cosmetics-only + opt-in rewarded ads, no energy gates, no loot boxes** (§8) — precisely the "loved" monetization column.
- **TURN as mandatory, not optional** (§2, §7, §13) — the plan already treats the ~15–20% NAT-failure tax as a hard requirement.
- **Performance discipline as a first-class pillar** (§6) — instancing/VAT/pooling/adaptive-quality directly target the genre's #1 deal-breaker.
- **Unified Bloom (Risen→Grown) as one legible organism** (§16.2) — answers both "zombie fatigue is about mechanical sameness" and "mashups must be cohesive."
- **Train-on-rails + AI Director as named marketable pillars** (§1, §16) — on-trend and differentiating; the rails constraint is a *defense* against the hated "red-circle circle-strafing" failure mode.

**(b) AT RISK — the plan does it, but players are picky; tighten:**

- **Reward cadence inside a 90–180s run** (§8). The plan has level-ups and scrap but does **not** specify the ~15–25s micro-reward beat. Because our runs are *very short*, we must front-load the snowball *faster* than VS — there is no room for VS's "20 minutes of circling before it gets good" dead zone. → Tighten §8 to a target reward cadence.
- **Build decisions vs autopilot** (§8 loadout). The pre-run pick is good and §8 already wants 5-word-nameable picks, but the in-run 1-of-3 level-up does not state **opportunity cost** (declined options should not trivially reappear) or guaranteed visible synergies. Shallow level-ups read as "random grabbing." → Tighten §8.
- **Web performance under our *specific* harder constraint** (§6). §6 is strong, but the research raises **iOS Safari/iPad WebGL crashing-and-rebooting past ~256MB** as a named, separate risk that §6's mobile tier mentions only as a throttle issue, not a *crash* class. → Add an explicit iOS memory-crash guard to §6/§13.
- **Free-aim without an auto-fire/strong-aim-assist default** (§9). §9 has magnetic aim assist (good) but the core verb is "free-aim shooter"; 20MTD's manual-fire finger-cramp is a real accessibility tax, doubly so on mobile. → Make auto-fire-toward-nearest (with manual override) an explicit default, not just assist.
- **Leaderboard integrity** (§7, §13). The plan correctly calls leaderboards "for fun" but a *visibly* cheated board still kills motivation. → Lean harder on daily-seed + friends boards and sanity-clamping, and say so.
- **The horror claim's honesty** (§15). The fact-check is blunt: an action-survivors power-fantasy loop + horror audio reads as **tense/spooky-fun, not genuinely scary** — and audio alone won't change that. §15's "spooky-fun / grin-with-a-shiver" framing is *already* well-calibrated, but any internal/marketing language that promises "scary" or "survival-horror" is at risk. → Lock the framing to "horror-flavored / tense," not "scary."
- **Content cadence / novelty decay** (§16.5 seasons). The corrected #1 long-term churn driver is novelty decay + thin content cadence. The seasonal plan is the right instrument, but the *between-season* per-run variance (Director variety, named-swarm seeds) must be the retention engine, not raw enemy volume. → Reinforce in §8/§16.

**(c) BLIND SPOTS — players care, the plan is currently silent or thin:**

- **Auto-fire as a first-class option** — see above; the plan implies manual free-aim is default. (§9)
- **In-game co-op pings / lightweight comms** — VS online shipped *without* voice/text chat and players noticed; "host-yourself" P2P is exactly where comms gaps hurt. The plan has survivor cross-talk *barks* (§16.4) but no **player-driven ping/marker** for "threat here / help / look." (§7, §9)
- **Graceful partner-drop = keep playing solo + instant rejoin.** §7 commits to "host left → end run," which is fine, but is silent on the *non-host* partner dropping mid-run. The co-op research is explicit that a disconnect ending the run *for both* is a churn event. → Add "partner dropped → surviving player auto-continues solo; quick rejoin." (§7)
- **An explicit anti-AI-comment / disclosure community line.** The plan handles the *legal/licensing* side thoroughly (§17.6) but is silent on the **community-perception playbook** (the inevitable "this uses AI" top comment, false-accusation review-bombing). (§17, new in §22.5)
- **A "quick start / default loadout" path** that gets a returning player into a run in *seconds* — the B4B lesson is that pre-run menu friction breaks the L4D flow. §8's 10–20s lobby is fine, but a one-tap "same as last run / recommended" skip is not specified. (§8)
- **Mobile load-progress UX** — §6 budgets load *time* but the research is emphatic that a featureless white screen reads as "broken." A real streaming progress state is not called out. (§6/§10)

### 22.4 Recommended changes

Prioritized. Tags: **[APPLY — additive/low-risk]** = safe to weave in now; **[DECISION NEEDED — touches a locked choice]** = surface to the user before changing. *(Both [DECISION NEEDED] rows — #2 auto-fire and #13 hero-voice — are now RESOLVED in §22.6: manual free-aim kept as default with an optional auto-fire toggle; voice stays pure all-ElevenLabs.)*

| # | Change | Why (player evidence) | Plan section | Tag |
|---|---|---|---|---|
| 1 | **Specify a ~15–25s micro-reward cadence** inside every run; front-load the snowball so a full fragile→god arc fits 90–180s (XP/level/scrap/pickup beats spaced like VS's ~23s, not minutes of empty kiting). | VS's tuned ~23s reward beat is the genre's dopamine engine; the #1 complaint about *longer* runs is the "circle for 20 min before it gets good" dead zone — fatal in a short run. | §8 (loop, scoring) | [APPLY — additive/low-risk] |
| 2 | **Default to auto-fire-toward-nearest, with manual free-aim override** (and a clear toggle). Don't ship manual-fire-only. | 20MTD manual-fire "finger cramping" is a real accessibility tax, worse on our mobile-capable target; auto-fire is the genre's expected accessibility default. | §9 (combat/input) | [RESOLVED → declined as default; manual free-aim kept, auto-fire offered as an OPTIONAL toggle (§22.6 #1)] |
| 3 | **Give in-run level-up choices real opportunity cost** (declined options don't trivially reappear; reroll is a deliberate item) and guarantee at least one **visible synergy/evolution** per weapon. | "Autopilot"/"two-node" upgrades read as "grabbing random stuff"; Brotato/Death Must Die synergy + opportunity cost is the loved model. | §8 (loadout/level-up) | [APPLY — additive/low-risk] |
| 4 | **Add an explicit iOS-Safari/iPad memory-crash guard** (hard texture/VRAM cap, low-fi mobile asset path, WebKit detection, real-device crash testing) as a *named* risk, distinct from thermal throttle. | High-fidelity browser WebGL has been observed *crashing and rebooting* iPads past ~256MB; WebKit is mandated on iOS so it hits all iOS browsers. | §6, §13 | [APPLY — additive/low-risk] |
| 5 | **Add lightweight player-driven co-op pings/markers** ("threat / help / look here") on top of survivor barks. | VS online shipping without comms was noticed; host-yourself P2P co-op is where comms gaps surface; pings are cheap, language-free, and feed shareable moments. | §7, §9 | [APPLY — additive/low-risk] |
| 6 | **Handle non-host partner drop gracefully**: surviving player auto-continues solo + offers instant rejoin (keep "host-left → end run" for the host case). | A disconnect ending the run for *both* players is a documented churn event; graceful partner-drop is repeatedly cited as the fix. | §7 | [APPLY — additive/low-risk] |
| 7 | **Ship a one-tap "Quick Start" (last/recommended loadout)** that skips the picker for returning players. | B4B's pre-run deck "menu management" broke the L4D pick-up-and-play flow players crave; default-loadout quick-start preserves it. | §8 | [APPLY — additive/low-risk] |
| 8 | **Guarantee a real streaming load-progress UI** (never a featureless white screen) and treat sub-3s first-play as a tracked KPI. | ~53% mobile abandon >3s; even *loved* games lose players to a no-progress white screen read as "broken." | §6, §10 | [APPLY — additive/low-risk] |
| 9 | **Lock leaderboard framing to daily-seed + friends-first**, with server-side sanity-clamping; de-emphasize a raw global board. | Visibly cheated global boards collapse score-chasing; friends/daily-seed boards are both more motivating and less cheat-sensitive. | §7, §8, §13 | [APPLY — additive/low-risk] |
| 10 | **Adopt an honest tone label** everywhere internal/marketing: "horror-flavored / tense / spooky-fun," never "scary"/"survival-horror." | Fact-check: an action power-fantasy loop + horror audio reads as tension, not dread; promising "scary" invites the RE5/6 "not horror" critique (a broad, not fringe, take). | §1, §15, §16 | [APPLY — additive/low-risk] (§15 already largely aligned) |
| 11 | **Codify per-run variety (Director variety + named-swarm seeds) as the primary retention engine** between seasonal content drops. | Corrected #1 long-term churn driver is novelty decay + thin content cadence — not grind; per-run variance is the antidote. | §8, §16.5 | [APPLY — additive/low-risk] |
| 12 | **Add a community-perception playbook for AI audio** (pre-empt the "this uses AI" comment; "AI audio = the game stays free" framing; expect false-accusation bombing). | AI-audio stigma is real but concentrated on voice/paid/AAA; a transparent, jobs-respecting line materially softens reception. | §17, §22.5 | [APPLY — additive/low-risk] |
| 13 | **Revisit the all-ElevenLabs lock for hero VOICE** (the Conductor) — consider human/hybrid or *intentionally-synthetic* framing (see §22.5). | AI **voice** is the single most-rejected AI-audio category (~85% "never"); it's our *entire* horror payload's narrator. Music/SFX are far safer. | §14.7, §15, §17 | [RESOLVED → kept pure all-ElevenLabs voice, no special framing; B/C/D available later if data warrants (§22.6 #2)] |

### 22.5 The AI-audio question (honest, decision-critical)

**The real community reception (respecting the fact-checks).** Stated sentiment toward gen-AI in games is loud and negative and *hardening* (Quantic Foundry's opt-in poll: 85% negative). But that is the *loud* number. The fact-checks are explicit that this **overstates the behavioral reality for our specific context**:

- A representative survey (MIDiA, n=6,300) found ~**60% neutral** ("I'll buy if the game is good"), ~20% positive, ~19% negative — and attributed most loud negativity to **industry tastemakers** (devs/influencers/journalists), not the average player.
- The measurable Steam review-suppression (~53% fewer reviews) **falls hardest on established/paid/AAA developers with a fanbase to lose** — and is "minimal" for small/free/low-visibility indie/web projects, which are "more likely to be ignored than review-bombed."
- The backlash is overwhelmingly about **AI VOICE acting and AI art in paid/AAA titles** (Arc Raiders, Fortnite's AI Vader, Black Ops 7). **AI music is barely evidenced as a flashpoint, and AI SFX almost not at all.**

**What this means for our all-ElevenLabs lock.** Our risk is **not uniform across the audio layers** — it is concentrated almost entirely in **voice**:
- **SFX** (the bulk of §17): tolerated-to-invisible. No meaningful risk. Keep as-is.
- **Music** (already license-gated, §17.6): low *reception* risk; the real issue is the **commercial license** (Studio Game / Enterprise), already a hard launch gate. Keep as-is.
- **VOICE** (the Conductor + survivor barks): the genuine exposure. AI voice is the single most-rejected category (~85% "never use"), and in our design **voice is the narrator of the entire horror payload** — an uncanny/flat read is doubly damaging because the horror *rests on it*.

Crucially, our context is the **safest possible** one for disclosed AI audio: **free, browser, no purchase to refund, low craft-expectations, voice-light, and shippable off-Steam (web/itch) where the disclosure penalty is lowest.** The decision is *survivable as-is*. The question is whether to spend a little to de-risk the one high-exposure layer.

**Strategy options (the user's call):**

- **Option A — Keep all-ElevenLabs for MVP; revisit voice post-retention-data.** Lowest cost, fastest. Ship voice from a Pro plan, human-curate hard, and re-evaluate only if community data shows the Conductor specifically reads as "soulless." Pairs naturally with the existing "monetization timing" wait-for-data posture (§14.6). *Recommended default for MVP.*
- **Option B — Lean into INTENTIONALLY-synthetic voices (dodge the "fake actor" complaint).** The Conductor is an in-fiction **train-PA AI** and the enemies are non-human; design the Conductor's "wrong" mode and creature vocals to read as *deliberately* synthetic/processed so "it sounds AI" becomes a feature, not a flaw. This is *already half-built into the fiction* (§16.4 Conductor-as-AI, §17.3 "the wrong technique," pitch-shifted creature voices) — Option B is mostly a framing/curation commitment, very low cost, and meaningfully reduces the "fake human actor" objection. **Strong companion to A.**
- **Option C — Human-or-hybrid HERO VO for the Conductor only.** Keep AI for SFX, music, barks, and enemy vocals; record the ~50–70 Conductor lines (the "single most important audio asset," §16.4) with a real or consented voice, or use AI as a *temp/draft* then re-record for ship. Highest cost and a small pipeline change, but directly removes the highest-exposure, highest-importance risk. Consider only if A+B testing shows the Conductor is the weak link.
- **Option D — Disclosure + community framing as standing policy.** Orthogonal to A–C: disclose plainly, frame AI audio as "what keeps the game free," use only original **designed** voices (never cloned/recognizable — already the plan, §17.6), and pre-stage a friendly response to the inevitable "this uses AI" comment and to false-accusation bombing. Near-zero cost; should be adopted regardless of A/B/C.

**Recommendation (framed as the user's decision).** Adopt **A + B + D for MVP**: keep the all-ElevenLabs lock, but (B) deliberately steer the Conductor and creatures toward *intentionally-synthetic* timbres so AI-ness reads as art direction, and (D) make disclosure-and-framing standing policy. Hold **Option C (human/hybrid Conductor) in reserve** as a targeted, post-playtest de-risk *only if* the Conductor specifically tests as "flat/soulless." This keeps the locked decision intact for MVP, costs almost nothing, and concentrates any future spend exactly where the evidence says the risk actually is. **This is genuinely your call** — it lightly touches the §14.7 lock, so it's tagged [DECISION NEEDED] in §22.4 (#13).

### 22.6 Open questions for the user

**RESOLVED (2026-06-27).** All four forks are decided:

1. ✅ **Manual free-aim is the DEFAULT** (auto-fire was *not* adopted as default). The core verb stays a skill-expressive free-aim shooter (§1/§9 framing preserved). *Mitigation for the manual-fire fatigue tax the research flagged:* keep the strong magnetic aim assist (§9), and offer **auto-fire-toward-nearest as an OPTIONAL accessibility toggle** (off by default) so fatigue-sensitive players aren't excluded — never forced, never the default. (Resolves §22.4 #2.)
2. ✅ **Pure all-ElevenLabs voice — no special framing.** The §14.7 all-ElevenLabs lock stands as-is for voice too: no human/hybrid Conductor, no *mandated* intentionally-synthetic styling, no disclosure-policy commitment. *Residual risk accepted knowingly:* AI voice is the most-scrutinized AI-audio category and the Conductor carries the horror payload — so human-curate the Conductor lines hard and treat "does the Conductor read as flat/soulless?" as a playtest watch-item. Options B/C/D in §22.5 remain *available* later if data warrants, but are **not committed**. (Resolves §22.4 #13.) **⚠ Steam exception (§23.4):** "no framing" holds for the **free web build**, but the **Steam SKU MUST carry a mandatory AI-content disclosure** (gates submission, shown on the store page) — non-optional on Valve's storefront. We control the *wording/tone*, not *whether*; draft a neutral factual Pre-Generated disclosure string.
3. ✅ **Daily-seed + friends-first leaderboards.** Headline a daily-seed board + friends boards; the raw global board is demoted to "for fun" and server-side sanity-clamped. (Resolves §22.4 #9.)
4. ✅ **Focus on DESKTOP; mobile DEFERRED.** Mobile is no longer an MVP/launch target — build desktop-first and don't spend on mobile parity now. This **supersedes the earlier "desktop-first, mobile-capable" lock (§14.2 updated)** and makes the mobile-specific work — the 30fps tier, touch controls, and the iOS-Safari memory-crash guard (§22.4 #4 / §13) — **non-blocking/deferred** (adaptive-quality + memory discipline still help low-end *desktop* GPUs). Revisit mobile post-launch.

---

---

## 23. Multi-Platform Strategy — Browser + Native Desktop (Steam)

> A *planning* section (no code), added 2026-06-27. It does **not** reopen any locked §14 decision; it extends the desktop-focused product (§14.2/§22.6 #4) with a second, premium delivery target and the seams needed to support both from one codebase. Every claim here respects the fact-checks: **Tauri/WKWebView WebGPU is rejected for the shipping native client**, and **Steam AI-content disclosure is mandatory and non-optional**.

### 23.1 The two targets — and why both

We ship **one Vite + TypeScript + R3F/WebGPU codebase** as **two builds**:

| Target | Delivery | Role | Quality ceiling | Why it earns its place |
|---|---|---|---|---|
| **Web** | Cloudflare Pages (locked, §3) — instant, no-install, link-shareable | **Primary for iteration + the viral funnel** | Capped at the mid tier (§24) | Fastest dev loop, broadest reach, the install-funnel "ad" for Steam; lower visual quality is *acceptable* here because instant-play + virality dominate (§22.1 #2). Free. |
| **Native desktop (Steam, Win + macOS)** | Electron client, distributed via Steam depots | **Premium tier + authoritative services + revenue** | Unlocks the top tier (§24) | More memory/VRAM, multi-GB asset budget, top quality tier, Steamworks (authoritative leaderboards, cloud, achievements, friend-invite co-op), and a real paid/monetizable storefront. |

The split is deliberate: the **web build is the top of funnel** (a 2-second invite link drops a friend straight into co-op — the highest-leverage growth mechanic in the dataset, §22.1 #2), and the **Steam build is where fidelity, integrity, and money live**. The browser link is literally the ad for the premium SKU; this is the validated **Vampire Survivors model** (free web → paid Steam, fact-check confirmed) — *not* a byte-identical "same game" sold twice (see §23.4 parity caveat).

**Honest scope note.** A native build is *not* automatically higher-fidelity (fact-check: a stock Electron wrapper inherits the same Chromium/Dawn WebGPU fingerprinting buckets and JS-heap caps as a browser tab). What native genuinely buys is **distribution + asset size + VRAM headroom + Steamworks services + a stable, consistent GPU path** — and *that* is what funds a distinct top quality tier (§23.3, §24). We are NOT writing a native wgpu renderer to escape the webview GPU buckets; the win we claim is real-but-bounded and honestly scoped.

### 23.2 One codebase → two builds — packaging + the platform-abstraction layer

**Packaging recommendation: Electron is PRIMARY; NW.js is the backup; Tauri is REJECTED for the shipping native client.**

The decision is forced by **WebGPU-in-webview on macOS**, and the fact-checks make this unambiguous:

- **Electron (PRIMARY).** Electron 38 bundles its own Chromium 140 + Dawn, so **WebGPU/Dawn behaves identically and consistently on every Windows and Mac we ship to, regardless of the host OS version or Mac silicon.** For a product whose *entire value is the renderer*, deterministic GPU behavior is worth the binary cost. Electron's ~80–250 MB app + ~100–400 MB baseline RAM are real but **dominated by our multi-GB Steam asset payload** — wrapper size is rounding error on the premium SKU (and would be unacceptable on the web funnel, which is exactly why Electron is native-only, never the web delivery).
- **Tauri 2 (REJECTED for ship).** Tauri does not implement WebGPU; it inherits it from the OS webview. **On Windows** (WebView2 = evergreen Chromium) WebGPU is fine. **On macOS** (WKWebView) WebGPU exists in WebKit only from **Safari 26 / macOS Tahoe 26 onward (practically Apple Silicon)** and is **NOT guaranteed exposed in embedded WKWebView** — Apple has stated directly that *Safari feature flags do not propagate to WKWebView* ("the feature will work when it's enabled by default"), so there is **no flag/entitlement to force it** on an older OS. Net effect: paying Mac users on macOS 14 (Sonoma) / 15 (Sequoia) — a large slice of the Steam Mac base in 2026 — would silently fall back to **WebGL2 on the premium SKU they bought**. That is exactly backwards, and the WebKit WebGPU backend is still maturing (partial support, known "device-lost" bugs late 2025). Tauri is at most a throwaway tooling experiment, **never a fallback for the shipping client.** (Wails, Neutralino, Electrobun share the OS-webview model and the same WKWebView exposure problem.)
- **NW.js (BACKUP).** Same Chromium-bundling guarantee and same official Steamworks-library support as Electron. Use only if a specific Electron limitation bites.

**Steam Deck / Linux.** Ship the **Windows Electron build and target Steam Deck via Proton**, not a native Linux SKU — Electron-on-Linux has documented Steam Linux Runtime launch failures (libcups) and gamepad-detection issues. Pursue a **Steam Deck Verified** pass (controller glyphs, default-to-controller UI, on-screen keyboard, 1280×800 16:10, a Deck-tuned tier — likely the mid tier with volumetrics off). Defer native Linux unless Deck telemetry justifies it.

**Thin platform-abstraction layer (the swap seam — designed in from day one).** The game core depends only on a small set of capability **interfaces**, never on Electron/Node/Steam directly. Vite tree-shakes the unused implementation per build target. This mirrors the existing `src/net/playroom.ts` "swap point" (§11) and the renderer/post factory pattern (§5/§19):

| Capability interface | Web implementation | Native (Electron) implementation |
|---|---|---|
| `Storage` | IndexedDB / localStorage | Node FS + Steam Cloud (Auto-Cloud / ISteamRemoteStorage) |
| `NetTransport` (see §23.5) | PlayroomKit + Cloudflare TURN | PlayroomKit (kept identical for cross-play); Steam SDR parked as a later Steam-only mode |
| `Achievements` | no-op / custom | Steamworks via **steamworks.js** (`ISteamUserStats`) |
| `Leaderboards` | our Cloudflare Worker daily-seed board | Steam Leaderboards (Trusted-Mode mirror) *over* the same Cloudflare board |
| `AssetSource` | <25 MB streamed from Pages | local multi-GB install (+ optional post-install hi-res pack, §24.4) |
| `Tier policy` | web caps at the mid tier; top tier hard-gated off | mid/high enabled; top tier unlocked |
| `Updates` | n/a (Pages is always-current) | `electron-updater` for direct/itch.io; **disabled on Steam** (Steam depots patch) |

A single internal flag — `PLATFORM.isNative` (exposed by the Electron preload over `contextBridge`) — gates the native-only paths. 95%+ of the code is shared; only these implementations differ.

### 23.3 What NATIVE genuinely unlocks (vs browser)

Honestly scoped per the fact-check — native is **not** monotonically higher-fidelity, but it removes specific browser ceilings that fund the top tier:

- **Memory / VRAM headroom.** No browser tab heap pressure or VRAM throttling. Bigger texture pools (4K UASTC hero textures kept resident), more concurrent InstancedMesh2 enemies, larger decal/particle caps. *(Caveat, fact-checked: the JS heap is still capped — ~8 GB Windows renderer, 4 GB V8 cage — so the win is VRAM + asset I/O, not unbounded heap.)*
- **Asset size.** Steam delivers **multi-GB installs** vs the web's hard **<25 MB initial** budget (§10). Native ships 2K/4K KTX2 textures, denser VAT clip banks, extra LODs, lossless audio stems — everything the web build must strip.
- **Filesystem + no tab/autoplay limits.** Real on-disk cache (no IndexedDB quota games), no autoplay gating on the ElevenLabs audio engine (§17.5), no background-tab throttling killing a run, more reliable worker/OffscreenCanvas behavior.
- **GPU flags.** Electron can pass Chromium flags (force high-perf GPU, raise limits) a browser cannot.
- **Consistent GPU path.** Bundled Chromium/Dawn = one known WebGPU surface on both OSes — no per-user-OS divergence to QA.
- **Steamworks.** Achievements, Cloud saves, rich presence, friend-invite lobbies, and **authoritative Trusted-Mode leaderboards** — a far stronger social/integrity story than the web's PlayroomKit-only layer.

These — not raw shader features — are what justify a distinct **top tier** the browser never offers (§24).

### 23.4 Steam integration

**Steamworks bindings: `steamworks.js`** (ceifa/steamworks.js) — a maintained, prebuilt Rust/N-API native module (no C++ build step), supporting **Windows, macOS (.dylib), and Linux**, exposing achievements, stats, cloud, lobbies, P2P networking, Steam Input, auth, and overlay. It runs in the Electron **main/preload** process (it cannot be used in the renderer by default); expose a typed bridge over `contextBridge`. *Watch-out:* the in-window Steam overlay in Electron is historically Windows-leaning/flaky — validate the macOS overlay early or fall back to opening the Steam client window for invites/friends. (`steamworks-ffi-node` is a viable backup if the overlay blocks us.) `greenworks` is unmaintained — do not use.

**Features to wire (MVP-scoped):**
- **Achievements + Stats** (`ISteamUserStats`) — runs, distance, combo milestones, Risen→Grown kills. Cheap retention signal.
- **Cloud saves** (Auto-Cloud or `ISteamRemoteStorage`) — meta-progression (scrap, unlocks, settings) per §8.
- **Leaderboards — the anti-cheat win** (`FindOrCreateLeaderboard`, up to 10,000 boards, int32 score + up to 64 int32 of associated data for seed/combo/distance). **Set boards to Trusted Mode: clients then CANNOT write scores — only our server can, via the `SetLeaderboardScore` Web API (publisher key, server-only).** This is the authoritative board the web build structurally cannot have (P2P host-authoritative is forgeable, §7). On native, a run is submitted to our Cloudflare Worker, **validated/sanity-clamped server-side** (seed + distance × combo, per §7's "client proposes, host disposes" ethos), then written via the Web API. *Honest caveat:* the P2P host can still forge the value it reports to our server, so Trusted Mode hardens the **board write**, not the underlying sim — keep boards framed as daily-seed + friends-first (§22.6 #3) on Steam too.
- **Rich presence + friend invites + lobbies** (`SetRichPresence`, `ISteamMatchmaking`) — overlay "Invite to game" is a far stronger co-op acquisition loop than a web share link.
- **Workshop** — NOT for MVP (no first-class UGC in a 90–180s rails roguelite).

**Steam networking / SDR (for native-to-native, parked behind the §23.5 decision).** Steam Datagram Relay + `ISteamNetworkingSockets` P2P (`CreateListenSocketP2P` / `ConnectP2P`) gives reliable, encrypted, IP-hiding, auto-relayed/NAT-traversed connectivity **plus Steam-hosted signaling** for genuine Steam-client peers — removing our STUN/TURN/signaling need *for that audience*. *Fact-checked caveats:* "free" means **no incremental bandwidth fee**, but still requires a published Steam app ($100 Steam Direct fee, SDK Access Agreement, standard rev share); SDR exists **only on Steam** (not in the open-source GameNetworkingSockets build, and not reachable by a browser peer); and reliability is a transport guarantee, not an uptime SLA we control. **Because of cross-play (§23.5) we do NOT use SDR for live transport in v1.**

**Steam AI-content disclosure — MANDATORY (fact-check OVERRIDES the §22.6 #2 "no special framing" posture for the Steam SKU).** Steam's Content Survey contains a **mandatory** Generative AI section that gates submission — you **cannot ship without answering it.** Our 100%-ElevenLabs voice/music/SFX (§17) is **"Pre-Generated" AI content** (created during development, ships in the build, consumed by players) and **must be disclosed**; ElevenLabs is content-facing, **not** an exempt behind-the-scenes efficiency tool (the Jan-2026 carve-out covers code assistants, not asset generators). Valve publishes most of that disclosure **on the public store page**. We are **not** subject to Live-Generated rules (nothing is generated at runtime).

The honest reconciliation with the locked "pure all-ElevenLabs, no special framing" decision (§22.6 #2): that decision holds for the **free web build** (no gatekeeper) but **cannot** hold for Steam — disclosure is non-optional there. The nuance that preserves the spirit of the lock: **we author the disclosure wording ourselves** (the survey free-text becomes the store-page text), so we control the *framing/tone*, just not *whether* it's disclosed. **Plan action:** draft a concise, neutral, factual Pre-Generated disclosure string (e.g. "All in-game voice, music, and sound effects are generated using ElevenLabs and curated by the team") — no apology, no concealment. Accept that some buyers filter on it; that is the cost of the premium storefront. (This updates §22.5/§22.6 — see §25 → §22.5.)

**Business model recommendation: FREE web funnel → PAID premium Steam ($9.99–$14.99), Early Access first, no MTX at launch.** Steam *allows* F2P-with-cosmetic-MTX (Microtransaction API + Inventory Service, Steam Wallet only — and it **forbids** the rewarded-video-ad model the web build can use), but a 90–180s all-AI-audio roguelite is a **weak F2P-cosmetics economy** (low ARPU, needs a live-ops cosmetics pipeline we don't have) and is vulnerable to "why pay when the web version is free." So we justify the price with the **premium delta**: top-tier visuals, authoritative cheat-resistant leaderboards, Steam achievements/cloud/friends co-op, Steam Deck, offline. Drive wishlists with the free web build's virality + a **Steam demo**. Hold cosmetic MTX as a *post-launch* option, consistent with the §14.6 "monetize after retention data" posture. *Parity caveat (fact-checked):* keep the two builds positioned as **related-but-distinct** products and never undercut the Steam SKU using Steam keys sold elsewhere — Steam's parity/MFN clause is real and contested (live Wolfire v. Valve suit, unresolved mid-2026); the Vampire-Survivors path (independently-distributed free web build, fuller paid Steam build) is the precedented, low-risk shape.

### 23.5 Cross-play & netcode

**Recommendation: ONE unified WebRTC/PlayroomKit transport EVERYWHERE (browser + native), giving true web↔Steam cross-play on a single netcode path.** For a **2-player invite-a-friend** game the matchmaking pool is effectively size 2 — the one friend you invited — so SDR's "keep a big pool connected" advantage barely applies, and **splitting into separate web and Steam pools is the worst outcome**: a Steam owner could not co-op with their browser-only friend, breaking the exact viral funnel (§23.1) where the browser link is the ad for the Steam build. So:

- **v1 ships exactly one transport** — `PlayroomTransport` (WebRTC, PlayroomKit-managed) — used by **both** shells. Native (Electron) ships Chromium, so PlayroomKit/WebRTC runs unchanged; TURN (§7) stays mandatory for browser peers and is reused by native (native-to-native pairs mostly connect P2P/STUN and rarely touch TURN, so the relay bill barely moves).
- **Steam adds a UX veneer, not a transport.** On native we still create a PlayroomKit room, but advertise it through Steam: a Steam lobby whose metadata carries the PlayroomKit room token + `ActivateGameOverlayInviteDialog` + rich presence "Join Game." The joiner reads the embedded token (`GameLobbyJoinRequested_t` / `+connect_lobby` on cold launch) and joins the same WebRTC room. A Steam host can also surface the plain web link to invite a browser friend. **Cross-play is preserved precisely because we did NOT adopt SDR for transport.**
- **The seam: a transport-agnostic `NetTransport` interface** (the §23.2 capability). The host-authoritative star sim (§7 — host runs Director/AI/damage/spawns/scoring; client predicts own movement, interpolates remotes ~100 ms back) consumes only this interface and **never imports PlayroomKit**. It mirrors §7's two-channel design (`sendReliable` for loadout/spawns/deaths/score; `sendUnreliable` for transforms/aim at tick rate) plus `isHost()`, `onPeerJoin/Leave` (driving the §22.6 partner-drop UX), and `getInviteToken()`/`presentInviteUI()` (web = copy-link; Steam = overlay dialog). `src/net/playroom.ts` becomes `transports/PlayroomTransport.ts` implementing it. **§7's host-authoritative simulation is unchanged and transport-agnostic.**
- **A future `SteamSocketsTransport` (SDR/GNS) is parked** as a post-launch Steam-only "best connection" mode and as a hedge against PlayroomKit pricing/availability — slotted in behind the interface without touching the worker sim. Not a launch dependency.
- **Cross-play correctness wall (mandatory):** quality tier (§24) is **cosmetic-only and must never touch the simulation** — a LOW web client and a top-tier native client must run identical host-authoritative logic and see identical enemies/spawns/hits; only pixels differ. Any tier knob leaking into gameplay (particle-driven hit detection, LOD affecting collision) silently desyncs co-op.
- **Leaderboards across platforms:** our **Cloudflare daily-seed + friends board is the single cross-platform authority**; the native client also pushes the server-clamped score to a **Steam Trusted-Mode board as a one-way, Steam-only-visible mirror** (store-page credibility + overlay discovery). Steam's board is downstream, never the cross-play ranking (§23.4, §22.6 #3).
- **"Host yourself" still holds on both** (the §2/§7 asterisk): native does NOT get a free dedicated server — it is still host-authoritative P2P; Steam adds nicer discovery/invite/identity, not a game server. Keep saying **"no dedicated game server."** §22.6's graceful partner-drop rules apply identically on both transports.

### 23.6 Sequencing impact (slots into the §12 / Phase-0→M4 roadmap)

**Principle: web-first for speed; Steam client as a later, additive milestone — Phase-0 can run in both from the start.**

- **Phase 0 (Visual Quality Slice, §19) + M0 (grey-box):** build and iterate **in the browser** for the fastest loop. *Because the look-dev app is just the R3F bundle, the Phase-0 slice can also be wrapped in the Electron shell from day one* (a few hours) to sanity-check the bundled-Chromium WebGPU path and the top quality tier on real Win+Mac hardware early — recommended, but the *gating* fidelity decision is still made on the web build.
- **M1 (Vertical Slice) onward:** stand up the **platform-abstraction interfaces** (`Storage`/`NetTransport`/`Tier policy` first) so both builds compile from M1; the per-tier matrix (§24) is wired here, with the top tier reachable only behind `PLATFORM.isNative`.
- **New milestone — "M3.5 / Steam client" (before/at launch, overlapping M3–M4):** Electron packaging (electron-builder: NSIS + DMG/zip, code-signing + macOS notarization), `steamworks.js` wiring (achievements/cloud/leaderboards/rich-presence/overlay), the Steam lobby↔PlayroomKit invite bridge (§23.5), the **mandatory AI-content disclosure** (§23.4), store-page assets, **Steam Deck Verified** pass, and the **server-side Trusted-Mode leaderboard validation** path. Rough effort: Electron wrap + Steamworks 3–5 wks · disclosure/store/review 2–4 wks · Deck Verified 1–2 wks, overlapping an Early-Access wishlist-banking window. Cash: $100 Steam Direct + ~$99/yr Apple Developer (notarization) + Windows EV Authenticode cert (procure **early** — lead-time items).
- **M4 (Launch & live):** both builds ship; web stays the free funnel, Steam the paid premium SKU; cross-play live across both per §23.5.

---

## 24. Quality Tiers (Low / Mid / High / Ultra)

> A *planning* section. The tier system sits **on top of** the §6 adaptive quality ladder and the §5/§19 dual post stack (TSL on WebGPU, pmndrs/postprocessing on WebGL2), generalizing §19.C's existing 2-preset (High/Mobile) + backend toggle into a 4-tier ladder + platform mapping. Since mobile is deferred (§22.6 #4), the old "Mobile 30fps" preset is repurposed as the **Low floor for weak desktop iGPUs / WebGL2**, not a shipping mobile target. The web's <25 MB initial budget (§10) is honored; iOS memory-crash concerns are out of scope now that mobile is deferred.

### 24.1 The tier model — count, naming, auto-detect, and tier-vs-adaptive

**Four tiers: LOW / MID / HIGH / ULTRA**, where **ULTRA is native-only** (hard-gated off in the browser; greyed-out with a "Play on Steam for Ultra" hint = a viral-funnel nudge). Four is the sweet spot: it maps cleanly onto detect-gpu's tier-0..3 buckets, each step is a meaningful visual jump, and the per-tier × per-backend × per-platform QA matrix stays maintainable (the §13 "two post stacks already double the work" risk argues against more).

- **LOW** — last-ditch weak iGPU / WebGL2-only / integrated laptop. Playable, not pretty. (The repurposed deferred-mobile floor.)
- **MID** — typical WebGPU laptop dGPU / strong iGPU. **The web ceiling's working default.**
- **HIGH** — desktop dGPU. **The browser CEILING; the native baseline.**
- **ULTRA** — **native Steam client only** (RAM/VRAM/asset-size headroom of §23.3 + the 4K native pack of §24.4).

**Tier = a user/auto-chosen CEILING; the §6 adaptive scaler is a DOWN-ONLY runtime nudge inside that ceiling.** They coexist as *clamp + float*:

- **First run:** **detect-gpu** (pmndrs — classifies live GL/WebGPU context into tiers 0–3 via a benchmark) picks an initial ceiling. *Mitigation baked in (fact-checked):* detect-gpu's benchmark data source (gfxbench.com) stopped updating Dec 2025, so 2026 GPUs may return `FALLBACK` with no fps — therefore **always pair it with a ~2–3 s in-engine warm-up probe** (spin the actual title/lobby scene at the candidate tier, measure rolling frame-time) to confirm/demote before gameplay. Persist the choice (localStorage on web / config file on native).
- **The chosen tier sets hard clamps** via the §24.2 `FeatureMatrix` (max render scale, max shadow res, which post effects are even instantiated, enemy cap, draw distance, KTX2 mip floor).
- **The §6 adaptive scaler floats DOWN-ONLY** on a rolling frame-time average (~90th percentile over ~1 s), stepping in the §6 order (render-scale → shadow res → LOD bias → enemy cap → VFX density → drop SSR/volumetrics/motion-blur). It may step *below* the tier's nominal but **never above the ceiling** — a user who picked HIGH never silently gets ULTRA effects; a struggling HIGH machine degrades gracefully toward MID-ish runtime values without changing the label. Step-up is cautious and capped at the ceiling (it only recovers headroom it earlier gave up).

The contract: **the player picks the artistic ceiling; the engine guarantees the 60 fps desktop floor underneath it.** The HUD shows the tier name + a small **"AUTO"** badge when adaptive has pulled below nominal.

### 24.2 Per-tier feature matrix

Ceilings per tier. Adaptive may reduce *within* a tier; it never exceeds a cell. WebGPU-only "premium register" cells (compute particles, GTAO-temporal, froxel volumetrics, TRAA) automatically fall to their cheaper WebGL2 counterparts regardless of tier (see §24.3).

| Feature | LOW | MID | HIGH (web ceiling) | ULTRA (native only) |
|---|---|---|---|---|
| Render scale + upscaler | 0.5–0.7 + cheap spatial | 0.8–1.0 + TRAA-as-upscale | 1.0 (DPR ≤1.5) + TRAA | 1.0–native 4K (DPR to display) + TRAA |
| Anti-aliasing | FXAA / SMAA (GL2) | SMAA / TRAA | TRAA (WebGPU) / SMAA (GL2) | TRAA (optional MSAA on forward) |
| Shadows | off or 1 cascade @1024 | 2 cascades @2048 | 3 cascades @2048 | 3–4 cascades @4096 |
| Bloom | off | selective, half-res | selective, full-res | selective, full-res HQ |
| GTAO / SSAO | off | GTAO low | GTAO + temporal | GTAO high + temporal |
| SSR | off | off (selective opt-in) | selective (metal floor / windows) | full selective |
| Motion blur | off | camera-velocity | camera-velocity | per-object velocity |
| Volumetric god-rays | off | screen-space cheap | raymarched / froxel (WebGPU) | full froxel, high steps |
| DoF / grain / CA | off / grain / off | grain + subtle CA | DoF + grain + CA | full |
| Particles / VFX density cap | 0.4× (sprite pool) | 0.7× | 1.0× (compute particles, WebGPU) | 1.5× compute particles |
| Max concurrent enemies + LOD | 40–60, aggressive LOD bias (+1) | 90, LOD bias 0 | 120, LOD bias 0 | 200+, LOD bias −1 (sharper) |
| Draw / world-recycle distance | short | medium | full | extended |
| Texture res / KTX2 mip floor | mip-1 (≤1K) | mip-0 base (≤2K) | mip-0 (2K shared set) | native pack mip-0 (4K UASTC) |
| Anisotropic filtering | 2× | 4× | 8× | 16× |
| Reflections | IBL only | IBL + box probes | IBL + selective SSR | IBL + SSR + extra probes |

All caps respect the hard agent ceiling of §9 (60–120 for browser perf); ULTRA's 200+ is native-only headroom.

### 24.3 Platform ↔ tier mapping

Two compounding axes constrain the ceiling: **renderer backend** (WebGPU vs WebGL2) and **host** (browser vs native Electron).

- **WebGL2 (any host)** hard-caps at **MID** — post stack = pmndrs/postprocessing + realism-effects (Bloom/SSAO/SMAA/LUT/vignette/noise; SSR/volumetrics off by default, §5). This is a separate code path (`EffectComposer` does not run on `WebGPURenderer`, §5 watch-out); the renderer/post factory chooses the chain at boot and the WebGPU-only matrix cells degrade.
- **WebGPU in browser** can reach **HIGH**, but constrained: bounded WebGPU memory (default `maxBufferSize` 256 MiB, ~1 GB requestable, §2), the **<25 MB compressed initial-download budget** (§10) capping textures to the 2K shared set, and DPR clamped (≤1.5). **HIGH is the browser ceiling; ULTRA is unreachable in any browser** (download/VRAM budget + the 4K native pack isn't shipped to web).
- **Native Steam (Electron + bundled Chromium/Dawn)** gives a **consistent WebGPU path on both OSes** (the §23.2 reason Electron beats Tauri), removes the download budget, and raises VRAM headroom — unlocking **ULTRA** (4K UASTC, full froxel volumetrics, per-object motion blur, 200+ enemies, 16× aniso, native-resolution incl. 4K). *VRAM caveat (fact-checked):* 8 GB cards are marginal at 4K in 2026, so **ULTRA still reads a VRAM budget at launch and the adaptive scaler stays active even on ULTRA**, demoting the mip floor if the budget is exceeded.

**Defaults & reach per platform/renderer:**

| Platform / renderer | Default tier | Can reach |
|---|---|---|
| Browser + WebGL2 | LOW | MID |
| Browser + WebGPU (laptop iGPU) | MID | HIGH |
| Browser + WebGPU (desktop dGPU) | HIGH | HIGH |
| Native Electron + WebGPU (laptop) | HIGH | HIGH (ULTRA if VRAM ok) |
| Native Electron + WebGPU (desktop dGPU) | HIGH | ULTRA |

### 24.4 Asset strategy

**One scalable asset set + two texture deliveries — never two art sets, never duplicated geometry.**

- **Geometry: single GLB per asset**, shared LOD chain + shared rig (§10 — one humanoid rig across Risen/Grown variants), Draco (static) / meshopt (skinned/morph). Tiers select LODs via **LOD bias**, not different files — identical data for web and native.
- **Textures: KTX2/Basis mip pyramids ARE the per-tier resolution ladder.** Build each texture once at max source res; LOW transcodes/uploads from mip-1, MID/HIGH from mip-0 of the **shared 2K set** (which fits the <25 MB web budget), and Basis transcodes at runtime to the GPU's native format (BC7/ASTC/ETC2). Mip-tail streaming keeps low mips resident and streams higher mips on demand, so **tier changes swap mip levels live without reloading assets.**
- **Native-only hi-res pack** (§23.3): a **separate KTX2 bundle with 4K UASTC mip-0 (+ extra mip levels) for hero/near assets only**, downloaded by the Steam client post-install (multi-GB latitude). It **adds** higher mip levels to the *same* textures — it does **not** replace geometry or duplicate the base set. ULTRA simply raises the mip floor to consume it; if the pack is absent (web, or still downloading) the engine silently falls back to the 2K shared mips.
- **Manifest-driven:** a single `AssetManifest` keys each texture's available mip set and which pack supplies it; the loader requests the floor mip for the active tier and streams up. **CI enforces the §10 <25 MB web cap** (the native pack is excluded from that budget). This is the single source of truth that prevents the native pack desyncing from the shared set.

### 24.5 Settings UX (tied to §6)

- **Presets dropdown:** LOW / MID / HIGH / **ULTRA (locked, native-only)** / **Custom**. Selecting a preset writes the full `FeatureMatrix`; touching any advanced toggle flips the dropdown to *Custom* (stores a custom matrix).
- **Advanced per-toggle drawer:** every matrix row exposed (render-scale slider, shadow res, each post effect on/off, enemy cap, texture-res floor, aniso, draw distance), each control **clamped to what the backend+platform permits** — WebGL2 greys out SSR/volumetrics; browser greys out ULTRA-only rows; tooltips say *why* ("Requires WebGPU" / "Available in the Steam client").
- **Live readout:** FPS + frame-time (ms) + draw calls/triangles from `renderer.info.render` + active backend (WebGPU/WebGL2) — the **custom lightweight `renderer.info` HUD** from §19.C (stats-gl broke on WebGPU at r181, so this is already the plan). Show the **"AUTO ▼"** badge when adaptive has pulled below nominal, with a one-click **"lock to manual"** to disable down-scaling for benchmarking/photo mode.
- **Ties to §6:** the same `QualityManager` owns the `FeatureMatrix`, the adaptive scaler, and the profiler feed (rolling frame-time from `renderer.info` + rAF). Changing the preset resets the adaptive baseline; the scaler re-floats within the new clamps. Photo mode (§19.C) forces adaptive off so captures are at nominal tier quality.

---

## 25. Integration Change-Log — Multi-Platform Ripple Edits

Where §23–§24 ripple into §1–§22. **The decision/risk-level edits are ✅ APPLIED** — woven into **§3** (Electron + Steamworks + platform-layer rows), **§12** (platform track + Steam ~M3.5 milestone), **§13** (six platform risk rows), **§14** (forks 8–10), and **§22.6 #2** (Steam AI-disclosure exception). The remaining items (§6/§7/§8/§10/§11 implementation detail) are **build-time guidance**, applied when those systems are built out.

- **§3 (Tech Stack):** add an **Electron** row (native Steam wrapper, bundled Chromium 140 + Dawn; NW.js backup; **Tauri rejected** — WKWebView WebGPU gated to macOS 26+/Apple Silicon, no flag to force it); add a **Steamworks (`steamworks.js`)** row; add a **platform-abstraction layer** row (`Storage`/`NetTransport`/`Achievements`/`Leaderboards`/`AssetSource`/`Tier policy`/`Updates` interfaces, env-selected at build time, tree-shaken per target).
- **§6 (Performance):** clarify the adaptive quality ladder is now the **DOWN-ONLY adaptive layer *within* a §24 tier ceiling** (clamp + float); detect-gpu first-run + ~2–3 s in-engine warm-up probe (detect-gpu data stale since Dec 2025) sets the initial tier.
- **§7 (Netcode):** introduce the **`NetTransport` interface**; v1 = `PlayroomTransport` (WebRTC) on **both** builds for true web↔Steam **cross-play** (web = PlayroomKit + Cloudflare TURN; Steam = same WebRTC with a lobby/overlay invite *veneer*, **not** SDR transport). Host-authoritative sim stays **transport-agnostic and unchanged**; `SteamSocketsTransport` (SDR/GNS) parked as a post-launch Steam-only mode. Add the **tier-never-touches-sim** cross-play correctness wall.
- **§8 / §14.6 (Monetization):** add **per-platform model** — free web funnel (rewarded-ad-capable) vs **paid premium Steam $9.99–$14.99, EA-first, no MTX at launch** (Steam forbids rewarded-video ads; F2P-cosmetics is allowed but a weak fit). Keep MTX as the post-retention-data option (§14.6 posture preserved). Note the Steam **parity/MFN** caveat (don't undercut via Steam keys elsewhere; Vampire-Survivors shape).
- **§10 (Assets):** add the **native-only 4K UASTC hi-res pack** (post-install, multi-GB, *adds* mip levels to existing textures — no geometry/art duplication) vs the **web <25 MB** shared 2K set; one `AssetManifest`; CI enforces the web cap with the native pack excluded.
- **§11 (Project structure):** add **`apps/desktop/`** (Electron main + preload + electron-builder config), **`src/platform/`** (the abstraction interfaces + `web/` and `desktop/` implementations), and **`src/platform/desktop/steam/`** (`steamworks.js` bindings over `contextBridge`). `src/net/playroom.ts` → `src/net/transports/PlayroomTransport.ts` implementing `NetTransport`.
- **§12 (Roadmap):** keep **Phase 0 + M0 browser-first** for speed (optionally wrap the Phase-0 slice in Electron from day one to validate the bundled-Chromium WebGPU path + top tier on real Win/Mac early); stand up platform interfaces at **M1** so both builds compile from M1+; add a **"Steam client" milestone (~M3.5, overlapping M3–M4)** for Electron packaging + Steamworks + invite bridge + AI disclosure + Deck Verified + Trusted-Mode leaderboard validation; both builds ship at **M4**.
- **§13 (Risks):** add rows — **WebGPU-in-webview** (why Tauri is rejected; Electron mandatory for native); **Electron binary/RAM size** (real but dominated by multi-GB assets); **Steam AI-disclosure scrutiny** (mandatory, public on store page); **cross-play scope** (one transport for N=2; SDR would split the pool); **two-build maintenance** (Win+Mac native shell QA, two post stacks × four tiers); **macOS notarization + Windows EV cert** (procurement lead-time, start early).
- **§14 (Open Decisions):** add three forks now effectively resolved by this pass — **packaging = Electron (primary) / NW.js (backup) / Tauri (rejected)**; **business model = free web + paid premium Steam, EA-first, no launch MTX**; **cross-play = unified WebRTC everywhere (one pool)**.
- **§22.5 / §22.6 #2 (AI-audio posture):** the "pure all-ElevenLabs, **no special framing**" decision holds for the **free web build**, but the **Steam SKU MUST carry a mandatory Pre-Generated AI-content disclosure** (non-optional, gates submission, published on the store page). We control the *wording/tone* (we author the survey free-text), not *whether* it's disclosed. Draft a neutral factual disclosure string; not subject to Live-Generated rules. This is the one place the locked web posture cannot extend to Steam.

---

---

## 26. Completeness Audit — Coverage, Gaps & Readiness Verdict

> A producer-level completeness pass over §1–§25, run as a 7-lens audit (legal/privacy/ratings · game backend/identity/live-ops · analytics/telemetry · QA/CI/release · production/team/budget/GTM · accessibility/onboarding · security/abuse/moderation) and reconciled against per-claim fact-checks. The fact-checks **override** the auditors: where an auditor flagged something already covered, it is dropped or downgraded here. This section answers the user's blunt question — *"is everything planned, or is something important missing?"* — honestly, and prioritizes ruthlessly rather than listing everything.

### 26.1 Headline verdict — can we start building?

**YES — the plan is complete enough to START Phase 0 and M0 today. It is NOT yet complete enough to LAUNCH.** Those are two different bars and the distinction is the whole answer.

On **technical design, rendering, netcode architecture, art/asset pipeline, audio/voice, story, quality tiers, multi-platform packaging, and risk-of-the-build**, this is an exceptionally thorough, fact-checked, buildable plan. Phase 0 (visual slice) and M0 (grey-box fun test) touch **none** of the missing surfaces below — they have no accounts, no analytics, no leaderboards, no monetization, no store, no public data collection. Nothing in this audit blocks starting. **Start now.**

But the plan is a near-complete *engineering & design* document and a near-empty *product, business, and player-trust* document. Everything the game needs to **legally collect a nickname, prove its own retention thesis, get its first player, and not break on a stranger's GPU** is unplanned. None of that is needed for Phase 0/M0; **all** of it is needed before the M2 soft-launch and the Steam SKU. So: green light to build, with a clear-eyed list of what must be closed *during* the build, not after.

The single structural blind spot, true across five of seven lenses: **the plan plans the product but not the live service around it.** It is meticulous about the company↔vendor relationship (ElevenLabs/Synty/Steam licensing) and silent about the company↔player relationship (privacy, identity, data, trust, acquisition).

### 26.2 Critical gaps — close before/early in build (verified-real only)

These survived fact-checking as genuinely absent and genuinely launch-relevant. Dropped false-positives are noted in §26.4. None blocks Phase 0/M0; each has a hard "by when."

**C1 — No player-facing legal/privacy foundation (Privacy Policy, ToS, EULA, GDPR/CCPA, cookie consent). [by M2 — launch-blocking]**
*Missing:* zero occurrences of privacy policy, ToS, EULA-for-players, GDPR, CCPA, ePrivacy/cookie-consent, or data-subject rights anywhere in 1325 lines. The plan covers ElevenLabs/Synty/Steam licensing thoroughly but never the documents governing the relationship with *players*.
*Why it matters:* a published privacy policy is legally mandatory the instant the game collects any personal data — and a leaderboard nickname, a WebRTC/TURN-relayed peer IP (IP is personal data under GDPR), a Steam-ID-tied save, and analytics all qualify. The EU ePrivacy Directive requires *prior opt-in consent* for non-essential analytics/ad cookies, independent of GDPR. Steam and ad networks both *require* a posted policy. This is concrete day-one legal exposure on the public web build, not a polish item.
*When:* the moment **M2** first collects data (leaderboards + analytics) on web; before the **M3.5** Steam submission.
*Fix:* a dedicated "Legal & Policy" workstream — commission/template a Privacy Policy + ToS/acceptable-use + Steam EULA; enumerate every data store and its PII (leaderboard nickname+IP, Steam ID, meta-progression, analytics events, peer IPs at TURN) with a lawful basis + retention limit each; build a deletion/export path keyed to a stable player ID; integrate a lightweight CMP/consent gate defaulting all non-essential scripts OFF until consent; execute DPAs with PlayroomKit, Cloudflare, the analytics vendor, and any ad network. Make "policies published + linked + consent gating live" a hard M2 gate, mirroring the §17.6 music-license gate.

**C2 — No COPPA / under-13 kids-safety posture. [decide NOW, before §8 monetization is built — highest-severity legal gap]**
*Missing:* COPPA, the amended FTC COPPA Rule, GDPR-K/Art.8, UK AADC, age-gating, and parental consent are absent entirely. The only "child/kids" hits are thematic ("child-friendly horror," "child-like giggle," "young-audience softening toggle" — a tone control, not a compliance control).
*Why it matters:* the plan *deliberately* engineers a free, no-signup, bright Fortnite/Crossy-Road, "broadly shareable/viral" browser game — i.e. it will predictably draw a large under-13 audience, by design. That collides head-on with the plan's own commitments: you generally **cannot** serve behaviorally-targeted/rewarded ads (§8/§23.4) to under-13 users without verifiable parental consent, and telemetry + leaderboard social-graph data from minors is restricted. FTC penalties run to millions per violation. This is the highest-severity item in the whole audit because it is self-inflicted by the locked art/virality direction and it constrains the monetization design *before* that design is built.
*When:* **now** — it is an input to §8 monetization design and the C1 consent design, not a launch-eve task.
*Fix:* document a posture: (a) treat the no-signup web build as collecting *no* personal data wherever possible (the cleanest COPPA-scope minimizer — make pseudonymous play an explicit design constraint, not an accident); (b) **no behaviorally-targeted ads to under-13** — contextual/non-personalized inventory only, or age-gate rewarded ads; (c) no persistent cross-context identifiers for child users; (d) select only COPPA-capable ad partners; (e) a neutral age screen or a "treat-all-as-children" data posture. Settle this before §8 is implemented.

**C3 — No player IDENTITY / durable-save system for the WEB build. [by M2 — breaks the core retention promise]**
*Missing:* the only stated web persistence is localStorage/IndexedDB, with no acknowledgment anywhere that browser local storage is routinely evicted (Safari ITP ~7-day cap, incognito, cookie-clear, per-device-per-browser). No account, guest-id, device-id, or cloud-profile mechanism exists for the web SKU. (Native is fine — Steam Cloud solves it — but that is precisely the build this excludes.)
*Why it matters:* it silently breaks three load-bearing promises the retention engine leans on: (1) "scrap is never lost / never a zero-progress run" (§1 pillar 1, §8); (2) the "one more run to hear the next Black Box tape" unlock hook (§16.6); and (3) "friends-first leaderboards" (§22.6 #3) — which are *impossible* without a stable notion of who "you" and "your friends" are on web. There is also no cross-device or web→Steam continuity. A player's scrap, unlocks, and season progress can evaporate on a routine storage clear.
*When:* design at **M1** (it shapes the §23.2 capability interfaces), ship before the **M2** soft-launch whose entire purpose is to *prove* retention.
*Fix:* add a Player Identity & Account spec. Minimum: call `StorageManager.persist()` and handle eviction gracefully. Better: a one-click "claim/link" (email magic-link or Google/Discord/Steam OAuth) minting a stable `playerId` and migrating local data to a server-side D1 profile (reuse the §20.1 Cloudflare pattern). Anchor friends boards and the invite link to this identity. Add it as a capability interface alongside Storage in §23.2.

**C4 — No analytics tool, event pipeline, or defined KPI set — yet the plan makes data-gated decisions load-bearing. [by M1/M2 — internal contradiction]**
*Missing:* the word "instrument" appears exactly once, as an unspecified verb. No analytics vendor, SDK, ingestion endpoint, event taxonomy, KPI definitions, or targets exist. There is also no error/crash monitoring (no Sentry/equivalent) anywhere.
*Why it matters:* the plan makes "retention/funnel data validates the loop" the gate for switching on monetization (§14.6, the one still-OPEN fork), names "sub-3s first-play a tracked KPI" (§22.4 #8), gates M3 on "the invite link converts," and repeatedly says systems are "tunable" / "playtest aggressively." **Every one of those decisions is currently unmeasurable.** You cannot soft-launch and "instrument" with no analytics stack chosen, and you cannot decide to monetize without defined retention thresholds. Separately, with no crash telemetry, the exact failure classes the plan itself flags (iOS ~256MB crash, WebGPU device-lost, KTX2 silent load failure, WebGL context-loss) would surface only as undiagnosable funnel drop-off across an unknown device fleet.
*When:* stand up a thin analytics + crash-reporting layer at **M1** (so the M0→M1 fun/premium gates can read real signal), with the full event taxonomy complete for the **M2** soft-launch.
*Fix:* choose a privacy-light first-party pipeline reusing the §20 Cloudflare substrate (a Worker `/collect` → D1 / Analytics Engine) or PostHog (funnels + flags + session-replay in one). Add `src/telemetry/` to §11 with a typed event taxonomy + emit boundary. Define a KPI table (metric · definition · event · target): D1/D7/D30 retention, runs/session, run-completion, restart latency, load-to-first-frame p50/p90, the viral funnel (share→invite-open→join→return + K-factor), crash-free-session %, tier/backend distribution. Add Sentry (browser + Electron) with sourcemaps. **This is the highest-leverage single fix — see §26.5.**

**C5 — The daily-seed and the WEB leaderboard service have no server authority/spec. [by M2 — the daily-seed pillar is unbuildable as-is]**
*Missing (genuinely absent):* the daily seed is a headline fairness pillar (§1, §8, §22.6 #3) but the plan never says *where the seed comes from* — no server generation, no canonical rollover/timezone, no embargo on the unplayed seed, and no binding between the server-issued seed and the submitted score. *Partially-specified:* the web leaderboard is named as "our Cloudflare Worker daily-seed board" and the *Steam* write path is fully hardened (Trusted Mode, server-only Web API) — but the *web* board has no schema, no authenticated write endpoint, no rate-limit/anti-bot, no read/pagination model, and no storage backend chosen. The plan itself admits the web write path is "structurally" forgeable and only "sanity-clamped."
*Why it matters:* if each client derives the seed locally from the date, the daily run is fully knowable/tool-able in advance and "same seed for everyone, fair competition" is hollow. And a free, no-signup public write endpoint with only value-clamping is a wide-open target for flooding, bots, and name-abuse — a visibly cheated board collapses the score-chasing motivation the plan relies on (§22.2 #12).
*When:* **M2**, alongside leaderboards.
*Fix:* a daily-seed service (Cloudflare Worker + Cron Trigger) that issues each day's seed (+ the weekly named-swarm seed, §16.7) on a fixed UTC rollover and treats it as the canonical key the leaderboard validates against. A web Leaderboard Service spec: D1 schema (`daily_board(seedDate, playerId, score, distance, combo, runHash, submittedAt)` + friends graph), an authenticated submit endpoint bound to `playerId` + the server-issued seed (HMAC/nonce so only sessions that actually started a run can submit), server-side plausibility checks (distance-vs-elapsed-time feasibility), per-player/day write caps, Cloudflare Turnstile/rate-limiting in front, and read endpoints (global/friends/around-me). Folds into C3 (needs identity) and C6 (needs name moderation).

**C6 — No display-name / user-entered-text moderation. [by M2 — brand/platform-pull risk on the viral surface]**
*Missing:* leaderboards and the auto-clip "score overlay + link back" structurally require a player name, yet the plan never mentions a name field, profanity filter, blocklist, homoglyph/zero-width normalization, or length/charset limits. (Native gets Steam-persona moderation upstream; the headline *free web* board and the exported clip do not.)
*Why it matters:* any user-entered text shown to others — and especially *burned into a viral MP4/GIF that links back to the game* — is a content-moderation surface. A slur or hateful handle on a public daily board or in a shared clip is exactly the kind of incident that gets a free viral game pulled from portals/platforms, and increasingly triggers DSA notice-and-action expectations.
*When:* **M2**, with leaderboards and clip export.
*Fix:* cheapest path — go name-free (curated-tag / initials-only arcade model), which also fits the no-signup ethos. If free-text names ship: filter at *write* time on the Worker (curated blocklist + normalization + length/charset caps), default to an anonymized handle (name opt-in), provide a report/hide path, and ensure the clip overlay renders only the already-moderated stored name with a fixed (non-user-controlled) link-back URL.

### 26.3 Important gaps — address during the build (next tier)

Grouped; concise. None launch-blocking in isolation, but collectively they separate a demo from a shippable live product.

**Backend / identity / live-ops.** No **remote config / feature-flag** layer — `src/config/` ships *inside* the static bundle, so every balance tweak, dominant-build hotfix (a named §13 risk), or the §14.6 monetization flip needs a full redeploy (and a Steam depot patch + review). No **save-data schema/versioning/migration** — meta-progression will break across the seasonal updates §16.5 commits to; the three Storage backends (web-local, web-account, Steam Cloud) need one canonical versioned shape + Steam Cloud conflict resolution. No **live-ops backend** for the cron-driven daily/weekly/season rotation or **server-verified rewarded-ad grants** (S2S callback — otherwise "double your scrap" is a trivial client cheat that also inflates leaderboards). **PlayroomKit ops** is thin — no stated free-tier ceiling/overage curve, no alert/throttle, and the PeerJS+self-host fallback is named but unscheduled (the "cost scales with viral success, revenue stays zero" trap the plan rightly fears elsewhere).

**Analytics / experimentation.** No **real-user performance telemetry (RUM)** — §6's perf discipline is entirely lab-side; the central claims (60fps "tuned not guaranteed," tier auto-detect on stale detect-gpu data, the WebGPU/WebGL2 split) are unvalidated without per-session fps/tier/backend/load-time beacons from the real fleet. No **A/B / experiment infra** to make the "tunable"/"playtest the split" language real. No **viral-funnel attribution** (ref/UTM tags on invite links + clips) despite share being Pillar 5.

**QA / CI / release.** **Zero automated tests** — no framework named, no headless deterministic-sim harness for the seeded Director/scoring/flow-field/pooling invariants the architecture is explicitly built to make testable. No **netcode test harness** (latency/jitter/loss injection, reconciliation-convergence assertions, desync watchdog, scripted partner-drop/host-leave) for the highest-risk system. No **automated perf-regression/leak gate in CI** (the §19.D flat-`renderer.info` check exists but is a one-time *manual* pass at one milestone, not a continuous gate). No **end-to-end CI/CD** (only a static asset-budget check + "CI both builds"), no staging/preview-promote/rollback story, no **Steam depot-upload automation**, no **compatibility-matrix coverage plan** (tier × backend × platform), and no **playtest/closed-beta program** — yet the entire rich-MVP bet rides on playtest-validated gates, and co-op specifically *cannot* be self-tested for the NAT/partner-drop tax without external network-diverse pairs.

**GTM / community / production.** This is the emptiest axis. No **team/roles map or scope-vs-headcount reconciliation** — "1–2 people" is asserted for slices while the full product needs graphics + netcode + bespoke-AI + technical-art + systems/balance + audio + tools/backend + Electron/Steamworks specialists; the mismatch is arguably the single biggest *unstated* risk to shipping. No **financial budget / funding / runway model** (every "budget" in the doc is a frame-time/draw-call/credit budget; cost line-items are scattered but never summed into burn or break-even). No **player-acquisition / GTM plan** — virality is engineered as a *multiplier* but there is no source of the first ~1,000 players: no web-portal publishing (CrazyGames/Poki/itch as discovery, not just hosting), no Discord/community from Phase 0, no creator/streamer seeding (despite a clip-bait design), no press, no **Steam wishlist/Next-Fest campaign** (the demo's single highest-leverage moment is unmentioned). No **live-ops staffing** for the committed seasonal cadence, and no **support/moderation ops** owner.

**Accessibility / onboarding.** No **caption/subtitle system** — the cheapest high-impact a11y win and the biggest hole, since the entire horror/narrative payload (Conductor VO, Black Box tapes, enemy sound-tells) is audio, the text already exists as `promptText` in the §20 catalog, and deaf/HoH + muted-laptop players (the plan's own flagged web audience) get a narratively-empty game without it. No **photosensitivity/seizure-safety + reduced-motion spec** for a bloom-, flash-, shake-, strobe-heavy design (§8's "cap shake/flash" is readability, not WCAG 2.3.1 flash-rate/luminance/red-flash limits) — real liability on Steam and for a multi-million-play web game. No **FTUE/first-run tutorial** — the §22.4 #7 Quick Start is explicitly *returning*-player-only, leaving a brand-new player dropped cold into manual free-aim + invisible Director + 270° audio threats + unevaluable level-ups, a direct conversion-killer for a 90–180s viral-link audience. No **remappable controls**, no **colorblind support** (load-bearing given the color-coded damage indicator + neon palette), and **i18n covers only VO (Dubbing)** — UI strings, captions, and store text have no externalization plan, so the React UI would harden English-only and retrofit expensively.

**Security / compliance (beyond C1/C2/C6).** No **supply-chain hardening** for the mass-distribution web bundle (lockfile pinning, `npm audit`/Dependabot, **SRI** for the CDN-loaded Draco/KTX2 decoders §10 already flags, a CSP on Pages, vetting the native steamworks.js/Rapier-WASM binaries). No **TURN/signaling cost-abuse** posture (ephemeral TURN credentials so the bundle key can't be lifted and reused; usage cap + graceful degradation when the relay budget is hit, rather than a global co-op outage). No **co-op anti-grief** surface (ping-spam cooldowns, kick/leave-without-penalty, ensuring griefing can't corrupt the survivor's banked score). No **web age rating / content-descriptor** stance for the portals (IARC/ESRB-Teen/PEGI-12-equivalent given cartoon violence + horror audio) to sit alongside the Steam content survey. No **accessibility-compliance posture** (WCAG 2.2 AA for the non-gameplay store/checkout/account/settings UI; EAA enforceable since June 2025 for the EU purchase flow).

### 26.4 Correctly deferred / out-of-scope (don't panic about these)

These *look* missing but are reasonably left for later or already handled — including auditor false-positives the fact-checks caught:

- **Native (Steam) durable saves + identity** — already solved via Steam Cloud + Steam identity (§23.4). The C3 gap is *web-only*; don't double-count it.
- **Steam leaderboard write-path hardening** — fully specified (Trusted Mode, server-only Web API, publisher key, §23.4). The gap is the *web* board only (C5); the auditor's "zero specification" overstated it.
- **Host migration** — deliberately and correctly cut for v1 ("host leaves → end run, play again," §7). Not a gap.
- **Mobile (touch, 30fps tier, iOS-256MB crash guard)** — explicitly deferred post-launch (§22.6 #4). The adaptive-quality/memory discipline still earns its keep on weak desktop iGPUs. Out of scope for launch.
- **Steam SDR transport, Workshop/UGC, host-migration continuation** — all consciously parked behind interfaces as post-launch options (§23.5, §23.4). Correct sequencing.
- **The audio-export pipeline regression test, bug-triage rubric, ad-network brand-safety, DSA/UGC formalities** — real but genuinely later-stage; fold into the QA/legal workstreams when those systems exist, not now.
- **ElevenLabs music license, AI-disclosure, voice-likeness law, asset EULAs, API-key security** — already covered to a high standard (§17.6, §23.4, §20.1). The legal *vendor* axis is done; only the legal *player* axis (C1/C2) is missing. Do not let the thoroughness of the former hide the absence of the latter — that asymmetry is the trap.

### 26.5 The single most important thing to add

**If you do nothing else from this audit, stand up the analytics + crash-telemetry layer (C4) early — at M1, not M2 — because every other "we'll decide with data" promise in this plan (monetize-after-retention, the fun/premium gates, tier validation, the share-loop proof) is unmeasurable and therefore undecidable until it exists.**

### 26.6 Bottom line

**Something important is missing — but nothing that blocks starting.** The plan is genuinely complete enough to begin Phase 0 and M0 immediately; it is one of the most rigorous *engineering and design* plans you'll see. What it has almost none of is the **product, business, and player-trust layer** — no player-facing legal/privacy/COPPA posture, no analytics to prove its own retention thesis, no web identity/durable-save behind its "never lose progress" promise, no plan to acquire the first players the virality is meant to multiply, and no team/budget/runway reconciliation behind the ambitious rich-MVP scope. Build now, but treat C1–C6 as hard gates for the M2 soft-launch and the Steam SKU, and open the GTM/team/budget workstream in parallel with M0 rather than discovering it at launch.

*This completeness audit is recorded as §26.*

---

## Appendix A — Tech & Design Sources

**WebGPU availability & browser support**
- https://web.dev/blog/webgpu-supported-major-browsers · https://caniuse.com/webgpu · https://github.com/gpuweb/gpuweb/wiki/Implementation-Status

**Three.js / R3F / TSL / WebGPU rendering**
- https://threejs.org/manual/en/webgpurenderer.html · https://threejs.org/docs/pages/WebGPURenderer.html · https://threejs.org/docs/pages/TSL.html · https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language · https://github.com/mrdoob/three.js/releases · https://newreleases.io/project/github/mrdoob/three.js/release/r180 · https://r3f.docs.pmnd.rs/ · https://r3f.docs.pmnd.rs/advanced/scaling-performance · https://github.com/pmndrs/react-three-rapier · https://www.utsubo.com/blog/webgpu-threejs-migration-guide · https://www.utsubo.com/blog/threejs-2026-what-changed · https://www.utsubo.com/blog/threejs-best-practices-100-tips · https://discourse.threejs.org/t/webgpu-significant-performance-drop-and-shadow-quality-regression-in-r182-vs-webgl-r170/89322

**Post-processing, lighting, effects**
- https://threejs.org/docs/pages/GTAONode.html · https://threejs.org/examples/webgpu_postprocessing_ssr.html · https://threejs.org/examples/webgpu_shadowmap_csm.html · https://threejs.org/docs/pages/CSM.html · https://github.com/StrandedKitty/three-csm · https://github.com/pmndrs/postprocessing · https://pmndrs.github.io/postprocessing/public/docs/ · https://react-postprocessing.docs.pmnd.rs/effects/bloom · https://react-postprocessing.docs.pmnd.rs/effects/ssao · https://github.com/0beqz/realism-effects · https://wawasensei.dev/tuto/how-to-build-godrays · https://discourse.threejs.org/t/volumetric-lighting-in-webgpu/87959 · https://threejsresources.com/tool/three-good-godrays · https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026 · https://garagefarm.net/blog/baked-lighting-in-3d-a-basic-guide-for-artists-and-designers

**Engine comparisons**
- https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/ · https://blogs.windows.com/windowsdeveloper/2025/03/27/announcing-babylon-js-8-0/ · https://doc.babylonjs.com/setup/support/webGPU · https://playcanvas.com/ · https://github.com/playcanvas/engine · https://blog.playcanvas.com/new-in-supersplat-webgpu-and-streaming-bring-huge-performance-wins/ · https://app.cinevva.com/blog/2026-06-09-web-game-engines-2026-comparison.html · https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison · https://blog.logrocket.com/three-js-vs-babylon-js/ · https://dev.to/devin-rosario/babylonjs-vs-threejs-the-360deg-technical-comparison-for-production-workloads-2fn6 · https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default

**Engines to avoid (Unity / Unreal / Godot / Pixel Streaming)**
- https://ilogos.biz/unity-to-webgl-porting-guide/ · https://docs.unity3d.com/6000.0/Documentation/Manual/web-optimization-mobile.html · https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html · https://gamineai.com/blog/godot-4-5-web-export-wasm-memory-ceiling-h2-2026-browser-demo-trend-playbook · https://medium.com/@FernandoCampos/the-evil-economics-of-pixel-streaming-b2da13a00f51 · https://aws.amazon.com/blogs/gametech/deploy-unreal-engines-pixel-streaming-at-scale-on-aws/ · https://www.strayspark.studio/blog/pixel-streaming-ue5-cloud-gaming-demo

**Performance: instancing, VAT, crowds, pooling, textures, streaming, profiling**
- https://threejsroadmap.com/blog/draw-calls-the-silent-killer · https://threejs.org/docs/pages/InstancedMesh.html · https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/ · https://vrmeup.com/devlog/devlog_10_threejs_instancedmesh_performance_optimizations.html · https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928 · https://github.com/agargaro/instanced-mesh · https://medium.com/@lemapp09/vertex-animation-textures-vat-2ce5e7710774 · https://openvat.org/ · https://www.threejs-blocks.com/examples/webgl_animation_texture_vertex · https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-2-animated-crowd-rendering · https://medium.com/tech-at-wildlife-studios/texture-animation-techniques-1daecb316657 · https://www.donmccurdy.com/2024/02/11/web-texture-formats/ · https://evergine.com/ktx2-texture-compression/ · https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md · https://peerdh.com/blogs/programming-insights/efficient-memory-management-in-javascript-games-a-look-at-object-pooling-techniques · https://egghead.io/blog/object-pool-design-pattern · https://markostankovic.org/projects/endless-runner/ · https://github.com/juwalbose/ThreeJSEndlessRunner3D · https://threejsroadmap.com/blog/webgl-vs-webgpu-explained · https://gjgalante.medium.com/webgl-vs-webgpu-the-performance-gap-fbd121fb221a · https://web.dev/articles/offscreen-canvas · https://webgpufundamentals.org/webgpu/lessons/webgpu-timing.html · https://github.com/brendan-duncan/webgpu_inspector · https://toji.dev/webgpu-profiling/chrome-devtools.html · https://developer.chrome.com/docs/devtools/performance/reference

**Netcode: WebRTC, topology, prediction, TURN, libraries**
- https://developer.mozilla.org/en-US/docs/Games/Techniques/WebRTC_data_channels · https://webrtc.link/en/articles/rtcdatachannel-usage-and-message-size-limits/ · https://jameshfisher.com/2017/01/17/webrtc-datachannel-reliability/ · https://antmedia.io/how-to-create-webrtc-peer-to-peer-communication/ · https://trueconf.com/blog/wiki/turn-and-stun-servers · https://bloggeek.me/webrtcglossary/turn/ · https://developers.cloudflare.com/realtime/turn/faq/ · https://meseta.medium.com/netcode-concepts-part-2-topology-ad64f9f8f1e6 · https://www.snapnet.dev/blog/netcode-architectures-part-1-lockstep/ · https://snapnet.dev/blog/netcode-architectures-part-3-snapshot-interpolation/ · https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html · https://www.gabrielgambetta.com/lag-compensation.html · https://www.gabrielgambetta.com/entity-interpolation.html · https://danieljimenezmorales.github.io/2025-06-20-client-side-prediction-and-server-reconciliation/ · https://www.webgamedev.com/backend/webrtc · https://github.com/rameshvarun/netplayjs · https://github.com/geckosio/geckos.io · https://peerjs.com/ · https://docs.joinplayroom.com/ · https://blog.photonengine.com/photon-multiplayer-webgl-for-game-jams/ · https://doc.photonengine.com/fusion/2-shared/fusion-shared-intro · https://www.photonengine.com/fusion/pricing · https://www.researchgate.net/publication/390559425_The_Host_Migration_Graveyard_A_feasibility_study_in_co-op_games · https://edgegap.com/blog/cheaters-peer-to-peer-hosting-an-beginners-guide · https://www.rtcinsights.com/blog/stun-turn-configuration/ · https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization

**Game design, virality, monetization**
- https://www.lostatticgames.com/post/how-vampire-survivors-made-me-rethink-the-concept-of-the-core-gameplay-loop · https://www.kokutech.com/blog/gamedev/design-patterns/power-fantasy/vampire-survivors · https://www.dash.hrecos.org/guide/206/6AD/H6Zy2J/VampireSurvivorsProgressionGuide · https://www.blog.udonis.co/top-games/games-like-subway-surfers · https://left4dead.fandom.com/wiki/The_Director · https://www.escapistmagazine.com/back-4-blood-game-director-lacks-tension-left-4-dead-ai-director/ · https://hastewire.com/blog/ai-director-explained-dynamic-difficulty-in-vermintide · https://www.gamigion.com/sharable-moments-of-joy-new-formula-to-viral-game-design/ · https://sunstrikestudios.com/en/blog/the_best_roguelite_games_to_play_in_2025/ · https://lordsofgaming.net/2025/12/roguelike-thats-old-news-survivors-like-is-the-new-wave/ · https://www.gamedeveloper.com/business/how-i-crossy-road-i-made-1-million-from-video-ads · https://www.pocketgamer.biz/what-can-you-learn-from-crossy-road/ · https://www.daydreamsoft.com/blog/ethical-monetization-system-design-earning-revenue-without-losing-player-trust · https://www.gamemakers.com/p/understanding-battle-pass-game-design · https://haerting.de/en/insights/loot-boxes-battle-pass-law/

**Combat & enemy systems**
- https://www.cs.drexel.edu/~santi/teaching/2012/CS680/papers/11%20Secrets%20about%20LEFT%204%20DEAD%E2%80%99s%20AI%20Director... · https://www.oreateai.com/blog/hitscan-vs-projectile-understanding-the-mechanics-of-shooting-games/72da7724974f6c8418156eb137e1ad5d · https://aiming.pro/hit-scan-projectiles-fps · https://medium.com/@geretti/netcode-series-part-4-projectiles-96427ac53633 · https://www.gameaipro.com/GameAIPro/GameAIPro_Chapter23_Crowd_Pathfinding_and_Steering_Using_Flow_Field_Tiles.pdf · https://www.gameaipro.com/GameAIPro2/GameAIPro2_Chapter17_Advanced_Techniques_for_Robust_Efficient_Crowds.pdf · https://www.jdxdev.com/blog/2020/05/03/flowfields/ · https://vermintide2.fandom.com/wiki/Difficulty · https://dev.to/mattvb91/realistic-ragdoll-physics-in-threejs-1pko · https://github.com/mattvb91/rapierjs-ragdoll · https://discourse.threejs.org/t/rapier-vs-cannon-performance/53475 · https://en.wikipedia.org/wiki/Third-person_shooter · https://www.gamedeveloper.com/design/everything-i-learned-about-dual-stick-shooter-controls · https://roguestarrescue.com/blog/effective-aim-assist-in-2d-shooters/

**Asset pipeline, sourcing, AI generation, audio**
- https://quaternius.com/ · https://kenney.itch.io/kenney-game-assets · https://app.cinevva.com/guides/game-asset-licenses.html · https://github.com/madjin/awesome-cc0 · https://www.meshy.ai/blog/best-ai-tools-for-3d-game-assets · https://help.meshy.ai/en/articles/10137554-what-is-the-ownership-of-the-generated-models · https://nhance-school.com/articles/best-ai-3d-generators-2026 · https://dupple.com/tools/rodin-ai · https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html · https://www.licenseorg.com/guide/3d-assets/mixamo · https://superhivemarket.com/products/auto-rig-pro · https://quixel.com/en-US/license · https://www.strayspark.studio/blog/quixel-to-fab-migration-indie-developer-survival-guide-2026 · https://gltf-transform.dev/ · https://github.com/pmndrs/gltfjsx · https://gltf.pmnd.rs/ · https://elevenlabs.io/sound-effects/commercial · https://freesound.org/ · https://engine.needle.tools/docs/how-to-guides/optimization/ · https://threejs.org/docs/pages/GLTFLoader.html

---

---

## Appendix B — Audio & Story Sources

**ElevenLabs — products, API, prompting, pipeline**
- https://elevenlabs.io/api · https://elevenlabs.io/music-api · https://elevenlabs.io/pricing · https://elevenlabs.io/sound-effects · https://elevenlabs.io/sound-effects/commercial
- https://elevenlabs.io/docs/overview/capabilities/sound-effects · https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert · https://elevenlabs.io/docs/overview/capabilities/music · https://elevenlabs.io/docs/overview/capabilities/music/best-practices · https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans · https://elevenlabs.io/docs/api-reference/music/separate-stems · https://elevenlabs.io/docs/overview/capabilities/text-to-speech · https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices · https://elevenlabs.io/docs/changelog · https://elevenlabs.io/docs/changelog/2026/6/22
- https://elevenlabs.io/blog/voice-design-v3 · https://elevenlabs.io/blog/v3-audiotags · https://elevenlabs.io/blog/eleven-v3-audio-tags-expressing-emotional-context-in-speech · https://elevenlabs.io/blog/eleven-music-new-tools-for-exploring-editing-and-producing-music-with-ai · https://elevenlabs.io/blog/how-we-created-a-soundboard-using-elevenlabs-sfx-api · https://www.webfuse.com/elevenlabs-cheat-sheet · https://www.provideocoalition.com/ai-tools-elevenlabs-v3-voices-sfx-eleven-music/

**ElevenLabs — licensing, terms, pricing analysis (fact-check sources)**
- https://elevenlabs.io/terms-of-use · https://elevenlabs.io/eleven-music-model-specific-terms · https://elevenlabs.io/music-terms · https://terms.law/ai-output-rights/elevenlabs/ · https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/ · https://www.mindstudio.ai/blog/elevenlabs-music-v2-commercial-content-licensed-ai-music · https://the-decoder.com/elevenlabs-launches-eleven-music-an-ai-music-generator-cleared-for-broad-commercial-use/ · https://music.ai/news/music-tech/elevenlabs-launches-text-to-music-generator-with-licensing-deals/ · https://variety.com/2026/biz/news/stan-lee-elevenlabs-licensed-voice-likeness-1236759225/

**Horror audio design, adaptive music, voice-as-fear**
- https://robsummers.co.uk/unveiling-the-terrifying-secrets-of-sound-in-horror-games/ · https://medium.com/@GameAudio/the-art-of-fear-the-psychology-of-sound-design-in-horror-games-d85b9854c3b0 · https://www.geniuscrate.com/the-role-of-sound-design-in-horror-games-how-audio-creates-fear · https://horrorchronicles.com/horror-games-and-sound-design/ · https://splice.com/blog/horror-video-games-sound-design/ · https://www.originalsoundversion.com/dead-space-sound-design-in-space-no-one-can-hear-interns-scream-they-are-dead-interview/ · https://gameinformer.com/b/features/archive/2009/12/11/feature-noises-in-the-dark-exploring-the-sounds-of-dead-space.aspx
- https://www.thegameaudioco.com/making-your-game-s-music-more-dynamic-vertical-layering-vs-horizontal-resequencing · https://www.thegameaudioco.com/the-role-of-adaptive-music-in-creating-imersive-game-worlds · https://splice.com/blog/adaptive-music-video-games/ · https://www.strayspark.studio/blog (Wwise/FMOD/MetaSounds 2026 middleware reference)
- https://www.thegamer.com/sound-effect-luigi-mansion-sountrack-mood/ · https://tvtropes.org/pmwiki/pmwiki.php/NightmareFuel/LuigisMansion · https://www.dualshockers.com/left-4-dead-weaponizes-hearing/ · https://left4dead.fandom.com/wiki/Audio_Cues · https://nygamecritics.com/2025/10/14/the-insight-static-dread-the-lighthouse-bewitched-our-horror-averse-intern/ · https://www.oreateai.com/blog/beyond-the-static-crafting-eerie-narratives-with-analog-horror-texttospeech/ff7fd8c4916680f6b1092078670c4873 · https://elevenlabs.io/voice-library/horror

**Web audio implementation**
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API · https://github.com/goldfire/howler.js/ · https://github.com/goldfire/howler.js/blob/master/examples/3d/README.md · https://www.pkgpulse.com/guides/howler-vs-tone-js-vs-wavesurfer-web-audio-javascript-2026

**Narrative / tone references**
- Zombieland (rules-as-comedy) · Left 4 Dead (AI Director + gallows-humor barks) · Snowpiercer (perpetual-motion train as escalating biomes) · Stranger Things (warm Americana, underlying dread) · Gremlins / Little Shop of Horrors (cute exterior, real menace)

---

## Appendix C — Slice & Console Sources

**Three.js / R3F / WebGPU / TSL post-processing & look-dev**
- https://threejs.org/docs/pages/WebGPURenderer.html · https://threejs.org/docs/pages/GTAONode.html · https://threejs.org/examples/webgpu_postprocessing_traa.html · https://threejs.org/examples/webgpu_postprocessing_motion_blur.html · https://github.com/pmndrs/postprocessing · https://github.com/0beqz/realism-effects · https://discourse.threejs.org/t/webgpu-r181-fyi-stats-gl-no-longer-compatible-with-webgpu/87944 · https://discourse.threejs.org/t/r3f-webgpu-webgl2-fallback-tree-shaking/87188 · https://github.com/brendan-duncan/webgpu_inspector · https://www.utsubo.com/blog/threejs-2026-what-changed · https://www.utsubo.com/blog/webgpu-threejs-migration-guide · https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/

**ElevenLabs API — SFX, music, voice, voice design, usage/cost**
- https://elevenlabs.io/docs/api-reference/introduction · https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert · https://elevenlabs.io/docs/overview/capabilities/sound-effects · https://elevenlabs.io/docs/api-reference/music/compose · https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans · https://elevenlabs.io/docs/api-reference/music/separate-stems · https://elevenlabs.io/docs/api-reference/music/stream · https://elevenlabs.io/music-api · https://elevenlabs.io/docs/overview/capabilities/music · https://elevenlabs.io/docs/api-reference/text-to-speech/convert · https://elevenlabs.io/docs/api-reference/text-to-voice/design · https://elevenlabs.io/docs/overview/models · https://elevenlabs.io/blog/v3-audiotags · https://elevenlabs.io/blog/eleven-v3-audio-tags-expressing-emotional-context-in-speech · https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices · https://elevenlabs.io/docs/api-reference/user/subscription/get · https://elevenlabs.io/docs/api-reference/user

**ElevenLabs — security, licensing, rate limits, pricing (fact-check sources)**
- https://elevenlabs.io/docs/api-reference/authentication · https://elevenlabs.io/blog/api-authentication-and-key-management · https://elevenlabs.io/terms-of-use · https://elevenlabs.io/eleven-music-model-specific-terms · https://help.elevenlabs.io/hc/en-us/articles/14312733311761-How-many-requests-can-I-make-and-can-I-increase-it · https://help.elevenlabs.io/hc/en-us/articles/19571824571921-API-Error-Code-429 · https://elevenlabs.io/pricing/api · https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/

**Cloudflare backend (Pages Functions / R2 / D1 / Workers)**
- https://developers.cloudflare.com/pages/functions/bindings/ · https://developers.cloudflare.com/r2/platform/limits/ · https://developers.cloudflare.com/d1/platform/limits/ · https://developers.cloudflare.com/workers/platform/storage-options/ · https://developers.cloudflare.com/workers/platform/limits/

---

---

## Appendix D — Player-Sentiment Sources

*Deduped across the six research domains. Sources already cited in Appendix A–C (L4D Director, Crossy Road monetization, Vampire Survivors, ElevenLabs licensing, etc.) are not repeated here.*

**Survivors-like / horde-roguelite sentiment**
- https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors · https://www.natrowley.com/the-addictive-nature-of-vampire-survivors/ · https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613 · https://hackernoon.com/the-vampire-survivors-effect-how-developers-utilize-gambling-psychology-to-create-addictive-games · https://store.steampowered.com/app/2218750/ (Brotato) · https://steamcommunity.com/app/2218750/reviews/?browsefilter=toprated · https://www.metacritic.com/game/brotato/ · https://steamcommunity.com/app/2334730/discussions/ (Halls of Torment) · https://store.steampowered.com/app/2321470/Deep_Rock_Galactic_Survivor/ · https://steamcommunity.com/app/2066020/discussions/ (Soulstone Survivors) · https://steamcommunity.com/app/1966900/discussions/ (Death Must Die) · https://www.gamesradar.com/games/action/vampire-survivors-kicked-off-a-game-development-gold-rush-but-has-a-legitimately-new-genre-emerged-between-the-cash-ins/ · https://rogueliker.com/bullet-heaven-games-like-vampire-survivors/ · https://gamerant.com/roguelite-games-with-best-progression-systems/ · https://poncle.games/vs-online-faq · https://coherence.io/blog/tradecraft/vampire-survivors-online-coop-case-study

**Co-op horde / zombie shooters**
- https://www.escapistmagazine.com/back-4-blood-game-director-lacks-tension-left-4-dead-ai-director/ · https://www.gamedeveloper.com/design/why-i-left-4-dead-i-works · https://www.dualshockers.com/left-4-dead-weaponizes-hearing/ · https://www.superjumpmagazine.com/what-sunk-back-4-blood/ · https://cyberpost.co/why-did-back-4-blood-fail/ · https://forums.fatsharkgames.com/t/sound-cue-improvements/66497 · https://gamerant.com/warhammer-40k-darktide-the-audio-and-visual-cues-for-each-elite-specialist-enemy/ · https://80.lv/articles/helldivers-2-s-dev-confirms-friendly-fire-stays-in-the-game · https://edgegap.com/blog/host-migration-in-peer-to-peer-or-relay-based-multiplayer-games · https://screenrant.com/helldivers-2-matchmaking-coop-multiplayer-quickplay/ · https://www.windowscentral.com/gaming/helldivers-2-reviews-drop-to-mostly-negative-on-steam-after-controversial-update-and-ama-arrowhead-responds · https://kotaku.com/helldivers-2-steam-reviews-mostly-negative-nerf-warbonds-bugs-patch-2000694354 · https://www.destructoid.com/deep-rock-galactic-defeats-fomo-by-letting-you-play-old-seasons-whenever-wherever/ · https://www.pcgamer.com/live-service-keeps-killing-modestly-successful-multiplayer-games-and-it-doesnt-have-to-be-this-way/

**Browser / web / .io**
- https://news.ycombinator.com/item?id=45396441 · https://news.ycombinator.com/item?id=34461808 (tiny-planet) · https://news.ycombinator.com/item?id=22020179 (Summer Afternoon) · https://ca.trustpilot.com/review/crazygames.com · https://docs.crazygames.com/requirements/ads/ · https://steambase.io/games/krunker/reviews · https://www.marketingdive.com/news/google-53-of-mobile-users-abandon-sites-that-take-over-3-seconds-to-load/426070/ · https://discussions.unity.com/t/webgl-memory-increment-issue-and-crash-on-ios/894771 · https://web.dev/ready-player-web/ · https://news.viverse.com/post/what-are-io-games · https://doodleduel.ai/blog/multiplayer-games-mobile-browser-no-app

**Horror sentiment / cute-creepy / co-op horror**
- https://www.wayline.io/blog/silence-is-scary-sound-design-horror-games · https://www.geniuscrate.com/how-does-audio-design-shape-fear-in-horror-games · https://gamerant.com/cult-of-the-lamb-devs-talk-inspirations-and-the-juxtaposition-of-cute-and-horror/ · https://medium.com/super-jump/little-nightmares-and-the-beauty-of-horror-aesthetics-b60141e6118a · https://www.thegamer.com/cute-horror-games-mild-not-scary-unsettling/ · https://volofduty.com/why-is-mascot-horror-so-popular/ · https://www.michigandaily.com/arts/digital-culture/what-mascot-horror-has-done-for-gaming/ · https://www.gamesradar.com/games/survival-horror/indie-devs-discuss-why-low-poly-works-so-well-for-horror-i-actually-think-those-limitations-encourage-weird-unique-compromises/ · https://www.gamedesignlibrary.com/post/proximity-chat-changes-the-game-how-lethal-company-s-game-design-innovated-multiplayer-horror-games · https://tiesthatbindgaming.com/insights/video-games/jump-scares-in-horror-video-games/ · https://www.resetera.com/threads/what-genre-do-you-prefer-for-resident-evil-survival-horror-or-action-horror.858810/ · https://survivalhorrors.com/survival-horror-vs-action-horror · https://www.cbr.com/action-horror-games-deserve-more-love/

**Endless-runner / short-session / viral / leaderboards**
- https://ultragamehub.com/temple-run-vs-subway-surfers-which-endless-runner-is-better-in-2025/ · https://www.kidobum.com/blogs/tactical-briefing/what-makes-a-game-tiktok-friendly-in-2026-the-viral-formula-for-party-games · https://www.pcgamer.com/games/roguelike/after-cheaters-broke-steams-most-popular-roguelikes-leaderboards-its-dev-issued-a-fix-and-a-warning/ · https://slay-the-spire.fandom.com/wiki/Daily_Challenge · https://spelunky.fandom.com/wiki/Daily_Challenge_Mode_(HD) · https://appfollow.io/blog/what-mobile-game-players-want-monetization-insights-from-app-store-reviews · https://www.resetera.com/threads/are-time-limited-battlepasses-predatory-that-you-can-circumvent-with-money-due-to-fomo.755518/ · https://supersonic.com/learn/blog/how-to-improve-the-ltv-of-your-hyper-casual-game/ · https://ilogos.biz/mobile-game-web-porting-failures-fixes/

**Train / mashup / zombie-saturation niche**
- https://kotaku.com/every-game-should-have-a-train-level-1846192416 · https://blacknerdproblems.com/are-zombies-in-games-overrated/ · https://store.steampowered.com/app/4458010/Fright_Train_Demo/ · https://store.steampowered.com/app/4601120/Endless_Rails/ · https://store.steampowered.com/app/1708950/Battle_Train/ · https://store.steampowered.com/app/3359330/Crystal_Rail/ · https://www.tasteray.com/articles/movie-genre-blend-movies · https://www.denofgeek.com/games/resident-evil-4-remake-scary-graphics-comparison-original-campy/ · https://www.thegamer.com/video-games-best-mutants/ · https://www.xda-developers.com/2025-comeback-zombie-games/ · https://redharegames.wordpress.com/2023/10/16/simple-article-the-undying-popularity-of-zombies-in-games-and-media/

**AI-audio reception (voice/music/SFX) — fact-check-weighted**
- https://quanticfoundry.com/2025/12/18/gen-ai/ · https://www.midiaresearch.com/blog/new-research-what-do-gamers-really-think-about-generative-ai-in-games · https://www.gamespot.com/articles/genai-in-games-most-players-just-dont-care-study-finds/1100-6538972/ · https://www.pcgamer.com/software/ai/data-analyst-finds-ai-stigma-on-steam-can-reduce-the-number-of-reviews-a-game-gets-by-around-53-percent-and-the-reviews-it-does-get-are-more-negative/ · https://www.windowscentral.com/gaming/pc-gaming/ai-game-development-stigma-study · https://www.totallyhuman.io/blog/games-with-ai-disclosures-have-grossed-an-estimated-660m-on-steam · https://www.gamespot.com/articles/arc-raiders-is-my-game-of-the-year-but-its-use-of-generative-ai-really-sucks/1100-6537140/ · https://kotaku.com/arc-raiders-replaced-ai-generated-content-human-recorded-dialogue-voices-2000678774 · https://variety.com/2025/gaming/news/sag-aftra-fortnite-ai-darth-vader-unfair-labor-practices-james-earl-jones-1236403553/ · https://yougov.com/articles/50496-gamers-see-a-role-for-ai-in-gaming-but-not-at-the-expense-of-humans · https://www.pcgamer.com/games/rpg/rpg-dev-pushes-back-against-steam-review-ai-accusations/ · https://www.3daistudio.com/3d-generator-ai-comparison-alternatives-guide/can-i-use-ai-for-indie-game-assets · https://gamedo.live/news/elevenlabs-voice-acting-indie-games/

---

---

---

## Appendix E — Multi-Platform Sources

*Deduped; sources already in Appendices A–D (PlayroomKit, Cloudflare TURN/Pages/R2/D1, ElevenLabs licensing, detect-gpu where already cited, three.js WebGPURenderer/KTX2, Vampire-Survivors case study) are not repeated here.*

**WebGPU in webviews — Safari / WKWebView / WebView2 (the Tauri-rejection evidence)**
- https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ · https://web.dev/blog/webgpu-supported-major-browsers · https://developer.apple.com/forums/thread/770862 · https://github.com/rerun-io/rerun/issues/10609 · https://github.com/tauri-apps/tauri/issues/6381 · https://github.com/tauri-apps/tauri/issues/12846 · https://v2.tauri.app/reference/webview-versions/ · https://developer.chrome.com/blog/webgpu-release

**Desktop packaging — Electron / NW.js / Tauri comparison, code-signing, native fidelity**
- https://www.webgamedev.com/publishing/desktop · https://www.electronjs.org/blog/electron-38-0 · https://www.electron.build/docs/features/code-signing/ · https://www.electronjs.org/docs/latest/tutorial/code-signing · https://rustify.rs/articles/rust-tauri-vs-electron-2026 · https://www.pkgpulse.com/guides/electron-vs-tauri-2026 · https://tech-insider.org/tauri-vs-electron-2026/ · https://github.com/gpuweb/gpuweb (limits/buckets, anti-fingerprinting) · https://liana.one/integrate-electron-steam-api-steamworks

**Steamworks SDK — bindings, leaderboards, networking/SDR, lobbies, microtransactions, Deck**
- https://github.com/ceifa/steamworks.js/ · https://deepwiki.com/ceifa/steamworks.js/6.1-electron-integration · https://github.com/ArtyProf/steamworks-ffi-node · https://github.com/greenheartgames/greenworks · https://partner.steamgames.com/doc/features/leaderboards · https://partner.steamgames.com/doc/features/leaderboards/guide · https://partner.steamgames.com/doc/webapi/isteamleaderboards · https://partner.steamgames.com/doc/api/ISteamUserStats · https://partner.steamgames.com/doc/features/multiplayer/steamdatagramrelay · https://partner.steamgames.com/doc/features/multiplayer/networking · https://partner.steamgames.com/doc/api/ISteamNetworkingSockets · https://github.com/ValveSoftware/GameNetworkingSockets · https://partner.steamgames.com/doc/api/isteamfriends · https://partner.steamgames.com/doc/api/ISteamMatchmaking · https://partner.steamgames.com/doc/features/multiplayer/matchmaking · https://partner.steamgames.com/doc/features/enhancedrichpresence · https://partner.steamgames.com/doc/features/microtransactions · https://partner.steamgames.com/doc/features/microtransactions/implementation · https://partner.steamgames.com/doc/features/anticheat

**Steam — AI disclosure, store/business, Early Access, Deck Verified, Proton**
- https://store.steampowered.com/news/group/4145017/view/3862463747997849618 · https://partner.steamgames.com/doc/gettingstarted/contentsurvey · https://www.gamedeveloper.com/business/valve-tweaks-and-clarifies-ai-disclosure-rules-for-steam · https://www.pcgamer.com/software/ai/steam-updates-ai-disclosure-form-to-specify-that-its-focused-on-ai-generated-content-that-is-consumed-by-players-not-efficiency-tools-used-behind-the-scenes/ · https://partner.steamgames.com/doc/store/freetoplay · https://partner.steamgames.com/doc/store/pricing · https://partner.steamgames.com/doc/gettingstarted/appfee · https://partner.steamgames.com/doc/sdk_access_agreement/ · https://partner.steamgames.com/doc/store/earlyaccess · https://partner.steamgames.com/doc/marketing/wishlist · https://partner.steamgames.com/doc/marketing/discounts · https://partner.steamgames.com/doc/store/application/demos · https://partner.steamgames.com/doc/steamdeck/compat · https://partner.steamgames.com/doc/steamdeck/proton · https://www.gamingonlinux.com/2025/05/valve-announce-steamos-compatibility-ratings-an-extension-of-steam-deck-verified-for-more-devices/ · https://github.com/ValveSoftware/steam-runtime/issues/579 · https://github.com/ValveSoftware/Proton/issues/8154 · https://klaothongchan.medium.com/publishing-a-game-on-steam-and-epic-in-2025-a-practical-postmortem-0f1d6593dd58

**Quality tiers — detect-gpu, KTX2/Basis, upscaling, VRAM reality**
- https://github.com/pmndrs/detect-gpu · https://www.npmjs.com/package/detect-gpu · https://www.khronos.org/ktx/ · https://texturecompression.com/ktx2 · https://piclab.click/en/articles/image-format-for-games/ · https://discourse.threejs.org/t/temporal-upscaling-webgpu/89989 · https://ravespace.io/blog/webgpu-in-three-js · https://www.pcgamer.com/hardware/gaming-pcs/seriously-people-its-fine-the-steam-machine-has-just-8-gb-of-vram-but-valve-ought-to-chill-out-on-the-play-every-game-at-4k60-chat/ · https://www.noobfeed.com/hardware/8gb-vram-1080p-4k-gaming

---
