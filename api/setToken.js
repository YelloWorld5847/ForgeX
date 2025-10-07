import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import CryptoJS from "crypto-js";

export default async function handler(req, res) {
  let config = {
    UPSTASH_URL: process.env.UPSTASH_URL,
    UPSTASH_TOKEN: process.env.UPSTASH_TOKEN,
    PASS_TOKEN: process.env.PASS_TOKEN
  };

  const configPath = path.join(process.cwd(), "config.js");
  if (fs.existsSync(configPath)) {
    const localConfig = (await import(pathToFileURL(configPath).href)).default;
    config = { ...config, ...localConfig };
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { token, desc } = req.body;
  if (!token || !desc) {
    return res.status(400).json({ error: "Token ou description manquant" });
  }

  // Hashage SHA-256 pour Upstash
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const url = new URL(config.UPSTASH_URL);
  url.pathname = `/set/otoken:${hash}/1`;

  try {
    const resp = await fetch(url.href, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data = await resp.json();
    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    // 🔐 Chiffrement avec la clé secrète
    const code = JSON.stringify([desc, token]);
    const encrypted = CryptoJS.AES.encrypt(code, config.PASS_TOKEN).toString();

    // Renvoyer le code chiffré
    return res.status(200).json({ success: true, encrypted });
  } catch (error) {
    console.error("Erreur lors de la requête à Upstash :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
