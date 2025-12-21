import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "boobs",
  aliases: ["tits", "breasts"],
  author: "Christus Dev AI",
  version: "1.0.0",
  description: "Generate NSFW boobs images",
  category: "NSFW",
  usage: "{prefix}{name}",
  role: 2,
  waitingTime: 5,
  icon: "🍒",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🍒 Christus • Boobs Generator",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    generating: "🍒 | Generating image, please wait...",
    generateFail: "❌ | Failed to generate NSFW image.",
  },
};

/* ================= CONSTANTS ================= */

const API_URL = "https://delirius-apiofc.vercel.app/nsfw/boobs";
const CACHE_DIR = path.join(__dirname, "tmp");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ input, output, langParser }) => {
    const t = langParser.createGetLang(langs);
    const waitMsg = await output.reply(t("generating"));

    try {
      const response = await axios.get(API_URL, {
        responseType: "arraybuffer",
        timeout: 120000,
      });

      if (!response.data) throw new Error("No image returned");

      const filePath = path.join(CACHE_DIR, `boobs_${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      await output.unsend(waitMsg.messageID);

      await output.reply({
        body: `✅ NSFW image generated successfully!`,
        attachment: fs.createReadStream(filePath),
      });

      fs.unlinkSync(filePath);
    } catch (err: any) {
      console.error("Boobs Command Error:", err.message || err);
      await output.unsend(waitMsg.messageID);
      output.reply(t("generateFail"));
    }
  }
);
