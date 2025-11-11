// new API route to check if a client has already paid
//
// Given a clientId in the query string, this function queries
// Upstash to determine whether a corresponding `paid:<clientId>` key
// exists. If the key has a value, we consider the client paid.

export default async function handler(req, res) {
  // Extract clientId from query parameters (GET) or body (POST)
  const clientId =
    (req.query && req.query.clientId) ||
    (req.body && req.body.clientId);
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
    // Upstash returns null for missing keys on `paid:` keys
    const hasPaid = data && data.result !== null && data.result !== undefined;

    // Also check if this client has already consumed their generation
    let hasUsed = false;
    try {
      const usedUrl = new URL(UPSTASH_URL);
      usedUrl.pathname = `/get/used:${clientId}`;
      const usedResp = await fetch(usedUrl.href, {
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
        },
      });
      const usedData = await usedResp.json();
      hasUsed = usedData && usedData.result !== null && usedData.result !== undefined;
    } catch (err) {
      console.error("Erreur lors de la vérification du statut used :", err);
    }

    const paid = hasPaid && !hasUsed;
    return res.status(200).json({ paid });
  } catch (error) {
    console.error("Erreur lors de la vérification du paiement :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}