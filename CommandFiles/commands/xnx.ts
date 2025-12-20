import axios from "axios";
import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const API_CONFIG_URL =
  "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

/* ================= TYPES ================= */

interface APIConfig {
  api: string;
}

interface XNXVideo {
  title: string;
  link: string;
  duration?: string;
  views?: string;
  thumbnail?: string;
}

interface XNXDownload {
  title: string;
  duration?: string;
  info?: string;
  files: {
    high?: string;
    low?: string;
  };
}

/* ================= META ================= */

export const meta: CommandMeta = {
  name: "xnx",
  author: "Christus dev AI",
  version: "1.0.0",
  description: "Search and download videos",
  category: "Media",
  usage: "{prefix}{name} <keyword>",
  role: 2,
  waitingTime: 5,
  icon: "🎥",
  noLevelUI: true,
};

/* ================= STYLE ================= */

export const style: CommandStyle = {
  title: "Christus • XNX Downloader 🎬",
  titleFont: "bold",
  contentFont: "fancy",
};

/* ================= LANGS ================= */

export const langs = {
  en: {
    noQuery: "❌ Provide a search keyword.",
    noResults: "❌ No results found.",
    invalidSelect: "❌ Invalid selection. Choose 1–6.",
    apiFail: "❌ Failed to fetch API configuration.",
    downloadFail: "❌ Failed to download video.",
  },
};

/* ================= UTILS ================= */

async function getAPIBase(): Promise<string> {
  const { data } = await axios.get<APIConfig>(API_CONFIG_URL);
  if (!data?.api) throw new Error("Missing api field");
  return data.api;
}

async function streamFromURL(url: string) {
  const res = await axios({ url, responseType: "stream" });
  return res.data;
}

function buildList(videos: XNXVideo[]) {
  const time = moment().tz("UTC").format("MMMM D, YYYY h:mm A");

  const list = videos
    .map(
      (v, i) =>
        ` • ${i + 1}. ${v.title}\n   ⏱ ${
          v.duration || "N/A"
        } | 👀 ${v.views || "N/A"}`
    )
    .join("\n\n");

  return `${UNISpectra.charm} Temporal Coordinates
 • 📅 ${time}
${UNISpectra.standardLine}
${UNISpectra.charm} Select a video
${list}
${UNISpectra.standardLine}
${UNISpectra.charm} Reply with a number (1–6)
${UNISpectra.charm} ChristusBot 🎬`;
}

async function downloadVideo(
  videoUrl: string,
  apiBase: string,
  output: any
) {
  const { data } = await axios.get<{ result: XNXDownload }>(
    `${apiBase}/xnxdl?url=${encodeURIComponent(videoUrl)}`
  );

  const fileUrl = data?.result?.files?.high || data?.result?.files?.low;
  if (!fileUrl) throw new Error("No file");

  const filePath = path.join(__dirname, `xnx_${Date.now()}.mp4`);
  const writer = fs.createWriteStream(filePath);

  const res = await axios({ url: fileUrl, responseType: "stream" });
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

/* ================= ENTRY ================= */

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const t = langParser.createGetLang(langs);
    const query = args.join(" ");

    if (!query) return output.reply(t("noQuery"));

    let apiBase: string;
    try {
      apiBase = await getAPIBase();
    } catch {
      return output.reply(t("apiFail"));
    }

    try {
      const res = await axios.get<{ result: XNXVideo[] }>(
        `${apiBase}/xnx?q=${encodeURIComponent(query)}`
      );

      const videos = res.data.result?.slice(0, 6);
      if (!videos || videos.length === 0)
        return output.reply(t("noResults"));

      const thumbs = await Promise.all(
        videos
          .filter((v) => v.thumbnail)
          .map((v) => streamFromURL(v.thumbnail!))
      );

      const msg = await output.reply({
        body: buildList(videos),
        attachment: thumbs,
      });

      input.setReply(msg.messageID, {
        key: "xnx",
        id: input.senderID,
        results: videos,
        apiBase,
      });
    } catch {
      output.reply(t("noResults"));
    }
  }
);

/* ================= REPLY ================= */

export async function reply({
  input,
  output,
  repObj,
  detectID,
  langParser,
}: CommandContext & {
  repObj: {
    id: string;
    results: XNXVideo[];
    apiBase: string;
  };
}) {
  const t = langParser.createGetLang(langs);
  if (input.senderID !== repObj.id) return;

  const choice = parseInt(input.body);
  if (isNaN(choice) || choice < 1 || choice > repObj.results.length) {
    return output.reply(t("invalidSelect"));
  }

  const selected = repObj.results[choice - 1];
  input.delReply(String(detectID));

  try {
    await downloadVideo(selected.link, repObj.apiBase, output);
  } catch {
    output.reply(t("downloadFail"));
  }
    }
