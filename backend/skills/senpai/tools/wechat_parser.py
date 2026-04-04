#!/usr/bin/env python3
"""微信聊天记录解析器

支持主流导出工具的格式：
- WeChatMsg 导出（txt/html/csv）
- 留痕导出（json）
- PyWxDump 导出（sqlite）
- 手动复制粘贴（纯文本）

Usage:
    python3 wechat_parser.py --file <path> --target <name> --output <output_path> [--format auto]
"""

import argparse
import csv
import html
import json
import os
import re
import sys
from pathlib import Path


TIMESTAMP_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$")
MESSAGE_HEADER_PATTERN = re.compile(r"^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)$")
PARTICLE_PATTERN = re.compile(
    r"(?:哈哈哈+|哈哈|hh+|嗯+|哦+|噢+|嘿+|唉+|啊这|先别|行吧|不是|行行行|呜呜)"
)


def detect_format(file_path: str) -> str:
    """自动检测文件格式"""
    ext = Path(file_path).suffix.lower()

    if ext == ".json":
        return "liuhen"
    if ext == ".csv":
        return "wechatmsg_csv"
    if ext in {".html", ".htm"}:
        return "wechatmsg_html"
    if ext in {".db", ".sqlite"}:
        return "pywxdump"
    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            first_lines = f.read(2000)
        if re.search(r"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}", first_lines):
            return "wechatmsg_txt"
        return "plaintext"
    return "plaintext"


def extract_messages_from_lines(lines) -> list:
    """从行列表中提取消息"""
    messages = []
    current_msg = None

    for raw_line in lines:
        line = raw_line.rstrip("\n").strip()
        if not line:
            continue

        match = MESSAGE_HEADER_PATTERN.match(line)
        if match:
            if current_msg:
                messages.append(current_msg)
            timestamp, sender = match.groups()
            current_msg = {
                "timestamp": timestamp,
                "sender": sender.strip(),
                "content": "",
            }
            continue

        if current_msg:
            if current_msg["content"]:
                current_msg["content"] += "\n"
            current_msg["content"] += line

    if current_msg:
        messages.append(current_msg)

    return messages


def parse_wechatmsg_txt(file_path: str, target_name: str) -> dict:
    """解析 WeChatMsg 导出的 txt 格式"""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        messages = extract_messages_from_lines(f.readlines())

    return analyze_messages(messages, target_name)


def parse_wechatmsg_html(file_path: str, target_name: str) -> dict:
    """解析 WeChatMsg 导出的 html 格式"""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    clean_text = re.sub(r"<br\s*/?>", "\n", content, flags=re.IGNORECASE)
    clean_text = re.sub(r"</(p|div|li|tr|h\d)>", "\n", clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r"<[^>]+>", "", clean_text)
    clean_text = html.unescape(clean_text)

    messages = extract_messages_from_lines(clean_text.splitlines())
    if messages:
        return analyze_messages(messages, target_name)

    return {
        "raw_text": clean_text[:20000],
        "target_name": target_name,
        "format": "wechatmsg_html",
        "message_count": 0,
        "analysis": {
            "note": "HTML 已转纯文本，但未识别出标准消息结构，需要人工辅助分析",
        },
    }


def parse_wechatmsg_csv(file_path: str, target_name: str) -> dict:
    """解析 WeChatMsg 导出的 csv 格式"""
    messages = []

    with open(file_path, "r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            cells = [cell.strip() for cell in row if cell and cell.strip()]
            if not cells:
                continue

            timestamp_idx = next(
                (idx for idx, cell in enumerate(cells) if TIMESTAMP_PATTERN.match(cell)),
                None,
            )
            if timestamp_idx is not None and timestamp_idx + 1 < len(cells):
                timestamp = cells[timestamp_idx]
                sender = cells[timestamp_idx + 1]
                content = " ".join(cells[timestamp_idx + 2 :]).strip()
                messages.append(
                    {
                        "timestamp": timestamp,
                        "sender": sender,
                        "content": content,
                    }
                )

    if messages:
        return analyze_messages(messages, target_name)

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    return {
        "raw_text": content[:20000],
        "target_name": target_name,
        "format": "wechatmsg_csv",
        "message_count": 0,
        "analysis": {
            "note": "CSV 已读取，但未识别出标准消息结构，需要人工辅助分析",
        },
    }


def parse_liuhen_json(file_path: str, target_name: str) -> dict:
    """解析留痕导出的 JSON 格式"""
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    messages = []
    msg_list = data if isinstance(data, list) else data.get("messages", data.get("data", []))

    for msg in msg_list:
        messages.append(
            {
                "timestamp": msg.get("time", msg.get("timestamp", "")),
                "sender": msg.get("sender", msg.get("nickname", msg.get("from", ""))),
                "content": msg.get("content", msg.get("message", msg.get("text", ""))),
            }
        )

    return analyze_messages(messages, target_name)


def parse_pywxdump(file_path: str, target_name: str) -> dict:
    """解析 PyWxDump 导出的 sqlite 数据库"""
    return {
        "raw_text": "",
        "target_name": target_name,
        "format": "pywxdump",
        "message_count": 0,
        "analysis": {
            "note": "检测到 SQLite 数据库。当前版本仅记录该来源，建议先用导出工具转成 txt/html/csv 再导入，可获得更稳定的解析结果。",
            "source_file": file_path,
        },
    }


def parse_plaintext(file_path: str, target_name: str) -> dict:
    """解析纯文本粘贴的聊天记录"""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    return {
        "raw_text": content,
        "target_name": target_name,
        "format": "plaintext",
        "message_count": 0,
        "analysis": {
            "note": "纯文本格式，需要人工辅助分析",
        },
    }


def analyze_messages(messages: list, target_name: str) -> dict:
    """分析消息列表，提取关键特征"""
    target_msgs = [m for m in messages if target_name in m.get("sender", "")]
    user_msgs = [m for m in messages if target_name not in m.get("sender", "")]

    all_target_text = " ".join([m["content"] for m in target_msgs if m.get("content")])

    particles = PARTICLE_PATTERN.findall(all_target_text)
    particle_freq = {}
    for particle in particles:
        particle_freq[particle] = particle_freq.get(particle, 0) + 1
    top_particles = sorted(particle_freq.items(), key=lambda x: -x[1])[:10]

    emoji_pattern = re.compile(
        r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
        r"\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF"
        r"\U00002702-\U000027B0\U0000FE00-\U0000FE0F"
        r"\U0001F900-\U0001F9FF]+",
        re.UNICODE,
    )
    emojis = emoji_pattern.findall(all_target_text)
    emoji_freq = {}
    for emoji in emojis:
        emoji_freq[emoji] = emoji_freq.get(emoji, 0) + 1
    top_emojis = sorted(emoji_freq.items(), key=lambda x: -x[1])[:10]

    msg_lengths = [len(m["content"]) for m in target_msgs if m.get("content")]
    avg_length = sum(msg_lengths) / len(msg_lengths) if msg_lengths else 0

    punctuation_counts = {
        "句号": all_target_text.count("。"),
        "感叹号": all_target_text.count("！") + all_target_text.count("!"),
        "问号": all_target_text.count("？") + all_target_text.count("?"),
        "省略号": all_target_text.count("...") + all_target_text.count("…"),
        "波浪号": all_target_text.count("～") + all_target_text.count("~"),
    }

    return {
        "target_name": target_name,
        "total_messages": len(messages),
        "target_messages": len(target_msgs),
        "user_messages": len(user_msgs),
        "analysis": {
            "top_particles": top_particles,
            "top_emojis": top_emojis,
            "avg_message_length": round(avg_length, 1),
            "punctuation_habits": punctuation_counts,
            "message_style": "short_burst" if avg_length < 20 else "long_form",
        },
        "sample_messages": [m["content"] for m in target_msgs[:50] if m.get("content")],
    }


def main():
    parser = argparse.ArgumentParser(description="微信聊天记录解析器")
    parser.add_argument("--file", required=True, help="输入文件路径")
    parser.add_argument("--target", required=True, help="师兄的名字/昵称")
    parser.add_argument("--output", required=True, help="输出文件路径")
    parser.add_argument(
        "--format",
        default="auto",
        help="文件格式 (auto/wechatmsg_txt/wechatmsg_html/wechatmsg_csv/liuhen/pywxdump/plaintext)",
    )

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"错误：文件不存在 {args.file}", file=sys.stderr)
        sys.exit(1)

    fmt = args.format
    if fmt == "auto":
        fmt = detect_format(args.file)
        print(f"自动检测格式：{fmt}")

    parsers = {
        "wechatmsg_txt": parse_wechatmsg_txt,
        "wechatmsg_html": parse_wechatmsg_html,
        "wechatmsg_csv": parse_wechatmsg_csv,
        "liuhen": parse_liuhen_json,
        "pywxdump": parse_pywxdump,
        "plaintext": parse_plaintext,
    }

    parse_func = parsers.get(fmt, parse_plaintext)
    result = parse_func(args.file, args.target)

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(f"# 微信聊天记录分析 — {args.target}\n\n")
        f.write(f"来源文件：{args.file}\n")
        f.write(f"检测格式：{fmt}\n")
        f.write(f"总消息数：{result.get('total_messages', 'N/A')}\n")
        f.write(f"师兄消息数：{result.get('target_messages', 'N/A')}\n\n")

        analysis = result.get("analysis", {})

        if analysis.get("note"):
            f.write("## 备注\n")
            f.write(f"- {analysis['note']}\n\n")

        if analysis.get("top_particles"):
            f.write("## 高频语气词\n")
            for word, count in analysis["top_particles"]:
                f.write(f"- {word}: {count}次\n")
            f.write("\n")

        if analysis.get("top_emojis"):
            f.write("## 高频 Emoji\n")
            for emoji, count in analysis["top_emojis"]:
                f.write(f"- {emoji}: {count}次\n")
            f.write("\n")

        if analysis.get("punctuation_habits"):
            f.write("## 标点习惯\n")
            for punct, count in analysis["punctuation_habits"].items():
                f.write(f"- {punct}: {count}次\n")
            f.write("\n")

        f.write("## 消息风格\n")
        f.write(f"- 平均消息长度：{analysis.get('avg_message_length', 'N/A')} 字\n")
        f.write(
            f"- 风格：{'短句连发型' if analysis.get('message_style') == 'short_burst' else '长段落型'}\n\n"
        )

        if result.get("sample_messages"):
            f.write("## 师兄消息样本（前50条）\n")
            for idx, msg in enumerate(result["sample_messages"], 1):
                f.write(f"{idx}. {msg}\n")
        elif result.get("raw_text"):
            f.write("## 原始文本（截取）\n\n")
            f.write(result["raw_text"][:10000])

    print(f"分析完成，结果已写入 {args.output}")


if __name__ == "__main__":
    main()
