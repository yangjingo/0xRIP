"""Tests for DB models — Grave / Session / Memory hierarchy."""

import os
import tempfile

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from memory.database import Base, GraveModel, SessionModel, MemoryModel


@pytest.fixture
def db(tmp_path):
    db_path = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


# ── Grave ───────────────────────────────────────────────

class TestGrave:
    def test_create_grave(self, db):
        g = GraveModel(id="0xDEAD", name="Test", epitaph="RIP")
        db.add(g)
        db.commit()
        found = db.query(GraveModel).filter_by(id="0xDEAD").first()
        assert found.name == "Test"
        assert found.epitaph == "RIP"

    def test_grave_defaults_nullable(self, db):
        g = GraveModel(id="0xDEAD", name="T")
        db.add(g)
        db.commit()
        assert g.video_task_id is None
        assert g.video_url is None


# ── Session ─────────────────────────────────────────────

class TestSession:
    def test_create_session(self, db):
        g = GraveModel(id="0xDEAD", name="T")
        db.add(g)
        db.commit()
        s = SessionModel(id="abc123", grave_id="0xDEAD")
        db.add(s)
        db.commit()
        assert s.started_at is not None
        assert s.ended_at is None

    def test_session_belongs_to_grave(self, db):
        g = GraveModel(id="0xDEAD", name="T")
        db.add(g)
        db.commit()
        db.add(SessionModel(id="s1", grave_id="0xDEAD"))
        db.add(SessionModel(id="s2", grave_id="0xDEAD"))
        db.commit()
        assert len(g.sessions) == 2

    def test_end_session(self, db):
        g = GraveModel(id="0xDEAD", name="T")
        db.add(g); db.commit()
        s = SessionModel(id="s1", grave_id="0xDEAD")
        db.add(s); db.commit()
        s.ended_at = s.started_at
        db.commit()
        assert db.query(SessionModel).first().ended_at is not None


# ── Memory ──────────────────────────────────────────────

class TestMemory:
    def _setup(self, db):
        g = GraveModel(id="0xDEAD", name="T")
        db.add(g); db.commit()
        s = SessionModel(id="s1", grave_id="0xDEAD")
        db.add(s); db.commit()
        return g, s

    def test_create_memory(self, db):
        g, s = self._setup(db)
        m = MemoryModel(id="m1", grave_id="0xDEAD", session_id="s1",
                        content="hello", source_type="promoted")
        db.add(m); db.commit()
        assert m.created_at is not None

    def test_memory_links_to_grave_and_session(self, db):
        g, s = self._setup(db)
        db.add(MemoryModel(id="m1", grave_id="0xDEAD", session_id="s1",
                           content="x", source_type="promoted"))
        db.commit()
        assert len(g.memories) == 1
        assert len(s.memories) == 1
        assert g.memories[0].session_id == "s1"

    def test_memory_without_session(self, db):
        g = GraveModel(id="0xDEAD", name="T")
        db.add(g); db.commit()
        m = MemoryModel(id="m1", grave_id="0xDEAD", session_id=None,
                        content="manual", source_type="manual")
        db.add(m); db.commit()
        assert m.session is None
        assert len(g.memories) == 1

    def test_cascade_delete_grave(self, db):
        g, s = self._setup(db)
        db.add(MemoryModel(id="m1", grave_id="0xDEAD", session_id="s1",
                           content="x", source_type="promoted"))
        db.commit()
        db.delete(g)
        db.commit()
        assert db.query(SessionModel).count() == 0
        assert db.query(MemoryModel).count() == 0

    def test_cascade_delete_session(self, db):
        g, s = self._setup(db)
        db.add(MemoryModel(id="m1", grave_id="0xDEAD", session_id="s1",
                           content="x", source_type="promoted"))
        db.commit()
        db.delete(s)
        db.commit()
        assert db.query(MemoryModel).count() == 0
        assert db.query(GraveModel).count() == 1  # grave survives


# ── Integration: store + DB ────────────────────────────

class TestStoreDbIntegration:
    """Test the full promote flow: .rip/ → DB."""

    def test_promote_then_insert_db(self, db, monkeypatch, tmp_path):
        # Setup temp .rip dir
        from memory.store import add_memory, promote_session, read_session_memories
        rip = tmp_path / ".rip"
        rip.mkdir()
        monkeypatch.setenv("RIP_DIR", str(rip))
        import memory.store as store
        monkeypatch.setattr(store, "RIP_DIR", rip)

        # Create grave + session in DB
        g = GraveModel(id="0xDEAD", name="T")
        db.add(g); db.commit()
        s = SessionModel(id="s1", grave_id="0xDEAD")
        db.add(s); db.commit()

        # Write short-term memories
        m1 = add_memory("0xDEAD", "s1", "memory one")
        m2 = add_memory("0xDEAD", "s1", "memory two")
        assert len(read_session_memories("0xDEAD", "s1")) == 2

        # Promote to DB
        items = promote_session("0xDEAD", "s1")
        assert len(items) == 2

        for item in items:
            mem = MemoryModel(
                id=item["id"],
                grave_id="0xDEAD",
                session_id="s1",
                content=item["content"],
                source_type="promoted",
            )
            db.add(mem)
        s.ended_at = s.started_at
        db.commit()

        # Verify DB state
        assert db.query(MemoryModel).filter_by(grave_id="0xDEAD").count() == 2
        assert db.query(SessionModel).filter_by(id="s1").first().ended_at is not None

        # Short-term should be empty
        assert read_session_memories("0xDEAD", "s1") == []
