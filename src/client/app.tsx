import { Canvas } from '@react-three/fiber'
import { Scene } from './components/canvas/scene'
import { useStore } from './store/store'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

const MOCK_GRAVES = [
  { id: '0xDEADBEEF', name: 'Satoshi', epitaph: 'The genesis block remains eternal.', date: '2009-01-03', position: [0, 5, 0] as [number, number, number] },
  { id: '0x13F29F2E', name: 'Digital Soul #1', epitaph: 'In memory of lost data.', date: '2024-01-01', position: [30, 8, -20] as [number, number, number] }
];

function App() {
  const { setGraves } = useStore()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const fetchGraves = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/graves')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setGraves(data)
        setIsOffline(false)
      } catch (e) {
        console.warn('Backend offline, using mock data.')
        setGraves(MOCK_GRAVES)
        setIsOffline(true)
      }
    }
    fetchGraves()
  }, [setGraves])

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [80, 60, 80], fov: 25 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          shadowMapType: THREE.PCFShadowMap
        }}
      >
        <Scene />
      </Canvas>

      {/* Brand — top left */}
      <div className="fixed top-8 left-8 z-50 pointer-events-none">
        <h1 className="font-mono text-[28px] font-bold tracking-[-1px] text-white">
          0xRIP
        </h1>
        <div className="text-[#555555] text-[10px] font-mono tracking-[3px] uppercase mt-1">
          DIGITAL GRAVEYARD
        </div>
      </div>

      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed top-8 right-8 z-50 text-[#ff4444] text-[10px] font-mono">
          OFFLINE
        </div>
      )}

    </div>
  )
}

export default App
