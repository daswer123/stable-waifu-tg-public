import { bot } from "./bot.js";
import { Markup } from "telegraf";
import { getInstanceById, getInstanceCreatedTimeById, handleInstanceRequest, updateInstance } from "../backend/db/db_prompts.js";
import { escapeMarkdown, sortButtonsInRow, sortPresetButtonsInRow } from "../utils/funcs.js";
import { getARByRatio, getARByType, getAllModels, getAllModelsPreset, getAllStrenghtSettings, getDefaultPresetBymodel_name, getModelByName, getPresetByName, getStrenghtByName } from "../backend/db/db_settings.js";
import { modelsPerPage } from "../utils/variables.js";

const BASE_TEXT = `Генерация *по описанию* Проверь настройки и жми на кнопку начала\\!`;
const BASE_TEXT_IMG = `Генерация *по картинке* Проверь настройки и жми на кнопку начала\\!`;

export async function createTextMenu(ctx, unic_id, baseText = null) {
  const menuData = await handleInstanceRequest(unic_id,ctx)
  if(menuData == null) return

  // console.log(menuData)

  if(!baseText){
    baseText = menuData.generation_type == "txt2img" ? BASE_TEXT : BASE_TEXT_IMG
  }

  // Set Params
  ctx.session.menuId = null;
  ctx.session.messageToClear = null;
  ctx.session.currectAction = null;

  // console.log(ctx.session,"INIT")

  const hasMagick = (menuData.magick_ref || menuData.magick_pose || menuData.magick_shape)

  // IMG2IMG PARAMS
  const smartRecycleString = menuData.img_2_smart_recycle ?  `└ ♻️ SmartRecycle` : ""

  // Get OtherParams
  const presetString = menuData.preset_name ? `${menuData.sid || hasMagick || smartRecycleString ? "├" : "└"} ✨ Пресет: *${menuData.preset_name}*\n` : ``;
  const sidString = menuData.sid ? `${(hasMagick || smartRecycleString) ? "├" : "└"} 🌱 Сид: \`${menuData.sid}\`\n` : ``;
  const extraChars = menuData.extra_chars ? `Персонаж\\(и\\): \`${menuData.extra_chars}\`\n` : ""
  const extraTags = menuData.extra_tags ? `Тег\\(и\\): \`${menuData.extra_tags}\`\n` : "";
  const extraWords = menuData.extra_word ? `Магические слова: \`${menuData.extra_word}\`\n` : "";
  
// TXT2IMG MAGICK STRING
  const magickRefString = menuData.magick_ref ? "Референс" : null;
  const magickPoseString = menuData.magick_pose?  "Поза" : null;
  const magickShapeString = menuData.magick_shape ? "Фигура" : null;
  const magickList = [magickRefString,magickPoseString,magickShapeString].filter(Boolean);
  const magickString = hasMagick ? `└ 🪄 *${magickList.join(", ")}*` : ``;

  const hasVarSeed = menuData.variation_sid ? true : false 
  const varString = hasVarSeed ? `${magickString ? `├` : `└`}🔀 По сиду *вариации*\n` : ``

  const isMagickWordsParams =  extraChars || extraTags || extraWords ? true : false
  const magickWordsParams = `\n\n*Магические cлова и теги*\n${extraChars}${extraTags}${extraWords}`

  const otherSettingsString = `*Другие параметры*\n${presetString}${sidString}${varString}${magickString}${smartRecycleString}`;
  const isOtherParam = presetString || sidString || magickString || smartRecycleString ? true : false;
  // console.log(isOtherParam)

  const CUSTOM_SYMBOL = baseText == BASE_TEXT || baseText == BASE_TEXT_IMG  ? "🎨 " : "";

  const additionalInfo = `\\> _[Стили и навыки](https://telegra.ph/Stili-i-vozmozhnosti-StableWaifuBot-06-05)_\n\\> _[Аниме персонажи](https://telegra.ph/Personazhi-iz-anime-i-igr-v-StableWaifuBot-04-13)_`;
  const prompt = `${CUSTOM_SYMBOL}\`${escapeMarkdown(menuData.prompt)}\`\n[изменить](https://t.me/SD_Daswer_bot?start=${menuData.edit_id})`;

  // const otherParamsTest =  `\n\nСид:[Проверка](https://t.me/SD_Daswer_bot?start=${menuData.unic_id})\n\n`
  const otherParamsTest = ``;

  const otherParams = isOtherParam ? otherSettingsString : ``;
  const magickWordsParamsString = isMagickWordsParams ? magickWordsParams : ``

  const isPortarait = menuData.type == "portrait" ? "📱 Портрет" : "🖼 Ландшафт";
  const arSymbol = menuData.type == "portrait" ? "^" : ">"

  // NEGATIVE
  const hasNegative = menuData.negative_prompt ? true : false;
  const extraNegativeString = menuData.negative_mode == "simple" ? "\\+ " : " "
  const negativeString = hasNegative ? `🙅${extraNegativeString}\`${menuData.negative_prompt}\`\n\n` : ``;
  

  const fullMessageText = `${baseText}\n\n${prompt}\n\n${negativeString}${additionalInfo}${otherParamsTest}${magickWordsParamsString}\n${otherParams}`;

//  Get exra symbol if model has alter mode
  const modelData = await getModelByName(menuData.model_name)
  const extraModelSymbol = modelData.has_alter_mode ? menuData.enable_alter_model ? modelData.alter_model_confirm_cymbol : modelData.confirm_cymbol : ""

  const buttonsTxt2Img = [
    [Markup.button.callback(`⚙️ Модель: ${menuData.model_name} ${extraModelSymbol}`, `go_model_menu_${unic_id}`)],
    [Markup.button.callback(`🌱 Сид`, `set_sid_${unic_id}`), Markup.button.callback(isPortarait, `swap_ar_${unic_id}`)],
    [Markup.button.callback(`🙅 Негатив`, `go_negative_menu_${unic_id}`), Markup.button.callback(`🪄 Магия`, `go_magick_menu_${unic_id}`)],
    [Markup.button.callback(`📐 Соотношение - ${menuData.aspect_ratio} ${arSymbol}`, `go_ar_menu_${unic_id}`)],
    [Markup.button.callback(`🎉 Начать (10т) `, `generate_${unic_id}`)],
  ];

  const smartRecycleCallback = menuData.img_2_smart_recycle ? `switch_recycle_${unic_id}` : `go_recycle_menu_${unic_id}`
  const smartRecycleBtnName = `${menuData.img_2_smart_recycle ? "❌ ":"♻️ "} SmartRecycle ${menuData.img_2_smart_recycle ? " ❌":""}`

  // IMGIMG settings
  const buttonsImg2Img = [
    [Markup.button.callback(`⚙️ Модель: ${menuData.model_name} ${extraModelSymbol}`, `go_model_menu_${unic_id}`)],
    [Markup.button.callback(`🌱 Сид`, `set_sid_${unic_id}`), Markup.button.callback(`🙅 Негатив`, `go_negative_menu_${unic_id}`)],
    [Markup.button.callback(smartRecycleBtnName, smartRecycleCallback)],
    !menuData.img_2_smart_recycle ? [Markup.button.callback(`💪🏻 Сила: ${menuData.img_2_img_strength}`, `go_strenght_menu_${unic_id}`)] : [],
    [Markup.button.callback(`🎉 Начать (5т) `, `generate_${unic_id}`)],
  ];


  // Select message and settings for generationType
  const fullMessage = fullMessageText
  const buttons =  menuData.generation_type == "txt2img" ? buttonsTxt2Img : buttonsImg2Img

  return [fullMessage, buttons];

  // ctx.replyWithMarkdownV2(fullMessage,{
  //     disable_web_page_preview: true,
  //     reply_markup: Markup.inlineKeyboard(buttons).reply_markup
  // })
}

export async function createTextMenuAndReply(ctx, unic_id, baseText = null,replyMessage = null) {

  const result = await createTextMenu(ctx, unic_id, baseText);
  if(result == null) return

  const [fullMessage, buttons] = result

  await ctx.replyWithMarkdownV2(fullMessage, {
    disable_web_page_preview: true,
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    reply_to_message_id: replyMessage
  });
}

export async function createTextMenuAndEdit(ctx, unic_id, baseText = null,replyMessage = null) {
  const result = await createTextMenu(ctx, unic_id, baseText);
  if(result == null) return

  const [fullMessage, buttons] = result

  await ctx.editMessageText(fullMessage, {
    disable_web_page_preview: true,
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    parse_mode: "MarkdownV2",
    reply_to_message_id: replyMessage
  });
}

export async function createImgMenuAndEdit(ctx, unic_id, baseText = null, replyMessage = null, messageToEdit = null) {

  const result = await createTextMenu(ctx, unic_id, baseText);
  if(result == null) return

  const [fullMessage, buttons] = result

  // Check if messageToEdit was provided
  if (messageToEdit) {
    await ctx.telegram.editMessageText(messageToEdit.chat.id, messageToEdit.message_id, undefined, fullMessage, {
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
      parse_mode: "MarkdownV2",
    });
  } else {
    await ctx.editMessageText(fullMessage, {
      disable_web_page_preview: true,
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
      parse_mode: "MarkdownV2",
      reply_to_message_id: replyMessage,
    });
  }
}

export async function createARMenu(ctx, unic_id) {
  const menuData = await handleInstanceRequest(unic_id,ctx)
  if(menuData == null) return

  const ar = await getARByRatio(menuData.aspect_ratio);
  const img_link = ar.img_link

  const isPortarait = menuData.type == "portrait" ? true : false;
  const baseDesk = `📐 *Соотношение сторон* определяет пропорции результата\\. Это полезно, если ты хочешь арт на обои или с расчётом на определённые задачи\\.\n_\\*Рекомендуем *${isPortarait ? "2:3" : "3:2"}* для общего использования, а ориентация переключается двойным нажатием\\._\n[ ](${img_link})`;
  
  const ARvarios = await getARByType(menuData.type);

  // Create button 3 row
  const buttons = [];

  for (let i = 0; i < ARvarios.length; i += 3) {
    let tempArray = [];

    // Add up to 3 items to temporary array
    for (let j = i; j < i + 3 && j < ARvarios.length; j++) {
      const aspect_ratio = ARvarios[j].ratio;

      let chosenBtn = ""
      if(aspect_ratio == menuData.aspect_ratio){
        chosenBtn = "✅"
      }
      tempArray.push(Markup.button.callback(`${chosenBtn}${aspect_ratio}`, `set_ar_${aspect_ratio}_${unic_id}`));
    }

    // Push temporary array to main buttons array
    buttons.push(tempArray);
  }

  // Add Save button at the end
  buttons.push([Markup.button.callback("Cохранить", `back_${unic_id}`)]);

  ctx.editMessageText(baseDesk,{
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    parse_mode: "MarkdownV2"
  });

}

export async function createNegativeMenu(ctx,unic_id){
  const baseMessage = `
🙅‍♂️ *Негативный ввод* отвечает за качество, стилистику и корректность результата\\.
Мы уже позаботились о его настройке, поэтому тебе не нужно ничего делать, но мы оставили возможность его замены для искателей новых ощущений и большего контроля\\.`

  const optionsMessage = `
*Доступные опции:*
– ✨ Упрощённый
 Позволяет добавить твой ввод к нашему\\. В таком случае вероятность что\\-то сломать гораздо ниже, но и эффект более слабый\\.
– Экспертный
 Позволяет взять полный контроль над негативным вводом, но может испортить генерации в неумелых руках\\.
`

  const finalMessage = `${baseMessage}$\n${optionsMessage}`

  const menuData = await handleInstanceRequest(unic_id,ctx)
  if(menuData == null) return

  const hasNegative = menuData.negative_prompt ? true : false;
  
  const buttons = Markup.inlineKeyboard([
    hasNegative ? [Markup.button.callback("❌ Вернуть стандартный",`reset_negative_${unic_id}`)] : [],
    [Markup.button.callback("Экспертный",`set_negative_expert_${unic_id}`),Markup.button.callback("✨ Упрощенный",`set_negative_simple_${unic_id}`)],
    [Markup.button.callback("<< Назад",`back_${unic_id}`)]
  ])

  const messageClear = await ctx.editMessageText(finalMessage,{
    reply_markup: buttons.reply_markup,
    parse_mode: "MarkdownV2"
  })

  await updateInstance(unic_id, "negative_mode","simple")

  ctx.session.currectAction = "editNegativeSimple"
  ctx.session.menuId = unic_id
  ctx.session.messageToClear = messageClear.message_id
}

export async function createMagickMenu(ctx, unic_id){
  const baseMessage = `⚡️ *Магия* даёт больше контроля над генерацией\\. Просто выбери нужное _заклинание_ и следуй инструкции\\!

*Фигура* \– нарисуй скрытый узор или текст в определённом участке арта\\.
  
*Референс* \– перенеси настроение другой картинки в свои генерации\\.
  
*Поза* \– с лёгкостью настрой положение персонажей на арте\\.`

  const menuData = await handleInstanceRequest(unic_id,ctx)
  if(menuData == null) return

  const hasMagick = (menuData.magick_ref || menuData.magick_shape || menuData.magick_pose) ? true : false
  const cancelButton = hasMagick ? [Markup.button.callback("❌ Убрать магию", `remove_all_magick_${unic_id}`)] : []

  const buttons = Markup.inlineKeyboard([
    cancelButton,
    [Markup.button.callback("Фигура", `set_magick_shape_${unic_id}`),Markup.button.callback("Поза", `set_magick_pose_${unic_id}`)],
    [Markup.button.callback("Референс", `set_magick_ref_${unic_id}`)],
    [Markup.button.callback("<< Назад", `back_${unic_id}`)]
  ])

  await ctx.editMessageText(baseMessage,{
    reply_markup: buttons.reply_markup,
    parse_mode: "MarkdownV2"
  })

  ctx.session.currectAction = null
  ctx.session.menuId = null
  ctx.session.messageToClear = null
}

export async function createModelMenu(ctx,unic_id){
    const menuData = await handleInstanceRequest(unic_id,ctx)
    if(menuData == null) return

    const models = await getAllModels()

    const currentModel = await getModelByName(menuData.model_name)
    let model_page = menuData.model_page
    const maxPages = Math.ceil(models.length/modelsPerPage)

    if(model_page >= maxPages){
      await updateInstance(unic_id, "model_page", 0)
      model_page = 0;
    }

    if(model_page < 0){
      await updateInstance(unic_id, "model_page", maxPages-1)
      model_page = maxPages-1;
    }

    // console.log(model_page)
    let modelsPull = []

    // Calculate start index and end index for slice
    let startIndex =model_page*modelsPerPage;
    let endIndex=(model_page+1)*modelsPerPage;
    // endIndex--

    // Get page of currect mode
    const currentModelData = models.filter(model=>model.model_name == currentModel.model_name)
    const currentmodel_page = Math.floor(models.indexOf(currentModelData[0]) / modelsPerPage)

    models.length>=endIndex ? modelsPull=models.slice(startIndex,endIndex) : modelsPull=models.slice(startIndex,models.length);
    const extraModelSymbol = currentModel.has_alter_mode ? menuData.enable_alter_model ? currentModel.alter_model_confirm_cymbol : currentModel.confirm_cymbol : ""
    let modelMessage =`*${currentModel.model_name}* ${extraModelSymbol} [ ](${currentModel.img_link})\n${escapeMarkdown(currentModel.description)}`

    modelMessage+=`\n\n_В [нашем канале](https://t.me/StableWaifu) можно найти кучу примеров из сообщества\\!_`

    // Check presets
    const has_preset = currentModel.has_preset ? true : false
    const preset_name = menuData.preset_name ? menuData.preset_name : has_preset ? await getDefaultPresetBymodel_name(currentModel.model_name).preset_name : ""
    const presetButton = has_preset ? [Markup.button.callback(`✨ Пресет ${currentModel.model_name}: ${preset_name}`, `model_select_presets_${unic_id}`),] : []

    // Create Navigate check mark
    // If the current page is the first page and the selected model is on the last page:
    let navigateToModelPrev = model_page === 0 && currentmodel_page === maxPages - 1 ? "✓" : "";

    // If the current page is the last page and the selected model is on the first page:
    let navigateToModelNext = model_page === maxPages - 1 && currentmodel_page === 0 ? "✓" : "";

    // For all other cases:
    !navigateToModelPrev ?  navigateToModelPrev = model_page - 1 === currentmodel_page ? "✓" : "" : ""
    !navigateToModelNext ?  navigateToModelNext = model_page + 1 === currentmodel_page ? "✓" : "" : ""


    const buttons = await sortButtonsInRow(modelsPull,currentModel.model_name,unic_id, 3)
    buttons.push([
      Markup.button.callback(`<< ${navigateToModelPrev}`, `model_prev_page_${unic_id}`),
      Markup.button.callback(`${model_page+1} / ${maxPages}`, `model_current_page`),
      Markup.button.callback(`${navigateToModelNext} >>`, `model_next_page_${unic_id}`)
    ])
    has_preset ? buttons.push(presetButton) : [],
    buttons.push([Markup.button.callback("Сохранить", `back_${unic_id}`)])

    ctx.editMessageText(modelMessage,{
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
      parse_mode: "MarkdownV2"
    })
}

export async function createPresetSelectMenu(ctx,unic_id){
  const menuId = await handleInstanceRequest(unic_id,ctx)
  if(menuId == null) return

  const presets = await getAllModelsPreset(menuId.model_name)

  const currentPreset = presets.find(preset => preset.preset_name === menuId.preset_name)
  let sufix = ``
  if(currentPreset.is_default){
    sufix = `*\\(_по\\-умолчанию_\\)*`
  }

  let baseMessage = `✨ *${currentPreset.preset_name}* ${sufix} [ ](${currentPreset.img_link})
${escapeMarkdown(currentPreset.description)}`
  baseMessage+=`\n\n_\\*Пресеты позволяют получить оптимальное изображение на любой вкус\\._`

  const buttons = await sortPresetButtonsInRow(presets, currentPreset.preset_name, unic_id,2)
  buttons.push([Markup.button.callback("Сохранить", `go_model_menu_${unic_id}`)])

  ctx.editMessageText(baseMessage,{
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    parse_mode: "MarkdownV2"
  })
}

export async function createSmartRecycleMenu(ctx, unic_id) {
  let baseMessage = `♻️ SmartRecycle полностью переработает твоё изображение в стиль наших моделей в высоком разрешении\\!`;

  baseMessage += `\n\n__В чем отличие от обычной обработки?__
\– *SmartRecycle* не просто меняет исходник, а создаёт на его основе новый качественный арт, который выглядит, как генерация по описанию\\.`;

  baseMessage += `\n\n❗️ Цвета, внешность объектов и стиль целиком зависят от твоего *ввода*\\!`;

  baseMessage += `[ ](https://telegra.ph/file/f962c6dbf4ef1d60c65d7.png)`;

  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback("♻️ Активировать (+5т)", `switch_recycle_${unic_id}`)],
    [Markup.button.callback("<< Назад", `back_${unic_id}`)],
  ]);

  await ctx.editMessageText(baseMessage, {
    reply_markup: buttons.reply_markup,
    parse_mode: "MarkdownV2",
  });
}

export async function createStrengthMenu(ctx, unic_id) {
  const menuData = await handleInstanceRequest(unic_id,ctx)
  if(menuData == null) return

  const currentStrength = await getStrenghtByName(menuData.img_2_img_strength);
  const allStrenghtSettings = await getAllStrenghtSettings();

  // console.log(currentStrength,"Sfsfsfsf")

  let baseMessage = `💪 Сила определяет, насколько модель изменит твоё изображение при обработке\\!`;

  baseMessage += `\n*\\> ${currentStrength.name}* ${escapeMarkdown(currentStrength.description)}`;
  baseMessage += `[ ](${currentStrength.img_link})`;

  let buttons = [];

  // Create Buttons as 2,1,2
  for (let i = 0; i < allStrenghtSettings.length - 1; i += 3) {
    if (allStrenghtSettings[i + 1]) {
        let selectedButton1 = allStrenghtSettings[i].name == menuData.img_2_img_strength ? '✅ ' : '';
        let selectedButton2 = allStrenghtSettings[i + 1].name == menuData.img_2_img_strength ? '✅ ' : '';

        let buttonRow = [
            Markup.button.callback(selectedButton1 + allStrenghtSettings[i].name,`change_strenght_${allStrenghtSettings[i].id}_${unic_id}`),
            Markup.button.callback(selectedButton2 + allStrenghtSettings[i + 1].name,`change_strenght_${allStrenghtSettings[i + 1].id}_${unic_id}`)
        ];
        buttons.push(buttonRow);
    }

    if (allStrenghtSettings[i + 2]) { // Ensure that this element exists before accessing it
        let selectedButton3 = allStrenghtSettings[i+2].name == menuData.img_2_img_strength ? '✅ ': '';

        let singleButtonRow = [Markup.button.callback(selectedButton3+allStrenghtSettings[i+2].name, `change_strenght_${allStrenghtSettings[i+2].id}_${unic_id}`)];

        buttons.push(singleButtonRow);
    }
  }


  buttons.push([Markup.button.callback("Сохранить", `back_${unic_id}`)]);

  ctx.editMessageText(baseMessage, {
     reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
     parse_mode: "MarkdownV2",
  });
}


export async function replyGreatingMessage(ctx) {
  const gretingMessage = `  
👋🏻 Привет\\! Тут каждый может создать свои аниме арты *потрясающего качества* на основе самого передового генеративного ИИ\\.
    
*Хочешь сразу к делу?*
*\\>* Просто напиши, что желаешь увидеть\\. Мы поддерживаем все языки :\\)
Если нужно сделать портрет, начни с описания внешности\\. А ещё ты можешь отправить сюда свою картинку, и мы обработаем её в нашем стиле\\!
    
Множество артов от сообщества можно найти в *[нашем канале](https://t.me/stable_anime_blog)*\\.
_\\*Хочешь узнать больше? Ознакомься с нашим пошаговым обучением\\!_ 👇🏻`;
  const buttons = Markup.inlineKeyboard([[Markup.button.url("Обучение с примерами", "https://telegra.ph/Obuchenie-Stable-Anime-02-24")]]);

  await ctx.replyWithPhoto("https://telegra.ph/file/ce3bd783f6a4ac83489c3.png",{
    caption : gretingMessage,
    reply_markup : buttons.reply_markup,
    parse_mode : "MarkdownV2"
  })
}

export async function createTokensMenu(ctx){

  const TOKENS = 120
  const FREE_BONUS = 4

  let baseMessage = `💵 Доступные токены: *${TOKENS}*\n`
        baseMessage += `_1 иллюстрация \\~ 10 токенов_`

        baseMessage+=`\n\n*Токены* — внутренняя валюта, которая используется для генерации артов\\. Каждый день, в 02:00 \\(МСК\\), вам выдаётся \\+20 токенов, если на вашем балансе их меньше 20\\.`
    
        baseMessage+=`\n\n🔁 Бонусные повторы: *${FREE_BONUS}*`
        baseMessage+=`\n_сбрасываются в 02:00 \\(МСК\\), действуют только при нажатии на кнопку под результатом_`

        const buttons = [
            [Markup.button.callback("💎 Пополнить баланс","tokens_buy")],
            [Markup.button.callback("👤 Привести друга","referal")],
            [Markup.button.callback("🎁 Бонусные токены","bonus_tokens")],
        ]

        return [baseMessage,buttons]
}

export async function createTokensMenuAndReply(ctx){
  const [baseMessage,buttons] = await createTokensMenu(ctx)

  await ctx.replyWithMarkdownV2(baseMessage, {
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}

export async function createTokensMenuAndEdit(ctx){
  const [baseMessage,buttons] = createTokensMenu(ctx)

  await ctx.editMessageText(baseMessage, {
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    parse_mode: "MarkdownV2",
  });
}

export async function createGiftTokenMenu(ctx){
  let baseMessage = `Дарим токены *${ctx.session.userNameSendGift}*\\.`
    baseMessage+=`\nВведи числом количество токенов, которое хочешь передать этому человеку\\. Они будут списаны с твоего баланса\\!`
    baseMessage+=`\n_\\*Минимальное количество \\- 10 токенов_`

    const buttons = [
      [Markup.button.callback(`👻 Анонимно: ${ctx.session.isAnonim ? "Да" : "Нет"}`, 'change_anonim_gift_token')],
      ctx.session.userNoteSendGift ? [Markup.button.callback('📝 Изменить подпись', 'change_notes_gift_token')] : [Markup.button.callback('📝 Подпись к подарку', 'change_notes_gift_token')]
   ]

   ctx.session.currectAction = ""

    return [baseMessage, buttons]
}

export async function createGiftTokenMenuAndReply(ctx){
  const [baseMessage, buttons] = await createGiftTokenMenu(ctx)

  await ctx.replyWithMarkdownV2(baseMessage, {
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
  });
}

export async function createGiftTokenMenuAndEdit(ctx){
  const [baseMessage, buttons] = await createGiftTokenMenu(ctx)

  await ctx.editMessageText(baseMessage, {
    reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    parse_mode: "MarkdownV2",
  });
}

// export async function createTokenBuyMenu(ctx){

//   let baseMessage = `*Выбери количество токенов\\.*`
//   baseMessage+=`Больше - выгоднее, но ты можешь платить только за то количество, которое используешь\\!`
//   baseMessage+=`_Подписчики 💎 *Waifu\\+* имеют скидку в 10% на покупку токенов\\!_`

// }
import fs from "fs/promises";
import path from "path";

export async function createCompleteMenu(statusData,ctx,isFirst = true,message_id = null,extraTag = ``,extraFolder = 'txt2img'){
  console.log('Задача выполнена:', statusData.result,statusData);

  const imageBuffer = Buffer.from(statusData.result.img, "base64");
  const unic_id = statusData.result.unic_id;
  const menuId = await getInstanceById(unic_id)

  const saveFoler = `data/ready/${extraFolder}`
  // Check folder for exists
  await fs.mkdir(saveFoler, { recursive: true })

  const saveFilename =  path.join(saveFoler,`${menuId.model_name}_${unic_id}${extraTag}.png`)
  await fs.writeFile(saveFilename, imageBuffer);

  let message = message_id;
  if(isFirst){
    message = await ctx.editMessageText(`🏁 *Генерация завершена\\!*\nНиже сообщение с файлом результата`,{
      // clear markup
      reply_markup: {},
      parse_mode: "MarkdownV2"
  })
  }
  

  return [message,saveFilename]
}

export async function createCreateMessageMarkup(unic_id,menuData = null,whichButtonBlock = null,job_id = null){
  let menuId;

  if(menuData){
    menuId = menuData;
  } else{
    menuId = await getInstanceById(unic_id)
  }

  let finaleMessage = `\\#${menuId.model_name.replace(" ","\\_")} \\#${menuId.generation_type}`

  finaleMessage+=`\n🌱 Сид: [${menuId.sid}](https://t.me/SD_Daswer_bot?start=${menuId.unic_id})`
  finaleMessage+=`\n 🎨 Ввод: \`${menuId.prompt}\``

  finaleMessage+=`\n\n_\\*Сегодня у тебя есть ещё 3 бонусных нажатия на повтор, остальные будут расходовать токены_`

  let againBtn = whichButtonBlock == "again" ? Markup.button.callback(`⏳ Отменить`,`cancel_again_gen_${job_id}`) : whichButtonBlock ? Markup.button.callback(`🔁 Повторить`,`wait_message_gen`) : Markup.button.callback(`🔁 Повторить`,`gen_again_${menuId.unic_id}`) 
  let variationBtn = whichButtonBlock == "var" ? Markup.button.callback(`⏳ Отменить`,`cancel_var_${job_id}_main`) : whichButtonBlock ? Markup.button.callback(`🔀 Вариации`,`wait_message_gen`) : Markup.button.callback(`🔀 Вариации`,`variations_gen_menu_${menuId.unic_id}`)
  let scaleBtn = whichButtonBlock == "scale" || whichButtonBlock == "hyperscale" ? Markup.button.callback(`⏳ Отменить`, `cancel_upscale_${job_id}_gen`) : whichButtonBlock ? Markup.button.callback(`🔥 HyperScale`,`wait_message_gen`) : Markup.button.callback(`🔥 HyperScale`,`upscale_gen_menu_${menuId.unic_id}_gen`)


  const buttons = [
      [Markup.button.callback("⚙ Изменить",`change_gen_${menuId.unic_id}`),againBtn],
      [variationBtn,scaleBtn]
  ]

  return [finaleMessage, buttons]
}

export async function createCreateMessageMarkupVar(unic_id,menuData = null,whichButtonBlock=null,jobId = null){
  let menuId;

  if(menuData){
    menuId = menuData;
  } else{
    menuId = await getInstanceById(unic_id)
  }

  let finaleMessage = `\\#${menuId.model_name} ${menuId.preset_name ? `\\#${menuId.preset_name} ` : ``}\\#variant`


  finaleMessage+=`\n 🔀 Вариация генерации [\\#${menuId.sid}](https://t.me/SD_Daswer_bot?start=${menuId.subsid_id})`
  finaleMessage+=`\n🌱 Сид: [${menuId.variation_sid}](https://t.me/SD_Daswer_bot?start=${menuId.unic_id})`

  const againBtn = whichButtonBlock == "again" ? Markup.button.callback(`⏳ Отменить`, `cancel_var_${jobId}_var`) : whichButtonBlock ? Markup.button.callback(`🔁 Ещё раз`,`wait_message_gen`) : Markup.button.callback(`🔁 Ещё раз`,`variations_gen_start_${menuId.subsid_iad}_varmenu`)
  const scaleBtn = whichButtonBlock == "scale" ? Markup.button.callback(`⏳ Отменить`, `cancel_upscale_${jobId}_var`) : whichButtonBlock ? Markup.button.callback(`🔥 HyperScale`,`wait_message_gen`) : Markup.button.callback("🔥 HyperScle",`upscale_gen_menu_${menuId.unic_id}_var`)

  const buttons = [
    scaleBtn,againBtn,
  ]

  return [finaleMessage, buttons]
}

export function deleteMessageMarkup(ctx, messageId) {
  try{
  bot.telegram.editMessageReplyMarkup(ctx.from.id, messageId, null, {});
  } catch(e){
    console.log(e)
  }
}

export async function restrictEditMessage(ctx,unic_id){
  const createdTime = await getInstanceCreatedTimeById(unic_id)
}


