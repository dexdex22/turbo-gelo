/* Gateway Aurionfy (https://app.aurionfy.com/llms-full.txt).
   Variáveis na Vercel: AURIONFY_PUBLIC_KEY e AURIONFY_SECRET_KEY.          */
import { ErroGateway, normalizar } from './_comum.js';

const BASE = 'https://api.aurionfy.com/v1';
export const nome = 'aurionfy';

function chaves() {
  return {
    publicKey: (process.env.AURIONFY_PUBLIC_KEY || '').trim(),
    secretKey: (process.env.AURIONFY_SECRET_KEY || '').trim(),
  };
}
export const configurado = () => Boolean(chaves().publicKey && chaves().secretKey);
export const chavePublica = () => chaves().publicKey || null;
export const segredo = () => chaves().secretKey;
export const aceitaCartao = true;

async function chamar(metodo, caminho, corpo) {
  const { publicKey, secretKey } = chaves();
  // A documentação pede "public:secret". Algumas contas só aceitam "secret:x";
  // se o primeiro formato der 401, tentamos o segundo (um 401 não cria venda).
  const formatos = [['public:secret', publicKey + ':' + secretKey], ['secret:x', secretKey + ':x']];
  let resp;
  for (const [rotulo, par] of formatos) {
    try {
      resp = await fetch(BASE + caminho, {
        method: metodo,
        headers: {
          Authorization: 'Basic ' + Buffer.from(par).toString('base64'),
          Accept: 'application/json',
          ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new ErroGateway('Falha de rede ao chamar a Aurionfy: ' + e.message, -1);
    }
    console.log('[aurionfy] autenticação', rotulo, '→ HTTP', resp.status);
    if (resp.status !== 401) break;
  }
  const bruto = await resp.text();
  let dados;
  try { dados = JSON.parse(bruto); } catch { dados = { raw: bruto.slice(0, 500) }; }
  if (!resp.ok) {
    const msg = (dados && (dados.message || dados.error)) || 'HTTP ' + resp.status;
    throw new ErroGateway(Array.isArray(msg) ? msg.join('; ') : String(msg), resp.status, dados);
  }
  return dados;
}

const ESTADOS = ['processing', 'waiting_payment', 'approved', 'paid', 'refused', 'cancelled',
  'refunded', 'chargeback', 'pre_chargeback', 'in_protest'];

function converter(tx) {
  return normalizar({
    id: tx.id,
    state: ESTADOS.includes(tx.status) ? tx.status : 'unknown',
    status: tx.status,
    amount: tx.amount,
    pix: tx.pix && tx.pix.qrcode ? { qrcode: tx.pix.qrcode, expirationDate: tx.pix.expirationDate } : null,
    boleto: tx.boleto ? { url: tx.boleto.url, digitableLine: tx.boleto.digitableLine, barcode: tx.boleto.barcode, expirationDate: tx.boleto.expirationDate } : null,
    redirectUrl: tx.redirectUrl || (tx.threeDS && tx.threeDS.redirectUrl),
    returnUrl: tx.returnUrl || (tx.threeDS && tx.threeDS.returnUrl),
    threeDS: tx.threeDS,
    secureId: tx.secureId,
  });
}

/* v = venda neutra montada em create.js */
export async function criar(v) {
  const corpo = {
    amount: v.amount,
    paymentMethod: v.metodo,
    items: [{ title: v.titulo, unitPrice: v.subtotal, quantity: 1, tangible: true, externalRef: v.sku }],
    shipping: {
      fee: v.frete,
      address: {
        street: v.endereco.street, streetNumber: v.endereco.streetNumber, complement: v.endereco.complement,
        neighborhood: v.endereco.neighborhood, city: v.endereco.city, state: v.endereco.state,
        zipCode: v.endereco.zipCode, country: 'BR',
      },
    },
    customer: {
      name: v.cliente.name, email: v.cliente.email, phone: v.cliente.phone,
      document: { number: v.cliente.documento, type: v.cliente.tipoDocumento },
    },
    metadata: v.metadata,
    externalRef: v.referencia,
    ip: v.ip,
    postbackUrl: v.urlAviso,
    returnUrl: v.urlRetorno,
  };
  if (v.metodo === 'credit_card') { corpo.installments = 1; corpo.card = { hash: v.cartao }; }
  if (v.tracking) corpo.tracking = v.tracking;
  return converter(await chamar('POST', '/transactions', corpo));
}

export async function buscar(id) {
  if (!/^\d{1,20}$/.test(id)) throw new ErroGateway('id inválido', 404);
  return converter(await chamar('GET', '/transactions/' + id));
}
