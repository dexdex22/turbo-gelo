/* ===========================================================================
   >>>  ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR PARA PUBLICAR  <<<
   ---------------------------------------------------------------------------
   • ativo: false  ou  lista vazia  ou  null  =>  a seção some sem deixar buraco.
   • Textos que começam com [VALIDAR] reprovam a publicação no valida.mjs.
   • Todo o conteúdo abaixo foi tirado dos criativos oficiais TURBOGELO
     (sequência 01–15). Se algum dado mudar na operação, mude aqui.
   • SEGURANÇA: `cabecalho.titulo` e `confianca.itens[].texto` aceitam HTML
     (<b> e <br>). Nunca preencha com texto vindo de fora.
   ========================================================================= */

var _KIT = function (qtd) {
  var lista = (window.TURBOGELO_PRECOS && window.TURBOGELO_PRECOS.kits) || [];
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].qtd !== qtd) continue;
    var kit = lista[i];
    return Object.assign({}, kit, { de: null, desconto: null });
  }
  return { por: '', de: null, desconto: null, comparacao: null };
};

window.PRODUTO = {

  /* ---------- 1. SEO e compartilhamento --------------------------------- */
  seo: {
    titulo: 'TURBOGELO · O cooler com a cara do seu carro',
    descricao: 'Cooler térmico de 45 L inspirado no seu carro. Escolha lado, marca, modelo e cor; personalize a placa no checkout e confira as condições de entrega antes de pagar.',
    urlCanonica: 'https://turbogelo.online/',
    ogImagem: 'img/turbogelo/galeria/slot-01-hero.webp',
    nomeDoSite: 'TURBOGELO',
    locale: 'pt_BR',
    tema: '#0A0B0D',
  },

  /* ---------- 2. marca --------------------------------------------------- */
  marca: {
    nome: 'TURBOGELO',
    logo: 'logo/turbogelo-oficial.webp',
    logoNegativo: 'logo/turbogelo-oficial.webp',
    alt: 'TURBOGELO',
    legendaMenu: 'O cooler com a cara do seu carro',
  },

  /* ---------- 3. contato e dados da empresa ------------------------------ */
  contato: {
    email: '',
    horario: '',
  },
  empresa: {
    razaoSocial: '',
    cnpj: '',
    endereco: '',
  },

  /* ---------- 4. navegação ----------------------------------------------- */
  navegacao: {
    inicio: 'index.html',
    rastreio: { ativo: false, rotulo: 'Rastrear Meu Pedido', href: '', legenda: 'Acompanhe onde está sua entrega' },
    politicas: [],
    institucional: [],
  },

  header: {
    acoes: [
      { tipo: 'ancora', icone: 'busca',  rotulo: 'Ir para as perguntas frequentes', href: '#faq' },
      { tipo: 'ancora', icone: 'carrinho', rotulo: 'Ir para a compra',                href: '#comprar' },
    ],
  },

  /* ---------- 5. barra de aviso (topo) ------------------------------------ */
  avisoTopo: {
    ativo: false,
    /* Texto único e fixo. Os flocos dos lados são desenhados pelo app.js. */
    texto: '',
  },

  /* ---------- 6. galeria --------------------------------------------------- */
  galeria: {
    imagens: [
      { src: '/img/turbogelo/galeria/slot-01-hero.webp', alt: 'Mais de 1.100 modelos TURBOGELO: escolha o modelo do seu carro no seletor abaixo', proporcao: '1 / 1' },
      { src: '/img/turbogelo/galeria/slot-02-frente-traseira.webp', alt: 'Escolha seu ângulo: cooler TURBOGELO Hilux visto pela frente e pela traseira', proporcao: '1 / 1' },
      { src: '/img/turbogelo/galeria/slot-03-capacidade-medidas.webp', alt: 'Cooler TURBOGELO de 45 litros: capacidade para bebidas e medidas de 65 por 40 por 38 centímetros', proporcao: '1 / 1' },
      { src: '/img/turbogelo/galeria/slot-04-fluxo-atualizado.webp', alt: 'Do clique à sua garagem em cinco passos: escolha seu carro, escolha a personalização, confirme seu pedido, estoque à pronta entrega e receba seu TURBOGELO', proporcao: '1 / 1' },
      { src: '/img/turbogelo/galeria/slot-05-vitrine-modelos.webp', alt: 'Vitrine TURBOGELO: Hilux SRX 2023, Civic Si 2015, Strada 2022, Golf GTI 2022, Compass 2023 e S10 2024', proporcao: '1 / 1' },
    ],
    semSelo: [
      '/img/turbogelo/galeria/slot-01-hero.webp',
      '/img/turbogelo/galeria/slot-02-frente-traseira.webp',
      '/img/turbogelo/galeria/slot-03-capacidade-medidas.webp',
      '/img/turbogelo/galeria/slot-04-fluxo-atualizado.webp',
      '/img/turbogelo/galeria/slot-05-vitrine-modelos.webp',
    ],
  },

  selos: {
    desconto: { ativo: false, texto: '' },
    nota:     { ativo: false, texto: '' },
  },

  /* ---------- 7. card de compra -------------------------------------------- */
  cabecalho: {
    etiqueta: { ativo: true, icone: 'neve', texto: 'O COOLER COM A CARA DO SEU CARRO' },
    titulo: 'Seu carro. <b>Seu cooler.</b>',
    sub: 'A paixão pelo seu carro agora acompanha o churrasco. São 45 litros para bebidas e gelo, com o modelo, a cor e a placa que você escolher.',
    emocional: 'Pronto pra ser o cara da resenha? 👇',
  },

  avaliacaoResumo: { ativo: true, nota: '4,9', quantidade: '5936' },
  campanhaTopo: { ativo: false, duracaoHoras: 72 },

  /* Valores vêm de /precos.js (lib/checkout/catalogo.ts). Não digite preços aqui. */
  preco: {
    de: _KIT(1).de,
    por: _KIT(1).por,
    desconto: _KIT(1).desconto,
    aVista: '10% de desconto no Pix',
    parcelas: '',
  },

  kits: {
    ativo: true,
    titulo: 'Leve mais e economize',
    opcoes: [
      { qtd: 1, rotulo: '1 Unidade TURBOGELO', detalhe: '(Escolha o modelo)',
        de: _KIT(1).de, por: _KIT(1).por, desconto: _KIT(1).desconto, parcelas: '' },
      { qtd: 2, rotulo: '2 Unidades TURBOGELO', detalhe: '(Escolha os modelos)',
        de: _KIT(2).de, por: _KIT(2).por, desconto: _KIT(2).desconto, parcelas: '',
        tag: 'Economia no kit',
        economiaTexto: _KIT(2).comparacao },
    ],
  },

  /* Configurador do carro, na ordem: lado → tipo → marca → modelo.
     Para incluir um carro, acrescente { nome, tipo } na marca certa.
     Tipos válidos: os mesmos de `tipos` abaixo. */
  configurador: {
    ativo: true,
    instrucoes: ['Lado · tipo · marca · modelo do seu carro', 'Kit com 2? Configure cada um', 'Placa personalizada: você escolhe no checkout'],
    lados: ['Frente', 'Traseira'],
    tipos: ['Picape', 'SUV', 'Sedã', 'Hatch', 'Esportivo / Coupé', 'Conversível'],
    /* Fotos dos modelos no Vercel Blob, enviadas por scripts/enviar-fotos.mjs.
       Caminho final: <pastaFotos>/TIPO/Marca/Modelo/frente.webp */
    pastaFotos: '/img/carros',
    /* Catálogo completo da pasta CX (1112 modelos), gerado em carros.catalogo.js.
       A lista abaixo só é usada se aquele arquivo não carregar. */
    marcas: window.TURBOGELO_CARROS || {
      'Agrale':     [{ nome: 'Marruá', tipo: 'Picape' }],
      'BMW':        [{ nome: 'M3', tipo: 'Esportivo / Coupé' }, { nome: 'X1', tipo: 'SUV' }, { nome: 'Z4', tipo: 'Conversível' }],
      'Chevrolet':  [{ nome: 'S10', tipo: 'Picape' }, { nome: 'Montana', tipo: 'Picape' }, { nome: 'Tracker', tipo: 'SUV' }, { nome: 'Onix', tipo: 'Hatch' }, { nome: 'Onix Plus', tipo: 'Sedã' }, { nome: 'Cruze', tipo: 'Sedã' }, { nome: 'Camaro', tipo: 'Esportivo / Coupé' }, { nome: 'Camaro Conversível', tipo: 'Conversível' }],
      'Dodge':      [{ nome: 'Durango', tipo: 'SUV' }, { nome: 'Challenger', tipo: 'Esportivo / Coupé' }],
      'Fiat':       [{ nome: 'Strada', tipo: 'Picape' }, { nome: 'Toro', tipo: 'Picape' }, { nome: 'Pulse', tipo: 'SUV' }, { nome: 'Fastback', tipo: 'SUV' }, { nome: 'Cronos', tipo: 'Sedã' }, { nome: 'Argo', tipo: 'Hatch' }, { nome: 'Mobi', tipo: 'Hatch' }],
      'Ford':       [{ nome: 'Ranger', tipo: 'Picape' }, { nome: 'Maverick', tipo: 'Picape' }, { nome: 'F-150', tipo: 'Picape' }, { nome: 'Bronco Sport', tipo: 'SUV' }, { nome: 'Territory', tipo: 'SUV' }, { nome: 'Mustang', tipo: 'Esportivo / Coupé' }, { nome: 'Mustang Conversível', tipo: 'Conversível' }],
      'GWM':        [{ nome: 'Poer', tipo: 'Picape' }, { nome: 'Haval H6', tipo: 'SUV' }],
      'Honda':      [{ nome: 'HR-V', tipo: 'SUV' }, { nome: 'Civic', tipo: 'Sedã' }, { nome: 'City', tipo: 'Sedã' }, { nome: 'Civic Si', tipo: 'Esportivo / Coupé' }],
      'Hyundai':    [{ nome: 'Creta', tipo: 'SUV' }, { nome: 'Tucson', tipo: 'SUV' }, { nome: 'HB20', tipo: 'Hatch' }, { nome: 'HB20S', tipo: 'Sedã' }],
      'JAC':        [{ nome: 'T40', tipo: 'SUV' }, { nome: 'E-JS1', tipo: 'Hatch' }],
      'Jeep':       [{ nome: 'Gladiator', tipo: 'Picape' }, { nome: 'Renegade', tipo: 'SUV' }, { nome: 'Compass', tipo: 'SUV' }, { nome: 'Commander', tipo: 'SUV' }],
      'Kia':        [{ nome: 'Sportage', tipo: 'SUV' }, { nome: 'Seltos', tipo: 'SUV' }, { nome: 'Cerato', tipo: 'Sedã' }],
      'Mini':       [{ nome: 'Cooper', tipo: 'Hatch' }, { nome: 'Cooper Cabrio', tipo: 'Conversível' }],
      'Mitsubishi': [{ nome: 'L200 Triton', tipo: 'Picape' }, { nome: 'Pajero', tipo: 'SUV' }, { nome: 'Lancer Evolution', tipo: 'Esportivo / Coupé' }],
      'Nissan':     [{ nome: 'Frontier', tipo: 'Picape' }, { nome: 'Kicks', tipo: 'SUV' }, { nome: 'Versa', tipo: 'Sedã' }],
      'Peugeot':    [{ nome: '2008', tipo: 'SUV' }, { nome: '208', tipo: 'Hatch' }],
      'Porsche':    [{ nome: '911', tipo: 'Esportivo / Coupé' }, { nome: '911 Cabriolet', tipo: 'Conversível' }],
      'RAM':        [{ nome: 'Rampage', tipo: 'Picape' }, { nome: '1500', tipo: 'Picape' }, { nome: '2500', tipo: 'Picape' }, { nome: '3500', tipo: 'Picape' }],
      'Renault':    [{ nome: 'Oroch', tipo: 'Picape' }, { nome: 'Duster', tipo: 'SUV' }, { nome: 'Logan', tipo: 'Sedã' }, { nome: 'Kwid', tipo: 'Hatch' }, { nome: 'Sandero', tipo: 'Hatch' }],
      'Toyota':     [{ nome: 'Hilux', tipo: 'Picape' }, { nome: 'Hilux SRX', tipo: 'Picape' }, { nome: 'Hilux Cabine Simples', tipo: 'Picape' }, { nome: 'SW4', tipo: 'SUV' }, { nome: 'Corolla Cross', tipo: 'SUV' }, { nome: 'Corolla', tipo: 'Sedã' }, { nome: 'Yaris', tipo: 'Hatch' }, { nome: 'Supra', tipo: 'Esportivo / Coupé' }],
      'Volkswagen': [{ nome: 'Amarok', tipo: 'Picape' }, { nome: 'Saveiro', tipo: 'Picape' }, { nome: 'T-Cross', tipo: 'SUV' }, { nome: 'Nivus', tipo: 'SUV' }, { nome: 'Taos', tipo: 'SUV' }, { nome: 'Virtus', tipo: 'Sedã' }, { nome: 'Jetta', tipo: 'Sedã' }, { nome: 'Polo', tipo: 'Hatch' }, { nome: 'Gol', tipo: 'Hatch' }, { nome: 'Golf GTI', tipo: 'Esportivo / Coupé' }],
    },
  },

  variacoes: [],

  /* Informações curtas logo abaixo dos botões de compra (abrem ao clicar) */
  infoCompra: {
    ativo: true,
    nota: '',
    itens: [
      { icone: 'caixa', t: 'Capacidade e tamanho', aberto: true, c: '45 L para bebidas e gelo. Medidas: 65 × 40 × 38 cm (comprimento × largura × altura). As rodas são ornamentais, sem rodagem.', tabela: {
        titulo: 'Quanto cabe no cooler',
        descricao: 'Capacidade com gelo, conforme a embalagem escolhida.',
        linhas: [
          ['Latinha de 269 ml', 42, 3, 126],
          ['Lata de 350 ml', 42, 2, 84],
          ['Latão de 473 ml', 42, 1, 42],
          ['Long neck de 330/355 ml', 48, 1, 48],
        ],
      } },
      { icone: 'info', t: 'Como personalizar', c: 'Escolha frente ou traseira, tipo, marca, modelo e cor nas opções acima. A placa é definida no checkout. As imagens ajudam na escolha; não representam uma réplica exata do veículo.' },
      { icone: 'caminhao', t: 'Entrega e acompanhamento', c: 'Confira as modalidades, os valores e os prazos exibidos no checkout. Para informações sobre preparação e rastreio disponível, fale com o atendimento informando seu pedido.' },
      { icone: 'troca', t: 'Trocas e garantia', c: 'Compras online têm direito de arrependimento em até 7 dias do recebimento. A política informa 90 dias de garantia contra defeitos. Consulte as condições no rodapé; para solicitar atendimento, informe o número do pedido.' },
    ],
  },

  brinde: null,

  ctas: {
    principal: 'COMPRAR AGORA',
    carrinho:  'ADICIONAR AO CARRINHO',
    oferta:    'QUERO O MEU TURBOGELO',
    prova:     'COMPRAR COM SEGURANÇA',
    barraFixa: 'COMPRAR AGORA',
  },

  urgencia: {
    ativo: false,
    modo: 'prazoFixo',
    terminaEm: '',
    texto: 'A campanha termina em',
    textoEncerrado: '',
  },

  confianca: {
    ativo: true,
    itens: [
      { icone: 'caminhao', texto: 'Frete<br>grátis' },
      { icone: 'troca',    texto: '7 dias para<br>arrependimento' },
      { icone: 'escudo',   texto: '90 dias de<br>garantia' },
    ],
  },

  pagamentos: { ativo: false, bandeiras: [] },

  /* ---------- 8. benefícios ------------------------------------------------- */
  beneficios: {
    ativo: true,
    rotulo: 'Por que TURBOGELO',
    titulo: 'Não é um cooler qualquer.',
    destaque: 'É o seu carro.',
    itens: [
      { imagem: 'img/beneficios/carro.webp', titulo: 'A CARA DO SEU CARRO', desc: 'A réplica EXATA do carro que tá na sua garagem. Com a SUA placa.' },
      { imagem: 'img/beneficios/litros.webp', titulo: '45 LITROS DE RESENHA', desc: 'Cabe 126 latinhas. Dá churrasco de domingo inteiro sem acabar.' },
      { imagem: 'img/beneficios/carro.webp', titulo: 'PRONTA ENTREGA', desc: 'Todos os modelos do catálogo à pronta entrega. Não encontrou o seu? A gente produz pra você.' },
      { imagem: 'img/beneficios/frete.webp', titulo: 'FRETE GRÁTIS BRASIL', desc: 'Em até 7 dias úteis. Rastreio por WhatsApp. Tá na sua porta.' },
    ],
  },

  demonstracao: {
    ativo: true,
    rotulo: 'Veja em ação',
    titulo: 'Seu próximo',
    destaque: 'parceiro de churrasco.',
    sub: 'Veja o cooler e seus detalhes de perto.',
    video: 'videos/cooler-demonstration.mp4',
    poster: 'img/turbogelo/sequencia/09-contexto-e-detalhes.webp',
    largura: 640,
    altura: 640,
  },

  /* ---------- 9. descrição --------------------------------------------------- */
  descricao: { ativo: false },

  /* ---------- 10. mini-features ----------------------------------------------- */
  miniFeatures: { ativo: false, itens: [] },

  /* ---------- 11. passos ------------------------------------------------------- */
  passos: {
    ativo: true,
    rotulo: 'Como funciona',
    titulo: 'Do seu modelo',
    destaque: 'até a sua porta.',
    itens: [
      { imagem: 'img/passos/escolha.webp',   titulo: 'Monte sua seleção',      desc: 'Escolha lado, tipo, marca, modelo e cor de cada unidade.' },
      { imagem: 'img/passos/pagamento.webp', titulo: 'Personalize a placa',    desc: 'No checkout, informe a placa e os dados de entrega.' },
      { imagem: 'img/passos/envio.webp',     titulo: 'Revise antes de pagar',  desc: 'Confira itens, frete, prazo e total. Escolha entre Pix e cartão conforme as opções disponíveis.' },
      { imagem: 'img/passos/rastreio.webp',  titulo: 'Consulte seu pedido',    desc: 'Para saber sobre preparação e rastreio, fale com o atendimento e informe o número do pedido.' },
    ],
  },

  /* ---------- 12. guia de medidas ---------------------------------------------- */
  medidas: { ativo: false, linhas: [] },

  /* ---------- 13. detalhes visuais (sequência oficial) --------------------------- */
  detalhesVisuais: {
    ativo: true,
    rotulo: 'Em detalhes',
    titulo: 'Conheça o',
    destaque: 'TURBOGELO.',
    sub: 'Tudo o que você precisa saber antes de escolher o seu.',
    imagens: [
      { tipo: 'video', src: 'videos/cooler-in-use.mp4', poster: 'img/turbogelo/sequencia/09-contexto-e-detalhes.webp', alt: 'Cooler TURBOGELO em uso', largura: 640, altura: 640 },
      { src: 'img/turbogelo/sequencia/01-identidade.webp', alt: 'TURBOGELO: identidade do produto', largura: 800, altura: 910 },
      { src: 'img/turbogelo/sequencia/02-especificacoes.webp', alt: 'Ficha técnica do cooler TURBOGELO', largura: 1600, altura: 1820 },
      { src: 'img/turbogelo/sequencia/04-capacidade.webp', alt: 'Capacidade do cooler TURBOGELO', largura: 800, altura: 910 },
      { src: 'img/turbogelo/sequencia/comparison-proposals.webp?v=14490', alt: 'Comparação de propostas de uso: cooler comum, TURBOGELO personalizado de 45 litros por R$ 144,90 com 10% de desconto no Pix e miniatura colecionável. Um cooler com a cara do seu carro.', largura: 941, altura: 1672, legenda: 'Comparação ilustrativa de categorias. Neste site, a escolha é feita pelas imagens disponíveis e a placa é definida no checkout. A aprovação de prévia citada na arte não é uma etapa oferecida pelo fluxo atual.' },
      { src: 'img/turbogelo/sequencia/06-modelos.webp', alt: 'Modelos de carro disponíveis', largura: 800, altura: 910 },
      { src: 'img/turbogelo/sequencia/07-montadoras.webp', alt: 'Montadoras disponíveis no catálogo', largura: 800, altura: 910 },
      { src: 'img/turbogelo/sequencia/08-medidas.webp', alt: 'Medidas do cooler TURBOGELO: 65 × 40 × 38 cm, 45 L', largura: 800, altura: 910 },
      { src: 'img/turbogelo/sequencia/09-contexto-e-detalhes.webp', alt: 'Cooler TURBOGELO em uso e seus detalhes', largura: 800, altura: 910 },
      { src: 'img/turbogelo/sequencia/10-na-caixa.webp?v=2', alt: 'O que vem na caixa', largura: 800, altura: 1000 },
    ],
  },

  /* ---------- 13b. storytelling: o momento da chegada (entre Garantia e Oferta) ---- */
  storytelling: {
    ativo: true,
    imagem: 'img/turbogelo/sequencia/storytelling-momento.webp',
    largura: 612,
    altura: 704,
    alt: 'O momento da chegada do TURBOGELO: seu carro na mesa, literalmente. Antes: "Tem como passar o isopor aí?". Depois: "Cara, onde você comprou isso?!". O rolê não é mais o mesmo.',
    destino: '#preco-cta',
  },

  /* ---------- 14. especificações + accordions ------------------------------------ */
  especificacoes: {
    ativo: true,
    rotulo: 'Ficha técnica',
    titulo: 'Especificações',
    itens: [
      ['Produto', 'Cooler automotivo personalizado'],
      ['Capacidade', '45 L'],
      ['Medidas (C × L × A)', '65 × 40 × 38 cm'],
      ['Exterior', 'Pintura automotiva PU, cor conforme seleção'],
      ['Interior', 'Branco, térmico'],
      ['Tampa', 'Articulada, abertura superior'],
      ['Alça', 'Telescópica'],
      ['Rodas', 'Ornamentais, sem rodagem'],
      ['Acompanha', 'Placa personalizada e manual'],
    ],
  },
  detalhes: {
    ativo: true,
    primeiroAberto: true,
    itens: [
      { t: 'Escolha do modelo', c: 'Selecione lado, tipo, marca, modelo e cor na página; informe a placa no checkout. Se o modelo não estiver listado, consulte o atendimento sobre disponibilidade antes de pagar.' },
      { t: 'Envio e entrega', c: 'Confira o frete e o prazo no checkout. A preparação e a disponibilidade de rastreio podem ser consultadas com o atendimento, informando o número do pedido.' },
      { t: 'Garantia e trocas', c: 'Direito de arrependimento em até 7 dias do recebimento e garantia contra defeitos por 90 dias, conforme as políticas da loja. O atendimento orienta a devolução e os custos aplicáveis a cada caso.' },
    ],
  },

  /* ---------- 15. comparação ------------------------------------------------------ */
  comparacao: { ativo: false, linhas: [] },

  /* ---------- 16. bloco de oferta --------------------------------------------------- */
  oferta: {
    ativo: true,
    rotulo: 'Pronto para gelar?',
    titulo: 'Escolha o',
    destaque: 'seu TURBOGELO.',
    mostrarResumoDePreco: true,
  },

  /* ---------- 17. casos de uso ------------------------------------------------------- */
  usos: {
    ativo: true,
    rotulo: 'Onde ele brilha',
    titulo: 'Feito para',
    destaque: 'chamar atenção.',
    itens: [
      { icone: 'casa',     texto: 'Churrasco com a família' },
      { icone: 'sol',      texto: 'Praia, pesca e camping' },
      { icone: 'estrela',  texto: 'Encontro de carros' },
      { icone: 'presente', texto: 'Presente para quem ama carro' },
    ],
  },

  /* ---------- 18. prova social ------------------------------------------------------- */
  prova: {
    ativo: false,
    titulo: 'Quem comprou, aprovou',
    resumo: { ativo: false, nota: '', quantidade: '', distribuicao: [] },
    fotos: { ativo: false, itens: [] },
    depoimentos: [],
    linkTodas: null,
    cta: true,
  },

  /* ---------- 19. FAQ ---------------------------------------------------------------- */
  faq: {
    ativo: true,
    rotulo: 'Dúvidas',
    titulo: 'Ainda tem',
    destaque: 'dúvidas?',
    itens: [
      { q: 'Como personalizo meu cooler?', a: 'Escolha o lado (frente ou traseira), o tipo, a marca, o modelo e a cor. No kit de 2, configure cada unidade. O texto da placa é definido no checkout, antes do pagamento.' },
      { q: 'Recebo uma prévia para aprovar?', a: 'Você pode consultar as imagens disponíveis na galeria e na seleção do modelo. O fluxo atual não inclui uma etapa de aprovação de prévia por WhatsApp. Tire dúvidas com o atendimento antes de pagar.' },
      { q: 'E se meu modelo não estiver no catálogo?', a: 'Consulte a equipe pelo WhatsApp para confirmar disponibilidade e opções antes de pagar.' },
      { q: 'Qual é o tamanho?', a: 'O cooler tem 45 L e mede 65 cm de comprimento, 40 cm de largura e 38 cm de altura.' },
      { q: 'As rodas giram?', a: 'Não. As rodas são ornamentais, sem rodagem.' },
      { q: 'Tem garantia?', a: 'A política de garantia informa cobertura de 90 dias contra defeitos a partir da entrega; para defeitos ocultos, a contagem começa quando o problema é identificado. Consulte a política no rodapé para condições e atendimento.' },
      { q: 'Como funciona a entrega?', a: 'Consulte as modalidades e os prazos no checkout. Para confirmar a preparação e obter informações de rastreio disponíveis, entre em contato com o atendimento usando o número do pedido.' },
      { q: 'Posso trocar ou devolver?', a: 'Compras online têm direito de arrependimento em até 7 dias do recebimento. Informe o número do pedido ao atendimento para receber as orientações de troca ou devolução, conforme a política e a legislação aplicável.' },
      { q: 'Posso dar de presente?', a: 'Pode. Basta escolher o modelo do carro da pessoa na página.' },
    ],
  },

  /* ---------- 20. rodapé -------------------------------------------------------------- */
  /* Rodapé institucional. Item com `pendente` aparece sem link e com o selo
     "Em breve" até a página/política existir de verdade: troque por `href`. */
  rodape: {
    ativo: true,
    logo: 'logo/turbogelo-rodape.webp',
    slogan: 'O cooler com a cara do seu carro.',
    descricao: 'Coolers térmicos inspirados no seu carro. Escolha modelo, cor e placa.',
    colunas: [
      { titulo: 'Suporte', itens: [
        { rotulo: 'WhatsApp: (11) 91618-5537', href: 'https://wa.me/5511916185537', externo: true },
        { rotulo: 'sac@turbogelo.com',       somenteTexto: true },
      ] },
      { titulo: 'Institucional', itens: [
        { rotulo: 'Sobre a TURBOGELO', pendente: 'conteúdo institucional ainda precisa ser validado' },
        { rotulo: 'Como funciona',       href: '#como-funciona' },
        { rotulo: 'Perguntas frequentes', href: '#faq' },
      ] },
      { titulo: 'Políticas', itens: [
        { rotulo: 'Política de Privacidade', pendente: 'texto completo da política não veio no material recebido' },
        { rotulo: 'Termos de Uso', pendente: 'texto completo dos termos não veio no material recebido' },
        { rotulo: 'Trocas e Devoluções', pendente: 'procedimento e endereço de devolução precisam ser confirmados' },
        { rotulo: 'Política de Entrega', pendente: 'regras e prazos completos precisam ser confirmados' },
        { rotulo: 'Garantia', pendente: 'condições completas da garantia precisam ser confirmadas' },
      ] },
      { titulo: 'Sua compra', itens: [
        { rotulo: 'Escolha do modelo',       href: '#comprar' },
        { rotulo: 'Personalização da placa', pendente: 'página explicativa ainda não fornecida' },
        { rotulo: 'Acompanhe seu pedido', pendente: 'consulta de rastreio ainda depende de integração' },
        { rotulo: 'Fale no WhatsApp',        href: 'https://wa.me/5511916185537', externo: true },
      ] },
    ],
    pagamentos: {
      titulo: 'Formas de pagamento',
      // [VALIDAR] checkout em modo demo: confirmar no provedor cada bandeira e o Pix antes de publicar.
      validado: false,
      nota: '',
      bandeiras: [
        { src: 'img/pay/v3/amex.svg',       alt: 'American Express' },
        { src: 'img/pay/v3/visa.svg',       alt: 'Visa' },
        { src: 'img/pay/v3/diners.svg',     alt: 'Diners Club' },
        { src: 'img/pay/v3/mastercard.svg', alt: 'Mastercard' },
        { src: 'img/pay/v3/discover.svg',   alt: 'Discover' },
        { src: 'img/pay/v3/elo.svg',        alt: 'Elo' },
        { src: 'img/pay/v3/hipercard.svg',  alt: 'Hipercard' },
        { src: 'img/pay/v3/pix.svg',        alt: 'Pix' },
      ],
    },
    dadosEmpresa: {
      nomeEmpresarial: 'Turbo Gelo Comércio e Distribuição Ltda',
      cnpj: '67.222.449/0001-75',
      emailSuporte: 'sac@turbogelo.com',
      whatsappSuporte: '(11) 91618-5537',
    },
    copyright: '© {ano} {marca} · Todos os direitos reservados.',

  },

  /* ---------- 21. barra fixa de compra -------------------------------------------------- */
  barraFixa: { ativo: true, aparecerApos: 720 },

  /* ---------- 22. checkout --------------------------------------------------------------
     modo: 'demo' (padrão, nenhum pedido criado) | 'url' | 'api'
     --------------------------------------------------------------------------------- */
  checkout: {
    modo: 'url',
    url: '/checkout',
    urlPorKit: {},              // ex.: { '1 Unidade TURBOGELO': 'https://...', '2 Unidades TURBOGELO': 'https://...' }
    enviarSelecaoNaUrl: true,
    endpoint: '',
    dominiosPermitidos: [],
    parametrosRepassados: ['src','sck','utm_source','utm_medium','utm_campaign','utm_content','utm_term'],
    textoDemo: 'Checkout em modo demonstração: nenhum pedido foi criado e nenhum pagamento foi processado. Configure <code>checkout</code> em <code>produto.config.js</code> para ativar a compra real.',
    textoErro: 'Não foi possível abrir o pagamento agora. Tente novamente em instantes.',
  },
};
