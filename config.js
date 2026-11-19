'use strict';
const { CATALOGO } = require('../_lib/catalogo');
const { chaves } = require('../_lib/aurionfy');
const { responder } = require('../_lib/http');

module.exports = (req, res) => {
  if (req.method !== 'GET') return responder(res, 405, { error: 'Método não permitido.' });
  const { publicKey, ok } = chaves();
  const desligado = String(process.env.CHECKOUT_DESATIVADO || '').toLowerCase() === 'true';
  if (!ok) console.error('[checkout] AURIONFY_PUBLIC_KEY ou AURIONFY_SECRET_KEY ausente nas variáveis da Vercel');
  responder(res, 200, { catalog: CATALOGO, publicKey: publicKey || null, enabled: ok && !desligado });
};
