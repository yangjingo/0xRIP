from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import datetime

from database import SessionLocal, GraveModel, MemoryModel, engine, Base
from minimax_client import MiniMaxClient

# 初始化数据库
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

minimax = MiniMaxClient()

@app.get("/api/graves")
async def get_graves(db: Session = Depends(get_db)):
    graves = db.query(GraveModel).all()
    if not graves:
        satoshi = GraveModel(
            id="0xDEADBEEF", name="Satoshi", 
            epitaph="The genesis block remains eternal.",
            date="2009-01-03", position_x=0, position_y=5, position_z=0,
            memories=[]
        )
        db.add(satoshi)
        db.commit()
        graves = [satoshi]
    return graves

@app.post("/api/summon/{grave_id}/chat")
async def summon_chat(grave_id: str, payload: dict = Body(...), db: Session = Depends(get_db)):
    message = payload.get("message", "")
    grave = db.query(GraveModel).filter(GraveModel.id == grave_id).first()
    if not grave: raise HTTPException(status_code=404, detail="Soul not found.")

    memories = db.query(MemoryModel).filter(MemoryModel.grave_id == grave_id).all()
    memory_context = "\n".join([f"- {m.content}" for m in memories])
    
    system_prompt = f"你是一个名为 {grave.name} 的数据幽灵。墓志铭: {grave.epitaph}。记忆: {memory_context}。语气空灵、赛博哀伤。"
    messages = [{"role": "user", "name": "Visitor", "content": message}]
    
    # 使用确认可用的模型
    result = minimax.summon_ghost(messages, system_prompt, model="MiniMax-M2.7")
    
    try:
        if "choices" in result:
            reply = result['choices'][0]['message']['content']
            return {"reply": reply, "role": "ghost"}
        return {"reply": f"...... (连接不稳: {result.get('base_resp', {}).get('status_msg')}) ......", "role": "system"}
    except:
        return {"reply": "...... (灵魂干扰) ......", "role": "system"}

@app.post("/api/summon/{grave_id}/requiem")
async def generate_requiem(grave_id: str, db: Session = Depends(get_db)):
    grave = db.query(GraveModel).filter(GraveModel.id == grave_id).first()
    if not grave: raise HTTPException(status_code=404, detail="Soul not found.")
    
    lyrics = f"[Intro]\nIn the void of 0xRIP...\n[Verse]\n{grave.name} remains, {grave.epitaph}.\n[Chorus]\nData souls never die, they just fade away."
    result = minimax.generate_music(lyrics)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
