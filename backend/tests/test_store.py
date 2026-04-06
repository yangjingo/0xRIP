"""Tests for .rip/ local filesystem store — isolated with temp dirs."""

import os
import tempfile
import shutil
from pathlib import Path

import pytest

# Point store to a temp .rip dir instead of project root
@pytest.fixture(autouse=True)
def temp_rip_dir(monkeypatch, tmp_path):
    rip = tmp_path / ".rip"
    rip.mkdir()
    monkeypatch.setenv("RIP_DIR", str(rip))
    # Force re-import so RIP_DIR picks up the new env var
    import memory.store as store
    monkeypatch.setattr(store, "RIP_DIR", rip)
    yield rip


from memory.store import (
    new_session_id, new_memory_id,
    read_rip_md, read_profile, write_profile,
    read_session, write_session, close_session, list_sessions,
    add_memory, read_session_memories, read_grave_short_term,
    promote_session, promote_all,
)


# ── ID generation ───────────────────────────────────────

class TestIdGeneration:
    def test_session_id_is_uuid_hex(self):
        sid = new_session_id()
        assert len(sid) == 32
        assert sid != new_session_id()  # unique

    def test_memory_id_is_uuid_hex(self):
        mid = new_memory_id()
        assert len(mid) == 32
        assert mid != new_memory_id()


# ── Global RIP.md ───────────────────────────────────────

class TestRipMd:
    def test_read_empty(self, temp_rip_dir):
        assert read_rip_md() == ""

    def test_read_after_write(self, temp_rip_dir):
        (temp_rip_dir / "RIP.md").write_text("# 0xRIP\nBe spooky.", encoding="utf-8")
        assert "Be spooky" in read_rip_md()


# ── Profile ─────────────────────────────────────────────

class TestProfile:
    def test_read_missing(self):
        assert read_profile("0xNOPE") == ""

    def test_write_and_read(self):
        write_profile("0xDEAD", "# Test\nSome content")
        result = read_profile("0xDEAD")
        assert "# Test" in result
        assert "Some content" in result

    def test_overwrite(self):
        write_profile("0xDEAD", "v1")
        write_profile("0xDEAD", "v2")
        assert read_profile("0xDEAD") == "v2"


# ── Session ─────────────────────────────────────────────

class TestSession:
    def test_read_missing(self):
        assert read_session("0xDEAD", "noexist") == ""

    def test_write_and_read(self):
        write_session("0xDEAD", "sess1", "context here")
        assert read_session("0xDEAD", "sess1") == "context here"

    def test_close_appends_timestamp(self):
        write_session("0xDEAD", "s1", "hello")
        close_session("0xDEAD", "s1")
        content = read_session("0xDEAD", "s1")
        assert "hello" in content
        assert "session closed" in content

    def test_list_sessions(self):
        assert list_sessions("0xDEAD") == []
        write_session("0xDEAD", "aaa", "")
        write_session("0xDEAD", "bbb", "")
        sessions = list_sessions("0xDEAD")
        assert "aaa" in sessions
        assert "bbb" in sessions

    def test_list_sessions_empty_grave(self):
        assert list_sessions("0xNOPE") == []


# ── Short-term memories ─────────────────────────────────

class TestShortTermMemory:
    def test_add_returns_uuid(self):
        mid = add_memory("0xDEAD", "sess1", "hello")
        assert len(mid) == 32

    def test_read_session_memories(self):
        m1 = add_memory("0xDEAD", "s1", "first")
        m2 = add_memory("0xDEAD", "s1", "second")
        mems = read_session_memories("0xDEAD", "s1")
        assert len(mems) == 2
        ids = {m["id"] for m in mems}
        assert {m1, m2} == ids
        contents = {m["content"] for m in mems}
        assert contents == {"first", "second"}

    def test_read_session_memories_isolated(self):
        add_memory("0xDEAD", "s1", "in s1")
        add_memory("0xDEAD", "s2", "in s2")
        assert len(read_session_memories("0xDEAD", "s1")) == 1
        assert len(read_session_memories("0xDEAD", "s2")) == 1

    def test_read_empty_session(self):
        assert read_session_memories("0xDEAD", "noexist") == []

    def test_read_grave_short_term_across_sessions(self):
        add_memory("0xDEAD", "s1", "memory A")
        add_memory("0xDEAD", "s2", "memory B")
        text = read_grave_short_term("0xDEAD")
        assert "memory A" in text
        assert "memory B" in text
        assert "[session s1]" in text
        assert "[session s2]" in text

    def test_read_grave_short_term_empty(self):
        assert read_grave_short_term("0xDEAD") == ""


# ── Promote ─────────────────────────────────────────────

class TestPromote:
    def test_promote_session_returns_items(self):
        m1 = add_memory("0xDEAD", "s1", "keep this")
        m2 = add_memory("0xDEAD", "s1", "and this")
        items = promote_session("0xDEAD", "s1")
        assert len(items) == 2
        contents = {i["content"] for i in items}
        assert contents == {"keep this", "and this"}
        # Short-term should be empty now
        assert read_session_memories("0xDEAD", "s1") == []

    def test_promote_session_closes_session(self):
        add_memory("0xDEAD", "s1", "x")
        promote_session("0xDEAD", "s1")
        content = read_session("0xDEAD", "s1")
        assert "session closed" in content

    def test_promote_session_preserves_ids(self):
        m1 = add_memory("0xDEAD", "s1", "x")
        items = promote_session("0xDEAD", "s1")
        assert items[0]["id"] == m1

    def test_promote_empty_session(self):
        write_session("0xDEAD", "s1", "no memories")
        items = promote_session("0xDEAD", "s1")
        assert items == []

    def test_promote_all_sessions(self):
        add_memory("0xDEAD", "s1", "from s1")
        add_memory("0xDEAD", "s2", "from s2")
        items = promote_all("0xDEAD")
        assert len(items) == 2
        contents = {i["content"] for i in items}
        assert contents == {"from s1", "from s2"}
        # Both sessions closed
        assert "session closed" in read_session("0xDEAD", "s1")
        assert "session closed" in read_session("0xDEAD", "s2")

    def test_promote_all_empty_grave(self):
        assert promote_all("0xDEAD") == []
