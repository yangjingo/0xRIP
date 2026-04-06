"""Integration tests — real API calls.

Run separately:
    uv run pytest tests/test_engine_integration.py -v -m integration

Requires valid API keys in .env.
"""

import pytest

from agent.config import get_music_config, get_image_config, get_video_config
from agent.engine import AgentEngine
from agent.music import MusicAgent

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def engine():
    return AgentEngine()


@pytest.fixture(scope="module")
def music_agent():
    return MusicAgent()


# ── Text Chat (DSPy + litellm) ──────────────────────────

class TestChat:
    def test_basic_reply(self, engine):
        reply = engine.chat(
            grave_name="TestGhost",
            epitaph="I am a test.",
            memories=[],
            message="Hello, who are you?",
        )
        assert isinstance(reply, str)
        assert len(reply) > 0

    def test_with_memories(self, engine):
        reply = engine.chat(
            grave_name="Satoshi",
            epitaph="The genesis block remains eternal.",
            memories=["I created Bitcoin in 2009", "I value privacy and decentralization"],
            message="What do you think about centralization?",
        )
        assert isinstance(reply, str)
        assert len(reply) > 0

    def test_chinese_response(self, engine):
        reply = engine.chat(
            grave_name="TestGhost",
            epitaph="测试用。",
            memories=[],
            message="你好，请用中文回答我。",
        )
        assert isinstance(reply, str)
        assert len(reply) > 0


# ── Image Understanding (litellm vision) ────────────────

class TestImageUnderstanding:
    def test_describe_image_url(self, engine):
        reply = engine.understand_image(
            image_url="https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg",
            prompt="What is in this image? Reply in one sentence.",
        )
        assert isinstance(reply, str)
        assert len(reply) > 0


# ── Music Generation (MusicAgent) ────────────────────────

class TestMusicAgent:
    def test_generate_with_lyrics(self, music_agent):
        result = music_agent.generate(
            lyrics="[Verse]\nDigital souls fade away\n[Chorus]\nBut memories remain",
            prompt="ambient, ethereal, minimal",
        )
        assert isinstance(result, dict)
        assert "data" in result or "trace_id" in result

    def test_generate_instrumental(self, music_agent):
        result = music_agent.generate(
            lyrics="",
            prompt="dark ambient, drone, funeral",
            instrumental=True,
        )
        assert isinstance(result, dict)

    def test_query_nonexistent(self, music_agent):
        result = music_agent.query("nonexistent-task-id")
        assert isinstance(result, dict)


# ── Video Generation (requests) ─────────────────────────

class TestVideoGeneration:
    def test_generate_video(self, engine):
        result = engine.generate_video(
            prompt="A minimalist geometric tombstone in fog, Monument Valley style",
        )
        assert isinstance(result, dict)


# ── Config validation ───────────────────────────────────

class TestConfig:
    def test_music_config(self):
        cfg = get_music_config()
        assert "model" in cfg
        assert "api_key" in cfg
        assert "music" in cfg["model"].lower()

    def test_image_config(self):
        cfg = get_image_config()
        assert "model" in cfg
        assert "api_key" in cfg

    def test_video_config(self):
        cfg = get_video_config()
        assert "model" in cfg
        assert "api_key" in cfg
        assert "video" in cfg["model"].lower()
