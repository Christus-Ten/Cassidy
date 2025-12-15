import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const cmd = easyCMD({
  name: "gpt5",
  meta: {
    otherNames: ["gpt5", "ai2", "ask"],
    author: "Christus Dev AI",
    description:
      "A versatile assistant that provides information, answers questions, and assists with a wide range of tasks.",
    icon: "🤖",
    version: "1.3.3",
    noPrefix: "both",
  },
  title: {
    content: "GPT5 FREE 🖼️🎓",
    text_font: "bold",
    line_bottom: "default",
  },
  content: {
    content: null,
    text_font: "none",
    line_bottom: "hidden",
  },
  run(ctx) {
    return main(ctx);
  },
});

export interface ResponseType {
  status: boolean;
  result?: string;
}

async function main({
  output,
  args,
  commandName,
  prefix,
  input,
  cancelCooldown,
  usersDB,
}: CommandContext) {
  let ask = args.join(" ");
  await output.reaction("🟡");

  if (!ask) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      `❓ Please provide a question for **Christus Bot**.\n\nExample: ${prefix}${commandName} What is quantum AI?`
    );
  }

  try {
    const headers: AxiosRequestConfig["headers"] = {
      "Content-Type": "application/json",
    };

    const apiURL = `https://arychauhann.onrender.com/api/gpt5?prompt=${encodeURIComponent(
      ask
    )}&uid=${input.sid}&reset=`;

    const res: AxiosResponse<ResponseType> = await axios.get(apiURL, {
      headers,
      timeout: 25_000,
    });

    const answer = res.data?.result || "⚠️ No response from Christus Bot.";

    const form: StrictOutputForm = {
      body: `🌌 **Christus Bot**\n\n${answer}\n\n***You can reply to continue the conversation.***`,
    };

    await output.reaction("🟢");
    const info = await output.reply(form);

    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({ ...rep, args: rep.input.words });
    });
  } catch (err: any) {
    console.error("Error calling GPT5 API:", err?.message || err);
    await output.reaction("🔴");
    cancelCooldown();
    return output.reply(
      `❗ An error occurred while connecting to the API.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
