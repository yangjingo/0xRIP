import { Canvas } from '@react-three/fiber'
import { Scene } from './components/canvas/Scene'
import { SheikahPanel } from './components/ui/SheikahPanel'
import { useStore } from './store/useStore'
import { useEffect } from 'react'
import * as THREE from 'three'

// Mock Data
const MOCK_DATA = [
  { id: '0x13F29F2E', name: 'Memory of Spring', epitaph: 'while(alive) { love++; }', position: [0, 2, 0] },
  { id: '0xA7B3C9D1', name: 'The Last Conversation', epitaph: 'Ended at line 1024', position: [-8, 4, -20] },
  { id: '0xF8E2D4C5', name: 'Unsent Letters', epitaph: 'Drafts folder full', position: [28, 7, 8] },
] as const;

function App() {
  const { setGraves, lang } = useStore()

  useEffect(() => {
    // Simulate API fetch
    setGraves(MOCK_DATA.map(d => ({...d, position: d.position as [number, number, number]})))
  }, [setGraves])

  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* 3D Canvas Layer */}
      <Canvas
        shadows
        camera={{ position: [60, 50, 60], fov: 30 }}
        gl={{ 
          antialias: false, 
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance"
        }}
      >
        <Scene />
      </Canvas>

      {/* HTML Overlay Layer */}
      <div className="fixed top-[30px] left-[40px] pointer-events-none z-50">
        <h1 className="font-serif text-[28px] font-light tracking-tight text-mv-charcoal">0xRIP</h1>
        <div className="text-[10px] tracking-[0.3em] uppercase text-mv-gray-dark mt-1">
          {lang === 'en' ? 'Digital Memorial' : '数字纪念碑'}
        </div>
      </div>

      <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-[11px] text-mv-text-dim z-40">
        {lang === 'en' ? 'Drag to rotate · Scroll to zoom · Click monument' : '拖拽旋转 · 滚轮缩放 · 点击纪念碑'}
      </div>

      {/* Panel */}
      <SheikahPanel />
    </div>
  )
}

export default App
