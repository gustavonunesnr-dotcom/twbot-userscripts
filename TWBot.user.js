// ==UserScript==
// @name         TWBot
// @namespace    twbot
// @version      0.8.1
// @description  Carrega as ferramentas do TWBot liberadas para a sua conta: Auto Farming, Construtor, Recrutamento, Agendador e Defesa.
// @author       TWBot
// @match        *://*.tribalwars.com.br/game.php*
// @match        *://*.tribalwars.com.pt/game.php*
// @match        *://*.tribalwars.net/game.php*
// @match        *://*.tribalwars.com/game.php*
// @match        *://*.tribalwars.co.uk/game.php*
// @match        *://*.tribalwars.us/game.php*
// @match        *://*.tribalwars.nl/game.php*
// @match        *://*.tribalwars.se/game.php*
// @match        *://*.tribalwars.dk/game.php*
// @match        *://*.tribalwars.ae/game.php*
// @match        *://*.tribalwars.works/game.php*
// @match        *://*.die-staemme.de/game.php*
// @match        *://*.staemme.ch/game.php*
// @match        *://*.plemiona.pl/game.php*
// @match        *://*.divokekmeny.cz/game.php*
// @match        *://*.divoke-kmene.sk/game.php*
// @match        *://*.klanhaboru.hu/game.php*
// @match        *://*.guerretribale.fr/game.php*
// @match        *://*.guerrastribales.es/game.php*
// @match        *://*.tribals.it/game.php*
// @match        *://*.triburile.ro/game.php*
// @match        *://*.fyletikesmaxes.gr/game.php*
// @match        *://*.voynaplemyon.com/game.php*
// @match        *://*.vojnaplemen.si/game.php*
// @match        *://*.plemena.com/game.php*
// @match        *://*.klanlar.org/game.php*
// @noframes
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @connect      twbot-entrega.twbot.workers.dev
// @downloadURL  https://raw.githubusercontent.com/gustavonunesnr-dotcom/twbot-userscripts/main/TWBot.user.js
// @updateURL    https://raw.githubusercontent.com/gustavonunesnr-dotcom/twbot-userscripts/main/TWBot.user.js
// ==/UserScript==

/* Gerado por build.mjs — não edite. */
(function () {
  'use strict';

  var SERVIDOR = "https://twbot-entrega.twbot.workers.dev/carregar";
  var VERSAO = "0.8.1";

  // Chave pública do TWBot (ECDSA P-256, SPKI em base64). Só roda código
  // assinado pela chave privada correspondente.
  var CHAVE_PUBLICA = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEKD8KyFri5cZkQW0fyvfRufUR5k3Rj1KgpT6/aalqyE+Ep9wRLb3OrSrPPnggIaucmrhkLVBMU38pSGqf2ua0LA==";

  // Por quanto tempo a cópia guardada vale com o servidor fora do ar.
  var CARENCIA_MS = 24 * 3600 * 1000;

  // Com @grant, o Tampermonkey isola o script: window deixa de ser a janela
  // da página e game_data some. unsafeWindow é a página de verdade — e é nela
  // que o bundle precisa rodar, porque ele usa o jQuery e o TribalWars que só
  // existem lá.
  var pagina = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  // Os carregadores antigos (um por ferramenta) saem ao ver isto: quem
  // instalou o novo sem remover os velhos não fica com tudo em dobro.
  pagina.TWBotCarregador = VERSAO;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }

  function iniciar() {
    var gd = pagina.game_data;
    if (!gd || !gd.player) return;
  
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
  
    var conta = gd.market + ':' + gd.world + ':' + gd.player.id;
    var guardadas = GM_getValue('ferramentas', {}) || {};
    var tenho = {};

    Object.keys(guardadas).forEach(function (nome) {
      var g = guardadas[nome];
      if (g && typeof g.codigo === 'string') tenho[nome] = g.hash;
    });

    GM_xmlhttpRequest({
      method: 'POST',
      url: SERVIDOR,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        mercado: gd.market,
        mundo: gd.world,
        jogador: gd.player.id,
        tela: gd.screen,
        tenho: tenho
      }),
      timeout: 15000,
      onload: function (r) {
        var d = null;
        try { d = JSON.parse(r.responseText); } catch (e) {}

        // Resposta que não é do nosso servidor (5xx, página de erro do
        // Cloudflare) conta como servidor fora do ar, não como recusa.
        if (!d || r.status >= 500) { semServidor('o servidor respondeu ' + (r.status || '0')); return; }
        if (!d.ok) { recusada(d); return; }
        liberada(d);
      },
      onerror: function () { semServidor('não consegui falar com o servidor'); },
      ontimeout: function () { semServidor('o servidor demorou demais'); }
    });

    function recusada(d) {
      // A licença recusada apaga a permissão guardada desta conta, senão a
      // cópia guardada viraria um jeito de usar sem licença.
      var licencas = GM_getValue('licencas', {}) || {};
      delete licencas[conta];
      GM_setValue('licencas', licencas);

      // "Sem licença" é o caso comum e não é erro de ninguém: quem chegou
      // aqui sem comprar precisa saber onde comprar, não ver um traceback.
      avisar(d.erro === 'sem licença' || d.erro === 'licença expirada'
        ? 'Sua licença do <b>TWBot</b> não está ativa.'
        : 'Licença: ' + (d.erro || 'recusada') + '.');
    }

    function liberada(d) {
      var licencas = GM_getValue('licencas', {}) || {};
      licencas[conta] = { expira: d.expira || null, conferida: Date.now(), liberadas: d.liberadas || [] };
      GM_setValue('licencas', licencas);

      if (d.avisarRenovacao) {
        avisar('Licença do <b>TWBot</b> expira em ' +
               d.restam.dias + ' dias e ' + d.restam.horas + ' horas.', true);
      }

      executar((d.ferramentas || []).map(function (f) {
        var g = guardadas[f.nome];
        var nova = typeof f.codigo === 'string';
        return {
          nome: f.nome, versao: f.versao, assinatura: f.assinatura, telas: f.telas, nova: nova,
          codigo: nova ? f.codigo : (g && g.hash === f.hash ? g.codigo : null)
        };
      }));
    }

    function semServidor(motivo) {
      var l = (GM_getValue('licencas', {}) || {})[conta];
      var agora = Date.now();

      if (!l || agora - l.conferida > CARENCIA_MS || (l.expira && Date.parse(l.expira) <= agora)) {
        avisar(motivo + '.');
        return;
      }

      console.warn('[TWBot] ' + motivo + '; usando a cópia guardada (licença conferida há ' +
                   Math.round((agora - l.conferida) / 60000) + ' min).');

      executar((l.liberadas || []).filter(function (nome) {
        var g = guardadas[nome];
        return g && typeof g.codigo === 'string' && rodaNaTela(g.telas, gd.screen);
      }).map(function (nome) {
        var g = guardadas[nome];
        return { nome: nome, versao: g.versao, assinatura: g.assinatura, telas: g.telas, codigo: g.codigo };
      }));
    }
  }

  /**
   * Confere todas e executa na ordem que vieram. A conferência é em paralelo
   * (são milissegundos), a execução não: a ordem é a do build.
   */
  function executar(lista) {
    Promise.all(lista.map(function (f) {
      if (!f.codigo) return Promise.resolve('o código não veio nem estava guardado');
      return conferir(f).then(function () { return null; }, function (e) { return e.message; });
    })).then(function (erros) {
      var guardadas = GM_getValue('ferramentas', {}) || {};
      var maior = GM_getValue('maiorVersao', '0.0.0');
      var mudou = false;

      lista.forEach(function (f, i) {
        var erro = erros[i] || (menor(f.versao, maior)
          ? 'versão ' + f.versao + ' é mais velha que a ' + maior + ' já usada' : null);

        if (erro) {
          console.error('[TWBot] ' + f.nome + ' recusado: ' + erro + '.');
          avisar('<b>' + f.nome + '</b> não foi carregado: ' + erro + '.');
          // Cópia guardada que não passa é descartada, para vir inteira da
          // próxima vez em vez de falhar em toda página.
          if (guardadas[f.nome]) { delete guardadas[f.nome]; mudou = true; }
          return;
        }

        if (f.nova) {
          guardadas[f.nome] = { versao: f.versao, hash: f.hash, assinatura: f.assinatura, telas: f.telas, codigo: f.codigo };
          mudou = true;
        }
        if (menor(maior, f.versao)) maior = f.versao;

        try {
          // eval DA PÁGINA, não o nosso: o bundle precisa do escopo onde vivem
          // jQuery, TribalWars e game_data. O sourceURL dá nome ao arquivo no
          // DevTools, e o erro aponta a linha certa.
          pagina.eval(f.codigo + '\n//# sourceURL=TWBot/' + f.nome + '.js');
        } catch (e) {
          console.error('[TWBot] ' + f.nome + ' lançou erro:', e);
        }
      });

      if (mudou) GM_setValue('ferramentas', guardadas);
      GM_setValue('maiorVersao', maior);
    });
  }

  var chave = null;

  /** Calcula o hash do código e confere a assinatura. Grava o hash em f. */
  function conferir(f) {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return Promise.reject(new Error('o navegador não tem WebCrypto'));
    }

    var texto = new TextEncoder();

    if (!chave) {
      chave = crypto.subtle.importKey('spki', bytes(CHAVE_PUBLICA),
        { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    }

    return crypto.subtle.digest('SHA-256', texto.encode(f.codigo)).then(function (buf) {
      f.hash = Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');

      var mensagem = texto.encode('twbot|' + f.nome + '|' + f.versao + '|' + f.hash);
      return chave.then(function (k) {
        return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, bytes(f.assinatura || ''), mensagem);
      });
    }).then(function (ok) {
      if (!ok) throw new Error('assinatura inválida');
    });
  }

  function bytes(b64) {
    var s = atob(b64);
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }

  function rodaNaTela(telas, tela) {
    return !Array.isArray(telas) || telas.indexOf(tela) !== -1;
  }

  /** a < b, comparando versões x.y.z. */
  function menor(a, b) {
    var x = String(a).split('.'), y = String(b).split('.');
    for (var i = 0; i < 3; i++) {
      var p = parseInt(x[i], 10) || 0, q = parseInt(y[i], 10) || 0;
      if (p !== q) return p < q;
    }
    return false;
  }

  function avisar(msg, brando) {
    var UI = pagina.UI;
    if (UI && UI.ErrorMessage && !brando) UI.ErrorMessage(msg, 6000);
    else if (UI && UI.SuccessMessage) UI.SuccessMessage(msg, 6000);
    console.warn('[TWBot] ' + msg.replace(/<[^>]*>/g, ''));
  }
})();
