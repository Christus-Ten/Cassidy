import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "genshin",
  aliases: ["tiktokgenshin", "genshinvideo"],
  author: "Christus dev AI",
  version: "1.1.0",
  description: "Récupère une vidéo Genshin depuis l'API Rapido",
  category: "Media",
  usage: "{prefix}{name}",
  role: 0,
  waitingTime: 15,
  icon: "🎮",
  noLevelUI: true,
};

export const entry = defineEntry(async ({ output, langParser }) => {
  const t = langParser.createGetLang({
    fr: {
      fetching: "🎮 Récupération de la vidéo Genshin... ⏳",
      fail: "❌ Impossible de récupérer la vidéo. Veuillez réessayer plus tard.",
    },
  });

  try {
    const loadingMsg = await output.reply(t("fetching"));

    const { data } = await axios.get(
      "https://rapido.zetsu.xyz/api/genshin?apikey=rapi_55197dde42fb4272bfb8f35bd453ba25",
      { timeout: 20000 }
    );

    if (!data?.video_url) return output.reply(t("fail"));

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const videoPath = path.join(cacheDir, `genshin_${Date.now()}.mp4`);

    // Téléchargement de la vidéo
    const videoResp = await axios.get(data.video_url, { responseType: "arraybuffer" });
    fs.writeFileSync(videoPath, Buffer.from(videoResp.data));

    const msgBody = `${UNISpectra.charm} ${data.title}
🎵 Musique: ${data.music}
⏱ Durée: ${data.duration}s
👤 Auteur: ${data.author.nickname} (@${data.author.unique_id})`;

    await output.reply({
      body: msgBody,
      attachment: fs.createReadStream(videoPath),
    });

    fs.unlinkSync(videoPath);

    if (loadingMsg?.messageID) output.unsend(loadingMsg.messageID);
  } catch (err) {
    console.error(err);
    output.reply(t("fail"));
  }
});
