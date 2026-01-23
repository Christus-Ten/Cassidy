// @ts-check
import { UNIRedux } from "@cassidy/unispectra";
import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs-extra";
import path from "path";

// Configuration des polices (assure-toi que les chemins sont corrects pour ton serveur)
const fontDir = path.join(process.cwd(), "scripts/cmds/assets/font");
try {
  registerFont(path.join(fontDir, "NotoSans-Bold.ttf"), { family: 'NotoSans', weight: 'bold' });
  registerFont(path.join(fontDir, "Kanit-SemiBoldItalic.ttf"), { family: 'Kanit', weight: '600', style: 'italic' });
} catch (e) {
  console.warn("[Welcome] Polices non chargées, utilisation des polices système.");
}

export const meta = {
  name: "welcome",
  author: "Christus",
  version: "4.5.0",
  description: "Accueil épique avec image Canvas, message de paix et respect.",
  supported: "^4.0.0",
  order: 10,
  type: "plugin",
  after: ["input", "output"],
};

/**
 * @param {CommandContext} obj
 */
export async function use(obj) {
  const { event, api, output, threadsData, usersData } = obj;

  if (event.logMessageType !== "log:subscribe") {
    return obj.next();
  }

  const { threadID, logMessageData, author } = event;
  const newUsers = logMessageData.addedParticipants;
  const botID = api.getCurrentUserID();

  if (newUsers.some((u) => u.userFbId === botID)) return obj.next();

  try {
    const thread = await threadsData.get(threadID);
    const threadName = thread?.threadName || "ce sanctuaire";
    const memberCount = thread?.participantIDs?.length || 0;
    const authorName = await usersData.getName(author);

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      // --- Heure de Côte d'Ivoire ---
      const timeStr = new Date().toLocaleString("fr-FR", {
        timeZone: "Africa/Abidjan",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });

      // --- Construction de l'histoire épique ---
      const stories = [
        `📜 **Le Décret de la Paix**\n\nLes tambours résonnent pour annoncer ton arrivée, ${fullName}. En devenant notre ${memberCount}ème membre, tu n'entres pas dans un simple groupe, mais dans une lignée de guerriers de l'esprit.\n\nMais attention : ici, notre force réside dans l'unité. Nous cultivons la Paix comme un trésor sacré et le Respect comme notre bouclier. Celui qui brise l'harmonie ou manque de considération envers ses frères verra son chemin s'arrêter. Sois le bienvenu !`,
        `⚔️ **Le Pacte du Respect**\n\nLe ciel de "${threadName}" s'illumine. ${fullName} vient de franchir le portail, devenant le ${memberCount}ème pilier de ce royaume. \n\nSache que dans cette enceinte, la parole est une arme qui ne doit servir qu'à construire. Nous bannissons le mépris. Ici, nous marchons main dans la main, dans le respect mutuel. Que ton cœur reste en paix avec tes semblables !`
      ];
      const story = stories[Math.floor(Math.random() * stories.length)];
      const body = `✨ **BIENVENUE CHEZ LES LÉGENDES** ✨\n\n${story}\n\n${UNIRedux.standardLine}\n🇨🇮 **Côte d'Ivoire** | ${timeStr}`;

      // --- Génération de l'image Canvas ---
      const canvasStream = await createWelcomeCanvas(
        thread?.imageSrc || "https://i.imgur.com/6e6966B.png", 
        await usersData.getAvatarUrl(userId),
        await usersData.getAvatarUrl(author),
        fullName,
        memberCount,
        threadName,
        authorName
      );

      await output.replyStyled({
        body: body,
        attachment: canvasStream,
        mentions: [{ tag: fullName, id: userId }]
      }, {
        title: "📜 ACCUEIL LÉGENDAIRE",
        titleFont: "none",
        contentFont: "none"
      });
    }
  } catch (err) {
    console.error("❌ Error in welcome plugin:", err);
  }

  return obj.next();
}

/**
 * Fonction de création du Canvas (adaptée de ton code)
 */
async function createWelcomeCanvas(gcImg, userImg, authorImg, userName, userNumber, threadName, authorN) {
  const width = 1200, height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond sombre et grille
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 2;
  for (let i = -height; i < width; i += 60) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + height, height); ctx.stroke();
  }

  // Décorations géométriques (Simplifié pour l'exemple)
  ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
  ctx.beginPath(); ctx.arc(100, 100, 80, 0, Math.PI * 2); ctx.fill();

  // Fonction pour dessiner les avatars circulaires
  const drawCircle = async (src, x, y, radius, color) => {
    try {
      const img = await loadImage(src);
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.strokeStyle = color; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
    } catch (e) { /* Fallback si l'image échoue */ }
  };

  // Dessin des éléments
  await drawCircle(authorImg, width - 120, 100, 55, '#22c55e'); // Ajouté par
  await drawCircle(userImg, 120, height - 100, 55, '#16a34a'); // Le nouvel utilisateur
  await drawCircle(gcImg, width / 2, 200, 90, '#22c55e'); // Image du groupe

  // Textes
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(threadName, width / 2, 335);
  
  ctx.font = 'italic bold 60px sans-serif';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('WELCOME', width / 2, 410);

  ctx.font = '26px sans-serif';
  ctx.fillStyle = '#a0a0a0';
  ctx.fillText(`Tu es le ${userNumber}ème membre de cette légende`, width / 2, 480);

  return canvas.toBuffer();
}
