import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "animagine2",
  aliases: ["ani2", "anim2"],
  author: "Christus Dev AI",
  version: "1.0.0",
  description: "Generate AI images using Animagine 4.0 API",
  category: "AI",
  usage: "{prefix}{name} <prompt>",
  role: 2,
  waitingTime: 5,
  icon: "🎨",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🎨 Christus • Animagine 4.0",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    noPrompt: "❌ | Please provide a prompt.",
    generating: "🎨 | Generating your Animagine 4.0 image...",
    generateFail: "❌ | Image generation failed.",
  },
};

/* ================= CONSTANTS ================= */

const API_KEY = "rapi_55197dde42fb4272bfb8f35bd453ba25";
const API_URL = "https://rapido.zetsu.xyz/api/animagine-4-0";
const CACHE_DIR = path.join(__dirname, "tmp");

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);

    if (!args.length) return output.reply(t("noPrompt"));

    const prompt = args.join(" ").trim();
    const waitMsg = await output.reply(t("generating"));

    try {
      const response = await axios.get(API_URL, {
        params: {
          apikey: API_KEY,
          prompt,
        },
        responseType: "arraybuffer",
        timeout: 180000,
      });

      if (!response.data) throw new Error("No image returned");

      const filePath = path.join(CACHE_DIR, `animagine_${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      await output.unsend(waitMsg.messageID);

      await output.reply({
        body: `✅ Image generated successfully!\n🧠 Prompt: ${prompt}`,
        attachment: fs.createReadStream(filePath),
      });

      fs.unlinkSync(filePath);
    } catch (err: any) {
      console.error("Animagine Command Error:", err.message || err);
      await output.unsend(waitMsg.messageID);
      output.reply(t("generateFail"));
    }
  }
);
