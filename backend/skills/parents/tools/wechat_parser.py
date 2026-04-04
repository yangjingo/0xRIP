#!/usr/bin/env python3
"""
微信聊天记录解析器
用于提取父母对话中的关键信息
"""

import argparse
import os
import re
import json
from datetime import datetime
from pathlib import Path


def parse_wechat_export(file_path: str, target_name: str = None) -> dict:
    """解析微信聊天记录导出文件"""
    
    result = {
        "target_name": target_name,
        "messages": [],
        "statistics": {},
        "catchphrases": [],
        "emotion_patterns": {}
    }
    
    if not os.path.exists(file_path):
        print(f"文件不存在: {file_path}")
        return result
    
    # 读取文件内容
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 解析消息（根据不同格式调整）
    messages = parse_messages(content)
    result["messages"] = messages
    
    # 统计分析
    result["statistics"] = analyze_messages(messages)
    
    # 提取口头禅
    result["catchphrases"] = extract_catchphrases(messages)
    
    # 分析情感模式
    result["emotion_patterns"] = analyze_emotion(messages)
    
    return result


def parse_messages(content: str) -> list:
    """解析消息内容"""
    messages = []
    
    # 常见格式：时间 - 名字: 内容
    # 简化解析
    lines = content.split('\n')
    for line in lines:
        if not line.strip():
            continue
        
        # 尝试提取消息
        msg = parse_single_message(line)
        if msg:
            messages.append(msg)
    
    return messages


def parse_single_message(line: str) -> dict:
    """解析单条消息"""
    # 简单模式匹配
    patterns = [
        r'(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2})\s+(.*?):\s*(.*)',  # 标准格式
        r'(\d{4}/\d{2}/\d{2}\s+\d{1,2}:\d{2}:\d{2})\s+(.*?):\s*(.*)',
    ]
    
    for pattern in patterns:
        match = re.match(pattern, line)
        if match:
            time, sender, content = match.groups()
            return {
                "time": time.strip(),
                "sender": sender.strip(),
                "content": content.strip()
            }
    
    return None


def analyze_messages(messages: list) -> dict:
    """分析消息统计"""
    if not messages:
        return {}
    
    total = len(messages)
    
    # 消息长度分布
    lengths = [len(m.get("content", "")) for m in messages]
    avg_length = sum(lengths) / total if total else 0
    
    # 话题统计
    topics = {
        "food": 0,      # 吃饭
        "money": 0,     # 钱
        "work": 0,      # 工作
        "marriage": 0,  # 婚姻对象
        "health": 0,    # 健康
        "safety": 0,    # 安全
        "study": 0,     # 学习
        "call": 0,      # 打电话
    }
    
    keywords = {
        "food": ["吃了吗", "吃饭", "做的", "做饭", "菜"],
        "money": ["钱", "够花吗", "省着", "工资", "收入"],
        "work": ["工作", "上班", "公司", "事业"],
        "marriage": ["对象", "结婚", "相亲", "女朋友", "男朋友"],
        "health": ["身体", "健康", "注意点", "感冒"],
        "safety": ["安全", "小心", "注意"],
        "study": ["学习", "考试", "成绩", "学校"],
        "call": ["打电话", "语音", "接电话"],
    }
    
    for msg in messages:
        content = msg.get("content", "")
        for topic, words in keywords.items():
            if any(w in content for w in words):
                topics[topic] += 1
    
    return {
        "total": total,
        "avg_length": avg_length,
        "topics": topics
    }


def extract_catchphrases(messages: list) -> list:
    """提取口头禅"""
    catchphrases = []
    
    # 常见父母口头禅
    common_phrases = [
        "吃了吗",
        "省着点花钱",
        "又不听话了",
        "什么时候回来",
        "在外面不容易",
        "注意点身体",
        "你怎么又",
        "你看别人家孩子",
        "你怎么不",
        "好了好了",
        "知道了",
        "不用管我",
        "我很好",
        "不用担心",
    ]
    
    # 统计出现频率
    phrase_count = {p: 0 for p in common_phrases}
    
    for msg in messages:
        content = msg.get("content", "")
        for phrase in common_phrases:
            if phrase in content:
                phrase_count[phrase] += 1
    
    # 按频率排序
    for phrase, count in sorted(phrase_count.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            catchphrases.append(f"{phrase} ({count}次)")
    
    return catchphrases


def analyze_emotion(messages: list) -> dict:
    """分析情感模式"""
    patterns = {
        "concern": 0,    # 关心
        "complaint": 0,  # 抱怨
        "praise": 0,     # 表扬
        "question": 0,   # 询问
    }
    
    concern_words = ["注意点", "小心", "注意", "不要", "别"]
    complaint_words = ["怎么又", "你怎么", "让你", "说过"]
    praise_words = ["不错", "很好", "可以", "还行", "真棒"]
    question_words = ["怎么样", "为什么", "是不是", "有没有"]
    
    for msg in messages:
        content = msg.get("content", "")
        if any(w in content for w in concern_words):
            patterns["concern"] += 1
        if any(w in content for w in complaint_words):
            patterns["complaint"] += 1
        if any(w in content for w in praise_words):
            patterns["praise"] += 1
        if any(w in content for w in question_words):
            patterns["question"] += 1
    
    return patterns


def main():
    parser = argparse.ArgumentParser(description='微信聊天记录解析器')
    parser.add_argument('--file', required=True, help='聊天记录文件路径')
    parser.add_argument('--target', help='目标人物名称')
    parser.add_argument('--output', help='输出文件路径')
    
    args = parser.parse_args()
    
    result = parse_wechat_export(args.file, args.target)
    
    # 输出结果
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"结果已保存到: {args.output}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
