# worker.py
from rq import Worker, Queue
from redis import Redis

def start_worker():
    # Установите соединение с Redis.
    redis_conn = Redis()

    # Создайте очередь на основе этого соединения.
    q = Queue(connection=redis_conn)

    from rq_win import WindowsWorker as WinWorker

    worker = WinWorker([q], connection=redis_conn)
    worker.work()

if __name__ == '__main__':
    start_worker()
