// CommandFiles/commands/nano.ts

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "nanob",
  description: "Génère une image aléatoire avec Nano AI",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}nano",
  category: "Image Generator",
  role: 0,
  waitingTime: 5,
  otherNames: [],
  icon: "🧬",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Nano • AI Image Generator 🧬",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  fr: {
    processing:
      "🧬 Génération de votre image Nano AI...\nVeuillez patienter...",
    success:
      "✅ Image Nano générée avec succès !",
    error:
      "❌ Impossible de générer l'image Nano pour le moment. Réessayez plus tard.",
  },
  en: {
    processing:
      "🧬 Generating your Nano AI image...\nPlease wait...",
    success:
      "✅ Nano image generated successfully!",
    error:
      "❌ Unable to generate Nano image at the moment. Please try again later.",
  },
};

export const entry = defineEntry(
  async ({ output, langParser }) => {
    const getLang = langParser.createGetLang(langs);

    const timestamp = moment()
      .tz("Asia/Manila")
      .format("MMMM D, YYYY h:mm A");

    const processingMsg = await output.reply(
      `${UNISpectra.charm} ${getLang("processing")}\n• 📅 ${timestamp}`
    );

    const imgPath = path.join(
      __dirname,
      "cache",
      `nano_${Date.now()}.png`
    );

    const apiURL = "https://christus-api.vercel.app/image/nano";

    try {
      const response = await axios.get(apiURL, {
        responseType: "arraybuffer",
      });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, response.data);

      await output.unsend(processingMsg.messageID);

      await output.reply({
        body: getLang("success"),
        attachment: fs.createReadStream(imgPath),
      });
    } catch (err) {
      console.error("Nano AI Error:", err);
      await output.unsend(processingMsg.messageID);
      await output.reply(getLang("error"));
    } finally {
      if (await fs.pathExists(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
);
