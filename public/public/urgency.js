(function () {
  'use strict';
  var config = (window.PRODUTO || {}).campanhaTopo;
  var banner = document.getElementById('urgency-banner');
  if (!banner) return;
  if (!config || !config.ativo) { banner.hidden = true; return; }
  var duracao = 72 * 60 * 60 * 1000;
  var chave = 'turbogelo_countdown_target';
  var alvo;
  var timer;
  var valores = banner.querySelectorAll('.unit strong');
  var unidades = banner.querySelectorAll('.unit');
  var texto = banner.querySelector('.urgency-text');
  var contador = document.getElementById('urgency-countdown');
  function salvar() {
    try { window.localStorage.setItem(chave, String(alvo)); } catch (_) { /* Mantém o alvo em memória quando o armazenamento está bloqueado. */ }
  }
  function carregar() {
    try { alvo = Number(window.localStorage.getItem(chave)); } catch (_) { /* Usa a memória da página no modo privado. */ }
    var agora = Date.now();
    if (!Number.isFinite(alvo) || alvo <= agora || alvo > agora + duracao) {
      alvo = agora + duracao;
      salvar();
    }
  }
  function tick() {
    var agora = Date.now();
    if (alvo <= agora) { alvo = agora + duracao; salvar(); }
    // Arredonda para baixo para que um ciclo de 72h nunca exiba 03d.
    var s = Math.min(259199, Math.max(0, Math.floor((alvo - agora) / 1000)));
    var partes = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    unidades[0].hidden = s <= 86400;
    unidades[1].hidden = s < 3600;
    partes.forEach(function (n, i) {
      var valor = String(n).padStart(2, '0');
      if (valores[i].textContent !== valor) {
        valores[i].textContent = valor;
        if (valores[i].animate && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          valores[i].animate([{ opacity: 0.7 }, { opacity: 1 }], { duration: 150 });
        }
      }
    });
    var mensagem = 'PRE BLACK FRIDAY TERMINA EM';
    if (texto.textContent !== mensagem) texto.textContent = mensagem;
    contador.setAttribute('aria-label', 'Renovação automática do ciclo em ' + partes[0] + ' dias, ' + partes[1] + ' horas, ' + partes[2] + ' minutos e ' + partes[3] + ' segundos');
    banner.hidden = false;
  }
  function iniciar() { clearInterval(timer); tick(); timer = setInterval(tick, 1000); }
  window.addEventListener('pagehide', function () { clearInterval(timer); });
  window.addEventListener('pageshow', iniciar);
  carregar();
  iniciar();
})();
