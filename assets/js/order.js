// Modified generator page script to enforce payment before token generation
//
// This script now performs several actions:
//  1. On page load, generate or retrieve a unique clientId and store it in
//     localStorage. This ID is used server-side to track whether the user
//     has completed the payment.
//  2. Restore a pending description from sessionStorage when returning
//     from the payment page. This allows the user to pick up where
//     they left off after paying.
//  3. When the form is submitted, check the user's payment status via
//     the `/api/checkPaid` endpoint. If the user hasn't paid, the script
//     saves the current description and redirects them to Stripe using
//     the PAYMENT_LINK_URL. Otherwise, it generates the token as before.

(async () => {
    // Ensure a persistent clientId is available for payment tracking
    let clientId = localStorage.getItem('clientId');
    if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem('clientId', clientId);
    }
    // Restore pending description if returning from payment
    const pendingDesc = sessionStorage.getItem('pendingDesc');
    if (pendingDesc) {
        const textarea = document.getElementById('server-desc');
        if (textarea) {
            textarea.value = pendingDesc;
        }
        sessionStorage.removeItem('pendingDesc');
    }
})();

// Update this URL with the production payment link when deploying
const PAYMENT_LINK_URL = 'https://buy.stripe.com/test_cNi4gz5EK9Agevn9Ii9EI00';

document.getElementById('generator-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const desc = document.getElementById("server-desc").value;
    const clientId = localStorage.getItem('clientId');

    // Determine if this client has already paid.
    // We support two mechanisms:
    //  - A flag in localStorage set after returning from the success page (paid == 'true').
    //  - A server-side check via /api/checkPaid to verify Upstash state.
    let paid = false;
    const localPaidFlag = localStorage.getItem('paid');
    if (localPaidFlag === 'true') {
        paid = true;
    } else {
        try {
            const checkResp = await fetch('/api/checkPaid?clientId=' + encodeURIComponent(clientId));
            if (checkResp.ok) {
                const { paid: resultPaid } = await checkResp.json();
                paid = resultPaid;
            }
        } catch (err) {
            console.error('Erreur lors de la vérification de paiement', err);
        }
    }

    // If not paid, redirect to the payment page and store description
    if (!paid) {
        sessionStorage.setItem('pendingDesc', desc);
        window.location.href = PAYMENT_LINK_URL;
        return;
    }

    // Generate and store the token via the existing API
    const token = crypto.randomUUID();
    const resp = await fetch("/api/setToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, desc })
    });
    if (!resp.ok) {
        console.error(await resp.text());
        throw new Error("Impossible de générer le token");
    }

    const { encrypted } = await resp.json();

    console.log("Token généré et stocké:", token);
    document.getElementById("forgebot-code").value = encrypted;

    // Marquer ce client comme ayant utilisé sa génération pour éviter des générations illimitées
    try {
        await fetch('/api/markUsed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
        });
    } catch (err) {
        console.error('Erreur lors du marquage utilisé :', err);
    }

    // Une fois la génération effectuée, on peut retirer le flag local "paid"
    // afin que l'utilisateur doive payer à nouveau s'il souhaite générer un autre serveur.
    localStorage.removeItem('paid');

    // Effets visuels
    const btn = this.querySelector('button');
    btn.style.transform = 'scale(0.97)';
    btn.style.boxShadow = '0 0 20px #8A2BE2';
    setTimeout(() => {
        btn.style.transform = '';
        btn.style.boxShadow = '';
    }, 300);

    const result = document.getElementById('result');
    const resultAnim = document.getElementById('result-anim');
    result.style.display = 'block';
    setTimeout(() => {
        resultAnim.style.opacity = 1;
        resultAnim.style.transform = 'translateY(0)';
    }, 50);
    result.scrollIntoView({ behavior: 'smooth' });
});

function copyForgeBotCode() {
    const copyText = document.getElementById("forgebot-code");
    navigator.clipboard.writeText(copyText.value);
}

if (typeof feather !== 'undefined') feather.replace();