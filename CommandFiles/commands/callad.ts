import { defineCommand } from "@cass/define";

const mediaTypes = ["photo", "video", "audio", "animated_image", "png"];

export const meta = {
  name: "callad",
  version: "2.2.0",
  author: "Christus, fix by Kay",
  description: "Unlimited user ↔ admin contact with attachments",
  usage: "{prefix}callad <message>",
  category: "admin",
  role: 0,
};

export const style = {
  title: "📨 Call Admin",
  titleFont: "bold",
  contentFont: "fancy",
  topLine: "thin",
};

const command = defineCommand({
  meta,
  style,

  async entry({ input, output, api }: CommandContext) {
    const message = input.args.join(" ");
    const userThreadID = input.tid;
    const senderName = input.senderName ?? "Unknown";
    const senderID = input.sid;

    if (!message) {
      return output.replyStyled("❌ Please enter a message.", style);
    }

    const attachments = [
      ...(input.attachments || []),
      ...(input.messageReply?.attachments || []),
    ].filter((a) => mediaTypes.includes(a.type));

    for (const adminID of Cassidy.config.ADMINBOT) {
      output.sendStyled(
        `👤 User: ${senderName}\n🆔 ID: ${senderID}\n\n💬 ${message}`,
        style,
        adminID,
        attachments
      ).then((adminMsg) => {
        
        const handleAdminReply = (adminCtx) => {
          const adminText = adminCtx.input.body;
          const adminAttachments = adminCtx.input.attachments || [];

          output.sendStyled(
            `📩 Admin:\n${adminText}`,
            style,
            userThreadID,
            adminAttachments
          ).then((userMsg) => {
            
            userMsg.atReply((userCtx) => {
              const userText = userCtx.input.body;
              const userAttachments = userCtx.input.attachments || [];

              output.sendStyled(
                `👤 User: ${senderName}\n🆔 ID: ${senderID}\n\n💬 ${userText}`,
                style,
                adminID,
                userAttachments
              ).then((loopAdminMsg) => {
                loopAdminMsg.atReply(handleAdminReply);
              });
            });
          });
        };

        adminMsg.atReply(handleAdminReply);
      });
    }

    return output.replyStyled(
      "✅ Your message has been sent to admins. You can keep replying.",
      style
    );
  },
});

export default command;
