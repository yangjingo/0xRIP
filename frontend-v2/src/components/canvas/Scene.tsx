import { CameraControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useStore } from '../../store/useStore'
import { useEffect, useRef } from 'react'
import { Grave } from './Grave'
import { Ghost } from './Ghost'

// Architecture components mock for minimal setup
const Architecture = () => (
  <group>
    {/* Main Platform */}
    <mesh position={[0, -2, 0]} receiveShadow castShadow>
      <boxGeometry args={[20, 4, 20]} />
      <meshStandardMaterial color="#ffffff" roughness={0.9} />
    </mesh>
    {/* Arch */}
    <mesh position={[-15, 4, 20]} receiveShadow castShadow>
      <boxGeometry args={[10, 8, 2]} />
      <meshStandardMaterial color="#ffffff" roughness={0.9} />
    </mesh>
  </group>
)

export const Scene = () => {
  const { graves, selectedGrave } = useStore()
  const cameraControlRef = useRef<CameraControls>(null)

  useEffect(() => {
    if (selectedGrave && cameraControlRef.current) {
      // Smooth focus
      const [x, y, z] = selectedGrave.position
      cameraControlRef.current.setLookAt(
        x + 15, y + 12, z + 15, // Eye pos
        x, y, z, // Target pos
        true // Animate
      )
    }
  }, [selectedGrave])

  return (
    <>
      <color attach="background" args={['#f0f0f5']} />
      <fogExp2 attach="fog" args={['#f0f0f5', 0.012]} />

      <CameraControls 
        ref={cameraControlRef}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={20}
        maxDistance={150}
      />
      {/* Fallback to Orbit autoRotate handling if needed, CameraControls has it too */}

      <hemisphereLight args={['#ffffff', '#c0c0c0', 0.6]} />
      <directionalLight 
        position={[30, 50, 20]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      <Architecture />
      
      {graves.map((grave) => (
        <Grave key={grave.id} data={grave} />
      ))}

      <Ghost />

      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.85} 
          luminanceSmoothing={0.025} 
          intensity={1.5} 
          radius={0.4}
        />
      </EffectComposer>
    </>
  )
}
