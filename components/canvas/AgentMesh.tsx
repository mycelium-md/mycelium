"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const C_ACCENT = new THREE.Color("#9B5FE3");
const C_BRIGHT = new THREE.Color("#C084F5");
const C_GLOW   = new THREE.Color("#B066FF");
const C_ORANGE = new THREE.Color("#FF8C42");
const C_CYAN   = new THREE.Color("#4FC3F7");
const C_WHITE  = new THREE.Color("#ffffff");

const BASE_POSITIONS: [number, number, number][] = [
  [ 0,    0,    0   ],
  [ 2.2,  1.0,  0.5 ],
  [-2.0,  1.2, -0.3 ],
  [ 1.5, -1.5,  1.0 ],
  [-1.8, -1.2,  0.8 ],
  [ 0.2,  2.2, -0.8 ],
  [ 0.5, -2.3, -0.5 ],
  [ 2.8, -0.2, -1.0 ],
  [-2.6,  0.3,  1.2 ],
  [ 1.0,  1.8,  1.5 ],
  [-0.8, -0.5, -2.0 ],
  [ 0.3,  0.8,  2.3 ],
];

const EDGES: [number, number][] = [
  [0,1],[0,2],[0,3],[0,4],
  [1,9],[1,7],[2,8],[2,5],
  [3,6],[4,8],[5,9],[6,10],
  [7,11],[9,11],[0,5],[0,6],[1,3],
];

function NetworkScene({ animated }: { animated: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pulsePhases = useMemo(
    () => BASE_POSITIONS.map(() => Math.random() * Math.PI * 2),
    []
  );

  const edgeObjects = useMemo(() => {
    return EDGES.map(([a, b]) => {
      const points = [
        new THREE.Vector3(...BASE_POSITIONS[a]),
        new THREE.Vector3(...BASE_POSITIONS[b]),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: C_GLOW,
        transparent: true,
        opacity: 0.4,
        toneMapped: false,
      });
      return new THREE.Line(geo, mat);
    });
  }, []);

  useFrame(({ clock }) => {
    if (!animated) return;
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.08;
      groupRef.current.rotation.x = Math.sin(t * 0.05) * 0.08;
    }
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
        ? 1.8 + 0.8 * Math.sin(t * 2.1 + phase)
        : 0.6 + 0.4 * Math.sin(t * 1.4 + phase);
    });
  });

  return (
    <group ref={groupRef}>
      {edgeObjects.map((obj, i) => (
        <primitive key={i} object={obj} />
      ))}
      {BASE_POSITIONS.map((pos, i) => {
        const isCenter = i === 0;
        const isOuter  = i >= 7;
        const r = isCenter ? 0.22 : isOuter ? 0.10 : 0.14;
        const color = isCenter ? C_BRIGHT : i % 3 === 0 ? C_GLOW : C_ACCENT;
        return (
          <mesh
            key={i}
            position={pos}
            ref={(el) => { meshRefs.current[i] = el; }}
          >
            <sphereGeometry args={[r, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isCenter ? 2 : 0.8}
              toneMapped={false}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Sparkles({ animated }: { animated: boolean }) {
  const COUNT = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const cols = [C_ORANGE, C_CYAN, C_WHITE];
    return Array.from({ length: COUNT }, (_, i) => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 6
      ),
      color: cols[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2].clone(),
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  // seed initial matrices
  useMemo(() => {
    particles.forEach((p, i) => {
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(0.8);
      dummy.updateMatrix();
      // will be overwritten on first frame
    });
  }, [particles, dummy]);

  useFrame(({ clock }) => {
    if (!animated || !meshRef.current) return;
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.pos.x + Math.sin(t * p.speed * 0.3 + p.phase) * 0.4,
        p.pos.y + Math.cos(t * p.speed * 0.4 + p.phase) * 0.4,
        p.pos.z + Math.sin(t * p.speed * 0.2 + p.phase + 1) * 0.3
      );
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * p.speed + p.phase));
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      const c = p.color.clone().multiplyScalar(0.8 + 0.5 * pulse);
      meshRef.current.setColorAt(i, c);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.03, 6, 6]} />
      <meshStandardMaterial
        color={C_WHITE}
        emissive={C_WHITE}
        emissiveIntensity={3}
        toneMapped={false}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
}

interface Props {
  className?: string;
  animated?: boolean;
}

export default function AgentMesh({ className = "", animated = true }: Props) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={[1, 2]}
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
            intensity={1.6}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
