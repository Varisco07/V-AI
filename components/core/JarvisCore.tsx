'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion } from 'framer-motion'
import * as THREE from 'three'

interface CoreSphereProps {
  status: string
}

function CoreSphere({ status }: CoreSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef1 = useRef<THREE.Mesh>(null)
  const ringRef2 = useRef<THREE.Mesh>(null)
  const ringRef3 = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime()
    
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1
    }
    
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.5
    }
    
    if (ringRef2.current) {
      ringRef2.current.rotation.z -= delta * 0.7
    }
    
    if (ringRef3.current) {
      ringRef3.current.rotation.z += delta * 0.4
    }
  })

  return (
    <group>
      {/* Core Sphere - Optimized */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#00D9FF"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Inner Glow */}
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial
          color="#00D9FF"
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Rotating Rings - Optimized */}
      <mesh ref={ringRef1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.02, 8, 50]} />
        <meshBasicMaterial color="#00D9FF" />
      </mesh>

      <mesh ref={ringRef2} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.3, 0.02, 8, 50]} />
        <meshBasicMaterial color="#0A84FF" />
      </mesh>

      <mesh ref={ringRef3} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.6, 0.02, 8, 50]} />
        <meshBasicMaterial color="#FF6B35" />
      </mesh>
    </group>
  )
}

export default function JarvisCore({ status }: CoreSphereProps) {
  return (
    <motion.div
      className="relative w-64 h-64"
      animate={{
        scale: status === 'active' ? [1, 1.05, 1] : 1,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-stark-cyan/20 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* 3D Canvas - Performance optimized */}
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ 
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true
        }}
        dpr={1}
        performance={{ min: 0.5 }}
      >
        <CoreSphere status={status} />
      </Canvas>

      {/* Status Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-stark-cyan/30 animate-pulse-slow" />
      
      {/* Reduced particles for performance */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-stark-cyan rounded-full shadow-neon-cyan"
          style={{
            top: '50%',
            left: '50%',
          }}
          animate={{
            x: [0, Math.cos((i * Math.PI) / 2) * 200, 0],
            y: [0, Math.sin((i * Math.PI) / 2) * 200, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  )
}