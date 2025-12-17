import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://rapido.zetsu.xyz/api/aria";
const API_KEY = "rapi_55197dde42fb4272bfb8f35bd453ba25";

const cmd = easyCMD({
  name: "aria",
  meta: {
    otherNames: ["aiaria"],
    author: "Christus dev AI",
    description: "Aria AI – Powered by Zetsu Rapido",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "Aria 🤖",
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

interface AriaResponse {
  status: boolean;
  operator: string;
  response: string;
}

async function main({
  output,
  args,
  cancelCooldown,
}: CommandContext) {
  const prompt = args.join(" ").trim();
  await output.reaction("⏳");

  if (!prompt) {
    cancelCooldown();
    await output.reaction("❌");
    return output.reply(
      "❓ Please provide a prompt.\n\nExample: aria Hello!"
    );
  }

  try {
    const res: AxiosResponse<AriaResponse> = await axios.get(API_URL, {
      params: {
        prompt,
        apikey: API_KEY,
      },
      timeout: 20_000,
    });

    const answerText =
      res.data?.response || "No response received from Aria.";

    const form: StrictOutputForm = {
      body:
        `🤖 **Aria AI**\n\n` +
        `${answerText}\n\n` +
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
    console.error("Aria API Error:", err?.message || err);
    await output.reaction("❌");
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to Aria AI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
