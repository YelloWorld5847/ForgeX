export default async function handler(req, res) {
  // Extract clientId from query parameters (GET) or body (POST)
  const clientId = req.query?.clientId || req.body?.clientId;
  if (!clientId) {
    return res.status(400).json({ error: "clientId manquant" });
  }

  const { UPSTASH_URL, UPSTASH_TOKEN } = process.env;
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(500).json({ error: "Configuration Upstash manquante" });
  }
  try {
    // Build the URL to fetch the paid status from Upstash
    const url = new URL(UPSTASH_URL);
    url.pathname = `/get/paid:${clientId}`;
    const resp = await fetch(url.href, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    });
    const data = await resp.json();
    // Upstash returns null for missing keys
    const paid = data && data.result !== null && data.result !== undefined;
    return res.status(200).json({ paid });
  } catch (error) {
    console.error("Erreur lors de la vérification du paiement :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}