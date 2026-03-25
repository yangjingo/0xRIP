import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../store/useStore'
import * as THREE from 'three'

export const Ghost = () => {
  const groupRef = useRef<THREE.Group>(null)
  const { selectedGrave } = useStore()
  const targetPos = useRef(new THREE.Vector3(5, 8, 5))

  useEffect(() => {
    if (selectedGrave) {
      targetPos.current.set(
        selectedGrave.position[0] + 3,
        selectedGrave.position[1] + 3,
        selectedGrave.position[2] + 3
      )
    }
  }, [selectedGrave])

  useFrame((state) => {
    if (!groupRef.current) return

    // Float animation
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.01
    groupRef.current.rotation.y += 0.005

    // Smooth move to target (Lerp)
    groupRef.current.position.lerp(targetPos.current, 0.05)
  })

  return (
    <group ref={groupRef}>
      {/* Core */}
      <mesh>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial 
          color="#808080" 
          emissive="#222222" 
          roughness={0.4} 
          metalness={0.8} 
          flatShading 
        />
      </mesh>
      {/* Cyberpunk Glow Aura */}
      <mesh>
        <icosahedronGeometry args={[1.2, 2]} />
        <meshStandardMaterial 
          color="#00d4ff" 
          emissive="#00d4ff" 
          emissiveIntensity={1.0} 
          transparent 
          opacity={0.3} 
        />
      </mesh>
    </group>
  )
}
