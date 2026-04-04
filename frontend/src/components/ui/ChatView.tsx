import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'

export const ChatView = () => {
  const { selectedGrave, selectGrave, messages, addMessage, lang, updateGrave } = useStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMusicGenerating, setIsMusicGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || !selectedGrave || isTyping) return
    const userMsg = input.trim()
    addMessage({ role: 'user', content: userMsg })
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch(`http://localhost:8000/api/summon/${selectedGrave.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await response.json()
      addMessage({ role: data.role || 'ghost', content: data.reply })
    } catch (error) {
      addMessage({ role: 'system', content: 'SIGNAL LOST.' })
    } finally {
      setIsTyping(false)
    }
  }

  const handleGenerateMusic = async () => {
    if (!selectedGrave || isMusicGenerating) return
    setIsMusicGenerating(true)
    try {
      const res = await fetch(`http://localhost:8000/api/summon/${selectedGrave.id}/requiem`, { method: 'POST' })
      const data = await res.json()
      if (data.data?.audio) {
        // MiniMax 返回的是 URL 或 hex，这里假设返回了 URL
        updateGrave(selectedGrave.id, { videoUrl: data.data.audio }) // 临时复用 videoUrl 字段演示播放
      }
    } catch (e) {
      console.error("Music generation failed", e)
    } finally {
      setIsMusicGenerating(false)
    }
  }

  if (!selectedGrave) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      className="fixed right-0 top-0 h-full w-[400px] bg-white/90 backdrop-blur-2xl border-l border-mv-gray-light flex flex-col shadow-2xl z-50 shadow-sheikah-blue/5"
    >
      <div className="p-8 border-b border-mv-gray-light flex justify-between items-start bg-mv-bg/20">
        <div>
          <h2 className="font-serif text-3xl text-mv-charcoal tracking-tight">{selectedGrave.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sheikah-blue animate-pulse" />
            <p className="text-[9px] tracking-[0.3em] text-mv-text-dim uppercase">Resonance Link Active</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleGenerateMusic}
            disabled={isMusicGenerating}
            className="p-2 border border-mv-gray-light rounded-full hover:border-sheikah-blue transition-all disabled:opacity-30"
            title="Generate Requiem"
          >
            {isMusicGenerating ? '⏳' : '🎵'}
          </button>
          <button onClick={() => selectGrave(null)} className="text-mv-gray hover:text-red-500 transition-colors text-xl px-2">✕</button>
        </div>
      </div>

      <div className="px-8 py-4 bg-mv-charcoal text-white/90 text-[11px] font-serif italic tracking-wide">
        "{selectedGrave.epitaph}"
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`text-[8px] uppercase tracking-widest mb-2 ${msg.role === 'user' ? 'text-mv-text-dim' : 'text-sheikah-blue'}`}>
              {msg.role === 'user' ? 'Visitor' : 'Soul'}
            </div>
            <div className={`max-w-[95%] p-5 rounded-2xl text-sm ${
              msg.role === 'user' ? 'bg-mv-charcoal text-white' : 'bg-mv-bg border border-mv-gray-light text-mv-charcoal font-serif'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[8px] text-sheikah-blue animate-pulse uppercase tracking-widest">Resonating...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 border-t border-mv-gray-light bg-white/50">
        <div className="relative">
          <input 
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Whisper..."
            className="w-full bg-mv-bg border border-mv-gray-light rounded-full px-6 py-4 text-sm focus:border-sheikah-blue outline-none"
          />
          <button 
            onClick={handleSend} disabled={!input.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-mv-charcoal text-white rounded-full flex items-center justify-center hover:bg-sheikah-blue transition-all"
          >
            →
          </button>
        </div>
      </div>
    </motion.div>
  )
}
