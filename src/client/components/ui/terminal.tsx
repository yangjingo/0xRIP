import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../../store/store'
import { useSuggestions } from '../../hooks/suggestions'
import { playEnter, startAmbient, stopAmbient, speak, startRequiem, stopRequiem } from '../../hooks/sound'

interface Line { text: string; type: 'output' | 'input' | 'ghost' | 'error' | 'system' }

const BURY_STEPS = ['name', 'epitaph', 'date', 'photo', 'voice', 'requiem', 'memorial', 'confirm']
const BURY_PROMPT: Record<string, string> = {
  name: 'NAME:', epitaph: 'EPITAPH:', date: 'DATE (YYYY-MM-DD):',
  photo: 'PHOTO? [click to upload, Enter to skip]:',
  voice: 'VOICE? [pick a number, Enter to skip]:',
  requiem: 'REQUIEM? (y/n):',
  memorial: 'MEMORIAL IMAGE? (y/n):',
  confirm: 'SEAL (y/n):',
}

const HELP = [
  'COMMANDS:',
  '  /bury          Begin burial ritual',
  '  /summon <id>   Open channel to a grave',
  '  /dream <id>    Generate a dream from grave memories',
  '  /dreams <id>   List past dreams',
  '  /list          List all graves',
  '  /help          Show commands',
  '  /clear         Clear terminal',
  '  /quit          Close channel',
]

// ── Line prefix per type ───────────────────────────────────

const PREFIX: Record<Line['type'], string> = {
  system: '·',
  input:  '▸',
  output: ' ',
  ghost:  '◇',
  error:  '✕',
}

// ── Voice waveform ────────────────────────────────────────

function VoiceWaveform() {
  const [bars, setBars] = useState([2, 4, 3, 6, 4, 2, 5, 3])
  useEffect(() => {
    const id = setInterval(() => setBars(
      Array.from({ length: 8 }, () => Math.floor(Math.random() * 9) + 1)
    ), 120)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-[2px] mr-1">
      {bars.map((h, i) => (
        <div key={i} className="w-[3px] bg-white" style={{ height: h, opacity: 0.25 + h * 0.06, transition: 'height 0.1s' }} />
      ))}
    </div>
  )
}

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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [voiceList, setVoiceList] = useState<string[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [scrolledUp, setScrolledUp] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)
  const inpRef = useRef<HTMLInputElement>(null)

  // Auto-scroll unless user scrolled up
  useEffect(() => {
    if (!scrolledUp) outRef.current?.scrollTo(0, outRef.current.scrollHeight)
  }, [lines, scrolledUp])

  const handleScroll = useCallback(() => {
    const el = outRef.current; if (!el) return
    setScrolledUp(el.scrollTop + el.clientHeight < el.scrollHeight - 20)
  }, [])

  // Focus
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
      let full = '', buf = '', eventType = ''

      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() || ''
        for (const l of lines) {
          if (l.startsWith('event: ')) { eventType = l.slice(7).trim(); continue }
          if (l.startsWith('data: ')) {
            if (eventType === 'message') {
              const payload = l.slice(6)
              try { full += JSON.parse(payload) } catch { full += payload }
              setLines(p => { const n = [...p]; n[n.length - 1] = { text: full, type: 'ghost' }; return n })
            }
          }
        }
      }
      if (full) speak(full, selectedGrave?.voiceId, setIsSpeaking)
    } catch {
      setLines(p => { const n = [...p]; n[n.length - 1] = { text: 'SIGNAL LOST.', type: 'error' }; return n })
    } finally { setIsTyping(false) }
  }, [sessionId, setSessionId])

  // ── Command executor ────────────────────────────────────

  const exec = useCallback(async (raw: string) => {
    const [op, ...args] = raw.trim().split(/\s+/)
    setLines(p => [...p, { text: raw, type: 'input' }])

    switch (op?.toLowerCase()) {
      case '/help': setLines(p => [...p, ...HELP.map(t => ({ text: t, type: 'system' as const }))]); break
      case '/list':
        graves.length
          ? setLines(p => [...p, ...graves.map(g => {
              const extras = [g.requiemUrl && '[requiem]', g.memorialImageUrl && '[portrait]', g.voiceId && '[voice]'].filter(Boolean).join(' ')
              return { text: `  ${g.id}  ${g.name}  "${g.epitaph}"${extras ? '  ' + extras : ''}`, type: 'output' as const }
            })])
          : setLines(p => [...p, { text: 'The graveyard is empty.', type: 'system' }])
        break
      case '/bury': setMode('bury'); setBuryStep(0); setBuryData({}); setPhotoFile(null); setVoiceList([])
        setLines(p => [...p, { text: 'BURIAL RITUAL', type: 'system' }, { text: `${BURY_PROMPT.name} who rests here?`, type: 'system' }])
        break
      case '/summon': {
        const [id, ...msg] = args
        if (!id) { setLines(p => [...p, { text: 'Usage: /summon <id> [msg]', type: 'error' }]); break }
        const g = graves.find(x => x.id === id)
        if (!g) { setLines(p => [...p, { text: `Soul not found: ${id}`, type: 'error' }]); break }
        selectGrave(g)
        if (g.requiemUrl) startRequiem(g.requiemUrl)
        if (msg.length) { await doChat(id, msg.join(' ')); break }
        setMode('chat')
        setLines(p => [...p, { text: `Channel open: ${g.name} [${id}]`, type: 'system' }, { text: `"${g.epitaph}"`, type: 'ghost' }, { text: 'Speak. /quit to close.', type: 'system' }])
        break
      }
      case '/dream': {
        const [did] = args
        if (!did) { setLines(p => [...p, { text: 'Usage: /dream <grave_id>', type: 'error' }]); break }
        setLines(p => [...p, { text: `Compiling dream for ${did}...`, type: 'system' }])
        try {
          const r = await fetch(`http://localhost:8000/api/summon/${did}/dream`, { method: 'POST' })
          const d = await r.json()
          if (r.ok) {
            setLines(p => [...p, { text: `Dream generating: ${d.dream_id}`, type: 'system' },
              { text: `Prompt: ${d.prompt.slice(0, 200)}...`, type: 'output' },
              { text: 'Check back with /dreams ' + did, type: 'system' }])
          } else {
            setLines(p => [...p, { text: `Dream failed: ${d.detail || 'unknown'}`, type: 'error' }])
          }
        } catch { setLines(p => [...p, { text: 'Dream generation failed.', type: 'error' }]) }
        break
      }
      case '/dreams': {
        const [did] = args
        if (!did) { setLines(p => [...p, { text: 'Usage: /dreams <grave_id>', type: 'error' }]); break }
        setLines(p => [...p, { text: `Dreams for ${did}:`, type: 'system' }])
        try {
          const r = await fetch(`http://localhost:8000/api/summon/${did}/dreams`)
          const items = await r.json()
          if (Array.isArray(items) && items.length > 0) {
            for (const d of items) {
              const date = d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'unknown'
              const stat = d.status === 'completed' ? `[${d.videoUrl || 'done'}]` : `[${d.status}]`
              setLines(p => [...p, { text: `  ${date}  ${stat}  ${d.prompt?.slice(0, 80) || ''}...`, type: 'output' as const }])
            }
          } else {
            setLines(p => [...p, { text: '  No dreams yet. /dream to create one.', type: 'system' }])
          }
        } catch { setLines(p => [...p, { text: 'Failed to fetch dreams.', type: 'error' }]) }
        break
      }
      case '/clear': setLines([]); break
      case '/quit': setLines(p => [...p, { text: 'Channel closed.', type: 'system' }]); setMode('cmd'); setChatOpen(false); stopRequiem(); break
      default: setLines(p => [...p, { text: `Unknown: ${op}. /help for commands.`, type: 'error' }])
    }
  }, [graves, selectGrave, doChat, setChatOpen])

  // ── Bury flow ───────────────────────────────────────────

  const advanceBury = useCallback((next: number) => {
    setBuryStep(next)
    const nextStep = BURY_STEPS[next]
    if (nextStep === 'voice') {
      fetch('http://localhost:8000/api/voices')
        .then(r => r.json()).then(v => { if (Array.isArray(v)) { setVoiceList(v); setLines(p => [...p, ...v.map((vid, i) => ({ text: `  ${i + 1}. ${vid}`, type: 'output' as const })), { text: `${BURY_PROMPT.voice}`, type: 'system' }]) } })
        .catch(() => setLines(p => [...p, { text: `${BURY_PROMPT.voice}`, type: 'system' }]))
    } else if (nextStep === 'photo') {
      fileRef.current?.click()
      setLines(p => [...p, { text: `${BURY_PROMPT.photo}`, type: 'system' }])
    } else {
      setLines(p => [...p, { text: `${BURY_PROMPT[nextStep]}`, type: 'system' }])
    }
  }, [])

  const handlePhotoSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setPhotoFile(f); setLines(p => [...p, { text: `[photo: ${f.name}]`, type: 'input' }])
    advanceBury(buryStep + 1)
  }, [buryStep, advanceBury])

  const buryInput = useCallback(async (text: string) => {
    setLines(p => [...p, { text, type: 'input' }])
    const step = BURY_STEPS[buryStep]

    const skippable = ['photo', 'voice', 'requiem', 'memorial']
    if (skippable.includes(step) && !text.trim()) {
      advanceBury(buryStep + 1)
      return
    }

    if (step === 'voice') {
      const idx = parseInt(text, 10) - 1
      if (idx >= 0 && idx < voiceList.length) {
        setBuryData(nd => ({ ...nd, voice_id: voiceList[idx] }))
      }
      advanceBury(buryStep + 1)
      return
    }

    if (step === 'photo') {
      advanceBury(buryStep + 1)
      return
    }

    if (step === 'confirm') {
      if (text.toLowerCase().startsWith('y')) {
        setLines(p => [...p, { text: 'Sealing...', type: 'system' }])
        try {
          const body: Record<string, unknown> = { ...buryData }
          body.generate_requiem = buryData.requiem?.toLowerCase().startsWith('y')
          body.generate_memorial_image = buryData.memorial?.toLowerCase().startsWith('y')
          delete body.requiem; delete body.memorial; delete body.photo; delete body.voice

          const r = await fetch('http://localhost:8000/api/graves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          const g = await r.json()

          if (photoFile) {
            const fd = new FormData(); fd.append('photo', photoFile)
            fetch(`http://localhost:8000/api/graves/${g.id}/photos`, { method: 'POST', body: fd }).catch(() => {})
          }

          setGraves([...graves, g])
          setLines(p => [...p, { text: `Grave sealed: ${g.id}`, type: 'system' }, { text: `  ${g.name} — "${g.epitaph}"`, type: 'output' }])
        } catch { setLines(p => [...p, { text: 'Ritual failed.', type: 'error' }]) }
      } else { setLines(p => [...p, { text: 'Aborted.', type: 'system' }]) }
      setMode('cmd'); setPhotoFile(null)
      return
    }

    const nd = { ...buryData, [step]: text }; setBuryData(nd)
    advanceBury(buryStep + 1)
  }, [buryStep, buryData, graves, setGraves, photoFile, voiceList, advanceBury])

  // ── Submit ──────────────────────────────────────────────

  const submit = useCallback(async () => {
    const t = input.trim(); if (isTyping) return; setInput(''); sug.dismiss()
    if (mode !== 'bury' && !t) return
    playEnter()

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
        const s = sug.suggestions[sug.selected]; if (s) { setInput((s.usage.includes('<') ? s.cmd + ' ' : s.usage + ' ')); sug.dismiss(); return }
      }
      submit(); return
    }
    if (sug.visible) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sug.setSelected(i => Math.min(i + 1, sug.suggestions.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); sug.setSelected(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Escape')    { sug.dismiss(); return }
      if (e.key === 'Tab')       { e.preventDefault(); const s = sug.suggestions[sug.selected]; if (s) { setInput((s.usage.includes('<') ? s.cmd + ' ' : s.usage + ' ')); sug.dismiss(); } return }
    }
  }, [sug, submit])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setInput(e.target.value); sug.update(e.target.value) }, [sug])

  // ── Render ──────────────────────────────────────────────

  const prompt = mode === 'chat' ? (selectedGrave ? `${selectedGrave.id}>` : 'chat>') : mode === 'bury' ? 'bury>' : '>'

  const headerLabel = mode === 'chat' && selectedGrave
    ? `CHANNEL: ${selectedGrave.name}`
    : mode === 'bury'
      ? `BURIAL RITUAL — step ${buryStep + 1}/${BURY_STEPS.length}`
      : '0xRIP TERMINAL'

  const hintText = mode === 'chat'
    ? 'Type your message. /quit to close'
    : mode === 'bury'
      ? `${BURY_STEPS.length - buryStep} steps remaining`
      : '/ for commands · ↑↓ to navigate · ↵ to select'

  return (
    <div className="font-mono text-[15px] flex flex-col" style={{
      background: mode === 'cmd' ? 'transparent' : '#0a0a0a',
      border: mode === 'cmd' ? 'none' : '1px solid #2a2a2a',
    }}>

      {/* ── Header bar ──────────────────────────────────── */}
      {mode !== 'cmd' && (
      <div className="flex items-center justify-between px-5 py-2 border-b border-[#222] bg-[#0d0d0d] shrink-0">
        <span className="text-[#666] text-[11px] tracking-[2px] uppercase">{headerLabel}</span>
        <div className="flex items-center gap-2">
          {isSpeaking && <VoiceWaveform />}
          <span className="text-[#444] text-[10px]">{hintText}</span>
        </div>
      </div>
      )}

      {/* ── Output ───────────────────────────────────────── */}
      <div ref={outRef} onScroll={handleScroll}
        className="flex-1 h-[560px] overflow-y-auto px-5 py-3 no-scrollbar"
        style={{ background: mode === 'cmd' ? 'transparent' : '#080808' }}>
        {lines.map((l, i) => (
          <div key={i} className="leading-[1.65] whitespace-pre-wrap break-words flex gap-2.5"
            style={{
              color: l.type === 'error' ? '#f44' : l.type === 'system' ? '#666'
                   : l.type === 'input' ? '#aaa' : l.type === 'ghost' ? '#fff' : '#ccc',
              fontStyle: l.type === 'ghost' ? 'italic' : 'normal',
            }}>
            <span className="shrink-0 select-none" style={{
              color: l.type === 'error' ? '#f44' : l.type === 'ghost' ? '#555' : '#444',
              width: 14, textAlign: 'center' as const,
            }}>{PREFIX[l.type]}</span>
            <span>{l.text}</span>
          </div>
        ))}
      </div>

      {/* ── Scroll indicator ─────────────────────────────── */}
      {scrolledUp && (
        <div className="px-5 py-1 text-[10px] text-[#555] text-center cursor-pointer border-b border-[#1a1a1a] bg-[#0a0a0a]"
          onClick={() => { setScrolledUp(false); outRef.current?.scrollTo(0, outRef.current.scrollHeight) }}>
          ↓ new messages below
        </div>
      )}

      {/* ── Suggestions ──────────────────────────────────── */}
      {sug.visible && sug.suggestions.length > 0 && (
        <div className="mx-4 border border-[#2a2a2a]" style={{ background: mode === 'cmd' ? 'rgba(0,0,0,0.85)' : '#0d0d0d', borderBottom: 'none' }}>
          {sug.suggestions.map((s, i) => (
            <div key={s.cmd}
              className={`px-4 py-2 flex gap-4 text-sm cursor-pointer border-b border-[#1a1a1a] last:border-0
                ${i === sug.selected ? 'bg-[#1a1a1a] text-white' : 'text-[#888]'}`}
              onMouseEnter={() => sug.setSelected(i)}
              onClick={() => { setInput((s.usage.includes('<') ? s.cmd + ' ' : s.usage + ' ')); sug.dismiss(); inpRef.current?.focus() }}>
              <span className="text-white font-bold w-28 shrink-0">{s.cmd}</span>
              <span>{s.desc}</span>
              {s.usage !== s.cmd && <span className="text-[#555] ml-auto text-[11px]">{s.usage}</span>}
            </div>
          ))}
          <div className="px-4 py-1.5 text-[10px] text-[#555] flex gap-5 font-mono">
            <span>↑↓ navigate</span><span>↵ select</span><span>tab complete</span><span>esc close</span>
          </div>
        </div>
      )}

      {/* ── Input ────────────────────────────────────────── */}
      <div className="flex items-center px-5 py-3.5" style={{
        borderTop: mode === 'cmd' ? '1px solid rgba(255,255,255,0.06)' : '1px solid #2a2a2a',
        background: mode === 'cmd' ? 'transparent' : '#0d0d0d',
      }}>
        <span className="text-[#666] mr-3 shrink-0 font-mono">{prompt}</span>
        <input ref={inpRef} value={input} onChange={onChange} onKeyDown={onKey} disabled={isTyping}
          className="flex-1 bg-transparent text-white outline-none font-mono text-[15px] placeholder-[#333]"
          placeholder={mode === 'cmd' ? '/ for commands' : ''} autoFocus />
        {isTyping && <OraSpinner />}
      </div>

      {/* ── Hidden file input ────────────────────────────── */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={handlePhotoSelected} />
    </div>
  )
}
