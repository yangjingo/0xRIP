import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../store/store'
import * as THREE from 'three'

export const Ghost = () => {
  const groupRef = useRef<THREE.Group>(null)
  const { selectedGrave } = useStore()
  const targetPos = useRef(new THREE.Vector3(5, 8, 5))

  useEffect(() => {
    if (selectedGrave) {
      targetPos.current.set(
        selectedGrave.position[0] + 2.5,
        selectedGrave.position[1] + 3.5,
        selectedGrave.position[2] + 2.5
      )
    }
  }, [selectedGrave])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 1.8) * 0.008
    groupRef.current.rotation.y += 0.004
    groupRef.current.position.lerp(targetPos.current, 0.04)
  })

  return (
    <group ref={groupRef}>
      {/* Core */}
      <mesh>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#111111" roughness={0.3} metalness={0.9} flatShading />
      </mesh>
      {/* Glow */}
      <mesh>
        <icosahedronGeometry args={[1.0, 2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} transparent opacity={0.15} />
      </mesh>
      {/* Wireframe */}
      <mesh>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  )
}
