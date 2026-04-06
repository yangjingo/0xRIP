from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import datetime

from memory import (
    SessionLocal, GraveModel, SessionModel, MemoryModel, engine, Base,
    read_rip_md, read_profile, write_profile,
    read_session, write_session, close_session, list_sessions,
    add_memory, read_grave_short_term,
    promote_session, promote_all,
    new_session_id, new_memory_id,
)
from agent import AgentEngine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="0xRIP Backend", version="0.1.5")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

agent = AgentEngine()


# ── Helpers ─────────────────────────────────────────────

def _collect_memories(grave_id: str, db) -> str:
    """Merge short-term (.rip/) and long-term (DB) memories."""
    parts = []

    short = read_grave_short_term(grave_id)
    if short:
        parts.append(f"[短期记忆]\n{short}")

    long_term = db.query(MemoryModel).filter(MemoryModel.grave_id == grave_id).all()
    if long_term:
        parts.append("[长期记忆]\n" + "\n".join(f"- {m.content}" for m in long_term))

    return "\n\n".join(parts)


# ── Routes ──────────────────────────────────────────────

@app.get("/api/graves")
async def get_graves(db: Session = Depends(get_db)):
    graves = db.query(GraveModel).all()
    if not graves:
        satoshi = GraveModel(
            id="0xDEADBEEF", name="Satoshi",
            epitaph="The genesis block remains eternal.",
            date="2009-01-03", position_x=0, position_y=5, position_z=0,
        )
        db.add(satoshi)
        db.commit()
        write_profile("0xDEADBEEF", f"# Satoshi\n\n{satoshi.epitaph}")
        graves = [satoshi]
    return graves


@app.post("/api/summon/{grave_id}/session")
async def create_session(grave_id: str, db: Session = Depends(get_db)):
    """Start a new conversation session with a grave."""
    grave = db.query(GraveModel).filter(GraveModel.id == grave_id).first()
    if not grave: raise HTTPException(status_code=404, detail="Soul not found.")

    session_id = new_session_id()
    session = SessionModel(id=session_id, grave_id=grave_id)
    db.add(session)
    db.commit()
    return {"session_id": session_id, "grave_id": grave_id}


@app.post("/api/summon/{grave_id}/chat")
async def summon_chat(grave_id: str, payload: dict = Body(...), db: Session = Depends(get_db)):
    message = payload.get("message", "")
    session_id = payload.get("session_id")

    grave = db.query(GraveModel).filter(GraveModel.id == grave_id).first()
    if not grave: raise HTTPException(status_code=404, detail="Soul not found.")

    # Auto-create session if none provided
    if not session_id:
        session_id = new_session_id()
        session = SessionModel(id=session_id, grave_id=grave_id)
        db.add(session)
        db.commit()

    memories_text = _collect_memories(grave_id, db)

    try:
        reply = agent.chat(
            grave_name=grave.name,
            epitaph=grave.epitaph,
            memories=memories_text,
            message=message,
        )

        # Short-term memory: this exchange, scoped to session
        add_memory(grave_id, session_id, f"Visitor: {message}\nGhost: {reply}")

        return {"reply": reply, "role": "ghost", "session_id": session_id}
    except Exception as e:
        return {"reply": f"...... (灵魂干扰: {e}) ......", "role": "system", "session_id": session_id}


@app.post("/api/summon/{grave_id}/requiem")
async def generate_requiem(grave_id: str, db: Session = Depends(get_db)):
    grave = db.query(GraveModel).filter(GraveModel.id == grave_id).first()
    if not grave: raise HTTPException(status_code=404, detail="Soul not found.")

    lyrics = f"[Intro]\nIn the void of 0xRIP...\n[Verse]\n{grave.name} remains, {grave.epitaph}.\n[Chorus]\nData souls never die, they just fade away."
    result = agent.generate_music(lyrics)
    return result


@app.post("/api/summon/{grave_id}/promote")
async def promote_memories(grave_id: str, payload: dict = Body(...), db: Session = Depends(get_db)):
    """Promote short-term memories to long-term (DB)."""
    grave = db.query(GraveModel).filter(GraveModel.id == grave_id).first()
    if not grave: raise HTTPException(status_code=404, detail="Soul not found.")

    session_id = payload.get("session_id")

    if session_id:
        # Promote a specific session
        items = promote_session(grave_id, session_id)
        # Mark session as ended in DB
        sess = db.query(SessionModel).filter(
            SessionModel.id == session_id,
            SessionModel.grave_id == grave_id,
        ).first()
        if sess:
            sess.ended_at = datetime.datetime.utcnow()
    else:
        # Promote all sessions
        items = promote_all(grave_id)
        for sess in db.query(SessionModel).filter(
            SessionModel.grave_id == grave_id,
            SessionModel.ended_at.is_(None),
        ).all():
            sess.ended_at = datetime.datetime.utcnow()

    saved = []
    for item in items:
        mem = MemoryModel(
            id=item["id"],
            grave_id=grave_id,
            session_id=session_id,
            content=item["content"],
            source_type="promoted",
        )
        db.add(mem)
        saved.append(mem.id)
    db.commit()
    return {"promoted": len(saved), "memory_ids": saved}


@app.get("/api/summon/{grave_id}/sessions")
async def get_sessions(grave_id: str, db: Session = Depends(get_db)):
    """List all sessions for a grave."""
    sessions = db.query(SessionModel).filter(SessionModel.grave_id == grave_id).all()
    return [
        {
            "id": s.id,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "memory_count": len(s.memories),
        }
        for s in sessions
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
