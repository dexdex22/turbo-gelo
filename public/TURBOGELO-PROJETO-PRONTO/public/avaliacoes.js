(function () {
  'use strict';

  var raiz = document.querySelector('[data-avaliacoes]');
  if (!raiz) return;

  var estado = { filtro: 'todas', ordem: 'destaques', pagina: 1, itens: [], ids: {}, temMais: false, carregando: false, resumo: null, galeria: [] };
  var pedidoAtual = 0;
  var limiteVisivel = 4;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var ESTRELA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96z"/></svg>';
  function estrelas(n, rotulo) {
    var h = '';
    for (var i = 1; i <= 5; i++) h += '<span' + (i > n ? ' class="vazia"' : '') + '>' + ESTRELA + '</span>';
    return '<span class="estrelas" role="img" aria-label="' + esc(rotulo || (n + ' de 5 estrelas')) + '">' + h + '</span>';
  }
  function media(n) { return n.toFixed(1).replace('.', ','); }
  function data(iso) {
    try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function buscar(params) {
    var q = new URLSearchParams(params).toString();
    return fetch('/api/avaliacoes?' + q, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------------- render */
  function htmlResumo() {
    var r = estado.resumo;
    if (!r.comNota) return '<div class="av__resumo"><p class="av__media-q">' + r.total + ' avaliações' + (r.comFotos ? ' · ' + r.comFotos + ' com fotos' : '') + '</p></div>';
    var barras = ['5', '4', '3', '2', '1'].map(function (n) {
      var q = r.distribuicao[n] || 0;
      var pct = r.comNota ? Math.round((q / r.comNota) * 100) : 0;
      return '<li class="av__barra"><span class="av__trilho"><i style="width:' + pct + '%"></i></span>' +
        '<span class="av__barra-n">' + n + ESTRELA + '</span><span class="sr-only">: ' + q + ' avaliações</span></li>';
    }).join('');
    return '<div class="av__resumo">' +
      '<div class="av__media"><p class="av__media-n">' + (r.total ? media(r.media) : '—') + '</p>' +
      '<div class="av__media-lado">' + estrelas(Math.round(r.media), r.total ? 'Média ' + media(r.media) + ' de 5' : 'Ainda sem notas') +
      '<p class="av__media-q">' + r.total + ' avaliaç' + (r.total === 1 ? 'ão' : 'ões') + '</p></div></div>' +
      '<ul class="av__barras" aria-label="Distribuição das notas">' + barras + '</ul></div>';
  }

  function htmlGaleria() {
    var g = estado.galeria;
    if (!g.length) return '';
    var fotos = [];
    g.forEach(function (a) { a.fotos.forEach(function (f, i) { fotos.push({ a: a, i: i, f: f }); }); });
    return '<div class="av__galeria"><h3 class="av__sub">Opiniões com fotos</h3><div class="av__galeria-trilho">' +
      fotos.slice(0, 24).map(function (x) {
        return '<button type="button" class="av__mini" data-galeria="' + esc(x.a.id) + '" data-indice="' + x.i + '" aria-label="Ampliar foto de ' + esc(x.a.nome) + (x.a.nota != null ? ', ' + x.a.nota + ' estrelas' : '') + '">' +
          '<img src="' + esc(x.f.mini || x.f.url) + '" alt="' + esc(x.f.alt) + '" loading="lazy" width="128" height="128">' +
          (x.a.nota != null ? '<span class="av__mini-nota" aria-hidden="true">' + x.a.nota + ' ' + ESTRELA + '</span>' : '') + '</button>';
      }).join('') + '</div></div>';
  }

  function htmlCartao(a) {
    var fotos = a.fotos.length ? '<div class="av__fotos">' + a.fotos.map(function (f, i) {
      return '<button type="button" class="av__mini av__mini--p" data-galeria="' + esc(a.id) + '" data-indice="' + i + '" aria-label="Ampliar foto ' + (i + 1) + ' de ' + esc(a.nome) + '">' +
        '<img src="' + esc(f.mini || f.url) + '" alt="' + esc(f.alt) + '" loading="lazy" width="64" height="64"></button>';
    }).join('') + '</div>' : '';
    var longo = a.texto && a.texto.length > 140;
    return '<article class="av__item">' +
      (a.nota != null || a.data ? '<div class="av__meta">' + (a.nota != null ? estrelas(a.nota) : '') + (a.data ? '<time datetime="' + esc(a.data) + '">' + esc(data(a.data)) + '</time>' : '') + '</div>' : '') +
      '<p class="av__autor">' + esc(a.nome) +
      (a.verificada ? ' <span class="av__selo">Compra verificada</span>' : '') +
      (a.demonstracao ? ' <span class="av__selo av__selo--demo">Demonstração</span>' : '') + '</p>' +
      (a.texto ? '<p class="av__texto' + (longo ? ' av__texto--curto' : '') + '">' + esc(a.texto) + '</p>' : '') +
      (longo ? '<button type="button" class="av__ler" data-ler aria-expanded="false">Ler mais</button>' : '') +
      fotos +
      '</article>';
  }

  var avaliacaoEnviada = false;
  var enviandoAvaliacao = false;
  var envioId = null;

  function htmlFormulario() {
    if (avaliacaoEnviada) return '<div class="av__enviada" role="status"><strong>Avaliação enviada!</strong><p>Obrigado por compartilhar sua experiência. Seu envio foi recebido e não será exibido nesta página.</p></div>';
    return '<details class="reviews__help av__escrever"><summary>Escrever uma avaliação</summary>' +
      '<form data-enviar-avaliacao class="av__form">' +
      '<p class="av__form-ajuda">Conte como foi sua experiência. Seu envio não será publicado nesta página.</p>' +
      '<label for="av-nome">Seu nome</label><input id="av-nome" name="nome" autocomplete="name" required minlength="2" maxlength="80" placeholder="Como você se chama?">' +
      '<fieldset class="av__notas"><legend>Sua nota</legend><div class="av__estrelas-escolha">' +
      [1, 2, 3, 4, 5].map(function (n) { return '<label class="av__estrela-opcao"><input type="radio" name="nota" value="' + n + '" required aria-label="' + n + (n === 1 ? ' estrela' : ' estrelas') + '"><span aria-hidden="true">' + ESTRELA + '</span></label>'; }).join('') +
      '</div></fieldset><label for="av-texto">Sua avaliação</label><textarea id="av-texto" name="texto" rows="4" required minlength="5" maxlength="2000" placeholder="Escreva sua opinião sobre o produto…"></textarea>' +
      '<label for="av-foto">Adicionar uma foto <span>(opcional)</span></label><input id="av-foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="av-foto-ajuda"><p id="av-foto-ajuda" class="av__form-ajuda">Apenas 1 foto JPG, PNG ou WebP, de até 1 MB.</p>' +
      '<div hidden aria-hidden="true"><label>Site<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="av__form-erro" data-envio-erro role="alert" hidden></p><button class="av__enviar" type="submit">Enviar avaliação</button></form></details>';
  }

  raiz.addEventListener('change', function (e) {
    if (e.target.name === 'nota') {
      var nota = Number(e.target.value);
      raiz.querySelectorAll('.av__estrela-opcao').forEach(function (label, i) { label.classList.toggle('selecionada', i < nota); });
    }
  });

  raiz.addEventListener('submit', function (e) {
    if (!e.target.matches('[data-enviar-avaliacao]')) return;
    e.preventDefault();
    if (enviandoAvaliacao || avaliacaoEnviada) return;
    var form = e.target;
    var erro = form.querySelector('[data-envio-erro]');
    erro.hidden = true;
    var foto = form.elements.foto.files[0];
    if (foto && (foto.size > 1024 * 1024 || ['image/jpeg', 'image/png', 'image/webp'].indexOf(foto.type) < 0)) {
      erro.textContent = 'Use uma foto JPG, PNG ou WebP de até 1 MB.'; erro.hidden = false; return;
    }
    if (!envioId) envioId = crypto.randomUUID();
    var dados = new FormData(form);
    dados.set('id', envioId);
    var botao = form.querySelector('[type="submit"]');
    enviandoAvaliacao = true; botao.disabled = true; botao.textContent = 'Enviando…';
    form.setAttribute('aria-busy', 'true');
    fetch('/api/avaliacoes/enviar', { method: 'POST', body: dados, headers: { Accept: 'application/json' } }).then(function (r) {
      return r.json().then(function (d) { if (!r.ok || !d.enviada) throw new Error(d.error || 'Não foi possível enviar. Tente novamente.'); return d; });
    }).then(function () {
      avaliacaoEnviada = true;
      var area = form.closest('details');
      area.outerHTML = htmlFormulario();
      var sucesso = raiz.querySelector('.av__enviada');
      sucesso.setAttribute('tabindex', '-1'); sucesso.focus();
    }).catch(function (err) {
      erro.textContent = err.message || 'Não foi possível enviar. Tente novamente.'; erro.hidden = false;
      botao.disabled = false; botao.textContent = 'Enviar avaliação';
    }).finally(function () { enviandoAvaliacao = false; form.setAttribute('aria-busy', 'false'); });
  });

  function htmlLista() {
    if (!estado.itens.length) {
      return '<p class="av__estado">' + (estado.carregando ? 'Carregando…' : 'Nenhuma avaliação.') + '</p>';
    }
    return estado.itens.slice(0, limiteVisivel).map(htmlCartao).join('') +
      (estado.temMais || estado.itens.length > limiteVisivel ? '<button type="button" class="av__mais" data-mais' + (estado.carregando ? ' disabled' : '') + '>' +
        (estado.carregando ? 'Carregando…' : 'Ver mais avaliações') + '</button>' : '');
  }

  function render() {
    var r = estado.resumo;
    if (!r) return erro();
    raiz.setAttribute('aria-busy', 'false');
    var filtros = '<div class="reviews__tools"><div class="reviews__filters" role="group" aria-label="Filtrar avaliações">' +
      '<button type="button" data-filtro="todas" aria-pressed="' + (estado.filtro === 'todas') + '">Todas <span>' + r.total + '</span></button>' +
      '<button type="button" data-filtro="fotos" aria-pressed="' + (estado.filtro === 'fotos') + '">Com fotos</button></div></div>';
    var vazio = '<div class="reviews__empty" role="status">' + estrelas(0, 'Sem avaliações') +
      '<p class="reviews__empty-title">' + (estado.filtro === 'fotos' ? 'Ainda não há avaliações com fotos' : 'Sua experiência pode ser a primeira') + '</p>' +
      '<p>' + (estado.filtro === 'fotos' ? 'As fotos enviadas nas avaliações aparecerão aqui.' : 'Ainda não há avaliações publicadas para este produto.') + '</p></div>';
    raiz.innerHTML = htmlResumo() + htmlFormulario() +
      htmlGaleria() + filtros + '<div class="av__lista" data-lista>' + (estado.itens.length ? htmlLista() : vazio) + '</div>';
  }

  function renderLista() {
    var lista = raiz.querySelector('[data-lista]');
    if (lista) lista.innerHTML = htmlLista();
  }

  function erro() {
    raiz.setAttribute('aria-busy', 'false');
    raiz.innerHTML = '<div class="cartao av__vazio"><p class="av__vazio-t">Não foi possível carregar as avaliações.</p>' +
      '<button type="button" class="av__mais" data-repetir>Tentar novamente</button></div>';
  }

  /* ---------------- dados */
  function carregarInicio() {
    raiz.innerHTML = '<p class="av__estado">Carregando avaliações…</p>';
    limiteVisivel = 4;
    estado.pagina = 1; estado.itens = []; estado.ids = {};
    var id = ++pedidoAtual;
    buscar({ filtro: estado.filtro, ordem: estado.ordem, pagina: 1, resumo: 1 }).then(function (d) {
      if (id !== pedidoAtual) return;
      estado.resumo = d.resumo; estado.galeria = d.galeria || [];
      acrescentar(d.itens); estado.temMais = d.temMais;
      render();
    }).catch(function () { if (id === pedidoAtual) erro(); });
  }

  function acrescentar(itens) {
    itens.forEach(function (a) {
      if (estado.ids[a.id]) return;
      estado.ids[a.id] = true;
      estado.itens.push(a);
    });
  }

  function carregarMais() {
    if (estado.carregando) return;
    limiteVisivel += 7;
    if (estado.itens.length >= limiteVisivel || !estado.temMais) { renderLista(); return; }
    estado.carregando = true; renderLista();
    var id = pedidoAtual;
    var proxima = estado.pagina + 1;
    buscar({ filtro: estado.filtro, ordem: estado.ordem, pagina: proxima }).then(function (d) {
      if (id !== pedidoAtual) return;
      estado.pagina = proxima; estado.carregando = false;
      acrescentar(d.itens); estado.temMais = d.temMais;
      renderLista();
    }).catch(function () { if (id === pedidoAtual) { estado.carregando = false; renderLista(); } });
  }

  /* ---------------- visualizador de fotos */
  var caixa = null, fotosAbertas = [], indiceAberto = 0, focoAnterior = null;

  function acharAvaliacao(id) {
    for (var i = 0; i < estado.itens.length; i++) if (estado.itens[i].id === id) return estado.itens[i];
    for (var j = 0; j < estado.galeria.length; j++) if (estado.galeria[j].id === id) return estado.galeria[j];
    return null;
  }

  function montarCaixa() {
    caixa = document.createElement('div');
    caixa.className = 'av__caixa';
    caixa.hidden = true;
    caixa.setAttribute('role', 'dialog');
    caixa.setAttribute('aria-modal', 'true');
    caixa.setAttribute('aria-label', 'Foto da avaliação');
    caixa.innerHTML = '<button type="button" class="av__caixa-x" data-fechar aria-label="Fechar">×</button>' +
      '<button type="button" class="av__caixa-nav av__caixa-ant" data-anterior aria-label="Foto anterior">‹</button>' +
      '<figure class="av__caixa-fig"><img alt=""><figcaption aria-live="polite" aria-atomic="true"><p class="av__caixa-autor"></p><p class="av__caixa-texto"></p></figcaption></figure>' +
      '<button type="button" class="av__caixa-nav av__caixa-prox" data-proxima aria-label="Próxima foto">›</button>';
    document.body.appendChild(caixa);
    caixa.addEventListener('click', function (e) {
      if (e.target === caixa || e.target.closest('[data-fechar]')) fechar();
      else if (e.target.closest('[data-anterior]')) mostrar(indiceAberto - 1);
      else if (e.target.closest('[data-proxima]')) mostrar(indiceAberto + 1);
    });
    document.addEventListener('keydown', function (e) {
      if (caixa.hidden) return;
      if (e.key === 'Escape') fechar();
      else if (e.key === 'ArrowLeft') mostrar(indiceAberto - 1);
      else if (e.key === 'ArrowRight') mostrar(indiceAberto + 1);
      else if (e.key === 'Tab') {
        var focaveis = caixa.querySelectorAll('button:not([hidden])');
        var prim = focaveis[0], ult = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === prim) { e.preventDefault(); ult.focus(); }
        else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); prim.focus(); }
      }
    });
  }

  function mostrar(i) {
    var n = fotosAbertas.length;
    indiceAberto = (i + n) % n;
    var x = fotosAbertas[indiceAberto];
    var img = caixa.querySelector('img');
    img.src = x.f.url; img.alt = x.f.alt;
    caixa.querySelector('.av__caixa-autor').textContent = x.a.nome + (x.a.nota != null ? ' · ' + x.a.nota + ' de 5 estrelas' : '') + (n > 1 ? ' · ' + (indiceAberto + 1) + '/' + n : '');
    caixa.querySelector('.av__caixa-texto').textContent = x.a.texto || '';
    caixa.querySelector('figcaption').scrollTop = 0;
    caixa.querySelector('[data-anterior]').hidden = n < 2;
    caixa.querySelector('[data-proxima]').hidden = n < 2;
  }

  function abrir(id, indice, origem) {
    var a = acharAvaliacao(id);
    if (!a || !a.fotos.length) return;
    if (!caixa) montarCaixa();
    var vistas = {};
    fotosAbertas = [];
    estado.galeria.concat(estado.itens).forEach(function (avaliacao) {
      if (vistas[avaliacao.id]) return;
      vistas[avaliacao.id] = true;
      avaliacao.fotos.forEach(function (foto, i) {
        fotosAbertas.push({ a: avaliacao, f: foto, indice: i });
      });
    });
    var inicio = fotosAbertas.findIndex(function (foto) { return foto.a.id === id && foto.indice === indice; });
    focoAnterior = origem;
    mostrar(inicio < 0 ? 0 : inicio);
    caixa.hidden = false;
    document.body.classList.add('travado');
    caixa.querySelector('[data-fechar]').focus();
  }

  function fechar() {
    caixa.hidden = true;
    document.body.classList.remove('travado');
    if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus();
  }

  /* ---------------- eventos */
  raiz.addEventListener('click', function (e) {
    var filtro = e.target.closest('[data-filtro]');
    if (filtro && !estado.carregando) {
      estado.filtro = filtro.dataset.filtro;
      carregarInicio();
      return;
    }
    var ler = e.target.closest('[data-ler]');
    if (ler) {
      var aberto = ler.getAttribute('aria-expanded') === 'true';
      ler.setAttribute('aria-expanded', String(!aberto));
      ler.textContent = aberto ? 'Ler mais' : 'Ler menos';
      ler.previousElementSibling.classList.toggle('av__texto--curto', aberto);
      return;
    }
    if (e.target.closest('[data-mais]')) return carregarMais();
    if (e.target.closest('[data-repetir]')) return carregarInicio();
    var g = e.target.closest('[data-galeria]');
    if (g) abrir(g.dataset.galeria, Number(g.dataset.indice) || 0, g);
  });
  // só busca quando a seção se aproxima da tela, para não pesar o carregamento inicial
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (en) {
      if (en.some(function (x) { return x.isIntersecting; })) { obs.disconnect(); carregarInicio(); }
    }, { rootMargin: '600px 0px' });
    obs.observe(raiz);
  } else {
    carregarInicio();
  }
})();
