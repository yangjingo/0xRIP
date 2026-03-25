import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store/useStore'

export const ChatView = () => {
  const { setChatOpen, selectedGrave, messages, addMessage, lang } = useStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const t = {
    title: lang === 'en' ? 'Neural Link' : '神经连接',
    placeholder: lang === 'en' ? 'Type a message...' : '输入信息...',
    send: lang === 'en' ? 'SEND' : '发送',
    close: lang === 'en' ? 'DISCONNECT' : '断开连接',
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !selectedGrave) return
    
    // User message
    addMessage({ role: 'user', content: input })
    setInput('')

    // Mock ghost reply
    setTimeout(() => {
      const replies = lang === 'en' ? [
        "I remember that too...",
        "Some data is corrupted, but the feeling remains.",
        "It's cold here, but your voice brings warmth.",
        "01001000 01000101 01001100 01010000"
      ] : [
        "我也记得那件事...",
        "部分数据已损坏，但那种感觉还在。",
        "这里很冷，但你的声音带来了温度。",
        "在虚无中，我依然能听到你的呼唤。"
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)]
      addMessage({ role: 'ghost', content: randomReply })
    }, 1500)
  }

  if (!selectedGrave) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full w-full bg-white border-l border-mv-gray-light"
    >
      {/* Header */}
      <div className="h-14 border-b border-mv-gray-light flex items-center justify-between px-6 bg-mv-bg/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-sheikah-blue animate-pulse shadow-[0_0_8px_#00d4ff]" />
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-mv-charcoal">{t.title}</div>
            <div className="text-xs font-serif text-mv-text-dim mt-0.5">{selectedGrave.name}</div>
          </div>
        </div>
        <button 
          onClick={() => setChatOpen(false)}
          className="text-[10px] px-3 py-1.5 border border-mv-gray-light rounded tracking-widest text-mv-text-dim hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors"
        >
          {t.close}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'self-end items-end' : msg.role === 'system' ? 'self-center items-center max-w-full' : 'self-start items-start'}`}
          >
            {msg.role === 'system' ? (
              <div className="text-[10px] text-sheikah-blue font-mono text-center tracking-wider bg-sheikah-blue/10 px-4 py-1.5 rounded-full border border-sheikah-blue/20 shadow-[0_0_10px_rgba(0,212,255,0.1)]">
                {msg.content}
              </div>
            ) : (
              <>
                <div className="text-[9px] text-mv-text-dim mb-1 tracking-wider uppercase opacity-50">
                  {msg.role === 'user' ? 'You' : selectedGrave.name}
                </div>
                <div className={`p-3.5 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-mv-charcoal text-white rounded-tr-sm' : 'bg-mv-bg border border-mv-gray-light text-mv-charcoal font-serif text-base rounded-tl-sm shadow-sm'}`}>
                  {msg.content}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 border-t border-mv-gray-light bg-white shrink-0">
        <div className="flex items-center gap-2 bg-mv-bg border border-mv-gray-light rounded-lg p-1.5 focus-within:border-sheikah-blue focus-within:ring-1 focus-within:ring-sheikah-blue transition-all">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm text-mv-charcoal font-mono placeholder:text-mv-gray"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-5 py-2.5 bg-mv-charcoal text-white text-[10px] tracking-widest rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sheikah-blue transition-colors hover:shadow-[0_0_10px_rgba(0,212,255,0.4)]"
          >
            {t.send}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
