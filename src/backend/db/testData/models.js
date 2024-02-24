// import db_data from "../db_settings.js"
import {addNegativeEmbedding, addStrenghtSetting, createARExample, createModel, createPreset, createSettingsTables} from "../db_settings.js"
// db_data.exec(`
//   CREATE TABLE IF NOT EXISTS models(
//     model_name PRIMARY KEY,
//     description TEXT,
//     img_link TEXT,
//     confirm_cymbol TEXT,
//     stable_model TEXT,
//     has_alter_mode INTEGER DEFAULT 0,
//     enable_alter_model INTEGER DEFAULT 0,
//     has_preset INTEGER DEFAULT 0,
//     alter_model_name TEXT,
//     alter_model_link TEXT,
//     alter_model_confirm_cymbol TEXT,
//     alter_model_stable_model TEXT
//   )
// `);

// CREATE TABLE IF NOT EXISTS presets(
//     model_name PRIMARY KEY,
//     preset_name TEXT,
//     description TEXT,
//     img_link TEXT,
//     confirm_cymbol TEXT,
//     stable_model TEXT,
//     is_default INTEGER DEFAULT 0,
//     FOREIGN KEY(model_name) REFERENCES models(user_id)
//   )



// MAINA
try{
    let mainaData = {
        model_name: "Meina",
        description: "Яркая, насыщенная и разнообразная около-2D стилистика, которая временами напоминает японские мультфильмы.",
        img_link: "https://telegra.ph/file/22e1f3c9f1f74b82902ed.png",
        stable_model: "meinamix_meinaV11.safetensors [54ef3e3610]",
        has_preset: false
    }
    
    // PASTERL
    
    let PatelData = {
        model_name: "Saku",
        description: "Изящная гармония аниме новой волны с нотками реализма, сохраняющая характер каждого персонажа. В Saku используется богатый спектр цветовых оттенков, придающий образам живость и выразительность. Модель удивляет своей способностью к детализации и одновременно подчеркивает эстетику японской анимации с современным акцентом.",
        img_link: "https://telegra.ph/file/39529a5f714f75a25ead1.png",
        stable_model: "sakushimixFinished_sakushimixFinal.safetensors",
        has_alter_mode: false,
        has_preset: false
    }
    
    
    // let presetPastelData = {
    //     model_name: "Ama",
    //     description: "Модель Ama предназначена для автоматического создания непревзойдённых аниме-работ, достигая идеального баланса между традиционной стилистикой и современными визуальными трендами. Она эффективно справляется с задачами, где необходим точный перенос аниме-стиля, обеспечивая яркий и насыщенный цветовой результат даже при ограниченном количестве входных данных.",
    //     img_link: "https://telegra.ph/file/efb91bac14c404e2b30e8.jpg",
    //     style_name: "meina_vanila"
    // }
    
    // let presetPastelData2 = {
    //     model_name: "Pastel",
    //     preset_name: "Abstract",
    //     description: "Самая абстрактная и милая картинка. Традиционный вид модели с глубоко стилизованными артами.",
    //     img_link: "https://telegra.ph/file/73c912f49d23bdf1fd2de.jpg",
    //     style_name: "meina_abstract",
    //     is_default: true
    // }
    
    // let presetPastelData3 = {
    //     model_name: "Pastel",
    //     preset_name: "Calm",
    //     description: "Имеет чёткий фон и объекты за счёт снижения абстрактности. Более спокойная палитра без неровностей",
    //     img_link: "https://telegra.ph/file/efb91bac14c404e2b30e8.jpg",
    //     style_name: "meina_calm"
    // }
    
    // VELA
    let velaDATA = {
        model_name: "Ama",
        description: "Модель Ama предназначена для автоматического создания непревзойдённых аниме-работ, достигая идеального баланса между традиционной стилистикой и современными визуальными трендами. Она эффективно справляется с задачами, где необходим точный перенос аниме-стиля, обеспечивая яркий и насыщенный цветовой результат даже при ограниченном количестве входных данных.",
        img_link: "https://telegra.ph/file/c538eaf1cf69de3b8184f.png",
        stable_model: "aamAnyloraAnimeMixAnime_v1.safetensors",
        has_alter_mode: false,
        has_preset: false
    }
    
    // let preserVela1 = {
    //     model_name: "Vela",
    //     preset_name: "Prime",
    //     description: "Классический облик модели с более грубыми и богатыми деталями. Склонен к увеличению количества объектов на фоне",
    //     img_link: "https://telegra.ph/file/733b4c52918bcb5fa9454.jpg",
    //     style_name: "vela_prime",
    //     is_default: true
    // }
    
    // let preserVela2 = {
    //     model_name: "Vela",
    //     preset_name: "Calm",
    //     description: "Более нежная и чистая картинка с гладкими и ровными фонами. Склонен к уменьшению деталей и улучшению анатомии.",
    //     img_link: "https://telegra.ph/file/c715cf184db9f1bfe16b3.jpg",
    //     style_name: "Vela_calm"
    // }
    
    // Dark Sushi
    let darkSushiData = {
        model_name: "Dark Sushi",
        description: "Сказочные арты в тёмных тонах, с детальными тенями и особой стилистикой. Огромный спектр возможностей и поведения.\nВыберите модель ещё раз для переключения тёмного 🌑 / светлого 🌕 режима",
        img_link: "https://telegra.ph/file/8802f61d5fdaf63aa2df1.png",
        stable_model: "darkSushiMixMix_brighterPruned.safetensors",
        confirm_cymbol: "🌕",
        has_alter_mode: true,
        has_preset: false,
        // has_preset: true,
        alter_model_name: "Dark Sushi",
        alter_model_link: "",
        alter_model_confirm_cymbol: "🌑",
        alter_model_stable_model: "darkSushiMixMix_225D.safetensors"
    }
    
    // let presetDarkSushi = {
    //     model_name: "Dark Sushi",
    //     preset_name: "Classic",
    //     description: "Строгая и чёткая картинка, которая максимально подчёркивает стилистику Dark Sushi, но бывает слишком грубой и насыщенной.",
    //     img_link: "https://telegra.ph/file/830ca0a0b1c5cd3d3991c.png",
    //     style_name: "dark_sushi_classic",
    //     is_default: true
    // }
    
    // let preserDarkSushi1 = {
    //     model_name: "Dark Sushi",
    //     preset_name: "Soft",
    //     description: "Мягкая и более спокойная картинка, которая позволяет делать более естественные арты, но может уменьшить шарм стилистики",
    //     img_link: "https://telegra.ph/file/733b4c52918bcb5fa9454.jpg",
    //     style_name: "dark_sushi_classic",
    // }
    
    // let preserDarkSushi2 = {
    //     model_name: "Dark Sushi",
    //     preset_name: "Wavy",
    //     description: "Сохраняет палитру Classic с более нежной и хаотичной картинкой. Подойдёт тем, кто не любит строгость Dark",
    //     img_link: "https://telegra.ph/file/733b4c52918bcb5fa9454.jpg",
    //     style_name: "dark_sushi_classic",
    // }
    
    // Dark Delicacy
    let darkDelDATA = {
        model_name: "Hassa",
        description: "Брат близнец Counterfeit, но более горячим наклоном",
        img_link: "https://telegra.ph/file/76bddd2ee7be7006935a1.png",
        stable_model: "hassakuHentaiModel_v13.safetensors",
        has_preset: false
    }
    
    // Cetus
    let cetusDelDATA = {
        model_name: "Cetus",
        description: "Изящные арты с щепоткой реализма и 2.5D. Неподражаемые глаза и лица. Фокусируется на объекте, если имеется, и рисует более размытый фон",
        img_link: "https://telegra.ph/file/f3f1fe174a50eeb484060.png",
        stable_model: "cetusMix_v4.safetensors",
        has_preset: false
    }
    
    // let cutusPreset = {
    //     model_name: "Cetus",
    //     preset_name: "Fluffy",
    //     description: "Нежная и художественная картинка с изящными лицами, имеет размытые контуры и сильную стилизацию.",
    //     img_link: "https://telegra.ph/file/22cbb3685bf1ba4f00c6e.jpg",
    //     style_name: "dark_sushi_classic",
    //     is_default: true
    // }
    
    // let cutusPreset1 = {
    //     model_name: "Cetus",
    //     preset_name: "Strict",
    //     description: "Более строгая картинка с детальными глазами, оптимизированная для лучшей анатомии и более чёткого фона, но имеет менее богатые детали и пейзажи.",
    //     img_link: "https://telegra.ph/file/e63f21beba776e14cee66.jpg",
    //     style_name: "dark_sushi_classic",
    // }
    
    // let cutusPreset2 = {
    //     model_name: "Cetus",
    //     preset_name: "Cute",
    //     description: "В отличие от элегантных пресетов, имеет милую и чистую картинку, хорошую гибкость и более простую рисовку фонов.",
    //     img_link: "https://telegra.ph/file/3074211587c288fd4c60c.jpg",
    //     style_name: "dark_sushi_classic",
    // }
    
    // Flatter
    let flatterDelDATA = {
        model_name: "Raemu",
        description: "Эта модель сочетает элементы традиционной аниме-графики с умеренным привнесением реальности, предлагая свежий взгляд на классическую стилистику. Raemu идеально подходит для проектов, требующих лёгкого освежения без радикальных изменений визуального языка.",
        img_link: "https://telegra.ph/file/c0b77f4340fcab5b727f7.png",
        stable_model: "raemumix_v81.safetensors",
        has_preset: false
    }
    
    // Astra
    let astraDATA = {
        model_name: "Seiza",
        description: "Стиль Seiza представляет собой простой, но эффектный микс, ориентированный на достижение более плоского и яркого визуального выражения. ",
        img_link: "https://telegra.ph/file/ba33f5105457f9a66525a.png",
        stable_model: "seizamix_v2.safetensors [51a7154418]",
        has_preset: false
        }
    
    // Counterfeit
    let counterfeitDATA = {
        model_name: "Counterfeit",
        description: "Сильный художественный стиль с нотками масляных красок, более простые фоны и огромная креативность. Имеет упрощенную анатомию в обмен на творческую свободу.",
        img_link: "https://telegra.ph/file/a8aefa46500b32a25624b.png",
        stable_model: "counterfeitV30_v30.safetensors [cbfba64e66]",
        has_preset: false,
        
    }
    
    // let counterfeitPreset = {
    //     model_name: "Counterfeit",
    //     preset_name: "Fluid",
    //     description: "Детальная, воздушная и сочная картинка с более выраженной глубиной композиции.",
    //     img_link: "https://telegra.ph/file/76502f5e8a1efc095e718.jpg",
    //     style_name: "dark_sushi_classic",
    //     is_default: true
    // }
    
    // let counterfeitPreset1 = {
    //     model_name: "Counterfeit",
    //     preset_name: "Flat",
    //     description: "Более плоская картинка с ровными фонами и контурами. Имеет гладкую и чистую текстуру.",
    //     img_link: "https://telegra.ph/file/daefe42d258f9c3fe262f.jpg",
    //     style_name: "dark_sushi_classic",
    // }
    
    
    // Berry
    let berryDATA = {
        model_name: "Blue",
        description: "Элегантная аниме-модель Blue предлагает искусно стилизованный подход к созданию персонажей, насыщенных яркостью и запоминающихся фонов, оживляя каждый рисунок пастельными оттенками..",
        img_link: "https://telegra.ph/file/c98b6bfc00902e8405ef4.png",
        stable_model: "etherBluMix_etherBlueMix6.safetensors",
        has_preset: false
    }

    let revData = {
        model_name: "Rev",
        description: "Самая мощная 2.5D модель, уникальный стиль и реалистичность придают ей неотразимый шарм",
        img_link: "https://telegra.ph/file/9c156904e24c7cdde6530.png",
        stable_model: "revAnimated_v122EOL.safetensors",
        has_preset: false
    }

    let AnamData = {
        model_name: "Anim",
        description: "Аним - простая по стилистике модель, которая позволит вам продумать сюжет. Большой простор фантазий если вы хотите создать сюжеты с персонажами из любимых аниме студий.",
        img_link: "https://telegra.ph/file/c432bd72ab91e7ba30919.png",
        stable_model: "Anime_v2.safetensors [67cf8b0ff1]",
        has_preset: false
    }
    
    // BlueXL
    // let blueXLDATA = {
    //     model_name: "blueXL",
    //     description: "Самая послушная модель в линейке XL (https://telegra.ph/Obuchenie-StableWaifuBot-03-04) с огромным количеством поддерживаемых аниме-персонажей и лучшей анатомией. Менее изящная в рисовании фонов и пейзажей.подробнее об особенностях (https://telegra.ph/Intro-to-BlueXL-01-11)",
    //     img_link: "https://telegra.ph/file/53da780928621f0efed72.jpg",
    //     stable_model: "blueXL",
    //     is_xl_model: true
    // }
    
    // PAGE 1

    // await createSettingsTables()
    
    // // // MAINA
    // await createModel(mainaData)
    
    // // // // PASTEL
    // await createModel(PatelData)
    // // await createPreset(presetPastelData)
    // // await createPreset(presetPastelData2)
    // // await createPreset(presetPastelData3)
    
    // //  // VELA
    //  await createModel(velaDATA)
    // //  await createPreset(preserVela1)
    // //  await createPreset(preserVela2)
    
    // // // // Dark Sushi Mix
    // await createModel(darkSushiData)
    // // await createPreset(presetDarkSushi)
    // // await createPreset(preserDarkSushi1)
    // // await createPreset(preserDarkSushi2)
    
    // // // // Dark Delicacy
    // await createModel(darkDelDATA)
    
    // // // PAGE 2
    
    // // // Cetus
    // await createModel(cetusDelDATA)
    // // await createPreset(cutusPreset)
    // // await createPreset(cutusPreset1)
    // // await createPreset(cutusPreset2)
    
    // // // Flatter
    // await createModel(flatterDelDATA)
    
    // // // Astra
    // await createModel(astraDATA)
    
    // // // Counfereti
    // await createModel(counterfeitDATA)
    // // await createPreset(counterfeitPreset)
    // // await createPreset(counterfeitPreset1)
    
    // // // Berry
    // await createModel(berryDATA)
    
    // // // // PAGE 3 
    // await createModel(AnamData)
    // await createModel(revData)


    // await addNegativeEmbedding('easynegative');
    // await addNegativeEmbedding('badhandv4');
    // await addNegativeEmbedding('bad-hands-5');
    // await addNegativeEmbedding('negative_hand');
    // await addNegativeEmbedding('ng_deepnegative_v1_75t');
    // await addNegativeEmbedding('bad-artist-anime');
    // await addNegativeEmbedding('verybadimagenegative_v13');
    // await addNegativeEmbedding('verybadimagenegative_v12_6400');

    // AR PORTRAIT
    // await createARExample({
    //     ratio: "1:1",
    //     type : "portrait",
    //     resolution: "640x640",
    //     img_link: "https://telegra.ph/file/bd848ae0eba1b8b5adffc.png"
    // })

    // await createARExample({
    //     ratio: "1:2",
    //     type : "portrait",
    //     resolution: "512x768",
    //     img_link: "https://telegra.ph/file/10a6c03ec1bae32564d7a.png"
    // })

    // await createARExample({
    //     ratio: "2:3",
    //     type : "portrait",
    //     resolution: "600x800",
    //     img_link: "https://telegra.ph/file/5560e330086e62f1f20fd.png"
    // })

    // await createARExample({
    //     ratio: "9:16",
    //     type : "portrait",
    //     resolution: "540x960",
    //     img_link: "https://telegra.ph/file/76e2c785520c4395dd74e.png"
    // })

    // await createARExample({
    //     ratio: "3:4",
    //     type : "portrait",
    //     resolution: "768x1024",
    //     img_link: "https://telegra.ph/file/aedd26503cfe9b56012ab.png"
    // })

    // // AR LANDSCAPE
    // await createARExample({
    //     ratio: "1:1",
    //     type : "landscape",
    //     resolution: "640x640",
    //     img_link: "https://telegra.ph/file/bd848ae0eba1b8b5adffc.png"
    // })

    // await createARExample({
    //     ratio: "2:1",
    //     type : "landscape",
    //     resolution: "768x512",
    //     img_link: "https://telegra.ph/file/ebbded4767cea9412eced.png"
    // })

    // await createARExample({
    //     ratio: "3:2",
    //     type : "landscape",
    //     resolution: "800x600",
    //     img_link: "https://telegra.ph/file/79b24420fe02dcffd5332.png"
    // })

    // await createARExample({
    //     ratio: "16:9",
    //     type : "landscape",
    //     resolution: "960x540",
    //     img_link: "https://telegra.ph/file/ff68464656440dabc6d1c.png"
    // })

    // await createARExample({
    //     ratio: "4:3",
    //     type : "landscape",
    //     resolution: "1024x768",
    //     img_link: "https://telegra.ph/file/58aa4b3b61044035cd1ea.png"
    // })

    

    // // Strenght Settings

    // // name TEXT,
    // // strenght TEXT,
    // // img_link TEXT,
    // // description TEXT


   await addStrenghtSetting({
        name: "Минимальная",
        strength: 0.4,
        img_link: "https://telegra.ph/file/ccd1a5a990ce64986edec.png",
        description: "сохраняет как можно больше деталей и стиля оригинала."
    })

    await addStrenghtSetting({
        name: "Низкая",
        strength: 0.5,
        img_link: "https://telegra.ph/file/067443be62138fd488033.png",
        description: "сохраняет некоторые черты и часть стиля оригинала."
    })

    await addStrenghtSetting({
        name: "Стандартная",
        strength: 0.6,
        img_link: "https://telegra.ph/file/048246735d0c87b2ebdb9.png",
        description: "балансирует между стилем модели и деталями оригинала, рекомендуем повысить для фотографий."
    })

    await addStrenghtSetting({
        name: "Высокая",
        strength: 0.75,
        img_link: "https://telegra.ph/file/7753f5edfdc8c823daa76.png",
        description: "вносит значительные изменения в оригинал."
    })

    await addStrenghtSetting({
        name: "Максимальная",
        strength: 0.9,
        img_link: "https://telegra.ph/file/8992bdadc453653285300.png",
        description: "наиболее соответствует вводу, теряя черты оригинала."
    })

    }catch(e){
        console.error("\n",e.message,"\n")
    }