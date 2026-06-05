'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

interface NeuralSphereProps {
  intensity?: number
  color?: string
}

export default function NeuralSphere({ 
  intensity = 1, 
  color = '#00D9FF' 
}: NeuralSphereProps) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  // Create particles around sphere
  const particleCount = 200
  const positions = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = 2 + Math.random() * 2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    
    positions[i] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i + 2] = radius * Math.cos(phi)
  }

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (sphereRef.current) {
      sphereRef.current.rotation.y = time * 0.2
      sphereRef.current.rotation.x = Math.sin(time * 0.1) * 0.2
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.1
      particlesRef.current.rotation.z = time * 0.05
    }
  })

  return (
    <group>
      {/* Main Neural Sphere */}
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={0.5}
      >
        <Sphere ref={sphereRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={color}
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={intensity * 0.5}
            transparent
            opacity={0.8}
          />
        </Sphere>
      </Float>

      {/* Inner Glow */}
      <Sphere args={[0.95, 32, 32]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer Wireframe */}
      <Sphere args={[1.2, 32, 32]}>
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={0.2}
        />
      </Sphere>

      {/* Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color={color}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Core Light */}
      <pointLight
        position={[0, 0, 0]}
        intensity={intensity * 2}
        color={color}
        distance={10}
      />

      {/* Rim Lights */}
      <pointLight
        position={[2, 2, 2]}
        intensity={intensity}
        color={color}
        distance={5}
      />
      <pointLight
        position={[-2, -2, -2]}
        intensity={intensity}
        color="#0A84FF"
        distance={5}
      />
    </group>
  )
}