import { CATALOGO } from './_catalogo.js';
import { gateway } from './_gateway.js';
import { responder } from './_http.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return responder(res, 405, { error: 'Método não permitido.' });
  const g = gateway();
  const desligado = String(process.env.CHECKOUT_DESATIVADO || '').toLowerCase() === 'true';
  if (!g.configurado()) console.error('[checkout] gateway', g.nome, 'sem chaves nas variáveis da Vercel');
  responder(res, 200, { catalog: CATALOGO, publicKey: g.chavePublica(), enabled: g.configurado() && !desligado });
}
