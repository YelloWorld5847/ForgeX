import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export default async function handler(req, res) {
  let config = {
    UPSTASH_URL: process.env.UPSTASH_URL,
    UPSTASH_TOKEN: process.env.UPSTASH_TOKEN,
  };

  // Chargement de la configuration locale si disponible
  const configPath = path.join(process.cwd(), "config.js");
  if (fs.existsSync(configPath)) {
    const localConfig = (await import(pathToFileURL(configPath).href)).default;
    config = { ...config, ...localConfig };
  }

  // Vérification de la méthode HTTP
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Validation du token
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token manquant" });
  }

  // Calcul du hash SHA-256 du token
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  // Construction de l'URL de la requête
  const url = new URL(config.UPSTASH_URL);
  url.pathname = `/set/otoken:${hash}/1`;

  try {
    // Envoi de la requête à Upstash
    const resp = await fetch(url.href, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    // Traitement de la réponse
    const data = await resp.json();
    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    // Réponse réussie
    return res.status(200).json(data);
  } catch (error) {
    // Gestion des erreurs
    console.error("Erreur lors de la requête à Upstash :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
