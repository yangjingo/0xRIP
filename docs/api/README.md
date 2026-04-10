# API — 后端

后端接口文档与 Skills 资源。

## 技术栈

| 层 | 技术 |
|---|------|
| Runtime | Bun |
| HTTP | Bun.serve() |
| Agent | MiniMax M2.7 (Anthropic 兼容端点) |
| 多媒体 | mmx CLI (image/music/video/speech/vision) |
| DB | SQLite + Drizzle ORM |

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
| [skills.md](./skills.md) | 13个赛博灵魂Skill（同事/前任/导师/永生等） |

→ 重构计划：[refactor/](../refactor/) | 项目文档：[Story](../story/) | 前端 UX：[UX](../ux/)
