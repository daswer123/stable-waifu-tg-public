import { addMagickWord,addMagickTag,addMagickChar } from "../db_settings.js";

// await addMagickWord({
//     base : "Как будет показанно пользователю",
//     base_ru: "Как оно будет подцеплятся с русского или английского",
//     lora: "Лора и её веса"
// })

await addMagickWord({
    base : "pixel art",
    prompt_query: "пиксель арт,паксель арт, пуксиль арт, пиксиль арт, пексиль арт, паксель арт, пиксель-арт, pixelart, pixel art",
    lora: "pixelart <lora:pixel:0.7>"
})

await addMagickWord({
    base : "watercolor",
    prompt_query: "Акварельный, акварель, watercolor, watercolour",
    lora: " watercolor <lora:niji-watercolor02:0.7>"
})

await addMagickWord({
    base : "lineart",
    prompt_query: "лайнарт, лайн арт, lineart, line art",
    lora: "lineart,<lora:animeoutlineV4_16:1>"
})

await addMagickWord({
    base : "minimalism",
    prompt_query: "Минималистичный, Минималистично, minimalism, Minimalistic ",
    lora: "minimalism, simple colors <lora:colorful_minimalist_illustration:1>",
    lora_neg: "detailed"
})

await addMagickWord({
    base : "realistic",
    prompt_query: "realistic, realism, реалистично, реалистичный",
    lora: "hyperrealism, atmospheric",
    lora_neg: "dof"
})

await addMagickWord({
    base : "retro",
    prompt_query: "ретро,ретро стиль, ретро стиле, рэтро, retro, retro style, retro anime",
    lora: "<lora:Retro_Anime-000002:0.7>",
})

await addMagickWord({
    base : "dakimakura",
    prompt_query: "dakimakura, дакимакура ",
    lora: "<lora:smv1-10:1>",
})

await addMagickWord({
    base : "sailor moon style",
    prompt_query: "sailor moon style, стиле сейлор мун, стиль сейлор мун",
    lora: "<lora:daki:0.7> dakimakura, bed",
})

await addMagickWord({
    base : "manga style",
    prompt_query: "manga, manga style, манга, стиле манги, стиле манги ",
    lora: "<lora:marvin:0.7>, MANGA",
})

await addMagickWord({
    base : "synthwave",
    prompt_query: "synthwave, синтвейв, retrowave, ретровейв ",
    lora: "<lora:Synthwave_Style:0.6> synthwave",
})

await addMagickWord({
    base : "magazine cover",
    prompt_query: "обложка журнала, magazine cover, magazine cover style ",
    lora: "magazine cover, <lora:Magazine-10:0.7>",
})

await addMagickWord({
    base : "sparkle effect",
    prompt_query: "сверкающим эффектом, сверкающий эффект, sparkle effect, glitter effect ",
    lora: "sparkles, glitter ,sparkle effect",
})

await addMagickWord({
    base : "chinese brushwork",
    prompt_query: "chinese brushwork, китайский рисунок кистью",
    lora: "<lora:Freehand_Brushwork:1>,",
})

await addMagickWord({
    base : "chinese brushwork",
    prompt_query: "chinese brushwork, китайский рисунок кистью",
    lora: "<lora:Freehand_Brushwork:1>,",
})

await addMagickWord({
    base : "gacha splash",
    prompt_query: "gacha splash, гача сплеш, гатча сплеш, гача сплэш, гачта сплэш, gatcha splash",
    lora: "<lora:lihui4JXK-b2-bf16-128-128-1-re1-ep3-768-DA-5015fix:0.8>",
})

await addMagickWord({
    base : "gacha splash",
    prompt_query: "gacha splash, гача сплеш, гатча сплеш, гача сплэш, гачта сплэш, gatcha splash",
    lora: "<lora:lihui4JXK-b2-bf16-128-128-1-re1-ep3-768-DA-5015fix:0.8>",
})

await addMagickWord({
    base : ">_<",
    prompt_query: ">_<",
    lora: ">_< <lora:moreExpressions:1>",
})

await addMagickWord({
    base : "@_@",
    prompt_query: "@_@",
    lora: "@_@ <lora:moreExpressions:1>",
})

await addMagickWord({
    base : "=_=",
    prompt_query: "=_=",
    lora: "=_= <lora:moreExpressions:1>",
})

await addMagickWord({
    base : "X X",
    prompt_query: "X X, X_X",
    lora: "X X <lora:moreExpressions:1>",
})

await addMagickWord({
    base : "._.",
    prompt_query: "._.",
    lora: "._. <lora:moreExpressions:1>",
})

await addMagickWord({
    base : "jitome",
    prompt_query: "jitome",
    lora: "Jitome <lora:moreExpressions:1>",
})

await addMagickWord({
    base : "oversized shirt",
    prompt_query: "oversized shirt, оверсайз",
    lora: "oversized shirt <lora:Clothing_OversizedShirt:1>",
})

await addMagickWord({
    base : "reference sheet",
    prompt_query: "reference sheet, reference, референс персонажа, референс",
    lora: "CharacterSheet <lora:CharacterDesign_Concept-10:0.6>",
})

await addMagickWord({
    base : "horrified",
    prompt_query: "horrified, scare, scared, horrify, испуганная, испуганный, испуг",
    lora: "horrified, fear, constricted pupils, small pupils <lora:Constricted Pupils5:1>",
})

await addMagickWord({
    base : "crazy face",
    prompt_query: "crazy face, безумное лицо, безумие на лице",
    lora: "crazy face, evil smile, grin, constricted pupils, small pupils <lora:Constricted Pupils5:1>",
})

await addMagickWord({
    base : "shocked",
    prompt_query: "shocked, shock, шокирован, шокирована, в шоке",
    lora: "shocked, :o,constricted pupils, small pupils <lora:Constricted Pupils5:1>",
})

await addMagickWord({
    base : "body horror",
    prompt_query: "боди-хоррор, боди хоррор, body horror",
    lora: "body horror <lora:BodHor-V3P:0.8>",
})

await addMagickWord({
    base : "liquid clothes",
    prompt_query: "liquid clothes,liquid dress, жидкое платье, жидкая одежда",
    lora: "((liquid clothes)), <lora:LiquidClothesV2:1>",
})

await addMagickWord({
    base : "slimegirl",
    prompt_query: "slimegirl, девушка-слизь, slimegirl-girl",
    lora: "slimegirl <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "scylla",
    prompt_query: "scylla, девушка-осьминог, scylla-girl",
    lora: "scylla <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "satyr",
    prompt_query: "satyr, девушка-сатир, satyr-girl",
    lora: "satyr <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "mothgirl",
    prompt_query: "mothgirl, девушка-мотылек, девушка-мотылёк",
    lora: "mothgirl <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "mermaid",
    prompt_query: "mermaid, девушка-русалка, русалка, mermaid-girl",
    lora: "mermaid <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "lamia",
    prompt_query: "lamia, девушка-ламия, ламия, lamia-girl",
    lora: "lamia  <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "alraune",
    prompt_query: "alraune, девушка-растение, alraune-girl",
    lora: "alraune  <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "arachne",
    prompt_query: "arachne, девушка-паук, spider-girl ,arachne-girl",
    lora: "arachne  <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "centaur",
    prompt_query: "centaur, девушка-кентавр, centaur-girl",
    lora: "alraune  <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "cyclops",
    prompt_query: "cyclops, девушка-циклоп, cyclops-girl",
    lora: "cyclops <lora:monstergirl_cpt_v06:1>",
})

await addMagickWord({
    base : "harpy",
    prompt_query: "harpy, девушка-гарпия, harpy-girl",
    lora: "harpy <lora:monstergirl_cpt_v06:1>",
})