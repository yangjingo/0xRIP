# MiniMax Integration

0xRIP uses two MiniMax interfaces:
1. **Text** — Anthropic-compatible HTTP endpoint (`api.minimaxi.com/anthropic`)
2. **Media** — mmx CLI subprocess via `Bun.spawn` (image/music/speech/video/vision)

---

## 1. Text — Anthropic-Compatible Endpoint

### Call Path

```
Terminal /summon
  → POST /api/summon/:id/chat
  → agent/loop.ts: GhostAgent.chat()
  → context.ts: ContextManager.buildMessages()
  → POST {ANTHROPIC_BASE_URL}/v1/messages
     Model: MiniMax-M2.7
     Auth: Bearer + x-api-key header
     Max tokens: 4096
     Tool-use loop: max 5 iterations
  → SSE stream response
```

### Test Result

```
$ curl -X POST :8000/api/summon/0xDEADBEEF/chat \
    -d '{"message":"One word reply: hello"}'
{"reply":"*echo*","role":"ghost","session_id":"5cfc2b48..."}

Time: 2.6s
Status: PASS
```

### Mistakes

1. **DeepSeek URL override**: System env `ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic` overrides `.env`. Fix: loop.ts detects `deepseek` in base URL and redirects to MiniMax. Better fix: clean system env variable.
2. **API key sent to wrong endpoint**: Key `sk-cp-...` was rejected by DeepSeek. Same root cause as #1.
3. **thinking tokens consume budget**: MiniMax M2.7 has thinking phase that counts toward `max_tokens`. With `max_tokens=10`, all tokens consumed by thinking, zero for reply. Fix: use `max_tokens=4096`.
4. **`Bun.serve` idleTimeout kills long requests**: Default 10s timeout killed music generation (~40s). Fix: `idleTimeout: 120` in Bun.serve() config.

---

## 2. Speech (TTS) — mmx speech synthesize

### Call Path

```
Terminal ghost reply
  → hooks/sound.ts: speak()
  → POST /api/generate/speech { text }
  → index.ts: runMmx(['speech','synthesize','--text',T,'--out',O,'--output','json'])
  → Bun.spawn('mmx speech synthesize ...')
  → Parse JSON → return { audio_url }
  → Frontend: new Audio(url).play()
```

### Test Result

```
$ curl -X POST :8000/api/generate/speech -d '{"text":"hello"}'
{"audio_url":".rip/speech_1779513649159.mp3"}

Time: 1.2s
Status: PASS
```

### Voice Options

```bash
mmx speech voices   # 30+ voices
mmx speech synthesize --voice English_magnetic_voiced_man --text "..."
mmx speech synthesize --speed 1.2 --text "..."
```

### Mistakes

1. **mmx CLI not installed**: TTS returned 500 because `mmx` binary not found. Fix: `npm install -g mmx-cli && mmx auth login`.
2. **Output path relative to CWD**: `--out .rip/speech_*.mp3` works only if `.rip/` exists. File lands in CWD if directory missing.

---

## 3. Image — mmx image generate

### Call Path

```
GhostAgent tool-use
  → agent/tools/mmx-image.ts: imageTool.handler()
  → runMmx(['image','generate','--prompt',P,'--aspect-ratio',R,'--output','json'])
  → Bun.spawn('mmx image generate ...')
  → Parse JSON → extract image_urls

Direct API:
  POST /api/generate/image { prompt, aspect_ratio? }
```

### Test Result

```
$ curl -X POST :8000/api/generate/image \
    -d '{"prompt":"dark monochrome graveyard","aspect_ratio":"1:1"}'
{"saved":["image_001.jpg"]}

Time: 19.5s
Status: PASS
File: image_001.jpg (303KB)
```

### Mistakes

1. **JSON response format varies**: mmx returns `{saved: [...]}`, `{image_urls: [...]}`, or `{data: {image_urls: [...]}}` depending on version. The tool handler tries multiple paths: `parsed.image_urls || parsed.data.image_urls || parsed.images || (parsed.url ? [parsed.url] : [])`.

---

## 4. Music — mmx music generate

### Call Path

```
Direct API:
  POST /api/summon/:id/requiem
  → Builds lyrics from grave name + epitaph
  → runMmx(['music','generate','--prompt',P,'--lyrics',L,'--out',O,'--output','json'])
  → Bun.spawn('mmx music generate ...')  ← needs idleTimeout > 10s

GhostAgent tool-use:
  agent/tools/mmx-music.ts: musicTool.handler()
  → runMmx(['music','generate','--prompt',P,'--lyrics',L,'--instrumental?'])
```

### Test Result

```
$ curl -X POST :8000/api/summon/0xDEADBEEF/requiem
{"audio_url":"music_2026-05-23-05-24-08.mp3"}

Time: 25.9s (range: 25-60s)
Status: PASS
File: music_*.mp3 (672KB - 5.5MB)
```

### Modes

```bash
# With lyrics
mmx music generate --prompt "ambient dark" --lyrics "[verse] ..." --out song.mp3
# Instrumental
mmx music generate --prompt "cinematic" --instrumental --out bgm.mp3
# Auto-generate lyrics from prompt
mmx music generate --prompt "melancholic folk" --lyrics-optimizer --out song.mp3
# Cover from reference audio
mmx music cover --prompt "jazz piano" --audio-file original.mp3 --out cover.mp3
```

### Mistakes

1. **`Bun.serve` 10s timeout kills request**: Music generation takes 25-60 seconds. The default Bun.serve `idleTimeout` is 10 seconds. Fix: set `idleTimeout: 120` in server config.
2. **`--out` parameter ignored when dir missing**: mmx falls back to CWD naming if the output directory doesn't exist. `.rip/` must exist before calling mmx.

---

## 5. Video — mmx video generate (async)

### Call Path

```
Direct API:
  POST /api/generate/video { prompt }
  → runMmx(['video','generate','--prompt',P,'--async'], {json:true})
  → Returns { task_id }

  GET /api/generate/video/:taskId
  → runMmx(['video','task','get','--task-id',ID,'--output','json'])
  → Returns { status, video_url? }

GhostAgent tool-use:
  agent/tools/mmx-video.ts: videoTool.handler()
```

### Test Result

```
$ curl -X POST :8000/api/generate/video -d '{"prompt":"dark graveyard fog"}'
{"taskId":"401245954662960"}

Time: 0.7s (async submit)
Status: PASS (task created)
```

### Polling

```bash
mmx video task get --task-id 401245954662960
# Returns: { status: "processing" | "completed", video_url? }
mmx video download --file-id <id> --out video.mp4
```

### Mistakes

1. **Async pattern**: Video generation is async — the POST returns immediately with a `task_id`. Frontend needs to poll `GET /api/generate/video/:taskId` to check completion. No auto-polling implemented yet.

---

## 6. Vision — mmx vision describe

### Call Path

```
GhostAgent tool-use:
  agent/tools/mmx-vision.ts: visionTool.handler()
  → runMmx(['vision','describe','--image',URL,'--output','json'])
  → Parse JSON → extract description

(No direct REST endpoint — agent-only)
```

### Input Formats

```bash
mmx vision photo.jpg                      # local file
mmx vision describe --image https://...   # URL
mmx vision describe --file-id file-123    # uploaded file
```

---

## 7. Config & Auth

```bash
npm install -g mmx-cli
mmx auth login --api-key sk-xxxxx       # or OAuth: mmx auth login
mmx auth status                         # verify
mmx config set --key region --value cn  # api.minimaxi.com (CN) vs api.minimax.io (Global)
mmx quota                               # check usage
```

---

## Summary

| Feature | Method | Time | Status | Code |
|---------|--------|------|--------|------|
| Text | HTTP POST | 2.6s | PASS | `agent/loop.ts` |
| Speech | mmx CLI | 1.2s | PASS | `index.ts` + `hooks/sound.ts` |
| Image | mmx CLI | 19.5s | PASS | `agent/tools/mmx-image.ts` |
| Music | mmx CLI | 25-60s | PASS | `index.ts` + `agent/tools/mmx-music.ts` |
| Video | mmx CLI | 0.7s (async) | PASS | `index.ts` + `agent/tools/mmx-video.ts` |
| Vision | mmx CLI | ~5s | READY | `agent/tools/mmx-vision.ts` |

### Top 5 Mistakes

1. **System env overrides `.env`** — `ANTHROPIC_BASE_URL` set to DeepSeek, caused auth errors for 3 rounds
2. **`Bun.serve` idleTimeout kills slow requests** — default 10s, music needs 40s+. Fixed: `idleTimeout: 120`
3. **mmx CLI not installed globally** — TTS/music/image all failed silently. Fixed: `npm install -g mmx-cli`
4. **JSON response shape varies by mmx version** — `saved` vs `image_urls` vs `data.image_urls`. Fixed with multi-path fallback
5. **Windows backslash path breaks regex** — `import.meta.dir` uses `\`, regex expected `/`. Fixed: switched to `join()`
