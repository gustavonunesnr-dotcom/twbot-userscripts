// ==UserScript==
// @name         Auto Recrutamento (TWBot)
// @namespace    twbot
// @version      0.9.0
// @description  Mantém metas de tropa por grupo de aldeias, recrutando aos poucos dentro dos recursos, da população e de um teto de fila.
// @author       TWBot
// @match        *://*.tribalwars.com.br/game.php*
// @match        *://*.tribalwars.com.pt/game.php*
// @match        *://*.tribalwars.net/game.php*
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @connect      twbot-entrega.twbot.workers.dev
// @downloadURL  https://raw.githubusercontent.com/gustavonunesnr-dotcom/twbot-userscripts/main/AutoRecrutamento.user.js
// @updateURL    https://raw.githubusercontent.com/gustavonunesnr-dotcom/twbot-userscripts/main/AutoRecrutamento.user.js
// ==/UserScript==

/* Gerado por build.mjs — não edite. */
(function () {
  'use strict';

  var SERVIDOR = "https://twbot-entrega.twbot.workers.dev/auth";
  var FERRAMENTA = "AutoRecrutamento";

  // Com @grant, o Tampermonkey isola o script: window deixa de ser a janela
  // da página e game_data some. unsafeWindow é a página de verdade — e é nela
  // que o bundle precisa rodar, porque ele usa o jQuery e o TribalWars que só
  // existem lá.
  var pagina = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  // O carregador único (TWBot) já cuida desta página.
  if (pagina.TWBotCarregador) return;

  var gd = pagina.game_data;
  if (!gd || !gd.player) {
    console.warn('[TWBot] game_data não encontrado; nada a fazer nesta página.');
    return;
  }

  // Ponte para o painel web: o bundle roda na página, onde não existe
  // GM_xmlhttpRequest. Presa ao servidor do TWBot. Vários carregadores na
  // mesma aba reaproveitam a primeira.
  if (!pagina.TWBotPonte) {
    pagina.TWBotPonte = {
      servidor: "https://twbot-entrega.twbot.workers.dev",
      pedir: function (caminho, corpo, pronto) {
        if (!/^[/][a-z]+$/.test(caminho)) { pronto(new Error('caminho inválido')); return; }
        GM_xmlhttpRequest({
          method: 'POST',
          url: "https://twbot-entrega.twbot.workers.dev" + caminho,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify(corpo),
          timeout: 20000,
          onload: function (r) {
            var d = null;
            try { d = JSON.parse(r.responseText); } catch (e) {}
            pronto(null, { status: r.status, dados: d });
          },
          onerror: function () { pronto(new Error('sem conexão com o servidor')); },
          ontimeout: function () { pronto(new Error('o servidor demorou demais')); }
        });
      }
    };
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

      avisarTroca();
    },
    onerror: function () { avisar('não consegui falar com o servidor de licença.'); },
    ontimeout: function () { avisar('o servidor de licença demorou demais.'); },
    timeout: 15000
  });

  /** Uma vez por dia, por todas as ferramentas antigas juntas. */
  function avisarTroca() {
    try {
      var hoje = new Date().toDateString();
      if (localStorage.getItem('twbot:aviso-carregador') === hoje) return;
      localStorage.setItem('twbot:aviso-carregador', hoje);
    } catch (e) { return; }

    avisar('O TWBot agora tem <b>um carregador só</b> para todas as ferramentas. ' +
           'Instale o TWBot e remova os antigos: github.com/gustavonunesnr-dotcom/twbot-userscripts', true);
  }

  function avisar(msg, brando) {
    var UI = pagina.UI;
    if (UI && UI.ErrorMessage && !brando) UI.ErrorMessage(msg, 6000);
    else if (UI && UI.SuccessMessage) UI.SuccessMessage(msg, 6000);
    console.warn('[TWBot] ' + msg.replace(/<[^>]*>/g, ''));
  }
})();
