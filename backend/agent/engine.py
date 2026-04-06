import os
import dspy
import litellm

from agent.config import get_lm, get_image_config, get_video_config
from agent.ghost import GhostChat
from agent.music import MusicAgent
from dotenv import load_dotenv

load_dotenv()


class AgentEngine:
    def __init__(self):
        lm = get_lm()
        dspy.configure(lm=lm)
        self.ghost = GhostChat()
        self.music = MusicAgent()

    # ── Chat ──────────────────────────────────────────────

    def chat(self, grave_name: str, epitaph: str, memories: list[str], message: str) -> str:
        memory_text = "\n".join(f"- {m}" for m in memories) if memories else "(no memories)"
        result = self.ghost(
            grave_name=grave_name,
            epitaph=epitaph,
            memories=memory_text,
            visitor_message=message,
        )
        return result.reply

    # ── Music (delegate to MusicAgent) ────────────────────

    def generate_music(self, *args, **kwargs) -> dict:
        return self.music.generate(*args, **kwargs)

    def query_music(self, task_id: str) -> dict:
        return self.music.query(task_id)

    # ── Image Understanding ───────────────────────────────

    def understand_image(self, image_url: str, prompt: str = "Describe this image in detail.") -> str:
        cfg = get_image_config()
        response = litellm.completion(
            model=cfg["model"],
            api_key=cfg["api_key"],
            api_base=cfg["api_base"],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
        )
        return response.choices[0].message.content

    # ── Video Generation ──────────────────────────────────

    def generate_video(self, prompt: str) -> dict:
        import requests
        cfg = get_video_config()
        url = f"{cfg['api_base']}/video_generation"
        headers = {"Authorization": f"Bearer {cfg['api_key']}", "Content-Type": "application/json"}
        payload = {"model": cfg["model"], "prompt": prompt}
        resp = requests.post(url, headers=headers, json=payload)
        return resp.json()
