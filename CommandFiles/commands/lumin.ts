// CommandFiles/commands/lumin.ts

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "lumin",
  description: "Génère une image IA avec l'API Oculux Luminarium",
  author: "Christus dev AI",
  version: "1.0.1",
  usage: "{prefix}lumin <prompt>",
  category: "Image Generator",
  role: 0,
  waitingTime: 5,
  otherNames: [],
  icon: "🎨",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Astral • Luminarium Image Generator 🌌",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  fr: {
    noPrompt:
      "⚠️ Veuillez fournir un prompt.\nExemple : {prefix}lumin ville néon futuriste de nuit",
    processing: "🎨 Génération de votre image Luminarium... Veuillez patienter...",
    success: "✅ Voici votre image générée pour : \"{prompt}\"",
    error: "⚠️ Échec de la génération de l'image. Veuillez réessayer plus tard.",
  },
};

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const getLang = langParser.createGetLang(langs);
    const prompt = args.join(" ").trim();

    if (!prompt) return output.reply(getLang("noPrompt"));

    const timestamp = moment().tz("Asia/Manila").format("MMMM D, YYYY h:mm A");
    const processingMsg = await output.reply(`${UNISpectra.charm} ${getLang("processing")}\n• 📅 ${timestamp}`);

    const encodedPrompt = encodeURIComponent(prompt);
    const imgPath = path.join(__dirname, "cache", `lumin_${Date.now()}.png`);
    const url = `https://dev.oculux.xyz/api/luminarium?prompt=${encodedPrompt}`;

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, response.data);

      await output.unsend(processingMsg.messageID);

      await output.reply({
        body: getLang("success", { prompt }),
        attachment: fs.createReadStream(imgPath),
      });
    } catch (err) {
      console.error("Erreur de génération Luminarium :", err);
      await output.unsend(processingMsg.messageID);
      await output.reply(getLang("error"));
    } finally {
      if (await fs.pathExists(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
);
