import requests
from sd.funcs import getImgBaseFromPng, saveImgBase64ToPng,process_mult_chars,positive_base,negative_base

def generateImg(settings):
    # gause = getImgBaseFromPng("test2.png")

    prompt = settings["prompt"]
    width = settings["width"]
    height = settings["height"]
    negative_prompt = settings["negative_prompt"]
    negative_mode = settings["negative_mode"]
    sid = settings["sid"]
    var_sid = settings["variation_sid"]

    magick_pose = settings["magick_pose"]
    magick_ref = settings["magick_ref"]
    magick_shape = settings["magick_shape"]

    magick_pose_base64 = ""
    magick_ref_base64 = ""
    magick_shape_base64 = ""

    enable_magick_pose = False
    enable_magick_ref = False
    enable_magick_shape = False

    if magick_pose:
        magick_pose_base64 = getImgBaseFromPng(magick_pose)
        enable_magick_pose = True

    if magick_ref:
        magick_ref_base64 = getImgBaseFromPng(magick_ref)
        enable_magick_ref = True

    if magick_shape:
        magick_shape_base64 = getImgBaseFromPng(magick_shape)
        enable_magick_shape = True

    negative = ""
    enable_variations = 0
    subsid = -1

    if negative_mode == "simple":
        negative = negative_base

    if var_sid != 0:
        enable_variations = 0.3
        subsid = var_sid

    negative += negative_prompt

    if len(prompt) < 50:
        prompt = positive_base + prompt

    reg_prompt = process_mult_chars(prompt)
    print(reg_prompt,"\n\n",reg_prompt[0],"\n\n",reg_prompt[1])
    reg_propter_string = {}
    if reg_prompt[1] > 1:
        prompt = reg_prompt[0]
        reg_propter_string = {
            "args": [
                True,
                False,
                "Matrix",
                "Columns",
                "Mask",
                "Prompt",
                reg_prompt[2],
                "0.5",
                True,
                False,
                False,
                "Attention",
                [False],
                "0",
                "0",
                "0.2",
                "null",
                "0",
                "0",
                False,
            ]
        }

    controlNetRefString = {"enabled":False}
    controlNetPoseString = {"enabled":False}
    controlNetShapeString = {"enabled":False}

    if enable_magick_pose:
        controlNetPoseString = {                      
                        "enabled": True,
                        "hr_option": "Low res only",
                        "image":magick_pose_base64,
                        "input_mode": "simple",
                        "model": "controlnet11Models_openpose [73c2b67d]",
                        "module": "dw_openpose_full",
                        "pixel_perfect": False,
                        "processor_res": 640,
                        "resize_mode": "Crop and Resize",
                        "control_mode": "Balanced",
                        "save_detected_map": False,
                        "use_preview_as_input": False,
                        "weight": 0.85,
                    }

    if enable_magick_ref:
        controlNetRefString = {
                        "enabled": True,
                        "guidance_end": 1,
                        "guidance_start": 0,
                        "hr_option": "Both",
                        "image":magick_ref_base64,
                        "input_mode": "simple",
                        "model": "ip-adapter_sd15 [dbbc7cfe]",
                        "module": "InsightFace+CLIP-H (IPAdapter)",
                        "pixel_perfect": False,
                        "processor_res": 640,
                        "resize_mode": "Crop and Resize",
                        "control_mode": "Balanced",
                        "save_detected_map": False,
                        "use_preview_as_input": False,
                        "weight": 0.85,
                    }
    if enable_magick_shape:
        controlNetShapeString = {
                        "enabled": True,
                        "guidance_end": 1,
                        "guidance_start": 0,
                        "hr_option": "Both",
                        "image":magick_shape_base64,
                        "input_mode": "simple",
                        "model": "controlnetQRPatternQR_v2Sd15 [2d8d5750]",
                        "module": "None",
                        "resize_mode": "Crop and Resize",
                        "control_mode": "Balanced",
                        "save_detected_map": False,
                        "use_preview_as_input": False,
                        "pixel_perfect": True,
                        "processor_res": 640,
                        "weight": 0.95,
                    }
    payload = {
        "alwayson_scripts": {
            "Regional Prompter": reg_propter_string,
                    "SelfAttentionGuidance Integrated":{
            "args":[
              True,
              1.3,
              2
            ]
          },
            "ControlNet": {
                "args": [
                    # {
                    #     "control_mode": "Balanced",
                    #     "enabled": True,
                    #     "guidance_end": 0.4,
                    #     "guidance_start": 0,
                    #     "hr_option": "Both",
                    #     "image": gause,
                    #     "input_mode": "simple",
                    #     "model": "control_v11p_sd15_lineart_fp16 [5c23b17d]",
                    #     "module": "lineart_anime",
                    #     "pixel_perfect": True,
                    #     "processor_res": 512,
                    #     "resize_mode": "Crop and Resize",
                    #     "save_detected_map": False,
                    #     "threshold_a": 0.5,
                    #     "threshold_b": 0.5,
                    #     "use_preview_as_input": False,
                    #     "weight": 0.4,
                    # },
                    # {
                    #     "control_mode": "Balanced",
                    #     "enabled": True,
                    #     "guidance_end": 0.1,
                    #     "guidance_start": 0,
                    #     "hr_option": "Both",
                    #     "image": gause,
                    #     "input_mode": "simple",
                    #     "model": "controlnet11Models_tileE [e47b23a8]",
                    #     "module": "None",
                    #     "pixel_perfect": True,
                    #     "processor_res": 512,
                    #     "resize_mode": "Crop and Resize",
                    #     "save_detected_map": False,
                    #     "threshold_a": 0.5,
                    #     "threshold_b": 0.5,
                    #     "weight": 0.2,
                    # },
                    #     ]
                    # },
                    controlNetPoseString,
                    controlNetRefString,
                    controlNetShapeString  
                   
                ]
            },
            "ADetailer": {
                "args": [
                    True,
                    False,
                    {
                        "ad_cfg_scale": 8,
                        "ad_checkpoint": "Use same checkpoint",
                        "ad_clip_skip": 2,
                        "ad_confidence": 0.3,
                        "ad_controlnet_guidance_end": 1,
                        "ad_controlnet_guidance_start": 0,
                        "ad_controlnet_model": "None",
                        "ad_controlnet_module": "None",
                        "ad_controlnet_weight": 1,
                        "ad_denoising_strength": 0.4,
                        "ad_dilate_erode": 4,
                        "ad_inpaint_height": 640,
                        "ad_inpaint_only_masked": True,
                        "ad_inpaint_only_masked_padding": 32,
                        "ad_inpaint_width": 640,
                        "ad_mask_blur": 8,
                        "ad_mask_k_largest": 0,
                        "ad_mask_max_ratio": 1,
                        "ad_mask_merge_invert": "None",
                        "ad_mask_min_ratio": 0,
                        "ad_model": "face_yolov8n.pt",
                        "ad_negative_prompt": "",
                        "ad_noise_multiplier": 1,
                        "ad_prompt": "detailed, highres,face",
                        "ad_sampler": "DPM++ 2M Karras",
                        "ad_steps": 28,
                        "ad_vae": "Use same VAE",
                        "ad_x_offset": 0,
                        "ad_y_offset": 0,
                    },
                ]
            },
        },
        "batch_size": 1,
        "cfg_scale": 10,
        "denoising_strength": 0.56,
        "disable_extra_networks": False,
        "do_not_save_grid": False,
        "do_not_save_samples": False,
        "enable_hr": True,
        "hr_negative_prompt": negative,
        "hr_prompt": "",
        "hr_resize_x": 0,
        "hr_resize_y": 0,
        "hr_scale": 2,
        "hr_second_pass_steps": 15,
        "hr_upscaler": "4x-AnimeSharp",
        "n_iter": 1,
        "CLIP_stop_at_last_layers": 2,
        "negative_prompt": negative,
        "override_settings_restore_afterwards": True,
        "prompt": prompt +"  <lora:LowRA:0.2>",
        "restore_faces": False,
        "s_churn": 0,
        "eta_noise_seed_delta": 31377,
        "s_min_uncond": 0,
        "s_noise": 1,
        "s_tmin": 0,
        "sampler_name": "DPM++ 2M Karras",
        "seed": sid,
        "seed_enable_extras": True,
        "seed_resize_from_h": -1,
        "seed_resize_from_w": -1,
        "steps": 25,
        "subseed": subsid,
        "subseed_strength": enable_variations,
        # "width": 656,
        # "height": 656,
        "width": width,
        "height": height,
    }

    response = requests.post(
        url=f"http://127.0.0.1:7860/sdapi/v1/txt2img", json=payload
    )
    response = response.json()

    # saveImgBase64ToPng(response["images"][0], path)
    # print(response)
    return response["images"][0]


def upscaleSimple(img_path):

    img_base64 = getImgBaseFromPng(img_path)

    payload = {
        "resize_mode": 0,
        # "show_extras_results": True,
        "upscaling_resize": 2,
        # "upscaling_crop": True,
        "upscaler_1": "4x-AnimeSharp",
        # "upscale_first": False,
        "image": img_base64,
    }
    response = requests.post(
        url=f"http://127.0.0.1:7860/sdapi/v1/extra-single-image", json=payload
    )
    response = response.json()

    # saveImgBase64ToPng(response["images"][0], path)
    # print(response)
    return response["image"]


def upscaleComplex(settings):

    print(settings)
    img = settings["img"]
    width = settings["width"]
    height = settings["height"]

    img_base64 = getImgBaseFromPng(img)

    payload = {
        "batch_size": 1,
        "cfg_scale": 10,
        "CLIP_stop_at_last_layers": 1,
        "eta_noise_seed_delta": 31377,
        "denoising_strength": 0.42,
        "disable_extra_networks": False,
        "do_not_save_grid": True,
        "do_not_save_samples": True,
        "height": height,
        "width": width,
        "init_images": [img_base64],
        "initial_noise_multiplier": 1.01,
        "inpaint_full_res": True,
        "inpaint_full_res_padding": 32,
        "inpainting_fill": 1,
        "inpainting_mask_invert": 0,
        "mask_blur": 8,
        "mask_blur_x": 8,
        "mask_blur_y": 8,
        "mask_round": True,
        "n_iter": 1,
        "negative_prompt": "bad-hands-5 easynegative",
        "override_settings_restore_afterwards": True,
        "prompt": "maximum details, highres, absurdres",
        "resize_mode": 0,
        "s_churn": 0,
        "s_min_uncond": 0,
        "s_noise": 1,
        "s_tmin": 0,
        "sampler_name": "DPM++ 2M Karras",
        "script_args": [
            '<p style="margin-bottom:0.75em">Will upscale the image depending on the selected target size type</p>',
            512,
            0,
            8,
            32,
            64,
            0.35,
            32,
            3,
            True,
            0,
            False,
            8,
            0,
            2,
            2048,
            2048,
            2.5,
        ],
        "script_name": "ultimate sd upscale",
        "seed": -1,
        "seed_enable_extras": True,
        "seed_resize_from_h": -1,
        "seed_resize_from_w": -1,
        "steps": 28,
        "styles": ["- Anime Negative"],
        "subseed": -1,
        "subseed_strength": 0,
    }

    response = requests.post(
        url=f"http://127.0.0.1:7860/sdapi/v1/img2img", json=payload
    )
    response = response.json()
    return response["images"][0]


# generateImg("test.png", "1girl,bob haircut, shorts, in the cafe")



# "FreeU Integrated":{
            #   "args":[
            #     True,
            #     1.5,
            #     1.6,
            #     0.9,
            #     0.2
            #   ]
            # },
    # "FreeU Integrated":{
    #           "args":[
    #             True,
    #             1.5,
    #             1.6,
    #             0.9,
    #             0.2
    #           ]
    #         },