import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://rapido.zetsu.xyz/api/yi-l";

const cmd = easyCMD({
  name: "yil",
  meta: {
    otherNames: ["yi-l-ai", "yilbot", "rapido-yil"],
    author: "Christus dev AI",
    description: "Yi-L – AI assistant powered by Rapido",
    icon: "🤖",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "Yi-L 🤖",
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

interface YiLResponse {
  response: string;
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
      "❓ Please provide a prompt for Yi-L.\n\nExample: yil Hello!"
    );
  }

  try {
    const params = {
      ask: prompt,
      uid: input.sid || "3",
      apikey: "rapi_55197dde42fb4272bfb8f35bd453ba25",
    };

    const res: AxiosResponse<YiLResponse> = await axios.get(API_URL, {
      params,
      timeout: 25_000,
    });

    const form: StrictOutputForm = {
      body:
        `🤖 **Yi-L**\n\n` +
        `${res.data.response}\n\n` +
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
    console.error("Yi-L API Error:", err?.message || err);
    await output.reaction("❌"); // erreur
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to Yi-L AI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
