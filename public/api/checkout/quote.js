import { cotar, ErroPedido } from './_catalogo.js';
import { responder, origemValida, lerJson } from './_http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return responder(res, 405, { error: 'Método não permitido.' });
  if (!origemValida(req)) return responder(res, 403, { error: 'Origem inválida.' });
  try {
    responder(res, 200, cotar(await lerJson(req)));
  } catch (e) {
    if (e instanceof ErroPedido) return responder(res, e.status, { error: e.message });
    console.error('[checkout/quote]', e);
    responder(res, 500, { error: 'Não foi possível calcular o pedido.' });
  }
}
