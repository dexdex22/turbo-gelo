/* ===========================================================================
   MOTOR DE RENDER — não precisa editar para publicar um produto.
   Lê window.PRODUTO (produto.config.js) e monta a página inteira.
   Regra geral: seção sem dado ou com ativo:false não é renderizada —
   não sobra margem, borda nem espaço em branco.
   ========================================================================= */
(function () {
  'use strict';

  var P = window.PRODUTO;
  if (!P) { console.error('produto.config.js não carregou'); return; }

  /* ---------------------------------------------------------------- utils */
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var temTexto = function (v) { return typeof v === 'string' && v.trim() !== ''; };
  var temLista = function (v) { return Array.isArray(v) && v.length > 0; };
  var ligado = function (bloco, campo) {
    if (!bloco || bloco.ativo === false) return false;
    if (campo) return temLista(bloco[campo]);
    return true;
  };
  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- ícones
     Conjunto neutro e autoral, desenhado em grade 24. Para acrescentar um
     ícone, basta adicionar um path aqui e citar a chave no config.          */
  var ICONES = {
    menu:     '<path d="M4 7h16M4 12h16M4 17h16"/>',
    fechar:   '<path d="M6 6l12 12M18 6L6 12.1 6 18"/>',
    busca:    '<circle cx="11" cy="11" r="6.6"/><path d="M19.5 19.5L15.7 15.7"/>',
    sacola:   '<path d="M6 8.5h12l-1 11H7z"/><path d="M9.3 8.5V6.6a2.7 2.7 0 0 1 5.4 0v1.9"/>',
    carrinho: '<path d="M2.5 3.5h2.6l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1l1.7-6.8H6.1"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/>',
    cadeado:  '<rect x="5" y="10.5" width="14" height="9.3" rx="2"/><path d="M8.2 10.5V7.2a3.8 3.8 0 0 1 7.6 0v3.3"/>',
    escudo:   '<path d="M12 3.2l7 2.9v4.8c0 4.3-2.9 7.2-7 8.7-4.1-1.5-7-4.4-7-8.7V6.1z"/><path d="M9 11.8l2.1 2.1L15.3 9"/>',
    caminhao: '<path d="M3 7h11v9H3z"/><path d="M14 10.2h4l3 3V16h-7z"/><circle cx="7.4" cy="17.4" r="1.5"/><circle cx="17.4" cy="17.4" r="1.5"/>',
    etiqueta: '<path d="M4 11.4V4.6h6.8L20 13.8 13.8 20z"/><circle cx="8" cy="8" r="1.3"/>',
    cartao:   '<rect x="3" y="5.8" width="18" height="12.4" rx="2"/><path d="M3 10h18M6.5 14.6h4"/>',
    relogio:  '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.3V12l3.1 2"/>',
    raio:     '<path d="M13.2 3L5.8 13h5l-1 8 7.4-10.6h-5z"/>',
    neve:     '<path d="M12 2.8v18.4M4 7.4l16 9.2M20 7.4L4 16.6"/><path d="M9.6 4.4L12 6.6l2.4-2.2M9.6 19.6l2.4-2.2 2.4 2.2M4.6 10.4l3.1-1-.7-3.2M19.4 13.6l-3.1 1 .7 3.2M19.4 10.4l-3.1-1 .7-3.2M4.6 13.6l3.1 1-.7 3.2"/>',
    estrela:  '<path d="M12 3.4l2.5 5.8 6.3.5-4.8 4.1 1.5 6.1L12 16.7 6.5 19.9 8 13.8 3.2 9.7l6.3-.5z"/>',
    coracao:  '<path d="M12 19.7S4.8 15.3 4.8 10.3A3.7 3.7 0 0 1 12 6.8a3.7 3.7 0 0 1 7.2 3.5c0 5-7.2 9.4-7.2 9.4z"/>',
    check:    '<circle cx="12" cy="12" r="8.6"/><path d="M8.4 12.1l2.5 2.5 4.8-5"/>',
    troca:    '<path d="M4.6 10.2a7.6 7.6 0 0 1 13-3.3"/><path d="M19.4 13.8a7.6 7.6 0 0 1-13 3.3"/><path d="M18.2 3.6v3.6h-3.6M5.8 20.4v-3.6h3.6"/>',
    suporte:  '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M4 7.2l8 6 8-6"/>',
    regua:    '<rect x="2.8" y="8.3" width="18.4" height="7.4" rx="1.6"/><path d="M7 8.3v3M11 8.3v2M15 8.3v3M19 8.3v2"/>',
    presente: '<rect x="4" y="9.6" width="16" height="10.4" rx="1.5"/><path d="M3 9.6h18M12 9.6V20M12 9.6S10.6 5.2 8.3 5.2a2 2 0 0 0 0 4M12 9.6s1.4-4.4 3.7-4.4a2 2 0 0 1 0 4"/>',
    casa:     '<path d="M4 10.6L12 4l8 6.6"/><path d="M6 9.9v9.6h12V9.9"/><path d="M10 19.5V14h4v5.5"/>',
    sol:      '<circle cx="12" cy="12" r="4.1"/><path d="M12 2.9v2.3M12 18.8v2.3M2.9 12h2.3M18.8 12h2.3M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6"/>',
    passos:   '<path d="M8.3 4.6c1.7 0 2.6 1.4 2.6 3.4 0 2.6-1.3 3.6-1.3 5.2 0 1.2-.6 1.9-1.9 1.9S5.8 14.4 5.8 13c0-1.6-1.3-2.6-1.3-5.2 0-2 .9-3.2 2.6-3.2z"/><path d="M16.1 8.9c1.7 0 2.6 1.4 2.6 3.4 0 2.6-1.3 3.6-1.3 5.2 0 1.2-.6 1.9-1.9 1.9s-1.9-.7-1.9-2.1c0-1.6-1.3-2.6-1.3-5.2 0-2 .9-3.2 2.6-3.2z"/>',
    info:     '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2M12 8.1v.1"/>',
    seta:     '<path d="M9 5.5l6.5 6.5L9 18.5"/>',
    caixa:    '<path d="M12 3.2l8 4.2v9.2l-8 4.2-8-4.2V7.4z"/><path d="M4 7.4l8 4.2 8-4.2M12 11.6v9.2"/>',
  };
  var icone = function (nome, classe) {
    var corpo = ICONES[nome] || ICONES.check;
    return '<svg viewBox="0 0 24 24" class="ic ' + (classe || '') + '" aria-hidden="true" focusable="false">' + corpo + '</svg>';
  };
  var estrelas = function (n) {
    n = Math.max(0, Math.min(5, Number(n) || 0));
    return '<span class="estrelas" aria-label="' + n + ' de 5 estrelas">' +
      '★'.repeat(n) + '<span class="vazia">' + '★'.repeat(5 - n) + '</span></span>';
  };
  /* imagem com fallback visual: se o arquivo não existir, vira um placeholder
     tracejado em vez de um ícone quebrado */
  var img = function (src, alt, classe, extra, opcoes) {
    var imagens = P.galeria && P.galeria.imagens || [];
    var item = imagens.find(function (imagem) { return imagem.src === src; });
    var responsiva = item && item.responsiva;
    if (responsiva) {
      opcoes = opcoes || {};
      var sizes = opcoes.sizes || '100vw';
      var srcset = function (formato) {
        return responsiva.larguras.map(function (largura) {
          return responsiva.base + '-' + largura + '.' + formato + ' ' + largura + 'w';
        }).join(', ');
      };
      return '<picture style="display:contents">' +
        '<source type="image/avif" srcset="' + esc(srcset('avif')) + '" sizes="' + esc(sizes) + '">' +
        '<source type="image/webp" srcset="' + esc(srcset('webp')) + '" sizes="' + esc(sizes) + '">' +
        '<img src="' + esc(responsiva.base + '-640.jpg') + '" srcset="' + esc(srcset('jpg')) + '" sizes="' + esc(sizes) + '"' +
        ' width="' + responsiva.largura + '" height="' + responsiva.altura + '" alt="' + esc(alt || '') + '" class="' + (classe || '') + '"' +
        (opcoes.prioridade ? ' loading="eager" decoding="sync" fetchpriority="high"' : ' loading="lazy" decoding="async"') +
        ' ' + (extra || '') + ' data-imagem></picture>';
    }
    if (!temTexto(src)) {
      return '<div class="ph ' + (classe || '') + '" role="img" aria-label="' + esc(alt || 'imagem') + '">' + esc(alt || 'imagem') + '</div>';
    }
    // sem handler inline: o fallback é ligado por delegação (ver abaixo),
    // para a página continuar funcionando sob Content-Security-Policy estrita
    return '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" class="' + (classe || '') + '"' +
      (opcoes && opcoes.prioridade ? ' loading="eager" decoding="sync" fetchpriority="high"' : ' loading="lazy" decoding="async"') + ' ' +
      (extra || '') + ' data-imagem>';
  };

  /* Imagem que não carrega vira placeholder tracejado em vez de ícone quebrado.
     Captura no documento porque o evento "error" de <img> não borbulha.      */
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (el && el.tagName === 'IMG' && el.hasAttribute('data-imagem') && !el.dataset.falhou) {
      el.dataset.falhou = '1';
      el.classList.add('ph');
      el.removeAttribute('src');
    }
  }, true);

  /* --------------------------------------------------------------- cabeça */
  (function metaESeo() {
    var seo = P.seo || {};
    var marca = (P.marca && P.marca.nome) || '';
    if (temTexto(seo.titulo)) document.title = seo.titulo;
    var meta = function (attr, chave, valor) {
      if (!temTexto(valor)) return;
      var el = document.head.querySelector('meta[' + attr + '="' + chave + '"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, chave); document.head.appendChild(el); }
      el.setAttribute('content', valor);
    };
    var base = temTexto(seo.urlCanonica) ? seo.urlCanonica : '';
    var abs = function (rel) {
      if (!temTexto(rel)) return '';
      if (/^https?:/i.test(rel)) return rel;
      return base ? base.replace(/\/+$/, '/') + rel.replace(/^\//, '') : '';
    };
    meta('name', 'description', seo.descricao);
    meta('name', 'theme-color', seo.tema);
    meta('property', 'og:type', 'website');
    meta('property', 'og:title', seo.titulo);
    meta('property', 'og:description', seo.descricao);
    meta('property', 'og:site_name', seo.nomeDoSite || marca);
    meta('property', 'og:locale', seo.locale || 'pt_BR');
    meta('property', 'og:url', base);
    meta('property', 'og:image', abs(seo.ogImagem));   // relativa não vale em OG
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:image', abs(seo.ogImagem));
    if (base) {
      var can = document.head.querySelector('link[rel="canonical"]') || document.createElement('link');
      can.rel = 'canonical'; can.href = base; document.head.appendChild(can);
    }
  })();

  /* --------------------------------------------------------------- estado */
  var KITS = (ligado(P.kits, 'opcoes') ? P.kits.opcoes : [{
    qtd: 1, rotulo: '1 unidade',
    de: P.preco && P.preco.de, por: P.preco && P.preco.por,
    desconto: P.preco && P.preco.desconto, parcelas: P.preco && P.preco.parcelas,
  }]);
  var GRUPOS = (Array.isArray(P.variacoes) ? P.variacoes : []).filter(function (g) {
    return g && temLista(g.opcoes);
  });
  var CFG = (P.configurador && P.configurador.ativo !== false && P.configurador.marcas) ? P.configurador : null;
  var kitAtual = 0;
  var unidades = [];      // com configurador: { lado, tipo, marca, modelo, cor, manual, manualTexto }
  /* Cores vêm do servidor (/precos.js, lib/checkout/cores.ts). A lista local só cobre falha de carregamento. */
  var CORES = (window.TURBOGELO_PRECOS && window.TURBOGELO_PRECOS.cores) || {
    lista: [
      { nome: 'Branco', hex: '#F4F5F2' }, { nome: 'Preto', hex: '#151515' }, { nome: 'Prata', hex: '#C3C6CA' },
      { nome: 'Cinza', hex: '#6E7278' }, { nome: 'Azul', hex: '#1F4FA3' }, { nome: 'Vermelho', hex: '#C2262E' },
      { nome: 'Verde', hex: '#2F6B3F' }, { nome: 'Bege', hex: '#D9C8A5' }, { nome: 'Marrom', hex: '#6A4428' },
    ], indisponiveis: {}, fotos: {},
  };
  var chaveModelo = function (u) { return (u.marca || '') + '|' + (u.modelo || ''); };
  var coresDe = function (u) {
    var bloqueadas = (!u.manual && CORES.indisponiveis[chaveModelo(u)]) || [];
    return CORES.lista.filter(function (c) { return bloqueadas.indexOf(c.nome) === -1; });
  };
  var carroEscolhido = function (u) { return u.manual ? temTexto(u.manualTexto) : !!u.modelo; };
  /* Mantém a cor só se ela continuar disponível para o carro atual. */
  var ajustarCor = function (u) {
    if (u.cor && !coresDe(u).some(function (c) { return c.nome === u.cor; })) u.cor = '';
  };
  var fotoDaCor = function (u) {
    if (!u || u.manual || !u.cor) return null;
    var porCor = CORES.fotos[chaveModelo(u)] && CORES.fotos[chaveModelo(u)][u.cor];
    return (porCor && porCor[u.lado === 'Traseira' ? 'traseira' : 'frente']) || null;
  };
  var padraoUnidade = function () {
    if (CFG) return { lado: '', tipo: '', marca: '', modelo: '', cor: '', manual: false, manualTexto: '' };
    var o = {};
    GRUPOS.forEach(function (g) { o[g.id] = g.padrao || g.opcoes[0].valor; });
    return o;
  };
  var resumoUnidade = function (u) {
    if (!CFG) return Object.assign({}, u);
    var o = { lado: u.lado, tipo: u.tipo };
    if (u.manual) o.carro = u.manualTexto.trim();
    else { o.marca = u.marca; o.modelo = u.modelo; o.foto = fotoDaUnidade(u) || ''; }
    o.cor = u.cor;
    Object.keys(o).forEach(function (k) { if (!temTexto(o[k])) delete o[k]; });
    return o;
  };
  var pedidoAtual = function () {
    var k = KITS[kitAtual];
    return {
      kit: k.rotulo, quantidade: k.qtd, precoExibido: k.por,
      unidades: unidades.slice(0, k.qtd).map(resumoUnidade),
    };
  };

  /* ----------------------------------------------------- 1. barra de aviso */
  (function barraAviso() {
    var a = P.avisoTopo;
    if (!a || a.ativo === false || !temTexto(a.texto)) return;
    var alvo = $('#aviso');
    alvo.className = 'aviso';
    alvo.setAttribute('role', 'note');
    var floco = '<span class="aviso__floco" aria-hidden="true">❄️</span>';
    alvo.innerHTML = '<p class="aviso__texto">' + floco +
      '<span class="aviso__frase">' + esc(a.texto) + '</span>' + floco + '</p>';
    alvo.hidden = false;
  })();

  /* ------------------------------------------------------------ 2. header */
  (function header() {
    var m = P.marca || {}, nav = P.navegacao || {};
    var acoes = ((P.header && P.header.acoes) || []).filter(function (a) {
      if (a.tipo === 'menu') return true;
      return temTexto(a.href);           // link/âncora sem destino não vira botão
    });
    var temMenu = temLista(nav.politicas) || temLista(nav.institucional) ||
      temTexto(nav.inicio) || (nav.rastreio && nav.rastreio.ativo && temTexto(nav.rastreio.href));

    var html = '<div class="topo__barra coluna">';
    html += temMenu
      ? '<button class="btn-icone" id="abrirMenu" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu">' + icone('menu', '') + '</button>'
      : '<span style="width:40px"></span>';
    html += '<a class="topo__logo" href="' + esc(nav.inicio || 'index.html') + '" aria-label="' + esc(m.nome || 'Início') + ' — início">' +
      img(m.logo, m.alt || m.nome, '', 'height="28"') + '</a>';
    html += '<div class="topo__acoes">' + acoes.map(function (a) {
      return '<a class="btn-icone" href="' + esc(a.href) + '" aria-label="' + esc(a.rotulo || '') + '">' + icone(a.icone) + '</a>';
    }).join('') + (acoes.length ? '' : '<span style="width:40px"></span>') + '</div>';
    html += '</div>';

    var topo = $('#topo');
    topo.innerHTML = html;
    topo.hidden = false;
    if (temMenu) montarMenu();
  })();

  function montarMenu() {
    var nav = P.navegacao || {}, m = P.marca || {}, c = P.contato || {};
    var item = function (l) {
      return '<a href="' + esc(l.href) + '"><span>' + esc(l.rotulo) + '</span><span aria-hidden="true">›</span></a>';
    };
    var html = '<div class="menu__fundo" data-fechar-menu></div><nav class="menu__painel" aria-label="Menu principal">';
    html += '<div class="menu__topo">' +
      '<button class="menu__fechar" data-fechar-menu aria-label="Fechar menu">✕</button>' +
      img(m.logoNegativo || m.logo, m.alt || m.nome, '', 'height="28"') +
      (temTexto(m.legendaMenu) ? '<p>' + esc(m.legendaMenu) + '</p>' : '') + '</div>';
    html += '<div class="menu__lista">';
    if (temTexto(nav.inicio)) html += item({ rotulo: 'Início', href: nav.inicio });
    if (nav.rastreio && nav.rastreio.ativo && temTexto(nav.rastreio.href)) {
      html += item({ rotulo: nav.rastreio.rotulo || 'Rastrear Pedido', href: nav.rastreio.href });
    }
    html += item({ rotulo: 'Perguntas Frequentes', href: '#faq' });
    if (temLista(nav.politicas)) html += '<p class="menu__grupo">Políticas</p>' + nav.politicas.map(item).join('');
    if (temLista(nav.institucional)) html += '<p class="menu__grupo">Institucional</p>' + nav.institucional.map(item).join('');
    html += '</div>';
    if (temTexto(c.email)) {
      html += '<div class="menu__rodape"><p class="menu__grupo" style="margin:0 0 6px">Atendimento</p>' +
        '<p>' + icone('suporte') + '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p></div>';
    }
    html += '</nav>';
    var menu = $('#menu');
    menu.innerHTML = html;

    var botao = $('#abrirMenu');
    var abrir = function () { menu.hidden = false; document.body.classList.add('travado'); botao.setAttribute('aria-expanded', 'true'); $('.menu__fechar', menu).focus(); };
    var fechar = function () { menu.hidden = true; document.body.classList.remove('travado'); botao.setAttribute('aria-expanded', 'false'); botao.focus(); };
    botao.addEventListener('click', abrir);
    menu.addEventListener('click', function (e) {
      if (e.target.closest('[data-fechar-menu]')) { fechar(); return; }
      if (e.target.closest('a')) { menu.hidden = true; document.body.classList.remove('travado'); botao.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) fechar(); });
  }

  /* ----------------------------------------------- blocos reutilizáveis */
  var cta = function (texto, variante) {
    if (!temTexto(texto)) return '';
    return '<button type="button" class="cta' + (variante ? ' ' + variante : '') + '" data-comprar>' + esc(texto) + '</button>';
  };
  var seccao = function (conteudo, attrs) {
    return '<section ' + (attrs || '') + '>' + conteudo + '</section>';
  };

  /* ------------------------------------------------------- 3. galeria */
  function blocoGaleria() {
    var g = P.galeria;
    if (!g || !temLista(g.imagens)) return '';
    var s = P.selos || {};
    var selos = '';
    if (s.desconto && s.desconto.ativo && temTexto(s.desconto.texto))
      selos += '<span class="selo-canto selo-canto--esq" id="seloDesconto">' + esc(s.desconto.texto) + '</span>';
    if (s.nota && s.nota.ativo && temTexto(s.nota.texto))
      selos += '<span class="selo-canto selo-canto--dir" id="seloNota"><span class="estrela">★</span>' + esc(s.nota.texto) + '</span>';
    var setas = g.imagens.length > 1
      ? '<button type="button" class="galeria__seta galeria__seta--ant" data-galeria="ant" aria-label="Foto anterior"><img src="img/turbogelo/ui/seta-anterior.svg" alt="" width="48" height="48"></button>' +
        '<button type="button" class="galeria__seta galeria__seta--prox" data-galeria="prox" aria-label="Próxima foto"><img src="img/turbogelo/ui/seta-proxima.svg" alt="" width="48" height="48"></button>' +
        '<div class="galeria__pontos" id="galeriaPontos"></div>'
      : '';
    return seccao(
      '<div class="galeria__palco">' +
        '<div class="galeria__quadro" id="galeriaQuadro"></div>' + selos + setas +
      '</div>' +
      (g.imagens.length > 1 ? '<div class="galeria__miniaturas" id="galeriaMiniaturas"></div>' : ''),
      'class="galeria"');
  }

  function ativarGaleria() {
    var g = P.galeria;
    if (!g || !temLista(g.imagens)) return;
    var quadro = $('#galeriaQuadro'), pontos = $('#galeriaPontos'), minis = $('#galeriaMiniaturas');
    var atual = 0;
    var semSelo = g.semSelo || [];
    var base = g.imagens.slice();
    var fotosCarros = [];
    var lista = function () { return fotosCarros.concat(base); };
    var ehFotoCarro = function (im) { return fotosCarros.indexOf(im) !== -1; };

    function montarNavegacao() {
      var l = lista();
      if (minis) {
        minis.innerHTML = l.map(function (im, i) {
          return '<button type="button" data-mini="' + i + '" aria-label="Ver imagem ' + (i + 1) + '"' +
            (ehFotoCarro(im) ? ' class="mini--carro"' : '') + '>' +
            img(im.src, im.alt || ('miniatura ' + (i + 1)), '', '', { sizes: '64px' }) + '</button>';
        }).join('');
      }
      if (pontos) {
        pontos.innerHTML = l.map(function (im, i) {
          return '<button type="button" data-ponto="' + i + '" aria-label="Imagem ' + (i + 1) + '"></button>';
        }).join('');
      }
    }
    montarNavegacao();

    function pintar() {
      var im = lista()[atual];
      quadro.innerHTML = img(im.src, im.alt || 'imagem do produto', '', '', {
        prioridade: im === base[0],
        sizes: base[0].responsiva ? base[0].responsiva.sizes : '100vw',
      });
      quadro.style.aspectRatio = im.proporcao || '';
      quadro.classList.toggle('galeria__quadro--carro', ehFotoCarro(im));
      var esconder = ehFotoCarro(im) || semSelo.indexOf(im.src) !== -1;
      [$('#seloDesconto'), $('#seloNota')].forEach(function (el) {
        if (el) el.classList.toggle('oculto', esconder);
      });
      if (pontos) $$('[data-ponto]', pontos).forEach(function (b, i) { b.setAttribute('aria-current', i === atual ? 'true' : 'false'); });
      if (minis) $$('[data-mini]', minis).forEach(function (b, i) { b.setAttribute('aria-current', i === atual ? 'true' : 'false'); });
    }
    function ir(i) { var n = lista().length; atual = (i + n) % n; pintar(); }

    document.addEventListener('click', function (e) {
      var alvo = e.target.closest('[data-galeria], [data-ponto], [data-mini]');
      if (!alvo) return;
      if (alvo.dataset.galeria === 'ant') ir(atual - 1);
      else if (alvo.dataset.galeria === 'prox') ir(atual + 1);
      else if (alvo.dataset.ponto !== undefined) ir(+alvo.dataset.ponto);
      else if (alvo.dataset.mini !== undefined) ir(+alvo.dataset.mini);
    });

    var tela = document.createElement('div');
    tela.className = 'tela-cheia';
    tela.hidden = true;
    tela.setAttribute('role', 'dialog');
    tela.setAttribute('aria-modal', 'true');
    tela.setAttribute('aria-label', 'Fotos do produto em tela cheia');
    document.body.appendChild(tela);
    var focoAntes = null;

    function abrirTelaCheia() {
      var l = lista();
      tela.innerHTML =
        '<div class="tela-cheia__trilho">' + l.map(function (im, i) {
          return '<figure class="tela-cheia__foto">' + img(im.src, im.alt || ('imagem ' + (i + 1))) + '</figure>';
        }).join('') + '</div>' +
        (l.length > 1
          ? '<button type="button" class="galeria__seta tela-cheia__seta tela-cheia__seta--ant" data-tela="ant" aria-label="Foto anterior"><img src="img/turbogelo/ui/seta-anterior.svg" alt="" width="48" height="48"></button>' +
            '<button type="button" class="galeria__seta tela-cheia__seta tela-cheia__seta--prox" data-tela="prox" aria-label="Próxima foto"><img src="img/turbogelo/ui/seta-proxima.svg" alt="" width="48" height="48"></button>'
          : '') +
        '<p class="tela-cheia__contador" aria-live="polite"></p>' +
        '<button type="button" class="tela-cheia__fechar" aria-label="Fechar">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>' +
        '</button>';
      focoAntes = document.activeElement;
      tela.hidden = false;
      document.documentElement.classList.add('sem-rolagem');
      var trilho = $('.tela-cheia__trilho', tela), contador = $('.tela-cheia__contador', tela);
      var indice = function () { return Math.round(trilho.scrollLeft / (trilho.clientWidth || 1)); };
      var marcar = function () { contador.textContent = (indice() + 1) + ' / ' + l.length; };
      trilho.scrollLeft = atual * trilho.clientWidth;
      marcar();
      trilho.addEventListener('scroll', marcar, { passive: true });
      $('.tela-cheia__fechar', tela).focus();
      tela.__indice = indice;
    }
    function fecharTelaCheia() {
      if (tela.hidden) return;
      var i = tela.__indice ? tela.__indice() : atual;
      tela.hidden = true;
      tela.innerHTML = '';
      document.documentElement.classList.remove('sem-rolagem');
      ir(i);
      if (focoAntes && focoAntes.focus) focoAntes.focus();
    }
    quadro.setAttribute('role', 'button');
    quadro.setAttribute('tabindex', '0');
    quadro.setAttribute('aria-label', 'Ampliar foto em tela cheia');
    var gestoFoto = null;
    var ignorarCliqueAte = 0;
    quadro.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var toqueFoto = null;
    quadro.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { toqueFoto = null; return; }
      var toque = e.touches[0];
      toqueFoto = { id: toque.identifier, x: toque.clientX, y: toque.clientY, eixo: null };
    }, { passive: true });
    quadro.addEventListener('touchmove', function (e) {
      if (!toqueFoto || e.touches.length !== 1) { toqueFoto = null; return; }
      var toque = e.touches[0];
      var dx = Math.abs(toque.clientX - toqueFoto.x);
      var dy = Math.abs(toque.clientY - toqueFoto.y);
      if (!toqueFoto.eixo && Math.max(dx, dy) > 8) toqueFoto.eixo = dx > dy ? 'x' : 'y';
      if (toqueFoto.eixo === 'x') {
        ignorarCliqueAte = Date.now() + 500;
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });
    quadro.addEventListener('touchend', function (e) {
      if (!toqueFoto) return;
      var gesto = toqueFoto;
      toqueFoto = null;
      var toque = Array.from(e.changedTouches).find(function (t) { return t.identifier === gesto.id; });
      if (!toque || gesto.eixo === 'y') return;
      var dx = toque.clientX - gesto.x;
      var dy = toque.clientY - gesto.y;
      if (Math.abs(dx) >= 30 && Math.abs(dx) > Math.abs(dy)) {
        ignorarCliqueAte = Date.now() + 500;
        ir(atual + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
    quadro.addEventListener('touchcancel', function () { toqueFoto = null; });
    quadro.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || !e.isPrimary || e.button !== 0) return;
      gestoFoto = { id: e.pointerId, x: e.clientX, y: e.clientY };
      quadro.setPointerCapture(e.pointerId);
    });
    quadro.addEventListener('pointerup', function (e) {
      if (!gestoFoto || gestoFoto.id !== e.pointerId) return;
      var dx = e.clientX - gestoFoto.x;
      var dy = e.clientY - gestoFoto.y;
      gestoFoto = null;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        ignorarCliqueAte = Date.now() + 400;
        ir(atual + (dx < 0 ? 1 : -1));
      }
    });
    quadro.addEventListener('pointercancel', function () { gestoFoto = null; });
    quadro.addEventListener('lostpointercapture', function () { gestoFoto = null; });
    quadro.addEventListener('click', function () {
      if (Date.now() < ignorarCliqueAte) return;
      abrirTelaCheia();
    });
    quadro.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirTelaCheia(); }
    });
    tela.addEventListener('click', function (e) {
      if (e.target.closest('.tela-cheia__fechar')) return fecharTelaCheia();
      var seta = e.target.closest('[data-tela]');
      var trilho = $('.tela-cheia__trilho', tela);
      if (!seta || !trilho) return;
      var total = trilho.children.length;
      var i = tela.__indice();
      var destino = seta.dataset.tela === 'prox' ? (i + 1) % total : (i - 1 + total) % total;
      trilho.scrollTo({ left: destino * trilho.clientWidth, behavior: 'smooth' });
    });
    document.addEventListener('keydown', function (e) {
      if (tela.hidden) return;
      if (e.key === 'Escape') fecharTelaCheia();
      var trilho = $('.tela-cheia__trilho', tela);
      if (!trilho) return;
      if (e.key === 'ArrowRight') trilho.scrollBy({ left: trilho.clientWidth, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') trilho.scrollBy({ left: -trilho.clientWidth, behavior: 'smooth' });
    });

    /* Leva o cliente de volta à galeria para ver o modelo escolhido.
       No desktop a galeria é sticky e já está visível, então não rola. */
    var rolarParaGaleria = function () {
      var alvo = quadro.closest('.galeria') || quadro;
      var topo = $('.topo');
      var folga = topo ? topo.getBoundingClientRect().bottom : 0;
      var r = alvo.getBoundingClientRect();
      if (r.top >= folga && r.bottom <= window.innerHeight) return;
      var suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, r.top + window.scrollY - folga - 8), behavior: suave ? 'smooth' : 'auto' });
    };

    window.__irParaImagem = function (src, rolar) {
      var i = lista().findIndex(function (im) { return im.src === src; });
      if (i >= 0) ir(i);
      if (rolar) rolarParaGaleria();
    };

    // Só publica fotos carregadas; uma resposta antiga não pode substituir uma seleção nova.
    var pedidoFoto = 0;
    window.__fotosDosCarros = function (fotos, rolar, unidadeAtiva) {
      var id = ++pedidoFoto;
      Promise.all(fotos.map(function (foto) {
        if (fotosCarros.some(function (im) { return im.src === foto.src; })) return Promise.resolve(foto);
        return new Promise(function (resolve) {
          var teste = new Image();
          teste.onload = function () { resolve(foto); };
          teste.onerror = function () { resolve(null); };
          teste.src = foto.src;
        });
      })).then(function (carregadas) {
        if (id !== pedidoFoto) return;
        fotosCarros = carregadas.filter(Boolean);
        montarNavegacao();
        var indice = fotosCarros.findIndex(function (foto) { return foto.unidade === unidadeAtiva; });
        ir(indice >= 0 ? indice : 0);
        if (rolar) rolarParaGaleria();
      });
    };
    pintar();
  }

  function MicroSocialProof(av) {
    if (!av || !av.ativo) return '';
    return '<div class="micro-social-proof" aria-label="Avaliação ' + esc(av.nota) + ' de 5 com ' + esc(av.quantidade) + ' clientes">' +
      '<span class="stars" aria-hidden="true">⭐⭐⭐⭐⭐</span><span class="rating">' + esc(av.nota) + '/5</span>' +
      '<span class="count">— ' + esc(av.quantidade) + ' TurboGelos já na garagem dos clientes</span></div>';
  }



  /* -------------------------------------------------- 4. card de compra */
  function blocoCompra() {
    var cab = P.cabecalho || {};
    var av = P.avaliacaoResumo;
    var html = '<div class="cartao compra">';

    if (cab.etiqueta && cab.etiqueta.ativo && temTexto(cab.etiqueta.texto)) {
      html += '<p class="etiqueta-topo' + (cab.etiqueta.efeito === 'black' ? ' etiqueta-topo--black' : '') + '">' +
        icone(cab.etiqueta.icone || 'cadeado', '') + '<span>' + esc(cab.etiqueta.texto) + '</span></p>';
    }
    if (temTexto(cab.titulo)) {
      // <b> no título vira destaque na cor da marca
      html += '<h1>' + String(cab.titulo).replace(/<b>/g, '<span class="realce">').replace(/<\/b>/g, '</span>') + '</h1>';
    }
    if (temTexto(cab.sub)) html += '<p class="compra__sub">' + esc(cab.sub) + '</p>';
    html += MicroSocialProof(av);
    html += '<div class="preco" id="blocoPreco"></div>';
    html += '<div id="blocoVariacoes"></div>';
    html += '<div id="blocoBrinde"></div>';
    if (temTexto(cab.emocional)) html += '<p class="compra__emocional">' + esc(cab.emocional) + '</p>';
    html += cta(P.ctas && P.ctas.principal);
    var ic = P.infoCompra;
    if (ic && ic.ativo !== false && temTexto(ic.nota)) html += '<p class="compra__nota">' + esc(ic.nota) + '</p>';
    html += '<div id="recadoCheckout"></div>';
    html += '<div id="blocoUrgencia"></div>';
    if (ligado(ic, 'itens')) {
      html += '<div class="info-compra">' + ic.itens.map(function (i) {
  var tabela = '';
  if (i.tabela && Array.isArray(i.tabela.linhas)) {
    tabela = '<div class="capacidade"><table><caption><strong>' + esc(i.tabela.titulo) + '</strong><span>' + esc(i.tabela.descricao) + '</span></caption>' +
    '<thead><tr><th scope="col">Embalagem</th><th scope="col">Camada</th><th scope="col">Camadas</th><th scope="col">Cabe</th></tr></thead><tbody>' +
    i.tabela.linhas.map(function (linha) {
      return '<tr><th scope="row">' + esc(linha[0]) + '</th><td>' + esc(linha[1]) + '</td><td>' + esc(linha[2]) + '</td><td><strong>' + esc(linha[3]) + '</strong></td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  return '<details' + (i.aberto ? ' open' : '') + '><summary>' + icone(i.icone || 'info') + '<span>' + esc(i.t) + '</span>' +
  '<span class="chev" aria-hidden="true"></span></summary><p>' + esc(i.c) + '</p>' + tabela + '</details>';
      }).join('') + '</div>';
    }

    var conf = P.confianca;
    if (ligado(conf, 'itens')) {
      html += '<div class="confianca">' + conf.itens.slice(0, 3).map(function (i) {
        return '<div>' + icone(i.icone || 'check') + '<span>' + i.texto + '</span></div>';
      }).join('') + '</div>';
    }
    var pg = P.pagamentos;
    if (ligado(pg, 'bandeiras')) {
      html += '<div class="pagamentos">' + pg.bandeiras.map(function (b) {
        return img(b.src, b.alt || 'forma de pagamento', '', 'height="30"');
      }).join('') + '</div>';
    }
    html += '</div>';
    return seccao(html, 'class="secao secao--colada" id="comprar"');
  }

  function pintarPreco() {
    var k = KITS[kitAtual], pr = P.preco || {};
    var alvo = $('#blocoPreco');
    if (!alvo) return;
    var html = '';
    if (temTexto(k.de)) html += '<p class="preco__de">' + esc(k.de) + '</p>';
    html += '<p class="preco__linha"><span class="preco__por">' + esc(k.por || pr.por || '') + '</span>' +
      (temTexto(k.desconto) ? '<span class="preco__desconto">' + esc(k.desconto) + '</span>' : '') + '</p>';
    if (temTexto(k.cada)) {
      html += '<p class="preco__cada">' + esc(k.cada) + (temTexto(k.economia) ? ' · economia de ' + esc(k.economia) : '') + '</p>';
    }
    if (temTexto(pr.aVista) || temTexto(k.parcelas)) {
      html += '<p class="preco__pagamento">' +
        (temTexto(pr.aVista) ? '<b>' + esc(pr.aVista) + '</b>' : '') +
        (temTexto(k.parcelas) ? '<span>' + (temTexto(pr.aVista) ? ' · ou ' : '') + esc(k.parcelas) + '</span>' : '') + '</p>';
    }
    alvo.innerHTML = html;

    var sDe = $('#barraFixaDe'), sPor = $('#barraFixaPor');
    if (sDe) { sDe.textContent = k.de || ''; sDe.classList.toggle('oculto', !temTexto(k.de)); }
    if (sPor) sPor.textContent = k.por || '';
    var selo = $('#seloDesconto');
    if (selo && temTexto(k.desconto)) selo.textContent = k.desconto;

    var resumo = $('#ofertaResumo');
    if (resumo) {
      resumo.innerHTML = esc(k.rotulo) + ': ' +
        (temTexto(k.de) ? '<s>' + esc(k.de) + '</s> → ' : '') +
        '<b>' + esc(k.por) + '</b>' + (temTexto((P.preco || {}).aVista) ? ' ' + esc(P.preco.aVista) : '');
    }
  }

  function htmlGrupo(g, indiceUnidade) {
    var selecionado = unidades[indiceUnidade][g.id];
    var colunas = g.colunas || (g.opcoes.length > 2 ? 3 : 2);
    var opcoes = g.opcoes.map(function (o) {
      var marcado = (o.valor === selecionado);
      var attrs = ' role="radio" aria-checked="' + marcado + '"' +
        ' data-unidade="' + indiceUnidade + '" data-grupo="' + esc(g.id) + '" data-valor="' + esc(o.valor) + '"';
      if (g.estilo === 'pilula') return '<button type="button" class="opt-pilula"' + attrs + '>' + esc(o.valor) + '</button>';
      if (g.estilo === 'chip')   return '<button type="button" class="opt-chip"' + attrs + '>' + esc(o.valor) + '</button>';
      if (g.estilo === 'circulo') {
        var dentro = temTexto(o.imagem)
          ? img(o.imagem, o.valor)
          : '<span class="amostra" style="background:' + esc(o.amostra || '#DDD') + '"></span>';
        return '<button type="button" class="opt-circulo"' + attrs + ' aria-label="' + esc(g.titulo + ': ' + o.valor) + '">' + dentro + '</button>';
      }
      return '<button type="button" class="opt-lista"' + attrs + '>' +
        '<span class="kit__marca"><i></i></span><span style="font-weight:700;font-size:14px">' + esc(o.valor) + '</span></button>';
    }).join('');

    var lista = (g.estilo === 'circulo')
      ? '<div class="opcoes opcoes--livre" role="radiogroup" aria-label="' + esc(g.titulo) + '">' + opcoes + '</div>'
      : '<div class="opcoes" role="radiogroup" aria-label="' + esc(g.titulo) + '" style="grid-template-columns:repeat(' + colunas + ',minmax(0,1fr))">' + opcoes + '</div>';

    var guia = (g.guia && ligado(P.medidas, 'linhas'))
      ? '<button type="button" class="grupo__guia" data-abrir-medidas>' + icone('regua', '') + (P.medidas.titulo || 'Guia de medidas') + '</button>'
      : '';

    return '<div class="grupo">' +
      '<div class="grupo__cabeca"><p class="grupo__titulo">' + esc(g.titulo) + ': <strong>' + esc(selecionado) + '</strong></p>' + guia + '</div>' +
      lista + (temTexto(g.obs) ? '<p class="grupo__obs">' + esc(g.obs) + '</p>' : '') + '</div>';
  }

  function htmlKits() {
    if (!ligado(P.kits, 'opcoes') || KITS.length < 2) return '';
    var titulo = P.kits.titulo || 'Quantidade';
    return '<div class="kits">' +
      '<p class="kits__titulo" id="kitsTitulo"><span>' + esc(titulo) + '</span></p>' +
      '<div class="kits__lista" role="radiogroup" aria-labelledby="kitsTitulo">' +
      KITS.map(function (o, i) {
        var m = (i === kitAtual);
        return '<button type="button" class="kit" role="radio" aria-checked="' + m + '" data-kit="' + i + '">' +
          '<span class="kit__marca"><i></i></span>' +
          '<span class="kit__corpo"><span class="kit__nome">' + esc(o.rotulo) +
          (temTexto(o.detalhe) ? ' ' + esc(o.detalhe) : '') + '</span>' +
          (temTexto(o.tag) ? '<span class="kit__tag">' + esc(o.tag) + '</span>' : '') +
          (temTexto(o.economiaTexto) ? '<span class="kit__cada">' + esc(o.economiaTexto) + '</span>' : '') +
          '</span>' +
          '<span class="kit__precos"><span class="kit__por">' + esc(o.por) + '</span>' +
          (temTexto(o.de) ? '<span class="kit__de">' + esc(o.de) + '</span>' : '') + '</span>' +
          '</button>';
      }).join('') + '</div></div>';
  }

  /* --------------------------- configurador: lado → tipo → marca ������� modelo */
  var marcasDoTipo = function (tipo) {
    return Object.keys(CFG.marcas).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); }).filter(function (m) {
      return !tipo || CFG.marcas[m].some(function (c) { return c.tipo === tipo; });
    });
  };
  var modelosDe = function (marca, tipo) {
    return (CFG.marcas[marca] || []).filter(function (c) { return !tipo || c.tipo === tipo; })
      .map(function (c) { return c.nome; })
      .filter(function (nome, i, todos) { return todos.indexOf(nome) === i; });
  };
  var pendencias = function (u) {
    var falta = [];
    if (!u.lado) falta.push('lado');
    if (u.manual) { if (!temTexto(u.manualTexto)) falta.push('carro'); }
    else if (!u.modelo) falta.push(u.marca ? 'modelo' : 'marca');
    if (!u.cor) falta.push('cor');
    return falta;
  };

  var descricaoUnidade = function (u) {
    var carro = u.manual ? u.manualTexto.trim() : [u.marca, u.modelo].filter(Boolean).join(' ');
    return [carro || 'Carro a escolher', u.lado || 'lado a escolher', u.cor ? 'Cor ' + u.cor : 'cor a escolher'].join(' · ');
  };

  function htmlCores(n) {
    var u = unidades[n];
    if (!carroEscolhido(u)) return '';
    var lista = coresDe(u);
    var html = '<p class="config__rotulo" id="cfg-cor-rotulo-' + n + '">Qual a cor do seu carro?</p>' +
      '<div class="config__cores" role="radiogroup" aria-labelledby="cfg-cor-rotulo-' + n + '">' +
      lista.map(function (c) {
        return '<button type="button" class="opt-cor" role="radio" aria-checked="' + (u.cor === c.nome) + '"' +
          ' data-cfg="cor" data-unidade="' + n + '" data-valor="' + esc(c.nome) + '">' +
          '<span class="opt-cor__bolinha" style="background:' + esc(c.hex) + '" aria-hidden="true"></span>' +
          '<span>' + esc(c.nome) + '</span></button>';
      }).join('') + '</div>';
    if (u.cor && !fotoDaCor(u)) {
      html += '<p class="config__nota">A foto não muda de cor, mas seu TURBOGELO será enviado na cor ' + esc(u.cor) +
        '. Quer ver seu modelo nessa cor? Peça uma foto ao suporte pelo WhatsApp.</p>';
    }
    return html;
  }

  function htmlResumoUnidades(qtd) {
    if (qtd < 2) return '';
    var itens = '';
    for (var i = 0; i < qtd; i++) {
      itens += '<li><strong>Unidade ' + (i + 1) + ':</strong> ' + esc(descricaoUnidade(unidades[i])) + '</li>';
    }
    return '<div class="config__resumo" aria-live="polite"><p class="config__resumo-titulo">Resumo do seu kit</p><ul>' + itens + '</ul></div>';
  }

  function htmlConfigurador(n, qtd) {
    var u = unidades[n];
    var botoes = function (campo, lista, rotulo) {
      return '<div class="config__opcoes config__opcoes--' + (lista.length === 2 ? '2' : '3') + '" role="radiogroup" aria-label="' + esc(rotulo) + '">' +
        lista.map(function (v) {
          return '<button type="button" class="opt-caixa" role="radio" aria-checked="' + (u[campo] === v) + '"' +
            ' data-cfg="' + campo + '" data-unidade="' + n + '" data-valor="' + esc(v) + '">' + esc(v) + '</button>';
        }).join('') + '</div>';
    };
    var seletor = function (campo, rotulo, vazio, lista) {
      var id = 'cfg-' + campo + '-' + n;
      return '<label class="config__rotulo" for="' + id + '">' + esc(rotulo) + '</label>' +
        '<div class="config__select' + (u[campo] ? ' preenchido' : '') + '"><select id="' + id + '" data-cfg-select="' + campo + '" data-unidade="' + n + '">' +
        '<option value="">' + esc(vazio) + '</option>' +
        lista.map(function (v) {
          return '<option value="' + esc(v) + '"' + (u[campo] === v ? ' selected' : '') + '>' + esc(v) + '</option>';
        }).join('') + '</select></div>';
    };

    var html = '<div class="config" data-config="' + n + '">';
    if (qtd > 1) html += '<p class="config__unidade">' + (n + 1) + 'º TURBOGELO</p>';
    html += '<p class="config__rotulo">Qual lado do seu carro?</p>' + botoes('lado', CFG.lados, 'Lado do carro');
    html += '<p class="config__rotulo">Qual o tipo?</p>' + botoes('tipo', CFG.tipos, 'Tipo do carro');

    if (u.manual) {
      var idm = 'cfg-manual-' + n;
      html += '<label class="config__rotulo" for="' + idm + '">Seu carro</label>' +
        '<input class="config__campo" id="' + idm + '" type="text" autocomplete="off" maxlength="80" placeholder="Marca, modelo e ano" ' +
        'data-cfg-manual-texto data-unidade="' + n + '" value="' + esc(u.manualTexto) + '">' +
        '<button type="button" class="config__link" data-cfg-manual="0" data-unidade="' + n + '">← Escolher da lista</button>';
    } else {
      html += seletor('marca', 'Marca', 'Selecione ou busque sua marca', marcasDoTipo(u.tipo));
      if (u.marca) html += seletor('modelo', 'Modelo', 'Selecione ou busque seu modelo', modelosDe(u.marca, u.tipo));
      var msgWhats = 'Olá! Não encontrei meu carro na lista do site e quero fazer o pedido do TurboGelo.\n\n' +
        'Kit: ' + qtd + (qtd > 1 ? ' unidades' : ' unidade') + (qtd > 1 ? ' (' + (n + 1) + 'º TurboGelo)' : '') + '\n' +
        'Lado: ' + (u.lado || 'a definir') + '\n' +
        'Tipo: ' + (u.tipo || 'a definir') + '\n' +
        (u.marca ? 'Marca: ' + u.marca + '\n' : '') +
        'Meu carro (marca, modelo e ano): ';
      html += '<a class="config__link whatsapp-clean" href="https://wa.me/5511972233474?text=' + encodeURIComponent(msgWhats) + '" target="_blank" rel="noopener noreferrer">Não encontrou seu carro? Informe manualmente →</a>';
    }
    var foto = fotoDaUnidade(u);
    if (foto) {
      html += '<figure class="config__previa" aria-label="Prévia do modelo escolhido">' +
        img(foto, 'Cooler ' + u.marca + ' ' + u.modelo + ', vista ' + (u.lado || 'Frente').toLowerCase(), '', '', { prioridade: true }) +
        '<figcaption><strong>' + esc(u.marca + ' ' + u.modelo) + '</strong><span>' + esc(u.lado || 'Frente') +
        (u.cor ? ' · ' + esc(u.cor) : '') + '</span></figcaption></figure>';
    }
    html += htmlCores(n);
    html += '<p class="config__erro" role="alert" data-cfg-erro="' + n + '"></p></div>';
    return html;
  }

  function pintarVariacoes() {
    var alvo = $('#blocoVariacoes');
    if (!alvo) return;
    var k = KITS[kitAtual];
    while (unidades.length < k.qtd) unidades.push(padraoUnidade());
    var html = '';
    if (CFG) {
      html += '<div class="configurador">' +
        '<p class="configurador__titulo">Escolha o seu TURBOGELO</p>' +
        (temLista(CFG.instrucoes) ? '<ol class="selector-instructions">' + CFG.instrucoes.map(function (texto) {
          return '<li>' + esc(texto) + '</li>';
        }).join('') + '</ol>' : '');
      for (var c = 0; c < k.qtd; c++) html += htmlConfigurador(c, k.qtd);
      html += htmlResumoUnidades(k.qtd) + '</div>';
    } else if (GRUPOS.length) {
      for (var u = 0; u < k.qtd; u++) {
        if (k.qtd > 1) html += '<p class="unidade-titulo">' + (u + 1) + 'ª unidade</p>';
        html += GRUPOS.map(function (g) { return htmlGrupo(g, u); }).join('');
      }
    }
    html += htmlKits();
    alvo.innerHTML = html;
    alvo.classList.toggle('oculto', html === '');
  }

  /* devolve true se todas as unidades do kit estão completas; senão marca o erro */
  function validarConfigurador() {
    if (!CFG) return true;
    var k = KITS[kitAtual], primeiro = null;
    var nomes = { lado: 'o lado', marca: 'a marca', modelo: 'o modelo', carro: 'o seu carro', cor: 'a cor do carro' };
    for (var i = 0; i < k.qtd; i++) {
      var falta = pendencias(unidades[i]);
      var caixa = $('[data-cfg-erro="' + i + '"]');
      if (caixa) caixa.textContent = falta.length ? 'Escolha ' + falta.map(function (f) { return nomes[f]; }).join(' e ') + '.' : '';
      if (falta.length && !primeiro) primeiro = $('[data-config="' + i + '"]');
    }
    if (primeiro) { primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' }); return false; }
    return true;
  }

  function pintarBrinde() {
    var alvo = $('#blocoBrinde');
    if (!alvo) return;
    var b = P.brinde;
    if (!b || !temTexto(b.titulo)) { alvo.innerHTML = ''; return; }
    alvo.innerHTML = '<div class="brinde">' + img(b.imagem, b.titulo) +
      '<p><b>' + icone('presente', '') + 'Brinde:</b> ' + esc(b.titulo) +
      (temTexto(b.sub) ? ' <span>' + esc(b.sub) + '</span>' : '') + '</p></div>';
  }

  /* ------------------------------------------------------- 5. urgência */
  function pintarUrgencia() {
    var alvos = $$('[data-urgencia]');
    var u = P.urgencia;
    if (!u || !u.ativo || u.modo !== 'prazoFixo' || !temTexto(u.terminaEm)) {
      alvos.forEach(function (a) { var s = a.closest('[data-bloco-urgencia]') || a; s.remove(); });
      return;
    }
    var fim = new Date(u.terminaEm).getTime();
    if (isNaN(fim)) { alvos.forEach(function (a) { a.remove(); }); return; }

    function tick() {
      var resta = fim - Date.now();
      if (resta <= 0) {
        $$('[data-urgencia]').forEach(function (a) {
          var caixa = a.closest('[data-bloco-urgencia]') || a;
          if (temTexto(u.textoEncerrado)) caixa.textContent = u.textoEncerrado; else caixa.remove();
        });
        clearInterval(timer);
        return;
      }
      var s = Math.floor(resta / 1000);
      var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
      var txt = (d > 0 ? d + 'd ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(seg).padStart(2, '0');
      $$('[data-urgencia]').forEach(function (a) { a.textContent = txt; });
    }
    var timer = setInterval(tick, 1000);
    tick();
  }
  var htmlPrazo = function () {
    var u = P.urgencia;
    if (!u || !u.ativo || !temTexto(u.terminaEm)) return '';
    return '<p class="cta-nota" data-bloco-urgencia>' + icone('relogio') +
      esc(u.texto || 'Termina em') + ' <b data-urgencia>—</b></p>';
  };

  /* ------------------------------------------- 6..n demais seções */
  // cabeçalho de seção na linguagem dos criativos: rótulo ciano + título
  // condensado em duas linhas (preto / ciano) + subtítulo opcional
  function cabecaSecao(o, padrao) {
    if (!o) return '';
    var titulo = temTexto(o.titulo) ? o.titulo : (padrao || '');
    if (!temTexto(titulo) && !temTexto(o.destaque) && !temTexto(o.rotulo)) return '';
    return '<header class="cabeca-secao">' +
      (temTexto(o.rotulo) ? '<p class="rotulo-secao">' + esc(o.rotulo) + '</p>' : '') +
      ((temTexto(titulo) || temTexto(o.destaque))
        ? '<h2 class="titulo-secao">' + esc(titulo) +
          (temTexto(o.destaque) ? ' <span class="realce">' + esc(o.destaque) + '</span>' : '') + '</h2>'
        : '') +
      (temTexto(o.sub) ? '<p class="sub-secao">' + esc(o.sub) + '</p>' : '') +
      '</header>';
  }

  function blocoBeneficios() {
    var b = P.beneficios;
    if (!ligado(b, 'itens')) return '';
    return seccao(cabecaSecao(b) +
      '<div class="grade-beneficios">' + b.itens.map(function (i) {
        var arte = i.imagem
          ? '<img src="' + esc(i.imagem) + '" alt="" width="64" height="64" loading="lazy" decoding="async">'
          : icone(i.icone || 'check');
        return '<article class="beneficio"><span class="bolha' + (i.imagem ? ' bolha--arte' : '') + '">' + arte + '</span>' +
          '<h3>' + esc(i.titulo) + '</h3><p>' + esc(i.desc) + '</p></article>';
      }).join('') + '</div>', 'class="secao secao--beneficios"');
  }

  function blocoDescricao() {
    var d = P.descricao;
    if (!d || d.ativo === false || !temTexto(d.texto)) return '';
    return seccao('<div class="cartao descricao">' +
      (temTexto(d.titulo) ? '<h2 class="titulo-secao">' + esc(d.titulo) + '</h2>' : '') +
      '<p>' + esc(d.texto) + '</p>' +
      (d.cta ? cta(P.ctas && P.ctas.principal) : '') + '</div>', 'class="secao"');
  }

  function blocoMini() {
    var m = P.miniFeatures;
    if (!ligado(m, 'itens')) return '';
    return seccao('<div class="mini">' + m.itens.map(function (i) {
      return '<figure>' + img(i.img, i.legenda) + '<figcaption>' + esc(i.legenda) + '</figcaption></figure>';
    }).join('') + '</div>', 'class="secao"');
  }

  function tabelaMedidas() {
    var m = P.medidas;
    var cols = m.colunas || ['', ''];
    return '<table class="tabela"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + m.linhas.map(function (l) {
        return '<tr>' + l.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
  }

  function blocoPassos() {
    var p = P.passos, m = P.medidas;
    var temPassos = ligado(p, 'itens'), temMedidas = ligado(m, 'linhas');
    if (!temPassos && !temMedidas) return '';
    var html = temPassos ? cabecaSecao(p) : '';
    html += '<div class="cartao cartao--passos">';
    if (temPassos) {
      html += '<details class="passos-expansiveis ficha-expansivel"><summary aria-expanded="false">Veja as etapas do pedido <span aria-hidden="true">+</span></summary><ol class="passos">' + p.itens.map(function (i, n) {
        var marca = i.imagem
          ? '<div class="passo__arte"><img src="' + esc(i.imagem) + '" alt="" width="64" height="64" loading="lazy" decoding="async"><span class="passo__num">' + (n + 1) + '</span></div>'
          : '<div class="passo__n">' + (n + 1) + '</div>';
        return '<li class="passo">' + marca +
          '<div><h3>' + esc(i.titulo) + '</h3><p>' + esc(i.desc) + '</p></div></li>';
      }).join('') + '</ol></details>';
    }
    if (temMedidas) {
      html += '<div class="medidas"><p class="medidas__titulo">' + icone('regua', '') + esc(m.titulo || 'Guia de medidas') + '</p>' +
        tabelaMedidas() + '</div>';
    }
    return seccao(html + '</div>', 'class="secao secao--passos" id="como-funciona"');
  }

  function blocoDemonstracao() {
    var d = P.demonstracao;
    if (!d || d.ativo === false || (!temTexto(d.video) && !temTexto(d.poster))) return '';
    var media = temTexto(d.video)
      ? '<video controls class="demonstracao__video" autoplay muted loop playsinline preload="metadata" width="' + d.largura + '" height="' + d.altura + '" poster="' + esc(d.poster || '') + '" aria-label="Vídeo de demonstração do cooler"><source src="' + esc(d.video) + '" type="video/mp4"></video>'
      : '<img class="demonstracao__video" src="' + esc(d.poster) + '" alt="Cooler TURBOGELO em uso e seus detalhes" width="' + (d.largura || 640) + '" height="' + (d.altura || 640) + '" loading="lazy" decoding="async">';
    return seccao(cabecaSecao(d) + '<div class="demonstracao__conteudo">' + media + '</div>', 'class="secao secao--demonstracao" id="veja-em-acao"');
  }

  function blocoDetalhesVisuais() {
    var d = P.detalhesVisuais;
    if (!ligado(d, 'imagens')) return '';
    return seccao(cabecaSecao(d) +
      '<div class="detalhes-visuais">' + d.imagens.map(function (i, n) {
        var dimensoes = i.largura && i.altura ? 'width="' + i.largura + '" height="' + i.altura + '"' : '';
        var imagem = i.tipo === 'video' ?
    '<video controls class="demonstracao__video" autoplay playsinline loop muted preload="metadata" ' + dimensoes +
    ' poster="' + esc(i.poster || '') + '" aria-label="' + esc(i.alt || 'Vídeo do produto') + '">' +
    '<source src="' + esc(i.src) + '" type="video/mp4">Seu navegador não reproduz este vídeo. ' +
    '<a href="' + esc(i.src) + '">Abrir vídeo do cooler</a>.</video>' :
    img(i.src, i.alt || 'detalhe do produto', '', dimensoes);
        if (i.destino) imagem = '<a href="' + esc(i.destino) + '" aria-label="Escolher meu modelo de cooler">' + imagem + '</a>';
        return (n === 6 ? '</div><a href="#comprar" class="btn-cta-mid"><span aria-hidden="true">🔥</span><span>QUERO O MEU TURBOGELO</span><span aria-hidden="true">→</span></a><div class="detalhes-visuais">' : '') +
          '<figure class="peca' + (i.tipo === 'video' ? ' peca--video' : '') + '">' + imagem +
          (i.tipo !== 'video' ? '<figcaption class="peca__legenda">' + esc(i.legenda || i.alt || 'Detalhes do produto') + '</figcaption>' : '') + '</figure>';
      }).join('') + '</div>', 'class="secao secao--sequencia" id="detalhes"');
  }

  function blocoStorytelling() {
    var s = P.storytelling;
    if (!s || s.ativo === false || !temTexto(s.imagem)) return '';
    var figura = '<img src="' + esc(s.imagem) + '" alt="' + esc(s.alt || '') + '" class="storytelling__img"' +
      ' width="' + (s.largura || 612) + '" height="' + (s.altura || 704) + '"' +
      ' loading="eager" fetchpriority="high" decoding="async" data-imagem>';
    var destino = temTexto(s.destino) ? s.destino : '#preco-cta';
    return seccao('<a class="storytelling__link" href="' + esc(destino) + '" aria-label="Ver o preço do TURBOGELO">' +
      figura + '</a>', 'class="secao secao--storytelling" id="storytelling-momento"');
  }

  function blocoSpecs() {
    var e = P.especificacoes, d = P.detalhes;
    var temE = ligado(e, 'itens'), temD = ligado(d, 'itens');
    if (!temE && !temD) return '';
    var html = temE ? cabecaSecao(e, 'Especificações') : '';
    html += '<div class="specs-grade">';
    if (temE) {
      html += '<details class="cartao ficha-expansivel"><summary aria-expanded="false">Ficha técnica <span aria-hidden="true">+</span></summary><dl class="specs">' + e.itens.map(function (par) {
          return '<div><dt>' + esc(par[0]) + '</dt><dd>' + esc(par[1]) + '</dd></div>';
        }).join('') + '</dl></details>';
    }
    if (temD) {
      html += '<div class="sanfona">' + d.itens.map(function (i, n) {
        return '<details' + (n === 0 && d.primeiroAberto ? ' open' : '') + '><summary>' + esc(i.t) +
          '<span class="chev" aria-hidden="true">⌄</span></summary><div class="conteudo">' + esc(i.c) + '</div></details>';
      }).join('') + '</div>';
    }
    return seccao(html + '</div>', 'class="secao secao--specs" id="ficha"');
  }

  function blocoComparacao() {
    var c = P.comparacao;
    if (!ligado(c, 'linhas')) return '';
    var ok = '<svg viewBox="0 0 20 20" width="20" height="20" aria-label="sim"><circle cx="10" cy="10" r="10" fill="#DCFCE7"/><path d="M5.8 10.4l2.6 2.6L14.2 7.2" fill="none" stroke="var(--c-ok)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var nao = '<svg viewBox="0 0 20 20" width="20" height="20" aria-label="não"><circle cx="10" cy="10" r="10" fill="#FEE2E2"/><path d="M7 7l6 6M13 7l-6 6" stroke="var(--c-nao)" stroke-width="2" stroke-linecap="round"/></svg>';
    return seccao((temTexto(c.titulo) ? '<h2 class="titulo-secao centro">' + esc(c.titulo) + '</h2>' : '') +
      (temTexto(c.sub) ? '<p class="sub-secao centro">' + esc(c.sub) + '</p>' : '') +
      '<div class="comparacao" style="margin-top:12px"><table><thead><tr><th>Recurso</th>' +
      '<th class="col-a">' + esc(c.colA) + '</th><th class="col-b">' + esc(c.colB) + '</th></tr></thead><tbody>' +
      c.linhas.map(function (l) {
        return '<tr><td>' + esc(l) + '</td><td>' + ok + '</td><td>' + nao + '</td></tr>';
      }).join('') + '</tbody></table></div>', 'class="secao"');
  }

  function blocoOferta() {
    var o = P.oferta;
    if (!o || o.ativo === false) return '';
    var prazo = htmlPrazo();
    var resumo = o.mostrarResumoDePreco ? '<p class="oferta__resumo" id="ofertaResumo"></p>' : '';
    var botao = cta(P.ctas && (P.ctas.oferta || P.ctas.principal));
    if (!prazo && !resumo && !botao) return '';
    return seccao('<div class="oferta">' + cabecaSecao(o) +
      (prazo ? prazo.replace('cta-nota', 'oferta__prazo') : '') + resumo + botao + '</div>', 'class="secao" id="preco-cta"');
  }

  function blocoUsos() {
    var u = P.usos;
    if (!ligado(u, 'itens')) return '';
    return seccao(cabecaSecao(u) +
      '<div class="grade-usos">' + u.itens.map(function (i) {
        return '<div class="uso">' + icone(i.icone || 'check') + '<span>' + esc(i.texto) + '</span></div>';
      }).join('') + '</div>', 'class="secao secao--usos"');
  }

  // avaliações reais: a seção é preenchida por avaliacoes.js a partir de /api/avaliacoes
  function blocoProva() {
    if (!P.prova || P.prova.ativo === false) return '';
    return seccao(
      '<div class="reviews__heading"><h2 id="reviews-title">Avaliações</h2><span>TURBOGELO</span></div>' +
      MicroSocialProof(P.avaliacaoResumo) +
      '<div class="av" data-avaliacoes aria-busy="true"><p class="av__estado" role="status">Carregando avaliações��</p></div>',
      'class="secao secao--reviews" id="avaliacoes" aria-labelledby="reviews-title"');
  }

  function blocoFaq() {
    var f = P.faq;
    if (!ligado(f, 'itens')) return '';
    return seccao(cabecaSecao(f, 'Perguntas Frequentes') +
      '<div class="sanfona">' + f.itens.map(function (i) {
        return '<details><summary>' + esc(i.q) + '<span class="chev" aria-hidden="true">⌄</span></summary>' +
          '<div class="conteudo">' + esc(i.a) + '</div></details>';
      }).join('') + '</div>', 'class="secao" id="faq"');
  }

  /* ------------------------------------------------------------ rodapé */
  function montarRodape() {
    var r = P.rodape, m = P.marca || {}, c = P.contato || {}, nav = P.navegacao || {}, emp = P.empresa || {};
    if (!r || r.ativo === false) return;
    if (r.colunas) return montarRodapeInstitucional(r, m);
    var html = img(m.logo, m.alt || m.nome, 'rodape__logo', 'height="24"');
    if (temTexto(c.email)) {
      html += '<div class="rodape__bloco"><p class="t">Atendimento ao cliente</p>' +
        '<p><a href="mailto:' + esc(c.email) + '" style="text-decoration:underline">' + esc(c.email) + '</a></p>' +
        (temTexto(c.horario) ? '<p class="ap">' + esc(c.horario) + '</p>' : '') + '</div>';
    }
    if (nav.rastreio && nav.rastreio.ativo && temTexto(nav.rastreio.href)) {
      html += '<a class="botao-secundario" href="' + esc(nav.rastreio.href) + '">' + icone('caminhao', '') + esc(nav.rastreio.rotulo || 'Rastrear pedido') + '</a>' +
        (temTexto(nav.rastreio.legenda) ? '<p class="centro ap" style="font-size:12px;margin-top:8px">' + esc(nav.rastreio.legenda) + '</p>' : '');
    }
    var links = [].concat(nav.politicas || [], nav.institucional || []);
    if (links.length) {
      html += '<div class="rodape__links">' + links.map(function (l) {
        return '<a href="' + esc(l.href) + '">' + esc(l.rotulo) + '</a>';
      }).join('') + '</div>';
    }
    if (r.avisoOficial && r.avisoOficial.ativo && temTexto(r.avisoOficial.texto)) {
      html += '<div class="rodape__nota">' + icone('cadeado') + '<p>' + esc(r.avisoOficial.texto) + '</p></div>';
    }
    var dados = [emp.razaoSocial, emp.cnpj ? 'CNPJ ' + emp.cnpj : '', emp.endereco].filter(temTexto);
    html += '<div class="rodape__empresa">' +
      (temTexto(m.nome) ? '<p class="marca">' + esc(m.nome) + '</p>' : '') +
      dados.map(function (d) { return '<p>' + esc(d) + '</p>'; }).join('') +
      (temTexto(r.copyright)
        ? '<p style="margin-top:8px">' + esc(r.copyright.replace('{ano}', new Date().getFullYear()).replace('{marca}', m.nome || '')) + '</p>'
        : '') + '</div>';
    var el = $('#rodape');
    el.innerHTML = html;
    el.hidden = false;
  }

  function montarRodapeInstitucional(r, m) {
    var ano = new Date().getFullYear();
    var semQuebra = function (t) { return '<span class="rf__nowrap">' + esc(t) + '</span>'; };
    var item = function (i) {
      if (i.somenteTexto) return '<li><span>' + esc(i.rotulo) + '</span></li>';
      if (!i.href) {
        return '<li><span class="rf__pendente" title="Pendente: ' + esc(i.pendente || '') + '">' + esc(i.rotulo) +
          ' <small>Em breve</small></span></li>';
      }
      var ext = i.externo ? ' target="_blank" rel="noopener noreferrer"' : '';
      var whatsappClass = /^https:\/\/wa\.me\//.test(i.href) ? ' class="whatsapp-clean"' : '';
      return '<li><a href="' + esc(i.href) + '"' + whatsappClass + ext + '>' + esc(i.rotulo) + '</a></li>';
    };
    var html = '<div class="rf__inner">' +
      '<div class="rf__marca">' + img(r.logo || m.logo, m.alt || m.nome, 'rf__logo', 'width="300" height="49"') +
      (temTexto(r.slogan) ? '<p class="rf__slogan">' + esc(r.slogan) + '</p>' : '') +
      (temTexto(r.descricao) ? '<p class="rf__desc">' + esc(r.descricao) + '</p>' : '') + '</div>' +
      '<nav class="rf__colunas" aria-label="Rodapé">' + r.colunas.map(function (col) {
        return '<details class="rf__coluna"><summary class="rf__titulo" aria-expanded="false">' + esc(col.titulo) + '</summary><ul>' +
          col.itens.map(item).join('') + '</ul></details>';
      }).join('') + '</nav></div>';

    var pg = r.pagamentos;
    if (pg && pg.bandeiras && pg.bandeiras.length) {
      html += '<div class="rf__pagamentos"><div class="rf__inner">' +
        '<h2 class="rf__titulo">' + esc(pg.titulo || 'Formas de pagamento') + '</h2>' +
        '<ul class="rf__bandeiras">' + pg.bandeiras.map(function (b) {
          return '<li>' + img(b.src, b.alt, '', 'height="40"') + '</li>';
        }).join('') + '</ul>' +
        (temTexto(pg.nota) ? '<p class="rf__nota">' + esc(pg.nota) + '</p>' : '') + '</div></div>';
    }

    var lg = r.legal || {};
    html += '<div class="rf__inner rf__legal">' +
      (temTexto(lg.linha) ? lg.linha.split(' · ').map(function (t) { return '<p class="rf__linha">' + esc(t) + '</p>'; }).join('') : '') +
      (lg.endereco ? '<address class="rf__endereco">' + lg.endereco.map(esc).join('<span aria-hidden="true"> · </span>') + '</address>' : '') +
      (lg.contato ? '<p class="rf__endereco">' + lg.contato.map(semQuebra).join('<span aria-hidden="true"> · </span>') + '</p>' : '') +
      '<div class="rf__base">' +
      (temTexto(r.copyright) ? '<p>' + r.copyright.replace('{ano}', ano).replace('{marca}', m.nome || '').split(' · ').map(semQuebra).join('<span aria-hidden="true"> · </span>') + '</p>' : '') +
      (temTexto(r.aviso) ? '<p>' + esc(r.aviso) + '</p>' : '') + '</div>';

    var dados = r.dadosEmpresa || {};
    var linhasEmpresa = [
      [ 'Nome empresarial', dados.nomeEmpresarial ],
      [ 'CNPJ', dados.cnpj ],
      [ 'E-mail de suporte', dados.emailSuporte ],
      [ 'WhatsApp de suporte', dados.whatsappSuporte ],
    ].filter(function (linha) { return temTexto(linha[1]); });
    if (linhasEmpresa.length) {
      html += '<div class="rf__dados-empresa" aria-label="Dados da empresa e suporte">' +
        linhasEmpresa.map(function (linha) {
          return '<p>' + esc(linha[0]) + ': ' + esc(linha[1]) + '</p>';
        }).join('') + '</div>';
    }
    html += '</div>';

    var el = $('#rodape');
    el.classList.add('rf');
    el.classList.remove('coluna');
    el.innerHTML = html;
    el.hidden = false;
  }

  /* ------------------------------------------------------- barra fixa */
  function montarBarraFixa() {
    var b = P.barraFixa;
    var texto = P.ctas && (P.ctas.barraFixa || P.ctas.principal);
    if (!b || b.ativo === false || !temTexto(texto)) { document.body.classList.add('sem-barra-fixa'); return; }
    var el = $('#barraFixa');
    el.innerHTML = '<div class="barra-fixa__corpo coluna">' +
      '<div class="barra-fixa__preco"><div class="barra-fixa__de" id="barraFixaDe"></div>' +
      '<div class="barra-fixa__por" id="barraFixaPor"></div></div>' +
      '<button type="button" class="cta" data-comprar>' + esc(texto) + '</button></div>';
    el.hidden = false;
    el.classList.add('visivel');
  }

  /* ------------------------------------------------------------- modal */
  function montarModal() {
    if (!ligado(P.medidas, 'linhas')) return;
    var m = P.medidas;
    var el = $('#modal');
    el.innerHTML = '<div class="modal__fundo" data-fechar-modal></div>' +
      '<div class="modal__painel" role="dialog" aria-modal="true" aria-labelledby="tituloModal">' +
      '<div class="modal__cabeca"><h2 class="titulo-secao" id="tituloModal">' + esc(m.titulo || 'Guia de medidas') + '</h2>' +
      '<button class="modal__fechar" data-fechar-modal aria-label="Fechar">✕</button></div>' +
      tabelaMedidas() +
      (temTexto(m.nota) ? '<p class="modal__nota">' + esc(m.nota) + '</p>' : '') + '</div>';

    var ultimoFoco = null;
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-abrir-medidas]')) {
        ultimoFoco = e.target.closest('[data-abrir-medidas]');
        el.hidden = false; document.body.classList.add('travado');
        $('.modal__fechar', el).focus();
        return;
      }
      if (e.target.closest('[data-fechar-modal]')) fecharModal();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !el.hidden) fecharModal(); });
    function fecharModal() {
      el.hidden = true; document.body.classList.remove('travado');
      if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
    }
  }

  /* ------------------------------------------------------------ montar */
  // narrativa: produto + compra → por quê → a sequência oficial → como funciona
  // → ficha técnica → usos → prova → oferta final → dúvidas
  $('#pagina').innerHTML = [
    '<div class="hero">' + blocoGaleria() + blocoCompra() + '</div>',
    blocoBeneficios(),
    blocoDemonstracao(),
    blocoDescricao(),
    blocoMini(),
    blocoDetalhesVisuais(),
      blocoStorytelling(),
      blocoProva(),

    blocoPassos(),
    blocoSpecs(),
    blocoComparacao(),
    blocoUsos(),
    blocoOferta(),
    blocoFaq(),
  ].filter(function (h) { return h && h.indexOf('><') !== 0; }).join('');

  // remove seções que ficaram sem conteúdo útil (ex.: CTA solto sem texto)
  $$('#pagina > section').forEach(function (s) { if (s.textContent.trim() === '' && !s.querySelector('img,svg')) s.remove(); });

  var ctaMid = $('.btn-cta-mid');
  if (ctaMid) ctaMid.addEventListener('click', function () {
    try {
      if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        window.dataLayer.push({ event: 'cta_mid_click', cta_location: 'detalhes', destination: '#comprar' });
      }
    } catch (_) { /* Analytics indisponível não deve impedir a navegação. */ }
  });

  ativarGaleria();
  pintarPreco();
  pintarVariacoes();
  pintarBrinde();
  montarRodape();
  montarBarraFixa();
  montarModal();
  pintarUrgencia();
  pintarPreco();   // segunda passada: agora a barra fixa já existe

  var telaDesktop = window.matchMedia('(min-width: 960px)');
  $$('.detalhes-extras, .ficha-expansivel, .rf__coluna').forEach(function (el) {
    el.open = telaDesktop.matches;
    telaDesktop.addEventListener('change', function (evento) { el.open = evento.matches; });
    function sincronizar() { el.querySelector('summary').setAttribute('aria-expanded', String(el.open)); }
    sincronizar();
    el.addEventListener('toggle', sincronizar);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      document.body.classList.toggle('teclado-aberto', window.innerHeight - window.visualViewport.height > 150);
    });
  }

  var videos = $$('.demonstracao__video');
  function reproduzirVisiveis() {
    videos.forEach(function (video) {
      var r = video.getBoundingClientRect();
      var visivel = !document.hidden && r.bottom > 0 && r.top < window.innerHeight &&
        Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0) >= Math.min(r.height * 0.15, 100);
      if (!visivel) { video.pause(); return; }
      if (!video.paused || video.dataset.iniciando) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.dataset.iniciando = '1';
      var inicio = video.play();
      if (inicio && inicio.then) {
        inicio.then(function () { video.controls = true; }).catch(function () {
          video.controls = true;
        }).finally(function () { delete video.dataset.iniciando; });
      } else { delete video.dataset.iniciando; }
    });
  }
  videos.forEach(function (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.addEventListener('loadeddata', reproduzirVisiveis);
    video.addEventListener('canplay', reproduzirVisiveis);
    video.addEventListener('playing', function () { video.controls = true; });
  });
  if ('IntersectionObserver' in window) {
    var observadorVideos = new IntersectionObserver(reproduzirVisiveis, { threshold: [0, 0.15, 0.5] });
    videos.forEach(function (video) { observadorVideos.observe(video); });
  } else { window.addEventListener('scroll', reproduzirVisiveis, { passive: true }); }
  document.addEventListener('visibilitychange', reproduzirVisiveis);
  document.addEventListener('touchend', reproduzirVisiveis, { passive: true });
  document.addEventListener('click', reproduzirVisiveis);
  reproduzirVisiveis();

  // entrada suave das seções e das peças da sequência ao rolar
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visto'); observador.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('#pagina > .secao:not(.secao--sequencia):not(.secao--storytelling), .peca, .beneficio, .uso').forEach(function (el) {
      el.classList.add('revelar');
      observador.observe(el);
    });
  }

  /* Caminho da foto segue a pasta enviada: img/carros/TIPO/Marca/Modelo/frente.png */
  var PASTA_TIPO = { 'Picape': 'PICAPE', 'SUV': 'SUV', 'Sedã': 'SEDAN', 'Hatch': 'Hatch', 'Esportivo / Coupé': 'ESPORTIVO', 'Conversível': 'CONVERSIVEL' };
  function fotoDaUnidade(u) {
    if (!CFG || !u || u.manual || !u.marca || !u.modelo) return null;
    var carros = CFG.marcas[u.marca] || [];
    var carro = carros.find(function (c) { return c.nome === u.modelo && (!u.tipo || c.tipo === u.tipo); }) ||
      carros.find(function (c) { return c.nome === u.modelo; });
    if (!carro) return null;
    var real = fotoDaCor(u);
    if (real) return real;
    var lado = u.lado === 'Traseira' ? 'traseira' : 'frente';
    if (carro.fotos && carro.fotos[lado]) return carro.fotos[lado];
    if (carro.pasta && carro.pasta.indexOf('/') !== -1) {
      return (CFG.pastaFotos || 'img/carros') + '/' +
        carro.pasta.normalize('NFC').split('/').map(encodeURIComponent).join('/') + '/' + lado + '.webp';
    }
    var pastaTipo = (CFG.pastasTipo && CFG.pastasTipo[carro.tipo]) || PASTA_TIPO[carro.tipo];
    if (!pastaTipo) return null;
    return [CFG.pastaFotos || 'img/carros', pastaTipo, u.marca, carro.pasta || carro.nome]
      .map(function (p, i) { return i === 0 ? p : encodeURIComponent(p); }).join('/') + '/' + lado + '.webp';
  }
  function atualizarFotoCarro(rolar, indice) {
    if (!window.__fotosDosCarros) return;
    var fotos = unidades.slice(0, KITS[kitAtual].qtd).map(function (u, i) {
      var src = fotoDaUnidade(u);
      return src ? {
        src: src,
        alt: 'Cooler TURBOGELO ' + u.marca + ' ' + u.modelo + ', vista ' + (u.lado || 'Frente').toLowerCase() + ' — ' + (i + 1) + 'ª unidade',
        unidade: i,
      } : null;
    }).filter(Boolean);
    window.__fotosDosCarros(fotos, rolar, indice || 0);
  }

  var cancelarRolagemModelo = null;
  function mostrarModeloEscolhido(indice) {
    if (cancelarRolagemModelo) cancelarRolagemModelo();
    var config = $('[data-config="' + indice + '"]');
    var previa = config && $('.config__previa', config);
    var modelo = config && $('label[for="cfg-modelo-' + indice + '"]', config);
    if (!previa || !modelo) return;

    var inicio = window.scrollY;
    var comeco = null;
    var quadro;
    var duracao = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;
    var impedirGesto = function (evento) {
      // Um gesto ainda ativo pode cancelar a rolagem nativa no celular.
      if (evento.cancelable) evento.preventDefault();
    };
    var limpar = function () {
      cancelAnimationFrame(quadro);
      document.removeEventListener('touchmove', impedirGesto);
      cancelarRolagemModelo = null;
    };
    cancelarRolagemModelo = limpar;
    document.addEventListener('touchmove', impedirGesto, { passive: false });
    var animar = function (agora) {
      if (!modelo.isConnected) { limpar(); return; }
      if (comeco === null) comeco = agora;
      var topo = $('.topo');
      var faixa = $('.urgency-banner');
      var recuo = Math.max(0, topo ? topo.getBoundingClientRect().bottom : 0) +
        (faixa ? faixa.getBoundingClientRect().height : 0) + 12;
      var destino = Math.max(0, modelo.getBoundingClientRect().top + window.scrollY - recuo);
      var progresso = duracao ? Math.min(1, (agora - comeco) / duracao) : 1;
      var suavidade = 1 - Math.pow(1 - progresso, 3);
      window.scrollTo({ top: inicio + (destino - inicio) * suavidade, behavior: 'instant' });
      if (progresso < 1) quadro = requestAnimationFrame(animar);
      else limpar();
    };
    quadro = requestAnimationFrame(animar);
  }

  /* --------------------------------------------------------- interações */
  document.addEventListener('click', function (e) {
    var kit = e.target.closest('[data-kit]');
    if (kit) {
      kitAtual = +kit.dataset.kit;
      pintarPreco(); pintarVariacoes();
      atualizarFotoCarro();
      return;
    }
    var cfg = e.target.closest('[data-cfg]');
    if (cfg) {
      var un = unidades[+cfg.dataset.unidade], campo = cfg.dataset.cfg;
      un[campo] = cfg.dataset.valor;
      if (campo === 'tipo' && un.marca && marcasDoTipo(un.tipo).indexOf(un.marca) === -1) { un.marca = ''; un.modelo = ''; }
      if (campo === 'tipo' && un.modelo && modelosDe(un.marca, un.tipo).indexOf(un.modelo) === -1) un.modelo = '';
      ajustarCor(un);
      pintarVariacoes();
      atualizarFotoCarro(false, +cfg.dataset.unidade);
      if (campo === 'cor') {
        var foco = $('[data-cfg="cor"][data-unidade="' + cfg.dataset.unidade + '"][aria-checked="true"]');
        if (foco) foco.focus();
        var erro = $('[data-cfg-erro="' + cfg.dataset.unidade + '"]');
        if (erro && erro.textContent) validarConfigurador();
      }
      return;
    }
    var manual = e.target.closest('[data-cfg-manual]');
    if (manual) {
      var n = +manual.dataset.unidade;
      unidades[n].manual = manual.dataset.cfgManual === '1';
      ajustarCor(unidades[n]);
      pintarVariacoes();
      atualizarFotoCarro();
      var campoManual = $('#cfg-manual-' + n);
      if (campoManual) campoManual.focus();
      return;
    }
    var opt = e.target.closest('[data-grupo]');
    if (opt) {
      var u = +opt.dataset.unidade, id = opt.dataset.grupo, valor = opt.dataset.valor;
      unidades[u][id] = valor;
      pintarVariacoes();
      var g = GRUPOS.find(function (x) { return x.id === id; });
      if (u === 0 && g && g.imagensDaGaleria && g.imagensDaGaleria[valor] && window.__irParaImagem) {
        window.__irParaImagem(g.imagensDaGaleria[valor], true);
      }
      return;
    }
    var botao = e.target.closest('[data-comprar]');
    if (botao) {
      if (!validarConfigurador()) return;
      var pedido = pedidoAtual();
      if (botao.dataset.acao === 'carrinho') pedido.acao = 'carrinho';
      window.CHECKOUT.iniciar(botao, pedido, P.checkout || {}, mostrarRecado);
    }
  });

  document.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-cfg-select]');
    if (!sel) return;
    var un = unidades[+sel.dataset.unidade];
    un[sel.dataset.cfgSelect] = sel.value;
    if (sel.dataset.cfgSelect === 'marca') un.modelo = '';
    ajustarCor(un);
    pintarVariacoes();
    atualizarFotoCarro(false, +sel.dataset.unidade);
    var proximo = sel.dataset.cfgSelect === 'marca' && sel.value ? $('#cfg-modelo-' + sel.dataset.unidade) : null;
    if (proximo) proximo.focus();
    if (sel.dataset.cfgSelect === 'modelo' && sel.value) mostrarModeloEscolhido(+sel.dataset.unidade);
  });

  document.addEventListener('input', function (e) {
    var campo = e.target.closest('[data-cfg-manual-texto]');
    if (campo) unidades[+campo.dataset.unidade].manualTexto = campo.value;
  });

  /* Aviso do checkout. Em modo demo deixa explícito que NADA foi comprado. */
  function mostrarRecado(tipo, texto, pedido) {
    var alvo = $('#recadoCheckout');
    if (!alvo) return;
    var resumo = pedido
      ? '<br><span style="color:var(--c-apoio)">Seleção atual: ' + esc(pedido.kit) + ' — ' +
        esc(pedido.unidades.map(function (u, i) {
          return (pedido.unidades.length > 1 ? (i + 1) + 'ª: ' : '') +
            Object.keys(u).map(function (k) { return u[k]; }).join(' / ');
        }).join(' | ') || '—') + '</span>'
      : '';
    alvo.innerHTML = '<div class="recado' + (tipo === 'erro' ? ' recado--erro' : '') + '" role="status">' +
      '<b>' + (tipo === 'erro' ? 'Não foi possível abrir o pagamento' : 'Modo demonstração') + '</b>' +
      texto + resumo + '</div>';
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
