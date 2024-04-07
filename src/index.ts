import dotenv from "dotenv";
import input from "input";
import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";
import path from "path";
import { Markup, Telegraf } from "telegraf";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { summarise } from "./utls/summarise";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const token = process.env.BOT_TOKEN || "";
const bot = new Telegraf(process.env.BOT_TOKEN || "");
const TelaBot = new TelegramBot(process.env.BOT_TOKEN || "");
const apiId = Number(process.env.APP_ID);
const apiHash = process.env.APP_HASH || "";
const stringSession = new StringSession(process.env.AUTH_KEY);
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

bot.command("sum", async (ctx) => {
  if (ctx.command === "sum") {
    const channel = ctx.payload;

    ctx.sendChatAction("upload_voice");
    const result = client.iterMessages(channel, { limit: 100, reverse: true });

    const allMeassages: string[] = [];
    for await (const message of result) {
      allMeassages.push(message.text);
    }
    await summarise(allMeassages.join(`message: `));

    const source = path.resolve("./src/temp-speechs/speech.mp3");
    ctx.replyWithAudio({ source });
  }
});

bot.on("channel_post", async (ctx) => {
  //@ts-ignore
  const message = ctx.update.channel_post.text;
  const cmd = message.split(" ")[0]
  const limit = Number(message.split(" ")[1]) || 100
  const channelInfo = ctx.update.channel_post.sender_chat as any;

  switch(cmd) {
    case "/sum":
      ctx.sendChatAction("upload_voice");
      const result = client.iterMessages(`@${channelInfo.username}`, { limit, reverse: true });
  
      const allMeassages: string[] = [];
      for await (const message of result) {
        allMeassages.push(message.text);
      }
  
      // await summarise(allMeassages.join(`message: `));

      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('View', 'view_summary'),
      ]);

      ctx.telegram.sendMessage(ctx.update.channel_post.chat.id, "Am trissssss", {
        reply_markup: {
          inline_keyboard: keyboard.reply_markup.inline_keyboard,
          force_reply: true,
        },
      });
    
      // const source = path.resolve("./src/temp-speechs/speech.mp3");
      // ctx.replyWithAudio({ source });
      
      break;
    default:
      console.log(message)
  }
})

bot.action('view_summary', async (ctx) => {
  const userId = ctx.from?.id;
  console.log(ctx.update.callback_query.message)

  console.log(ctx)
});

bot.on("message", async (ctx) => {
  const chatId = ctx.chat.id;
  ctx.sendMessage("Received your message");
});

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {});

(async () => {

  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  client.session.save();
})()

bot
  .launch()
  .then(() => {
    console.log("Bot started");
  })
  .catch((err) => {
    console.error("Error starting bot", err);
  });
