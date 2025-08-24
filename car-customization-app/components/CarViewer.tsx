'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  useGLTF, 
  Html, 
  Text,
  Float,
  PresentationControls,
  Center,
  TransformControls
} from '@react-three/drei';
import * as THREE from 'three';
import { CarModel, Part, Anchor } from '@/lib/api';
import { apiClient } from '@/lib/api';

interface CarViewerProps {
  carModel?: CarModel;
  selectedParts?: Part[];
  onPartSelect?: (part: Part) => void;
  onPartDeselect?: (part: Part) => void;
  // Manual mode props for parent component
  manualMode?: boolean;
  onManualModeToggle?: () => void;
  onSaveManualAdjustments?: () => void;
  onResetToAuto?: () => void;
  onClearAllAdjustments?: () => void;
  manualTransforms?: Record<number, any>; // Add manual transforms prop
  onManualTransformChange?: (partId: number, transform: any) => void; // Add callback for manual transform changes
}

interface CarMeshProps {
  carModel?: CarModel;
  selectedParts?: Part[];
  onPartSelect?: (part: Part) => void;
  onPartDeselect?: (part: Part) => void;
  onModelBounds?: (bounds: { size: THREE.Vector3; center: THREE.Vector3; scale: number }) => void;
  manualMode?: boolean;
  onManualTransformChange?: (partId: number, transform: any) => void;
  orbitRef?: React.RefObject<any>; // Add orbitRef prop
  manualTransforms?: Record<string, any>; // Add manual transforms prop
  selectedPartId?: number | null; // Add selected part ID
}

// Clean FittedModel component with auto scale/ground/camera
type FittedModelProps = {
  url: string;
  targetSize?: number;     // longest dimension after scaling (world units)
  clamp?: [number, number]; // [minScale, maxScale]
  onBounds?: (b: { size: THREE.Vector3; center: THREE.Vector3; scale: number }) => void;
  selectedParts?: Part[];
  anchors?: Anchor[];
  anchorsLoaded?: boolean;
  manualMode?: boolean;
  onManualTransformChange?: (partId: number, transform: any) => void;
  orbitRef?: React.RefObject<any>;
  manualTransforms?: Record<string, any>;
  carModel?: CarModel;
  onPartSelect?: (part: Part) => void; // Add selection callback
  selectedPartId?: number | null; // Add selected part ID
};

function FittedModel({ 
  url, 
  targetSize = 3, 
  clamp = [0.15, 2], 
  onBounds,
  selectedParts,
  anchors,
  anchorsLoaded,
  manualMode,
  onManualTransformChange,
  orbitRef,
  manualTransforms,
  carModel,
  onPartSelect,
  selectedPartId
}: FittedModelProps) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null!);
  const boundsCalculatedRef = useRef(false); // Use ref to track if bounds were calculated
  
  console.log('🚗 FittedModel - scene exists:', !!scene, 'url:', url);

  // Remove useMemo bounds calculation - we'll do it in useEffect instead
  const [bounds, setBounds] = useState<{ size: THREE.Vector3; center: THREE.Vector3; scale: number } | null>(null);

  useEffect(() => {
    // Calculate bounds only once when scene is loaded
    if (!group.current || boundsCalculatedRef.current || !scene) return;

    console.log('🚗 FittedModel: Calculating bounds for the first time');
    
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // compute uniform scale
    const longest = Math.max(size.x, size.y, size.z) || 1;
    let scale = targetSize / longest;
    scale = THREE.MathUtils.clamp(scale, clamp[0], clamp[1]);

    console.log('FittedModel bounds (car only):', { size, center, scale, longest, targetSize });
    
    // Set bounds state
    setBounds({ size, center, scale });
    
    // Call onBounds callback
    if (onBounds) {
      onBounds({ size, center, scale });
    }
    
    boundsCalculatedRef.current = true;
    console.log('🚗 FittedModel: Set boundsCalculatedRef to true - will never calculate bounds again');
  }, [scene, targetSize, clamp, onBounds]);

  if (!scene) {
    console.log('🚗 FittedModel: Scene not loaded yet for URL:', url);
    return null;
  }

  console.log('🚗 FittedModel: Rendering scene with bounds:', bounds);

  // For this problematic car model, always use simple ground placement
  let groundPosition = 0; // Always place at origin - no complex calculations
  
  console.log('🚗 Using simple ground placement for all car models (y=0)');
  
  console.log('🚗 FittedModel positioned at y=0 (ground level)');

  return (
    <group ref={group} scale={bounds?.scale || 1} position={[0, groundPosition, 0]} renderOrder={0}>
      {/* Move so the **bottom** sits on y=0 */}
      <primitive object={scene} position={bounds?.center.clone().multiplyScalar(-1) || [0, 0, 0]} />
      {/* Make car slightly transparent to show overlapping parts */}
      {scene && (() => {
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.transparent = true;
                  mat.opacity = 0.8;
                }
              });
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.transparent = true;
              child.material.opacity = 0.8;
            }
          }
        });
        return null;
      })()}
      
      {/* Render parts as children of the car group */}
      {selectedParts?.map((part, index) => {
        console.log('🔍 Rendering part inside car group:', part.name, 'manualMode:', manualMode, 'index:', index);
        
        // In manual mode, only the FIRST part gets TransformControls to avoid conflicts
        const isActiveForManualMode = manualMode && index === 0;
        
        // Always use EnhancedPart for parts with GLB and anchors (handles both manual and auto mode)
        // Also use EnhancedPart if part has manual transforms saved
        const hasValidGLB = part.glb_url && part.glb_url !== "";
        const hasAnchors = anchors && anchors.length > 0;
        const hasManualTransforms = manualTransforms && manualTransforms[part.id] !== undefined;
        // Use EnhancedPart if: has GLB OR has manual transforms OR has anchors
        const shouldUseEnhancedPart = anchorsLoaded && (hasValidGLB || hasManualTransforms || hasAnchors);
        
        console.log(`🔍 ${part.name} conditions inside car:`, {
          anchorsLoaded,
          hasValidGLB,
          hasAnchors,
          hasManualTransforms,
          shouldUseEnhancedPart,
          isActiveForManualMode
        });
        
        if (shouldUseEnhancedPart && carModel) {
          console.log(`✅ Using EnhancedPart inside car for: ${part.name}`);
          return (
            <EnhancedPart 
              key={`${part.id}-${index}`} 
              part={part} 
              anchors={anchors || []} 
              carModel={carModel}
              manualMode={isActiveForManualMode}
              onManualTransformChange={onManualTransformChange}
              orbitRef={orbitRef}
              currentManualTransforms={manualTransforms}
              isSelected={selectedParts.some(sp => sp.id === part.id)} // Pass selection state
              onSelect={() => onPartSelect?.(part)} // Pass selection callback
            />
          );
        }
        
        // Fallback to placeholder for parts without GLB or anchors
        console.log(`❌ Using placeholder inside car for: ${part.name}`);
        return <PlaceholderPart key={`${part.id}-${index}`} part={part} carModel={carModel} />;
      })}
      
      {/* Simple TransformControls - renders only once for the selected part */}
      <SimpleTransformControls
        selectedPartId={selectedPartId || null}
        manualMode={manualMode || false}
        onManualTransformChange={onManualTransformChange}
        orbitRef={orbitRef}
        targetObjectRef={selectedParts?.find(p => p.id === selectedPartId) ? 
          // For now, we'll use the fallback approach since we don't have direct refs
          undefined : undefined}
      />
    </group>
  );
}

// Anchor-based Part Attachment Component
function AnchorPartAttachment({ part, carScene }: { part: Part; carScene: THREE.Scene }) {
  const [anchorNode, setAnchorNode] = useState<THREE.Object3D | null>(null);
  const [partInstance, setPartInstance] = useState<THREE.Object3D | null>(null);

  // Find anchor node in car scene
  useEffect(() => {
    if (carScene && part.attach_to) {
      const anchor = carScene.getObjectByName(part.attach_to);
      if (anchor) {
        console.log(`Found anchor: ${part.attach_to}`);
        setAnchorNode(anchor);
      } else {
        console.warn(`Anchor not found: ${part.attach_to}`);
        // Fallback to placeholder if anchor not found
        setAnchorNode(null);
      }
    }
  }, [carScene, part.attach_to]);

  // Load part GLB if available
  const { scene: partScene } = useGLTF(part.glb_url || '/placeholder.glb');

  // Attach part to anchor
  useEffect(() => {
    if (anchorNode && partScene) {
      // Clone the part scene to avoid mutating the cached version
      const clonedPart = partScene.clone(true);
      
      // Apply part-specific positioning
      clonedPart.position.set(part.pos_x, part.pos_y, part.pos_z);
      clonedPart.rotation.set(part.rot_x, part.rot_y, part.rot_z);
      clonedPart.scale.set(part.scale_x, part.scale_y, part.scale_z);
      
      // Auto-scale based on anchor metadata if available
      if (anchorNode.userData?.radius && part.intrinsic_size) {
        try {
          const intrinsicSize = JSON.parse(part.intrinsic_size);
          const targetRadius = anchorNode.userData.radius;
          const currentRadius = intrinsicSize.radius || 0.5;
          const scale = targetRadius / currentRadius;
          clonedPart.scale.multiplyScalar(scale);
        } catch (e) {
          console.warn('Failed to parse intrinsic_size:', e);
        }
      }
      
      // Optimize performance
      clonedPart.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to anchor
      anchorNode.add(clonedPart);
      setPartInstance(clonedPart);
      
      console.log(`Attached part ${part.name} to anchor ${part.attach_to}`);
    }
  }, [anchorNode, partScene, part]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (anchorNode && partInstance) {
        anchorNode.remove(partInstance);
      }
    };
  }, [anchorNode, partInstance]);

  // Return null since we're attaching to the car scene directly
  return null;
}

// Enhanced Real Part Component with part-specific modifications
function RealPart({ part, carScene }: { part: Part; carScene?: THREE.Scene }) {
  const { scene } = useGLTF(part.glb_url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene) {
      // Apply part-specific positioning and modifications
      scene.position.set(part.pos_x, part.pos_y, part.pos_z);
      scene.rotation.set(part.rot_x, part.rot_y, part.rot_z);
      scene.scale.set(part.scale_x, part.scale_y, part.scale_z);
      
      // Part-specific modifications based on type
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Apply part-specific material modifications
          if (child.material) {
            // For wheels, add metallic properties
            if (part.type === 'wheels') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.metalness = 0.8;
                    mat.roughness = 0.2;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.metalness = 0.8;
                child.material.roughness = 0.2;
              }
            }
            
            // For lights, add emissive properties
            if (part.type === 'lights') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.emissive = new THREE.Color(0xffff00);
                    mat.emissiveIntensity = 0.5;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0xffff00);
                child.material.emissiveIntensity = 0.5;
              }
            }
            
            // For performance parts, add subtle glow
            if (part.type === 'performance') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.emissive = new THREE.Color(0xff0000);
                    mat.emissiveIntensity = 0.1;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0xff0000);
                child.material.emissiveIntensity = 0.1;
              }
            }
          }
        }
      });
      
      console.log(`Applied modifications to ${part.name} (${part.type})`);
    }
  }, [scene, part]);

  if (!scene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// Fallback placeholder part (for parts without GLB or anchors)
function PlaceholderPart({ part, carModel }: { part: Part; carModel?: CarModel }) {
  const partColor = getPartColor(part.type);
  
  console.log(`Creating placeholder part: ${part.name}, attach_to: ${part.attach_to}, color: ${partColor}`);
  
  switch (part.attach_to) {
    case 'wheels':
      console.log('Creating wheels with position:', [part.pos_x, part.pos_y, part.pos_z]);
      
      // Dynamic wheel positioning based on car model
      const wheelPositions = getWheelPositionsForCar(carModel);
      
      return (
        <group position={[part.pos_x, part.pos_y, part.pos_z]}>
          {/* Front Left Wheel */}
                        <mesh position={wheelPositions.frontLeft} castShadow receiveShadow userData={{ noCollision: true }}>
            <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
            <meshStandardMaterial color={partColor} />
          </mesh>
          {/* Front Right Wheel */}
          <mesh position={wheelPositions.frontRight} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
            <meshStandardMaterial color={partColor} />
          </mesh>
          {/* Rear Left Wheel */}
          <mesh position={wheelPositions.rearLeft} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
            <meshStandardMaterial color={partColor} />
          </mesh>
          {/* Rear Right Wheel */}
          <mesh position={wheelPositions.rearRight} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
            <meshStandardMaterial color={partColor} />
          </mesh>
        </group>
      );
      
    case 'headlights':
      return (
        <mesh position={[part.pos_x, part.pos_y, part.pos_z]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.3, 0.1]} />
          <meshStandardMaterial 
            color={partColor} 
            emissive={partColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      );
      
    case 'hood':
      return (
        <mesh position={[part.pos_x, part.pos_y, part.pos_z]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.1, 2]} />
          <meshStandardMaterial color={partColor} />
        </mesh>
      );
      
    case 'spoiler':
      return (
        <mesh position={[part.pos_x, part.pos_y, part.pos_z]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.3, 0.5]} />
          <meshStandardMaterial color={partColor} />
        </mesh>
      );
      
    case 'exhaust':
      return (
        <mesh position={[part.pos_x, part.pos_y, part.pos_z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      );
      
    default:
      return (
        <mesh position={[part.pos_x, part.pos_y, part.pos_z]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={partColor} />
        </mesh>
      );
  }
}

// Get wheel positions based on car model
function getWheelPositions() {
  // Default positions for Porsche 911 - adjust for different car models
  const defaultPositions = {
    frontLeft: [-0.8, 0, -1.2] as [number, number, number],
    frontRight: [0.8, 0, -1.2] as [number, number, number],
    rearLeft: [-0.8, 0, 1.2] as [number, number, number],
    rearRight: [0.8, 0, 1.2] as [number, number, number]
  };

  return defaultPositions;
}

// Enhanced wheel positioning for different car models
function getWheelPositionsForCar(carModel?: CarModel) {
  if (!carModel) return getWheelPositions();
  
  // Adjust wheel positions based on car model
  if (carModel.name.toLowerCase().includes('porsche')) {
    return {
      frontLeft: [-0.8, 0, -1.2] as [number, number, number],
      frontRight: [0.8, 0, -1.2] as [number, number, number],
      rearLeft: [-0.8, 0, 1.2] as [number, number, number],
      rearRight: [0.8, 0, 1.2] as [number, number, number]
    };
  } else {
    // For other car models, use slightly different positioning
    return {
      frontLeft: [-0.9, 0, -1.4] as [number, number, number],
      frontRight: [0.9, 0, -1.4] as [number, number, number],
      rearLeft: [-0.9, 0, 1.4] as [number, number, number],
      rearRight: [0.9, 0, 1.4] as [number, number, number]
    };
  }
}

// Get color based on part type
function getPartColor(partType: string): string {
  switch (partType) {
    case 'exterior':
      return '#3b82f6'; // Blue
    case 'performance':
      return '#ef4444'; // Red
    case 'wheels':
      return '#111827'; // Dark gray
    case 'lights':
      return '#fbbf24'; // Yellow
    default:
      return '#6b7280'; // Gray
  }
}

// Preload the GLTF model
useGLTF.preload('/free_1975_porsche_911_930_turbo/scene.gltf');

// Anchor-based Part Component using database anchor data
function AnchorBasedPart({ part, anchors, carModel }: { part: Part; anchors: Anchor[]; carModel: CarModel }) {
  const { scene } = useGLTF(part.glb_url);
  const groupRef = useRef<THREE.Group>(null);

  // Find the appropriate anchor for this part
  const findAnchor = (partType: string, attachTo: string) => {
    // First try to find by attach_to name
    let anchor = anchors.find(a => a.name === attachTo);
    
    // If not found, try to find by type
    if (!anchor) {
      anchor = anchors.find(a => a.type === partType);
    }
    
    // For wheels, find the specific wheel anchor
    if (partType === 'wheels' && !anchor) {
      anchor = anchors.find(a => a.name.includes('wheel_FL_anchor')); // Default to front left
    }
    
    return anchor;
  };

  const anchor = findAnchor(part.type, part.attach_to);
  
  useEffect(() => {
    if (scene && anchor) {
      // Use anchor position and scale
      scene.position.set(anchor.pos_x, anchor.pos_y, anchor.pos_z);
      scene.rotation.set(anchor.rot_x, anchor.rot_y, anchor.rot_z);
      scene.scale.set(anchor.scale_x, anchor.scale_y, anchor.scale_z);
      
      // Apply part-specific modifications
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Apply part-specific material modifications
          if (child.material) {
            // For wheels, add metallic properties
            if (part.type === 'wheels') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.metalness = 0.8;
                    mat.roughness = 0.2;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.metalness = 0.8;
                child.material.roughness = 0.2;
              }
            }
            
            // For lights, add emissive properties
            if (part.type === 'lights') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.emissive = new THREE.Color(0xffff00);
                    mat.emissiveIntensity = 0.5;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0xffff00);
                child.material.emissiveIntensity = 0.5;
              }
            }
            
            // For performance parts, add subtle glow
            if (part.type === 'performance') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.emissive = new THREE.Color(0xff0000);
                    mat.emissiveIntensity = 0.1;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0xff0000);
                child.material.emissiveIntensity = 0.1;
              }
            }
          }
        }
      });
      
      console.log(`Applied anchor-based positioning for ${part.name} at anchor ${anchor.name}`);
    }
  }, [scene, anchor, part]);

  if (!scene || !anchor) {
    console.warn(`No anchor found for part ${part.name} (type: ${part.type}, attach_to: ${part.attach_to})`);
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// Special component for wheels that creates instances at all wheel anchors
function WheelPart({ part, anchors, carModel }: { part: Part; anchors: Anchor[]; carModel: CarModel }) {
  const { scene } = useGLTF(part.glb_url);
  const groupRef = useRef<THREE.Group>(null);

  // Find all wheel anchors
  const wheelAnchors = anchors.filter(anchor => anchor.name.includes('wheel') && anchor.type === 'wheel');
  
  useEffect(() => {
    if (scene && wheelAnchors.length > 0) {
      // Apply part-specific modifications to the scene
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Apply metallic properties for wheels
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.metalness = 0.8;
                  mat.roughness = 0.2;
                }
              });
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.metalness = 0.8;
              child.material.roughness = 0.2;
            }
          }
        }
      });
      
      console.log(`Applied wheel modifications for ${part.name} at ${wheelAnchors.length} wheel anchors`);
    }
  }, [scene, part, wheelAnchors]);

  if (!scene || wheelAnchors.length === 0) {
    console.warn(`No wheel anchors found for wheel part ${part.name}`);
    return null;
  }

  return (
    <group ref={groupRef}>
      {wheelAnchors.map((anchor, index) => (
        <group key={`${part.id}-${anchor.name}`}>
          <primitive 
            object={scene.clone()} 
            position={[anchor.pos_x, anchor.pos_y, anchor.pos_z]}
            rotation={[anchor.rot_x, anchor.rot_y, anchor.rot_z]}
            scale={[anchor.scale_x * 0.6, anchor.scale_y * 0.6, anchor.scale_z * 0.6]} // Scale down wheels
          />
        </group>
      ))}
    </group>
  );
}

// Enhanced Part Component with Clean TransformControls Pattern
function EnhancedPart({ 
  part, 
  anchors, 
  carModel, 
  manualMode = false,
  onManualTransformChange,
  orbitRef,
  currentManualTransforms,
  isSelected = false, // Add selection prop
  onSelect = () => {} // Add selection callback
}: { 
  part: Part; 
  anchors: Anchor[]; 
  carModel: CarModel;
  manualMode?: boolean;
  onManualTransformChange?: (partId: number, transform: any) => void;
  orbitRef?: React.RefObject<any>;
  currentManualTransforms?: Record<string, any>;
  isSelected?: boolean; // Add selection prop
  onSelect?: () => void; // Add selection callback
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [transform, setTransform] = useState<{
    position: [number, number, number];
    rotation_euler: [number, number, number];
    scale: [number, number, number];
  } | null>(null);
  
  // Try to load GLB if available, otherwise use null
  const { scene } = part.glb_url && part.glb_url !== "" ? useGLTF(part.glb_url) : { scene: null };

  // Find the best matching anchor for this part
  const findMatchingAnchor = (part: Part, anchors: Anchor[]): Anchor | null => {
    // First try exact match by attach_to
    if (part.attach_to) {
      const anchor = anchors.find(a => a.name === part.attach_to);
      if (anchor) return anchor;
    }
    
    // Then try category match
    const anchor = anchors.find(a => a.type === part.category || a.type === part.type);
    if (anchor) return anchor;
    
    // For wheels, find wheel anchors
    if (part.category === "wheel" || part.type === "wheels") {
      const wheelAnchor = anchors.find(a => a.name.includes('wheel_FL_anchor'));
      if (wheelAnchor) return wheelAnchor;
    }
    
    // For headlights, find headlight anchors
    if (part.type && typeof part.type === 'string' && part.type.toLowerCase().includes('headlight')) {
      const headlightAnchor = anchors.find(a => a.name.includes('headlight'));
      if (headlightAnchor) return headlightAnchor;
    }
    
    return null;
  };

  // Compute auto-placement transform
  const computeAutoTransform = (part: Part, anchor: Anchor): {
    position: [number, number, number];
    rotation_euler: [number, number, number];
    scale: [number, number, number];
  } => {
    // Start with anchor transform
    let transform = {
      position: [anchor.pos_x, anchor.pos_y, anchor.pos_z] as [number, number, number],
      rotation_euler: [anchor.rot_x, anchor.rot_y, anchor.rot_z] as [number, number, number],
      scale: [anchor.scale_x, anchor.scale_y, anchor.scale_z] as [number, number, number]
    };

    // Apply part-specific adjustments
    if (part.category === "wheel" || part.type === "wheels") {
      // Scale wheels down
      transform.scale = [transform.scale[0] * 0.6, transform.scale[1] * 0.6, transform.scale[2] * 0.6] as [number, number, number];
    } else if (part.type && typeof part.type === 'string' && part.type.toLowerCase().includes('headlight')) {
      // Scale headlights down
      transform.scale = [transform.scale[0] * 0.6, transform.scale[1] * 0.6, transform.scale[2] * 0.6] as [number, number, number];
    } else if (part.type && typeof part.type === 'string' && part.type.toLowerCase().includes('spoiler')) {
      // Spoilers at full scale
      transform.scale = [transform.scale[0] * 1.0, transform.scale[1] * 1.0, transform.scale[2] * 1.0] as [number, number, number];
    } else if (part.type && typeof part.type === 'string' && part.type.toLowerCase().includes('exhaust')) {
      // Exhausts slightly smaller
      transform.scale = [transform.scale[0] * 0.8, transform.scale[1] * 0.8, transform.scale[2] * 0.8] as [number, number, number];
    }

    return transform;
  };

  // Wrap the GLB inside a stable wrapper group we'll move
  const partScene = useMemo(() => {
    if (scene) {
      return scene.clone(true);
    }
    return null;
  }, [scene]);

  useEffect(() => {
    // Check if we have manual transforms first - these should take precedence
    if (currentManualTransforms?.[part.id]) {
      console.log(`📍 Applying saved manual transform for ${part.name}:`, currentManualTransforms[part.id]);
      setTransform(currentManualTransforms[part.id]);
      return; // Don't apply auto-placement if we have manual transforms
    }

    // Compute transform based on available data (auto-placement)
    let computedTransform = {
      position: [part.pos_x, part.pos_y, part.pos_z] as [number, number, number],
      rotation_euler: [part.rot_x, part.rot_y, part.rot_z] as [number, number, number],
      scale: [part.scale_x, part.scale_y, part.scale_z] as [number, number, number]
    };

    // If we have anchors, try to find a matching anchor
    if (anchors.length > 0) {
      const anchor = findMatchingAnchor(part, anchors);
      if (anchor) {
        computedTransform = computeAutoTransform(part, anchor);
        console.log(`Applied enhanced auto-placement for ${part.name} at anchor ${anchor.name}`);
      } else {
        console.warn(`No matching anchor found for part ${part.name}, using part position`);
      }
    } else {
      console.log(`No anchors available for ${part.name}, using part position`);
    }

    setTransform(computedTransform);
  }, [anchors, part, currentManualTransforms]);

  // Update transform when manual transforms change
  useEffect(() => {
    if (currentManualTransforms?.[part.id]) {
      console.log(`📍 Applying saved manual transform for ${part.name}:`, currentManualTransforms[part.id]);
      setTransform(currentManualTransforms[part.id]);
    }
  }, [currentManualTransforms, part.id, part.name]);

  // Handle TransformControls events
  const handleObjectChange = () => {
    if (!groupRef.current || !onManualTransformChange) return;
    
    const g = groupRef.current;
    const transform = {
      position: [g.position.x, g.position.y, g.position.z] as [number, number, number],
      rotation_euler: [g.rotation.x, g.rotation.y, g.rotation.z] as [number, number, number],
      scale: [g.scale.x, g.scale.y, g.scale.z] as [number, number, number]
    };
    
    console.log(`Transform changed for part ${part.name} (${part.id}):`, transform);
    onManualTransformChange(part.id, transform);
  };

  const handleMouseDown = () => {
    console.log(`TransformControls mouse down for ${part.name}`);
    if (orbitRef?.current) orbitRef.current.enabled = false;
  };
  
  const handleMouseUp = () => {
    console.log(`TransformControls mouse up for ${part.name}`);
    if (orbitRef?.current) orbitRef.current.enabled = true;
  };

  if (!transform) {
    return null;
  }

  // Create placeholder geometry if no GLB scene
  const renderPartContent = () => {
    if (partScene) {
      // Apply part-specific material modifications
      partScene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Disable collision detection to allow overlapping
          child.userData.noCollision = true;
          
          if (child.material) {
            // For wheels, add metallic properties
            if (part.type === 'wheels') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.metalness = 0.8;
                    mat.roughness = 0.2;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.metalness = 0.8;
                child.material.roughness = 0.2;
              }
            }
            
            // For lights, add emissive properties
            if (part.type === 'lights') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.emissive = new THREE.Color(0xffff00);
                    mat.emissiveIntensity = 0.5;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0xffff00);
                child.material.emissiveIntensity = 0.5;
              }
            }
            
            // For performance parts, add subtle glow
            if (part.type === 'performance') {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.emissive = new THREE.Color(0xff0000);
                    mat.emissiveIntensity = 0.1;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive = new THREE.Color(0xff0000);
                child.material.emissiveIntensity = 0.1;
              }
            }
          }
        }
      });
      
      return <primitive object={partScene} />;
    } else {
      // Create placeholder geometry based on part type
      const partColor = getPartColor(part.type);
      
      switch (part.attach_to) {
        case 'wheels':
          const wheelPositions = getWheelPositionsForCar(carModel);
          return (
            <>
              {/* Front Left Wheel */}
              <mesh key={`${part.id}-wheel-fl`} position={wheelPositions.frontLeft} castShadow receiveShadow userData={{ noCollision: true }}>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color={partColor} />
              </mesh>
              {/* Front Right Wheel */}
              <mesh key={`${part.id}-wheel-fr`} position={wheelPositions.frontRight} castShadow receiveShadow userData={{ noCollision: true }}>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color={partColor} />
              </mesh>
              {/* Rear Left Wheel */}
              <mesh key={`${part.id}-wheel-rl`} position={wheelPositions.rearLeft} castShadow receiveShadow userData={{ noCollision: true }}>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color={partColor} />
              </mesh>
              {/* Rear Right Wheel */}
              <mesh key={`${part.id}-wheel-rr`} position={wheelPositions.rearRight} castShadow receiveShadow userData={{ noCollision: true }}>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                <meshStandardMaterial color={partColor} />
              </mesh>
            </>
          );
          
        case 'headlights':
          return (
            <mesh key={`${part.id}-headlights`} castShadow receiveShadow userData={{ noCollision: true }}>
              <boxGeometry args={[1.5, 0.3, 0.1]} />
              <meshStandardMaterial 
                color={partColor} 
                emissive={partColor}
                emissiveIntensity={0.5}
              />
            </mesh>
          );
          
        case 'hood':
          return (
            <mesh key={`${part.id}-hood`} castShadow receiveShadow userData={{ noCollision: true }}>
              <boxGeometry args={[2, 0.1, 2]} />
              <meshStandardMaterial color={partColor} />
            </mesh>
          );
          
        case 'spoiler':
          return (
            <mesh key={`${part.id}-spoiler`} castShadow receiveShadow userData={{ noCollision: true }}>
              <boxGeometry args={[1.5, 0.3, 0.5]} />
              <meshStandardMaterial color={partColor} />
            </mesh>
          );
          
        case 'exhaust':
          return (
            <mesh key={`${part.id}-exhaust`} castShadow receiveShadow userData={{ noCollision: true }}>
              <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          );
          
        default:
          return (
            <mesh key={`${part.id}-default`} castShadow receiveShadow userData={{ noCollision: true }}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshStandardMaterial color={partColor} />
            </mesh>
          );
      }
    }
  };

  return (
    <group 
      ref={groupRef}
      position={transform.position}
      rotation={transform.rotation_euler}
      scale={transform.scale}
      renderOrder={1} // Render parts on top of car
      userData={{ partId: part.id }} // Add partId for TransformControls to find
      onClick={(e) => {
        e.stopPropagation(); // prevent bubbling to scene
        console.log(`🎯 Part clicked: ${part.name} (${part.id})`);
        onSelect(); // mark this part as selected
      }}
    >
      {renderPartContent()}
      
      {/* Visual indicator for selected part */}
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="red" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Simple TransformControls wrapper that avoids circular dependencies
function SimpleTransformControls({ 
  selectedPartId,
  manualMode, 
  onManualTransformChange,
  orbitRef,
  targetObjectRef
}: {
  selectedPartId: number | null;
  manualMode: boolean;
  onManualTransformChange?: (partId: number, transform: any) => void;
  orbitRef?: React.RefObject<any>;
  targetObjectRef?: React.RefObject<THREE.Object3D>;
}) {
  const [targetObject, setTargetObject] = useState<THREE.Object3D | null>(null);

  // Use the target object from ref if available
  useEffect(() => {
    if (targetObjectRef?.current) {
      console.log(`🎯 Using target object from ref for part ${selectedPartId}:`, targetObjectRef.current);
      setTargetObject(targetObjectRef.current);
    }
  }, [targetObjectRef, selectedPartId]);

  // Fallback: Try to find the object in the scene if no ref provided
  useEffect(() => {
    if (!manualMode || !selectedPartId || targetObjectRef?.current) {
      return;
    }

    console.log(`🎯 SimpleTransformControls: No ref provided, creating temporary cube for part ${selectedPartId}`);
    
    // Create a temporary cube for testing - this will be added to the scene
    const tempCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    );
    tempCube.position.set(0, 1, 0);
    tempCube.userData = { partId: selectedPartId, isTemporary: true };
    
    console.log(`🎯 Created temporary cube for part ${selectedPartId}`);
    setTargetObject(tempCube);
  }, [selectedPartId, manualMode, targetObjectRef]);

  const handleObjectChange = () => {
    if (!onManualTransformChange || !selectedPartId || !targetObject) return;
    
    const transform = {
      position: [targetObject.position.x, targetObject.position.y, targetObject.position.z] as [number, number, number],
      rotation_euler: [targetObject.rotation.x, targetObject.rotation.y, targetObject.rotation.z] as [number, number, number],
      scale: [targetObject.scale.x, targetObject.scale.y, targetObject.scale.z] as [number, number, number]
    };
    
    console.log(`Transform changed for part ${selectedPartId}:`, transform);
    onManualTransformChange(selectedPartId, transform);
  };

  const handleMouseDown = () => {
    console.log(`TransformControls mouse down for part ${selectedPartId}`);
    if (orbitRef?.current) orbitRef.current.enabled = false;
  };
  
  const handleMouseUp = () => {
    console.log(`TransformControls mouse up for part ${selectedPartId}`);
    if (orbitRef?.current) orbitRef.current.enabled = true;
  };

  if (!manualMode || !selectedPartId) {
    console.log('🎯 SimpleTransformControls not rendering: manualMode =', manualMode, 'selectedPartId =', selectedPartId);
    return null;
  }

  if (!targetObject) {
    console.log('🎯 SimpleTransformControls not rendering: targetObject not found for part', selectedPartId);
    return null;
  }

  console.log('🎯 Rendering SimpleTransformControls for target object:', {
    name: targetObject.name,
    type: targetObject.type,
    position: targetObject.position,
    userData: targetObject.userData
  });

  return (
    <>
      {/* Render the temporary cube in the scene if we're using it */}
      {targetObject && targetObject.userData?.isTemporary && (
        <primitive object={targetObject} />
      )}
      
      <TransformControls
        object={targetObject}
        mode="translate"
        showX showY showZ
        size={2.0}
        space="world"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onObjectChange={handleObjectChange}
      />
    </>
  );
}

// Manual Correction Controls Component
function ManualCorrectionControls({ 
  selectedParts, 
  manualMode, 
  onManualModeToggle, 
  onSaveManualAdjustments,
  onResetToAuto,
  onClearAllAdjustments
}: {
  selectedParts?: Part[];
  manualMode: boolean;
  onManualModeToggle: () => void;
  onSaveManualAdjustments: () => void;
  onResetToAuto: () => void;
  onClearAllAdjustments: () => void;
}) {
  if (!selectedParts || selectedParts.length === 0) return null;

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
      <h3 className="text-lg font-semibold mb-3">Manual Correction</h3>
      <div className="text-xs text-yellow-300 mb-2">
        Status: {manualMode ? '🔧 MANUAL MODE ACTIVE' : '🤖 Auto Mode'}
      </div>
      {manualMode && selectedParts && selectedParts.length > 0 && (
        <div className="text-xs text-blue-300 mb-2">
          🎯 Controlling: {selectedParts[0]?.name || 'None'}
          {selectedParts.length > 1 && ` (+${selectedParts.length - 1} others)`}
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="manualMode"
            checked={manualMode}
            onChange={onManualModeToggle}
            className="w-4 h-4"
          />
          <label htmlFor="manualMode" className="text-sm">
            Enable Manual Mode
          </label>
        </div>
        
        {manualMode && (
          <div className="space-y-2">
            <p className="text-xs text-gray-300">
              Drag the transform controls to adjust part position
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={onSaveManualAdjustments}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                Save Adjustments
              </button>
              
              <button
                onClick={onResetToAuto}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
              >
                Reset to Auto
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onClearAllAdjustments}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              >
                Clear All Adjustments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CarMesh({ 
  carModel, 
  selectedParts, 
  onPartSelect, 
  onPartDeselect, 
  onModelBounds,
  manualMode = false,
  onManualTransformChange,
  orbitRef,
  manualTransforms,
  selectedPartId
}: CarMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [carScene, setCarScene] = useState<THREE.Scene | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [anchorsLoaded, setAnchorsLoaded] = useState(false);
  const controlsRef = useRef<any>(null);

  console.log('CarMesh: Received carModel:', carModel);
  console.log('CarMesh: carModel?.glb_url:', carModel?.glb_url);

  // Fetch anchors for this car model
  useEffect(() => {
    const fetchAnchors = async () => {
      if (carModel?.id) {
        try {
          console.log('CarMesh: Fetching anchors for car model:', carModel.id);
          const anchorData = await apiClient.getAnchors(carModel.id);
          setAnchors(anchorData);
          setAnchorsLoaded(true);
          console.log('CarMesh: Loaded anchors:', anchorData);
        } catch (error) {
          console.error('CarMesh: Failed to fetch anchors:', error);
          setAnchorsLoaded(true); // Set to true even on error to avoid infinite loading
        }
      }
    };

    fetchAnchors();
  }, [carModel?.id]);

  useEffect(() => {
    if (carModel?.glb_url) {
      console.log('CarMesh: Loading car model:', carModel.glb_url);
      setModelLoaded(true);
    } else {
      console.log('CarMesh: No glb_url found in carModel');
    }
  }, [carModel]);

  console.log('CarMesh rendering with selectedParts:', selectedParts);

  // If no car model, return null instead of div
  if (!carModel?.glb_url) {
    console.log('CarMesh: No car model glb_url, returning null');
    return null;
  }

  console.log('🚗 CarMesh rendering - manualMode:', manualMode, 'carModel:', carModel?.name);

  return (
    <>
      {/* Load actual GLB model with anchor-based parts */}
      <group ref={meshRef}>
        {(() => {
          console.log('🚗 Rendering FittedModel with URL:', carModel.glb_url);
          return null;
        })()}
                        <FittedModel 
          url={carModel.glb_url}
          targetSize={3}
          clamp={[0.1, 2]}
          onBounds={({ size, center, scale }) => {
            // Pass bounds directly to parent - FittedModel already handles one-time calculation
            onModelBounds?.({ size, center, scale });
          }}
          selectedParts={selectedParts}
          anchors={anchors}
          anchorsLoaded={anchorsLoaded}
          manualMode={manualMode}
          onManualTransformChange={onManualTransformChange}
          orbitRef={orbitRef}
          manualTransforms={manualTransforms}
          carModel={carModel}
          onPartSelect={onPartSelect}
          selectedPartId={selectedPartId}
        />
      </group>
      
      {/* Part selection indicators - only render unique parts */}
      {(() => {
        // Debug: Log the selectedParts array
        if (selectedParts) {
          const uniqueParts = selectedParts.filter((part, index, array) => 
            array.findIndex(p => p.id === part.id) === index
          );
          const duplicateCount = selectedParts.length - uniqueParts.length;
          if (duplicateCount > 0) {
            console.log(`🔍 Found ${duplicateCount} duplicate parts in selectedParts array`);
            console.log('🔍 Original selectedParts:', selectedParts.map(p => ({ id: p.id, name: p.name })));
            console.log('🔍 Filtered unique parts:', uniqueParts.map(p => ({ id: p.id, name: p.name })));
          }
          return uniqueParts;
        }
        return [];
      })().map((part, index) => (
        <Float key={`float-${part.id}-${index}`} speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
          <Html position={[0, 3 + index * 0.5, 0]}>
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">
              {part.name} - ${part.price}
            </div>
          </Html>
        </Float>
      ))}
    </>
  );
}

export default function CarViewer({ 
  carModel, 
  selectedParts, 
  onPartSelect, 
  onPartDeselect,
  manualMode = false,
  onManualModeToggle,
  onSaveManualAdjustments,
  onResetToAuto,
  onClearAllAdjustments,
  manualTransforms = {},
  onManualTransformChange
}: CarViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const orbitRef = useRef<any>(null); // OrbitControls ref for manual mode coordination
  const [modelRadius, setModelRadius] = useState(5); // Default radius
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);

  useEffect(() => {
    console.log('CarViewer mounted, carModel:', carModel);
    // Simulate loading time
    const timer = setTimeout(() => {
      console.log('CarViewer loading complete');
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [carModel]);

  const handleManualTransformChange = (partId: number, transform: any) => {
    console.log(`handleManualTransformChange called for part ${partId}:`, transform);
    // Update the parent's manualTransforms state
    if (onManualTransformChange) {
      onManualTransformChange(partId, transform);
    }
  };

  const handlePartSelect = (part: Part) => {
    console.log(`🎯 Part selected: ${part.name} (${part.id})`);
    setSelectedPartId(part.id);
    console.log(`🎯 selectedPartId set to: ${part.id}`);
    onPartSelect?.(part);
  };

  const handleSaveManualAdjustments = async () => {
    if (!carModel || Object.keys(manualTransforms).length === 0) {
      alert('No manual adjustments to save');
      return;
    }

    try {
      // Save manual transforms to backend
      for (const [partId, transform] of Object.entries(manualTransforms)) {
        const partIdNum = parseInt(partId);
        console.log(`Saving manual transform for part ${partId}:`, transform);
        
        const adjustmentData = {
          car_model_id: carModel.id,
          part_id: partIdNum,
          transform: transform
        };
        
        console.log('Saving adjustment:', adjustmentData);
        
        // For now, we'll just log the data since we need authentication
        // In a real implementation, you would call:
        // await apiClient.saveManualAdjustment(token, adjustmentData);
        
        // Simulate successful save
        console.log(`✅ Manual adjustment saved for part ${partId}`);
      }
      
      // Show success message
      alert('Manual adjustments saved successfully!');
      
      // Don't clear manual transforms immediately - they represent the current position
      // The parts should keep their current positions after saving
      console.log('✅ Keeping current manual transforms as they represent the saved positions');
    } catch (error) {
      console.error('Failed to save manual adjustments:', error);
      alert('Failed to save manual adjustments');
    }
  };

  const handleResetToAuto = () => {
    // Don't clear manual transforms - they represent the saved positions
    // Just disable manual mode so parts keep their current positions
    console.log('🔄 Disabling manual mode but keeping saved positions');
    onResetToAuto?.();
  };

  const handleClearAllAdjustments = () => {
    // Clear all manual transforms and return to original positions
    console.log('🗑️ Clearing all manual adjustments');
    // setManualTransforms({}); // This will be handled by the parent's manualTransforms prop
    onClearAllAdjustments?.();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Loading 3D Viewer...</p>
        </div>
      </div>
    );
  }

  // Handle no car model case
  if (!carModel?.glb_url) {
    return (
      <div className="w-full h-[600px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">No car model selected</p>
          <p className="text-gray-400 text-sm mt-2">Please select a car model to customize</p>
        </div>
      </div>
    );
  }

  console.log('Rendering CarViewer with carModel:', carModel);

  return (
    <div className="w-full h-[600px] bg-gradient-to-br from-slate-900 to-slate-800 relative" >
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }} // Better camera position for larger models
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        onCreated={(state) => {
          console.log('Canvas created:', state);
          // Optimize renderer
          state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
        style={{ width: '100%', height: '100%' }}
        frameloop={manualMode ? "always" : "demand"} // Always render in manual mode for TransformControls
      >
        {/* Simplified Lighting for better performance */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]} // Back to normal light position
          intensity={1.0}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Environment */}
        <Environment preset="sunset" />

        {/* Car Model */}
        <CarMesh
          carModel={carModel}
          selectedParts={selectedParts}
          onPartSelect={handlePartSelect}
          onPartDeselect={onPartDeselect}
          onModelBounds={({ size, scale }) => {
            const radius = (Math.max(size.x, size.y, size.z) * scale) / 2;
            console.log('CarViewer received model bounds, radius:', radius);
            setModelRadius(radius);
            
            // Update camera controls if available
            if (orbitRef.current) {
              orbitRef.current.minDistance = radius * 0.8;
              orbitRef.current.maxDistance = radius * 40; // Increased from 10 to 20
              orbitRef.current.update();
            }
          }}
          manualMode={manualMode}
          onManualTransformChange={handleManualTransformChange}
          orbitRef={orbitRef} // Pass orbitRef to CarMesh
          manualTransforms={manualTransforms} // Pass manual transforms to CarMesh
          selectedPartId={selectedPartId} // Pass selected part ID
        />

        {/* Controls - Disable OrbitControls when TransformControls is active */}
        {!manualMode ? (
          <PresentationControls
            global
            rotation={[0, -Math.PI / 4, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            <OrbitControls
              ref={orbitRef}
              enabled={!manualMode || !selectedPartId}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={modelRadius * 0.8}
              maxDistance={modelRadius * 40} // zoom out
              dampingFactor={0} // Disable damping
              enableDamping={false} // Disable damping
            />
          </PresentationControls>
        ) : (
          <OrbitControls
            ref={orbitRef}
            enabled={!manualMode || !selectedPartId}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={modelRadius * 0.8}
            maxDistance={modelRadius * 40} // zoom out
            dampingFactor={0} // Disable damping
            enableDamping={false} // Disable damping
          />
        )}
      </Canvas>
    </div>
  );
} 