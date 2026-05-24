import { forwardRef } from 'react'
import { Html } from '@react-three/drei'
import { useStore } from '../../store/store'
import * as THREE from 'three'

interface GraveProps {
  data: {
    id: string;
    name: string;
    epitaph: string;
    position: [number, number, number];
  };
}

export const Grave = forwardRef<THREE.Group, GraveProps>(({ data }, ref) => {
  const { selectedGrave, selectGrave } = useStore()
  const isSelected = selectedGrave?.id === data.id

  return (
    <group
      ref={ref}
      position={data.position}
      onClick={(e) => { e.stopPropagation(); selectGrave(data) }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      {/* Body — dark slab */}
      <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 3.5, 1.6]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.3, 0.35, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} flatShading />
      </mesh>

      {/* Wireframe — visible on selection */}
      <mesh position={[0, 1.75, 0]}>
        <boxGeometry args={[1.85, 3.55, 1.65]} />
        <meshBasicMaterial
          color={isSelected ? '#ffffff' : '#222222'}
          wireframe
          transparent
          opacity={isSelected ? 1 : 0.3}
        />
      </mesh>

      {/* Selection ring */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.6, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={isSelected ? 0.8 : 0} />
      </mesh>
    </group>
  )
})
