import axios from "axios";
import fs from "fs";
import path from "path";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

interface LyricsResponse {
  artist_name: string;
  track_name: string;
  artwork_url: string;
  lyrics: string;
}

export const meta: CommandMeta = {
  name: "lyrics",
  author: "Christus dev AI",
  version: "1.2.0",
  description: "Retrieve song lyrics with artist and artwork",
  category: "Search",
  usage: "{prefix}{name} <song name>",
  role: 0,
  waitingTime: 5,
  icon: "🎼",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Astral • Lyrics Finder 🎶",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  fr: {
    missing: "⚠️ Veuillez fournir le nom d'une chanson !\nExemple : lyrics apt",
    notFound: "❌ Paroles non trouvées.",
    error: "❌ Erreur : Impossible de récupérer les paroles.",
  },
};

function formatLyrics(data: LyricsResponse) {
  return `${UNISpectra.charm} Lyrics Transmission
${UNISpectra.standardLine}
🎼 Titre   : ${data.track_name}
👤 Artiste : ${data.artist_name}
${UNISpectra.standardLine}

${data.lyrics}

${UNISpectra.standardLine}
${UNISpectra.charm} CassidyAstral 🌌`;
}

export const entry = defineEntry(
  async ({ args, output, langParser }) => {
    const t = langParser.createGetLang(langs);
    const query = args.join(" ");

    if (!query) return output.reply(t("missing"));

    try {
      const { data } = await axios.get<LyricsResponse>(
        `https://lyricstx.vercel.app/youtube/lyrics?title=${encodeURIComponent(
          query
        )}`
      );

      if (!data?.lyrics) return output.reply(t("notFound"));

      const imagePath = path.join(__dirname, `lyrics_${Date.now()}.jpg`);

      try {
        const img = await axios.get(data.artwork_url, {
          responseType: "stream",
        });

        const writer = fs.createWriteStream(imagePath);
        img.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        await output.reply({
          body: formatLyrics(data),
          attachment: fs.createReadStream(imagePath),
        });

        fs.unlinkSync(imagePath);
      } catch {
        // fallback sans image
        await output.reply(formatLyrics(data));
      }
    } catch (err) {
      console.error("Lyrics Error:", err);
      output.reply(t("error"));
    }
  }
);
