# database.py
from sqlalchemy import create_engine, Column, Integer, String,Boolean,Text, Float,DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import datetime

DATABASE_URL = "postgresql://postgres:123123@localhost/postgres"

Base = declarative_base()

class Queue(Base):
    __tablename__ = 'queue'
    __table_args__ = {'schema': 'prompt'}
    
    id = Column(Integer, primary_key=True)
    job_id = Column(String)
    user_id = Column(String)
    unic_id = Column(String)
    status = Column(String)

# Создаем движок базы данных.
engine = create_engine(DATABASE_URL)

# Создаем все таблицы на основании моделей.
Base.metadata.create_all(engine)

# Создаем фабрику сессий.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Change status
def change_status(job_id, status):
    with SessionLocal() as session:
        entry = session.query(Queue).filter_by(job_id=job_id).one()
        entry.status = status
        session.commit()
        return entry.status

def get_user_in_queue(user_id):
    with SessionLocal() as session:
        return session.query(Queue).filter_by(user_id=user_id).first()

def delete_from_queue(job_id):
    with SessionLocal() as session:
        entry_to_delete = session.query(Queue).filter_by(job_id=job_id).one()
        session.delete(entry_to_delete)
        session.commit()

def add_to_queue(user_id, unique_id,job_id,status):
    with SessionLocal() as session:
        new_entry = Queue(user_id=user_id, unic_id=unique_id, job_id=job_id, status=status)
        session.add(new_entry)
        session.commit()
def drop_queue():
    with SessionLocal() as session:
        session.query(Queue).delete()
        session.commit()
        print("Queue dropped")
        return True

class CreatedPrompt(Base):
    __tablename__ = 'createdprompts'
    __table_args__ = {'schema': 'prompt'}
    unic_id = Column(String, primary_key=True)
    edit_id = Column(String, default='')
    subsid_id = Column(String, default='')
    model_name = Column(String, default='')
    enable_alter_model = Column(Boolean, default=False)
    model_page = Column(Integer, default=0)
    preset_name = Column(String, default='')
    sd_model = Column(String, default='')
    sid = Column(Integer, default=0)
    variation_sid = Column(Integer, default=0)
    type = Column(String, default='defaultType')
    negative_mode = Column(String, default='simple')
    negative_prompt = Column(Text(), default='')
    prompt = Column(Text(), default='')  # Использовал prompt_text вместо prompt для избежания конфликта имен
    magick_ref = Column(Text(), default='')
    magick_shape = Column(Text(), default='')
    magick_pose = Column(Text(), default='')
    aspect_ratio=Column(Text(),default='')
    generation_type=Column(Text(),default='')
    extra_chars = Column(Text(), default='')
    extra_char_outfit = Column(Text(), default='')
    extra_tags = Column(Text(), default='')
    extra_word = Column(Text(), default='')
    img2img_path = Column(Text(), default='')
    img_2_img_strength=Column(Text(),default='')
    img_2_imgstrength_value=Column(Float,default=0)
    img_2_raw_image=Column(Text(),default='')
    img_2_smart_recycle=Column(Boolean,default=False)
    creator_id=Column(Integer)
    show_time_stamp=Column(Integer,default=0)
    is_generated=Column(Integer,default=0)
    created_at=Column(DateTime(timezone=True),default=datetime.datetime.utcnow)  # Убедись что импортирован datetime

# EXTRA TABLES

class MagickWords(Base):
    __tablename__ = 'magickwords'
    __table_args__ = {'schema': 'settings'}
    base = Column(String, primary_key=True)
    prompt_query = Column(String)
    lora = Column(String)
    lora_neg = Column(String, default='')

class MagickTags(Base):
    __tablename__ = 'magicktags'
    __table_args__ = {'schema': 'settings'}
    base = Column(String, primary_key=True)
    lora = Column(String)
    
class MagickChars(Base):
    __tablename__ = 'magickchars'
    __table_args__ = {'schema': 'settings'}
    name = Column(String, primary_key=True)
    prompt_query = Column(String)
    extra = Column(String, default='')
    lora = Column(String)
    
class MagickCharsExtra(Base):
    __tablename__ = 'magickchars_extra'
    __table_args__ = {'schema': 'settings'}
    char = Column(String, primary_key=True)
    costume = Column(String)
    prompt = Column(String)

# Aspect RATIO
class Aspect_Ratio(Base):
    __tablename__ = 'aspectratio'
    __table_args__ = {'schema': 'settings'}
    ratio = Column(String,primary_key=True)
    resolution = Column(String)
    type = Column(String)
    img_link = Column(String)

# CREATE TABLE IF NOT EXISTS settings.strenghtSetting(id SERIAL PRIMARY KEY,name Text,strenght FLOAT8,img_link Text,description Text);
class strenghtSetting(Base):
    __tablename__ = 'strenghtsetting'
    __table_args__ = {'schema': 'settings'}
    id = Column(Integer, primary_key=True)
    name = Column(String)
    strenght = Column(Float)
    img_link = Column(String)
    description = Column(String)

from sqlalchemy.orm import Session
from sqlalchemy.inspection import inspect

def get_prompt_by_unicid(unic_id):
    with SessionLocal() as session:
        data = session.query(CreatedPrompt).filter_by(unic_id=unic_id).first()
        if data is not None:
            return {c.key: getattr(data, c.key) for c in inspect(data).mapper.column_attrs}
        return None  # Если запись не найдена, вернуть None


def update_prompt_parameter(unic_id, parameter_name, parameter_value):
    with SessionLocal() as session:
        prompt_to_update = session.query(CreatedPrompt).filter_by(unic_id=unic_id).first()
        if prompt_to_update is not None:
            setattr(prompt_to_update, parameter_name, parameter_value)
            session.commit()
            
# Settings
def get_resoluton_by_ratio(ratio):
    with SessionLocal() as session:
        data = session.query(Aspect_Ratio).filter_by(ratio=ratio).first()
        if data is not None:
            return data.resolution
        return None  # Если запись не найдена, вернуть None
    
def get_strenght_from_name(name):
    with SessionLocal() as session:
        data = session.query(strenghtSetting).filter_by(name=name).first()
        if data is not None:
            return data.strenght
        return None  # Если запись не найдена, вернуть None
    
# Get all data 
def getMagickWords():
    with SessionLocal() as session:
        return session.query(MagickWords).all()
    
def getMagickTags():
    with SessionLocal() as session:
        return session.query(MagickTags).all()

def getMagickChars():
    with SessionLocal() as session:
        return session.query(MagickChars).all()
    
def getMagickCharsExtra():
    with SessionLocal() as session:
        return session.query(MagickCharsExtra).all()