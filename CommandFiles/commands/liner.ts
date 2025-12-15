import axios, { AxiosResponse } from "axios";
import { StrictOutputForm } from "output-cassidy";

const API_URL = "https://haji-mix-api.gleeze.com/api/liner";

const cmd = easyCMD({
  name: "liner",
  meta: {
    otherNames: ["linerai", "gleeze-liner", "askliner"],
    author: "Christus dev AI",
    description: "Liner AI – General purpose assistant by Gleeze",
    icon: "📝",
    version: "1.0.0",
    noPrefix: "both",
  },
  title: {
    content: "Liner AI 📝",
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

interface LinerResponse {
  user_ask: string;
  mode: string;
  answer: {
    llm_response: string;
    references: any[];
    followUpQuestion?: {
      status: string;
      queries: string[];
    };
  };
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
      "❓ Please provide a prompt for Liner AI.\n\nExample: liner Hello!"
    );
  }

  try {
    const params = {
      ask: prompt,
      mode: "general",
      deepsearch: false,
      stream: false,
    };

    const res: AxiosResponse<LinerResponse> = await axios.get(API_URL, {
      params,
      timeout: 20_000,
    });

    const answer =
      res.data?.answer?.llm_response || "⚠️ No response from Liner AI.";

    let followUpText = "";
    if (res.data?.answer?.followUpQuestion?.queries?.length) {
      followUpText =
        "\n\n💡 Follow-up questions:\n" +
        res.data.answer.followUpQuestion.queries
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n");
    }

    const form: StrictOutputForm = {
      body:
        `📝 **Liner AI**\n\n` +
        `${answer}` +
        followUpText +
        `\n\n***Reply to continue the conversation.***`,
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
    console.error("Liner AI API Error:", err?.message || err);
    await output.reaction("❌"); // erreur
    cancelCooldown();
    return output.reply(
      `❌ Failed to connect to Liner AI.\n\nMessage: ${
        err?.message || "Unknown error"
      }`
    );
  }
}

export default cmd;
