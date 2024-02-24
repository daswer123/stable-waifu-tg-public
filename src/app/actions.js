import { escapeMarkdown, generateRandomSeed, generateUniqueId, getModelPage, withErrorHandling } from "../utils/funcs.js";
import { Markup } from "telegraf";
import path from "path";
import fs from "fs"
import { createInstance, getInstanceById, getOperationStatus, getUnicIdByJobId, handleInstanceRequest, updateInstance, updateInstanceSid } from "../backend/db/db_prompts.js";
import { createARMenu, createCreateMessageMarkup, createCreateMessageMarkupVar, createGiftTokenMenuAndEdit, createMagickMenu, createModelMenu, createNegativeMenu, createPresetSelectMenu, createSmartRecycleMenu, createStrengthMenu, createTextMenu, createTextMenuAndEdit, createTextMenuAndReply } from "./functions.js";
import { createModel, getARByRatio, getAllNegativeEmbeddings, getDefaultPresetBymodel_name, getModelByName, getPresetByName, getSelectedPresetBymodel_name, getStrenghtById, getStrenghtByName, setAlterMode, setPresetAsSelected } from "../backend/db/db_settings.js";
import { cancelGen, checkJobStatus, complexUpscaleRequest, generateRequest, generateRequestImg, simpleUpscaleRequest, startGenerationPolling } from "./api.js";
import { updateUserPreferences } from "../backend/db/db_users.js";

export const registerBotActions = withErrorHandling(async (bot) => {
   
   // Commands acitons
   bot.action("change_anonim_gift_token",async(ctx)=>{
      ctx.session.isAnonim = !ctx.session.isAnonim

      const buttons = [
         [Markup.button.callback(`👻 Анонимно: ${ctx.session.isAnonim ? "Да" : "Нет"}`, 'change_anonim_gift_token')],
         [Markup.button.callback('📝 Подпись к подарку', 'change_notes_gift_token')]
      ]
      await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
   })

   bot.action("change_notes_gift_token",async(ctx)=>{
      let baseMessage = `📝 *Подпись* позволяет добавить к твоему подарку небольшой текст, который увидит получатель\\!
Отправь сюда текст, следуя условиям ниже\\.\n\n`

      baseMessage+=`*1*\\. Подпись может содержать до *150* символов\\.
*2*\\. В подписи не должно быть ссылок, спама, оскорблений и провокаций\\.\n\n`

      const noteString = ctx.session.userNoteSendGift ? `*Текущее сообщение:*\n\`` + ctx.session.userNoteSendGift + `\`` : `_Сейчас подарок не содержит подпись_`
      baseMessage+=noteString

      const buttons = [
         ctx.session.userNoteSendGift ? [Markup.button.callback('❌ Без подписи', 'send_gift_back_clear')] : [],
         [Markup.button.callback('<< Назад', 'send_gift_back')],
      ]

      ctx.editMessageText(baseMessage, {
         parse_mode: "MarkdownV2",
         reply_markup: Markup.inlineKeyboard(buttons).reply_markup
      })


      ctx.session.currectAction = "sendToken"
   })

   bot.action("send_gift_back_clear",async(ctx)=>{
      ctx.session.userNoteSendGift = ""
      createGiftTokenMenuAndEdit(ctx)
   })

   bot.action("send_gift_back",async(ctx)=>{
      createGiftTokenMenuAndEdit(ctx)
   })

   // SEED
   bot.action(/set_sid_(.*)/,async(ctx)=>{

     const unic_id = ctx.match[1]
     const message = `🌱 Сид позволяет тебе воспроизвести определённый арт у себя\\. Например, чтобы поиграть с результатом друга или внести изменения в текст для правки своего\\.
*__Внимание__*\\! Если ты берёшь чужое значение, у тебя должны быть в точности такие же настройки и ввод, как у его автора, чтобы арт вышел одинаковым\\.
Ты можешь попросить у автора 🌱 *QuickSeed* ссылку, чтобы бот сам всё настроил\\!

\\> Отправь мне сид\\. Это целое число\\.`

      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      const buttons = Markup.inlineKeyboard([
         menuData.sid ? [Markup.button.callback("🎲 Случайный", `set_random_sid_${unic_id}`)] : [],
         [Markup.button.callback("<< Назад",`back_${unic_id}`)]
         ])

      const replyMessage = await ctx.editMessageText(message,{
         reply_markup: buttons.reply_markup,
         parse_mode: "MarkdownV2"
      })

      ctx.session.menuId = unic_id
      ctx.session.messageToClear = replyMessage.message_id
      ctx.session.currectAction = "editSid"

   })

   bot.action(/set_random_sid_(.*)/,async(ctx)=>{

      const unic_id = ctx.match[1]
      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      await updateInstance(unic_id,"sid",0)
      await updateInstance(unic_id, "variation_sid",0)
      createTextMenuAndEdit(ctx, unic_id)
   })

   // AR
   bot.action(/go_ar_menu_(.*)/,async(ctx)=>{
      // Create sleep function
      const unic_id = ctx.match[1]
      createARMenu(ctx, unic_id)
   })

   bot.action(/set_ar_(.*)_(.*)/,async(ctx)=>{
      let ar = ctx.match[1]
      const unic_id = ctx.match[2]

      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      if(ar == "1:1" && menuData.aspect_ratio == "1:1"){
         const alertMessage = `🖼 Ты используешь соотношение 1:1.Это квадратное изображение, так что его нельзя повернуть`
         await ctx.telegram.answerCbQuery(ctx.callbackQuery.id, alertMessage, { show_alert: true });
         return
      }

      
      if(menuData.aspect_ratio == ar){
         const newType = menuData.type == "portrait" ? "landscape" : "portrait"
         // we need reverse ar, like 1:2 => 2:1, 16:9 => 9:16
         ar =  ar.split(":").reverse().join(":")

         await updateInstance(unic_id, "type", newType)
      } 

      await updateInstance(unic_id, "aspect_ratio", ar)
      createARMenu(ctx, unic_id)
   })

   bot.action(/swap_ar_(.*)/gm,async(ctx)=>{
      const unic_id = ctx.match[1]

      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      if(menuData.aspect_ratio == "1:1"){
         const alertMessage = `🖼 Ты используешь соотношение 1:1.Это квадратное изображение, так что его нельзя повернуть`
         await ctx.telegram.answerCbQuery(ctx.callbackQuery.id, alertMessage, { show_alert: true });
         return
      }

      const newType = menuData.type == "portrait" ? "landscape" : "portrait"
      const newAR = menuData.aspect_ratio.split(":").reverse().join(":")

      await updateInstance(unic_id, "type", newType)
      await updateInstance(unic_id, "aspect_ratio", newAR)

      createTextMenuAndEdit(ctx,unic_id)
   })

   // Negative
   bot.action(/go_negative_menu_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      createNegativeMenu(ctx, unic_id)
   })

   bot.action(/set_negative_(expert|simple)_(.*)/,async(ctx)=>{
      const mode = ctx.match[1]
      const unic_id = ctx.match[2]

      // console.log(unic_id,mode)

      let baseMessage = ``

      const buttons = Markup.inlineKeyboard([
         [Markup.button.callback("<< Назад",`back_negative_${unic_id}`)]
      ])

      if(mode == "expert"){
         baseMessage = `💀 *Экспертный режим*
Всё, что ты напишешь сюда, будет напрямую влиять на стилистику и качество результатов, поэтому мы подготовили *[особую инструкцию](https://telegra.ph/Expert-NP--Stable-Waifu-10-09)* для этого режима\\!`
         
         let allNegativeEmebedings = await getAllNegativeEmbeddings()
         allNegativeEmebedings = allNegativeEmebedings.join("\`, \`")
         baseMessage += `\n\n\\*Доступные TI: \`${allNegativeEmebedings}\`\\.`

      }

      if(mode == "simple"){
         baseMessage = `✨ *Упрощённый режим*
Сюда можно вписать то, чего ты не хочешь видеть в генерации, __если__ изменения в обычном вводе не помогают\\.
         
❔ *Как заполнить?*
Так же, как обычный ввод: те же правила, поддержка веса, а русский язык переводится в теги\\. Если ты хочешь убрать зонтик, просто напиши \`umbrella\`\\.
Учти, что большой ввод _может_ снизить креативность и послушность модели\\!`
      }

      const message = await ctx.editMessageText(baseMessage,{
         reply_markup: buttons.reply_markup,
         disable_web_page_preview: true,
         parse_mode: "MarkdownV2"
      })

      await updateInstance(unic_id, "negative_mode", mode)

      // Prepare for Input
      ctx.session.messageToClear  = message.message_id
      ctx.session.currectAction = "editNegative"
      ctx.session.menuId = unic_id

      // createNegativeMenu(ctx, unic_id)
   })

   bot.action(/reset_negative_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]

      await updateInstance(unic_id, "negative_mode", "simple")
      await updateInstance(unic_id, "negative_prompt", "")

      createTextMenuAndEdit(ctx, unic_id)
   })

   bot.action(/back_negative_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      createNegativeMenu(ctx,unic_id)
   })

   // Magick

   bot.action(/go_magick_menu_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      createMagickMenu(ctx,unic_id)
   })

   // set_magick_shape_
   // set_magick_poses_
   // set_magick_ref_

   // Shape magick
   bot.action(/set_magick_shape_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]

      const menuId = await getInstanceById(unic_id)

      const ar_sizes = await getARByRatio(menuId.aspect_ratio)
      console.log(ar_sizes)
      console.log(`https://fakeimg.pl/${ar_sizes.resolution}/ffffff/ffffff?text=+`)
      
      let baseMessage = `⚡️ Открой этот *белый холст* и нарисуй на нём узор или текст с помощью редактора, встроенного в Telegram\\. Можно использовать любой цвет маркера\\.`
      baseMessage+=`[ ](https://fakeimg.pl/${ar_sizes.resolution}/ffffff/ffffff?text=+)\n`
      baseMessage+="\n\n❕ [Подробная инструкция](https://telegra.ph/Stable-Waifu--Figura-08-01)"

      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      const hasMagickShape = menuData.magick_shape ? true : false

      const cancelButton = hasMagickShape ? [Markup.button.callback(`❌ Убрать фигуру`,`remove_magick_shape_${unic_id}`)] : []

      const buttons = Markup.inlineKeyboard([
         cancelButton,
         [Markup.button.callback("<< Назад", `go_magick_menu_${unic_id}`)]
      ])

      const messageClear = await ctx.editMessageText(baseMessage,{
         reply_markup: buttons.reply_markup,
         parse_mode: "MarkdownV2"
      })

      ctx.session.currectAction = "uploadMagickShape"
      ctx.session.menuId = unic_id
      ctx.session.messageToClear = messageClear.message_id
   })

   bot.action(/remove_magick_shape_(.*)/,async(ctx)=>{
      await updateInstance(ctx.match[1], "magick_shape", "")
      createTextMenuAndEdit(ctx, ctx.match[1])
   })

   // Pose
   bot.action(/set_magick_pose_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      
      let baseMessage = `⚡️ Ты можешь задать нужную позу для персонажа _\\(или персонажей\\)_ на арте\\.\n\n`
      baseMessage+=`*__Как это работает?__*
*1*\\. Подбери изображение, на котором есть нужная тебе поза с чётким видом на человека и нужные конечности\\. Это может быть реальное фото, другой арт или скелет\\.
*2*\\. Отправь сюда изображение\\.`
      baseMessage+="\n\n_\\*Если какие\\-то части тела скрыты из кадра, они могут быть переданы на усмотрение ИИ\\._\nТы можешь создать нужную позу с нуля на *[этом сайте](https://webapp.magicposer.com/)*\\!"

      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      const hasMagickRef = menuData.magick_ref ? true : false
      const hasMagickPose = menuData.magick_pose ? true : false

      const setFromPose = !!hasMagickRef && !hasMagickPose ? [Markup.button.callback(`🔀 Взять референс`,`magick_ref_to_pose_${unic_id}`)] : []
      const cancelButton = hasMagickPose ? [Markup.button.callback(`❌ Убрать позу`,`remove_magick_pose_${unic_id}`)] : []
      
      const buttons = Markup.inlineKeyboard([
         cancelButton,
         setFromPose,
         [Markup.button.callback("<< Назад", `go_magick_menu_${unic_id}`)]
      ])

      const messageClear = await ctx.editMessageText(baseMessage,{
         reply_markup: buttons.reply_markup,
         parse_mode: "MarkdownV2"
      })

      ctx.session.currectAction = "uploadMagickPose"
      ctx.session.menuId = unic_id
      ctx.session.messageToClear = messageClear.message_id
   })

   bot.action(/magick_ref_to_pose_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      await updateInstance(unic_id, "magick_pose", menuData.magick_ref)
      createTextMenuAndEdit(ctx, unic_id)
   })

   bot.action(/remove_magick_pose_(.*)/,async(ctx)=>{
      await updateInstance(ctx.match[1], "magick_pose", "")
      createTextMenuAndEdit(ctx, ctx.match[1])
   })

   // Reference
   bot.action(/set_magick_ref_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      
      let baseMessage = `⚡️ Ты можешь указать своё изображение в качестве референса\\.\n\n`
      baseMessage+=`*__Как это работает?__*
Модель возьмёт из твоей картинки общее настроение и часть композиции, направляя результат в нужную сторону, но не будет напрямую брать содержимое исходника\\.
[пример и сравнение](https://telegra.ph/Reference-Examples--Stable-Waifu-10-08)`
      baseMessage+="\n\n\\> Отправь сюда изображение\\-референс\\!"

      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      const hasMagickShape = menuData.magick_pose ? true : false
      const hasMagickRef = menuData.magick_ref ? true : false

      const setFromPose = !!hasMagickShape && !hasMagickRef ? [Markup.button.callback(`🔀 Взять позу`,`magick_pose_to_ref_${unic_id}`)] : []
      const cancelButton =  hasMagickRef ? [Markup.button.callback(`❌ Убрать референс`,`remove_magick_ref_${unic_id}`)] : []

      const buttons = Markup.inlineKeyboard([
         cancelButton,
         setFromPose,
         [Markup.button.callback("<< Назад", `go_magick_menu_${unic_id}`)]
      ])

      const messageClear = await ctx.editMessageText(baseMessage,{
         reply_markup: buttons.reply_markup,
         parse_mode: "MarkdownV2",
         disable_web_page_preview: true,
      })

      ctx.session.currectAction = "uploadMagickRef"
      ctx.session.menuId = unic_id
      ctx.session.messageToClear = messageClear.message_id
   })

   bot.action(/magick_pose_to_ref_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      await updateInstance(unic_id, "magick_ref", menuData.magick_pose)
      createTextMenuAndEdit(ctx, unic_id)
   })

   bot.action(/remove_magick_ref_(.*)/,async(ctx)=>{
      await updateInstance(ctx.match[1], "magick_ref", "")
      createTextMenuAndEdit(ctx, ctx.match[1])
   })

   bot.action(/remove_all_magick_(.*)/,async(ctx)=>{
      await updateInstance(ctx.match[1], "magick_ref", "")
      await updateInstance(ctx.match[1], "magick_pose", "")
      await updateInstance(ctx.match[1], "magick_shape", "")

      createTextMenuAndEdit(ctx, ctx.match[1])
   })

   // Model Choose

   bot.action(/go_model_menu_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      const model_page = await getModelPage(menuData.model_name)

      // console.log(model_page,"model_ppppaaaaaaaaageeee")

      await updateInstance(unic_id, "model_page", model_page)
      createModelMenu(ctx,unic_id)
   })

   bot.action(/model_next_page_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuData = await handleInstanceRequest(unic_id,ctx)
      
      if(menuData == null) return

      await updateInstance(unic_id, "model_page", menuData.model_page+1)
      createModelMenu(ctx,unic_id)
   })

   bot.action(/model_prev_page_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuData = await handleInstanceRequest(unic_id,ctx)
      
      if(menuData == null) return

      await updateInstance(unic_id, "model_page", menuData.model_page-1)
      createModelMenu(ctx,unic_id)
   })

   bot.action(/select_model_(.*)_(.*)/,async(ctx)=>{
      const model_name = ctx.match[1]
      const unic_id = ctx.match[2]

      const model = await getModelByName(model_name)
      const menuData = await handleInstanceRequest(unic_id,ctx)
      
      if(menuData == null) return

      console.log(menuData.model_name == model_name, model.has_alter_mode,model,menuData, "ТЕСТ" )
      if(menuData.model_name == model_name && model.has_alter_mode) {

         await updateInstance(unic_id, "enable_alter_model", !menuData.enable_alter_model)
         await updateInstance(unic_id, "sd_model", model.alter_model_stable_model)
         await createModelMenu(ctx, unic_id)
         return

      } else if(menuData.model_name == model_name){
         ctx.answerCbQuery("")
         return
      }

      let preset_name

      if(model.has_preset){
         preset_name = await getSelectedPresetBymodel_name(model_name)
         if(!preset_name){
            preset_name = await getDefaultPresetBymodel_name(model_name)
         }

         await updateInstance(unic_id, "preset_name", preset_name.preset_name)
      } else{
         await updateInstance(unic_id, "preset_name", "")
      }

      await updateInstance(unic_id, "model_name", model_name)
      await updateInstance(unic_id, "sd_model", model.stable_model)

      // console.log(model_name,preset_name)
      createModelMenu(ctx,unic_id)
   })

   // Presets
   bot.action(/model_select_presets_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      createPresetSelectMenu(ctx,unic_id)
   })

   bot.action(/select_preset_(.*)_(.*)/,async(ctx)=>{
      const preset_name = ctx.match[1]
      const unic_id = ctx.match[2]

      const modelData = await handleInstanceRequest(unic_id,ctx)
      if(modelData == null) return

      if(modelData.preset_name == preset_name) {
         ctx.answerCbQuery("")
         return
      }

      setPresetAsSelected(preset_name)
      await updateInstance(unic_id, "preset_name", preset_name)

      // console.log(model_name,preset_name)
      createPresetSelectMenu(ctx,unic_id)
   })


   // Img2Img Menu

   // Recycle menu
   bot.action(/go_recycle_menu_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]

      createSmartRecycleMenu(ctx,unic_id)
   })

   bot.action(/switch_recycle_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuData = await handleInstanceRequest(unic_id,ctx)
      if(menuData == null) return

      const recycle = menuData.img_2_smart_recycle ? false : true
      await updateInstance(unic_id, "img_2_smart_recycle", recycle)
      createTextMenuAndEdit(ctx, unic_id)
   })

   // Strenght
   bot.action(/go_strenght_menu_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      createStrengthMenu(ctx,unic_id)
   })

   bot.action(/change_strenght_(.*)_(.*)/,async(ctx)=>{
      const id = ctx.match[1]
      const unic_id = ctx.match[2]

      const strenght = await getStrenghtById(id)
      const menuData = await handleInstanceRequest(unic_id, ctx)


      if(strenght.name == menuData.img_2_img_strength) {
         ctx.answerCbQuery("")
         return
      }

      await updateInstance(unic_id, "img_2_img_strength", strenght.name)
      createStrengthMenu(ctx,unic_id)
   })


   // Generate

   bot.action(/generate_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuData = await getInstanceById(unic_id)

      console.log(menuData.sid, menuData.sid == 0)
      if(menuData.sid == 0){
         const new_sid = await generateRandomSeed()
         await updateInstanceSid(unic_id, new_sid)
      }
      
      let job;
      try{
         job = menuData.generation_type == "txt2img" ? await generateRequest(ctx, unic_id) : await generateRequestImg(ctx, unic_id)
         startGenerationPolling(job.job_id,ctx)
      } catch(e){
         console.log(e)
         ctx.reply("Ошибка!")
         return
      }

      const userPrefData = {
         default_model : menuData.model_name,
         default_ar : menuData.aspect_ratio,
         default_type : menuData.type,
      }

      await updateUserPreferences(ctx.from.id, userPrefData)

      console.log(job.job_id)

      const generation = await checkJobStatus(job.job_id)
      let isStarted = false

      if(generation.status == "started"){
         isStarted = true
      }

      const button = !isStarted ? [Markup.button.callback(`Отменить`,`cancel_gen_${job.job_id}`)] : []
      let baseMessage = !isStarted ? `*Генерация скоро начнется\\!*` : "*Генерация началась\\!*"

      ctx.editMessageText(`🏁 ${baseMessage}\n_Это займет около 20 секунд_`,{
         reply_markup: Markup.inlineKeyboard([button]).reply_markup,
         parse_mode: "MarkdownV2",
      })
      ctx.answerCbQuery("")
   })

   bot.action(/gen_again_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]

      const menuData = await getInstanceById(unic_id)
      const [new_unic_id,new_edit_id] = await generateUniqueId()

      menuData.unic_id = new_unic_id
      menuData.edit_id = new_edit_id
      menuData.sid = await generateRandomSeed()

      await createInstance(menuData)
      
      let job;
      try{
         job = menuData.generation_type == "txt2img" ? await generateRequest(ctx, new_unic_id) : await generateRequestImg(ctx, new_unic_id)
         startGenerationPolling(job.job_id,ctx,false,ctx.callbackQuery.message,"genAgain")
      } catch(e){
         console.log(e)
         ctx.reply("Ошибка!")
         return
      }

      console.log(job.job_id)

      const generation = await checkJobStatus(job.job_id)
      let isStarted = false

      if(generation.status == "started"){
         isStarted = true
      }

      const [baseMessage,buttons] = await createCreateMessageMarkup(unic_id,null,"again",job.job_id)
      
      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"🔁 Делаем Повтор!\nЭто займет 20 секунд",{show_alert:true}
       );

      await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup)
      // const [statusData, ctx, message] = await createCompleteMenu(statusData,ctx)
   })

   bot.action(/variations_gen_menu_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]

      let baseMessage = `🔀 Понравился арт, но хочется *вариативности?*
Мы можем создать для тебя похожую генерацию с новыми деталями всего в один клик\\!`
      
      const button = [
         [Markup.button.callback("🔀 Вариация ( 10т )",`variations_gen_start_${unic_id}_true`)],
         [Markup.button.callback("Назад",`return_gen_${unic_id}`)]
      ]

      ctx.editMessageCaption(baseMessage, {
         reply_markup: Markup.inlineKeyboard(button).reply_markup,
         parse_mode: "MarkdownV2"
     });
   })

   bot.action(/return_var_(.*)/,async (ctx) => {
      const unic_id = ctx.match[1]

      const [fullMessage,buttons] = await createCreateMessageMarkupVar(unic_id)

      await ctx.editMessageCaption(fullMessage, {
         reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
         parse_mode: "MarkdownV2"
      })
   })

   bot.action(/upscale_gen_menu_(.*)_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuType = ctx.match[2]
    
      let baseMessage = `🔥 [*HyperScale 2\\.1*](https://telegra.ph/HyperScale---Stable-Waifu-05-18) \– революционная технология для многократного улучшения детализации и проработки наших артов до уровня профессиональных ИИ художников\\!
[*примеры и описание*](https://telegra.ph/HyperScale---Stable-Waifu-05-18)`
    
      baseMessage+=`\n\n*1 арт \– 20 токенов* \\([15 с Waifu\\+](https://t.me/StableWaifuBot?start=waifu_plus)\\)`
      baseMessage+=`\n\n_Также доступен упрощённый [Upscale x2](https://telegra.ph/Primer-Upscale-x2-04-07) за 5 токенов \\/ бесплатно с [Waifu\\+](https://t.me/StableWaifuBot?start=waifu_plus)_`
      
      console.log(menuType)
      const returnCallback = menuType == "gen" ? `return_gen_${unic_id}` : `return_var_${unic_id}`
      const specifyMenuSimple = menuType == "gen" ? `upscale_simple_start_${unic_id}_gen` : `upscale_simple_start_${unic_id}_var`
      const specifyMenuComplex = menuType == "gen" ? `upscale_complex_start_${unic_id}_gen` : `upscale_complex_start_${unic_id}_var`

      const button = [
         [Markup.button.callback("🆙 Upscale 2x",specifyMenuSimple),Markup.button.callback("🔥 HyperScale",specifyMenuComplex)],
         [Markup.button.callback("<< Назад",returnCallback)]
      ]
    
      ctx.editMessageCaption(baseMessage, {
         reply_markup: Markup.inlineKeyboard(button).reply_markup,
         parse_mode: "MarkdownV2"
     });
    })


    bot.action(/upscale_simple_start_(.*)_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuType = ctx.match[2]

      const menuData = await getInstanceById(unic_id)
      const new_unic_id = menuData.unic_id

      let job;
      try{
         job = await simpleUpscaleRequest(ctx, new_unic_id)
         startGenerationPolling(job.job_id,ctx,false,ctx.callbackQuery.message,`simple_upscale_${menuType}`)
      } catch(e){
         console.log(e)
         ctx.reply("Ошибка!")
         return
      }

      console.log(job.job_id)

      const generation = await checkJobStatus(job.job_id)
      let isStarted = false

      if(generation.status == "started"){
         isStarted = true
      }

      // const [baseMessage,buttons] = await createCreateMessageMarkup(unic_id,null,"again",job.job_id)
      
      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"🆙 Увеличиваем ваше изображение!\nЭто займет 20 секунд",{show_alert:true}
       );

       if(menuType == "gen"){
         const [baseMessage,buttons] = await createCreateMessageMarkup(unic_id, null, "scale", job.job_id)
         await ctx.editMessageCaption(baseMessage, {
            reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
            parse_mode: "MarkdownV2"
         })

         return
       }

       const [baseMessage,buttons] = await createCreateMessageMarkupVar(unic_id,null,"scale",job.job_id)
       await ctx.editMessageCaption(baseMessage, {
         reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
         parse_mode: "MarkdownV2"
       })

      // await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup)
    })

    bot.action(/upscale_complex_start_(.*)_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const menuType = ctx.match[2]

      const menuData = await getInstanceById(unic_id)
      const new_unic_id = menuData.unic_id

      let job;
      try{
         job = await complexUpscaleRequest(ctx, new_unic_id)
         startGenerationPolling(job.job_id,ctx,false,ctx.callbackQuery.message,`complex_upscale_${menuType}`)
      } catch(e){
         console.log(e)
         ctx.reply("Ошибка!")
         return
      }

      console.log(job.job_id)

      const generation = await checkJobStatus(job.job_id)
      let isStarted = false

      if(generation.status == "started"){
         isStarted = true
      }

      // const [baseMessage,buttons] = await createCreateMessageMarkup(unic_id,null,"again",job.job_id)
      
      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"🔥 Используем поледние слово в upscale что бы увеличить качество вашего изображения\n\n~Время ожидания около 1 минуты",{show_alert:true}
       );

       if(menuType == "gen"){
         const [baseMessage,buttons] = await createCreateMessageMarkup(unic_id, null, "scale", job.job_id)
         await ctx.editMessageCaption(baseMessage, {
            reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
            parse_mode: "MarkdownV2"
         })

         return
       }

       const [baseMessage,buttons] = await createCreateMessageMarkupVar(unic_id,null,"scale",job.job_id)
       await ctx.editMessageCaption(baseMessage, {
         reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
         parse_mode: "MarkdownV2"
       })

      // await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup)
    })



   bot.action(/variations_gen_start_(.*)_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      const editMessage = ctx.match[2]

      const menuData = await getInstanceById(unic_id)

      const oldUnicId = menuData.unic_id
      const [new_unic_id,new_edit_id] = await generateUniqueId()


      console.log(menuData.variation_sid,"BEFORE")
      menuData.unic_id = new_unic_id
      menuData.edit_id = new_edit_id
      menuData.subsid_id = unic_id
      menuData.variation_sid = await generateRandomSeed()
      console.log(menuData.variation_sid)
      await createInstance(menuData,"AFTER")

      const varString = editMessage == "varmenu" ? "varm" : "var"

      let job;
      try{
         job = menuData.generation_type == "txt2img" ? await generateRequest(ctx, new_unic_id) : await generateRequestImg(ctx, new_unic_id)
         startGenerationPolling(job.job_id,ctx,false,ctx.callbackQuery.message,varString)
      } catch(e){
         console.log(e)
         ctx.reply("Ошибка!")
         return
      }

      console.log(job.job_id)

      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"🔁 Делаем что-то похожие!\nЭто займет 20 секунд",{show_alert:true}
       );

       if(editMessage == "varmenu"){
         const [finaleMessage,buttons] = await createCreateMessageMarkupVar(oldUnicId,null,"again",job.job_id)
      //    ctx.editMessageCaption({
      //      reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
      //      parse_mode: "MarkdownV2"
      //  })
      ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup)
       }
       
       if(editMessage == "true"){
         const [finaleMessage,buttons] = await createCreateMessageMarkup(unic_id,null,"var",job.job_id)
         ctx.editMessageCaption(finaleMessage,{
           reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
           parse_mode: "MarkdownV2"
       })
       } 
       

   })

   bot.action(/cancel_upscale_(.*)_(.*)/,async(ctx)=>{
      const job_id = ctx.match[1]
      const typeMenu = ctx.match[2]

      const unic_id = await getUnicIdByJobId(job_id)
      const canCancel = await checkJobStatus(job_id)

      if(canCancel.status == "started"){
         await ctx.telegram.answerCbQuery(
            ctx.callbackQuery.id,"‼ Генерация уже началась и мы не можем отменить её, пожалуйста ожидайте",{show_alert:true}
          );
          return
      }

      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"❤ Операция успешно отменена, мы вернули ваши токены на баланс!",{show_alert:true}
       );

      await cancelGen(job_id)
      
      let baseMessage,buttons;
      if(typeMenu == "gen"){
       [baseMessage,buttons] = await createCreateMessageMarkup(unic_id)
      }

      if(typeMenu == "var"){
         [baseMessage,buttons] = await createCreateMessageMarkupVar(unic_id) 
      }

      await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup)

   })

   bot.action(/return_gen_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      
      const [finaleMessage,buttons] = await createCreateMessageMarkup(unic_id)

      ctx.editMessageCaption(finaleMessage,{
         reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
         parse_mode: "MarkdownV2"
      })
   })

   
   bot.action(/cancel_var_(.*)_(.*)/,async(ctx)=>{
      const job_id = ctx.match[1]
      const typeMenu = ctx.match[2]

      const unic_id = await getUnicIdByJobId(job_id)
      const canCancel = await checkJobStatus(job_id)

      if(canCancel.status == "started"){
         await ctx.telegram.answerCbQuery(
            ctx.callbackQuery.id,"‼ Генерация уже началась и мы не можем отменить её, пожалуйста ожидайте",{show_alert:true}
          );
          return
      }

      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"❤ Операция успешно отменена, мы вернули ваши токены на баланс!",{show_alert:true}
       );

      await cancelGen(job_id)
      
      let baseMessage,buttons;
      if(typeMenu == "main"){
       [baseMessage,buttons] = await createCreateMessageMarkup(unic_id)
      }

      if(typeMenu == "var"){
         [baseMessage,buttons] = await createCreateMessageMarkupVar(unic_id) 
      }

      await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup)

   })

   bot.action(/return_gen_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      
      const [finaleMessage,buttons] = await createCreateMessageMarkup(unic_id)

      ctx.editMessageCaption(finaleMessage,{
         reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
         parse_mode: "MarkdownV2"
      })
   })

   bot.action(/cancel_again_gen_(.*)/,async(ctx)=>{
      const job_id = ctx.match[1]

      const unic_id = await getUnicIdByJobId(job_id)
      const canCancel = await checkJobStatus(job_id)

      if(canCancel.status == "started"){
         await ctx.telegram.answerCbQuery(
            ctx.callbackQuery.id,"‼ Генерация уже началась и мы не можем отменить её, пожалуйста ожидайте",{show_alert:true}
          );
          return
      }

      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"❤ Операция успешно отменена, мы вернули ваши токены на баланс!",{show_alert:true}
       );

      await cancelGen(job_id)

      const [baseMessage,buttons] = await createCreateMessageMarkup(unic_id)
      await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup)
   })

   bot.action(/cancel_gen_(.*)/,async(ctx)=>{
      const job_id = ctx.match[1]

      const unic_id = await getUnicIdByJobId(job_id)
      const canCancel = await checkJobStatus(job_id)

      if(canCancel.status == "started"){
         await ctx.telegram.answerCbQuery(
            ctx.callbackQuery.id,"‼ Генерация уже началась и мы не можем отменить её, пожалуйста ожидайте",{show_alert:true}
          );
          return
      }

      await ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"❤ Операция успешно отменена, мы вернули ваши токены на баланс!",{show_alert:true}
       );

      await cancelGen(job_id)

       createTextMenuAndEdit(ctx, unic_id)
   })

   bot.action(/change_gen_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]

      const menuData = await getInstanceById(unic_id)
      const [new_unic_id,new_unic_edit] = generateUniqueId()

      menuData.unic_id = new_unic_id
      menuData.edit_id = new_unic_edit
      menuData.sid = 0

      console.log(ctx.message)

      const replyId = ctx.callbackQuery.message.message_id;

      await createInstance(menuData)
      await createTextMenuAndReply(ctx, unic_id,null,replyId)

      ctx.answerCbQuery("")
   })
   
   
   bot.action(/back_(.*)/,async(ctx)=>{
      const unic_id = ctx.match[1]
      createTextMenuAndEdit(ctx,unic_id)
   })

   bot.action("wait_message_gen",async(ctx)=>{
      ctx.telegram.answerCbQuery(
         ctx.callbackQuery.id,"⏳ Подождите пока выбранная вами генерация закончится",{show_alert:true}
         )

      ctx.answerCbQuery("")
   })
});
