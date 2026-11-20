/* Gateway Mangofy (https://app.mangofy.com.br/api/doc — API V1 de pagamentos).
   Variáveis na Vercel:
     MANGOFY_API_KEY    → credencial "Authorization" fornecida pelo gestor da Mangofy
     MANGOFY_STORE_CODE → "Store Code" de Integrações > API customizada
   Opcional: MANGOFY_URL (padrão https://checkout.mangofy.com.br).          */
import { ErroGateway, normalizar } from './_comum.js';

export const nome = 'mangofy';
const apiKey = () => (process.env.MANGOFY_API_KEY || '').trim();
const storeCode = () => (process.env.MANGOFY_STORE_CODE || '').trim();
const base = () => (process.env.MANGOFY_URL || 'https://checkout.mangofy.com.br').trim().replace(/\/+$/, '');

export const configurado = () => Boolean(apiKey() && storeCode());
export const chavePublica = () => null;  // cartão não habilitado nesta integração: só Pix e boleto
export const segredo = () => apiKey() + ':' + storeCode();
export const aceitaCartao = false;

async function chamar(metodo, caminho, corpo) {
  let resp;
  try {
    resp = await fetch(base() + caminho, {
      method: metodo,
      headers: {
        Authorization: apiKey(),
        'Store-Code': storeCode(),
        Accept: 'application/json',
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new ErroGateway('Falha de rede ao chamar a Mangofy: ' + e.message, -1);
  }
  const bruto = await resp.text();
  let dados;
  try { dados = JSON.parse(bruto); } catch { dados = { message: bruto.slice(0, 300) }; }
  console.log('[mangofy]', metodo, caminho, '→ HTTP', resp.status, dados && dados.payment_status ? 'status ' + dados.payment_status : '');
  if (!resp.ok) {
    const msg = typeof dados === 'string' ? dados
      : (dados && (dados.message || dados.error || (dados.errors && JSON.stringify(dados.errors)))) || 'HTTP ' + resp.status;
    throw new ErroGateway(String(msg).slice(0, 300), resp.status, dados);
  }
  return dados;
}

const ESTADOS = {
  pending: 'waiting_payment', waiting_payment: 'waiting_payment', processing: 'processing',
  approved: 'paid', paid: 'paid', refused: 'refused', canceled: 'cancelled', cancelled: 'cancelled',
  expired: 'cancelled', refunded: 'refunded', chargeback: 'chargeback', chargedback: 'chargeback',
};

/* A resposta pode vir direto ou embrulhada em { data } / { payment }. */
function desembrulhar(d) {
  let p = d;
  for (let i = 0; i < 3 && p && typeof p === 'object' && !p.payment_code && !p.payment_status; i++) {
    p = p.data || p.payment || p.transaction || null;
  }
  return p && typeof p === 'object' ? p : d;
}

function converter(bruto, idPedido) {
  const p = desembrulhar(bruto) || {};
  const status = String(p.payment_status || p.status || '').toLowerCase();
  const total = Number(p.payment_amount || p.amount || 0);
  return normalizar({
    id: p.payment_code || idPedido,
    state: ESTADOS[status] || 'unknown',
    status: status || null,
    amount: total,
    pix: p.pix && p.pix.pix_qrcode_text ? { qrcode: p.pix.pix_qrcode_text, expirationDate: p.pix.pix_expires_at } : null,
    boleto: p.billet && p.billet.billet_digitable_line
      ? { url: p.billet.billet_url || p.billet.billet_link, digitableLine: p.billet.billet_digitable_line, expirationDate: p.billet.billet_expires_at }
      : null,
  });
}

export async function criar(v) {
  if (v.metodo === 'credit_card') throw new ErroGateway('Cartão indisponível no momento. Escolha Pix ou boleto.', 422);
  const e = v.endereco;
  const corpo = {
    external_code: v.referencia,
    payment_method: v.metodo === 'boleto' ? 'billet' : 'pix',
    payment_format: 'regular',
    installments: 1,
    payment_amount: v.amount,
    shipping_amount: v.frete,
    postback_url: v.urlAviso,
    items: [{ code: v.sku, name: v.titulo, quantity: 1, price: v.subtotal, description: v.titulo, digital_flag: false }],
    customer: {
      email: v.cliente.email,
      name: v.cliente.name,
      document: v.cliente.documento,
      phone: '55' + v.cliente.phone,
      ip: v.ip,
    },
    extra: {
      metadata: {
        pedido: v.metadata,
        entrega: [e.street + ', ' + e.streetNumber, e.complement, e.neighborhood, e.city + '/' + e.state, 'CEP ' + e.zipCode]
          .filter(Boolean).join(' - '),
        ...(v.tracking || {}),
      },
    },
  };
  if (corpo.payment_method === 'pix') corpo.pix = { expires_in_days: 1 };
  else corpo.billet = { expires_in_days: 3 };
  return converter(await chamar('POST', '/api/v1/payment', corpo));
}

export async function buscar(id) {
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) throw new ErroGateway('id inválido', 404);
  const d = await chamar('GET', '/api/v1/payment/' + encodeURIComponent(id));
  const p = desembrulhar(d) || {};
  // Formato da consulta (só nomes de campos e status, sem dados do cliente), para ajuste fino.
  console.log('[mangofy] consulta: campos', JSON.stringify(Object.keys(d || {})),
    '| campos internos', JSON.stringify(Object.keys(p)), '| status', p.payment_status || p.status);
  return converter(d, id);
}
