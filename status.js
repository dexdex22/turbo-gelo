'use strict';
const { chamar, idDoPedido, ErroGateway } = require('../_lib/aurionfy');
const { paraCliente } = require('../_lib/pedido');
const { responder } = require('../_lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return responder(res, 405, { error: 'Método não permitido.' });
  const url = new URL(req.url, 'http://x');
  const numero = url.searchParams.get('order');

  // Sem banco de dados, só dá para consultar pelo número do pedido.
  // Uma consulta por chave de tentativa responde 404 e o checkout segue normalmente.
  if (!numero) return responder(res, 404, { error: 'Pedido não encontrado neste navegador.' });

  const id = idDoPedido(numero);
  if (!id) return responder(res, 404, { error: 'Pedido não encontrado.' });

  try {
    const tx = await chamar('GET', '/transactions/' + encodeURIComponent(id));
    responder(res, 200, await paraCliente(tx));
  } catch (e) {
    console.error('[checkout/status] pedido', id, '→', e instanceof ErroGateway ? e.httpStatus + ' ' + e.message : e, e.corpo || '');
    if (e instanceof ErroGateway && e.httpStatus === 404) return responder(res, 404, { error: 'Pedido não encontrado.' });
    responder(res, 502, { error: 'Não foi possível consultar o pagamento agora. Tente de novo em instantes.' });
  }
};
