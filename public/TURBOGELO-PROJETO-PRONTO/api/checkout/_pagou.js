/* Gateway Pagou.ai (https://developer.pagou.ai/llms.txt).
   Variáveis na Vercel: PAGOU_API_TOKEN (chave secreta da API).
   Opcional: PAGOU_SANDBOX=true para usar o ambiente de testes.             */
import { ErroGateway, normalizar } from './_comum.js';

export const nome = 'pagou';
const token = () => (process.env.PAGOU_API_TOKEN || '').trim();
const base = () => (String(process.env.PAGOU_SANDBOX || '').toLowerCase() === 'true'
  ? 'https://api.sandbox.pagou.ai' : 'https://api.pagou.ai');

export const configurado = () => Boolean(token());
export const chavePublica = () => null;  // o cartão da Pagou usa outro componente; aqui só Pix e boleto
export const segredo = () => token();
export const aceitaCartao = false;

async function chamar(metodo, caminho, corpo) {
  let resp;
  try {
    resp = await fetch(base() + caminho, {
      method: metodo,
      headers: {
        Authorization: 'Bearer ' + token(),
        Accept: 'application/json',
        ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new ErroGateway('Falha de rede ao chamar a Pagou: ' + e.message, -1);
  }
  const bruto = await resp.text();
  let dados;
  try { dados = JSON.parse(bruto); } catch { dados = { raw: bruto.slice(0, 500) }; }
  console.log('[pagou]', metodo, caminho, '→ HTTP', resp.status, dados && dados.requestId ? 'requestId ' + dados.requestId : '');
  if (!resp.ok) {
    const detalhes = Array.isArray(dados.errors) ? dados.errors.map((e) => e.field + ': ' + e.message).join('; ') : '';
    const msg = detalhes || dados.detail || dados.title || dados.message || 'HTTP ' + resp.status;
    throw new ErroGateway(String(msg), resp.status, dados);
  }
  return dados && dados.data ? dados.data : dados;
}

const ESTADOS = {
  pending: 'waiting_payment', processing: 'processing', processed: 'processing', three_ds_required: 'processing',
  authorized: 'approved', paid: 'paid', paid_externally: 'paid', captured: 'paid', partially_paid: 'processing',
  refused: 'refused', canceled: 'cancelled', expired: 'cancelled', refunded: 'refunded',
  partially_refunded: 'refunded', chargedback: 'chargeback', in_protest: 'in_protest',
};

function converter(tx) {
  const vo = tx.voucher;
  return normalizar({
    id: tx.id,
    state: ESTADOS[tx.status] || 'unknown',
    status: tx.status,
    amount: tx.amount,
    pix: tx.pix && tx.pix.qr_code ? { qrcode: tx.pix.qr_code, expirationDate: tx.pix.expiration_date } : null,
    boleto: vo && (vo.url || vo.digitable_line || vo.barcode)
      ? { url: vo.url, digitableLine: vo.digitable_line || vo.barcode, barcode: vo.barcode, expirationDate: vo.expiration_date }
      : null,
  });
}

export async function criar(v) {
  if (v.metodo === 'credit_card') throw new ErroGateway('Cartão indisponível no momento. Escolha Pix ou boleto.', 422);
  const produtos = [{ name: v.titulo, price: v.subtotal, quantity: 1, tangible: true, sku: v.sku }];
  if (v.frete > 0) produtos.push({ name: 'Frete ' + v.nomeFrete, price: v.frete, quantity: 1, tangible: false, sku: 'frete' });
  const corpo = {
    external_ref: v.referencia,
    amount: v.amount,
    currency: 'BRL',
    method: v.metodo === 'boleto' ? 'voucher' : 'pix',
    buyer: {
      name: v.cliente.name,
      email: v.cliente.email,
      phone: v.cliente.phone,
      document: { type: v.cliente.tipoDocumento.toUpperCase(), number: v.cliente.documento },
      address: {
        street: v.endereco.street, number: v.endereco.streetNumber, complement: v.endereco.complement,
        neighborhood: v.endereco.neighborhood, city: v.endereco.city, state: v.endereco.state,
        zipCode: v.endereco.zipCode, country: 'BR',
      },
    },
    products: produtos,
    notify_url: v.urlAviso,
    metadata: v.metadata,
    ip_address: v.ip,
  };
  if (v.tracking) {
    corpo.informations = Object.entries(v.tracking).slice(0, 10).map(([key, value]) => ({ key, value: String(value).slice(0, 255) }));
  }
  return converter(await chamar('POST', '/v2/transactions', corpo));
}

export async function buscar(id) {
  if (!/^[A-Za-z0-9-]{1,64}$/.test(id)) throw new ErroGateway('id inválido', 404);
  return converter(await chamar('GET', '/v2/transactions/' + encodeURIComponent(id)));
}
