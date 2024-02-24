import { addMagickTag } from "../db_settings.js";


// addMagickTag({
//     base : "EN обозначение в промпте",
//     lora: "Лора и её веса"
// })

await addMagickTag({
    base : "darkener",
    lora: "<lora:LowRA:1>"
})

await addMagickTag({
    base : "detailer",
    lora: "<lora:add_detail:1>"
})

await addMagickTag({
    base : "dresser",
    lora: "<lora:ClothingAdjuster3:1>"
})