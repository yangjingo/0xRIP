# 0xRIP 前端交互整体架构图

本文档用 **Mermaid** 画出前端交互的整体架构与主流程，便于设计与实现时对齐。在支持 Mermaid 的 Markdown 预览（如 GitHub、Cursor、VS Code 插件）中可直接渲染为图。

→ 叙事版（探墓人完整故事线）：[Story](../story/README.md)  
→ UI 交互规范：[ui.md](./ui.md)

---

## 一、整体架构分层

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        探墓人 (Tomb Visitor)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  入口层：终端式指令 + 3D 墓地场景 (Three.js) + 2D UI 叠加 (CRT/Glitch)   │
│  BURY | SUMMON | MOURN | LIST | DECAY | 自然语言 / 斜杠命令               │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  场景 A         │       │  场景 B          │       │  场景 C          │
│  埋葬仪式       │       │  墓地漫游         │       │  招魂仪式         │
│  (Onboarding)   │       │  (Exploration)   │       │  (Resurrection)  │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  数据与后端：墓碑 id、people/、记忆与资料、LLM/VLM/Voice、时间线加工      │
└─────────────────────────────────────────────────────────────────────────┘
```

对应 Mermaid 图如下（若需在文档内直接渲染可复制到支持 Mermaid 的编辑器中查看）：

```mermaid
flowchart TB
    subgraph User[" "]
        A[探墓人 Tomb Visitor]
    end

    subgraph Entry["入口层"]
        B[终端式指令 BURY / SUMMON / MOURN / LIST / DECAY]
        C[3D 墓地场景 Three.js]
        D[2D UI 叠加 CRT / Glitch]
    end

    subgraph Scenes["核心场景"]
        E[场景 A 埋葬仪式]
        F[场景 B 墓地漫游]
        G[场景 C 招魂仪式]
    end

    subgraph Backend["数据与后端"]
        H[墓碑 id · people/ · 记忆与资料]
        I[LLM / VLM / Voice · 时间线加工]
    end

    A --> B
    A --> C
    B --> E
    B --> F
    B --> G
    C --> E
    C --> F
    C --> G
    E --> H
    F --> H
    G --> H
    H --> I
```

---

## 二、入口与场景关系（指令 → 场景）

```mermaid
flowchart LR
    subgraph Input["输入方式"]
        T[终端指令]
        N[自然语言 / 斜杠命令]
    end

    subgraph Actions["动作与场景"]
        B[BURY → 埋葬仪式]
        S[SUMMON → 招魂仪式]
        M[MOURN → 悼念]
        L[LIST → 墓地漫游视图]
        D[DECAY → 风化/删除]
    end

    subgraph Exploration["墓地漫游内交互"]
        T1[点击墓碑 → 此人一生时间线]
        T2[点击幽灵 → 对话]
    end

    T --> B
    T --> S
    T --> M
    T --> L
    T --> D
    N --> B
    N --> S
    L --> T1
    L --> T2
```

---

## 三、埋葬仪式完整流程（含步骤 4 上传记忆）

```mermaid
flowchart TD
    Start([用户发起 BURY 或 拖拽文件]) --> S1[步骤 1: 选择棺材类型]
    S1 --> S2[步骤 2: 撰写墓志铭]
    S2 --> S3[步骤 3: 确认死亡]
    S3 --> ID[生成 0xDEAD... id]
    ID --> S4[步骤 4: 引导上传记忆与资料]

    S4 --> U1[私有上传 .txt]
    S4 --> U2[填入网页 URL]
    U2 --> Back[后端抓取 + 模型处理]
    Back --> Gen[生成独有 .txt 入碑]

    U1 --> Store[(存入该墓碑 id)]
    Gen --> Store

    S4 --> Skip[稍后再说]
    Store --> End([进入墓地漫游])
    Skip --> End
```

---

## 四、墓地漫游中「点击墓碑」的交互链

```mermaid
flowchart LR
    subgraph 墓地漫游
        A[3D 场景中的墓碑] --> B{用户操作}
    end

    B -->|悬停| C[显示死亡日期 / 大小 / 墓志铭]
    B -->|点击| D[进入该灵魂详情]
    B -->|长按 3s| E[彩蛋: 数据哀鸣音效]

    D --> F[时间线加工后的 此人一生]
    D --> G[该灵魂下全部原始痕迹]

    F --> H[逐段浏览]
    G --> H
```

---

## 五、招魂仪式流程

```mermaid
flowchart TD
    In([输入 死亡哈希 或 person_id]) --> Check{验证}
    Check -->|通过| V1[扫描线 / 拨号声]
    Check -->|失败| Err[ERROR: Soul not found]

    V1 --> V2[数据重组]
    V2 --> V3[幽灵形态 或 对话界面]
    V3 --> Chat[与 ta 回顾共同记忆 / 对谈]
    Chat --> Risk[可能腐败版本]

    Err --> End1([结束])
    Risk --> End2([继续对话])
```

---

## 六、前端技术栈与分层（实现视角）

```mermaid
flowchart TB
    subgraph Presentation["表现层"]
        HTML[index.html]
        CSS[style.css · 赛博墓地视觉]
        CRT[CRT 扫描线 / Glitch 2D 层]
    end

    subgraph Scene3D["3D 场景层"]
        Three[Three.js]
        Tomb[墓碑 · 幽灵 · 地面网格]
    end

    subgraph Interaction["交互层"]
        Terminal[终端输入 / 指令解析]
        Cursor[光标状态 下划线 / 0x / 棺材 / 骷髅]
        Voice[音效 可选]
    end

    subgraph State["状态与路由"]
        Route[当前场景: 埋葬 / 漫游 / 招魂 / 时间线]
        TombID[当前墓碑 id]
    end

    subgraph API["与后端通信"]
        BuryAPI[埋葬 · 上传 · URL 处理]
        SummonAPI[招魂 · 幽灵对话]
        TimelineAPI[时间线 此人一生]
    end

    HTML --> Three
    CSS --> CRT
    Terminal --> Route
    Route --> BuryAPI
    Route --> SummonAPI
    Route --> TimelineAPI
    Tomb --> TombID
```

---

## 七、图例与说明

| 图 | 用途 |
|:---|:---|
| **一、整体架构分层** | 从用户到入口、场景、后端的数据与职责分层。 |
| **二、入口与场景关系** | 终端/自然语言指令如何映射到具体场景与动作。 |
| **三、埋葬仪式完整流程** | 步骤 1～4 及 id 生成后上传记忆/URL、后端处理的顺序。 |
| **四、点击墓碑交互链** | 墓地漫游中悬停/点击/长按墓碑后的分支与「此人一生」展示。 |
| **五、招魂仪式流程** | 从输入 id 到验证、幽灵再现、对话的流程。 |
| **六、前端技术栈与分层** | 实现时表现层、3D、交互、状态、API 的划分。 |

如需导出为 PNG/SVG，可使用 [Mermaid Live Editor](https://mermaid.live) 或 VS Code 的 Mermaid 插件将上述代码块导出为图片后放入设计稿或 README。
