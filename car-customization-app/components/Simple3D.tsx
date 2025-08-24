'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function SimpleBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

export default function Simple3D() {
  return (
    <div style={{ width: '100%', height: '400px', border: '3px solid yellow', backgroundColor: 'black' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1} />
        <SimpleBox />
        <OrbitControls />
      </Canvas>
    </div>
  );
} 