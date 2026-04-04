import { Canvas } from '@react-three/fiber'
import { Scene } from './components/canvas/Scene'
import { ChatView } from './components/ui/ChatView'
import { useStore } from './store/useStore'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// Mock Fallback Data
const MOCK_GRAVES = [
  { id: '0xDEADBEEF', name: 'Satoshi', epitaph: 'The genesis block remains eternal.', position: [0, 5, 0] },
  { id: '0x13F29F2E', name: 'Digital Soul #1', epitaph: 'In memory of lost data.', position: [30, 8, -20] }
];

function App() {
  const { setGraves, graves, selectGrave, selectedGrave, lang } = useStore()
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
    <div className="w-screen h-screen overflow-hidden bg-[#fafafa]">
      {/* 3D Canvas Layer */}
      <Canvas
        shadows
        camera={{ position: [80, 60, 80], fov: 25 }}
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          shadowMapType: THREE.PCFShadowMap // 修复过时警告
        }}
      >
        <Scene />
      </Canvas>

      {/* Brand Overlay */}
      <div className="fixed top-[40px] left-[50px] z-50 pointer-events-none">
        <h1 className="font-serif text-[32px] font-light tracking-tight text-[#404040] flex items-center gap-3">
          0xRIP 
          {isOffline && <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-mono tracking-normal">LOCAL_MOCK</span>}
        </h1>
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#666666] mt-1">
          {lang === 'en' ? 'Digital Graveyard System' : '数字墓地系统'}
        </div>
      </div>

      {/* Quick Select Cards (Bottom) */}
      {!selectedGrave && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-4 p-4 overflow-x-auto max-w-[90vw] z-40 no-scrollbar">
          {graves.map(grave => (
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => selectGrave(grave)}
              key={grave.id}
              className="bg-white/80 backdrop-blur-md border border-mv-gray-light px-6 py-4 rounded-xl cursor-pointer hover:border-sheikah-blue transition-all"
            >
              <div className="text-[9px] text-mv-text-dim tracking-widest uppercase mb-1 opacity-50">{grave.id}</div>
              <div className="text-mv-charcoal font-serif text-lg">{grave.name}</div>
            </motion.div>
          ))}
          {isOffline && <div className="text-red-500 font-mono text-[10px] opacity-50">OFFLINE: Using Local Soul Fragments</div>}
        </div>
      )}

      {/* Soul Dialogue (Right Sidebar) */}
      <AnimatePresence>
        {selectedGrave && (
          <ChatView />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] text-[#999999] opacity-50 uppercase z-30">
        Resonance Link Stable · Monument Valley Core v1.0
      </div>
    </div>
  )
}

export default App
