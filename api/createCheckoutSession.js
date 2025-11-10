// API route: crée une session Stripe Checkout
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  let body;
  try {
    if (typeof req.json === "function") {
      body = await req.json();
    } else {
      body = req.body;
    }
  } catch {
    return res.status(400).json({ error: "Corps JSON invalide" });
  }

  const { clientId, numokMetadata } = body || {};
  if (!clientId) {
    return res.status(400).json({ error: "clientId manquant" });
  }

  const {
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID,
    FORGEBOT_BASE_URL,
  } = process.env;

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !FORGEBOT_BASE_URL) {
    return res.status(500).json({
      error: "Configuration Stripe manquante (STRIPE_SECRET_KEY, STRIPE_PRICE_ID, FORGEBOT_BASE_URL)",
    });
  }

  try {
    const params = new URLSearchParams();

    // Mode paiement unique
    params.append("mode", "payment");

    // URL de succès : on garde ta success.html qui appelle déjà /api/verifyPayment
    params.append(
      "success_url",
      `${FORGEBOT_BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`
    );
    params.append(
      "cancel_url",
      `${FORGEBOT_BASE_URL}/#pricing`
    );

    // Line item : utilise ton Price ID Stripe (produit ForgeBot)
    params.append("line_items[0][price]", STRIPE_PRICE_ID);
    params.append("line_items[0][quantity]", "1");

    // Toujours garder ton clientId côté Stripe
    params.append("metadata[clientId]", clientId);

    // 👇 NUMOK : on pousse toutes les métadatas de tracking dans Stripe
    if (numokMetadata && typeof numokMetadata === "object") {
      for (const [key, value] of Object.entries(numokMetadata)) {
        if (value != null && value !== "") {
          params.append(`metadata[${key}]`, String(value));
        }
      }
    }

    const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeResp.json();

    if (!stripeResp.ok) {
      console.error("Erreur création session Stripe :", session);
      return res.status(500).json({ error: "Erreur Stripe" });
    }

    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error("Erreur interne création session :", err);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
