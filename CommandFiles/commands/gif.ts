import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "gif",
  aliases: ["tenor"],
  author: "Christus dev AI",
  version: "1.0.0",
  description: "Search and fetch GIFs from Tenor API",
  category: "AI",
  usage: "{prefix}{name} <search query> - <number of GIFs>",
  role: 0,
  waitingTime: 5,
  icon: "🎬",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "🎬 Christus • GIF Search",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  fr: {
    noQuery: "⚠️ Veuillez fournir une recherche.\nExemple: /gif Naruto Uzumaki - 5",
    fetching: "🎬 Récupération des GIFs en cours... ⏳",
    noResult: '❌ Aucun GIF trouvé pour "{query}". Essayez une autre recherche.',
    fail: "❌ Impossible de récupérer les GIFs. Veuillez réessayer plus tard.",
  },
};

/* ================= API BASE ================= */

async function getApiBase(): Promise<string | null> {
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json"
    );
    return res.data.apiv1;
  } catch (e) {
    console.error("GitHub raw fetch error:", e);
    return null;
  }
}

/* ================= ENTRY ================= */

export const entry = defineEntry(async ({ output, args, langParser }) => {
  const t = langParser.createGetLang(langs);

  if (!args.length) return output.reply(t("noQuery"));

  let input = args.join(" ").trim();
  let query = input;
  let count = 5;

  if (input.includes("-")) {
    const parts = input.split("-");
    query = parts[0].trim();
    count = parseInt(parts[1].trim()) || 5;
  }

  if (count > 25) count = 25;

  const apiBase = await getApiBase();
  if (!apiBase) return output.reply(t("fail"));

  const loadingMsg = await output.reply(t("fetching"));

  try {
    const res = await axios.get(`${apiBase}/api/gif?query=${encodeURIComponent(query)}`);
    const gifs: string[] = res.data?.gifs || [];

    if (!gifs.length) {
      output.unsend(loadingMsg.messageID);
      return output.reply(t("noResult").replace("{query}", query));
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const gifFiles = await Promise.all(
      gifs.slice(0, count).map(async (url, i) => {
        try {
          const gifData = await axios.get(url, { responseType: "arraybuffer" });
          const gifPath = path.join(cacheDir, `${i + 1}.gif`);
          fs.writeFileSync(gifPath, gifData.data);
          return fs.createReadStream(gifPath);
        } catch (err) {
          console.error(`Failed to fetch GIF: ${url}`, err);
          return null;
        }
      })
    );

    const validGifs = gifFiles.filter(Boolean);
    if (!validGifs.length) {
      output.unsend(loadingMsg.messageID);
      return output.reply(t("fail"));
    }

    await output.reply({
      body: `${UNISpectra.charm} GIFs for "${query}"`,
      attachment: validGifs,
    });

    // Clean cache
    fs.rmSync(cacheDir, { recursive: true, force: true });

    if (loadingMsg?.messageID) output.unsend(loadingMsg.messageID);
  } catch (err) {
    console.error("GIF ERROR:", err);
    output.unsend(loadingMsg.messageID);
    output.reply(t("fail"));
  }
});
