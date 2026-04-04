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

    id = Column(String, primary_key=True, index=True) # 0xDEAD...
    name = Column(String)
    epitaph = Column(String)
    date = Column(String)
    position_x = Column(Float)
    position_y = Column(Float)
    position_z = Column(Float)
    
    video_task_id = Column(String, nullable=True)
    video_url = Column(String, nullable=True)

    # 建立与记忆的一对多关系
    memories = relationship("MemoryModel", back_populates="grave", cascade="all, delete-orphan")

class MemoryModel(Base):
    __tablename__ = "memories"

    id = Column(String, primary_key=True, index=True)
    grave_id = Column(String, ForeignKey("graves.id"))
    content = Column(Text) # 记忆的具体内容
    source_type = Column(String) # 'text', 'url', 'manual'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    grave = relationship("GraveModel", back_populates="memories")

Base.metadata.create_all(bind=engine)
