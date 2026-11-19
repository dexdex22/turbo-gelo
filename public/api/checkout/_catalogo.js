/* Catálogo e regras de preço da TURBOGELO.
   Fonte única de preços: o navegador recebe estes valores por /precos.js e
   /api/checkout/config, e o servidor recalcula tudo a partir daqui — o valor
   enviado pelo navegador nunca é usado para cobrar.                          */

const CATALOGO = {
  versao: 2,
  unidadeCentavos: 14490,
  descontoPix: 0.1,
  limiteCentavos: 30000,
  kits: [
    { qtd: 1, rotulo: '1 Unidade TURBOGELO', centavos: 14490, por: 'R$ 144,90', pix: 'R$ 130,41', comparacao: null },
    { qtd: 2, rotulo: '2 Unidades TURBOGELO', centavos: 19490, por: 'R$ 194,90', pix: 'R$ 175,41', comparacao: '2 separadas: R$ 289,80 · Kit com 2: R$ 194,90 · Economize R$ 94,90' },
  ],
  cores: {
    lista: [
      { nome: 'Branco', hex: '#F4F5F2' },
      { nome: 'Preto', hex: '#151515' },
      { nome: 'Prata', hex: '#C3C6CA' },
      { nome: 'Cinza', hex: '#6E7278' },
      { nome: 'Azul', hex: '#1F4FA3' },
      { nome: 'Vermelho', hex: '#C2262E' },
      { nome: 'Verde', hex: '#2F6B3F' },
      { nome: 'Bege', hex: '#D9C8A5' },
      { nome: 'Marrom', hex: '#6A4428' },
    ],
    indisponiveis: {},
    fotos: {},
    confirmada: false,
  },
  fretes: [
    { id: 'gratis', nome: 'Frete Grátis', prazo: 'Entrega em 5 a 7 dias', centavos: 0, preco: 'Grátis' },
    { id: 'sedex', nome: 'SEDEX', prazo: 'Entrega em 2 a 5 dias', centavos: 1990, preco: 'R$ 19,90' },
  ],
};

const LADOS = ['Frente', 'Traseira'];
const METODOS = ['pix', 'credit_card', 'boleto'];

class ErroPedido extends Error {
  constructor(mensagem, status = 400) { super(mensagem); this.status = status; }
}

const texto = (v, max) => (typeof v === 'string' ? v : '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);

/* Recalcula o pedido no servidor. Lança ErroPedido com mensagem para o cliente. */
function cotar(d) {
  if (!d || typeof d !== 'object') throw new ErroPedido('Volte à loja e selecione seu kit.');
  const quantidade = Number(d.quantidade);
  const kit = CATALOGO.kits.find((k) => k.qtd === quantidade);
  if (!kit || !Array.isArray(d.unidades) || d.unidades.length !== quantidade) {
    throw new ErroPedido('Volte à loja e selecione seu kit.');
  }

  const cores = CATALOGO.cores.lista.map((c) => c.nome);
  const unidades = d.unidades.map((u) => {
    u = u && typeof u === 'object' ? u : {};
    const un = {
      lado: texto(u.lado, 20),
      cor: texto(u.cor, 30),
      marca: texto(u.marca, 60),
      modelo: texto(u.modelo, 80),
      tipo: texto(u.tipo, 40),
      placa: texto(u.placa, 12).toUpperCase(),
    };
    const carro = texto(u.carro, 120);
    if (carro) un.carro = carro;
    if (!LADOS.includes(un.lado) || !cores.includes(un.cor)) throw new ErroPedido('Lado ou cor inválidos.');
    if (!un.carro && (!un.marca || !un.modelo)) throw new ErroPedido('Escolha a marca e o modelo do carro na loja.');
    return un;
  });

  const paymentMethod = METODOS.includes(d.paymentMethod) ? d.paymentMethod : null;
  if (!paymentMethod) throw new ErroPedido('Escolha uma forma de pagamento.');
  const frete = CATALOGO.fretes.find((f) => f.id === d.freight) || CATALOGO.fretes[0];

  const subtotal = paymentMethod === 'pix'
    ? Math.round(kit.centavos * (1 - CATALOGO.descontoPix))
    : kit.centavos;
  const shippingFee = frete.centavos;

  return {
    quantidade,
    kit: kit.rotulo,
    unidades,
    paymentMethod,
    freight: frete.id,
    subtotal,
    shippingFee,
    amount: subtotal + shippingFee,
  };
}

export { CATALOGO, cotar, ErroPedido, texto };
