export default async function handler(req, res) {
  // Only allow POST requests for security reasons
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  let sessionId, clientId;
  // Parse the incoming JSON body. In Next.js API routes, req.json()
  // may not exist, so fall back to req.body if necessary.
  try {
    if (typeof req.json === "function") {
      ({ sessionId, clientId } = await req.json());
    } else {
      ({ sessionId, clientId } = req.body);
    }
  } catch {
    return res.status(400).json({ error: "Corps JSON invalide" });
  }

  // Validate required parameters
  if (!sessionId || !clientId) {
    return res.status(400).json({ error: "sessionId ou clientId manquant" });
  }

  // Retrieve secret environment variables
  const { STRIPE_SECRET_KEY, UPSTASH_URL, UPSTASH_TOKEN } = process.env;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Clé Stripe manquante" });
  }

  try {
    // Fetch the checkout session details directly from Stripe's API.
    // Using fetch avoids the need for an external dependency like the
    // stripe-node library, which isn't available in this repository.
    const stripeResp = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );
    const session = await stripeResp.json();
    // Check if the session has succeeded
    const isPaid = session && session.payment_status === "paid";
    if (isPaid) {
      // If Upstash credentials are available, mark this client as paid
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
          // Log errors but don't block the response if Upstash fails
          console.error("Erreur lors de la mise à jour Upstash :", err);
        }
      }
      return res.status(200).json({ paid: true });
    }
    // Session exists but isn't paid
    return res.status(200).json({ paid: false });
  } catch (error) {
    console.error("Erreur de vérification du paiement :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}