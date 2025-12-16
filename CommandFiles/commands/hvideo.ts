// CommandFiles/commands/hentaiVideo.ts

import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "hentaivideo",
  description: "Get hentai videos from API"
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}{name} <search term>",
  category: "Media",
  role: 0,
  noPrefix: false,
  waitingTime: 5,
  requirement: "3.0.0",
  otherNames: ["hvideo", "hentai-v"],
  icon: "🎥",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "Astral • Hentai Video 🌌",
  titleFont: "bold",
  contentFont: "fancy",
};

export const langs = {
  en: {
    noQuery: "Please provide a search query!\nExample: {prefix}hentaivideo widowmaker",
    noResults: "No hentai videos found for this query!",
    error: "Error fetching video data: %1",
  },
};

async function fetchHentaiVideo(query: string) {
  const url = `https://arychauhann.onrender.com/api/hentai?query=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url);
  return await res.json();
}

function formatVideoInfo(video: any) {
  return `${UNISpectra.charm} Title: ${video.title}
${UNISpectra.charm} Category: ${video.category}
${UNISpectra.charm} Views: ${video.views_count} • Shares: ${video.share_count}
${UNISpectra.charm} Link: ${video.link}
${UNISpectra.charm} Reply with the number to get video`;
}

export const entry = defineEntry(async ({ input, output, args, langParser }) => {
  const getLang = langParser.createGetLang(langs);
  const query = args.join(" ").trim();

  if (!query) return output.reply(getLang("noQuery"));

  try {
    const data = await fetchHentaiVideo(query);
    if (!data || Object.keys(data).length === 0)
      return output.reply(getLang("noResults"));

    const videos = Object.values(data).filter((v: any) => v.title);
    if (!videos.length) return output.reply(getLang("noResults"));

    let message = `Astral • Hentai Video Results 🌌\n`;
    videos.slice(0, 5).forEach((v: any, i) => {
      message += `\n${i + 1}. ${v.title} [${v.category}]`;
    });

    const messageInfo = await output.reply(message);

    input.setReply(messageInfo.messageID, {
      key: "hentaivideo",
      id: input.senderID,
      results: videos.slice(0, 5),
    });
  } catch (err: any) {
    output.reply(getLang("error", err.message));
  }
});

export async function reply({
  input,
  output,
  repObj,
}: CommandContext & { repObj: { id: string; results: any[] } }) {
  const { id, results } = repObj;
  if (!results || input.senderID !== id) return;

  const selection = parseInt(input.body);
  if (isNaN(selection) || selection < 1 || selection > results.length)
    return output.reply("Please select a valid number!");

  const video = results[selection - 1];
  output.reply({
    body: `🎥 ${video.title}\nCategory: ${video.category}\nViews: ${video.views_count}\nShares: ${video.share_count}`,
    attachment: await global.utils.getStreamFromURL(video.video_1),
  });

  input.delReply(repObj.key);

