'use strict';
/* Converte a venda da Aurionfy no formato que /checkout/payment.js espera. */
const QRCode = require('qrcode');
const { numeroPedido } = require('./aurionfy');

const ESTADOS = ['processing', 'waiting_payment', 'approved', 'paid', 'refused', 'cancelled',
  'refunded', 'chargeback', 'pre_chargeback', 'in_protest'];

async function paraCliente(tx) {
  const state = ESTADOS.includes(tx.status) ? tx.status : 'unknown';
  const payment = {
    id: tx.id,
    status: tx.status,
    secureId: tx.secureId || null,
    redirectUrl: tx.redirectUrl || (tx.threeDS && tx.threeDS.redirectUrl) || null,
    returnUrl: tx.returnUrl || (tx.threeDS && tx.threeDS.returnUrl) || null,
    threeDS: tx.threeDS || null,
  };

  if (tx.pix && tx.pix.qrcode) {
    let image = null;
    try { image = await QRCode.toDataURL(tx.pix.qrcode, { margin: 1, width: 320 }); } catch { /* sem imagem, o copia-e-cola continua */ }
    payment.pix = { qrcode: tx.pix.qrcode, image, expirationDate: tx.pix.expirationDate || null };
  }
  if (tx.boleto && (tx.boleto.url || tx.boleto.digitableLine)) {
    payment.boleto = {
      url: tx.boleto.url || null,
      digitableLine: tx.boleto.digitableLine || null,
      barcode: tx.boleto.barcode || null,
      expirationDate: tx.boleto.expirationDate || null,
    };
  }

  return { orderId: numeroPedido(tx.id), state, payment, amount: tx.amount };
}

module.exports = { paraCliente };
