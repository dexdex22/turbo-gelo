/* Partes comuns aos gateways: erro padrão, formato da venda e número do pedido. */
import crypto from 'node:crypto';
import QRCode from 'qrcode';

export class ErroGateway extends Error {
  constructor(mensagem, httpStatus, corpo) {
    super(mensagem);
    this.httpStatus = httpStatus;
    this.corpo = corpo;
  }
}

const limpo = (v) => (v === undefined || v === '' ? null : v);

/* Formato único, independente do gateway. */
export function normalizar(t) {
  return {
    id: String(t.id),
    state: t.state,
    status: t.status,
    amount: t.amount,
    pix: t.pix ? { qrcode: t.pix.qrcode, expirationDate: limpo(t.pix.expirationDate) } : null,
    boleto: t.boleto ? {
      url: limpo(t.boleto.url), digitableLine: limpo(t.boleto.digitableLine),
      barcode: limpo(t.boleto.barcode), expirationDate: limpo(t.boleto.expirationDate),
    } : null,
    redirectUrl: limpo(t.redirectUrl),
    returnUrl: limpo(t.returnUrl),
    threeDS: t.threeDS || null,
    secureId: limpo(t.secureId),
  };
}

/* Número do pedido mostrado ao cliente: "<id no gateway>-<assinatura>".
   A assinatura impede consultar vendas de outras pessoas trocando o id.     */
function assinatura(id, segredo) {
  return crypto.createHmac('sha256', 'turbogelo-pedido:' + segredo).update(String(id)).digest('hex').slice(0, 12);
}
export const numeroPedido = (id, segredo) => String(id) + '-' + assinatura(id, segredo);
export function idDoPedido(numero, segredo) {
  const m = /^([A-Za-z0-9-]{1,64})-([a-f0-9]{12})$/.exec(String(numero || ''));
  if (!m) return null;
  return crypto.timingSafeEqual(Buffer.from(assinatura(m[1], segredo)), Buffer.from(m[2])) ? m[1] : null;
}

/* Resposta no formato que /checkout/payment.js espera. */
export async function paraCliente(v, segredo) {
  const payment = {
    id: v.id, status: v.status, secureId: v.secureId,
    redirectUrl: v.redirectUrl, returnUrl: v.returnUrl, threeDS: v.threeDS,
  };
  if (v.pix && v.pix.qrcode) {
    let image = null;
    try { image = await QRCode.toDataURL(v.pix.qrcode, { margin: 1, width: 320 }); } catch { /* o copia-e-cola continua */ }
    payment.pix = { qrcode: v.pix.qrcode, image, expirationDate: v.pix.expirationDate };
  }
  if (v.boleto && (v.boleto.url || v.boleto.digitableLine)) payment.boleto = v.boleto;
  return { orderId: numeroPedido(v.id, segredo), state: v.state, payment, amount: v.amount };
}
