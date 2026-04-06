from sqlalchemy import Column, String, Float, JSON, DateTime, ForeignKey, create_engine, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./0xrip.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class GraveModel(Base):
    __tablename__ = "graves"

    id = Column(String, primary_key=True, index=True)  # 0x...
    name = Column(String)
    epitaph = Column(String)
    date = Column(String)
    position_x = Column(Float)
    position_y = Column(Float)
    position_z = Column(Float)

    video_task_id = Column(String, nullable=True)
    video_url = Column(String, nullable=True)

    sessions = relationship("SessionModel", back_populates="grave", cascade="all, delete-orphan")
    memories = relationship("MemoryModel", back_populates="grave", cascade="all, delete-orphan")


class SessionModel(Base):
    """一次访客与幽灵的完整对话会话。"""

    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)          # uuid4 hex
    grave_id = Column(String, ForeignKey("graves.id"))
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)                  # 会话结束时写入

    grave = relationship("GraveModel", back_populates="sessions")
    memories = relationship("MemoryModel", back_populates="session", cascade="all, delete-orphan")


class MemoryModel(Base):
    """
    长期记忆。从 .rip/ 短期记忆 promote 而来。
    通过 session_id 关联到产生它的会话。
    """

    __tablename__ = "memories"

    id = Column(String, primary_key=True, index=True)          # uuid4 hex
    grave_id = Column(String, ForeignKey("graves.id"))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=True)
    content = Column(Text)
    source_type = Column(String)  # 'promoted' | 'manual' | 'image'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    grave = relationship("GraveModel", back_populates="memories")
    session = relationship("SessionModel", back_populates="memories")


Base.metadata.create_all(bind=engine)
