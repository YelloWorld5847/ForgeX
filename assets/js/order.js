document.getElementById('generator-form').addEventListener('submit', function(e) {
    let desc = document.getElementById("server-desc").value;
    let token = "abcde12345"
    code = btoa(JSON.stringify([desc, token]))
    document.getElementById("forgebot-code").value=code;

    e.preventDefault();
    var btn = this.querySelector('button');
    btn.style.transform = 'scale(0.97)';
    btn.style.boxShadow = '0 0 20px #8A2BE2';
    setTimeout(function(){
        btn.style.transform = '';
        btn.style.boxShadow = '';
    }, 300);
    var result = document.getElementById('result');
    var resultAnim = document.getElementById('result-anim');
    result.style.display = 'block';
    setTimeout(function(){
        resultAnim.style.opacity = 1;
        resultAnim.style.transform = 'translateY(0)';
    }, 50);
    result.scrollIntoView({behavior:'smooth'});
});
if (typeof feather !== 'undefined') { feather.replace(); }


function copyForgeBotCode() {
    var copyText = document.getElementById("forgebot-code");
    navigator.clipboard.writeText(copyText.value);
}