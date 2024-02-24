# REDIS setup
from redis import Redis
from rq import Queue
from rq.job import Job
from rq.exceptions import NoSuchJobError

from database import get_prompt_by_unicid,get_resoluton_by_ratio,get_strenght_from_name
from database import getMagickWords, getMagickTags, getMagickChars
from sd.txt2img import generateImg,upscaleSimple,upscaleComplex
from sd.img2img import generateImg2Img

from funcs import *

redis_conn = Redis()
q = Queue(connection=redis_conn,default_timeout=600)

from time import sleep  # Пример длительной операции, замените на реальную логику

import re

def replacePromtpartToLoras(data):

    allMagickWords = getMagickWords()
    allMagickTags = getMagickTags()
    allMagickChars = getMagickChars()

    findedWordsSet= set(word.strip() for word in data["extra_word"].split(","))
    findedTagsSet= set(word.strip() for word in data["extra_tags"].split(","))
    findedCharsSet= set(word.strip() for word in data["extra_chars"].split(","))

    magick_words_dict = build_lora_dict(allMagickWords)
    magick_tags_dict = build_lora_dict(allMagickTags)
    magick_chars_dict = build_lora_dict(allMagickChars)

    text = data["prompt"]

    text = replace_all_with_loras_and_weights(text, findedWordsSet, magick_words_dict)
    text = replace_with_loras_and_weights(text, findedTagsSet, magick_tags_dict)
    text = replace_all_with_loras_and_weights(text, findedCharsSet, magick_chars_dict)
    
    # print(findedWordsSet,findedTagsSet,findedCharsSet, "ahahhahahahahahah")

    return text

def upscale_img_simple(unic_id):
    
    data = get_prompt_by_unicid(unic_id)
    base64Img = upscaleSimple(data["img2img_path"])
    
    return {"unic_id": unic_id,"img":base64Img} 

def upscale_img_complex(unic_id):
    
    data = get_prompt_by_unicid(unic_id)
    aspect_ratio = get_resoluton_by_ratio(data["aspect_ratio"])
    full_resolution = aspect_ratio.split("x")
    
    print(data["sid"],"SIDDD")
    width = int(full_resolution[0]) * 2
    height = int(full_resolution[1]) * 2
    
    settings = {
        "img": data["img2img_path"],
        "width": width,
        "height": height,
    }
    
    check_and_swap_sd_model(data["sd_model"])
    
    base64Img = upscaleComplex(settings)
    
    print("Task complete")
    return {"unic_id": unic_id,"img":base64Img} 

def generate_img_processing(unic_id):
    
    data = get_prompt_by_unicid(unic_id)
    
    aspect_ratio = get_resoluton_by_ratio(data["aspect_ratio"])
    full_resolution = aspect_ratio.split("x")
    
    print(data["sid"],"SIDDD")
    width = int(full_resolution[0])
    height = int(full_resolution[1])
    
    prompt = replacePromtpartToLoras(data)
    print(prompt)
    
    settings  = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "negative_prompt": data["negative_prompt"],
        "negative_mode":  data["negative_mode"],
        "sid": int(data["sid"]),
        "variation_sid": int(data["variation_sid"]),
        "magick_pose": data["magick_pose"],
        "magick_ref": data["magick_ref"],
        "magick_shape": data["magick_shape"],
    }
    
    check_and_swap_sd_model(data["sd_model"])
    
    base64Img = generateImg(settings)
    # base64Img = None
    return {"unic_id": unic_id,"img":base64Img}  # Возвращаем результат или путь к изображению

def generate_img2img_processing(unic_id):
    
    data = get_prompt_by_unicid(unic_id)
    
    denStrValue = get_strenght_from_name(data["img_2_img_strength"])
    
    prompt = replacePromtpartToLoras(data)
    
    print(prompt)
        
    settings  = {
        "prompt": prompt,
        "negative_prompt": data["negative_prompt"],
        "negative_mode":  data["negative_mode"],
        "sid": int(data["sid"]),
        "variation_sid": int(data["variation_sid"]),
        "img": data["img_2_raw_image"],
        "denoising_strength" : denStrValue,
        "recycle": data["img_2_smart_recycle"]
    }
    
    print(settings, "SETTINGS")
    check_and_swap_sd_model(data["sd_model"])
    
    base64Img = generateImg2Img(settings)
    # base64Img = None
    return {"unic_id": unic_id,"img":base64Img}  # Возвращаем результат или путь к изображению

def check_status(job_id):
    
    try:
      job = Job.fetch(job_id, connection=redis_conn)  # Получаем объект job из RQ.
    except NoSuchJobError:
        return {"status": "cleared"}
    
    if not job:
        return {"status": "not_found"}

    # Используем get_status() для получения текущего статуса работы.
    job_status = job.get_status()
    print(job, job_status)

    if job_status == "finished":
        # Убедитесь, что результат доступен перед возвращением его.
        return {"status": "finished", "result": job.result}

    elif job_status == "failed":
        return {"status": "failed"}

    else:
        # Другие возможные статусы: queued, started, deferred и т.д.
        return {"status": job_status}
    

def delete_job(job_id):
    job = Job.fetch(job_id, connection=redis_conn)
    job.delete()
    
    print("Job deleted")
    return {"status": "deleted"}