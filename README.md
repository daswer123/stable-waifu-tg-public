# Инструкция для установки будет позже, возможности данной копии вы можете посмотреть [тут](https://boosty.to/daswerr/posts/8f37fa24-14ef-4fdb-804d-d0840bbc1fb1)

# Demo ( более качественно можно посмотерть [тут](https://boosty.to/daswerr/posts/8f37fa24-14ef-4fdb-804d-d0840bbc1fb1))

https://github.com/daswer123/stable-waifu-tg-public/assets/22278673/48bc3b53-9d10-4bcb-b2c5-80268c757298

# Стек

## Нейросети
1) Stable diffusion
2) Lora ( различные лоры на персонажей, различные эффекты и тд )
3) Negative embeding ( Различные негативные аниме эмбединги )
4) LLM ~( 3B - phi 2.6 ) или ChatGPT 3.5~ Openchat 3.5-1210 с кастомной лорой
5) ControlNet ( на позу и ip-adapter и qr-monster )
6) WD-Tagger [model](https://huggingface.co/SmilingWolf/wd-v1-4-moat-tagger-v2/discussions) , собственный api сервер

## Frontend
8) Telegraf - основной фрейморк
   
## DB
9) ~better-sqlite3 - Основная БД~ Postgresql 16 - основная бд
10) Redis ( бд для кратковременного хранения запросов )
    
## Server
11) ~express - простой сервер для обслуживания очереди~ FastAPI - основной бекенд
12) ~Celery~ RQ - работа с очередями
