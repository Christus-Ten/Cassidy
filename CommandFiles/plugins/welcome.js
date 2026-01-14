// @ts-check
import { formatTimeSentenceV2 } from "@cass-modules/ArielUtils";
import { UNIRedux } from "@cassidy/unispectra";
import axios from "axios";

export const meta = {
  name: "welcome",
  author: "Chritus",
  version: "4.2.0",
  description: "Souhaite la bienvenue avec une histoire et l'heure de Côte d'Ivoire.",
  supported: "^4.0.0",
  order: 10,
  type: "plugin",
  after: ["input", "output"],
};

/**
 * @param {CommandContext} obj
 */
export async function use(obj) {
  const { event, api, output } = obj;

  if (event.logMessageType !== "log:subscribe") {
    return obj.next();
  }

  const { threadID, logMessageData } = event;
  const newUsers = logMessageData.addedParticipants;
  const botID = api.getCurrentUserID();

  if (newUsers.some((u) => u.userFbId === botID)) {
    return obj.next();
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "ce groupe";
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      // --- Heure de Côte d'Ivoire (Africa/Abidjan) ---
      const timeStr = new Date().toLocaleString("fr-FR", {
        timeZone: "Africa/Abidjan",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour12: false,
      });

      // --- Histoires narratives ---
      const stories = [
        `Le vent s'est levé sur "${groupName}" et les tambours ont résonné... Un nouveau destin vient de se lier au nôtre. ${fullName}, ton arrivée marque le début d'un nouveau chapitre. Tu es le ${memberCount}ème membre à franchir nos portes. Installe-toi, le voyage ne fait que commencer !`,
        `Une étoile est apparue dans le ciel de notre communauté. On raconte que ${fullName} cherchait un lieu de partage et d'amitié, et ses pas l'ont mené ici, dans "${groupName}". Bienvenue, ${memberCount}ème voyageur ! Que ton séjour parmi nous soit légendaire.`,
        `Les anciens du groupe "${groupName}" avaient prédit l'arrivée d'un ${memberCount}ème membre d'exception... Aujourd'hui, la prophétie s'est réalisée avec toi, ${fullName} ! Prends place autour du feu, partage tes idées et fais vibrer ce groupe !`,
      ];
      
      const randomStory = stories[Math.floor(Math.random() * stories.length)];

      const storyBody = `📝 | **L'Arrivée de ${fullName}**\n\n${randomStory}\n\n${UNIRedux.standardLine}\n🌍 **Heure (Côte d'Ivoire) :** ${timeStr}`;

      // Image via API externe
      const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/welcome?name=${encodeURIComponent(
        fullName
      )}&uid=${userId}&threadname=${encodeURIComponent(groupName)}&members=${memberCount}`;

      let attachment = null;
      try {
        const response = await axios.get(apiUrl, { responseType: "stream" });
        attachment = response.data;
      } catch (e) {
        console.error("❌ Image Error:", e.message);
      }
      
      await output.replyStyled(
        {
          body: storyBody,
          attachment: attachment,
          mentions: [{ tag: fullName, id: userId }],
        },
        {
          title: "NOUVEAU MEMBRE",
          titleFont: "none",
          contentFont: "none",
        }
      );
    }
  } catch (err) {
    console.error("❌ Error in welcome plugin:", err);
  }

  return obj.next();
}
