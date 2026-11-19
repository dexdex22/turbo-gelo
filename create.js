'use strict';
const { cotar, ErroPedido, texto } = require('../_lib/catalogo');
const { chamar, chaves, ErroGateway } = require('../_lib/aurionfy');
const { paraCliente } = require('../_lib/pedido');
const { responder, origemValida, lerJson, host, ipCliente } = require('../_lib/http');

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const TRACKING = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'xtracky_lead_id'];
const digitos = (v) => String(v || '').replace(/\D/g, '');

function cpfValido(c) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
  for (const n of [9, 10]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(c[n])) return false;
  }
  return true;
}
function cnpjValido(c) {
  if (!/^\d{14}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (n) => {
    let s = 0, p = n - 7;
    for (let i = 0; i < n; i++) { s += Number(c[i]) * p--; if (p < 2) p = 9; }
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}

function cliente(c) {
  c = c && typeof c === 'object' ? c : {};
  const name = texto(c.name, 50);
  const email = texto(c.email, 50).toLowerCase();
  const phone = digitos(c.phone).replace(/^55(?=\d{10,11}$)/, '');
  const doc = digitos(c.document);
  if (name.split(/\s+/).length < 2) throw new ErroPedido('Informe seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new ErroPedido('Confira seu e-mail.');
  if (!/^\d{10,11}$/.test(phone)) throw new ErroPedido('Informe o telefone com DDD.');
  const tipo = doc.length === 11 ? 'cpf' : doc.length === 14 ? 'cnpj' : null;
  if (!(tipo === 'cpf' ? cpfValido(doc) : tipo === 'cnpj' ? cnpjValido(doc) : false)) throw new ErroPedido('Confira o CPF ou CNPJ.');
  return { name, email, phone, document: { number: doc, type: tipo } };
}

function endereco(a) {
  a = a && typeof a === 'object' ? a : {};
  const e = {
    street: texto(a.street, 50),
    streetNumber: digitos(a.streetNumber).slice(0, 10) || '0',
    complement: texto(a.complement, 50) || undefined,
    neighborhood: texto(a.neighborhood, 50),
    city: texto(a.city, 50),
    state: texto(a.state, 2).toUpperCase(),
    zipCode: digitos(a.zipCode),
    country: 'BR',
  };
  if (!/^\d{8}$/.test(e.zipCode)) throw new ErroPedido('Confira o CEP.');
  if (!UFS.includes(e.state)) throw new ErroPedido('Selecione o estado.');
  if (!e.street || !e.neighborhood || !e.city) throw new ErroPedido('Preencha rua, bairro e cidade.');
  return e;
}

/* Texto curto com a personalização de cada unidade, para aparecer na venda. */
function resumoUnidades(unidades) {
  return unidades.map((u, i) => [
    'Un' + (i + 1) + ':', u.lado, u.carro || [u.marca, u.modelo].filter(Boolean).join(' '), u.cor,
    u.placa ? 'Placa ' + u.placa : 'Sem placa',
  ].join(' ')).join(' | ');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método não permitido.' });
  if (!origemValida(req)) return responder(res, 403, { error: 'Origem inválida.' });
  if (!chaves().ok) {
    console.error('[checkout/create] AURIONFY_PUBLIC_KEY ou AURIONFY_SECRET_KEY ausente nas variáveis da Vercel');
    return responder(res, 409, { error: 'O pagamento está indisponível no momento. Fale com a loja.' });
  }

  let d, pedido, venda;
  try {
    d = await lerJson(req);
    pedido = cotar(d);
    const customer = cliente(d.customer);
    const address = endereco(d.address);

    venda = {
      amount: pedido.amount,
      paymentMethod: pedido.paymentMethod,
      items: [{
        title: ('TURBOGELO ' + pedido.kit.replace(' TURBOGELO', '')).slice(0, 50),
        unitPrice: pedido.subtotal,
        quantity: 1,
        tangible: true,
        externalRef: 'kit-' + pedido.quantidade,
      }],
      shipping: { fee: pedido.shippingFee, address },
      customer,
      metadata: JSON.stringify({ kit: pedido.kit, frete: pedido.freight, unidades: resumoUnidades(pedido.unidades) }),
      externalRef: texto(req.headers['idempotency-key'], 60) || undefined,
      ip: ipCliente(req),
      postbackUrl: 'https://' + host(req) + '/api/checkout/postback',
      returnUrl: 'https://' + host(req) + '/checkout/',
    };

    if (pedido.paymentMethod === 'credit_card') {
      if (typeof d.cardHash !== 'string' || !d.cardHash || d.cardHash.length > 10000) {
        throw new ErroPedido('Não recebemos os dados do cartão. Preencha novamente.');
      }
      venda.installments = 1;
      venda.card = { hash: d.cardHash };
    }

    const tracking = {};
    const t = d.tracking && typeof d.tracking === 'object' ? d.tracking : {};
    TRACKING.forEach((k) => { const v = texto(t[k], 200); if (v) tracking[k] = v; });
    if (Object.keys(tracking).length) venda.tracking = tracking;
  } catch (e) {
    if (e instanceof ErroPedido) return responder(res, e.status, { error: e.message });
    console.error('[checkout/create] erro ao montar a venda', e);
    return responder(res, 400, { error: 'Confira os dados do pedido.' });
  }

  try {
    const tx = await chamar('POST', '/transactions', venda);
    console.log('[checkout/create] venda', tx.id, pedido.paymentMethod, tx.status, tx.amount);
    responder(res, 200, await paraCliente(tx));
  } catch (e) {
    if (!(e instanceof ErroGateway)) {
      console.error('[checkout/create] erro inesperado', e);
      return responder(res, 502, { error: 'Não foi possível gerar o pagamento agora.' });
    }
    // Este log é o que aparece em Vercel → Logs quando a Aurionfy recusa a venda.
    console.error('[checkout/create] Aurionfy respondeu', e.httpStatus, '-', e.message, JSON.stringify(e.corpo || {}).slice(0, 1500));
    if (e.httpStatus === 401 || e.httpStatus === 403) {
      return responder(res, 409, { error: 'O pagamento está indisponível no momento. Fale com a loja.' });
    }
    if (e.httpStatus === 429) return responder(res, 429, { error: 'Muitas tentativas. Aguarde um minuto e tente de novo.' });
    if (e.httpStatus >= 400 && e.httpStatus < 500) {
      return responder(res, 400, { error: 'Não foi possível gerar o pagamento: ' + e.message });
    }
    responder(res, 502, { error: 'Não foi possível gerar o pagamento agora.' });
  }
};
