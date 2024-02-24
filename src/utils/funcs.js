import fs from "fs";
import { Markup } from "telegraf";
import { modelsPerPage, sessionPathFolder } from "./variables.js";

import path from "path";
import axios from "axios";

import crypo from "crypto"
import { getAllModels, getModelPositonByName } from "../backend/db/db_settings.js";
import { getInstanceById } from "../backend/db/db_prompts.js";

export function createSessionFolder() {
    // create a session folder if it does not already exist
    if (!fs.existsSync(sessionPathFolder)) {
        fs.mkdirSync(sessionPathFolder, { recursive: true });
    }
}

export function generateUniqueId() {
    const lastSymblos = crypo.randomBytes(3).toString('hex');
    // Get from date last 8 dight
    const numDate = Date.now().toString().slice(-8);

    const uniqueIdString = `seed_${numDate}_${lastSymblos}_`
    const uniqueIdStringEdit = `pedit_${numDate}_${lastSymblos}`

    const encodedId = Buffer.from(uniqueIdString).toString('base64');
    const encodedIdEdit = Buffer.from(uniqueIdStringEdit).toString('base64');

    return [encodedId,encodedIdEdit];
}

export function decodeUniqueId(Encodeunic_id) {
    return Buffer.from(Encodeunic_id, 'base64').toString('ascii');
}

// Remove chars to Markdownv2 works properly
export function escapeMarkdown(text) {
    const specialCharacters = ["_", "[", "]", "(", ")", "~", ">", "#", "+", "-", "=", "|", "{", "}", ".", "!"];
    let escapedText = text;

    console.log(text)

    specialCharacters.forEach((char) => {
        const regex = new RegExp(`\\${char}`, "g");
        // console.log(escapedText)
        escapedText = escapedText.replace(regex, `\\${char}`);
    });

    return escapedText;
}

// HOC for error handling
export const withErrorHandling = (handler, errorMessage) => {
    return async (ctx) => {
        try {
            await handler(ctx);
        } catch (err) {
            // ctx.reply(errorMessage || "😢 Непредвиденная ошибка, пожалуйста, введите /start");
            console.log(err);
        }
    };
};

// Template for creating a keyboard
export const createMenu = (message, buttons) => {
    // message = escapeMarkdown(message);

    // const keyboardButtons = buttons.map((row) => row.map((button) => Markup.button.callback(button.text, button.action)));
    // const keyboard = Markup.inlineKeyboard(keyboardButtons).resize();

    // return { message, keyboard };

    console.log("Не то меню!!")
};

export async function createSessionPath(ctx) {
    const uniqueId = ctx.from.id;
    const messageId = ctx.message.message_id;
    const sessionPath = `sessions/${uniqueId}/${messageId}`;

    // Create a folder for the user, if it does not already exist
    if (!fs.existsSync(sessionPath)) {
        await fs.promises.mkdir(sessionPath, { recursive: true });
    }
    return sessionPath;
}

// Функция для загрузки и сохранения файла
export async function downloadAndSaveFile(fileLink, filePath) {
  try {
    const response = await axios.get(fileLink.href, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);

    // Промис будет разрешён после завершения записи файла.
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;

      writer.on('error', (err) => {
        error = err;
        writer.close();
        reject(err);
      });

      writer.on('close', () => {
        if (!error) resolve(true);
        // Если возникла ошибка - она была обработана выше в 'error' handler.
      });
    });
  } catch (error) {
    console.error("Ошибка при загрузке или сохранении файла:", error);
    throw error; // Повторно выбросить ошибку для последующей обработки.
  }
}

export async function downloadPhoto(sessionPath, photo, telegram, name = "input.jpg") {
    const photoPath = path.join(sessionPath, name);
    const photoFile = await telegram.getFileLink(photo.file_id);

    // Download file
    const response = await axios.get(photoFile.href, { responseType: "stream" });
    const writer = fs.createWriteStream(photoPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(photoPath));
        writer.on("error", reject);
    });
}

export async function getModelPage(model){
    return Math.floor(await getModelPositonByName(model) / modelsPerPage)
}

export async function sortButtonsInRow(modelsPull,selectedModel,unic_id,modelPerRow=3) {
  const buttons = [];
  const menuData = await getInstanceById(unic_id)

  console.log(menuData,"дата менюшка")
  for (let i = 0; i < modelsPull.length; i += modelPerRow) {
    let tempArray = [];

    for (let j = i; j < i + modelPerRow; j++) {
      if (j < modelsPull.length) {
        let extraSymbol = ''
        if(modelsPull[j].model_name == selectedModel){
            extraSymbol = modelsPull[j].confirm_cymbol
        }

        if(modelsPull[j].has_alter_mode && menuData.enable_alter_model == 'true' && modelsPull[j].model_name == selectedModel){
            extraSymbol = modelsPull[j].alter_model_confirm_cymbol
        }

        tempArray.push(Markup.button.callback(`${extraSymbol} ${modelsPull[j].model_name}`, `select_model_${modelsPull[j].model_name}_${unic_id}`));
      }
    }

    buttons.push(tempArray);
  }

  return buttons
}

export async function sortPresetButtonsInRow(presetPull, selectedPreset, unic_id, modelPerRow = 3) {
    const buttons = [];

    for (let i = 0; i < presetPull.length; i += modelPerRow) {
        let tempArray = [];

        for (let j = i; j < i + modelPerRow; j++) { // Use modelPerRow instead of hardcoded 3
            if (j < presetPull.length) {
                let extraSymbol = '';

                if(presetPull[j].preset_name == selectedPreset){
                    extraSymbol = presetPull[j].confirm_cymbol;
                }

                tempArray.push(Markup.button.callback(
                    `${extraSymbol} ${presetPull[j].preset_name}`,
                    `select_preset_${presetPull[j].preset_name}_${unic_id}`
                ));
            }
        }

        buttons.push(tempArray);
    }

    return buttons;
}

export async function stringifiedData(data){
    if (!data) {
        console.log('Ошибка: data не определен.');
        return null; // Возвращаем null для обработки ошибки.
        // Обработка случая, когда data не определён.
      } else {
        const stringifiedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        );
      
        return stringifiedData
      }
}
export function convertToOriginalTypes(instance) {
    const convertedInstance = {};
    for (const [key, value] of Object.entries(instance)) {
      let parsedValue;
  
      // Попытка определить фактический тип данных: число, логическое значение или оставить строку
      if (!isNaN(value) && value.trim() !== '') {
        // Значение является числом
        parsedValue = Number(value);
      } else if (value === 'true') {
        // Значение является логическим true
        parsedValue = true;
      } else if (value === 'false') {
        // Значение является логическим false
        parsedValue = false;
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/.test(value)) {
        // Значение соответствует формату даты ISO8601 - превращаем в объект Date
        parsedValue = new Date(value);
      } else {
        // Оставляем как есть - строка.
        parsedValue = value;
      }
  
      convertedInstance[key] = parsedValue;
    }
    return convertedInstance;
  }
  

  export async function generateRandomSeed(){
    // Generate Random number with 10 dight
    const randomNumber = Math.floor(Math.random() * 10000000000);
    return randomNumber
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Экранирование спецсимволов для RegExp
  }
  
  export function replaceKeywordsWithBase(text, objects) {
    let modifiedText = text;

    // Привести текст к нижнему регистру для поиска.
    const lowerText = text.toLowerCase();

    objects.forEach(obj => {
        const baseOrName = obj.base || obj.name;
        let keywords = obj.prompt_query ? obj.prompt_query.split(',').map(s => s.trim().toLowerCase()) :
                                         baseOrName.split(',').map(s => s.trim().toLowerCase());

        keywords.forEach(keyword => {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Экранирование спецсимволов
            // Регулярное выражение для поиска ключевого слова с вероятностью:
            const regex = new RegExp(`\\(?${escapedKeyword}:?(\\-?[0-9]*[,.]?[0-9]+)?\\)?`, 'gi');

            modifiedText = modifiedText.replace(regex, (_, probabilityMatch) => {
                let probabilityValue = probabilityMatch;
                if (probabilityValue !== undefined && probabilityValue !== '') {
                    // Обработка чисел и замена запятой на точку.
                    probabilityValue = probabilityValue.replace(',', '.');

                    if (probabilityValue.startsWith('-.')) {
                        probabilityValue = '-0' + probabilityValue.slice(1);
                    } else if (probabilityValue.startsWith('.')) {
                        probabilityValue = '0' + probabilityValue;
                    }

                    return `${baseOrName}:${probabilityValue}`;
                } else {
                    return baseOrName;  // Если число отсутствует или пустое
                }
            });
        });
    });

    return modifiedText;  // Возвращает измененный текст со словами замененными на loras из объектов.
}

  
  


  export function findBaseKeywords(text, objects) {
    let basesFound = [];

    // Привести текст к нижнему регистру для унификации поиска.
    console.log(text)
    const lowerText = text.toLowerCase();

    objects.forEach(obj => {
        let keywords = obj.prompt_query ? obj.prompt_query.split(',').map(s => s.trim().toLowerCase()) :
                                        obj.base.split(',').map(s => s.trim().toLowerCase());

        keywords.forEach(keyword => {
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Экранирование спецсимволов
            // Регулярное выражение будет искать ключевое слово с последующей вероятностью:
            const regex = new RegExp(`\\(?${escapedKeyword}:?(\\-?[0-9]*[,.]?[0-9]+)?\\)?`, 'gi');

            let match;
            while ((match = regex.exec(lowerText)) !== null) {
                if (match[1] !== undefined && match[1] !== '') {  // Если есть число после двоеточия
                    let probabilityValue = match[1].replace(',', '.');  // Замена запятой на точку

                    if(probabilityValue.startsWith('-.')) {
                        probabilityValue = '-0' + probabilityValue.slice(1);  // Добавляем -0 если начинается с "-."
                    } else if (probabilityValue.startsWith('.')) {
                        probabilityValue = '0' + probabilityValue;  // Добавляем ведущий ноль если начинается с "."
                    }

                    basesFound.push(`${obj.base || obj.name}:${probabilityValue}`);
                } else {  // Если число отсутствует или пустое
                    basesFound.push(`${obj.base || obj.name}`);  // Добавляем :0 по требованиям задачи
                }
            }
        });
    });

    return { originalText: text, basesFound };
}



  