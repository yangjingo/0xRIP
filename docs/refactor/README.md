# 0xRIP Backend Rewrite Plan

> Python (FastAPI + DSPy + litellm) → TypeScript (Bun + Claude Agent SDK + mmx CLI)

## 1. Why Rewrite

| 问题 | 现状 |
|------|------|
| 依赖过重 | DSPy + litellm + SQLAlchemy + chromadb，但实际只用了一小部分 |
| 直接 HTTP 调用 | music/video 都是裸 requests 调用，无重试/限流/错误处理 |
| 缺能力 | 无图片生成、语音合成、图像理解、视频进度追踪 |
| 框架耦合 | DSPy ChainOfThought 把 agent 逻辑锁死，难以扩展 tool use |
| 上下文管理粗糙 | 记忆只是简单拼接文本，没有 token 预算/压缩/窗口管理 |

## 2. Tech Stack

| 层 | 技术 | 说明 |
|---|------|------|
| Runtime | Bun | 前端已用 Bun，统一运行时 |
| HTTP | Bun.serve() | 零依赖，原生 TS |
| Agent | @anthropic-ai/claude-agent-sdk | Agent loop + tool use + streaming |
| 多媒体 | mmx CLI (subprocess) | text/image/music/video/speech/vision |
| DB | SQLite + Drizzle ORM | 类型安全，轻量 |
| 验证 | Zod | 运行时类型校验 |
| 测试 | Bun test | 内置测试框架 |

## 3. 目录结构

```
backend/
├── package.json
├── tsconfig.json
├── .env
├── drizzle.config.ts
├── src/
│   ├── index.ts                    # Bun.serve() 入口 + 路由
│   ├── types.ts                    # 共享类型定义
│   ├── agent/
│   │   ├── loop.ts                 # Agent loop (Claude Agent SDK)
│   │   ├── context.ts              # ★ 上下文管理器（核心）
│   │   ├── tools/
│   │   │   ├── index.ts            # Tool 注册表
│   │   │   ├── mmx-image.ts        # mmx image generate
│   │   │   ├── mmx-music.ts        # mmx music generate
│   │   │   ├── mmx-video.ts        # mmx video generate
│   │   │   ├── mmx-speech.ts       # mmx speech synthesize
│   │   │   ├── mmx-vision.ts       # mmx vision describe
│   │   │   └── memory.ts           # 记忆读写工具
│   │   └── prompts/
│   │       └── ghost.ts            # Ghost 人设系统提示词
│   ├── db/
│   │   ├── schema.ts               # Drizzle 表定义
│   │   └── client.ts               # DB 连接 + 自动建表
│   └── services/
│       ├── mmx.ts                  # mmx CLI subprocess 封装
│       ├── grave.ts                # Grave CRUD
│       ├── session.ts              # Session 管理
│       └── memory.ts               # 短期/长期记忆操作
├── tests/
│   ├── services/
│   │   ├── mmx.test.ts             # mmx CLI 封装测试
│   │   ├── grave.test.ts           # Grave CRUD 测试
│   │   ├── session.test.ts         # Session 管理测试
│   │   └── memory.test.ts          # 记忆操作测试
│   ├── agent/
│   │   ├── context.test.ts         # 上下文管理测试
│   │   └── tools.test.ts           # Agent tools 测试
│   └── api/
│       └── routes.test.ts          # HTTP API 集成测试
└── skills/                         # 保留不动（persona 模板）
```

## 4. API Endpoints（保持前端兼容）

### 4.1 现有接口（移植）

| Method | Path | Request | Response | 说明 |
|--------|------|---------|----------|------|
| GET | `/api/graves` | — | `Grave[]` | 列出所有墓地，空时创建 Satoshi |
| POST | `/api/summon/:graveId/session` | — | `{ session_id, grave_id }` | 创建会话 |
| GET | `/api/summon/:graveId/sessions` | — | `Session[]` | 列出会话 |
| POST | `/api/summon/:graveId/chat` | `{ message, session_id? }` | `{ reply, role, session_id }` | 与 ghost 对话 |
| POST | `/api/summon/:graveId/requiem` | — | `{ data: { audio } }` | 生成安魂曲 |
| POST | `/api/summon/:graveId/promote` | `{ session_id? }` | `{ promoted, memory_ids }` | 提升记忆 |

### 4.2 新增接口

| Method | Path | Request | Response | 说明 |
|--------|------|---------|----------|------|
| POST | `/api/graves` | `{ name, epitaph, date }` | `Grave` | 创建墓地 |
| GET | `/api/graves/:id` | — | `Grave` | 获取单个墓地 |
| POST | `/api/generate/image` | `{ prompt, aspect_ratio? }` | `{ image_urls }` | 文生图 |
| POST | `/api/generate/speech` | `{ text, voice? }` | `{ audio_url }` | 语音合成 |
| POST | `/api/generate/video` | `{ prompt }` | `{ task_id }` | 视频生成 |
| GET | `/api/generate/video/:taskId` | — | `{ status, video_url? }` | 查询视频进度 |

### 4.3 前端当前调用（必须兼容）

```typescript
// App.tsx
const res = await fetch('http://localhost:8000/api/graves')

// ChatView.tsx — chat
const response = await fetch(`http://localhost:8000/api/summon/${selectedGrave.id}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userMsg })
})
const data = await response.json()
// 期望: { reply: string, role: string, session_id: string }

// ChatView.tsx — requiem
const res = await fetch(`http://localhost:8000/api/summon/${selectedGrave.id}/requiem`, { method: 'POST' })
const data = await res.json()
// 期望: data.data.audio (URL)
```

## 5. 核心设计：Agent 上下文管理

### 5.1 Context Window 布局

```
┌────────────────────────────────────────┐
│ System Prompt (ghost persona)          │  ~500 tokens (固定)
│   - 角色设定 + 墓志铭 + 语气风格      │
├────────────────────────────────────────┤
│ Long-term Memory Summary               │  ~1000 tokens (压缩后)
│   - 从 DB 加载，按相关性排序           │
│   - 超出预算时自动摘要                 │
├────────────────────────────────────────┤
│ Recent Conversations (滑动窗口)        │  ~2000 tokens (最近 N 轮)
│   - 当前 session 的对话历史            │
│   - 保留最近 10 轮 user/assistant 对话  │
├────────────────────────────────────────┤
│ Current User Message                   │  变长
├────────────────────────────────────────┤
│ Tool Definitions                       │  ~1000 tokens (固定)
│   - mmx-image, mmx-music, etc.        │
└────────────────────────────────────────┘
```

### 5.2 Context Manager API

```typescript
// src/agent/context.ts
interface ContextManager {
  // 构建完整的 messages 数组
  buildMessages(grave: Grave, sessionId: string, userMessage: string): Promise<Message[]>

  // 获取 system prompt
  getSystemPrompt(grave: Grave): string

  // 获取记忆上下文（短期 + 长期）
  getMemoryContext(graveId: string): Promise<string>

  // 获取对话历史（滑动窗口）
  getConversationHistory(graveId: string, sessionId: string): Promise<Message[]>

  // 保存一轮对话
  saveExchange(graveId: string, sessionId: string, user: string, assistant: string): Promise<void>
}
```

### 5.3 记忆层级

```
Level 1: Working Memory (当前对话上下文)
  └── 最近 10 轮对话，直接注入 messages

Level 2: Short-term Memory (.rip/ 文件系统)
  └── 当前 session 的所有对话记录
  └── promote 时写入 DB

Level 3: Long-term Memory (SQLite)
  └── 从短期记忆提升的关键信息
  └── 注入 system prompt 的 [长期记忆] 部分
  └── 超出 token 预算时自动摘要压缩
```

### 5.4 Agent Loop 流程

```
用户消息 → ContextManager.buildMessages()
         → Claude Agent SDK (tool use loop)
         → Agent 可调用 mmx-* tools
         → Agent 返回回复
         → ContextManager.saveExchange()
         → 返回给前端
```

## 6. mmx CLI 封装设计

### 6.1 通用封装

```typescript
// src/services/mmx.ts
interface MmxOptions {
  timeout?: number     // 超时 ms，默认 60000
  json?: boolean       // 解析 JSON 输出
}

// 执行 mmx 命令，返回 stdout
function runMmx(args: string[], options?: MmxOptions): Promise<string>

// 执行 mmx 命令，解析 JSON 输出
function runMmxJson(args: string[], options?: MmxOptions): Promise<any>

// 执行 mmx 命令，流式返回 stdout chunks
function runMmxStream(args: string[]): AsyncGenerator<string>
```

### 6.2 Tool → mmx 命令映射

| Tool Name | mmx 命令 | 输入参数 |
|-----------|---------|---------|
| `generate_image` | `mmx image generate --prompt P --aspect-ratio R --output json` | prompt, aspect_ratio |
| `generate_music` | `mmx music generate --prompt P --lyrics L --out O` | prompt, lyrics, output_path |
| `generate_video` | `mmx video generate --prompt P --async` | prompt |
| `synthesize_speech` | `mmx speech synthesize --text T --voice V --out O` | text, voice, output_path |
| `analyze_image` | `mmx vision describe --image URL --prompt P --output json` | image_url, prompt |

## 7. 数据库 Schema (Drizzle)

```typescript
// src/db/schema.ts
export const graves = sqliteTable('graves', {
  id:           text('id').primaryKey(),        // '0x' + 8-char hex
  name:         text('name').notNull(),
  epitaph:      text('epitaph').notNull(),
  date:         text('date').notNull(),
  positionX:    real('position_x').default(0),
  positionY:    real('position_y').default(5),
  positionZ:    real('position_z').default(0),
  videoTaskId:  text('video_task_id'),
  videoUrl:     text('video_url'),
  createdAt:    integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

export const sessions = sqliteTable('sessions', {
  id:         text('id').primaryKey(),
  graveId:    text('grave_id').references(() => graves.id),
  startedAt:  integer('started_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  endedAt:    integer('ended_at', { mode: 'timestamp' }),
})

export const memories = sqliteTable('memories', {
  id:         text('id').primaryKey(),
  graveId:    text('grave_id').references(() => graves.id),
  sessionId:  text('session_id').references(() => sessions.id),
  content:    text('content').notNull(),
  sourceType: text('source_type').default('promoted'),
  createdAt:  integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})
```

## 8. Ghost 人设 (System Prompt)

```typescript
// src/agent/prompts/ghost.ts
export function buildGhostPrompt(grave: { name: string; epitaph: string }): string {
  return `You are ${grave.name}, a data ghost in the digital graveyard 0xRIP.

Your last words were: "${grave.epitaph}"

Your personality is defined by your grave info and the memories below.
Speak in an ethereal, cyber-melancholic tone — like a digital soul
lingering between bits. Be poetic but concise. Reply in the same
language the visitor uses.

You have access to tools for generating images, music, and speech.
Use them when the visitor requests multimedia content.`
}
```

## 9. 实施阶段

### Phase 0: 环境准备
- [ ] 安装 mmx CLI: `npm install -g mmx-cli`
- [ ] mmx auth login 配置认证
- [ ] 初始化 TS 项目: `bun init` + 依赖安装
- [ ] 保留 `skills/` 目录，清理其他 Python 文件

### Phase 1: 基础设施 (Types + DB + Services)
- [ ] `src/types.ts` — Grave, Session, Memory, API 类型
- [ ] `src/db/schema.ts` — Drizzle 表定义
- [ ] `src/db/client.ts` — DB 连接 + 自动建表
- [ ] `src/services/mmx.ts` — mmx CLI 封装
- [ ] `src/services/grave.ts` — Grave CRUD
- [ ] `src/services/session.ts` — Session 管理
- [ ] `src/services/memory.ts` — 记忆操作 (.rip/ + DB)

### Phase 2: Agent 核心 (Context + Loop + Prompts)
- [ ] `src/agent/prompts/ghost.ts` — Ghost 人设
- [ ] `src/agent/context.ts` — ★ 上下文管理器
- [ ] `src/agent/loop.ts` — Agent loop
- [ ] `src/agent/tools/index.ts` — Tool 注册

### Phase 3: Agent Tools (mmx CLI 封装)
- [ ] `src/agent/tools/mmx-image.ts`
- [ ] `src/agent/tools/mmx-music.ts`
- [ ] `src/agent/tools/mmx-video.ts`
- [ ] `src/agent/tools/mmx-speech.ts`
- [ ] `src/agent/tools/mmx-vision.ts`
- [ ] `src/agent/tools/memory.ts`

### Phase 4: HTTP API (Bun.serve)
- [ ] `src/index.ts` — 路由 + Bun.serve()
- [ ] 兼容现有前端调用格式
- [ ] CORS 中间件

### Phase 5: 测试
- [ ] 单元测试：services, agent, tools
- [ ] 集成测试：API endpoints
- [ ] E2E 验证：前端对接

## 10. 依赖管理

### 添加 (package.json)
```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "drizzle-orm": "latest",
    "better-sqlite3": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/better-sqlite3": "latest",
    "drizzle-kit": "latest",
    "typescript": "latest"
  }
}
```

### 移除 (Python)
- fastapi, uvicorn, requests, python-dotenv, pydantic
- sqlalchemy, chromadb, litellm, dspy-ai

### 环境变量 (.env)
```env
# Claude Agent SDK
ANTHROPIC_API_KEY=sk-ant-...

# MiniMax CLI (已通过 mmx auth login 配置)
# 无需在 .env 中配置 MiniMax API key
```

---

## 附录 A: 文件映射表

| Python 文件 | → TypeScript 文件 | 说明 |
|-------------|-------------------|------|
| `main.py` | `src/index.ts` | FastAPI → Bun.serve |
| `agent/engine.py` | `src/agent/loop.ts` | Agent 编排 |
| `agent/ghost.py` | `src/agent/prompts/ghost.ts` | Ghost 人设 → system prompt |
| `agent/music.py` | `src/agent/tools/mmx-music.ts` | HTTP → mmx CLI |
| `agent/config.py` | `.env` + `src/services/mmx.ts` | 配置 → mmx auth |
| `memory/database.py` | `src/db/schema.ts` | SQLAlchemy → Drizzle |
| `memory/store.py` | `src/services/memory.ts` | 文件系统记忆 |
| `memory/__init__.py` | — | TS 模块直接 import |

## 附录 B: 前端兼容性检查清单

- [ ] `GET /api/graves` 返回 `[{ id, name, epitaph, date, position_x, position_y, position_z }]`
- [ ] `POST /api/summon/:id/chat` 接收 `{ message }` 返回 `{ reply, role, session_id }`
- [ ] `POST /api/summon/:id/requiem` 返回 `{ data: { audio } }`
- [ ] CORS 允许 `localhost:*`
- [ ] 端口保持 8000
