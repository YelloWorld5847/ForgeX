// API route to mark a clientId as having used their paid generation
//
// This route sets a key `used:<clientId>` in Upstash. After marking,
// subsequent calls to `/api/checkPaid` will return false until the user pays again.

export default async function handler(req, res) {
  const { UPSTASH_URL, UPSTASH_TOKEN } = process.env;
  // Accept both GET and POST, but prefer POST
  const clientId =
    req.method === "POST"
      ? (req.body && req.body.clientId)
      : (req.query && req.query.clientId);
  if (!clientId) {
    return res.status(400).json({ error: "clientId manquant" });
  }
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(500).json({ error: "Configuration Upstash manquante" });
  }
  try {
    const url = new URL(UPSTASH_URL);
    url.pathname = `/set/used:${clientId}/1`;
    await fetch(url.href, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur lors du marquage Used :", err);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}