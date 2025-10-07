document.getElementById('generator-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const desc = document.getElementById("server-desc").value;

    // Appel à l'API route pour générer et stocker le token
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
