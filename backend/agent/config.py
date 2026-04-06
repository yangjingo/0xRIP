import os
import dspy
from dotenv import load_dotenv

load_dotenv()


def _env(prefix: str, suffix: str, fallback: str = "") -> str:
    return os.getenv(f"{prefix}_{suffix}", fallback)


def get_lm() -> dspy.LM:
    return dspy.LM(
        model=_env("TEXT", "MODEL"),
        api_key=_env("TEXT", "API_KEY"),
        api_base=_env("TEXT", "API_BASE"),
        temperature=1.0,
        max_tokens=65536,
    )


def get_music_config() -> dict:
    return {
        "model": _env("MUSIC", "MODEL"),
        "api_key": _env("MUSIC", "API_KEY"),
        "api_base": _env("MUSIC", "API_BASE"),
    }


def get_image_config() -> dict:
    return {
        "model": _env("IMAGE", "MODEL"),
        "api_key": _env("IMAGE", "API_KEY"),
        "api_base": _env("IMAGE", "API_BASE"),
    }


def get_video_config() -> dict:
    return {
        "model": _env("VIDEO", "MODEL"),
        "api_key": _env("VIDEO", "API_KEY"),
        "api_base": _env("VIDEO", "API_BASE"),
    }
