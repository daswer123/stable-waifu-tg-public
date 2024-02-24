// Imports zone
import { Telegraf, session, Scenes, Markup } from "telegraf";
import {sql,redis} from "../backend/db/init.js";
import { handleMiddleware } from "./middleware.js";
import { config } from "dotenv";
import { setBotCommands, registerBotCommands } from "./commands.js";

// Import database to initiate
import { registerBotActions } from "./actions.js";
import { createMenu, createSessionFolder, decodeUniqueId, downloadAndSaveFile, downloadPhoto, escapeMarkdown, generateUniqueId } from "../utils/funcs.js";
import { convertToTags, localTagConverter } from "../utils/sent2tags.js";

// PROMPTS
import { createInstance, createPromptTable, getInstanceById, getInstanceByedit_id, handleInstanceRequest, updateInstance } from "../backend/db/db_prompts.js";
import { createSettingsTables, getAllModels, getModelByName, getModelPositonByName } from "../backend/db/db_settings.js";
import { createCreateMessageMarkup, createGiftTokenMenuAndReply, createImgMenuAndEdit, createTextMenuAndEdit, createTextMenuAndReply, deleteMessageMarkup, replyGreatingMessage } from "./functions.js";
import * as fs from 'fs';
import { INITIAL_SESSION, botName, modelsPerPage, poseFolder, refFolder, sessionPathFolder, shapeFolder } from "../utils/variables.js";
import { img2Tags } from "../utils/waifu_tagger.js";
import path from "path";
import { createUserTables, getUserPreferences, saveSessionToDatabase } from "../backend/db/db_users.js";


// INIT ENV CONFIG
config();

// Init DB
await createSettingsTables()
await createUserTables()
await createPromptTable()


// Initiate the bot and set a timer so that there is no error.
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
export const bot = new Telegraf(TELEGRAM_TOKEN, {
    handlerTimeout: 900_000_000,
});

// Initilate session and scene handlers
bot.use(session());
process.setMaxListeners(0);

// bot.on("message",async(ctx) =>{
//     console.log(ctx.message)
// })

//  Working with session, error handling
bot.use(async (ctx, next) => {
    try {
        // console.log(ctx.session,"MIDDLE")
        await handleMiddleware(ctx,next); // Set middleware to work correctly with the session
        // saveSessionToDatabase(ctx.from.id,session)
        // next()
    } catch (err) {
        if (err.message == 'edit_message_error') {
            ctx.telegram.answerCbQuery(
                "❗ Это старое сообщение и telegram не позволяет нам контактировать с ним. Отправьте новый запрос для взаимодействия!"
            );
            return
        }
        console.log(err);
    }
});

// Initiate Scenes
const { Stage } = Scenes;
const stage = new Stage([]);
bot.use(stage.middleware());

// Initiate bot commands and actions
setBotCommands(bot);
registerBotCommands(bot);
registerBotActions(bot);

bot.start(async (ctx) => {

    // console.log("Hi")
    // ctx.session = ctx.session ? ctx.session : {...INITIAL_SESSION}
    ctx.session.messageToClear = null
    
    const startPayload = ctx.startPayload;

    if(!startPayload){
        replyGreatingMessage(ctx)
        return
    }

    // initFirstModel(ctx)
    
    const decodePayload = decodeUniqueId(startPayload)
    // console.log(decodePayload)

    const firstElement = decodePayload.split("_")[0]
    if (firstElement == "pedit"){
         
        const menuData = await getInstanceByedit_id(startPayload,ctx)

        ctx.session.menuId = menuData
        ctx.session.currectAction = "editPrompt"

        const message = `
${escapeMarkdown(`🎨 Отправь мне новый ввод для этой генерации. Остальные настройки не будут затронуты!`)}

Текущий ввод:
\`${menuData.prompt}\`
`
        const buttons = Markup.inlineKeyboard((Markup.button.callback("<< Назад",`edit_back_${menuData.unic_id}`)))
        ctx.replyWithMarkdownV2(message,buttons)
        return
    }

    if (firstElement == "seed"){
        const menuData = await getInstanceById(startPayload)

        const [new_unic_id, new_edit_id] = generateUniqueId()
        menuData.unic_id = new_unic_id
        menuData.edit_id = new_edit_id
        
        await createInstance(menuData)
        await createTextMenuAndReply(ctx,new_unic_id)
        return
    }
})

// HANDLERS
bot.on("text", async (ctx) => {

    if(ctx.session.currectAction == "sendToken"){

        if(ctx.message.text.length > 150){
            await ctx.replyWithMarkdownV2(`❌ Длина подписи не должна превышать 150 символов!`)
            return
        }

        ctx.session.userNoteSendGift = ctx.message.text
        createGiftTokenMenuAndReply(ctx)
        return
    }
    
    if(ctx.session.menuId && (ctx.session.currectAction == "editNegative" || ctx.session.currectAction == "editNegativeSimple")){
        const negative = ctx.message.text
        await updateInstance(ctx.session.menuId, "negative_prompt", negative)

        if (ctx.session.currectAction == "editNegativeSimple"){
            await updateInstance(ctx.session.menuId, "negative_mode", "simple")
        }

        ctx.session?.messageToClear ? deleteMessageMarkup(ctx,ctx.session.messageToClear) : ""
        
        createTextMenuAndReply(ctx, ctx.session.menuId)
        return
    }

    if(ctx.session.menuId && ctx.session.currectAction == "editPrompt"){
        const [prompt,findTags] = await convertToTags(ctx.message.text)

        

        // const prompt = await localTagConverter(ctx.message.text)
        const [unic_id,edit_id] = generateUniqueId()

        ctx.session.menuId.unic_id = unic_id
        ctx.session.menuId.edit_id = edit_id
        ctx.session.menuId.prompt = prompt
        ctx.session.menuId.extra_chars = findTags.magickChars
        ctx.session.menuId.extra_tags = findTags.magickTags
        ctx.session.menuId.extra_word = findTags.magickWords

        console.log("Menu id ->",ctx.session.menuId)

        await createInstance(ctx.session.menuId)
        await createTextMenuAndReply(ctx, unic_id)
    
        return
    }

    // console.log("Меню айди бля",ctx.session.menuId,ctx.session.menuId && ctx.session.currectAction == "editSid")
    if(ctx.session.menuId && ctx.session.currectAction == "editSid"){
        const sid = ctx.message.text

        ctx.session?.messageToClear ? deleteMessageMarkup(ctx,ctx.session.messageToClear) : ""
        // Check sid is num and should be positive
        if(isNaN(+sid) || +sid < 0){
            const message = await ctx.replyWithMarkdownV2(`❌ Сид \\- это целое положительное число\\.`,Markup.inlineKeyboard([[Markup.button.callback("<< Назад",`back_${ctx.session.menuId}`)]]))
            ctx.session.messageToClear = message.message_id
            return
        }

        // deleteMessageMarkup(ctx,ctx.session.messageToClear)

        const menuData = await handleInstanceRequest(ctx.session.menuId, ctx)
        if (menuData == null) {
            ctx.session.currectAction = ""
            ctx.replyWithMarkdownV2(`❌ Не удалось обработать запрос. Попробуйте снова.`)
            return
        }

        await updateInstance(ctx.session.menuId,"sid",sid)
        createTextMenuAndReply(ctx,ctx.session.menuId)        
        return
        }

    if(!isNaN(+ctx.message.text)){
        ctx.replyWithMarkdownV2(`Похоже, ты случайно отправил\\(а\\) 🌱 *Сид* вместо ввода\\. Попробуй снова\\!\n_\\*Сид можно будет указать на следующем этапе_\\.`)
        return
    }
    

    const [text,findTags] = await convertToTags(ctx.message.text)

    console.log(findTags, "ТЕГИИ")
    // const text = await localTagConverter(ctx.message.text)
    // const text = "test"
    const [unic_id,edit_id] = generateUniqueId()

    const baseText = escapeMarkdown(`🎨 Теперь можешь *выбрать модель* и настроить арт под себя. Если не уверен(а), просто начинай генерацию :)`)
    const userPreferences = await getUserPreferences(ctx.from.id)
    
    const model_name = userPreferences.default_model
    const modelData = await getModelByName(model_name)

    const model_page = await getModelPositonByName(model_name)

    const menuData = {
        unic_id,
        edit_id,
        model_name: userPreferences.default_model,
        sd_model: modelData.stable_model,
        type: userPreferences.default_type,
        prompt: text,
        aspect_ratio: userPreferences.default_ar,
        generation_type : "txt2img",
        model_page: model_page,
        creatorId : ctx.from.id ,
        negative_mode: "simple",
        sid:0,
        extra_chars: findTags.magickChars || "",
        extra_tags: findTags.magickTags || "",
        extra_word: findTags.magickWords || "",
        enable_alter_model: false,
    }

    await createInstance(menuData)
    await createTextMenuAndReply(ctx,unic_id,baseText)

    console.log("Вставленно в бд")
});

bot.on("photo", async (ctx) => {
    const photo = ctx.message.photo.pop();
    const currectAction = ctx.session.currectAction

    if(ctx.session.menuId && (currectAction == "uploadMagickRef" || currectAction == "uploadMagickPose" || currectAction == "uploadMagickShape")){
        ctx.session?.messageToClear ? deleteMessageMarkup(ctx,ctx.session.messageToClear) : ""

        const photoPrefix = currectAction.split("uploadMagick")[1].toLowerCase()
        
        // Download photo
        
        const photoName = `${photoPrefix}_${ctx.session.menuId}.png`

        let sessionPath;

        sessionPath = currectAction == "uploadMagickRef" ? refFolder : poseFolder
        sessionPath = currectAction == "uploadMagickShape" ? shapeFolder : sessionPath
        
        if (!fs.existsSync(sessionPath)) {
            await fs.promises.mkdir(sessionPath, { recursive: true });
        }
        
        let photoPath = await downloadPhoto(sessionPath,photo, ctx.telegram,photoName)
        photoPath = path.resolve(photoPath)

        currectAction == "uploadMagickRef" ? await updateInstance(ctx.session.menuId, "magick_ref", photoPath) : ""
        currectAction == "uploadMagickPose" ? await updateInstance(ctx.session.menuId, "magick_pose", photoPath) : ""
        currectAction == "uploadMagickShape" ? await updateInstance(ctx.session.menuId, "magick_shape", photoPath) : ""

        createTextMenuAndReply(ctx,ctx.session.menuId,null,ctx.session.messageToClear)
        return 
    }

    let baseMessage = `✨ Описываем это сообщение\\.\\.\\.`
    baseMessage+=`\n_\\*Ты так же можешь добавить к нему свою подпись с описанием нужного результата\\._`

    const tempMessage = await ctx.replyWithMarkdownV2(baseMessage,{
        reply_to_message_id: ctx.message.message_id,
    })

    const photoPrefix = "raw"
    const sessionPath = path.join(sessionPathFolder,"raw",String(ctx.from.id))

    if (!fs.existsSync(sessionPath)) {
        await fs.promises.mkdir(sessionPath, { recursive: true });
    }

    const [unic_id,edit_id] = generateUniqueId()
    const photoName = `${photoPrefix}_${unic_id}.png`

    const photoPath = await downloadPhoto(sessionPath, photo, ctx.telegram, photoName)
    const photoPathReveal = path.resolve(photoPath)
    // If has caption text = caption

    let text,findTags
    if(ctx.message.caption){
        [text,findTags] = await convertToTags(ctx.message.caption)
    } else {
        text = await img2Tags(photoPath)
    }

    const userPreferences = await getUserPreferences(ctx.from.id)
    
    const model_name = userPreferences.default_model

    const modelData = await getModelByName(model_name)
    const model_page = await getModelPositonByName(model_name)

    const menuData = {
        unic_id,
        edit_id,
        model_name: model_name,
        sd_model: modelData.stable_model,
        type: userPreferences.default_type,
        prompt: text,
        generation_type : "img2img",
        img_2_img_strength: userPreferences.default_strength,
        model_page,
        creatorId : ctx.from.id ,
        negative_mode: "simple",
        img_2_raw_image: photoPathReveal,
        img2img_path: photoPathReveal,
        sid:0,
        extra_chars: findTags?.magickChars || "",
        extra_tags: findTags?.magickTags || "",
        extra_word: findTags?.magickWords || "",
        enable_alter_model: false,
        // img_2_smart_recycle: 1,
        // sid: 1,
        // preset_name: "Wave"
    }

    const baseText = escapeMarkdown(`🎨 Теперь можешь *выбрать модель* и настроить арт под себя. Если не уверен(а), просто начинай генерацию :)`)

    // ctx.deleteMessage(tempMessageId.message_id)
    await createInstance(menuData)    
    // const findTags = {
    //     magickWords : findMagickWord,
    //     magickTags:  findMagickTags,
    //     magickChars : findMagickChars
    //   }
    createImgMenuAndEdit(ctx,unic_id,baseText,ctx.message.message_id,tempMessage)
    
});


import axios from "axios";
bot.on("message", async (ctx) => {
    if (ctx.message.document && ctx.message.forward_from && ctx.message.forward_from.username === botName) {

        // Получаем информацию txt2img или img2img
        const captionEntities = ctx.message.caption_entities;
        let seedEntity = captionEntities.find(entity => entity.type === 'text_link').url;
        seedEntity = seedEntity.split("start=")[1]


        let fileLink;
        try {
            const fileSize = ctx.message.document.file_size;
            const thumbSize = ctx.message.document.thumb ? ctx.message.document.thumb.file_size : 0;

            console.log(fileSize, thumbSize, ctx.message.document)

            let fileId;
            if (fileSize >= thumbSize) {
                fileId = ctx.message.document.file_id; // Оригинальный документ самый большой
            } else {
                fileId = ctx.message.document.thumb.file_id; // Эскиз имеет больший размер (теоретически возможная ситуация)
            }

            console.log(fileId)

            fileLink = await bot.telegram.getFileLink(fileId);
        }
        catch(error){
           console.error("Не удалось получить ссылку на файл:", error);
           return;
       }

       const sessionFolder =  path.join("data","temp")
       const filePath = path.join("data","temp", `${ctx.message.document.file_name}`);


       if (!fs.existsSync(sessionFolder)) {
        await fs.promises.mkdir(sessionFolder, { recursive: true });
       }

       await downloadAndSaveFile(fileLink,filePath)

        //  Получили файл от пользователя, теперь отправляем будто это хранится у нас :D
        await ctx.deleteMessage()
        const [finaleMessage,buttons] = await createCreateMessageMarkup(seedEntity)
        await ctx.replyWithDocument({source: path.resolve(filePath)}, {
            caption: finaleMessage,
            parse_mode: "MarkdownV2",
            reply_markup: buttons ? Markup.inlineKeyboard(buttons).reply_markup : {}
        })
        } 
    
    
    
    else {
      ctx.replyWithMarkdownV2(`
Для генерации арта напиши мне, что хочешь на нём увидеть\\.
Можно также отправить картинку, чтобы мы обработали её в нашем стиле\\.
      
_Больше информации и полезных ссылок есть по команде /help\\._
      `)
    }
});

// LAUNCH BOT
bot.launch();

// Create session folder
createSessionFolder();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
