from sd.funcs import (
    getImgBaseFromPng,
    positive_base,
    negative_base,
    getWidthAndHeightFromImg,
)
import requests


def generateImg2Img(settings):
    # gause = getImgBaseFromPng("test2.png")

    prompt = settings["prompt"]
    negative_prompt = settings["negative_prompt"]
    negative_mode = settings["negative_mode"]
    sid = settings["sid"]
    var_sid = settings["variation_sid"]

    img = settings["img"]
    img_base64 = getImgBaseFromPng(img)

    isRecycle = settings["recycle"]
    denStr = settings["denoising_strength"]

    resoulution = getWidthAndHeightFromImg(img)
    width = resoulution[0]
    height = resoulution[1]

    print(resoulution, width, height, denStr)

    negative = ""
    enable_variations = 0
    subsid = -1

    if negative_mode == "simple":
        negative = negative_base

    if var_sid != 0:
        enable_variations = 0.3
        subsid = var_sid

    negative += negative_prompt
    smartRecycle = {}
    if isRecycle:
        denStr = 1
        smartRecycle = {
            "ControlNet": {
                "args": [
                    {
                        "control_mode": "My prompt is more important",
                        "enabled": True,
                        "generated_image": "base64image placeholder",
                        "guidance_end": 1,
                        "guidance_start": 0,
                        "hr_option": "Both",
                        "image": img_base64,
                        "input_mode": "simple",
                        "model": "control_v11p_sd15_canny_fp16 [b18e0966]",
                        "module": "canny",
                        "pixel_perfect": True,
                        "processor_res": 512,
                        "resize_mode": "Crop and Resize",
                        "save_detected_map": False,
                        "threshold_a": 100,
                        "threshold_b": 200,
                        "use_preview_as_input": False,
                        "weight": 0.25,
                    },
                    {
                        "control_mode": "Balanced",
                        "enabled": True,
                        "generated_image": "base64image placeholder",
                        "guidance_end": 1,
                        "guidance_start": 0,
                        "hr_option": "Both",
                        "image": img_base64,
                        "input_mode": "simple",
                        "model": "control_v11p_sd15_lineart_fp16 [5c23b17d]",
                        "module": "lineart_anime",
                        "pixel_perfect": True,
                        "processor_res": 512,
                        "resize_mode": "Crop and Resize",
                        "save_detected_map": False,
                        "threshold_a": 0.5,
                        "threshold_b": 0.5,
                        "weight": 0.7,
                    },
                ]
            },
        }

    payload = {
        "alwayson_scripts": smartRecycle,
        "batch_size": 1,
        "cfg_scale": 8,
        "denoising_strength": denStr,
        "disable_extra_networks": False,
        "do_not_save_grid": False,
        "do_not_save_samples": False,
        "init_images": [img_base64],
        "inpaint_full_res": 0,
        "inpaint_full_res_padding": 32,
        "inpainting_fill": 1,
        "inpainting_mask_invert": 0,
        "mask_blur": 8,
        "mask_blur_x": 4,
        "mask_blur_y": 4,
        "mask_round": True,
        "n_iter": 1,
        "negative_prompt": negative,
        "prompt": prompt,
        "resize_mode": 0,
        "s_churn": 0,
        "s_min_uncond": 0,
        "s_noise": 1,
        "s_tmin": 0,
        "sampler_name": "DPM++ 2M Karras",
        "seed": sid,
        "seed_enable_extras": True,
        "subseed": subsid,
        "subseed_strength": enable_variations,
        "seed_resize_from_h": -1,
        "seed_resize_from_w": -1,
        "CLIP_stop_at_last_layers": 1,
        "eta_noise_seed_delta": 31377,
        "steps": 24,
        "styles": [],
        "width": width,
        "height": height,
    }

    response = requests.post(
        url=f"http://127.0.0.1:7860/sdapi/v1/img2img", json=payload
    )
    response = response.json()

    # saveImgBase64ToPng(response["images"][0], path)
    # print(response)
    return response["images"][0]
