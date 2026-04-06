"""
0xRIP local memory store — .rip/ filesystem.

Hierarchy:  grave 1──* session 1──* memory (short-term, local md)
                               └──* memory (long-term, DB)

.rip/
  RIP.md                              # Global instructions for all graves
  <grave_id>/                         # 墓碑
    profile.md                        # Grave identity / persona
    MEMORY.md                         # 长期记忆索引 (promoted summaries)
    sessions/
      <session_uuid>/                 # 一次对话会话
        session.md                    # Session summary / context
        memories/
          <memory_uuid>.md            # 该会话的短期记忆
"""

import os
import uuid
from pathlib import Path
from datetime import datetime

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RIP_DIR = Path(os.getenv("RIP_DIR", str(_PROJECT_ROOT / ".rip")))


# ── Path helpers ─────────────────────────────────────────

def _grave_dir(grave_id: str) -> Path:
    d = RIP_DIR / grave_id
    d.mkdir(parents=True, exist_ok=True)
    (d / "sessions").mkdir(exist_ok=True)
    return d


def _session_dir(grave_id: str, session_id: str) -> Path:
    d = _grave_dir(grave_id) / "sessions" / session_id
    d.mkdir(parents=True, exist_ok=True)
    (d / "memories").mkdir(exist_ok=True)
    return d


def new_session_id() -> str:
    return uuid.uuid4().hex


def new_memory_id() -> str:
    return uuid.uuid4().hex


# ── Global ──────────────────────────────────────────────

def read_rip_md() -> str:
    p = RIP_DIR / "RIP.md"
    return p.read_text(encoding="utf-8") if p.exists() else ""


# ── Profile ─────────────────────────────────────────────

def read_profile(grave_id: str) -> str:
    p = _grave_dir(grave_id) / "profile.md"
    return p.read_text(encoding="utf-8") if p.exists() else ""


def write_profile(grave_id: str, content: str) -> None:
    p = _grave_dir(grave_id) / "profile.md"
    p.write_text(content, encoding="utf-8")


# ── Session ─────────────────────────────────────────────

def read_session(grave_id: str, session_id: str) -> str:
    p = _session_dir(grave_id, session_id) / "session.md"
    return p.read_text(encoding="utf-8") if p.exists() else ""


def write_session(grave_id: str, session_id: str, content: str) -> None:
    p = _session_dir(grave_id, session_id) / "session.md"
    p.write_text(content, encoding="utf-8")


def close_session(grave_id: str, session_id: str) -> None:
    """Append a closing timestamp to session.md."""
    p = _session_dir(grave_id, session_id) / "session.md"
    existing = p.read_text(encoding="utf-8") if p.exists() else ""
    p.write_text(f"{existing}\n\n--- session closed {datetime.now().isoformat()} ---\n", encoding="utf-8")


def list_sessions(grave_id: str) -> list[str]:
    """List all session UUIDs for a grave."""
    sess_dir = _grave_dir(grave_id) / "sessions"
    if not sess_dir.exists():
        return []
    return [d.name for d in sorted(sess_dir.iterdir()) if d.is_dir()]


# ── Short-term memories (per session) ───────────────────

def add_memory(grave_id: str, session_id: str, content: str) -> str:
    """
    Add a short-term memory to a session.
    Returns the memory UUID.
    """
    mem_id = new_memory_id()
    p = _session_dir(grave_id, session_id) / "memories" / f"{mem_id}.md"
    p.write_text(content, encoding="utf-8")
    return mem_id


def read_session_memories(grave_id: str, session_id: str) -> list[dict]:
    """
    Read all short-term memories in a session.
    Returns [{"id": ..., "content": ...}, ...]
    """
    mem_dir = _session_dir(grave_id, session_id) / "memories"
    if not mem_dir.exists():
        return []
    result = []
    for f in sorted(mem_dir.glob("*.md")):
        result.append({
            "id": f.stem,
            "content": f.read_text(encoding="utf-8"),
        })
    return result


def read_grave_short_term(grave_id: str) -> str:
    """Read ALL short-term memories across all sessions for a grave."""
    sess_dir = _grave_dir(grave_id) / "sessions"
    if not sess_dir.exists():
        return ""
    parts = []
    for sess in sorted(sess_dir.iterdir()):
        if not sess.is_dir():
            continue
        mem_dir = sess / "memories"
        if not mem_dir.exists():
            continue
        files = sorted(mem_dir.glob("*.md"))
        if not files:
            continue
        session_content = "\n".join(f.read_text(encoding="utf-8") for f in files)
        parts.append(f"[session {sess.name}]\n{session_content}")
    return "\n\n".join(parts)


def promote_session(grave_id: str, session_id: str) -> list[str]:
    """
    Promote one session's short-term memories.
    Returns [{"id": memory_uuid, "content": ...}, ...]
    Caller is responsible for DB insert.
    """
    mem_dir = _session_dir(grave_id, session_id) / "memories"
    if not mem_dir.exists():
        return []
    files = sorted(mem_dir.glob("*.md"))
    result = []
    for f in files:
        result.append({
            "id": f.stem,
            "content": f.read_text(encoding="utf-8"),
        })
        f.unlink()
    close_session(grave_id, session_id)
    return result


def promote_all(grave_id: str) -> list[dict]:
    """Promote ALL sessions' short-term memories for a grave."""
    sess_dir = _grave_dir(grave_id) / "sessions"
    if not sess_dir.exists():
        return []
    all_memories = []
    for sess in sorted(sess_dir.iterdir()):
        if not sess.is_dir():
            continue
        mem_dir = sess / "memories"
        if not mem_dir.exists():
            continue
        for f in sorted(mem_dir.glob("*.md")):
            all_memories.append({
                "id": f.stem,
                "content": f.read_text(encoding="utf-8"),
            })
            f.unlink()
        close_session(grave_id, sess.name)
    return all_memories
