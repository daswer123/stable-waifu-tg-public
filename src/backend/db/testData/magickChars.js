import { addMagickChar } from "../db_settings.js";

// addMagickChar({
//     name : "EN обозначение в промпте",
//     prompt_query: "Как пользователь может сделать запрос на этого персонажа",
//     lora: "Лора и её веса",
//     extra: "Название определенных костюмов"
// })

await addMagickChar({
    name : "sinon",
    prompt_query: "sinon, синон, асада сино, asada shino",
    lora: "sinon1 <lora:sinon_v5:0.8>",
    extra: "ggo, alo, sao"
})

await addMagickChar({
    name : "blalisa",
    prompt_query: "пионер алиса, алиса пионер, алиса (everlasting summer), alice pioner, pioner alice, alice (everlasting summer)",
    lora: "blalisa <lora:blalisa:0.8>",
    extra: ""
})


// addMagickChar({
//     base : "EN обозначение в промпте",
//     lora: "Лора и её веса"
// })