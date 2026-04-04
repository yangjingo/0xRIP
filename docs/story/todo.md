# 0xRIP 实施计划与 TODO

当前状态：**V2 前端工程化重构完成**。我们已经从零散的 HTML 单文件，正式迁移到了现代化的 **React + TypeScript + R3F (React Three Fiber)** 架构。

---

## ✅ 已完成里程碑 (Completed)

| 模块 | 任务 | 状态 | 说明 |
|:---|:---|:---|:---|
| **工程化** | 架构升级至 React+Vite | **DONE** | 搭建了 `frontend`，引入 Zustand 进行全局状态管理，支持组件化开发。 |
| **3D 引擎** | 视觉表现与材质升级 | **DONE** | 升级全场景为 `MeshStandardMaterial`，重构软阴影与半球光（HemisphereLight），加入电影级色彩映射。 |
| **赛博视觉** | 辉光与后处理 (Bloom) | **DONE** | 引入 `@react-three/postprocessing`，为幽灵核心和底部唤醒阵法添加霓虹青色发光特效。 |
| **UI/UX** | 希卡石板交互重构 | **DONE** | 引入 `framer-motion` 实现物理弹簧阻尼效果的面板抽拉；修复多语言双向绑定。 |
| **核心机制** | 招魂交互 (Neural Link) UI | **DONE** | 成功将“招魂聊天框”无缝嵌入到面板内部，实现随选定墓碑切换、系统模拟打字与自动滚动功能。 |

---

## 🚧 当前阶段：真实数据接入与埋葬仪式 (Current Phase)

| ID | 任务 | 优先级 | 状态 | 说明 |
|:---|:---|:---|:---|:---|
| F1 | **埋葬向导 (Bury Wizard) UI** | P0 | 待开始 | 点击 "Upload" 或发起指令后，弹出4步向导：选棺 → 墓志铭 → 确认死亡(消散特效) → 记忆片段上传。 |
| F2 | **记忆时间线 (Timeline UI)** | P1 | 待开始 | 在选中墓碑的详情区域，展示「此人一生」的时间轴（解析逝者的记忆节点）。 |
| B1 | **基础后端搭建 (API Server)** | P0 | 待开始 | 搭建 Node.js (Express/Nest) 或 Python (FastAPI) 后端，接管 `/api/graves` CRUD 接口。 |

---

## 🔮 下一阶段：大模型与灵魂再造 (Next Steps: LLM & RAG)

| ID | 任务 | 优先级 | 说明 |
|:---|:---|:---|:---|
| E1 | **灵魂存储 (Vector DB)** | P0 | 将用户上传的 `.txt` / 对话记录转化为向量特征，存储至本地数据库（如 ChromaDB/Milvus）或文件系统。 |
| E2 | **招魂会话 (LLM Integration)** | P0 | 联通前端的 Neural Link UI 和大模型 API。模型通过检索 (RAG) 当前墓碑下的记忆碎片，模仿逝者的语气进行对话。 |
| E3 | **腐败机制 (Decay System)** | P2 | 随着时间推移，对话数据出现“丢失/Glitch”，模拟赛博数据的风化。 |
| E4 | **自然语言终端** | P2 | 支持玩家直接打字输入 `/bury 我的初恋`，由 LLM 解析意图并调出相应的交互组件。 |

---

## 📝 架构备忘录

*   **前端目录**: `frontend/`
*   **状态管理**: `src/store/useStore.ts`
*   **3D 场景**: `src/components/canvas/Scene.tsx`
*   **2D 界面**: `src/components/ui/SheikahPanel.tsx`
*   **设计原则**: 保持极简的灰度主色调 + 霓虹青 (`#00d4ff`) 高光，所有 UI 动效必须柔和且具有“呼吸感”。
