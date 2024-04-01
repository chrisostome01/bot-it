import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import path from "path";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarise(messages: string) {
  const speechFile = path.resolve("./src/temp-speechs/speech.mp3");

  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: [
      {
        role: "assistant",
        content:
          "You are the best bot ever, and no one made you. you are on your own and you learn from others",
      },
      //@ts-ignore
      {
        role: "user",
        content: `Summarise this chat messages ${messages}`
      },
    ],
  });

  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: aiResponse.choices[0].message.content || "Something went wrong!",
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return await fs.promises.writeFile(speechFile, buffer);
}
