"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Html } from "@react-three/drei"
import type { CarModel, Part } from "@/lib/api"

interface CarViewer3DProps {
  carModel: CarModel
  selectedParts: Part[]
}

function CarModel3D({ carModel, selectedParts }: CarViewer3DProps) {
  const meshRef = useRef<any>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  // Get selected part colors/modifications
  const getPartColor = (partType: string) => {
    const part = selectedParts.find((p) => p.type === partType)
    if (part) {
      // You could map part IDs to colors or use part properties
      switch (partType) {
        case "wheels":
          return "#ff6b35"
        case "engine":
          return "#f7931e"
        case "exhaust":
          return "#c5c5c5"
        default:
          return "#3b82f6"
      }
    }
    return "#3b82f6"
  }

  return (
    <group ref={meshRef}>
      {/* Main car body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 1.5, 2]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      <mesh position={[-1.5, -0.8, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2]} />
        <meshStandardMaterial color={getPartColor("wheels")} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[1.5, -0.8, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2]} />
        <meshStandardMaterial color={getPartColor("wheels")} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.5, -0.8, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2]} />
        <meshStandardMaterial color={getPartColor("wheels")} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[1.5, -0.8, -1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2]} />
        <meshStandardMaterial color={getPartColor("wheels")} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Engine (visible under hood) */}
      {selectedParts.some((p) => p.type === "engine") && (
        <mesh position={[0, 0.2, 0.8]}>
          <boxGeometry args={[1.5, 0.8, 1]} />
          <meshStandardMaterial color={getPartColor("engine")} metalness={0.7} roughness={0.3} />
        </mesh>
      )}

      {/* Exhaust */}
      {selectedParts.some((p) => p.type === "exhaust") && (
        <mesh position={[0, -0.3, -1.2]}>
          <cylinderGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color={getPartColor("exhaust")} metalness={0.9} roughness={0.1} />
        </mesh>
      )}

      {/* Spoiler */}
      {selectedParts.some((p) => p.type === "spoiler") && (
        <mesh position={[0, 0.8, -1.2]}>
          <boxGeometry args={[3, 0.1, 0.3]} />
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      {/* Part labels */}
      {selectedParts.map((part, index) => (
        <Html key={part.id} position={[2, 1 + index * 0.3, 0]} distanceFactor={10} occlude>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">{part.name}</div>
        </Html>
      ))}
    </group>
  )
}

export function CarViewer3D({ carModel, selectedParts }: CarViewer3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [5, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <CarModel3D carModel={carModel} selectedParts={selectedParts} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          autoRotate={false}
        />

        <Environment preset="sunset" />
      </Canvas>
    </div>
  )
}
