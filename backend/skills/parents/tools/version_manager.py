#!/usr/bin/env python3
"""
版本管理器 - 父母 Skill 版本存档与回滚
"""

import argparse
import json
import os
import shutil
from datetime import datetime
from pathlib import Path


def backup_skill(slug: str, base_dir: str = "./parents") -> dict:
    """备份当前版本"""
    
    skill_path = Path(base_dir) / slug
    versions_path = skill_path / "versions"
    
    if not skill_path.exists():
        return {"success": False, "error": f"Skill {slug} 不存在"}
    
    # 创建版本目录
    version_name = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    version_path = versions_path / version_name
    version_path.mkdir(parents=True)
    
    # 复制文件
    for f in ["memory.md", "persona.md", "SKILL.md", "meta.json"]:
        src = skill_path / f
        if src.exists():
            shutil.copy2(src, version_path / f)
    
    return {
        "success": True, 
        "version": version_name,
        "path": str(version_path)
    }


def rollback_skill(slug: str, version: str, base_dir: str = "./parents") -> dict:
    """回滚到指定版本"""
    
    skill_path = Path(base_dir) / slug
    version_path = skill_path / "versions" / version
    
    if not version_path.exists():
        return {"success": False, "error": f"版本 {version} 不存在"}
    
    # 先备份当前版本
    backup_result = backup_skill(slug, base_dir)
    
    # 恢复版本文件
    for f in ["memory.md", "persona.md", "SKILL.md", "meta.json"]:
        src = version_path / f
        if src.exists():
            shutil.copy2(src, skill_path / f)
    
    return {
        "success": True,
        "message": f"已回滚到版本 {version}",
        "backup": backup_result.get("version")
    }


def list_versions(slug: str, base_dir: str = "./parents") -> list:
    """列出所有版本"""
    
    skill_path = Path(base_dir) / slug
    versions_path = skill_path / "versions"
    
    if not versions_path.exists():
        return []
    
    versions = []
    for v in sorted(versions_path.iterdir(), reverse=True):
        if v.is_dir():
            versions.append(v.name)
    
    return versions


def main():
    parser = argparse.ArgumentParser(description='父母 Skill 版本管理器')
    parser.add_argument('--action', choices=['backup', 'rollback', 'list'], required=True, help='操作类型')
    parser.add_argument('--slug', help='Skill slug')
    parser.add_argument('--version', help='版本号（如 v20240402_123456）')
    parser.add_argument('--base-dir', default='./parents', help='基础目录')
    
    args = parser.parse_args()
    
    if args.action == 'backup':
        if not args.slug:
            print("需要 --slug 参数")
            return
        result = backup_skill(args.slug, args.base_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.action == 'rollback':
        if not args.slug or not args.version:
            print("需要 --slug 和 --version 参数")
            return
        result = rollback_skill(args.slug, args.version, args.base_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.action == 'list':
        if not args.slug:
            print("需要 --slug 参数")
            return
        versions = list_versions(args.slug, args.base_dir)
        print(json.dumps(versions, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
