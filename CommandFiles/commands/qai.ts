import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://zetbot-page.onrender.com/api/Qwen32b";

const cmd = easyCMD({
  name: "qwen32b",
  meta: {
    otherNames: ["qwen", "zetsu-qwen", "qai"],
    author: "Christus",
    description: "Qwen32b AI – Friendly AI assistant by Zetsu",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "Qwen32b AI 🤖",
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

interface Qwen32bResponse {
  operator: string;
  response?: string;
  totalWords?: number;
}

async function main({
  output,
  args,
  input,
  cancelCooldown,
}: CommandContext & { uid?: string }) {
  const prompt = args.join(" ").trim();
  await output.reaction("🟡");

  if (!prompt) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      "❓ Please provide a prompt for Qwen32b AI.\n\nExample: qwen32b Hello!"
    );
  }

  try {
    const params = {
      prompt,
      id: input.sid, // user ID for session
    };

    const res: AxiosResponse<Qwen32bResponse> = await axios.get(API_URL, {
      params,
      timeout: 20_000,
    });

    const answer =
      res.data?.response || "⚠️ No response from Qwen32b AI.";

    const form: StrictOutputForm = {
      body:
        `🤖 **Qwen32b AI**\n\n` +
        `${answer}\n\n` +
        `***Reply to continue the conversation.***`,
    };

    await output.reaction("🟢");
    const info = await output.reply(form);

    // 🔁 Conversation continue
    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({
        ...rep,
        args: rep.input.words,
      });
    });
  } catch (err: any) {
    console.error("Qwen32b AI API Error:", err?.message || err);
    await output.reaction("🔴");
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to Qwen32b AI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
