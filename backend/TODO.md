# Backend TODO

> TypeScript + Bun + mmx CLI 架构，对齐 `docs/api/` 文档。

## Agent 核心 (`src/agent/`)

- [x] Agent loop + tool use (`src/agent/loop.ts`) — MiniMax M2.7 Anthropic 兼容端点
- [x] Ghost 人设 system prompt (`src/agent/prompts/ghost.ts`)
- [x] 上下文管理器 (`src/agent/context.ts`) — 记忆注入 + 滑动窗口
- [x] 5 个 mmx tools (`src/agent/tools/mmx-*.ts`) — image/music/video/speech/vision
- [x] 多轮 tool-use 循环 (max 5 iterations)
- [ ] SSE 流式输出 (chat endpoint → 前端实时显示)
- [ ] 记忆摘要压缩 (超出 token 预算时自动摘要旧对话)
- [ ] 示例对话学习 (few-shot examples in system prompt)
- [ ] Tool: memory 内部工具 (save_memory / recall_memories)

## API 路由 (`src/index.ts`)

### Graves

- [x] `GET  /api/graves` — 列出所有墓地（空时自动创建 Satoshi）
- [x] `POST /api/graves` — 创建墓地（随机 3D 位置）
- [ ] `GET  /api/graves/:id` — 获取单个墓地
- [ ] `PUT  /api/graves/:id` — 更新墓地
- [ ] `DELETE /api/graves/:id` — 删除墓地

### Summon（召唤 Ghost）

- [x] `POST /api/summon/:id/session` — 创建会话
- [x] `GET  /api/summon/:id/sessions` — 列出会话（含 memory_count）
- [x] `POST /api/summon/:id/chat` — 与 ghost 对话（tool use loop）
- [x] `POST /api/summon/:id/requiem` — 生成安魂曲（mmx music）
- [x] `POST /api/summon/:id/promote` — 提升短期记忆到长期

### Generate（多媒体）

- [x] `POST /api/generate/image` — 文生图（mmx image）
- [x] `POST /api/generate/speech` — 语音合成（mmx speech）
- [x] `POST /api/generate/video` — 视频生成（异步）
- [x] `GET  /api/generate/video/:taskId` — 查询视频进度
- [ ] `GET  /api/generate/video/:taskId/download` — 视频下载
- [ ] `POST /api/generate/voice-clone` — 语音克隆（上传音频 → mmx）

## Services (`src/services/`)

### mmx CLI (`src/services/mmx.ts`)

- [x] `runMmx()` — 基本命令执行
- [x] `runMmxJson()` — JSON 输出解析
- [x] `runMmxStream()` — 流式输出（async generator）
- [ ] 超时重试机制

### Grave CRUD (`src/services/grave.ts`)

- [x] `listGraves()` / `getGrave()` / `createGrave()`
- [x] `ensureDefaultGrave()` — Satoshi 默认墓地
- [ ] `updateGrave()` / `deleteGrave()`

### Session 管理 (`src/services/session.ts`)

- [x] `createSession()` / `listSessions()` / `endSession()`
- [x] Session memory count 查询

### 记忆系统 (`src/services/memory.ts`)

- [x] 短期记忆 (.rip/ 文件系统) — `addMemory()` / `readGraveShortTerm()`
- [x] 长期记忆 (SQLite) — `saveLongTermMemories()`
- [x] Promote 流程 — `promoteSession()` / `promoteAll()`
- [x] Profile 读写 — `readProfile()` / `writeProfile()`
- [ ] 记忆摘要（自动生成 session summary 写入 session.md）
- [ ] 记忆检索（向量搜索长期记忆）
- [ ] 记忆过期 / 容量上限

## 数据库 (`src/db/`)

- [x] Drizzle ORM 表定义 (`src/db/schema.ts`) — graves / sessions / memories
- [x] bun:sqlite 连接 + 自动建表 (`src/db/client.ts`)
- [x] WAL mode + foreign keys

## 测试 (`tests/`)

- [ ] Services 层单元测试（mmx/grave/session/memory）
- [ ] Agent 层测试（context manager / tools）
- [ ] API 集成测试（HTTP endpoints）
- [ ] E2E 前端兼容性测试
- [ ] Mock 策略（mock `Bun.spawn` 替代真实 mmx 调用）

参考：`docs/api/tests.md` — 55 个测试用例设计

## 配置 & 部署

- [x] `.env` 配置（ANTHROPIC_BASE_URL + ANTHROPIC_API_KEY）
- [x] mmx CLI 认证（`mmx auth login`）
- [x] `.gitignore` 更新（node_modules / *.db / .env）
- [ ] `bun run dev` 启动脚本优化（自动 source .env）
