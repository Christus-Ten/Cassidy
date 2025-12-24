import axios from "axios";
import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

interface TikTokVideo {
  title: string;
  videoUrl: string;
  duration: number;
  cover: string;
  author: {
    unique_id: string;
  };
}

const TIKTOK_API =
  "https://lyric-search-neon.vercel.app/kshitiz?keyword=";

export const meta: CommandMeta = {
  name: "tiktok",
  otherNames: ["tt"],
  author: "Christus dev AI",
  version: "1.0.0",
  description: "Search and download TikTok videos",
  category: "Media",
  usage: "{prefix}{name} <search query>",
  role: 0,
  waitingTime: 5,
  icon: "🎵",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Christus • TikTok Downloader 🎵",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noQuery: "❌ Provide a search query.",
    noResults: "❌ No TikTok videos found.",
    invalidSelect: "❌ Invalid selection. Choose 1–6.",
    downloadFail: "❌ Failed to download TikTok video.",
  },
};

async function streamFromURL(url: string) {
  const res = await axios({ url, responseType: "stream" });
  return res.data;
}

function buildList(videos: TikTokVideo[]) {
  const time = moment().tz("UTC").format("MMMM D, YYYY h:mm A");

  const list = videos
    .map(
      (v, i) =>
        ` • ${i + 1}. ${v.title.substring(0, 50)}\n   👤 @${
          v.author.unique_id
        }\n   ⏱ ${v.duration}s`
    )
    .join("\n\n");

  return `${UNISpectra.charm} Temporal Coordinates
 • 📅 ${time}
${UNISpectra.standardLine}
${UNISpectra.charm} Select a TikTok video
${list}
${UNISpectra.standardLine}
${UNISpectra.charm} Reply with a number (1–6)
${UNISpectra.charm} ChristusBot 🎵`;
}

async function downloadVideo(
  videoUrl: string,
  output: any
) {
  const filePath = path.join(
    __dirname,
    `tiktok_${Date.now()}.mp4`
  );

  const writer = fs.createWriteStream(filePath);
  const res = await axios({
    url: videoUrl,
    responseType: "stream",
  });

  res.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  await output.reply({
    attachment: fs.createReadStream(filePath),
  });

  fs.unlinkSync(filePath);
}

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);
    const query = args.join(" ").trim();

    if (!query) return output.reply(t("noQuery"));

    try {
      const { data } = await axios.get(
        TIKTOK_API + encodeURIComponent(query),
        { timeout: 20000 }
      );

      const videos: TikTokVideo[] = data.slice(0, 6);
      if (!videos.length) return output.reply(t("noResults"));

      const thumbs = await Promise.all(
        videos.map((v) => streamFromURL(v.cover))
      );

      const msg = await output.reply({
        body: buildList(videos),
        attachment: thumbs,
      });

      input.setReply(msg.messageID, {
        key: "tiktok",
        id: input.senderID,
        results: videos,
      });
    } catch (e) {
      output.reply(t("noResults"));
    }
  }
);

export async function reply({
  input,
  output,
  repObj,
  detectID,
  langParser,
}: CommandContext & {
  repObj: {
    id: string;
    results: TikTokVideo[];
  };
}) {
  const t = langParser.createGetLang(langs);
  if (input.senderID !== repObj.id) return;

  const choice = parseInt(input.body);
  if (
    isNaN(choice) ||
    choice < 1 ||
    choice > repObj.results.length
  ) {
    return output.reply(t("invalidSelect"));
  }

  const selected = repObj.results[choice - 1];
  input.delReply(String(detectID));

  try {
    await downloadVideo(selected.videoUrl, output);
  } catch {
    output.reply(t("downloadFail"));
  }
}
