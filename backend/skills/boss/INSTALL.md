# 老板.skill 安装说明

## 选择你的平台

### A. Claude Code

```bash
# 必须在 git 仓库根目录执行

# 安装到当前项目
mkdir -p .claude/skills
git clone https://github.com/vogtsw/boss-skills.git .claude/skills/create-boss

# 安装到全局
git clone https://github.com/vogtsw/boss-skills.git ~/.claude/skills/create-boss
```

### B. OpenClaw

```bash
git clone https://github.com/vogtsw/boss-skills.git ~/.openclaw/workspace/skills/create-boss
```

## 依赖安装

```bash
pip3 install -r requirements.txt
```

## 数据准备建议

优先准备这些材料：

1. 老板对项目的批评与追问
2. 老板对周报/汇报/方案的修改意见
3. 老板在风险、延期、资源冲突时的原话
4. 老板在会议纪要里的关注点
5. 老板给你的表扬、否定、催办和让你改方向的记录

## 快速验证

```bash
python3 tools/generic_chat_parser.py --help
python3 tools/wechat_parser.py --help
python3 tools/feishu_parser.py --help
python3 tools/email_parser.py --help
python3 tools/skill_writer.py --action list --base-dir ./bosses
```

建议再手动走一遍最短闭环：

1. 准备一份老板聊天记录文本
2. 用解析器抽取老板原话
3. 生成人设、判断、向上管理三份 markdown
4. 用 `skill_writer.py --action create` 写入一个 boss

## 目录说明

- `bosses/{slug}/judgment.md`
  老板如何判断项目
- `bosses/{slug}/management.md`
  如何向上管理这位老板
- `bosses/{slug}/persona.md`
  老板风格与表达
- `bosses/{slug}/SKILL.md`
  完整组合版
