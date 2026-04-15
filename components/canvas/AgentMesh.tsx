"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ─── Color palette ───────────────────────────────────────────────────────────
const C_ACCENT   = new THREE.Color("#9B5FE3");   // violet-purple
const C_BRIGHT   = new THREE.Color("#C084F5");   // bright purple
const C_GLOW     = new THREE.Color("#B066FF");   // glow purple
const C_ORANGE   = new THREE.Color("#FF8C42");   // warm orange spark
const C_CYAN     = new THREE.Color("#4FC3F7");   // cool cyan spark
const C_WHITE    = new THREE.Color("#ffffff");   // white highlight

// ─── Node positions (12 nodes in a 3D arrangement) ──────────────────────────
const BASE_POSITIONS: [number, number, number][] = [
  [ 0,    0,    0   ],   // center
  [ 2.2,  1.0,  0.5 ],   // right-upper
  [-2.0,  1.2, -0.3 ],   // left-upper
  [ 1.5, -1.5,  1.0 ],   // right-lower-front
  [-1.8, -1.2,  0.8 ],   // left-lower-front
  [ 0.2,  2.2, -0.8 ],   // top
  [ 0.5, -2.3, -0.5 ],   // bottom
  [ 2.8, -0.2, -1.0 ],   // far-right
  [-2.6,  0.3,  1.2 ],   // far-left
  [ 1.0,  1.8,  1.5 ],   // upper-right-front
  [-0.8, -0.5, -2.0 ],   // deep-back
  [ 0.3,  0.8,  2.3 ],   // close-front
];

// ─── Edge pairs (indices into BASE_POSITIONS) ───────────────────────────────
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 9], [1, 7], [2, 8], [2, 5],
  [3, 6], [4, 8], [5, 9], [6, 10],
  [7, 11], [9, 11], [8, 4], [10, 6],
  [0, 5], [0, 6], [1, 3],
];

// ─── Scene group — holds nodes + edges, rotates as one ──────────────────────
function NetworkScene({ animated }: { animated: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);

  // Pulse phases per node
  const pulsePhases = useMemo(
    () => BASE_POSITIONS.map(() => Math.random() * Math.PI * 2),
    []
  );

  useFrame(({ clock }) => {
    if (!animated) return;
    const t = clock.getElapsedTime();
    timeRef.current = t;

    // Gentle Y-axis rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.08;
      groupRef.current.rotation.x = Math.sin(t * 0.05) * 0.08;
    }

    // Pulse node scales + emissive intensity
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const phase = pulsePhases[i];
      const isCenter = i === 0;
      const pulse = isCenter
        ? 1 + 0.18 * Math.sin(t * 2.1 + phase)
        : 1 + 0.06 * Math.sin(t * 1.4 + phase);
      mesh.scale.setScalar(pulse);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isCenter
        ? 1.5 + 0.8 * Math.sin(t * 2.1 + phase)
        : 0.6 + 0.4 * Math.sin(t * 1.4 + phase);
    });
  });

  // Build edge line objects (stable refs via useMemo)
  const edgeLineObjs = useMemo(() => {
    return EDGES.map(([a, b], i) => {
      const pa = BASE_POSITIONS[a];
      const pb = BASE_POSITIONS[b];
      const points = [new THREE.Vector3(...pa), new THREE.Vector3(...pb)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const isDim = i > 10;
      const mat = new THREE.LineBasicMaterial({
        color: isDim ? C_ACCENT : C_GLOW,
        transparent: true,
        opacity: isDim ? 0.18 : 0.45,
        toneMapped: false,
      });
      return { obj: new THREE.Line(geo, mat), key: `${a}-${b}` };
    });
  }, []);

  return (
    <group ref={groupRef}>
      {/* Edges */}
      {edgeLineObjs.map(({ obj, key }) => (
        <primitive key={key} object={obj} />
      ))}

      {/* Nodes */}
      {BASE_POSITIONS.map((pos, i) => {
        const isCenter = i === 0;
        const isOuter = i >= 7;
        const r = isCenter ? 0.22 : isOuter ? 0.10 : 0.14;
        const color = isCenter ? C_BRIGHT : i % 3 === 0 ? C_GLOW : C_ACCENT;
        return (
          <mesh
            key={i}
            position={pos}
            ref={(el) => { if (el) meshRefs.current[i] = el; }}
          >
            <sphereGeometry args={[r, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isCenter ? 2 : 0.8}
              toneMapped={false}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Sparkle particles (60 floating orange + cyan points) ───────────────────
function Sparkles({ animated }: { animated: boolean }) {
  const COUNT = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  const { positions, colors, speeds, phases } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    const speeds: number[] = [];
    const phases: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 6
        )
      );
      // Alternate orange / cyan, with occasional white
      const r = Math.random();
      colors.push(r < 0.45 ? C_ORANGE : r < 0.9 ? C_CYAN : C_WHITE);
      speeds.push(0.3 + Math.random() * 0.7);
      phases.push(Math.random() * Math.PI * 2);
    }
    return { positions, colors, speeds, phases };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!animated || !meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const pos = positions[i];
      const s = speeds[i];
      const p = phases[i];
      // Gentle float
      dummy.position.set(
        pos.x + Math.sin(t * s * 0.3 + p) * 0.4,
        pos.y + Math.cos(t * s * 0.4 + p) * 0.4,
        pos.z + Math.sin(t * s * 0.2 + p + 1) * 0.3
      );
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * s + p));
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Update color brightness
      const c = colors[i].clone().multiplyScalar(0.7 + 0.5 * pulse);
      meshRef.current.setColorAt(i, c);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshStandardMaterial
        emissive={C_WHITE}
        emissiveIntensity={2}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  className?: string;
  animated?: boolean;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AgentMesh({ className = "", animated = true }: Props) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
        camera={{ position: [0, 0, 7], fov: 55, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[4, 4, 4]} intensity={2} color="#B066FF" />
        <pointLight position={[-4, -2, -3]} intensity={1.2} color="#4FC3F7" />

        <NetworkScene animated={animated} />
        <Sparkles animated={animated} />

        <EffectComposer>
          <Bloom
            intensity={1.8}
            luminanceThreshold={0.05}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
