"""MiniMax Music Agent — 音乐生成与查询。

MiniMax 音乐 API 不是标准 OpenAI chat 接口，
需要直接 HTTP 调用 /v1/music_generation。
"""

import requests

from agent.config import get_music_config


class MusicAgent:
    def __init__(self):
        self._cfg = get_music_config()

    def generate(self, lyrics: str, prompt: str = "ambient, ethereal, cyber graveyard",
                 instrumental: bool = False) -> dict:
        url = f"{self._cfg['api_base']}/music_generation"
        headers = {"Authorization": f"Bearer {self._cfg['api_key']}", "Content-Type": "application/json"}
        payload = {
            "model": self._cfg["model"],
            "prompt": prompt,
            "lyrics": lyrics,
            "output_format": "url",
            "is_instrumental": instrumental,
            "audio_setting": {
                "sample_rate": 44100,
                "bitrate": 256000,
                "format": "mp3",
            },
        }
        resp = requests.post(url, headers=headers, json=payload)
        return resp.json()

    def query(self, task_id: str) -> dict:
        url = f"{self._cfg['api_base']}/query/music_generation?task_id={task_id}"
        headers = {"Authorization": f"Bearer {self._cfg['api_key']}"}
        resp = requests.get(url, headers=headers)
        try:
            return resp.json()
        except requests.exceptions.JSONDecodeError:
            return {"status_code": resp.status_code, "error": resp.text}
