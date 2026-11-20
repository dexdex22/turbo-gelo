import { gateway } from './_gateway.js';
import { ErroGateway, idDoPedido, paraCliente, completarComCookie } from './_comum.js';
import { responder } from './_http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return responder(res, 405, { error: 'Método não permitido.' });
  const g = gateway();
  const numero = new URL(req.url, 'http://x').searchParams.get('order');

  // Sem banco de dados, só dá para consultar pelo número do pedido.
  if (!numero) return responder(res, 404, { error: 'Pedido não encontrado neste navegador.' });
  const id = idDoPedido(numero, g.segredo());
  if (!id) return responder(res, 404, { error: 'Pedido não encontrado.' });

  try {
    responder(res, 200, await paraCliente(completarComCookie(req, await g.buscar(id)), g.segredo()));
  } catch (e) {
    console.error('[checkout/status]', g.nome, 'pedido', id, '→', e instanceof ErroGateway ? e.httpStatus + ' ' + e.message : e);
    if (e instanceof ErroGateway && e.httpStatus === 404) return responder(res, 404, { error: 'Pedido não encontrado.' });
    responder(res, 502, { error: 'Não foi possível consultar o pagamento agora. Tente de novo em instantes.' });
  }
}
