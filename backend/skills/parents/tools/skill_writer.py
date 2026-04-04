#!/usr/bin/env python3
"""
父母 Skill 文件管理器
"""

import argparse
import json
import os
import shutil
from datetime import datetime
from pathlib import Path


def list_skills(base_dir: str = "./parents") -> list:
    """列出所有已生成的父母 Skills"""
    
    skills = []
    base_path = Path(base_dir)
    
    if not base_path.exists():
        return skills
    
    for item in base_path.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            meta_file = item / "meta.json"
            if meta_file.exists():
                with open(meta_file, 'r', encoding='utf-8') as f:
                    meta = json.load(f)
                    skills.append(meta)
            else:
                # 没有 meta.json 的目录也列出
                skills.append({
                    "name": item.name,
                    "slug": item.name,
                    "path": str(item)
                })
    
    return skills


def create_skill(slug: str, base_dir: str = "./parents") -> dict:
    """创建新的父母 Skill 目录"""
    
    base_path = Path(base_dir)
    skill_path = base_path / slug
    
    if skill_path.exists():
        return {"success": False, "error": f"Skill {slug} 已存在"}
    
    # 创建目录结构
    (skill_path / "versions").mkdir(parents=True)
    (skill_path / "memories" / "chats").mkdir(parents=True)
    (skill_path / "memories" / "photos").mkdir(parents=True)
    (skill_path / "memories" / "social").mkdir(parents=True)
    
    return {"success": True, "path": str(skill_path)}


def delete_skill(slug: str, base_dir: str = "./parents") -> dict:
    """删除父母 Skill"""
    
    base_path = Path(base_dir)
    skill_path = base_path / slug
    
    if not skill_path.exists():
        return {"success": False, "error": f"Skill {slug} 不存在"}
    
    shutil.rmtree(skill_path)
    return {"success": True, "message": f"已删除 {slug}"}


def write_meta(slug: str, data: dict, base_dir: str = "./parents") -> dict:
    """写入 meta.json"""
    
    base_path = Path(base_dir)
    skill_path = base_path / slug
    meta_file = skill_path / "meta.json"
    
    if not skill_path.exists():
        skill_path.mkdir(parents=True)
    
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return {"success": True}


def read_meta(slug: str, base_dir: str = "./parents") -> dict:
    """读取 meta.json"""
    
    base_path = Path(base_dir)
    meta_file = base_path / slug / "meta.json"
    
    if not meta_file.exists():
        return {}
    
    with open(meta_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description='父母 Skill 文件管理器')
    parser.add_argument('--action', choices=['list', 'create', 'delete', 'write-meta', 'read-meta'], 
                       required=True, help='操作类型')
    parser.add_argument('--slug', help='Skill slug')
    parser.add_argument('--base-dir', default='./parents', help='基础目录')
    parser.add_argument('--data', help='JSON 数据（用于 write-meta）')
    
    args = parser.parse_args()
    
    if args.action == 'list':
        skills = list_skills(args.base_dir)
        print(json.dumps(skills, ensure_ascii=False, indent=2))
    
    elif args.action == 'create':
        if not args.slug:
            print("需要 --slug 参数")
            return
        result = create_skill(args.slug, args.base_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.action == 'delete':
        if not args.slug:
            print("需要 --slug 参数")
            return
        result = delete_skill(args.slug, args.base_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.action == 'write-meta':
        if not args.slug or not args.data:
            print("需要 --slug 和 --data 参数")
            return
        data = json.loads(args.data)
        result = write_meta(args.slug, data, args.base_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.action == 'read-meta':
        if not args.slug:
            print("需要 --slug 参数")
            return
        result = read_meta(args.slug, args.base_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
