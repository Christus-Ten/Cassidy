import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const cmd = easyCMD({
  name: "llama",
  meta: {
    otherNames: [ "maverick"],
    author: "Christus Dev AI",
    description:
      "LLaMA-4 Maverick 17B – Fast & powerful AI assistant (FREE)",
    icon: "🦙",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "LLaMA-4 Maverick 🦙⚡",
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

export interface LlamaResponse {
  status: boolean;
  reply?: string;
  uid?: string;
}

async function main({
  output,
  args,
  commandName,
  prefix,
  input,
  cancelCooldown,
}: CommandContext) {
  const prompt = args.join(" ");
  await output.reaction("🟡");

  if (!prompt) {
    cancelCooldown();
    await output.reaction("🔴");
    return output.reply(
      `❓ Please provide a prompt.\n\nExample:\n${prefix}${commandName} Explain black holes`
    );
  }

  try {
    const headers: AxiosRequestConfig["headers"] = {
      "Content-Type": "application/json",
    };

    const apiURL = `https://uniapis.onrender.com/api/llama-4-maverick-17b-128e-instruct` +
      `?uid=${input.sid}` +
      `&prompt=${encodeURIComponent(prompt)}` +
      `&url=`;

    const res: AxiosResponse<LlamaResponse> = await axios.get(apiURL, {
      headers,
      timeout: 25_000,
    });

    const answer =
      res.data?.reply || "⚠️ No response from LLaMA-4 Maverick.";

    const form: StrictOutputForm = {
      body: `🦙 **LLaMA-4 Maverick**\n\n${answer}\n\n***Reply to continue the conversation.***`,
    };

    await output.reaction("🟢");
    const info = await output.reply(form);

    // 🔁 Conversation continue
    info.atReply((rep) => {
      rep.output.setStyle(cmd.style);
      main({ ...rep, args: rep.input.words });
    });
  } catch (err: any) {
    console.error("LLaMA-4 API Error:", err?.message || err);
    await output.reaction("🔴");
    cancelCooldown();
    return output.reply(
      `❗ Failed to connect to LLaMA-4 API.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
