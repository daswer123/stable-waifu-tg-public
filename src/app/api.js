// api.js
import axios from "axios";
import path from "path";

export async function generateRequest(ctx, unicId) {
  try {
    console.log("Почалось!!");
    const { data } = await axios.post(`http://localhost:8006/txt2img_gen/`, {
      unicId,
      userId: ctx.from.id,
    });
    console.log(data);
    return data;
  } catch (err) {
    console.log(err);
  }
}

export async function generateRequestImg(ctx, unicId) {
    try {
      console.log("Почалось Картинка!!!!");
      const { data } = await axios.post(`http://localhost:8006/img2img_gen/`, {
        unicId,
        userId: ctx.from.id,
      });
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

export async function simpleUpscaleRequest(ctx, unicId) {
    try {
      console.log("Почалось апскейл!!");
      const { data } = await axios.post(`http://localhost:8006/txt2img_upscale_simple/`, {
        unicId,
        userId: ctx.from.id,
      });
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  export async function complexUpscaleRequest(ctx, unicId) {
    try {
      console.log("Почалось апскейл!!");
      const { data } = await axios.post(`http://localhost:8006/txt2img_upscale_complex/`, {
        unicId,
        userId: ctx.from.id,
      });
      console.log(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  }

export async function cancelGen(job_id){
    try {
        const response = await axios.get(`http://localhost:8006/cancel_job/${job_id}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при отмене задачи:', error);
    }
}

export async function checkJobStatus(jobId) {
    try {
        const response = await axios.get(`http://localhost:8006/check_job/${jobId}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при проверке статуса задачи:', error);
    }
}
import fs from "fs/promises"
import { getInstanceById, updateInstance } from "../backend/db/db_prompts.js";
import { Markup } from "telegraf";
import { createCompleteMenu, createCreateMessageMarkup, createCreateMessageMarkupVar } from "./functions.js";
import { type } from "os";
import { getResolutionFromAR } from "../backend/db/db_settings.js";
import { botName } from "../utils/variables.js";

export async function startGenerationPolling(jobId,ctx,isFirst = true,messageCtx = null,typeMenu="gen") {
    
    const interval = setInterval(async () => {
        try{
        const statusData = await checkJobStatus(jobId);

        console.log(statusData)

        if (!statusData) {
            console.log('Нет данных о статусе.');
            return;
        }

        if(statusData.status === "cleared"){
            console.log('Задача удалена.');
            clearInterval(interval); // Останавливаем polling.
            return
        }

        if (statusData.status === 'finished') {

            let finaleMessage,buttons;
            let message,saveFilename

            console.log(typeMenu,"TYYYPEPEEE")

            const unic_id = statusData.result.unic_id;
            const menuData = await getInstanceById(unic_id)

            // simple_upscale_gen
            // simple_upscale_var
            // complex_upscale_gen
            // complex_upscale_var

            const hasUpscaleString = typeMenu.includes("_upscale")
            // We need join type and upscale part like simple_upscale
            const upscaleSettings = typeMenu.split("_")
            const upscaleType = upscaleSettings ? upscaleSettings[0] + "_upscale" : null
            const upscaleTypeMenu = upscaleSettings ? upscaleSettings[2] : null

            console.log([typeMenu,hasUpscaleString,upscaleSettings,upscaleType,upscaleTypeMenu,"UPSCALLLLLEEEE"])


            if(!hasUpscaleString){
                [message,saveFilename] = await createCompleteMenu(statusData,ctx,isFirst,messageCtx)
                const resolvleSaveFilename = path.resolve(saveFilename)
                await updateInstance(unic_id, "img2img_path", resolvleSaveFilename)
            } else {
                if(upscaleType == "complex_upscale") {
                    [message,saveFilename] = await createCompleteMenu(statusData,ctx,false,messageCtx,"_hyperscale2x","upscale")
                } else{
                    [message,saveFilename] = await createCompleteMenu(statusData,ctx,false,messageCtx,"_upscale2x","upscale")
                }
                
            }

            if(hasUpscaleString){
                const resolution_raw = await getResolutionFromAR(menuData.aspect_ratio)
                console.log(resolution_raw)
                const resolution = resolution_raw.resolution.split("x")
                const width = resolution[0]
                const height = resolution[1]

                if(upscaleType == "simple_upscale"){
                    finaleMessage = `🆙 *Upscale x2* генерации [\\#${menuData.sid}](https://t.me/${botName}?start=${menuData.unic_id})
${width * 2}x${height * 2} \\-\\> ${width * 4}x${height * 4}`
                } else {
                    finaleMessage = `🔥 *HyperScale x2\\.5* генерации [\\#${menuData.sid}](https://t.me/${botName}?start=${menuData.unic_id})
${width * 2}x${height * 2} \\-\\> ${width * 4.5}x${height * 4.5}`
                }
                

                buttons = null
            }
            

            if(typeMenu == "gen" || typeMenu == "genAgain" ){
                [finaleMessage,buttons] = await createCreateMessageMarkup(unic_id)
            }

            if(typeMenu == "genAgain"){
                const [tempMessage, tempBtn] = await createCreateMessageMarkup(unic_id);
                await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(tempBtn).reply_markup);
            }

            if(typeMenu == "var" || typeMenu == "varm"){

                if(typeMenu == "var" || upscaleTypeMenu == "var"){
                    const [tempMessage, tempBtn] = await createCreateMessageMarkup(unic_id);
                    await ctx.editMessageCaption(tempMessage, {
                        reply_markup: Markup.inlineKeyboard(tempBtn).reply_markup,
                        parse_mode: "MarkdownV2"
                    });
                } 

                if(typeMenu == "varm"){
                    const [tempMessage, tempBtn] = await createCreateMessageMarkupVar(unic_id);
                    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(tempBtn).reply_markup);
                }   

                [finaleMessage,buttons] = await createCreateMessageMarkupVar(unic_id);

            }

            if(upscaleTypeMenu == "var"){
                const [tempMessage,tempBtn] = await createCreateMessageMarkupVar(unic_id);
                ctx.editMessageCaption(tempMessage, {
                    reply_markup: Markup.inlineKeyboard(tempBtn).reply_markup,
                    parse_mode: "MarkdownV2"
                })
            }

            if(upscaleTypeMenu == "gen"){
               const [tempMessage,tempBtn] = await createCreateMessageMarkup(unic_id);
               ctx.editMessageCaption(tempMessage, {
                reply_markup: Markup.inlineKeyboard(tempBtn).reply_markup,
                parse_mode: "MarkdownV2"
            })
            }
            
            await ctx.replyWithDocument({source: path.resolve(saveFilename)}, {
                caption: finaleMessage,
                parse_mode: "MarkdownV2",
                reply_to_message_id: message.message_id,
                reply_markup: buttons ? Markup.inlineKeyboard(buttons).reply_markup : {}
            })

            // Здесь можно вызвать функцию для отображения результатов пользователю.

            clearInterval(interval); // Останавливаем polling.

            return statusData
        } else if (statusData.status == 'failed' || statusData.status == 'not_found' ) {
            
            await ctx.replyWithMarkdownV2(`
🥲 *К сожалению, генерация завершилась ошибкой\\!*
_\\(токены вернулись на баланс\\)_
            
__Почему это могло произойти?__
\– Разовый сбой на нашей стороне, в таком случае поможет *повтор*\\.
\– Ошибка в твоём вводе\\. Если это происходит многократно, и ты используешь вес, убедись в отсутствии лишних точек и символов\\.
\– Кратковременные трудности на нашей стороне, попробуй подождать\\!          
            
            `)
            clearInterval(interval); // Останавливаем polling.
        } else {
            console.log('Задача все еще выполняется...');
        }
    }catch(e){
        console.log(e)
        clearInterval(interval); // Останавливаем polling.
        console.log("Операция отменена")
    }
    }, 2000); // Poll каждые 10 секунд.
}