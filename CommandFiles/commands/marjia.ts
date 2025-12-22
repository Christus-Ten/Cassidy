import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "marjia",
  aliases: ["mrgen", "mrjen"],
  author: "Christus dev AI",
  version: "1.0.0",
  description: "Generate an image based on a prompt.",
  category: "Image Generation",
  usage: "{prefix}{name} <prompt>",
  role: 0,
  waitingTime: 20,
  icon: "🖼️",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🖼️ Marjia AI Generator",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    noPrompt: "❌ | You need to provide a prompt.",
    generating: "🔄 | Generating your image, please wait...",
    generateFail: "❌ | An error occurred while generating the image. Please try again later.",
  },
};

/* ================= CONSTANTS ================= */

const API_URL = "https://global-redwan-apis-mage.onrender.com/generate-image";
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
      const response = await axios.get(API_URL, {
        params: { prompt },
        responseType: "arraybuffer",
        timeout: 120000,
      });

      if (!response.data) throw new Error("No image returned");

      const filePath = path.join(CACHE_DIR, `${Date.now()}_marjia_image.png`);
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      await output.unsend(waitMsg.messageID);

      await output.reply({
        body: `✅ | Here is your generated image for: "${prompt}"`,
        attachment: fs.createReadStream(filePath),
      });

      fs.unlinkSync(filePath);
    } catch (err: any) {
      console.error("Marjia Command Error:", err.message || err);
      await output.unsend(waitMsg.messageID);
      output.reply(t("generateFail"));
    }
  }
);
