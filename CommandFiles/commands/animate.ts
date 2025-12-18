// CommandFiles/commands/animate.ts

import moment from "moment-timezone";
import axios from "axios";
import fs from "fs-extra";
import path from "path";
import stream from "stream";
import { promisify } from "util";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const pipeline = promisify(stream.pipeline);

const API_ENDPOINT = "https://metakexbyneokex.fly.dev/animate";
const CACHE_DIR = path.join(process.cwd(), "cache", "animate");

/* -------------------- META -------------------- */

export const meta: CommandMeta = {
  name: "animate",
  description: "Generate animated AI videos from text prompts",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}{name} <prompt>",
  category: "AI",
  role: 0,
  noPrefix: false,
  waitingTime: 30,
  requirement: "3.0.0",
  otherNames: ["anim", "genvid"],
  icon: "🎬",
  noLevelUI: true,
};

/* -------------------- STYLE -------------------- */

export const style: CommandStyle = {
  title: "Christus • Animate Generator 🎞️",
  titleFont: "bold",
  contentFont: "fancy",
};

/* -------------------- LANGS -------------------- */

export const langs = {
  en: {
    noQuery:
      "Please provide a prompt to generate a video.\nExample: {prefix}animate a cat swimming",
    generating: "🎬 Generating your animated video...\nPlease wait ⏳",
    failed: "❌ Failed to generate video. Try again later.",
    success: "✅ Video generated successfully!",
  },
};

/* -------------------- FORMAT -------------------- */

function formatHeader() {
  const timestamp = moment().tz("Asia/Manila").format("MMMM D, YYYY h:mm A");
  return `${UNISpectra.charm} Temporal Coordinates
 • 📅 ${timestamp}
${UNISpectra.standardLine}`;
}

/* -------------------- ENTRY -------------------- */

export const entry = defineEntry(
  async ({ input, output, args, langParser }) => {
    const getLang = langParser.createGetLang(langs);

    const prompt = args.join(" ").trim();
    if (!prompt) {
      return output.reply(getLang("noQuery"));
    }

    await fs.ensureDir(CACHE_DIR);

    await output.reply(
      `${formatHeader()}
${UNISpectra.charm} Animate Generator
 • ✨ Prompt: ${prompt}
${UNISpectra.standardLine}
${getLang("generating")}
${UNISpectra.charm} ChristusBot-Midnight 🌃 ${UNISpectra.charm}
[ Transmission from Christus Command ]`
    );

    let tempFilePath: string | null = null;

    try {
      const apiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}`;
      const { data } = await axios.get(apiUrl, {
        timeout: 120_000,
      });

      if (
        !data?.success ||
        !Array.isArray(data.video_urls) ||
        !data.video_urls.length
      ) {
        throw new Error("No video returned by API");
      }

      const videoUrl: string = data.video_urls[0];

      const videoResponse = await axios.get(videoUrl, {
        responseType: "stream",
        timeout: 120_000,
      });

      tempFilePath = path.join(
        CACHE_DIR,
        `animate_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.mp4`
      );

      await pipeline(
        videoResponse.data,
        fs.createWriteStream(tempFilePath)
      );

      await output.reply({
        body: `${formatHeader()}
${UNISpectra.charm} Animate Result
 • 🎞️ Prompt: ${prompt}
${UNISpectra.standardLine}
${getLang("success")}
${UNISpectra.charm} ChristusBot-Midnight 🌃 ${UNISpectra.charm}
[ Transmission from Astral Command ]`,
        attachment: fs.createReadStream(tempFilePath),
      });
    } catch (err) {
      console.error("Animate Command Error:", err);
      output.reply(getLang("failed"));
    } finally {
      if (tempFilePath && (await fs.pathExists(tempFilePath))) {
        fs.unlink(tempFilePath).catch(() => {});
      }
    }
  }
);          .toString(36)
          .slice(2, 8)}.mp4`
      );

      await pipeline(
        videoResponse.data,
        fs.createWriteStream(tempFilePath)
      );

      await output.reply({
        body: `${formatHeader()}
${UNISpectra.charm} Animate Result
 • 🎞️ Prompt: ${prompt}
${UNISpectra.standardLine}
${getLang("success")}
${UNISpectra.charm} CassidyAstral-Midnight 🌃 ${UNISpectra.charm}
[ Transmission from Astral Command ]`,
        attachment: fs.createReadStream(tempFilePath),
      });
    } catch (err) {
      console.error("Animate Command Error:", err);
      output.reply(getLang("failed"));
    } finally {
      if (tempFilePath && (await fs.pathExists(tempFilePath))) {
        fs.unlink(tempFilePath).catch(() => {});
      }
    }
  }
);
