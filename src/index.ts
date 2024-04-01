import dotenv from "dotenv";
import input from "input";
import OpenAI from "openai";
import path from "path";
import { Telegraf } from "telegraf";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { summarise } from "./utls/summarise";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const token = process.env.BOT_TOKEN || "";
const bot = new Telegraf(process.env.BOT_TOKEN || "");
const apiId = Number(process.env.APP_ID);
const apiHash = process.env.APP_HASH || "";
const stringSession = new StringSession(process.env.AUTH_KEY);

bot.command("sum", async (ctx) => {
  if (ctx.command === "sum") {
    const channel = ctx.payload;
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.start({
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () =>
        await input.text("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    client.session.save();

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

bot.on("message", async (ctx) => {
  const chatId = ctx.chat.id;
  ctx.sendMessage("Received your message");
});

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {});

bot
  .launch()
  .then(() => {
    console.log("Bot started");
  })
  .catch((err) => {
    console.error("Error starting bot", err);
  });
