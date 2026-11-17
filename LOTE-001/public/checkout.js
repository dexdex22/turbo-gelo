/* ===========================================================================
   CHECKOUT — adaptador configurável.
   ---------------------------------------------------------------------------
   Três modos (produto.config.js → checkout.modo):
     'demo' : não cria pedido nenhum e avisa isso na tela. É o padrão.
     'url'  : redireciona para uma URL fixa de checkout.
     'api'  : POST do pedido para o seu endpoint, que devolve { checkoutUrl }.

   O que este arquivo NUNCA faz:
     • guardar token, chave ou credencial de gateway;
     • carregar script de terceiro, pixel ou tracker;
     • exibir pedido ou pagamento "concluído" — quem confirma é o gateway.
   ========================================================================= */
(function (global) {
  'use strict';

  /* Repasse de UTM.
     Valores ausentes da URL são preservados pelo cookie HttpOnly no servidor.
     O repasse só acontece para hosts da lista branca — assim o template não
     vaza parâmetros de origem para um domínio que não é seu.                */
  function comParametros(urlDestino, conf) {
    var chaves = (conf && conf.parametrosRepassados) || [];
    var permitidos = (conf && conf.dominiosPermitidos) || [];
    try {
      var destino = new URL(urlDestino, global.location.href);
      var liberado = destino.origin === global.location.origin || permitidos.some(function (d) {
        return destino.hostname === d || destino.hostname.endsWith('.' + d);
      });
      if (!liberado) return destino.toString();

      var atual = new URLSearchParams(global.location.search);
      chaves.forEach(function (k) {
        var v = atual.get(k);
        if (v && !destino.searchParams.has(k)) destino.searchParams.set(k, v);
      });
      return destino.toString();
    } catch (e) {
      return urlDestino;   // rastreio nunca pode bloquear a venda
    }
  }

  /* Em modo 'url', a URL de destino precisa representar o que o cliente
     escolheu. Resolve a URL do kit e, se pedido, anexa a seleção como
     parâmetros de query (kit, quantidade, item1_cor, item1_tamanho, ...).   */
  function urlDoPedido(pedido, conf) {
    var base = (conf.urlPorKit && conf.urlPorKit[pedido.kit]) || conf.url;
    if (!base) throw new Error('nenhuma URL de checkout para o kit "' + pedido.kit + '"');
    if (!conf.enviarSelecaoNaUrl) return base;
    try {
      var u = new URL(base, global.location.href);
      u.searchParams.set('kit', pedido.kit);
      u.searchParams.set('quantidade', String(pedido.quantidade));
      (pedido.unidades || []).forEach(function (unidade, i) {
        Object.keys(unidade).forEach(function (atributo) {
          u.searchParams.set('item' + (i + 1) + '_' + atributo, unidade[atributo]);
        });
      });
      return u.toString();
    } catch (e) {
      return base;
    }
  }

  var ocupado = false;

  /* pedido = { kit, quantidade, precoExibido, unidades:[{cor:'...',tamanho:'...'}] } */
  async function iniciar(botao, pedido, conf, avisar) {
    if (ocupado) return;
    conf = conf || {};
    var modo = conf.modo || 'demo';

    if (modo === 'demo') {
      avisar('demo', conf.textoDemo || 'Checkout em modo demonstração.', pedido);
      return;
    }

    ocupado = true;
    var textoOriginal = botao ? botao.textContent : '';
    if (botao) { botao.textContent = 'Abrindo pagamento…'; botao.disabled = true; }

    try {
      if (modo === 'url') {
        global.location.href = comParametros(urlDoPedido(pedido, conf), conf);
        return;                                  // navegação assume daqui
      }

      if (modo === 'api') {
        if (!conf.endpoint) throw new Error('checkout.endpoint não configurado');
        var resp = await fetch(conf.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pedido),
        });
        var dados = await resp.json().catch(function () { return {}; });
        if (resp.ok && dados && dados.checkoutUrl) {
          global.location.href = comParametros(dados.checkoutUrl, conf);
          return;
        }
        throw new Error('resposta sem checkoutUrl (HTTP ' + resp.status + ')');
      }

      throw new Error('modo de checkout desconhecido: ' + modo);
    } catch (erro) {
      avisar('erro', 'Não foi possível concluir o pagamento agora. Tente novamente ou fale com nosso suporte.', pedido);
    } finally {
      ocupado = false;
      if (botao) { botao.textContent = textoOriginal; botao.disabled = false; }
    }
  }

  global.CHECKOUT = { iniciar: iniciar, comParametros: comParametros, urlDoPedido: urlDoPedido };
})(window);
