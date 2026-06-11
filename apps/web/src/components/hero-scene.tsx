"use client";

/**
 * Hero background scene — "the lark catches the earlier date".
 *
 * A stylized low-poly wireframe globe with soft points at consulate cities
 * slowly rotates; thin arcs rise from cities to a floating calendar-card
 * cluster. Periodically one calendar slot "pings": a tiny lark-blue/feather
 * particle flies from a city to the slot, the slot pulses, and a gentle
 * bell-ring ripple expands.
 *
 * Plain three.js (no react-three-fiber). Loaded via next/dynamic ssr:false.
 * Graceful fallback: when WebGL is unavailable or the user prefers reduced
 * motion we render nothing and report `active=false`, so the static hero
 * visuals stay exactly as they were.
 *
 * Performance: devicePixelRatio capped at 2, the loop pauses when the hero is
 * offscreen or the tab is hidden, and everything is disposed on unmount.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HeroSceneProps {
  /** Reports whether the 3D scene is actually running (for the static fallback). */
  onActiveChange?: (active: boolean) => void;
  className?: string;
}

/* ---------- brand palette (from tailwind.config.ts lark/feather scales) ---------- */
const PALETTE = {
  light: {
    wire: 0x8ec6ff, // lark-300
    wireOpacity: 0.4,
    city: 0x1f66f0, // lark-600
    cityGlow: 0x59a6ff, // lark-400
    arc: 0x3385fb, // lark-500
    arcOpacity: 0.22,
    card: 0xffffff,
    cardEdge: 0xbcdcff, // lark-200
    slot: 0xd9ecff, // lark-100
    slotActive: 0x3385fb, // lark-500
    feather: 0xff9d37, // feather-400
    ripple: 0x59a6ff, // lark-400
  },
  dark: {
    wire: 0x1850dc, // lark-700
    wireOpacity: 0.5,
    city: 0x59a6ff, // lark-400
    cityGlow: 0x8ec6ff, // lark-300
    arc: 0x59a6ff, // lark-400
    arcOpacity: 0.25,
    card: 0x101a30,
    cardEdge: 0x1b3b8c, // lark-900
    slot: 0x152555, // lark-950
    slotActive: 0x59a6ff, // lark-400
    feather: 0xffc070, // feather-300
    ripple: 0x8ec6ff, // lark-300
  },
} as const;

/* Consulate cities shown as soft points on the globe (lat, lon). */
const CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "Beijing", lat: 39.9, lon: 116.4 },
  { name: "Shanghai", lat: 31.2, lon: 121.5 },
  { name: "Guangzhou", lat: 23.1, lon: 113.3 },
  { name: "Shenyang", lat: 41.8, lon: 123.4 },
  { name: "Chengdu", lat: 30.6, lon: 104.1 },
  { name: "Wuhan", lat: 30.6, lon: 114.3 },
  { name: "Hong Kong", lat: 22.3, lon: 114.2 },
  { name: "Tokyo", lat: 35.7, lon: 139.7 },
  { name: "Osaka", lat: 34.7, lon: 135.5 },
  { name: "Seoul", lat: 37.6, lon: 127.0 },
  { name: "Singapore", lat: 1.35, lon: 103.8 },
  { name: "Toronto", lat: 43.7, lon: -79.4 },
  { name: "Vancouver", lat: 49.3, lon: -123.1 },
  { name: "Mexico City", lat: 19.4, lon: -99.1 },
];

const GLOBE_RADIUS = 1.5;
const ARC_CITIES = [0, 1, 7, 9]; // Beijing, Shanghai, Tokyo, Seoul
const ARC_POINTS = 40;

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Soft radial-gradient sprite used for the city points. */
function makeGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function HeroScene({ onActiveChange, className }: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !hasWebGL()) {
      onActiveRef.current?.(false);
      return;
    }

    /* ---------- renderer / scene / camera ---------- */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onActiveRef.current?.(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const canvasEl = renderer.domElement;
    canvasEl.style.display = "block";
    canvasEl.style.width = "100%";
    canvasEl.style.height = "100%";
    container.appendChild(canvasEl);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    const CAMERA_Z = 7.2;
    camera.position.set(0, 0, CAMERA_Z);

    const isDark = () => document.documentElement.classList.contains("dark");
    let colors = isDark() ? PALETTE.dark : PALETTE.light;

    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(d: T): T => {
      disposables.push(d);
      return d;
    };

    /* ---------- globe ---------- */
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const icoGeo = track(new THREE.IcosahedronGeometry(GLOBE_RADIUS, 2));
    const wireGeo = track(new THREE.WireframeGeometry(icoGeo));
    const wireMat = track(
      new THREE.LineBasicMaterial({ color: colors.wire, transparent: true, opacity: colors.wireOpacity }),
    );
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    globeGroup.add(wire);

    // Faint inner sphere so the wireframe reads as a solid-ish globe.
    const innerMat = track(
      new THREE.MeshBasicMaterial({ color: colors.wire, transparent: true, opacity: 0.05, side: THREE.BackSide }),
    );
    const inner = new THREE.Mesh(icoGeo, innerMat);
    inner.scale.setScalar(0.985);
    globeGroup.add(inner);

    // Soft city points.
    const glowTex = track(makeGlowTexture());
    const cityPositions = CITIES.map((c) => latLonToVec3(c.lat, c.lon, GLOBE_RADIUS * 1.005));
    const cityGeo = track(new THREE.BufferGeometry().setFromPoints(cityPositions));
    const cityMat = track(
      new THREE.PointsMaterial({
        map: glowTex,
        color: colors.city,
        size: 0.16,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    const cityPoints = new THREE.Points(cityGeo, cityMat);
    globeGroup.add(cityPoints);

    // Slightly larger halo layer behind the points.
    const haloMat = track(
      new THREE.PointsMaterial({
        map: glowTex,
        color: colors.cityGlow,
        size: 0.34,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    const cityHalo = new THREE.Points(cityGeo, haloMat);
    globeGroup.add(cityHalo);

    /* ---------- calendar-card cluster ---------- */
    const calendarGroup = new THREE.Group();
    scene.add(calendarGroup);

    const cardGeo = track(new THREE.PlaneGeometry(1.5, 1.12));
    const cardMat = track(
      new THREE.MeshBasicMaterial({ color: colors.card, transparent: true, opacity: 0.85 }),
    );
    const mainCard = new THREE.Mesh(cardGeo, cardMat);
    calendarGroup.add(mainCard);

    const cardEdgeGeo = track(new THREE.EdgesGeometry(cardGeo));
    const cardEdgeMat = track(
      new THREE.LineBasicMaterial({ color: colors.cardEdge, transparent: true, opacity: 0.9 }),
    );
    mainCard.add(new THREE.LineSegments(cardEdgeGeo, cardEdgeMat));

    // Header bar on the calendar card (lark blue strip).
    const headerGeo = track(new THREE.PlaneGeometry(1.5, 0.16));
    const headerMat = track(new THREE.MeshBasicMaterial({ color: colors.arc, transparent: true, opacity: 0.85 }));
    const header = new THREE.Mesh(headerGeo, headerMat);
    header.position.set(0, 1.12 / 2 - 0.08, 0.002);
    mainCard.add(header);

    // 7 × 4 slot grid.
    const SLOT_COLS = 7;
    const SLOT_ROWS = 4;
    const slotGeo = track(new THREE.PlaneGeometry(0.14, 0.14));
    const slots: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
    const gridW = SLOT_COLS * 0.19;
    const gridH = SLOT_ROWS * 0.19;
    for (let r = 0; r < SLOT_ROWS; r++) {
      for (let c = 0; c < SLOT_COLS; c++) {
        const m = track(new THREE.MeshBasicMaterial({ color: colors.slot, transparent: true, opacity: 0.9 }));
        const slot = new THREE.Mesh(slotGeo, m);
        slot.position.set(
          -gridW / 2 + 0.095 + c * 0.19,
          -0.14 - gridH / 2 + 0.095 + (SLOT_ROWS - 1 - r) * 0.19 + 0.18,
          0.004,
        );
        mainCard.add(slot);
        slots.push(slot);
      }
    }

    // Two smaller ghost cards floating behind the main one.
    const ghostGeo = track(new THREE.PlaneGeometry(0.9, 0.66));
    const ghostEdges = track(new THREE.EdgesGeometry(ghostGeo));
    for (const [gx, gy, gz, go] of [
      [-0.75, -0.55, -0.35, 0.5],
      [0.55, 0.62, -0.55, 0.35],
    ] as const) {
      const gm = track(new THREE.MeshBasicMaterial({ color: colors.card, transparent: true, opacity: 0.3 * go + 0.15 }));
      const ghost = new THREE.Mesh(ghostGeo, gm);
      const gem = track(new THREE.LineBasicMaterial({ color: colors.cardEdge, transparent: true, opacity: go }));
      ghost.add(new THREE.LineSegments(ghostEdges, gem));
      ghost.position.set(gx, gy, gz);
      ghost.rotation.set(0.04, -0.12, 0.03);
      calendarGroup.add(ghost);
    }

    /* ---------- persistent arcs: cities → calendar ---------- */
    const arcMats: THREE.LineBasicMaterial[] = [];
    const arcs = ARC_CITIES.map(() => {
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ARC_POINTS * 3), 3));
      const mat = track(
        new THREE.LineBasicMaterial({ color: colors.arc, transparent: true, opacity: colors.arcOpacity }),
      );
      arcMats.push(mat);
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      scene.add(line);
      return line;
    });

    const tmpV1 = new THREE.Vector3();
    const tmpV2 = new THREE.Vector3();
    const tmpV3 = new THREE.Vector3();
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());

    function arcTarget(out: THREE.Vector3): THREE.Vector3 {
      // Bottom edge of the main calendar card, world space.
      return out.set(0, -0.62, 0).applyMatrix4(mainCard.matrixWorld);
    }

    function updateArc(line: THREE.Line, cityIdx: number) {
      const start = tmpV1.copy(cityPositions[cityIdx]!).applyMatrix4(globeGroup.matrixWorld);
      const end = arcTarget(tmpV2);
      const mid = tmpV3.addVectors(start, end).multiplyScalar(0.5);
      mid.y += 0.9;
      mid.z += 0.35;
      curve.v0.copy(start);
      curve.v1.copy(mid);
      curve.v2.copy(end);
      const attr = (line.geometry as THREE.BufferGeometry).getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < ARC_POINTS; i++) {
        curve.getPoint(i / (ARC_POINTS - 1), tmpV1);
        attr.setXYZ(i, tmpV1.x, tmpV1.y, tmpV1.z);
      }
      attr.needsUpdate = true;
    }

    /* ---------- ping effects: feather particle + slot pulse + ripple ---------- */
    const featherGeo = track(new THREE.PlaneGeometry(0.09, 0.05));
    const featherMat = track(
      new THREE.MeshBasicMaterial({ color: colors.feather, transparent: true, opacity: 0, depthWrite: false }),
    );
    const feather = new THREE.Mesh(featherGeo, featherMat);
    feather.visible = false;
    scene.add(feather);

    const featherTrailMat = track(
      new THREE.SpriteMaterial({ map: glowTex, color: colors.feather, transparent: true, opacity: 0, depthWrite: false }),
    );
    const featherTrail = new THREE.Sprite(featherTrailMat);
    featherTrail.scale.setScalar(0.22);
    scene.add(featherTrail);

    const rippleGeo = track(new THREE.RingGeometry(0.085, 0.1, 40));
    const rippleMat = track(
      new THREE.MeshBasicMaterial({ color: colors.ripple, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    ripple.visible = false;
    scene.add(ripple);

    const featherCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    );

    interface Ping {
      phase: "fly" | "ring" | "idle";
      t: number;
      slot: number;
      nextAt: number;
    }
    const ping: Ping = { phase: "idle", t: 0, slot: 0, nextAt: 1.6 };

    /* ---------- layout (responsive to aspect) ---------- */
    function layout(width: number, height: number) {
      const aspect = width / Math.max(height, 1);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const wide = aspect >= 1.05;
      if (wide) {
        const gx = Math.min(2.3, aspect * 1.15);
        globeGroup.position.set(gx, -0.45, 0);
        globeGroup.scale.setScalar(1);
        calendarGroup.position.set(gx + 1.05, 1.05, 0.35);
        calendarGroup.scale.setScalar(0.92);
      } else {
        // Narrow viewport: hero copy stacks on top, so keep the whole scene in
        // the lower half (where the static banner card used to sit).
        globeGroup.position.set(-0.55, -2.45, 0);
        globeGroup.scale.setScalar(0.9);
        calendarGroup.position.set(1.05, -1.25, 0.3);
        calendarGroup.scale.setScalar(0.58);
      }
      calendarGroup.rotation.set(-0.05, -0.16, 0.02);
    }
    layout(container.clientWidth || 1, container.clientHeight || 1);

    function resize() {
      const w = container!.clientWidth || 1;
      const h = container!.clientHeight || 1;
      renderer.setSize(w, h, false);
      layout(w, h);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    /* ---------- theme adaptation ---------- */
    function applyTheme() {
      colors = isDark() ? PALETTE.dark : PALETTE.light;
      wireMat.color.set(colors.wire);
      wireMat.opacity = colors.wireOpacity;
      innerMat.color.set(colors.wire);
      cityMat.color.set(colors.city);
      haloMat.color.set(colors.cityGlow);
      cardMat.color.set(colors.card);
      cardEdgeMat.color.set(colors.cardEdge);
      headerMat.color.set(colors.arc);
      for (const s of slots) s.material.color.set(colors.slot);
      for (const m of arcMats) {
        m.color.set(colors.arc);
        m.opacity = colors.arcOpacity;
      }
      featherMat.color.set(colors.feather);
      featherTrailMat.color.set(colors.feather);
      rippleMat.color.set(colors.ripple);
    }
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    /* ---------- parallax ---------- */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      mouse.ty = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    /* ---------- visibility: pause offscreen / hidden tab ---------- */
    let inView = true;
    let tabVisible = document.visibilityState !== "hidden";
    let rafId = 0;
    let running = false;

    const clock = new THREE.Clock();

    function startLoop() {
      if (running || !inView || !tabVisible) return;
      running = true;
      clock.start();
      rafId = requestAnimationFrame(animate);
    }
    function stopLoop() {
      running = false;
      clock.stop();
      cancelAnimationFrame(rafId);
    }

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        if (inView) startLoop();
        else stopLoop();
      },
      { threshold: 0.02 },
    );
    io.observe(container);

    function onVisibility() {
      tabVisible = document.visibilityState !== "hidden";
      if (tabVisible) startLoop();
      else stopLoop();
    }
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------- reduced-motion can flip at runtime ---------- */
    function onMotionChange(e: MediaQueryListEvent) {
      if (e.matches) {
        stopLoop();
        container!.style.opacity = "0";
        onActiveRef.current?.(false);
      } else {
        container!.style.opacity = "1";
        onActiveRef.current?.(true);
        startLoop();
      }
    }
    reducedMotion.addEventListener("change", onMotionChange);

    /* ---------- animation loop ---------- */
    let elapsed = 0;
    const baseSlotScale = 1;

    function animate() {
      if (!running) return;
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      // Slow globe rotation + gentle wobble.
      globeGroup.rotation.y += dt * 0.07;
      globeGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.05 + 0.18;

      // Calendar cluster floats.
      calendarGroup.position.y += Math.sin(elapsed * 0.8) * 0.0009;
      calendarGroup.rotation.z = 0.02 + Math.sin(elapsed * 0.4) * 0.012;

      // City points breathe softly.
      cityMat.size = 0.16 + Math.sin(elapsed * 1.6) * 0.02;
      haloMat.opacity = 0.3 + Math.sin(elapsed * 1.6) * 0.08;

      // Parallax (lerped).
      mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 4, 1);
      mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 4, 1);
      camera.position.x = mouse.x * 0.18;
      camera.position.y = -mouse.y * 0.12;
      camera.lookAt(1.1, 0.1, 0);

      // Keep matrices fresh before arc computation.
      globeGroup.updateMatrixWorld();
      calendarGroup.updateMatrixWorld();
      mainCard.updateMatrixWorld();
      for (let i = 0; i < arcs.length; i++) updateArc(arcs[i]!, ARC_CITIES[i]!);

      /* ----- ping state machine ----- */
      if (ping.phase === "idle") {
        if (elapsed >= ping.nextAt) {
          ping.phase = "fly";
          ping.t = 0;
          ping.slot = Math.floor(Math.random() * slots.length);
          const cityIdx = ARC_CITIES[Math.floor(Math.random() * ARC_CITIES.length)]!;
          featherCurve.v0.copy(cityPositions[cityIdx]!).applyMatrix4(globeGroup.matrixWorld);
          slots[ping.slot]!.getWorldPosition(featherCurve.v2);
          featherCurve.v1.addVectors(featherCurve.v0, featherCurve.v2).multiplyScalar(0.5);
          featherCurve.v1.y += 1.1;
          featherCurve.v1.z += 0.5;
          feather.visible = true;
          featherTrail.visible = true;
        }
      } else if (ping.phase === "fly") {
        ping.t += dt / 1.3; // ~1.3s flight
        const k = Math.min(ping.t, 1);
        const ease = k * k * (3 - 2 * k); // smoothstep
        featherCurve.getPoint(ease, feather.position);
        featherTrail.position.copy(feather.position);
        feather.rotation.z = Math.sin(elapsed * 14) * 0.5;
        featherMat.opacity = Math.min(k * 4, 1) * (1 - Math.max(0, k - 0.92) * 12.5);
        featherTrailMat.opacity = featherMat.opacity * 0.55;
        if (k >= 1) {
          ping.phase = "ring";
          ping.t = 0;
          feather.visible = false;
          featherTrail.visible = false;
          featherMat.opacity = 0;
          featherTrailMat.opacity = 0;
          // Position the ripple on the slot.
          slots[ping.slot]!.getWorldPosition(ripple.position);
          ripple.position.z += 0.01;
          ripple.quaternion.copy(calendarGroup.quaternion);
          ripple.visible = true;
        }
      } else if (ping.phase === "ring") {
        ping.t += dt / 0.9; // ~0.9s ring
        const k = Math.min(ping.t, 1);
        // Slot pulse: scale + color toward feather, then settle as "caught" lark blue.
        const pulse = Math.sin(Math.min(k * 2, 1) * Math.PI);
        const slot = slots[ping.slot]!;
        slot.scale.setScalar(baseSlotScale + pulse * 0.65);
        slot.material.color
          .set(colors.slot)
          .lerp(new THREE.Color(k < 0.5 ? colors.feather : colors.slotActive), Math.min(pulse + 0.25, 1));
        // Bell-ring ripple.
        ripple.scale.setScalar(1 + k * 6);
        rippleMat.opacity = 0.55 * (1 - k);
        if (k >= 1) {
          ripple.visible = false;
          rippleMat.opacity = 0;
          slot.scale.setScalar(baseSlotScale);
          slot.material.color.set(colors.slotActive); // the caught date stays lit
          // Occasionally reset older lit slots back to calm.
          if (Math.random() < 0.4) {
            for (const s of slots) if (s !== slot) s.material.color.set(colors.slot);
          }
          ping.phase = "idle";
          ping.nextAt = elapsed + 3.2 + Math.random() * 3.4;
        }
      }

      renderer.render(scene, camera);
    }

    onActiveRef.current?.(true);
    startLoop();

    /* ---------- cleanup ---------- */
    return () => {
      stopLoop();
      io.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      reducedMotion.removeEventListener("change", onMotionChange);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      canvasEl.remove();
      onActiveRef.current?.(false);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ transition: "opacity 0.6s ease" }}
    />
  );
}
