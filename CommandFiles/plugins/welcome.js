// @ts-check
import { formatTimeSentenceV2 } from "@cass-modules/ArielUtils";
import { UNIRedux } from "@cassidy/unispectra";
import axios from "axios";

export const meta = {
  name: "welcome",
  author: "Christus",
  version: "4.3.0",
  description: "Accueil épique avec message de paix, respect et heure de Côte d'Ivoire.",
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
    const groupName = threadInfo.threadName || "ce sanctuaire";
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      // --- Heure de Côte d'Ivoire ---
      const timeStr = new Date().toLocaleString("fr-FR", {
        timeZone: "Africa/Abidjan",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
      });

      // --- Histoires Épiques et Code d'Honneur ---
      const stories = [
        `📜 **La Prophétie du Voyageur**\n\nLes tambours d'Abidjan ont résonné jusqu'aux confins du monde numérique pour annoncer ton arrivée, ${fullName}. On raconte que le groupe "${groupName}" attendait une âme capable d'apporter sa lumière à l'édifice. En devenant notre ${memberCount}ème membre, tu n'entres pas simplement dans une discussion, tu rejoins une lignée de guerriers de l'esprit. \n\nMais attention, voyageur : ici, notre force réside dans notre unité. Nous cultivons la Paix comme un trésor sacré et le Respect comme notre bouclier. Celui qui brise l'harmonie ou manque de considération envers ses frères et sœurs verra son chemin s'arrêter. Sois le bienvenu dans ce havre de paix !`,
        
        `⚔️ **Le Pacte de Fraternité**\n\nRegardez ! Le ciel de "${groupName}" s'est illuminé d'une lueur nouvelle. ${fullName} vient de franchir le grand portail, devenant le ${memberCount}ème pilier de ce royaume. Depuis des lunes, nous bâtissons un empire où chaque mot est une pierre de sagesse. \n\nSache, nouveau membre, que dans cette enceinte, la parole est une arme qui ne doit servir qu'à construire. Nous bannissons le mépris et l'arrogance. Ici, nous marchons main dans la main, dans le respect mutuel et la sérénité. Que ton aventure soit longue, et que ton cœur reste en paix avec tes semblables !`,
        
        `🌟 **L'Éveil du Sanctuaire**\n\nUne brise de changement souffle sur "${groupName}". ${fullName}, tu apparais enfin comme le ${memberCount}ème élu de notre communauté. Ton nom sera désormais gravé dans les archives de nos échanges. Mais avant de prendre place, prête l'oreille au code de notre terre : nous ne tolérons aucune ombre de discorde. \n\nLa paix est notre seule loi, et le respect d'autrui notre unique boussole. Que tu sois sage ou impétueux, n'oublie jamais que l'autre est ton reflet. Bienvenue dans cette quête épique où l'harmonie est la plus grande des victoires !`
      ];
      
      const randomStory = stories[Math.floor(Math.random() * stories.length)];

      const storyBody = `✨ **BIENVENUE PARMI LES LÉGENDES** ✨\n\n${randomStory}\n\n${UNIRedux.standardLine}\n🇨🇮 **Abidjan, Côte d'Ivoire** | ${timeStr}`;

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
          title: "📜 DÉCRET D'ACCUEIL",
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
