import { Markup } from "telegraf";
import { escapeMarkdown, withErrorHandling } from "../utils/funcs.js";
import { createGiftTokenMenuAndReply, createTokensMenu, createTokensMenuAndReply } from "./functions.js";
import { INITIAL_SESSION } from "../utils/variables.js";


export async function setBotCommands(bot) {
    await bot.telegram.setMyCommands([
        { command: "help", description: "Обучение и ссылки" },
        { command: "tokens", description: "Баланс и пополнение" },
        { command: "gift", description: "Подарить токены" },
        { command: "stats", description: "Моя статистика" },
    ]);
}

export const registerBotCommands = withErrorHandling(async (bot) => {
    bot.command("help", async (ctx) => {
        const message = "Не знаешь, что делать? Прочитай [наше обучение](https://telegra.ph/Obuchenie-Stable-Anime-02-24), там есть всё необходимое для создания потрясающих артов\\!"
        await ctx.replyWithMarkdownV2(message);
    });

    bot.command("tokens", (ctx) => {
        createTokensMenuAndReply(ctx)
    });

    bot.command("gift", (ctx) => {
        let baseMessage = `*Хочешь порадовать друга? Сделать сюрприз второй половинке? Устроить свой розыгрыш?*\n\n` +
                         `👏 У тебя есть такая возможность\\! Просто нажми на кнопку, выбери получателя и следуй указаниям, чтобы передать свои токены\\!`;
    
        // Обновленная клавиатура без oneTime() для постоянного отображения
        const keyboard = Markup.keyboard([
            [{text: "📩 Выбрать получателя",request_user:{request_id:ctx.from.id,user_is_bot:false}}],
            ["Я передумал(а)"]
        ]).resize()
    
        ctx.replyWithMarkdownV2(baseMessage, keyboard);

        ctx.session.user_idSendGift = null
        ctx.session.userNameSendGift = ""
        ctx.session.isAnonim = false
    });
    
    bot.hears('Я передумал(а)', (ctx) => {
    // clear Markup
      

      ctx.replyWithMarkdownV2('Хорошо\\. Ты можешь вернуться к этому в любое время\\!',Markup.removeKeyboard());
    });

    bot.command("reset",async(ctx)=>{
        ctx.session = {...INITIAL_SESSION}
    })

    bot.on('user_shared',async (ctx) => {
        let user
        try{
            user = await bot.telegram.getChat(ctx.message.user_shared.user_id);
        } catch(e){
            ctx.reply(`❌ Выбранный получатель не пользуется нашим сервисом.\nПопроси его активировать бота и повтори попытку.`)
            return
        }
        
        ctx.session.user_idSendGift = ctx.message.user_shared.user_id;
        ctx.session.userNameSendGift = user.first_name;

        createGiftTokenMenuAndReply(ctx)
    });

    bot.command("stats", (ctx) => {
        ctx.reply("В работе")
    });

    bot.command("id", (ctx) => {
        ctx.replyWithMarkdownV2(`Ваш ID" \\- \`${ctx.from.id}\``);
    });

    bot.command("admin",async (ctx) => {
        ctx.reply("В работе")
    });
});
