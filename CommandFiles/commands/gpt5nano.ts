import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://redwans-apis.gleeze.com/api/gpt-5-nano";

const cmd = easyCMD({
  name: "gpt5nano",
  meta: {
    otherNames: ["5nano", "nano5", "gpt_5_nano"],
    author: "Christus dev AI",
    description: "GPT-5 Nano – Conversational AI assistant",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "GPT-5 Nano 🤖",
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

interface GPT5NanoResponse {
  status: string;
  reply?: string;
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
    await output.reaction("❌");
    return output.reply(
      "❓ Please provide a prompt for GPT-5 Nano.\n\nExample: gpt5nano Hello!"
    );
  }

  try {
    const params = {
      uid: input.sid,
      msg: prompt,
    };

    const res: AxiosResponse<GPT5NanoResponse> = await axios.get(API_URL, {
      params,
      timeout: 25_000,
    });

    if (!res.data || res.data.status !== "success" || !res.data.reply) {
      throw new Error("Invalid API response");
    }

    const form: StrictOutputForm = {
      body:
        `🤖 **GPT-5 Nano**\n\n` +
        `${res.data.reply}\n\n` +
        `***Reply to continue the conversation.***`,
    };

    await output.reaction("✅");
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
    console.error("GPT-5 Nano API Error:", err?.message || err);
    await output.reaction("❌");
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to GPT-5 Nano AI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
