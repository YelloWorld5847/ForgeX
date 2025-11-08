// Updated API route to verify Stripe payment and mark a client as paid
// This version also checks the associated PaymentIntent to ensure that
// delayed payment methods are correctly verified.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  let sessionId, clientId;
  try {
    if (typeof req.json === "function") {
      ({ sessionId, clientId } = await req.json());
    } else {
      ({ sessionId, clientId } = req.body);
    }
  } catch {
    return res.status(400).json({ error: "Corps JSON invalide" });
  }
  if (!sessionId || !clientId) {
    return res.status(400).json({ error: "sessionId ou clientId manquant" });
  }
  const { STRIPE_SECRET_KEY, UPSTASH_URL, UPSTASH_TOKEN } = process.env;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Clé Stripe manquante" });
  }
  try {
    // Fetch the Checkout Session
    const sessionResp = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      }
    );
    const session = await sessionResp.json();
    let isPaid = false;
    // Primary check: use the payment_status field on the session
    if (session && session.payment_status === "paid") {
      isPaid = true;
    }
    // Secondary check: if still unpaid, fetch the PaymentIntent and check its status
    if (!isPaid && session && session.payment_intent) {
      try {
        const intentResp = await fetch(
          `https://api.stripe.com/v1/payment_intents/${session.payment_intent}`,
          {
            headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
          }
        );
        const intent = await intentResp.json();
        if (intent && intent.status === "succeeded") {
          isPaid = true;
        }
      } catch (err) {
        console.error(
          "Erreur lors de la récupération du PaymentIntent :",
          err
        );
      }
    }
    if (isPaid) {
      if (UPSTASH_URL && UPSTASH_TOKEN) {
        try {
          const url = new URL(UPSTASH_URL);
          url.pathname = `/set/paid:${clientId}/1`;
          await fetch(url.href, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${UPSTASH_TOKEN}`,
              "Content-Type": "application/json",
            },
          });
        } catch (err) {
          console.error("Erreur lors de la mise à jour Upstash :", err);
        }
      }
      return res.status(200).json({ paid: true });
    }
    return res.status(200).json({ paid: false });
  } catch (error) {
    console.error("Erreur de vérification du paiement :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
