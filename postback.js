'use strict';
/* Recebe os avisos da Aurionfy. Eles não têm assinatura, então servem só de
   aviso: o status real sempre é lido de GET /transactions/{id} em status.js.
   Fica registrado nos logs da Vercel para conferência.                      */
const { responder, lerJson } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método não permitido.' });
  const aviso = await lerJson(req);
  const d = (aviso && aviso.data) || {};
  console.log('[postback]', aviso && aviso.type, 'venda', aviso && aviso.objectId, 'status', d.status, 'valor', d.amount);
  responder(res, 200, { ok: true });
};
