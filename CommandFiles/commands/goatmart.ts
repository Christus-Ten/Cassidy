// CommandFiles/commands/goatmart.ts

import axios from "axios";
import fs from "fs-extra";
import path from "path";
import moment from "moment-timezone";
import { defineEntry } from "@cass/define";
import { UNISpectra } from "@cassidy/unispectra";

const GOATMART = "https://goatmart.vercel.app";

export const meta: CommandMeta = {
  name: "goatmart",
  description: "🌟 GoatMart – Marketplace de commandes",
  author: "Christus dev AI",
  version: "2.1.0",
  usage: "{prefix}goatmart <show|page|search|stats|upload>",
  category: "Utility",
  role: 0,
  waitingTime: 0,
  otherNames: ["gm"],
  icon: "🐐",
  noLevelUI: true,
};

export const style: CommandStyle = {
  title: "GoatMart • Command Marketplace 🐐",
  titleFont: "bold",
  contentFont: "fancy",
};

const box = (content: string) =>
  `╭───『 🐐 𝗚𝗼𝗮𝘁𝗠𝗮𝗿𝘁 』───╮\n${content}\n╰─────────────╯`;

const handleError = (err: any, action: string) => {
  if (err.response?.status === 503)
    return box("🚧 Service en maintenance. Réessayez plus tard.");

  if (err.response?.status === 404)
    return box("❌ Ressource introuvable.");

  if (err.response?.status === 500)
    return box("⚠️ Erreur serveur. Réessayez dans un moment.");

  if (["ECONNREFUSED", "ENOTFOUND"].includes(err.code))
    return box(`🔌 Impossible de joindre GoatMart\n${GOATMART}`);

  if (err.response?.data?.maintenanceMode) {
    return box(
      `🚧 ${err.response.data.title}\n💬 ${err.response.data.message}\n` +
        (err.response.data.estimatedTime
          ? `⏰ Estimation: ${err.response.data.estimatedTime}`
          : "")
    );
  }

  return box(
    `❌ Impossible de ${action}\nStatus: ${
      err.response?.status || "Inconnu"
    }\nMessage: ${err.response?.data?.error || err.message}`
  );
};

export const entry = defineEntry(async ({ args, output, config }) => {
  try {
    if (!args[0]) {
      return output.reply(
        box(
          `📋 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲𝘀 𝗗𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀:\n\n` +
            `📦 {prefix}goatmart show <ID>\n` +
            `📄 {prefix}goatmart page <number>\n` +
            `🔍 {prefix}goatmart search <query>\n` +
            `📊 {prefix}goatmart stats\n` +
            `⬆️ {prefix}goatmart upload <filename>\n\n` +
            `💡 Exemple : {prefix}goatmart show 1`
        )
      );
    }

    const sub = args[0].toLowerCase();

    /* ================= SHOW ================= */
    if (sub === "show") {
      const id = Number(args[1]);
      if (isNaN(id)) return output.reply(box("⚠️ ID invalide."));

      try {
        const res = await axios.get(`${GOATMART}/api/item/${id}`);
        const i = res.data;

        return output.reply(
          box(
            `📦 Nom: ${i.itemName}\n🆔 ID: ${i.itemID}\n⚙️ Type: ${i.type}\n` +
              `📝 Desc: ${i.description}\n👨‍💻 Auteur: ${i.authorName}\n` +
              `📅 Ajout: ${new Date(i.createdAt).toLocaleDateString()}\n` +
              `👀 Vues: ${i.views}\n💝 Likes: ${i.likes}\n` +
              `📄 Raw: ${i.rawLink}`
          )
        );
      } catch (err) {
        return output.reply(handleError(err, "récupérer la commande"));
      }
    }

    /* ================= PAGE ================= */
    if (sub === "page") {
      const page = Number(args[1]) || 1;
      if (page <= 0) return output.reply(box("⚠️ Numéro de page invalide."));

      try {
        const res = await axios.get(
          `${GOATMART}/api/items?page=${page}&limit=20`
        );

        const { items, total, totalPages } = res.data;
        if (!items.length) return output.reply(box("📭 Aucune commande trouvée."));

        const list = items
          .map(
            (x: any, i: number) =>
              `${(page - 1) * 20 + i + 1}. 📦 ${x.itemName} (ID: ${
                x.itemID
              })\n 👀 ${x.views} | 💝 ${x.likes} | 👨‍💻 ${x.authorName}`
          )
          .join("\n\n");

        return output.reply(
          box(
            `📄 Page ${page}/${totalPages} (${total})\n\n${list}\n\n` +
              `💡 Utilisez "{prefix}goatmart show <ID>"`
          )
        );
      } catch (err) {
        return output.reply(handleError(err, "parcourir les commandes"));
      }
    }

    /* ================= SEARCH ================= */
    if (sub === "search") {
      const query = args.slice(1).join(" ");
      if (!query) return output.reply(box("⚠️ Terme de recherche requis."));

      try {
        const res = await axios.get(
          `${GOATMART}/api/items?search=${encodeURIComponent(query)}&limit=8`
        );

        const items = res.data.items;
        if (!items.length)
          return output.reply(box(`❌ Aucun résultat pour "${query}"`));

        const list = items
          .map(
            (x: any, i: number) =>
              `${i + 1}. 📦 ${x.itemName} (ID: ${x.itemID})\n 👀 ${
                x.views
              } | 💝 ${x.likes} | 👨‍💻 ${x.authorName}`
          )
          .join("\n\n");

        return output.reply(
          box(
            `🔍 Recherche: "${query}" (${res.data.total})\n\n${list}`
          )
        );
      } catch (err) {
        return output.reply(handleError(err, "rechercher"));
      }
    }

    /* ================= STATS ================= */
    if (sub === "stats") {
      try {
        const res = await axios.get(`${GOATMART}/api/stats`);
        const s = res.data;

        return output.reply(
          box(
            `📊 Statistiques GoatMart\n\n` +
              `📦 Commandes: ${s.totalCommands || 0}\n` +
              `💝 Likes: ${s.totalLikes || 0}\n` +
              `👥 Utilisateurs/jour: ${s.dailyActiveUsers || 0}\n` +
              `⏰ Uptime: ${
                s.hosting?.uptime
                  ? `${s.hosting.uptime.days}d ${s.hosting.uptime.hours}h`
                  : "N/A"
              }\n` +
              `🌟 Top Auteur: ${s.topAuthors?.[0]?._id || "N/A"}`
          )
        );
      } catch (err) {
        return output.reply(handleError(err, "récupérer les stats"));
      }
    }

    /* ================= UPLOAD ================= */
    if (sub === "upload") {
      const admins = config?.admins || [];
      if (!admins.includes(output.senderID))
        return output.reply(box("🚫 Réservé aux administrateurs."));

      const file = args[1];
      if (!file) return output.reply(box("⚠️ Nom du fichier requis."));

      const filePath = path.join(
        __dirname,
        file.endsWith(".js") ? file : `${file}.js`
      );

      if (!(await fs.pathExists(filePath)))
        return output.reply(box(`❌ Fichier introuvable: ${filePath}`));

      try {
        const code = await fs.readFile(filePath, "utf-8");
        const cmd = require(filePath);

        const payload = {
          itemName: cmd.config?.name || file,
          description:
            cmd.config?.longDescription?.en ||
            cmd.config?.shortDescription?.en ||
            "GoatBot command",
          type: "GoatBot",
          code,
          authorName: cmd.config?.author || "Anonymous",
          tags: ["goatbot", "command"],
          difficulty: "Intermediate",
        };

        const res = await axios.post(`${GOATMART}/api/items`, payload, {
          headers: { "Content-Type": "application/json" },
        });

        return output.reply(
          box(
            `✅ Upload réussi !\n\n📦 ${payload.itemName}\n` +
              `👨‍💻 ${payload.authorName}\n` +
              `🆔 ID: ${res.data.itemId}\n` +
              `🔗 ${res.data.link}`
          )
        );
      } catch (err) {
        return output.reply(handleError(err, "uploader"));
      }
    }

    return output.reply(
      box(`⚠️ Sous-commande inconnue.\n💡 Utilisez {prefix}goatmart`)
    );
  } catch (err) {
    console.error("GoatMart Cass Error:", err);
    return output.reply(box("❌ Erreur inattendue."));
  }
});
