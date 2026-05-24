import { CameraControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useStore } from '../../store/store'
import { useEffect, useRef } from 'react'
import { Grave } from './grave'
import { Terminal } from '../ui/terminal'

const FloorGrid = () => {
  const size = 40; const step = 2
  const positions: number[] = []
  for (let i = -size / 2; i <= size / 2; i += step) {
    positions.push(i, -2, -size / 2, i, -2, size / 2)
    positions.push(-size / 2, -2, i, size / 2, -2, i)
  }
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(positions), 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#1a1a1a" transparent opacity={0.3} />
    </lineSegments>
  )
}

const Architecture = () => (
  <group>
    <mesh position={[0, -2.5, 0]} receiveShadow castShadow>
      <boxGeometry args={[24, 1, 24]} />
      <meshStandardMaterial color="#111111" roughness={0.95} />
    </mesh>
    <mesh position={[-18, 4, 22]} receiveShadow castShadow>
      <boxGeometry args={[12, 9, 2]} />
      <meshStandardMaterial color="#111111" roughness={0.95} />
    </mesh>
    <FloorGrid />
  </group>
)

export const Scene = () => {
  const { graves, selectedGrave } = useStore()
  const cameraControlRef = useRef<CameraControls>(null)

  useEffect(() => {
    if (selectedGrave && cameraControlRef.current) {
      const [x, y, z] = selectedGrave.position
      cameraControlRef.current.setLookAt(x + 20, y + 16, z + 20, x, y, z, true)
    }
  }, [selectedGrave])

  return (
    <>
      <color attach="background" args={['#000000']} />
      <fogExp2 attach="fog" args={['#000000', 0.006]} />

      <CameraControls ref={cameraControlRef} maxPolarAngle={Math.PI / 2.1} minDistance={15} maxDistance={200}
        dollySpeed={0.8} truckSpeed={0.6} azimuthRotateSpeed={0.5} polarRotateSpeed={0.5} />

      <ambientLight intensity={0.12} color="#222222" />
      <directionalLight position={[30, 50, 20]} intensity={0.35} color="#ffffff" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-50} shadow-camera-right={50}
        shadow-camera-top={50} shadow-camera-bottom={-50} />

      <Architecture />

      {graves.map((grave) => (
        <Grave key={grave.id} data={grave} />
      ))}

      {/* Terminal — anchored to selected grave in 3D space */}
      <Html
        position={selectedGrave
          ? [selectedGrave.position[0], selectedGrave.position[1] + 1, selectedGrave.position[2] + 3.5]
          : [0, 3, 10]}
        transform distanceFactor={21}
        occlude={false} zIndexRange={[50, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{ width: 880 }}>
          <Terminal />
        </div>
      </Html>

      <EffectComposer>
        <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.02} intensity={1.0} radius={0.3} />
      </EffectComposer>
    </>
  )
}
