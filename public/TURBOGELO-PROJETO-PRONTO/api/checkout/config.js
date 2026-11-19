import { CATALOGO } from './_catalogo.js';
import { chaves } from './_aurionfy.js';
import { responder } from './_http.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return responder(res, 405, { error: 'Método não permitido.' });
  const { publicKey, ok } = chaves();
  const desligado = String(process.env.CHECKOUT_DESATIVADO || '').toLowerCase() === 'true';
  if (!ok) console.error('[checkout] AURIONFY_PUBLIC_KEY ou AURIONFY_SECRET_KEY ausente nas variáveis da Vercel');
  responder(res, 200, { catalog: CATALOGO, publicKey: publicKey || null, enabled: ok && !desligado });
}
