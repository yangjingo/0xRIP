// ── Sound engine: clicks, ambient drone, TTS ──────────────

let audioCtx: AudioContext | null = null
function ctx() { if (!audioCtx) audioCtx = new AudioContext(); return audioCtx }

// ── SFX ──────────────────────────────────────────────────

export function playClick() {
  try {
    const c = ctx(); const t = c.currentTime; const d = 0.03
    const sz = Math.floor(c.sampleRate * d)
    const buf = c.createBuffer(1, sz, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < sz; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sz * 0.15))
    const s = c.createBufferSource(); s.buffer = buf
    const bpf = c.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 3000; bpf.Q.value = 0.8
    const g = c.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + d)
    s.connect(bpf).connect(g).connect(c.destination); s.start(t); s.stop(t + d)
  } catch {}
}

export function playEnter() {
  try {
    const c = ctx(); const t = c.currentTime; const d = 0.06
    const sz = Math.floor(c.sampleRate * d)
    const buf = c.createBuffer(1, sz, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < sz; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sz * 0.2))
    const s = c.createBufferSource(); s.buffer = buf
    const bpf = c.createBiquadFilter(); bpf.type = 'lowpass'; bpf.frequency.value = 600
    const g = c.createGain(); g.gain.setValueAtTime(0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + d)
    s.connect(bpf).connect(g).connect(c.destination); s.start(t); s.stop(t + d)
  } catch {}
}

// ── Ambient drone ────────────────────────────────────────

let drone: { oscs: OscillatorNode[]; gain: GainNode } | null = null

export function startAmbient() {
  try {
    if (drone) return
    const c = ctx()
    const master = c.createGain()
    master.gain.setValueAtTime(0, c.currentTime)
    master.gain.linearRampToValueAtTime(0.04, c.currentTime + 2)
    master.connect(c.destination)

    const oscs: OscillatorNode[] = []
    const addOsc = (freq: number, vol: number) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq
      const g = c.createGain(); g.gain.value = vol
      o.connect(g).connect(master); o.start(); oscs.push(o); return o
    }
    addOsc(55, 0.3)
    addOsc(82.4, 0.15)
    const o3 = addOsc(110, 0.08)
    o3.detune.setValueAtTime(0, c.currentTime)
    o3.detune.linearRampToValueAtTime(5, c.currentTime + 4)
    o3.detune.linearRampToValueAtTime(-3, c.currentTime + 8)
    const o4 = addOsc(220, 0.04)
    o4.detune.setValueAtTime(0, c.currentTime)
    o4.detune.linearRampToValueAtTime(10, c.currentTime + 6)
    o4.detune.linearRampToValueAtTime(-5, c.currentTime + 12)

    // Noise texture
    const noiseLen = Math.floor(c.sampleRate * 3)
    const noiseBuf = c.createBuffer(1, noiseLen, c.sampleRate)
    const nd = noiseBuf.getChannelData(0)
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1
    const ns = c.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true
    const nf = c.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 200
    const ng = c.createGain(); ng.gain.value = 0.02
    ns.connect(nf).connect(ng).connect(master); ns.start()

    drone = { oscs, gain: master }
  } catch {}
}

export function stopAmbient() {
  try {
    if (!drone) return
    const c = ctx()
    drone.gain.gain.linearRampToValueAtTime(0, c.currentTime + 2)
    setTimeout(() => {
      drone?.oscs.forEach(o => { try { o.stop() } catch {} })
      drone = null
    }, 2500)
  } catch {}
}

// ── TTS ──────────────────────────────────────────────────

export async function speak(text: string, voice?: string, onState?: (speaking: boolean) => void) {
  try {
    const body: Record<string, string> = { text: text.slice(0, 500) }
    if (voice) body.voice = voice
    const res = await fetch('http://localhost:8000/api/generate/speech', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.audio_url) {
      const audio = new Audio(data.audio_url); audio.volume = 0.7
      onState?.(true)
      audio.onended = () => onState?.(false)
      audio.onerror = () => onState?.(false)
      await audio.play()
    }
  } catch { onState?.(false) }
}

let requiemAudio: HTMLAudioElement | null = null

export function startRequiem(url: string) {
  try {
    stopRequiem()
    requiemAudio = new Audio(url); requiemAudio.loop = true; requiemAudio.volume = 0.3
    requiemAudio.play()
  } catch {}
}

export function stopRequiem() {
  try {
    if (requiemAudio) { requiemAudio.pause(); requiemAudio.src = ''; requiemAudio = null }
  } catch {}
}
