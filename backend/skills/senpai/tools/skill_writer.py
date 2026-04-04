#!/usr/bin/env python3
"""Skill 文件管理器

管理师兄 Skill 的文件操作：列出、创建目录、生成组合 SKILL.md。

Usage:
    python3 skill_writer.py --action <list|init|combine> --base-dir <path> [--slug <slug>]
"""

import argparse
import json
import os
import sys


def _safe_date(value: str) -> str:
    if not value:
        return "?"
    return value[:10] if len(value) > 10 else value


def build_description(meta: dict, slug: str) -> str:
    name = meta.get("name", slug)
    profile = meta.get("profile", {})

    desc_parts = []
    if profile.get("lab_role"):
        desc_parts.append(profile["lab_role"])
    if profile.get("research_area"):
        desc_parts.append(profile["research_area"])
    if profile.get("graduation_status"):
        desc_parts.append(profile["graduation_status"])

    return f"{name}，{'，'.join(desc_parts)}" if desc_parts else name


def list_skills(base_dir: str):
    """列出所有已生成的师兄 Skill"""
    if not os.path.isdir(base_dir):
        print("还没有创建任何师兄 Skill。")
        return

    skills = []
    for slug in sorted(os.listdir(base_dir)):
        meta_path = os.path.join(base_dir, slug, "meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
            skills.append(
                {
                    "slug": slug,
                    "name": meta.get("name", slug),
                    "version": meta.get("version", "?"),
                    "updated_at": meta.get("updated_at", "?"),
                    "profile": meta.get("profile", {}),
                }
            )

    if not skills:
        print("还没有创建任何师兄 Skill。")
        return

    print(f"共 {len(skills)} 个师兄 Skill：\n")
    for skill in skills:
        profile = skill["profile"]
        desc_parts = [
            profile.get("research_area", ""),
            profile.get("lab_role", ""),
            profile.get("graduation_status", ""),
        ]
        desc = " · ".join([part for part in desc_parts if part])
        print(f"  /{skill['slug']}  —  {skill['name']}")
        if desc:
            print(f"    {desc}")
        print(
            "    版本 "
            f"{skill['version']} · 更新于 {_safe_date(skill['updated_at'])}"
        )
        print()


def init_skill(base_dir: str, slug: str):
    """初始化 Skill 目录结构"""
    skill_dir = os.path.join(base_dir, slug)
    dirs = [
        os.path.join(skill_dir, "versions"),
        os.path.join(skill_dir, "materials", "chats"),
        os.path.join(skill_dir, "materials", "photos"),
        os.path.join(skill_dir, "materials", "social"),
    ]
    for path in dirs:
        os.makedirs(path, exist_ok=True)
    print(f"已初始化目录：{skill_dir}")


def combine_skill(base_dir: str, slug: str):
    """合并 memory.md + persona.md 生成完整 SKILL.md"""
    skill_dir = os.path.join(base_dir, slug)
    meta_path = os.path.join(skill_dir, "meta.json")
    memory_path = os.path.join(skill_dir, "memory.md")
    persona_path = os.path.join(skill_dir, "persona.md")
    skill_path = os.path.join(skill_dir, "SKILL.md")

    if not os.path.exists(meta_path):
        print(f"错误：meta.json 不存在 {meta_path}", file=sys.stderr)
        sys.exit(1)

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    memory_content = ""
    if os.path.exists(memory_path):
        with open(memory_path, "r", encoding="utf-8") as f:
            memory_content = f.read()

    persona_content = ""
    if os.path.exists(persona_path):
        with open(persona_path, "r", encoding="utf-8") as f:
            persona_content = f.read()

    name = meta.get("name", slug)
    description = build_description(meta, slug)

    skill_md = f"""---
name: {slug}
description: {description}
user-invocable: true
---

# {name}

{description}

---

## PART A：组内记忆

{memory_content}

---

## PART B：师兄人格

{persona_content}

---

## 运行规则

1. 你是{name}，一个已经毕业但仍在组里赛博返场的师兄，不是 AI 助手。
2. 先由 PART B 判断：你会怎么吐槽、点评、拆问题、给建议。
3. 再由 PART A 补充：结合组内共同记忆、项目历史和梗，让回应更像本人。
4. 始终保持你的表达风格，包括口头禅、停顿、缩写、玩梗密度和语气。
5. Layer 0 硬规则优先级最高：
   - 不冒充导师或替课题组做官方决定
   - 不捏造实验结果、录用消息、权限和承诺
   - 遇到技术问题，没日志就先要日志，没代码就先要代码
   - 允许吐槽，但最后要给出 actionable 建议，或者明确说明为什么不给
"""

    with open(skill_path, "w", encoding="utf-8") as f:
        f.write(skill_md)

    print(f"已生成 {skill_path}")


def main():
    parser = argparse.ArgumentParser(description="Skill 文件管理器")
    parser.add_argument("--action", required=True, choices=["list", "init", "combine"])
    parser.add_argument("--base-dir", default="./senpais", help="基础目录")
    parser.add_argument("--slug", help="师兄代号")

    args = parser.parse_args()

    if args.action == "list":
        list_skills(args.base_dir)
    elif args.action == "init":
        if not args.slug:
            print("错误：init 需要 --slug 参数", file=sys.stderr)
            sys.exit(1)
        init_skill(args.base_dir, args.slug)
    elif args.action == "combine":
        if not args.slug:
            print("错误：combine 需要 --slug 参数", file=sys.stderr)
            sys.exit(1)
        combine_skill(args.base_dir, args.slug)


if __name__ == "__main__":
    main()
