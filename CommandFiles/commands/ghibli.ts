// CommandFiles/commands/ghibli.ts

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "ghibli",
  description: "Convertit une image en style Studio Ghibli",
  author: "Aryan Chauchan • TS fixed by Christus",
  version: "1.0.0",
  usage: "{prefix}ghibli <imageURL> (ou répondre à une image)",
  category: "Image Generator",
  role: 0,
  waitingTime: 5,
  otherNames: ["ghibliart"],
  icon: "🎬",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Studio Ghibli • AI Style 🎬",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  fr: {
    noImage:
      "⚠️ Veuillez fournir une URL d’image ou répondre à une image.",
    processing:
      "🎬 Transformation en style Studio Ghibli...\n⏳ Veuillez patienter...",
    success:
      "✅ Image Ghibli générée avec succès !",
    error:
      "❌ Impossible de générer l’image Ghibli.\n🔄 Réessayez plus tard.",
  },
};

export const entry = defineEntry(
  async ({ args, output, event, langParser }) => {
    const getLang = langParser.createGetLang(langs);

    let imageUrl = args[0];

    // 📸 Image depuis message répondu
    if (
      !imageUrl &&
      event.messageReply?.attachments?.length
    ) {
      const att = event.messageReply.attachments[0];
      if (att.type === "photo" || att.type === "image") {
        imageUrl = att.url || att.previewUrl;
      }
    }

    if (!imageUrl) return output.reply(getLang("noImage"));

    const timestamp = moment()
      .tz("Asia/Manila")
      .format("MMMM D, YYYY h:mm A");

    const processingMsg = await output.reply(
      `${UNISpectra.charm} ${getLang("processing")}\n• 📅 ${timestamp}`
    );

    const imgPath = path.join(
      __dirname,
      "cache",
      `ghibli_${Date.now()}.webp`
    );

    try {
      const res = await axios.get(
        "https://estapis.onrender.com/api/ai/img2img/ghibli/v12",
        { params: { imageUrl } }
      );

      if (!res.data?.url) {
        await output.unsend(processingMsg.messageID);
        return output.reply(getLang("error"));
      }

      // Télécharger l’image générée
      const imgData = await axios.get(res.data.url, {
        responseType: "arraybuffer",
      });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, imgData.data);

      await output.unsend(processingMsg.messageID);

      await output.reply({
        body: `${getLang("success")}\n🖼️ Fichier: ${res.data.orig_name || "ghibli.webp"}`,
        attachment: fs.createReadStream(imgPath),
      });

    } catch (err) {
      console.error("Ghibli AI Error:", err);
      await output.unsend(processingMsg.messageID);
      await output.reply(getLang("error"));
    } finally {
      if (await fs.pathExists(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
);
