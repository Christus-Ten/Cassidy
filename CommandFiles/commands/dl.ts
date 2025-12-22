import axios from "axios";
import fs from "fs";
import path from "path";

export const meta: CommandMeta = {
  name: "autodl",
  description:
    "Autodownloader for YouTube, Spotify, TikTok, Instagram, and other media URLs.",
  version: "3.0.1",
  author: "Christus dev AI",
  requirement: "2.5.0",
  icon: "📥",
  category: "Media",
  role: 1,
  noWeb: true,
};

export const style: CommandStyle = {
  title: "📥 Media Auto Downloader",
  titleFont: "bold",
  contentFont: "fancy",
};

const supportedLinks: Record<string, RegExp> = {
  youtube: /(youtube\.com|youtu\.be)/i,
  instagram: /(instagram\.com|instagr\.am)/i,
  tiktok: /(tiktok\.com|vm\.tiktok\.com)/i,
  capcut: /(capcut\.com)/i,
  facebook: /(facebook\.com|fb\.watch)/i,
  twitter: /(twitter\.com|x\.com)/i,
  dailymotion: /(dailymotion\.com|dai\.ly)/i,
  vimeo: /(vimeo\.com)/i,
  pinterest: /(pinterest\.com|pin\.it)/i,
  imgur: /(imgur\.com)/i,
  soundcloud: /(soundcloud\.com|on\.soundcloud\.com)/i,
  spotify: /(spotify\.com|spotify\.link)/i,
  ted: /(ted\.com)/i,
  tumblr: /(tumblr\.com)/i,
};

function isSupported(url: string) {
  return Object.values(supportedLinks).some(r => r.test(url));
}

function formatDuration(durationMs: number) {
  const units = [
    { unit: "hr", factor: 3600000 },
    { unit: "min", factor: 60000 },
    { unit: "sec", factor: 1000 },
    { unit: "ms", factor: 1 },
  ];
  for (const { unit, factor } of units) {
    if (durationMs >= factor) {
      const value = durationMs / factor;
      return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
    }
  }
  return "0 ms";
}

async function downloadMedia(url: string, output: CommandContext["output"]) {
  if (!isSupported(url)) return output.reply("❌ This platform is not supported.");

  output.react("⏳");
  let res;
  try {
    const apiUrl = `https://downvid.onrender.com/api/download?url=${encodeURIComponent(url)}`;
    res = await axios.get(apiUrl, { timeout: 60000 });
  } catch (err) {
    console.error(err);
    output.react("❌");
    return output.reply("❌ Download failed (connection error).");
  }

  const data = res.data;
  if (!data || data.status !== "success") {
    output.react("❌");
    return output.reply("❌ Download failed (API error).");
  }

  const mediaData = data?.data?.data || {};
  const videoUrl = data.video || mediaData.nowm || null;
  const audioUrl = data.audio || null;

  const downloads: { url: string; type: "video" | "audio" }[] = [];
  let header = "";

  const isSpotify = supportedLinks.spotify.test(url);
  const isYouTube = supportedLinks.youtube.test(url);

  if (isSpotify) {
    if (!audioUrl) return output.reply("❌ No audio for Spotify link.");
    downloads.push({ url: audioUrl, type: "audio" });
    header = "✅ Spotify Audio 🎧\n\n";
  } else if (isYouTube) {
    if (videoUrl) downloads.push({ url: videoUrl, type: "video" });
    if (audioUrl) downloads.push({ url: audioUrl, type: "audio" });
    if (!downloads.length) return output.reply("❌ No media for YouTube link.");
    header =
      downloads.length === 2
        ? "✅ YouTube Video + Audio 🎬🎧\n\n"
        : downloads[0].type === "video"
        ? "✅ YouTube Video 🎬\n\n"
        : "✅ YouTube Audio 🎧\n\n";
  } else {
    if (!videoUrl) return output.reply("❌ No video found for this link.");
    downloads.push({ url: videoUrl, type: "video" });
    header = "✅ Video Downloaded 🎬\n\n";
  }

  const title = mediaData.title || mediaData.shortTitle || "Downloaded Media";
  const likes = mediaData.like ?? "N/A";
  const comments = mediaData.comment ?? "N/A";
  const duration = mediaData.duration_ms ? formatDuration(mediaData.duration_ms) : "N/A";

  // Message sans le lien de la vidéo
  const message = `${header}📌 Title: ${title}\n👍 Likes: ${likes}   💬 Comments: ${comments}\n⏱️ Duration: ${duration}`;

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const streams: fs.ReadStream[] = [];
  const tempFiles: string[] = [];

  try {
    for (const item of downloads) {
      const ext = item.type === "audio" ? "mp3" : "mp4";
      const tempPath = path.join(
        cacheDir,
        `autodl_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      );
      const response = await axios.get(item.url, { responseType: "arraybuffer", timeout: 120000 });
      fs.writeFileSync(tempPath, response.data);
      streams.push(fs.createReadStream(tempPath));
      tempFiles.push(tempPath);
    }

    await output.replyStyled({ body: message, attachment: streams }, style);
    tempFiles.forEach(file => { try { fs.unlinkSync(file); } catch (_) {} });
    output.reaction("✅");
  } catch (err) {
    console.error(err);
    tempFiles.forEach(file => { try { fs.unlinkSync(file); } catch (_) {} });
    output.react("❌");
    output.reply("❌ Error while downloading or sending file(s).");
  }
}

export async function entry({ output, input, threadsDB, args }: CommandContext) {
  if (!input.isAdmin) return output.reply("You cannot enable/disable this feature.");

  const cache = await threadsDB.getCache(input.threadID);
  const isEnabled = cache.autodl ?? false;
  const choice = args[0] === "on" ? true : args[0] === "off" ? false : !isEnabled;

  await threadsDB.setItem(input.threadID, { autodl: choice });
  output.reply(`✅ ${choice ? "Enabled" : "Disabled"} successfully!`);

  const match = args.join(" ").match(/https?:\/\/\S+/i);
  if (match) await downloadMedia(match[0], output);
}

export async function event({ output, input, threadsDB }: CommandContext) {
  try {
    const cache = await threadsDB.getCache(input.threadID);
    if (cache.autodl === false) return;

    const body = String(input);
    const match = body.match(/https?:\/\/\S+/i);
    if (match) await downloadMedia(match[0], output);
  } catch (err) {
    output.replyStyled(require("util").inspect(err), style);
  }
}
