import { defineCommand } from "@cass/define";

const mediaTypes = ["photo", "video", "audio", "animated_image", "png"];

/* ================= META ================= */

export const meta = {
  name: "callad",
  version: "2.2.0",
  author: "Christus",
  description: "Unlimited user ↔ admin contact with attachments",
  usage: "{prefix}callad <message>",
  category: "admin",
  role: 0,
};

/* ================= STYLE ================= */

export const style = {
  title: "📨 Call Admin",
  titleFont: "bold",
  contentFont: "fancy",
  topLine: "thin",
};

/* ================= COMMAND ================= */

const command = defineCommand({
  meta,
  style,

  async entry({ input, output, api }: CommandContext) {
    const message = input.args.join(" ");
    const userTid = input.tid;
    const senderName = input.senderName ?? "Unknown";
    const senderID = input.sid;

    if (!message) {
      return output.replyStyled("❌ Please enter a message.", style);
    }

    const attachments = [
      ...(input.attachments || []),
      ...(input.messageReply?.attachments || []),
    ].filter((a) => mediaTypes.includes(a.type));

    /* ========= USER → ADMIN ========= */

    for (const adminID of Cassidy.config.ADMINBOT) {
      output.sendStyled(
        `👤 User: ${senderName}\n🆔 ID: ${senderID}\n\n💬 ${message}`,
        style,
        adminID,
        attachments
      ).then((adminMsg) => {

        /* ========= ADMIN REPLY ========= */

        adminMsg.atReply((adminCtx) => {
          const adminText = adminCtx.input.body;
          const adminAttachments = adminCtx.input.attachments || [];

          output.sendStyled(
            `📩 Admin:\n${adminText}`,
            style,
            userTid,
            adminAttachments
          ).then((userMsg) => {

            /* ========= USER LOOP ========= */

            userMsg.atReply((userCtx) => {
              const userText = userCtx.input.body;
              const userAttachments = userCtx.input.attachments || [];

              output.sendStyled(
                `👤 User: ${senderName}\n🆔 ID: ${senderID}\n\n💬 ${userText}`,
                style,
                adminID,
                userAttachments
              ).then((loopAdminMsg) => {

                /* 🔁 RE-ATTACH ADMIN REPLY (LOOP) */
                loopAdminMsg.atReply(adminCtx.callback);

              });
            });

          });
        });

      });
    }

    return output.replyStyled(
      "✅ Your message has been sent to admins. You can keep replying.",
      style
    );
  },
});

export default command;
