# server.py
import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

# Предполагаем, что models.py содержит определение модели Queue и базовый класс Base,
# если это не так - надо скорректировать путь импорта.
from database import Base, engine, SessionLocal, Queue,delete_from_queue,change_status,drop_queue
from task_processor import generate_img_processing,upscale_img_simple,upscale_img_complex,generate_img2img_processing,check_status,delete_job,q  # Ваш обработчик задач
# from .rq_config import q  # Очередь RQ

from rq import Worker
from pydantic import BaseModel

class RequestData(BaseModel):
    unicId: str
    userId: int  # Предполагаем, что ID пользователя - это число


Base.metadata.create_all(bind=engine)  # Создание всех таблиц в базе данных.

app = FastAPI()  # Создание экземпляра FastAPI приложения.
drop_queue()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/txt2img_gen/")
async def process(data: RequestData,
                  db: Session = Depends(get_db)):

    job = q.enqueue(generate_img_processing, data.unicId)
    job_id = job.get_id()  # Получение ID операции после её добавления в очередь
    
    new_queue_entry = Queue(user_id=str(data.userId), unic_id=data.unicId,job_id = job_id,status="pending")
    db.add(new_queue_entry)
    db.commit()
    
    print("Операция добавленна в очередь!")
    return {"job_id": job_id}  # Возвращаем пользователю id задачи

@app.post("/img2img_gen/")
async def process(data: RequestData,
                  db: Session = Depends(get_db)):

    job = q.enqueue(generate_img2img_processing, data.unicId)
    job_id = job.get_id()  # Получение ID операции после её добавления в очередь
    
    new_queue_entry = Queue(user_id=str(data.userId), unic_id=data.unicId,job_id = job_id,status="pending")
    db.add(new_queue_entry)
    db.commit()
    
    print("Операция добавленна в очередь!")
    return {"job_id": job_id}  # Возвращаем пользователю id задачи

@app.post("/txt2img_upscale_simple/")
async def process(data: RequestData,
                  db: Session = Depends(get_db)):

    job = q.enqueue(upscale_img_simple, data.unicId)
    job_id = job.get_id()  # Получение ID операции после её добавления в очередь
    
    new_queue_entry = Queue(user_id=str(data.userId), unic_id=data.unicId,job_id = job_id,status="pending")
    db.add(new_queue_entry)
    db.commit()
    
    print("Операция добавленна в очередь!")
    return {"job_id": job_id}  # Возвращаем пользователю id задачи

@app.post("/txt2img_upscale_complex/")
async def process(data: RequestData,
                  db: Session = Depends(get_db)):

    job = q.enqueue(upscale_img_complex, data.unicId)
    job_id = job.get_id()  # Получение ID операции после её добавления в очередь
    
    new_queue_entry = Queue(user_id=str(data.userId), unic_id=data.unicId,job_id = job_id,status="pending")
    db.add(new_queue_entry)
    db.commit()
    
    print("Операция добавленна в очередь!")
    return {"job_id": job_id}  # Возвращаем пользователю id задачи


@app.get("/check_job/{job_id}")
async def check_job(job_id: str):
    try:
        job_status = check_status(job_id)
    except:
        return {"status": "not_found"}
        
    if(job_status["status"] == "finished"):
        delete_from_queue(job_id)
        
    if(job_status["status"] == "started"):
        change_status(job_id,"started")
        
    # if(job_status["status"] == "cleared"):
    #     delete_from_queue(job_id)
    
    return job_status

@app.get("/cancel_job/{job_id}")
async def cancel_job(job_id: str):
    job_status = check_status(job_id)
    print("Jobaaaa", job_status)
    if(job_status["status"] == "queued"):
        delete_from_queue(job_id)
        delete_job(job_id)
        return {"status": "Complete"}
    else:
        return {"status": "failed"}

# Запуск сервера (этот блок должен быть в конце файла).
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8006)
