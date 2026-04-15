"use client";
import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { NetworkGraph as NetworkGraphData, NetworkNode, NetworkEdge } from "@/lib/types";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C_ACCENT  = new THREE.Color("#9B5FE3");
const C_BRIGHT  = new THREE.Color("#C084F5");
const C_GLOW    = new THREE.Color("#B066FF");
const C_IDLE    = new THREE.Color("#e8ccff");
const C_ORANGE  = new THREE.Color("#FF8C42");
const C_CYAN    = new THREE.Color("#4FC3F7");

// ─── 3D sim node ─────────────────────────────────────────────────────────────
interface SimNode extends NetworkNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

// ─── Force simulation (3D) ───────────────────────────────────────────────────
function simulate3D(nodes: SimNode[], edges: NetworkEdge[]) {
  const alpha    = 0.05;
  const repK     = 6.0;   // repulsion radius units
  const repStr   = 0.4;
  const attrStr  = 0.012;
  const centerK  = 0.006;
  const damping  = 0.88;

  // Center gravity
  for (const n of nodes) {
    n.vx += -n.x * centerK;
    n.vy += -n.y * centerK;
    n.vz += -n.z * centerK;
  }

  // Repulsion
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dz = nodes[j].z - nodes[i].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
      if (dist > repK) continue;
      const force = repStr / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[i].vz -= fz;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
      nodes[j].vz += fz;
    }
  }

  // Attraction along edges
  for (const e of edges) {
    const src = nodes.find((n) => n.id === e.source);
    const tgt = nodes.find((n) => n.id === e.target);
    if (!src || !tgt) continue;
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dz = tgt.z - src.z;
    src.vx += dx * attrStr;
    src.vy += dy * attrStr;
    src.vz += dz * attrStr;
    tgt.vx -= dx * attrStr;
    tgt.vy -= dy * attrStr;
    tgt.vz -= dz * attrStr;
  }

  // Integrate + dampen
  for (const n of nodes) {
    n.vx *= damping;
    n.vy *= damping;
    n.vz *= damping;
    n.x  += n.vx * alpha;
    n.y  += n.vy * alpha;
    n.z  += n.vz * alpha;
    // Soft clamp
    const maxR = 4.5;
    const r = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
    if (r > maxR) {
      const s = maxR / r;
      n.x *= s; n.y *= s; n.z *= s;
      n.vx *= 0.3; n.vy *= 0.3; n.vz *= 0.3;
    }
  }
}

// ─── Empty starfield (shown when no nodes) ───────────────────────────────────
function Starfield() {
  const COUNT = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const positions = useMemo(() =>
    Array.from({ length: COUNT }, () => new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 10
    )), []);

  const phases = useMemo(() => Array.from({ length: COUNT }, () => Math.random() * Math.PI * 2), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      dummy.position.copy(positions[i]);
      const s = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.6 + phases[i]));
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.018, 6, 6]} />
      <meshStandardMaterial
        color={C_GLOW}
        emissive={C_GLOW}
        emissiveIntensity={1.5}
        toneMapped={false}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

// ─── Single network node sphere ───────────────────────────────────────────────
interface NodeMeshProps {
  node: SimNode;
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (over: boolean) => void;
}

function NodeMesh({ node, isActive, isHovered, onClick, onHover }: NodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const outerRef = useRef<THREE.Mesh>(null!);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!meshRef.current) return;

    // Smooth position tracking
    meshRef.current.position.lerp(
      new THREE.Vector3(node.x, node.y, node.z),
      0.12
    );
    if (outerRef.current) {
      outerRef.current.position.copy(meshRef.current.position);
    }

    // Pulse
    const pulse = isActive
      ? 1 + 0.2 * Math.sin(t * 2.4 + phase)
      : 1 + 0.05 * Math.sin(t * 1.2 + phase);
    meshRef.current.scale.setScalar(pulse);

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = isActive
      ? 1.8 + 0.8 * Math.sin(t * 2.4 + phase)
      : isHovered ? 1.2 : 0.5;
  });

  const r = Math.max(0.08, 0.08 + (node.taskCount ?? 0) * 0.008);
  const color = isActive ? C_BRIGHT : C_IDLE;
  const emissive = isActive ? C_GLOW : C_ACCENT;

  return (
    <group>
      {/* Glow halo for active nodes */}
      {isActive && (
        <mesh ref={outerRef} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[r * 2.5, 16, 16]} />
          <meshStandardMaterial
            color={C_GLOW}
            emissive={C_GLOW}
            emissiveIntensity={0.4}
            transparent
            opacity={0.12}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        position={[node.x, node.y, node.z]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
      >
        <sphereGeometry args={[r, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.6}
          toneMapped={false}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[node.x, node.y - r - 0.22, node.z]}
        fontSize={0.11}
        color={isActive ? "#C084F5" : "rgba(192,160,255,0.75)"}
        anchorX="center"
        anchorY="top"
        font="/fonts/Syne-Regular.ttf"
        characters="abcdefghijklmnopqrstuvwxyz0123456789-_"
        outlineWidth={0.002}
        outlineColor="#08081a"
      >
        {node.name}
      </Text>
    </group>
  );
}

// ─── Edge line between two sim-nodes ─────────────────────────────────────────
function EdgeLine({ src, tgt, isActive }: { src: SimNode; tgt: SimNode; isActive: boolean }) {
  const lineObjRef = useRef<THREE.Line | null>(null);

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setFromPoints([
      new THREE.Vector3(src.x, src.y, src.z),
      new THREE.Vector3(tgt.x, tgt.y, tgt.z),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: isActive ? C_ORANGE : C_ACCENT,
      transparent: true,
      opacity: isActive ? 0.65 : 0.22,
      toneMapped: false,
    });
    return new THREE.Line(geo, mat);
  }, [src.id, tgt.id, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    lineObjRef.current = lineObj;
    return () => { lineObj.geometry.dispose(); };
  }, [lineObj]);

  useFrame(() => {
    if (!lineObjRef.current) return;
    const pts = [
      new THREE.Vector3(src.x, src.y, src.z),
      new THREE.Vector3(tgt.x, tgt.y, tgt.z),
    ];
    lineObjRef.current.geometry.setFromPoints(pts);
  });

  return <primitive object={lineObj} />;
}

// ─── The full scene graph ─────────────────────────────────────────────────────
interface SceneProps {
  simNodes: SimNode[];
  edges: NetworkEdge[];
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onNodeClick?: (node: NetworkNode) => void;
}

function NetworkScene({ simNodes, edges, hoveredId, setHoveredId, onNodeClick }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const idleTime  = useRef(0);
  const lastFrame = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Auto-rotate slowly when idle
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }

    // Run simulation
    if (simNodes.length > 0) {
      simulate3D(simNodes, edges);
    }
  });

  const nodeMap = useMemo(() => {
    const m = new Map<string, SimNode>();
    for (const n of simNodes) m.set(n.id, n);
    return m;
  }, [simNodes]);

  return (
    <group ref={groupRef}>
      {/* Edges */}
      {edges.map((e) => {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) return null;
        return (
          <EdgeLine
            key={`${e.source}-${e.target}`}
            src={src}
            tgt={tgt}
            isActive={e.status === "ACTIVE"}
          />
        );
      })}

      {/* Nodes */}
      {simNodes.map((node) => (
        <NodeMesh
          key={node.id}
          node={node}
          isActive={!!node.activeCoalition}
          isHovered={hoveredId === node.id}
          onClick={() => onNodeClick?.(node)}
          onHover={(over) => setHoveredId(over ? node.id : null)}
        />
      ))}
    </group>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  data: NetworkGraphData;
  onNodeClick?: (node: NetworkNode) => void;
  className?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NetworkGraph({ data, onNodeClick, className = "" }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Build and maintain sim nodes (preserve positions on updates)
  const simNodesRef = useRef<SimNode[]>([]);

  const simNodes = useMemo(() => {
    const existing = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const next = data.nodes.map((n): SimNode => {
      const e = existing.get(n.id);
      if (e) {
        return { ...n, x: e.x, y: e.y, z: e.z, vx: e.vx, vy: e.vy, vz: e.vz };
      }
      return {
        ...n,
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 3,
        z: (Math.random() - 0.5) * 3,
        vx: 0, vy: 0, vz: 0,
      };
    });
    simNodesRef.current = next;
    return next;
  }, [data.nodes]);

  const isEmpty = data.nodes.length === 0;

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
        camera={{ position: [0, 0, 9], fov: 55, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        style={{ background: "#08081a" }}
        onPointerMissed={() => setHoveredId(null)}
      >
        <ambientLight intensity={0.08} />
        <pointLight position={[5, 5, 5]} intensity={2.5} color="#B066FF" />
        <pointLight position={[-5, -3, -4]} intensity={1.5} color="#4FC3F7" />

        {isEmpty ? (
          <Starfield />
        ) : (
          <NetworkScene
            simNodes={simNodes}
            edges={data.edges}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            onNodeClick={onNodeClick}
          />
        )}

        <EffectComposer>
          <Bloom
            intensity={1.6}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.85}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
