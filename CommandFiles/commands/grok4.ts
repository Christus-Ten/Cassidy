import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";
import path from "path";
import * as fs from "fs";

const cmd = easyCMD({
  name: "grok_4",
  meta: {
    otherNames: ["grok4", "grok", "g4fr"],
    author: "Christus dev AI",
    description: "Chat with Grok 4 Fast Reasoning AI",
    icon: "🧠",
    version: "1.0.0",
    noPrefix: "both",
  },
  category: "AI",
  title: {
    content: "Grok 4 Fast Reasoning 🤖",
    text_font: "bold",
    line_bottom: "default",
  },
  content: {
    content: null,
    text_font: "none",
    line_bottom: "hidden",
  },
  run(ctx) {
    return main(ctx);
  },
});

export interface GrokResponse {
  status: string;
  reply?: string;
  images?: {
    description?: string;
    url?: string;
  }[];
}

async function main({
  output,
  args,
  input,
  usersDB,
  cancelCooldown,
}: CommandContext) {
  let query = args.join(" ");
  await output.reaction("🟡");

  if (!query && (!input.replier || !input.replier.body)) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      `Please provide a message for **Grok 4**.\n\nExample: ${input.prefix}${input.commandName} Hello Grok!`
    );
  }

  if (input.replier && input.replier.body) {
    query = input.replier.body;
  }

  // Optionnel : ajout d'infos utilisateur dans la requête
  const user = await usersDB.getUserInfo(input.sid);
  const userCache = await usersDB.getCache(input.sid);
  if (user?.name || userCache.name) {
    query = `${user?.name || userCache.name} Info:\nThey have ${Number(
      userCache.money
    ).toLocaleString()} balance.\n\n${query}`;
  }

  const baseUrl = "https://redwans-apis.gleeze.com";
  const apiUrl = `${baseUrl}/api/Grok-4-Fast-Reasoning?uid=${input.sid}&msg=${encodeURIComponent(
    query
  )}`;

  const headers: AxiosRequestConfig["headers"] = {
    Accept: "application/json",
    "User-Agent": "Grok-4-Fast-Reasoning-Client/1.0",
  };

  try {
    const res: GrokResponse = (await axios.get(apiUrl, { headers })).data;

    if (res.status !== "success" || !res.reply) {
      await output.reaction("🔴");
      return output.reply("AI returned an invalid response.");
    }

    const form: StrictOutputForm = {
      body: `Grok 4 Fast Reasoning\n\n${res.reply}\n\n***You can reply to this conversation.***`,
    };

    // Gestion des images si présentes
    if (Array.isArray(res.images)) {
      for (const image of res.images) {
        if (image.url) {
          const filePath = path.join(
            process.cwd(),
            "temp",
            `grok4_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}.png`
          );

          const imageRes: AxiosResponse<ArrayBuffer> = await axios.get(image.url, {
            responseType: "arraybuffer",
          });
          fs.writeFileSync(filePath, Buffer.from(imageRes.data));
          form.attachment = fs.createReadStream(filePath);
          form.body = image.description || form.body;

          form.attachment.on("end", () => fs.unlinkSync(filePath));
          break; // seulement la première image
        }
      }
    }

    await output.reaction("🟢");
    const info = await output.reply(form);

    // Support pour reply
    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({ ...rep, args: rep.input.words });
    });
  } catch (error) {
    await output.reaction("🔴");
    console.error(error);
    output.reply("Grok 4 Fast Reasoning service is currently unavailable.");
  }
}

export default cmd;
