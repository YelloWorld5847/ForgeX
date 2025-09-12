import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  // Hash du token pour le stocker en sécurité
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  // Requête à Upstash
  const resp = await fetch(process.env.UPSTASH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.UPSTASH_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      command: ["SET", `otoken:${hash}`, "1", "EX", "300"] // expire 5 min
    })
  });

  const data = await resp.json();
  res.status(200).json(data);
}
