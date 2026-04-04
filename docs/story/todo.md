# 0xRIP 实施计划与 TODO

---

## ✅ 已完成

| 模块 | 任务 | 说明 |
|:---|:---|:---|
| 工程化 | React + Vite + TypeScript 架构 | Zustand 状态管理，组件化开发 |
| 3D 引擎 | 视觉升级 + 后处理 | MeshStandardMaterial、Bloom 辉光、电影级色彩映射 |
| UI/UX | 希卡石板面板 + 招魂聊天框 | framer-motion 动效，Neural Link UI |
| 后端 | FastAPI 基础服务搭建 | 墓地 CRUD、Ghost Chat、MiniMax API 对接 |
| 项目管理 | uv + bun 工具链 | 后端 uv、前端 bun、run_dev.py 一键启动 |
| Skills | 13个赛博灵魂 Skill 收集 | backend/skills/（colleague/boss/ex/immortal 等） |
| 文档 | story/api/ux 三类重组 | kebab-case 命名统一 |

---

## 🔥 后端 (Backend)

### P0 — 文本和语音 API 接入

| ID | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| B1 | MiniMax 文本对话 API 封装 | 待重构 | 现有 `minimax_client.py` 需重构为可复用的 ChatService，支持多轮对话上下文管理、流式响应、模型切换 |
| B2 | MiniMax 语音合成 TTS 接入 | 待开始 | 招魂对话时将 Ghost 回复转为语音，调用 MiniMax TTS API |
| B3 | MiniMax 语音识别 ASR 接入 | 待开始 | 支持用户语音输入召魂问题，调用 MiniMax ASR API |
| B4 | API 统一响应格式 | 待开始 | 定义 `ChatResponse`、`TTSResponse`、`ASRResponse` Pydantic 模型，统一错误处理 |

### P0 — Skills 调用

| ID | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| B5 | Skill 加载器 | 待开始 | 扫描 `backend/skills/` 目录，解析 SKILL.md 元数据，注册可用 skills |
| B6 | Skill Router | 待开始 | 根据墓碑类型（同事/前任/父母/导师等）自动匹配对应 skill，加载 persona prompts |
| B7 | Skill 数据蒸馏接口 | 待开始 | 接收用户上传的聊天记录/照片，调用 skill 的 `prompts/intake.md` + `tools/` 进行人物蒸馏，生成 persona 文件 |
| B8 | 招魂时加载 persona | 待开始 | Ghost Chat 时根据墓碑关联的 skill persona 替换 system_prompt，实现个性化对话 |

### P0 — 本地 Memory 管理

| ID | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| B9 | Memory 模型重构 | 待开始 | 扩展 `MemoryModel`：支持多类型（text/image/voice/link）、标签、情感值 |
| B10 | Memory CRUD API | 待开始 | `/api/graves/{id}/memories` 增删改查，支持批量导入 |
| B11 | Memory 向量检索 | 待开始 | 接入 ChromaDB，招魂时 RAG 检索相关记忆注入上下文 |
| B12 | Memory 文件存储 | 待开始 | 图片/语音等附件存到本地 `backend/data/` 目录，数据库只存路径引用 |

### P1 — 其他后端

| ID | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| B13 | 埋葬仪式 API | 待开始 | `/api/graves` POST 创建墓碑，包含 name/epitaph/skill_type 等字段 |
| B14 | 挽歌生成优化 | 待开始 | 挽歌 API 根据墓碑 persona 生成个性化歌词 |

---

## 🎨 前端 (Frontend)

### P1 — 埋葬向导

| ID | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| F1 | 埋葬向导 (Bury Wizard) UI | 待开始 | 4步向导：选棺 → 墓志铭 → 确认死亡(消散特效) → 记忆上传 |
| F2 | Skill 类型选择器 | 待开始 | 埋葬时选择墓碑对应的 skill 类型（同事/前任/父母/导师/自己/永生） |

### P1 — 对话与记忆

| ID | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| F3 | 招魂对话对接后端 API | 待开始 | Neural Link UI 联通 `/api/summon/{id}/chat`，替换模拟回复 |
| F4 | 语音对话 UI | 待开始 | 集成麦克风录音 + 音频播放，对接 TTS/ASR API |
| F5 | 记忆时间线 (Timeline) | 待开始 | 选中墓碑详情区展示记忆节点时间轴 |

### P2 — 增强

| ID | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| F6 | 腐败机制 (Decay) | 待开始 | 对话数据随时间出现 glitch，模拟赛博数据风化 |
| F7 | 自然语言终端 | 待开始 | `/bury 我的初恋` 等 LLM 意图解析 |

---

## 架构备忘录

- **前端**: `frontend/` — React + TypeScript + R3F + Zustand + Bun
- **后端**: `backend/` — FastAPI + SQLAlchemy + ChromaDB + uv
- **Skills**: `backend/skills/` — 13个 persona 蒸馏 skill
- **设计**: 灰度主色调 + 霓虹青 `#00d4ff` 高光，动效柔和有呼吸感
