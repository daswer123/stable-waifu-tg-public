import { addMagickCharExtra } from "../db_settings.js";


// addMagickChar({
//     char : "Имя персонажа, должен быть в списке персонажей",
//     costume: "Название костюма",
//     prompt: "Специальный промпт костюма"
// })

await addMagickCharExtra({
    char : "sinon",
    costume: "alo",
    prompt: "white gloves, thighhighs, pelvic curtain, short hair with long locks, hair between eyes, sidelocks, breastplate, shoulder armor, blue armor"
})

await addMagickCharExtra({
    char : "sinon",
    costume: "ggo",
    prompt: "scarf, fingerless gloves, long sleeves, short shorts, hair ornament, hairclip, green thighhighs, green jacket, thigh strap"
})

await addMagickCharExtra({
    char : "sinon",
    costume: "sao",
    prompt: "animal ears, black ribbon, black shorts, breastplate, hair ribbon, short shorts, midriff, fingerless gloves, thigh strap, sidelocks, hair between eyes, green armor, shoulder armor"
})
