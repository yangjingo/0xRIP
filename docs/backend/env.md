# 环境变量配置说明

后端 AI 能力（LLM / VLM / TTS / STT）通过 **OpenAI 兼容接口** 调用。请按下面说明配置环境变量。

---

## 一、如何配置

1. 在项目根目录复制示例文件：
   ```bash
   cp .env.example .env
   ```
2. 用编辑器打开 `.env`，按下面「如何填写」填入你的 API 地址和 Key。
3. **不要** 将 `.env` 提交到 Git（已加入 `.gitignore`）。

---

## 二、如何填写对应的 API

### 1. 使用 OpenAI 官方

- **OPENAI_COMPATIBLE_BASE_URL**：留空，或填 `https://api.openai.com`。
- **OPENAI_API_KEY**：在 [OpenAI API Keys](https://platform.openai.com/api-keys) 创建并粘贴，形如 `sk-...`。
- 模型可留空，后端会使用常见默认（如 `gpt-4o` / `gpt-4o-mini`、`tts-1` 等）。

示例：
```env
OPENAI_COMPATIBLE_BASE_URL=
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. 使用 Azure OpenAI

- **OPENAI_COMPATIBLE_BASE_URL**：填你的 Azure 端点，例如  
  `https://<your-resource>.openai.azure.com/openai/deployments/<deployment-name>`  
  注意：兼容层一般期望路径里带 `/chat/completions` 等，请以你实际部署的 base URL 为准（有的库会自动拼子路径）。
- **OPENAI_API_KEY**：填 Azure 门户里该资源的 **Key**（不是 endpoint）。
- **OPENAI_CHAT_MODEL**：可填部署名称（若你的库用 query 参数指定 deployment 则可能不需要此项，视后端实现而定）。

### 3. 使用国内中转 / 第三方兼容端点

- **OPENAI_COMPATIBLE_BASE_URL**：填对方提供的 `v1` 基础地址，例如 `https://api.xxx.com/v1`。确保该地址支持：
  - `POST /chat/completions`（LLM）
  - 若用 VLM：同一接口，请求体里带 `image_url` 等
  - 若用 TTS：`POST /audio/speech`
  - 若用 STT：`POST /audio/transcriptions`
- **OPENAI_API_KEY**：填对方提供的 API Key（或 Bearer Token）。
- 模型名按对方文档填写（如 `gpt-4o`、`deepseek-chat` 等）。

### 4. 本地模型（Ollama / 自建兼容服务）

- **OPENAI_COMPATIBLE_BASE_URL**：例如 `http://localhost:11434/v1`（Ollama）或 `http://127.0.0.1:8000/v1`。
- **OPENAI_API_KEY**：本地常可留空或填任意非空字符串（视具体实现而定）。
- **OPENAI_CHAT_MODEL**：填本地模型名，如 `llama3`、`qwen2.5` 等。  
  注意：本地模型不一定支持 Vision / TTS / STT，可关闭 `ENABLE_TTS`、`ENABLE_STT`，且不配 VLM 相关能力。

---

## 三、可选变量说明

| 变量 | 说明 | 示例 |
|:---|:---|:---|
| **OPENAI_CHAT_MODEL** | 对话/文本模型名 | `gpt-4o`, `gpt-4o-mini` |
| **OPENAI_VISION_MODEL** | 视觉模型名（看图写墓志铭等） | `gpt-4o` |
| **OPENAI_TTS_MODEL** | 语音合成模型 | `tts-1`, `tts-1-hd` |
| **OPENAI_STT_MODEL** | 语音识别模型 | `whisper-1` |
| **ENABLE_TTS** | 是否开启 TTS | `true` / `false` |
| **ENABLE_STT** | 是否开启语音输入 | `true` / `false` |
| **FALLBACK_WITHOUT_API** | 无 Key 时是否用固定文案降级 | `true` / `false` |

---

## 四、安全提醒

- API Key 只放在 **后端** 环境变量中，前端不要读取或打包进代码。
- 生产环境使用独立的 Key 或受限权限，并定期轮换。
- 若需在团队内共享配置，可维护一份 `.env.example` 的副本并去掉真实 Key，仅作填写说明。

---

→ 接口与场景说明：[Backend - AI 接入](./ai-integration.md)
