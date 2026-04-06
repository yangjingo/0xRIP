# Backend TODO

> 对齐 `docs/api/` 文档，跟踪各能力的实现状态。

## Agent 核心

- [x] litellm + dspy 基础架构 (`agent/config.py`, `agent/ghost.py`, `agent/engine.py`)
- [x] 按功能配置模型 (`.env` → TEXT/IMAGE/MUSIC/VIDEO)
- [x] DSPy GhostChat 模块 (ChainOfThought + 幽灵人设)
- [ ] DSPy 优化：示例对话学习 (`sample_message_user` / `sample_message_ai`)
- [ ] 流式输出 (text stream / music stream)

## 文本对话 (docs/api/text.md)

- [x] 基础对话 (chat completion)
- [ ] 多轮对话上下文管理 (messages history)
- [ ] 角色扮演增强 (`user_system`, `group`, `sample_message_*`)
- [ ] 流式输出 (`stream: true`)

## 图像 (docs/api/image.md)

- [x] 图像理解 (vision / multimodal) — `agent/engine.py:understand_image()`
- [ ] 文生图 (image-01 / image-01-live)
- [ ] 画风设置 (`style_type` / `style_weight`, 仅 image-01-live)
- [ ] 宽高比 / 自定义尺寸 (`aspect_ratio`, `width` × `height`)
- [ ] 批量生成 (`n: 1-9`)
- [ ] prompt 自动优化 (`prompt_optimizer`)
- [ ] 返回格式 (`url` / `base64`)

## 音乐 (docs/api/music.md)

- [x] 音乐生成 (music-2.5+) — `agent/engine.py:generate_music()`
- [x] 查询生成进度 — `agent/engine.py:query_music()`
- [ ] 纯音乐模式 (`is_instrumental: true`)
- [ ] 歌词自动生成 (`lyrics_optimizer: true`)
- [ ] 流式传输 (`stream: true`, hex 格式)
- [ ] 语音克隆 (上传音频 → `voice_clone`)
- [ ] 复刻音频上传 (`POST /v1/files/upload`)

## 视频 (docs/api/video.md)

- [x] 基础视频生成 — `agent/engine.py:generate_video()`
- [ ] 查询视频生成进度
- [ ] 视频生成参数完善 (参考 docs)

## 记忆系统 (memory/)

- [x] 两层记忆架构 (.rip/ 短期 + DB 长期)
- [x] UUID 关联：grave → session → memory
- [x] Session 管理 (创建/关闭/列表)
- [x] Promote 流程 (短期 → 长期)
- [x] 测试覆盖 (35/35 pass)
- [ ] 记忆摘要 (DSPy 自动生成 session 摘要写入 session.md)
- [ ] 记忆检索 (chromadb 向量搜索长期记忆)
- [ ] 记忆过期 / 容量上限

## API 路由 (main.py)

- [x] `GET  /api/graves` — 墓碑列表
- [x] `POST /api/summon/<id>/session` — 创建会话
- [x] `POST /api/summon/<id>/chat` — 幽灵对话
- [x] `POST /api/summon/<id>/requiem` — 生成安魂曲
- [x] `POST /api/summon/<id>/promote` — 提升记忆
- [x] `GET  /api/summon/<id>/sessions` — 会话列表
- [ ] `POST /api/graves` — 创建墓碑
- [ ] `PUT  /api/graves/<id>` — 更新墓碑
- [ ] `DELETE /api/graves/<id>` — 删除墓碑
- [ ] `POST /api/summon/<id>/image` — 文生图
- [ ] `POST /api/summon/<id>/video` — 视频生成
- [ ] `GET  /api/summon/<id>/music/<task_id>` — 查询音乐进度
- [ ] `POST /api/summon/<id>/memories` — 手动添加长期记忆

## 清理

- [x] 删除 `test_minimax.py`
- [x] 删除 `minimax_client.py`
- [ ] 移除 `database.py` 中的 `declarative_base()` 弃用警告 (→ `sqlalchemy.orm.declarative_base`)
- [ ] 移除 `datetime.utcnow()` 弃用警告 (→ `datetime.now(UTC)`)
