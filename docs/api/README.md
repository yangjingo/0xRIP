# API — 后端

0xRIP 后端基于 **Bun + mmx CLI + agent-loop** 实现。

## Quick Start

```bash
cd backend
bun install        # 安装依赖
bun run dev        # 启动 http://localhost:8000
```

首次使用需配置 mmx CLI：

```bash
npm install -g mmx-cli
mmx auth login --api-key sk-xxxxx
```

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| Runtime | Bun | 前后端统一运行时 |
| HTTP | Bun.serve() | 零框架依赖 |
| 文本对话 | MiniMax M2.7 | Anthropic 兼容端点 (`api.minimaxi.com/anthropic`) |
| 多媒体 | mmx CLI (subprocess) | image / music / video / speech / vision |
| DB | SQLite + Drizzle ORM | 类型安全 |
| 验证 | Zod | 运行时校验 |

## 架构

```
请求 → Bun.serve() → 路由分发
                      ├─ /api/graves          → grave.ts (CRUD)
                      ├─ /api/summon/:id/chat  → agent/loop.ts → MiniMax M2.7 (tool use)
                      ├─ /api/summon/:id/requiem → mmx music generate
                      ├─ /api/generate/image   → mmx image generate
                      ├─ /api/generate/speech  → mmx speech synthesize
                      ├─ /api/generate/video   → mmx video generate
                      └─ /api/summon/:id/promote → memory.ts (.rip/ → SQLite)
```

### Agent Loop

Ghost 对话采用 Anthropic Messages API 格式的 tool-use loop：

```
用户消息 → ContextManager.buildMessages()
         → POST api.minimaxi.com/anthropic/v1/messages (model: MiniMax-M2.7)
         → 如果返回 tool_use → 执行 mmx CLI tool → 回传 tool_result
         → 重复直到纯文本回复
         → ContextManager.saveExchange() → 保存到 .rip/
```

### 上下文管理

```
┌────────────────────────────────────┐
│ System Prompt (ghost persona)      │  固定
├────────────────────────────────────┤
│ [长期记忆] DB memories             │  压缩后注入
├────────────────────────────────────┤
│ [短期记忆] .rip/ 当前 session      │  滑动窗口 (最近 10 轮)
├────────────────────────────────────┤
│ 用户消息                           │
├────────────────────────────────────┤
│ Tool Definitions (mmx-*)           │  固定
└────────────────────────────────────┘
```

### 目录结构

```
backend/src/
├── index.ts              # 路由 + Bun.serve()
├── types.ts              # 类型 + Zod schemas
├── agent/
│   ├── loop.ts           # Agent loop (tool use)
│   ├── context.ts        # 上下文管理器（记忆注入 + 滑动窗口）
│   ├── prompts/ghost.ts  # Ghost 人设
│   └── tools/
│       ├── mmx-image.ts  # mmx image generate
│       ├── mmx-music.ts  # mmx music generate
│       ├── mmx-video.ts  # mmx video generate
│       ├── mmx-speech.ts # mmx speech synthesize
│       └── mmx-vision.ts # mmx vision describe
├── db/
│   ├── schema.ts         # Drizzle 表定义 (graves/sessions/memories)
│   └── client.ts         # bun:sqlite 连接
└── services/
    ├── mmx.ts            # mmx CLI subprocess 封装 (runMmx/runMmxJson/runMmxStream)
    ├── grave.ts          # Grave CRUD
    ├── session.ts        # Session 管理
    └── memory.ts         # .rip/ 短期 + SQLite 长期
```

## API Endpoints

### Graves

| Method | Path | Request | Response | 说明 |
|--------|------|---------|----------|------|
| GET | `/api/graves` | — | `Grave[]` | 列出所有墓地（空时自动创建 Satoshi） |
| POST | `/api/graves` | `{ name, epitaph, date }` | `Grave` | 创建墓地 |

### Summon（召唤 Ghost）

| Method | Path | Request | Response | 说明 |
|--------|------|---------|----------|------|
| POST | `/api/summon/:id/session` | — | `{ session_id, grave_id }` | 创建会话 |
| GET | `/api/summon/:id/sessions` | — | `Session[]` | 列出会话 |
| POST | `/api/summon/:id/chat` | `{ message, session_id? }` | `{ reply, role, session_id }` | 与 ghost 对话 |
| POST | `/api/summon/:id/requiem` | — | `{ data: { audio } }` | 生成安魂曲 |
| POST | `/api/summon/:id/promote` | `{ session_id? }` | `{ promoted, memory_ids }` | 提升短期记忆到长期 |

### Generate（多媒体生成）

| Method | Path | Request | Response | 说明 |
|--------|------|---------|----------|------|
| POST | `/api/generate/image` | `{ prompt, aspect_ratio? }` | `{ image_urls }` | 文生图 |
| POST | `/api/generate/speech` | `{ text, voice? }` | `{ audio_url }` | 语音合成 |
| POST | `/api/generate/video` | `{ prompt }` | `{ task_id }` | 视频生成（异步） |
| GET | `/api/generate/video/:taskId` | — | `{ status, video_url? }` | 查询视频进度 |

### Response Types

```typescript
interface Grave {
  id: string;        // '0x' + 8-char hex
  name: string;
  epitaph: string;
  date: string;
  position: [number, number, number];
}

interface ChatResponse {
  reply: string;
  role: "ghost" | "system";
  session_id: string;
}
```

## mmx CLI 参考

mmx 是 [MiniMax AI 官方 CLI](https://github.com/MiniMax-AI/cli)，后端通过 `Bun.spawn` 调用。

### 命令速查

```bash
# 文本对话（agent loop 使用 Anthropic 兼容端点，不直接用 mmx text）
mmx text chat --message "Hello" --system "You are..." --stream

# 图像生成
mmx image generate --prompt "A cat" --n 3 --aspect-ratio 16:9

# 音乐生成
mmx music generate --prompt "Upbeat pop" --lyrics "[verse] Sunny day" --out song.mp3
mmx music generate --prompt "Cinematic" --instrumental --out bgm.mp3

# 语音合成
mmx speech synthesize --text "Hello!" --out hello.mp3
mmx speech synthesize --text "Hi" --voice English_magnetic_voiced_man --speed 1.2
mmx speech voices                           # 列出可用音色

# 视频生成
mmx video generate --prompt "Ocean waves" --async
mmx video task get --task-id 123456         # 查询进度
mmx video download --file-id 17684 --out v.mp4

# 图像理解
mmx vision describe --image https://example.com/img.jpg --prompt "What breed?"

# 搜索
mmx search "MiniMax AI" --output json

# 认证 & 配置
mmx auth login --api-key sk-xxxxx
mmx auth status
mmx quota                                    # 查看配额
mmx config show
```

### Tool → mmx 映射

| Agent Tool | mmx 命令 | 对应 API |
|------------|---------|---------|
| `generate_image` | `mmx image generate --prompt P --aspect-ratio R --output json` | `/api/generate/image` |
| `generate_music` | `mmx music generate --prompt P --lyrics L --out O` | `/api/summon/:id/requiem` |
| `generate_video` | `mmx video generate --prompt P --async` | `/api/generate/video` |
| `synthesize_speech` | `mmx speech synthesize --text T --voice V --out O` | `/api/generate/speech` |
| `analyze_image` | `mmx vision describe --image URL --prompt P --output json` | agent 内部调用 |

## 官方文档

| 来源 | 链接 |
|:---|:---|
| MiniMax Anthropic 兼容 API | https://platform.minimaxi.com/docs/api-reference/text-anthropic-api |
| MiniMax API 总览 | https://platform.minimaxi.com/docs/api-reference/api-overview |
| MiniMax CLI (mmx) | https://github.com/MiniMax-AI/cli |
| Drizzle ORM | https://orm.drizzle.team/ |

## MiniMax API 参考

| 文档 | 说明 |
|:---|:---|
| [text.md](./text.md) | 文本对话 API（角色扮演、多轮对话） |
| [image.md](./image.md) | 图像生成 API（文生图） |
| [music.md](./music.md) | 音乐生成 API（音频、语音克隆） |
| [video.md](./video.md) | 视频生成 API |

## Skills 资源

| 文档 | 说明 |
|:---|:---|
| [skills.md](./skills.md) | 13个赛博灵魂 Skill（同事/前任/导师/永生等） |

## 测试

详见 [tests.md](./tests.md) — 55 个测试用例覆盖 services / agent / API 三层。

→ 项目文档：[Story](../story/) | 前端 UX：[UX](../ux/)
