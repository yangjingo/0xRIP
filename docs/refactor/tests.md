# 0xRIP Backend Rewrite — Test Cases

## 测试策略

```
Unit Tests (Bun test)        → services, agent, tools 的纯逻辑
Integration Tests (Bun test) → API endpoints + DB + mmx CLI
E2E Tests (curl)             → 前端对接验证
```

---

## 1. Services 层测试

### 1.1 `src/services/mmx.ts` — mmx CLI 封装

| # | 测试用例 | 输入 | 期望输出 | 备注 |
|---|---------|------|---------|------|
| 1 | runMmx 基本调用 | `["--version"]` | stdout 字符串 | 验证 mmx 在 PATH |
| 2 | runMmx 超时 | 超长命令, timeout=100 | 抛出超时错误 | 验证超时机制 |
| 3 | runMmx 命令不存在 | `["nonexistent", "cmd"]` | 抛出错误, exit code ≠ 0 | 错误处理 |
| 4 | runMmxJson 解析 | `["quota"]` | 解析后的 JSON 对象 | 验证 JSON 输出 |
| 5 | runMmxJson 非法 JSON | mock 返回非 JSON | 抛出解析错误 | 容错测试 |

### 1.2 `src/services/grave.ts` — Grave CRUD

| # | 测试用例 | 输入 | 期望输出 | 备注 |
|---|---------|------|---------|------|
| 6 | listGraves 空数据库 | — | 自动创建 Satoshi, 返回 `[Satoshi]` | 与 Python 行为一致 |
| 7 | listGraves 有数据 | 预插入 2 个 grave | 返回 2 个 | |
| 8 | getGrave 存在 | 已知 id | 返回 Grave 对象 | |
| 9 | getGrave 不存在 | 随机 id | 返回 null | |
| 10 | createGrave | `{ name, epitaph, date }` | 返回带 id 的 Grave | id 格式 `0x` + 8 hex |
| 11 | createGrave 自动位置 | 新 grave | 随机 3D 位置 | |

### 1.3 `src/services/session.ts` — Session 管理

| # | 测试用例 | 输入 | 期望输出 | 备注 |
|---|---------|------|---------|------|
| 12 | createSession | grave_id | `{ session_id, grave_id }` | |
| 13 | createSession grave 不存在 | 无效 grave_id | 抛出 404 | |
| 14 | listSessions | 已有 3 个 session | 返回 3 个, 含 memory_count | |
| 15 | endSession | session_id | ended_at 被设置 | |

### 1.4 `src/services/memory.ts` — 记忆操作

| # | 测试用例 | 输入 | 期望输出 | 备注 |
|---|---------|------|---------|------|
| 16 | addMemory 短期记忆 | grave_id, session_id, content | 返回 memory_id | .rip/ 文件创建 |
| 17 | readGraveShortTerm | 2 个 session 各 2 条记忆 | 合并文本, 带 session 标签 | |
| 18 | readGraveShortTerm 空 | 无记忆 | 返回空字符串 | |
| 19 | promoteSession | session_id | 记忆文件删除, 返回内容列表 | |
| 20 | promoteAll | 3 个 session | 所有 session 记忆返回并清理 | |
| 21 | promoteSession 后 close_session | 已 promote 的 session | session.md 有 closed 标记 | |
| 22 | 读写 profile | grave_id, content | write→read 内容一致 | |

---

## 2. Agent 层测试

### 2.1 `src/agent/context.ts` — 上下文管理器

| # | 测试用例 | 输入 | 期望输出 | 备注 |
|---|---------|------|---------|------|
| 23 | buildMessages 基本构建 | grave + user message | `[system, ...history, user]` | |
| 24 | getSystemPrompt | `{ name: "Satoshi", epitaph: "..." }` | 包含名字和墓志铭 | |
| 25 | getMemoryContext 有长期记忆 | DB 中有 5 条长期记忆 | 格式化文本 `- content` | |
| 26 | getMemoryContext 有短期+长期 | 两种记忆都有 | 两部分合并, 标签 `[短期记忆]` `[长期记忆]` | |
| 27 | getConversationHistory 空白 | 新 session | 返回空数组 | |
| 28 | getConversationHistory 滑动窗口 | 20 轮对话 | 只返回最近 10 轮 | 窗口截断 |
| 29 | saveExchange | user + assistant 消息 | .rip/ 文件写入, 格式正确 | |
| 30 | token 预算超出 | 超长记忆 | 自动截断/摘要, 不超预算 | |

### 2.2 `src/agent/tools/*.ts` — Agent Tools

| # | 测试用例 | 输入 | 期望输出 | 备注 |
|---|---------|------|---------|------|
| 31 | generate_image tool | prompt + aspect_ratio | `{ image_urls: [...] }` | mock mmx |
| 32 | generate_music tool | prompt + lyrics | audio URL 或文件路径 | mock mmx |
| 33 | generate_video tool | prompt | `{ task_id: "..." }` | async 模式 |
| 34 | synthesize_speech tool | text + voice | audio 文件路径 | |
| 35 | analyze_image tool | image_url + prompt | 图片描述文本 | mock mmx |
| 36 | save_memory tool | content | memory_id | 内部 tool |
| 37 | tool schema 验证 | 缺少必填参数 | Zod 校验失败 | |

---

## 3. API 集成测试

### 3.1 路由测试 (HTTP 级别)

| # | 测试用例 | Method | Path | Body | 期望 Status | 期望 Response |
|---|---------|--------|------|------|------------|--------------|
| 38 | 获取空墓地列表 | GET | `/api/graves` | — | 200 | `[{ id: "0xDEADBEEF", name: "Satoshi", ... }]` |
| 39 | 创建墓地 | POST | `/api/graves` | `{ name: "Test", epitaph: "RIP", date: "2024-01-01" }` | 200 | `{ id: "0x...", name: "Test", ... }` |
| 40 | 创建会话 | POST | `/api/summon/:id/session` | — | 200 | `{ session_id: "...", grave_id: "..." }` |
| 41 | 创建会话 404 | POST | `/api/summon/invalid/session` | — | 404 | `{ detail: "Soul not found." }` |
| 42 | Chat 基本对话 | POST | `/api/summon/:id/chat` | `{ message: "你好" }` | 200 | `{ reply: "...", role: "ghost", session_id: "..." }` |
| 43 | Chat 自动创建 session | POST | `/api/summon/:id/chat` | `{ message: "你好" }` | 200 | 自动生成 session_id |
| 44 | Chat 带 session_id | POST | `/api/summon/:id/chat` | `{ message: "继续", session_id: "abc" }` | 200 | 使用传入的 session_id |
| 45 | Chat 404 | POST | `/api/summon/invalid/chat` | `{ message: "test" }` | 404 | Soul not found |
| 46 | 生成安魂曲 | POST | `/api/summon/:id/requiem` | — | 200 | `{ data: { audio: "..." } }` |
| 47 | 提升指定 session 记忆 | POST | `/api/summon/:id/promote` | `{ session_id: "abc" }` | 200 | `{ promoted: N, memory_ids: [...] }` |
| 48 | 提升所有记忆 | POST | `/api/summon/:id/promote` | `{ }` | 200 | `{ promoted: N, memory_ids: [...] }` |
| 49 | 列出 sessions | GET | `/api/summon/:id/sessions` | — | 200 | `[{ id, started_at, ended_at, memory_count }]` |

### 3.2 新增接口测试

| # | 测试用例 | Method | Path | Body | 期望 Status | 期望 Response |
|---|---------|--------|------|------|------------|--------------|
| 50 | 文生图 | POST | `/api/generate/image` | `{ prompt: "cyber ghost" }` | 200 | `{ image_urls: [...] }` |
| 51 | 语音合成 | POST | `/api/generate/speech` | `{ text: "你好" }` | 200 | `{ audio_url: "..." }` |
| 52 | 视频生成 | POST | `/api/generate/video` | `{ prompt: "ocean" }` | 200 | `{ task_id: "..." }` |
| 53 | 视频进度查询 | GET | `/api/generate/video/:taskId` | — | 200 | `{ status: 1或2, video_url? }` |

### 3.3 CORS 测试

| # | 测试用例 | 期望 |
|---|---------|------|
| 54 | OPTIONS 预检请求 | 返回 Access-Control-Allow-Origin |
| 55 | 实际请求带 Origin header | 响应包含 CORS headers |

---

## 4. 前端兼容性 E2E 测试

### 手动验证脚本

```bash
#!/bin/bash
# e2e-test.sh — 前端兼容性验证

BASE=http://localhost:8000

echo "=== Test 1: GET /api/graves ==="
curl -s $BASE/api/graves | jq .

echo "=== Test 2: POST /api/summon/:id/chat ==="
GRAVE_ID=$(curl -s $BASE/api/graves | jq -r '.[0].id')
curl -s -X POST $BASE/api/summon/$GRAVE_ID/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，Satoshi"}' | jq .

echo "=== Test 3: POST /api/summon/:id/requiem ==="
curl -s -X POST $BASE/api/summon/$GRAVE_ID/requiem | jq .

echo "=== Test 4: GET /api/summon/:id/sessions ==="
curl -s $BASE/api/summon/$GRAVE_ID/sessions | jq .

echo "=== Test 5: POST /api/summon/:id/promote ==="
curl -s -X POST $BASE/api/summon/$GRAVE_ID/promote \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

---

## 5. 测试分类

| 类型 | 范围 | 运行方式 |
|------|------|---------|
| Unit | services, agent, tools | `bun test tests/` |
| Integration | API endpoints + DB | `bun test tests/api/` |
| Mock | mmx CLI 不真实调用 | mock `Bun.spawn` |
| Live | 真实 mmx CLI 调用 | `MMX_LIVE=1 bun test tests/` (CI skip) |
| E2E | curl 脚本 | `bash scripts/e2e-test.sh` |

### Mock 策略

```typescript
// tests/helpers/mock-mmx.ts
// mock Bun.spawn 返回预设的 mmx 输出
// 不需要真实安装 mmx 即可运行大部分测试
```

---

## 6. 验收标准

- [ ] 所有 Unit tests 通过 (测试 1-37)
- [ ] 所有 Integration tests 通过 (测试 38-55)
- [ ] E2E 脚本全部通过
- [ ] 前端 `bun run dev` 能正常加载墓地列表
- [ ] 前端能发送 chat 消息并收到回复
- [ ] 前端能触发 requiem 音乐生成
- [ ] 响应格式与 Python 版本完全一致
