# Claude Code Skills 合集

> 收集各种"赛博灵魂"Skills — 同事、前任、导师、老板、永生……把身边的一切封装成一个Skill。
>
> 来源：[刘聪NLP - 知乎](https://zhuanlan.zhihu.com/p/2023409375402886538)
>
> 本地路径：`backend/skills/`

## 核心理念

把人蒸馏成AI Skill — 通过聊天记录、工作记录等数据，将一个人的工作能力和人格特质提取为AI Skill，实现"赛博永生"。AI正在从"能力模型"走向"行为模型"。

## Skills 列表

### 1. 同事 Skill (`backend/skills/colleague/`)

将冰冷的离别化为温暖的Skill，同事跑了用同事.skill。这一系列的开创性项目。

- **GitHub**: https://github.com/titanwings/colleague-skill
- **Stars**: 5.4k+ (三天)
- **作用**: 自动采集飞书/钉钉聊天数据，蒸馏同事的**工作能力(Work Skill) + 人格(Persona)**双层架构，生成可对话的同事AI分身，支持持续进化
- **数据源**: 飞书、钉钉、邮件、Slack

### 2. 老板 Skill (`backend/skills/boss/`)

模拟老板交互，向上管理指导。

- **GitHub**: https://github.com/vogtsw/boss-skills
- **作用**: 两种模式 — (1) 从真实聊天/会议记录/邮件蒸馏老板的AI分身 (2) 基于名人企业家原型（Elon Musk、Steve Jobs等）生成老板Skill。包含**管理风格分析**和**决策判断分析**

### 3. 前任 Skill (`backend/skills/ex/`)

同事跑了用同事.skill，前任跑了用前任.skill，赛博永生一条龙。

- **GitHub**: https://github.com/perkfly/ex-skill
- **作用**: 导入微信/iMessage/短信/照片，生成**共同记忆(Memories) + 人格(Persona)**，还原前任的说话方式和性格特征，支持持续进化

### 4. 暗恋对象 Skill (`backend/skills/crush/`)

- **GitHub**: https://github.com/xiaoheizi8/crush-skills
- **作用**: 导入聊天记录、照片、朋友圈，生成**恋爱记忆(Relationship Memory) + 人格(Persona)**，还原暗恋对象的人格特质和互动模式，支持持续进化

### 5. 自己 Skill (`backend/skills/yourself/`)

与其蒸馏别人，不如蒸馏自己。

- **GitHub**: https://github.com/notdog1998/yourself-skill
- **作用**: 解构自己的聊天记录、日记、照片，生成可运行的**数字自我**，加入数字永生。独特的双层架构：Self Skill + Persona

### 6. 父母 Skill (`backend/skills/parents/`)

- **GitHub**: https://github.com/xiaoheizi8/parents-skills
- **作用**: 导入与父母的聊天记录、照片、语音，生成**亲情记忆(Parent Memory) + 人物性格(Persona)**，让父母的温暖陪伴以数字形式延续

### 7. 导师 Skill (`backend/skills/supervisor/`)

- **GitHub**: https://github.com/ybq22/supervisor
- **作用**: 自动收集学术导师的**论文、公开信息**，分析研究风格和指导方式，生成可对话的**数字导师Skill**，帮助练习与导师的沟通

### 8. 师兄 Skill (`backend/skills/senpai/`)

- **GitHub**: https://github.com/zhanghaichao520/senpai-skill
- **作用**: 把毕业大师兄蒸馏成AI Skill，导入聊天记录、组会纪要、照片和截图，生成**实验室集体记忆(Group Memory) + 人格(Persona)**，保留师兄的科研经验和指导风格

### 9. 永生 Skill (`backend/skills/immortal/`)

开源数字永生框架，通用蒸馏方案。

- **GitHub**: https://github.com/agenmod/immortal-skill
- **作用**: 从聊天记录、社交媒体、文档等多平台数据蒸馏任何人的**七维数字分身**。支持7种角色模板（自己/同事/导师/亲人/伴侣/朋友/公众人物），接入12+数据平台
- **数据源**: 微信、飞书、钉钉、iMessage、Telegram、WhatsApp、Slack、Discord、邮件、Twitter等

### 10. 数字人生 Skill (`backend/skills/digital-life/`)

5个以数字痕迹为证据的人文自我考古工具。

- **GitHub**: https://github.com/wildbyteai/digital-life
- **作用**: 5个子Skill — **AI替身**(ai_clone)、**社死考古**(cringe_archaeology)、**遗产清算**(legacy_audit)、**前世追溯**(past_life)、**墓志铭**(epitaph)。用数字痕迹照见真实的自己
- **与0xRIP的契合点**: 墓志铭生成、遗产清算 — 天然适合数字墓地场景

### 11. 重逢 Skill (`backend/skills/reunion/`)

- **GitHub**: https://github.com/yangdongchen66-boop/reunion-skill
- **作用**: "死亡不是终点，遗忘才是。" 让逝去的亲人以另一种方式继续陪伴。导入聊天记录和照片，蒸馏**逝者人格 + 共同记忆**，生成可对话的AI分身，内置安全防护机制

---

## PUA 系列

### 12. PUA Skill (`backend/skills/pua/`)

- **GitHub**: https://github.com/tanweai/pua
- **作用**: 使用企业PUA话术驱动AI，通过KPI考核、P10/P9/P7等级压力等手段，让AI"不好意思摸鱼"，提升代码产出。支持多种风味(flavor)和循环PUA模式

### 13. NoPUA Skill (`backend/skills/nopua/`)

- **GitHub**: https://github.com/wuji-labs/nopua
- **作用**: PUA的反面 — "你不是被KPI考核的P8，你是一个拥有能力和善意的存在。" 用**内在清醒**代替恐惧驱动，适用于所有任务类型（代码/调试/研究/写作/规划/运维等）

---

## 0xRIP 集成建议

| Skill | 墓地应用场景 |
|-------|-------------|
| 同事 | "职场纪念区" — 纪念离职同事 |
| 前任 | "失恋墓地" — 埋葬恋爱记忆 |
| 父母 | "亲情墓碑" — 让父母的声音永存 |
| 导师/师兄 | "学术纪念墙" — 保留学术传承 |
| 重逢 | 核心功能 — 与逝者对话 |
| 永生 | 通用框架 — 任何人的数字分身 |
| 数字人生(墓志铭) | 自动生成墓志铭 |
| 自己 | "数字遗嘱" — 蒸馏自己的数字遗产 |

---

## Skills 资源合集

| 资源 | 链接 |
|------|------|
| Awesome Claude Skills | https://github.com/ComposioHQ/awesome-claude-skills |
| Awesome Agent Skills (1000+) | https://github.com/VoltAgent/awesome-agent-skills |
| Claude Code Skills 完全指南 | https://github.com/datawhalechina/easy-vibe |
| Claude Skills 官方仓库 | https://github.com/anthropics/skills |
| SkillsLLM 市场 | https://skillsllm.com |
