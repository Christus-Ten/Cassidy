import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "crip",
  aliases: [],
  author: "Hassan • TS fixed by Christus",
  version: "1.0.0",
  description: "Generate a photorealistic image using your own Crip API.",
  category: "Image Generation",
  usage: "{prefix}{name} <prompt>",
  role: 2,
  waitingTime: 5,
  icon: "🖼️",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🖼️ Crip AI Generator",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    noPrompt: "❌ | Please enter a prompt.\nExample: crip astronaut dog on mars",
    generating: "⌛ | Generating your image, please wait...",
    generateFail: "❌ | Error generating image. Please try again later.",
  },
};

/* ================= CONSTANTS ================= */

const API_URL = "https://hassan-crip-2-o.vercel.app/api/crip";
const CACHE_DIR = path.join(__dirname, "cache");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);

    if (!args.length) return output.reply(t("noPrompt"));

    const prompt = args.join(" ").trim();
    const waitMsg = await output.reply(t("generating"));

    try {
      const response = await axios.post(
        API_URL,
        { prompt },
        {
          headers: { "Content-Type": "application/json" },
          responseType: "arraybuffer",
          timeout: 120000,
        }
      );

      if (!response.data) throw new Error("No image returned");

      const filePath = path.join(CACHE_DIR, `crip_image_${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      await output.unsend(waitMsg.messageID);

      await output.reply({
        body: `✅ | Here's your generated image for:\n"${prompt}"`,
        attachment: fs.createReadStream(filePath),
      });

      fs.unlinkSync(filePath);
    } catch (err: any) {
      console.error("Crip Command Error:", err.message || err);
      await output.unsend(waitMsg.messageID);
      output.reply(t("generateFail"));
    }
  }
);
