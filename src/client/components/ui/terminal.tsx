import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../../store/store'
import { useSuggestions } from '../../hooks/suggestions'
import { playClick, playEnter, startAmbient, stopAmbient, speak } from '../../hooks/sound'

interface Line { text: string; type: 'output' | 'input' | 'ghost' | 'error' | 'system' }

const BURY_STEPS = ['name', 'epitaph', 'date', 'confirm']
const BURY_PROMPT: Record<string, string> = {
  name: 'NAME:', epitaph: 'EPITAPH:', date: 'DATE (YYYY-MM-DD):', confirm: 'SEAL (y/n):',
}

const HELP = [
  'COMMANDS:',
  '  /bury          Begin burial ritual',
  '  /summon <id>   Open channel to a grave',
  '  /list          List all graves',
  '  /help          Show commands',
  '  /clear         Clear terminal',
  '  /quit          Close channel',
]

// ── Ora spinner ───────────────────────────────────────────

function OraSpinner() {
  const [f, setF] = useState(0)
  useEffect(() => { const id = setInterval(() => setF(x => (x + 1) % 4), 120); return () => clearInterval(id) }, [])
  return <span className="text-[#888] text-xs ml-2 shrink-0 font-mono">{['◜','◝','◞','◟'][f]} thinking</span>
}

// ── Terminal ──────────────────────────────────────────────

export const Terminal = () => {
  const { graves, setGraves, selectGrave, selectedGrave, sessionId, setSessionId, setChatOpen } = useStore()
  const sug = useSuggestions(graves)

  const [lines, setLines] = useState<Line[]>([{ text: '0xRIP — type / for commands.', type: 'system' }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [mode, setMode] = useState<'cmd' | 'bury' | 'chat'>('cmd')
  const [buryStep, setBuryStep] = useState(0)
  const [buryData, setBuryData] = useState<Record<string, string>>({})
  const outRef = useRef<HTMLDivElement>(null)
  const inpRef = useRef<HTMLInputElement>(null)

  // Auto-scroll & focus
  useEffect(() => { outRef.current?.scrollTo(0, outRef.current.scrollHeight) }, [lines])
  useEffect(() => { const h = () => inpRef.current?.focus(); document.addEventListener('click', h); return () => document.removeEventListener('click', h) }, [])

  // Ambient on summon
  useEffect(() => { mode === 'chat' ? startAmbient() : stopAmbient(); return () => stopAmbient() }, [mode])

  // Click grave → show info
  useEffect(() => {
    if (selectedGrave && mode === 'cmd') setLines(p => [...p,
      { text: `Selected: ${selectedGrave.id}  ${selectedGrave.name}`, type: 'system' },
      { text: `  "/summon ${selectedGrave.id}" to open channel.`, type: 'system' },
    ])
  }, [selectedGrave?.id])

  // ── Chat (SSE streaming) ────────────────────────────────

  const doChat = useCallback(async (graveId: string, message: string) => {
    setIsTyping(true); playEnter()
    setLines(p => [...p, { text: `You: ${message}`, type: 'input' }, { text: '', type: 'ghost' }])

    try {
      let sid = sessionId
      if (!sid) {
        const r = await fetch(`http://localhost:8000/api/summon/${graveId}/session`, { method: 'POST' })
        sid = (await r.json()).session_id; setSessionId(sid)
      }

      const res = await fetch(`http://localhost:8000/api/summon/${graveId}/chat/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sid }),
      })
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let full = '', buf = ''

      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buf += dec.decode(value, { stream: true })
        const parts = buf.split('\n'); buf = parts.pop() || ''
        for (const l of parts) {
          if (!l.startsWith('data: ')) continue
          try { full += JSON.parse(l.slice(6)) } catch { full += l.slice(6) }
        }
        setLines(p => { const n = [...p]; n[n.length - 1] = { text: full, type: 'ghost' }; return n })
      }
      if (full) speak(full)
    } catch {
      setLines(p => { const n = [...p]; n[n.length - 1] = { text: 'SIGNAL LOST.', type: 'error' }; return n })
    } finally { setIsTyping(false) }
  }, [sessionId, setSessionId])

  // ── Command executor ────────────────────────────────────

  const exec = useCallback(async (raw: string) => {
    const [op, ...args] = raw.trim().split(/\s+/)
    setLines(p => [...p, { text: `> ${raw}`, type: 'input' }])

    switch (op?.toLowerCase()) {
      case '/help': setLines(p => [...p, ...HELP.map(t => ({ text: t, type: 'system' as const }))]); break
      case '/list':
        graves.length
          ? setLines(p => [...p, ...graves.map(g => ({ text: `  ${g.id}  ${g.name}  "${g.epitaph}"`, type: 'output' as const }))])
          : setLines(p => [...p, { text: 'The graveyard is empty.', type: 'system' }])
        break
      case '/bury': setMode('bury'); setBuryStep(0); setBuryData({})
        setLines(p => [...p, { text: 'BURIAL RITUAL', type: 'system' }, { text: `${BURY_PROMPT.name} who rests here?`, type: 'system' }])
        break
      case '/summon': {
        const [id, ...msg] = args
        if (!id) { setLines(p => [...p, { text: 'Usage: /summon <id> [msg]', type: 'error' }]); break }
        const g = graves.find(x => x.id === id)
        if (!g) { setLines(p => [...p, { text: `Soul not found: ${id}`, type: 'error' }]); break }
        selectGrave(g)
        if (msg.length) { await doChat(id, msg.join(' ')); break }
        setMode('chat')
        setLines(p => [...p, { text: `Channel open: ${g.name} [${id}]`, type: 'system' }, { text: `"${g.epitaph}"`, type: 'ghost' }, { text: 'Speak. /quit to close.', type: 'system' }])
        break
      }
      case '/clear': setLines([]); break
      case '/quit': setLines(p => [...p, { text: 'Channel closed.', type: 'system' }]); setMode('cmd'); setChatOpen(false); break
      default: setLines(p => [...p, { text: `Unknown: ${op}. /help for commands.`, type: 'error' }])
    }
  }, [graves, selectGrave, doChat, setChatOpen])

  // ── Bury flow ───────────────────────────────────────────

  const buryInput = useCallback(async (text: string) => {
    setLines(p => [...p, { text: `> ${text}`, type: 'input' }])
    const step = BURY_STEPS[buryStep]

    if (step === 'confirm') {
      if (text.toLowerCase().startsWith('y')) {
        setLines(p => [...p, { text: 'Sealing...', type: 'system' }])
        try {
          const r = await fetch('http://localhost:8000/api/graves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buryData) })
          const g = await r.json(); setGraves([...graves, g])
          setLines(p => [...p, { text: `Grave sealed: ${g.id}`, type: 'system' }, { text: `  ${g.name} — "${g.epitaph}"`, type: 'output' }])
        } catch { setLines(p => [...p, { text: 'Ritual failed.', type: 'error' }]) }
      } else { setLines(p => [...p, { text: 'Aborted.', type: 'system' }]) }
      setMode('cmd'); return
    }
    const nd = { ...buryData, [step]: text }; setBuryData(nd)
    const next = buryStep + 1; setBuryStep(next)
    setLines(p => [...p, { text: `${BURY_PROMPT[BURY_STEPS[next]]}`, type: 'system' }])
  }, [buryStep, buryData, graves, setGraves])

  // ── Submit ──────────────────────────────────────────────

  const submit = useCallback(async () => {
    const t = input.trim(); if (!t || isTyping) return; setInput(''); sug.dismiss(); playEnter()

    if (mode === 'chat')        { if (t === '/quit') await exec(t); else if (selectedGrave) await doChat(selectedGrave.id, t); else setLines(p => [...p, { text: 'No grave selected.', type: 'error' }]) }
    else if (mode === 'bury')  await buryInput(t)
    else if (t.startsWith('/')) await exec(t)
    else                        setLines(p => [...p, { text: `Not a command. Type / for suggestions.`, type: 'system' }])
  }, [input, isTyping, mode, selectedGrave, doChat, buryInput, exec, sug])

  // ── Keyboard ────────────────────────────────────────────

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sug.visible && sug.suggestions.length) {
        const s = sug.suggestions[sug.selected]; if (s) { setInput(s.usage + ' '); sug.dismiss(); return }
      }
      submit(); return
    }
    if (sug.visible) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sug.setSelected(i => Math.min(i + 1, sug.suggestions.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); sug.setSelected(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Escape')    { sug.dismiss(); return }
      if (e.key === 'Tab')       { e.preventDefault(); const s = sug.suggestions[sug.selected]; if (s) { setInput(s.usage + ' '); sug.dismiss(); } return }
    }
    if (e.key.length === 1 || e.key === 'Backspace') playClick()
  }, [sug, submit])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); sug.update(e.target.value) }, [sug])

  // ── Render ──────────────────────────────────────────────

  const prompt = mode === 'chat' ? (selectedGrave ? `${selectedGrave.id}>` : 'chat>') : mode === 'bury' ? 'bury>' : '>'

  return (
    <div className="font-mono text-sm" style={{ background: '#000', border: '1px solid #333' }}>
      {/* Output */}
      <div ref={outRef} className="h-[280px] overflow-y-auto px-6 py-4 no-scrollbar" style={{ background: '#000' }}>
        {lines.map((l, i) => (
          <div key={i} className="leading-relaxed whitespace-pre-wrap break-words"
            style={{
              color: l.type === 'error' ? '#f44' : l.type === 'system' ? '#888'
                   : l.type === 'input' ? '#aaa' : l.type === 'ghost' ? '#fff' : '#ddd',
              fontStyle: l.type === 'ghost' ? 'italic' : 'normal',
            }}>
            {l.text}
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {sug.visible && sug.suggestions.length > 0 && (
        <div className="mx-6 border border-[#333] bg-[#0a0a0a]" style={{ borderBottom: 'none' }}>
          {sug.suggestions.map((s, i) => (
            <div key={s.cmd} className={`px-4 py-1.5 flex gap-4 text-xs cursor-pointer ${i === sug.selected ? 'bg-[#1a1a1a] text-white' : 'text-[#888]'}`}
              onMouseEnter={() => sug.setSelected(i)}
              onClick={() => { setInput(s.usage + ' '); sug.dismiss(); inpRef.current?.focus() }}>
              <span className="text-white font-bold w-24 shrink-0">{s.cmd}</span>
              <span>{s.desc}</span>
              {s.usage !== s.cmd && <span className="text-[#555] ml-auto text-[10px]">{s.usage}</span>}
            </div>
          ))}
          <div className="px-4 py-1 text-[9px] text-[#555] border-t border-[#222] flex gap-4">
            <span>↑↓</span><span>↵</span><span>tab</span><span>esc</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center px-6 py-3 border-t border-[#333] bg-[#050505]">
        <span className="text-[#888] mr-2 shrink-0">{prompt}</span>
        <input ref={inpRef} value={input} onChange={onChange} onKeyDown={onKey} disabled={isTyping}
          className="flex-1 bg-transparent text-white outline-none font-mono text-sm"
          placeholder={mode === 'cmd' ? '/ for commands' : ''} autoFocus />
        {isTyping && <OraSpinner />}
        <span className="text-[#444] text-[10px] ml-3 shrink-0 hidden sm:inline">{mode === 'cmd' ? '/help' : mode === 'chat' ? '/quit' : ''}</span>
      </div>
    </div>
  )
}
