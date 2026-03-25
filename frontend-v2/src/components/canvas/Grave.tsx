import { forwardRef } from 'react'
import { Html } from '@react-three/drei'
import { useStore } from '../../store/useStore'
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
      onClick={(e) => {
        e.stopPropagation()
        selectGrave(data)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {/* 墓碑主体 */}
      <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 3.5, 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* 墓碑顶部盖子 */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.4, 8]} />
        <meshStandardMaterial color="#404040" roughness={0.7} flatShading />
      </mesh>

      {/* 希卡之石发光阵法 (选中状态) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3, 32]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={isSelected ? 0.9 : 0} 
        />
      </mesh>

      {/* 悬浮提示框 */}
      {!isSelected && (
        <Html distanceFactor={15} center position={[0, 5, 0]}>
          <div className="opacity-0 hover:opacity-100 transition-opacity bg-[#404040] text-white px-3 py-2 rounded pointer-events-none whitespace-nowrap">
            <div className="font-serif text-lg">{data.name}</div>
            <div className="text-[9px] font-mono opacity-60">{data.id}</div>
          </div>
        </Html>
      )}
    </group>
  )
})
