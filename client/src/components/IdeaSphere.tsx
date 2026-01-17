import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { 
  OrbitControls, 
  Html, 
  Stars, 
  Float,
  PerspectiveCamera,
  Line,
  useCursor,
  Sphere,
  Torus
} from "@react-three/drei";
import * as THREE from "three";
import { Video, Mic, FileText, Globe, MoreHorizontal } from "lucide-react";

export type MediaType = 'text' | 'audio' | 'video' | 'topic';

export interface Idea {
  id: string;
  title: string;
  description: string;
  type: MediaType;
  mediaUrl?: string;
  parentId?: string | null;
  color?: string;
  position?: [number, number, number];
}

interface IdeaNodeProps {
  idea: Idea;
  position: [number, number, number];
  isSelected: boolean;
  onClick: (id: string) => void;
  onDragStart: (e: ThreeEvent<PointerEvent>) => void;
  onDragEnd: (e: ThreeEvent<PointerEvent>) => void;
  onDrag: (e: ThreeEvent<PointerEvent>, id: string) => void;
  isCenter?: boolean;
  isDragging?: boolean;
}

function IdeaNode({ idea, position, isSelected, onClick, onDragStart, onDragEnd, onDrag, isCenter, isDragging }: IdeaNodeProps) {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useCursor(hovered, 'grab', 'auto');
  
  // Animate scale based on selection/hover
  const baseScale = isCenter ? 2 : 1;
  const targetScale = (isSelected ? 1.3 : hovered ? 1.1 : 1) * baseScale;
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 10);
    }
    
    // Rotate rings
    if (ringRef1.current) {
       ringRef1.current.rotation.z += delta * 0.5;
       ringRef1.current.rotation.x += delta * 0.2;
    }
    if (ringRef2.current) {
       ringRef2.current.rotation.z -= delta * 0.3;
       ringRef2.current.rotation.y += delta * 0.4;
    }
    
    // Pulse inner core
    if (innerCoreRef.current) {
       const t = state.clock.getElapsedTime();
       const scale = 1 + Math.sin(t * 2) * 0.1;
       innerCoreRef.current.scale.set(scale, scale, scale);
    }
  });

  const color = idea.color || "#a855f7";
  const glowColor = isSelected ? "#ffffff" : color;

  // Icon selection based on type
  const getIcon = () => {
    const props = { size: 14, className: "text-current" };
    switch (idea.type) {
      case 'video': return <Video {...props} />;
      case 'audio': return <Mic {...props} />;
      case 'topic': return <Globe {...props} />;
      default: return <FileText {...props} />;
    }
  };

  return (
    <Float speed={isDragging ? 0 : (isCenter ? 1 : 2)} rotationIntensity={0.2} floatIntensity={0.5}>
      <group 
         position={position}
         ref={meshRef}
         onClick={(e) => {
            e.stopPropagation();
            if (!isDragging) onClick(idea.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            // @ts-ignore
            e.target.setPointerCapture(e.pointerId);
            onDragStart(e);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            // @ts-ignore
            e.target.releasePointerCapture(e.pointerId);
            onDragEnd(e);
          }}
          onPointerMove={(e) => {
            if (isDragging) {
               e.stopPropagation();
               onDrag(e, idea.id);
            }
          }}
      >
        {/* Core Sphere */}
        <Sphere args={[0.4, 32, 32]} ref={innerCoreRef}>
          <meshStandardMaterial 
            color={glowColor} 
            emissive={glowColor}
            emissiveIntensity={isSelected ? 2 : 1}
            toneMapped={false}
          />
        </Sphere>

        {/* Glass Shell */}
        <Sphere args={[0.6, 32, 32]}>
           <meshPhysicalMaterial 
              color={color}
              transparent
              opacity={0.2}
              roughness={0}
              metalness={0.1}
              clearcoat={1}
              transmission={0.5}
              thickness={0.5}
           />
        </Sphere>

        {/* Orbital Rings - More complex for centers */}
        {isCenter ? (
          <>
            <Torus args={[0.8, 0.02, 16, 100]} ref={ringRef1}>
               <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
            </Torus>
            <Torus args={[1.1, 0.02, 16, 100]} ref={ringRef2} rotation={[Math.PI / 2, 0, 0]}>
               <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} toneMapped={false} />
            </Torus>
          </>
        ) : (
          <Torus args={[0.8, 0.01, 16, 100]} ref={ringRef1}>
               <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.5} />
          </Torus>
        )}

        {/* Hitbox for easier selection (invisible) */}
        <mesh visible={false}>
           <sphereGeometry args={[1.2, 16, 16]} />
           <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Floating Label */}
        <Html distanceFactor={15} sprite position={[0, isCenter ? 2.5 : 1.5, 0]} style={{ pointerEvents: "none" }}>
           <div 
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-sm font-medium whitespace-nowrap transition-all duration-300 border select-none
              ${isSelected 
                ? "bg-white/20 text-white border-white/50 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                : hovered 
                  ? "bg-black/60 text-purple-200 border-purple-500/50" 
                  : "opacity-70 text-gray-300 bg-black/40 border-white/10"
              }
            `}
          >
            {getIcon()}
            <span>{idea.title}</span>
          </div>
        </Html>
      </group>
    </Float>
  );
}

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}

function ConnectionLine({ start, end, color = "white" }: ConnectionLineProps) {
  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.4}
    />
  );
}

interface IdeaSphereProps {
  ideas: Idea[];
  onSelectIdea: (id: string | null) => void;
  selectedId: string | null;
  onNodeMove?: (id: string, pos: [number, number, number]) => void;
}

function SphereContent({ ideas, onSelectIdea, selectedId, onNodeMove }: IdeaSphereProps) {
  const { camera, raycaster } = useThree();
  const controlsRef = useRef<any>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPlane, setDragPlane] = useState<THREE.Plane | null>(null);
  
  // Temporary positions during drag to ensure smooth 60fps updates without re-layouting everything
  const [tempPositions, setTempPositions] = useState<Map<string, [number, number, number]>>(new Map());

  // Calculate layout only when ideas structure changes, but NOT when just moving nodes (unless needed)
  // Actually, we need to know if a node has a fixed position in 'idea.position'
  const { calculatedPositions, connections } = useMemo(() => {
    const posMap = new Map<string, [number, number, number]>();
    const connList: { startId: string, endId: string }[] = [];
    
    const roots = ideas.filter(i => !i.parentId || !ideas.find(p => p.id === i.parentId));
    
    const rootRadius = 15;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    roots.forEach((root, i) => {
      // Use stored position if available
      if (root.position) {
        posMap.set(root.id, root.position);
      } else {
        const y = 1 - (i / (Math.max(roots.length, 1) - 1 || 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        
        const x = Math.cos(theta) * radiusAtY * rootRadius;
        const z = Math.sin(theta) * radiusAtY * rootRadius;
        const yPos = y * rootRadius;
        
        const pos: [number, number, number] = roots.length === 1 ? [0, 0, 0] : [x, yPos, z];
        posMap.set(root.id, pos);
      }
    });

    const processChildren = (parentId: string, parentPos: [number, number, number], level: number) => {
      const children = ideas.filter(i => i.parentId === parentId);
      if (children.length === 0) return;

      const childRadius = Math.max(8 - level * 2, 4);
      
      children.forEach((child, i) => {
        connList.push({ startId: parentId, endId: child.id });

        if (child.position) {
           posMap.set(child.id, child.position);
           processChildren(child.id, child.position, level + 1);
        } else {
           const phi = Math.acos(-1 + (2 * i) / children.length);
           const theta = Math.sqrt(children.length * Math.PI) * phi;

           const x = parentPos[0] + childRadius * Math.cos(theta) * Math.sin(phi);
           const y = parentPos[1] + childRadius * Math.sin(theta) * Math.sin(phi);
           const z = parentPos[2] + childRadius * Math.cos(phi);

           const childPos: [number, number, number] = [x, y, z];
           posMap.set(child.id, childPos);
           
           processChildren(child.id, childPos, level + 1);
        }
      });
    };

    roots.forEach(root => {
      const rootPos = posMap.get(root.id)!;
      processChildren(root.id, rootPos, 1);
    });

    return { calculatedPositions: posMap, connections: connList };
  }, [ideas]);

  // Handlers for drag
  const handleDragStart = (e: ThreeEvent<PointerEvent>) => {
    if (controlsRef.current) controlsRef.current.enabled = false;
    // Create a plane at the object's position facing the camera
    const normal = new THREE.Vector3();
    camera.getWorldDirection(normal);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, e.object.position);
    setDragPlane(plane);
  };

  const handleDragEnd = (e: ThreeEvent<PointerEvent>) => {
    if (controlsRef.current) controlsRef.current.enabled = true;
    setDraggingId(null);
    setDragPlane(null);
    
    // Ensure the final drag position is committed to state if needed
    // The visual update happens via tempPositions, but we need to ensure the parent component knows
    // if the drag ended without further moves.
    // However, onDrag updates tempPositions continuously.
  };

  const handleDrag = (e: ThreeEvent<PointerEvent>, id: string) => {
    if (!dragPlane) return;
    
    const point = new THREE.Vector3();
    // Raycast against the drag plane
    e.ray.intersectPlane(dragPlane, point);
    
    if (point) {
      setTempPositions(prev => new Map(prev).set(id, [point.x, point.y, point.z]));
      if (onNodeMove) onNodeMove(id, [point.x, point.y, point.z]);
    }
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 20, 40]} />
      <OrbitControls 
        ref={controlsRef}
        enablePan={true} 
        minDistance={5} 
        maxDistance={100} 
        autoRotate={!selectedId && !draggingId}
        autoRotateSpeed={0.2}
        dampingFactor={0.05}
      />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[20, 20, 20]} intensity={1} color="#ffffff" />
      <pointLight position={[-20, -20, -20]} intensity={0.5} color="#a855f7" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#4c1d95" distance={50} />
      
      <Stars radius={150} depth={50} count={7000} factor={4} saturation={0} fade speed={0.5} />

      <group>
        {ideas.map((idea) => {
          // Use temp position if dragging, otherwise calculated/stored
          const pos = tempPositions.get(idea.id) || calculatedPositions.get(idea.id);
          if (!pos) return null;

          return (
            <IdeaNode
              key={idea.id}
              idea={idea}
              position={pos}
              isSelected={selectedId === idea.id}
              isDragging={draggingId === idea.id}
              onClick={onSelectIdea}
              onDragStart={(e) => {
                setDraggingId(idea.id);
                handleDragStart(e);
              }}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              isCenter={idea.type === 'topic'}
            />
          );
        })}

        {connections.map((conn, i) => {
           const start = tempPositions.get(conn.startId) || calculatedPositions.get(conn.startId);
           const end = tempPositions.get(conn.endId) || calculatedPositions.get(conn.endId);
           
           if (!start || !end) return null;
           
           return (
            <ConnectionLine 
              key={i} 
              start={start} 
              end={end} 
              color="#a855f7"
            />
          );
        })}
      </group>
    </>
  );
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

const webGLSupported = checkWebGLSupport();

export function IdeaSphere(props: IdeaSphereProps) {
  if (!webGLSupported) {
    return (
      <div className="w-full h-full absolute inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center p-8 bg-black/50 rounded-lg backdrop-blur">
          <h2 className="text-2xl mb-4">3D View Unavailable</h2>
          <p className="text-gray-400">WebGL is not supported in this environment.</p>
          <p className="text-gray-400 mt-2">The database and API are working correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <SphereContent {...props} />
      </Canvas>
    </div>
  );
}