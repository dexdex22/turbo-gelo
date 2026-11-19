/* Utilidades HTTP comuns às rotas /api/checkout/*. */

function responder(res, status, corpo) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corpo));
}

const host = (req) => String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();

/* Só aceita POST vindo do próprio site (bloqueia formulários de outros domínios). */
function origemValida(req) {
  const origem = req.headers.origin;
  if (!origem) return false;
  try { return new URL(origem).host === host(req); } catch { return false; }
}

async function lerJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return null; } }
  const partes = [];
  let total = 0;
  for await (const pedaco of req) {
    const c = Buffer.isBuffer(pedaco) ? pedaco : Buffer.from(pedaco);
    total += c.length;
    if (total > 64 * 1024) return null;
    partes.push(c);
  }
  try { return JSON.parse(Buffer.concat(partes).toString('utf8') || 'null'); } catch { return null; }
}

function ipCliente(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return ip || undefined;
}

export { responder, host, origemValida, lerJson, ipCliente };
