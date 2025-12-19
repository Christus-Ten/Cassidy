import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL =
  "https://arychauhann.onrender.com/api/conciseai";

const cmd = easyCMD({
  name: "conciseai",
  meta: {
    otherNames: ["concise-ai", "concisebot", "ary-concise"],
    author: "Christus dev AI",
    description: "ConciseAI – AI assistant powered by Aryan Chauhan",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "ConciseAI 🤖",
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

interface ConciseAIResponse {
  result: string;
}

async function main({
  output,
  args,
  input,
  cancelCooldown,
}: CommandContext & { uid?: string }) {
  const prompt = args.join(" ").trim();
  await output.reaction("⏳"); // début

  if (!prompt) {
    cancelCooldown();
    await output.reaction("❌"); // erreur
    return output.reply(
      "❓ Please provide a prompt for ConciseAI.\n\nExample: conciseai Hello!"
    );
  }

  try {
    const params = {
      prompt,
    };

    const res: AxiosResponse<ConciseAIResponse> = await axios.get(API_URL, {
      params,
      timeout: 25_000,
    });

    const form: StrictOutputForm = {
      body:
        `🤖 **ConciseAI**\n\n` +
        `${res.data.result}\n\n` +
        `***Reply to continue the conversation.***`,
    };

    await output.reaction("✅"); // succès
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
    console.error("ConciseAI API Error:", err?.message || err);
    await output.reaction("❌"); // erreur
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to ConciseAI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
