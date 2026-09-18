// ==UserScript==
// @name         Agendador de Comandos (TWBot)
// @namespace    twbot
// @version      0.1.0
// @description  Agenda ataques e apoios por horário de chegada, com saída calculada e compensação de latência.
// @author       TWBot
// @match        *://*.tribalwars.com.br/game.php*
// @match        *://*.tribalwars.com.pt/game.php*
// @match        *://*.tribalwars.net/game.php*
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @connect      twbot-entrega.twbot.workers.dev
// @downloadURL  https://raw.githubusercontent.com/gustavonunesnr-dotcom/twbot-userscripts/main/AgendadorDeComandos.user.js
// @updateURL    https://raw.githubusercontent.com/gustavonunesnr-dotcom/twbot-userscripts/main/AgendadorDeComandos.user.js
// ==/UserScript==

/* Gerado por build.mjs — não edite. */
(function () {
  'use strict';

  var SERVIDOR = "https://twbot-entrega.twbot.workers.dev/auth";
  var FERRAMENTA = "AgendadorDeComandos";

  // Com @grant, o Tampermonkey isola o script: window deixa de ser a janela
  // da página e game_data some. unsafeWindow é a página de verdade — e é nela
  // que o bundle precisa rodar, porque ele usa o jQuery e o TribalWars que só
  // existem lá.
  var pagina = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  var gd = pagina.game_data;
  if (!gd || !gd.player) {
    console.warn('[TWBot] game_data não encontrado; nada a fazer nesta página.');
    return;
  }

  GM_xmlhttpRequest({
    method: 'POST',
    url: SERVIDOR,
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({
      mercado: gd.market,
      mundo: gd.world,
      jogador: gd.player.id,
      ferramenta: FERRAMENTA
    }),
    onload: function (r) {
      var d = null;
      try { d = JSON.parse(r.responseText); } catch (e) {}

      if (!d) { avisar('o servidor respondeu algo que não entendi.'); return; }

      if (!d.ok) {
        // "Sem licença" é o caso comum e não é erro de ninguém: quem chegou
        // aqui sem comprar precisa saber onde comprar, não ver um traceback.
        avisar(d.erro === 'sem licença' || d.erro === 'licença expirada'
          ? 'Sua licença do <b>' + FERRAMENTA + '</b> não está ativa.'
          : 'Licença: ' + (d.erro || 'recusada') + '.');
        return;
      }

      if (d.avisarRenovacao) {
        avisar('Licença do <b>' + FERRAMENTA + '</b> expira em ' +
               d.restam.dias + ' dias e ' + d.restam.horas + ' horas.', true);
      }

      try {
        // eval DA PÁGINA, não o nosso: o bundle precisa do escopo onde vivem
        // jQuery, TribalWars e game_data.
        pagina.eval(d.codigo);
      } catch (e) {
        console.error('[TWBot] o código lançou erro:', e);
      }
    },
    onerror: function () { avisar('não consegui falar com o servidor de licença.'); },
    ontimeout: function () { avisar('o servidor de licença demorou demais.'); },
    timeout: 15000
  });

  function avisar(msg, brando) {
    if (window.UI && UI.ErrorMessage && !brando) UI.ErrorMessage(msg, 6000);
    else if (window.UI && UI.SuccessMessage) UI.SuccessMessage(msg, 6000);
    console.warn('[TWBot] ' + msg.replace(/<[^>]*>/g, ''));
  }
})();
