import os
import requests
import json
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class MiniMaxClient:
    def __init__(self):
        self.api_key = os.getenv("MINIMAX_API_KEY")
        self.base_url = "https://api.minimaxi.com/v1"

    def summon_ghost(self, 
                    messages: List[Dict], 
                    system_prompt: str,
                    model: str = "M2-her"):
        """
        文本对话 V2 (M2-her)
        """
        url = f"{self.base_url}/text/chatcompletion_v2"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # 严格按照 docs/api/text.md 规范构造消息
        full_messages = [
            {
                "role": "system",
                "name": "0xRIP System",
                "content": system_prompt
            }
        ] + messages

        payload = {
            "model": model,
            "messages": full_messages,
            "temperature": 1.0,
            "top_p": 0.95
        }

        response = requests.post(url, headers=headers, json=payload)
        return response.json()

    def generate_music(self, lyrics: str, prompt: str = "ambient, ethereal, cyber graveyard"):
        """
        音乐生成 (Music-2.5+)
        根据 docs/api/music.md 规范实现
        """
        url = f"{self.base_url}/music_generation"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "music-2.5+",
            "prompt": prompt,
            "lyrics": lyrics,
            "output_format": "url", # 方便前端直接播放
            "audio_setting": {
                "sample_rate": 44100,
                "bitrate": 256000,
                "format": "mp3"
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        return response.json()

    def query_music(self, task_id: str):
        """
        查询音乐生成进度
        """
        url = f"{self.base_url}/query/music_generation?task_id={task_id}"
        headers = { "Authorization": f"Bearer {self.api_key}" }
        response = requests.get(url, headers=headers)
        return response.json()

    # 视频生成 (参考 docs/api/video.md，虽然目前是 0 字节，但我们保留基础逻辑)
    def generate_video(self, prompt: str):
        url = f"{self.base_url}/video_generation"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "video-01",
            "prompt": prompt
        }
        response = requests.post(url, headers=headers, json=payload)
        return response.json()
