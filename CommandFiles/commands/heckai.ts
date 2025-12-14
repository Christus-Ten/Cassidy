import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const cmd = easyCMD({
  name: "heckai",
  meta: {
    otherNames: ["heck", "aiheck", "askai"],
    author: "Christus Dev AI",
    description:
      "HECKAI – Smart AI assistant powered by Aryan Chauhan API",
    icon: "🧠",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "HECKAI 🧠⚡",
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

export interface HeckAIResponse {
  status: boolean;
  operator?: string;
  result?: {
    answer?: string;
    related?: string;
    source?: any[];
  };
}

async function main({
  output,
  args,
  commandName,
  prefix,
  input,
  cancelCooldown,
}: CommandContext) {
  const prompt = args.join(" ").trim();
  await output.reaction("🟡");

  if (!prompt) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      `❓ Please provide a prompt.\n\nExample:\n${prefix}${commandName} Explain artificial intelligence`
    );
  }

  try {
    const headers: AxiosRequestConfig["headers"] = {
      "Content-Type": "application/json",
    };

    const apiURL =
      `https://arychauhann.onrender.com/api/heckai` +
      `?prompt=${encodeURIComponent(prompt)}` +
      `&model=1`;

    const res: AxiosResponse<HeckAIResponse> = await axios.get(apiURL, {
      headers,
      timeout: 20_000,
    });

    const answer =
      res.data?.result?.answer?.trim() ||
      "⚠️ No response from HECKAI.";

    const related = res.data?.result?.related?.trim();

    const form: StrictOutputForm = {
      body:
        `🧠 **HECKAI**\n\n` +
        `${answer}` +
        (related ? `\n\n🔎 **Suggestions**\n${related}` : "") +
        `\n\n***Reply to continue the conversation.***`,
    };

    await output.reaction("🟢");
    const info = await output.reply(form);

    // 🔁 Conversation continue
    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({ ...rep, args: rep.input.words });
    });
  } catch (err: any) {
    console.error("HECKAI API Error:", err?.message || err);
    await output.reaction("🔴");
    cancelCooldown();
    return output.reply(
      `❗ Failed to connect to HECKAI API.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
