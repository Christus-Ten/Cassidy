// @ts-check

/**
 * @type {CommandMeta}
 */
export const meta = {
  name: "cdp",
  description: "Envoie une image aléatoire de couple DP",
  author: "Christus dev AI",
  version: "1.0.0",
  usage: "{prefix}{name}",
  category: "Image",
  permissions: [0],
  waitingTime: 5,
  otherNames: ["coupledp"],
  icon: "💑",
  noWeb: true,
};

import axios from "axios";
import { defineEntry } from "@cass/define";

export const entry = defineEntry(async ({ output }) => {
  await output.react("⏳");

  try {
    const res = await axios.get("https://xsaim8x-xxx-api.onrender.com/api/cdp2");
    const { boy, girl } = res.data;

    await output.reply({
      body: "✨ Voici ton couple DP !",
      attachment: await Promise.all([
        global.utils.getStreamFromURL(boy),
        global.utils.getStreamFromURL(girl),
      ]),
    });

    await output.react("✅");
  } catch (err) {
    console.error("CDP Command Error:", err);
    await output.react("❌");
    output.reply("❌ Impossible de récupérer le couple DP.");
  }
});
