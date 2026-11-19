/* Cliente da API Aurionfy (https://app.aurionfy.com/llms-full.txt).
   Autenticação HTTP Basic: usuário = public key, senha = secret key.        */
import crypto from 'node:crypto';

const BASE = 'https://api.aurionfy.com/v1';

function chaves() {
  const publicKey = (process.env.AURIONFY_PUBLIC_KEY || '').trim();
  const secretKey = (process.env.AURIONFY_SECRET_KEY || '').trim();
  return { publicKey, secretKey, ok: Boolean(publicKey && secretKey) };
}

class ErroGateway extends Error {
  constructor(mensagem, httpStatus, corpo) {
    super(mensagem);
    this.httpStatus = httpStatus;
    this.corpo = corpo;
  }
}

async function chamar(metodo, caminho, corpo) {
  const { publicKey, secretKey, ok } = chaves();
  if (!ok) throw new ErroGateway('AURIONFY_PUBLIC_KEY ou AURIONFY_SECRET_KEY não configuradas na Vercel', 0);

  // A documentação pede "public:secret". Algumas contas só aceitam "secret:x";
  // se o primeiro formato der 401, tentamos o segundo (um 401 não cria venda).
  const formatos = [
    ['public:secret', publicKey + ':' + secretKey],
    ['secret:x', secretKey + ':x'],
  ];
  let resp;
  for (const [nome, par] of formatos) {
    try {
      resp = await fetch(BASE + caminho, {
        method: metodo,
        headers: {
          Authorization: 'Basic ' + Buffer.from(par).toString('base64'),
          Accept: 'application/json',
          ...(corpo ? { 'Content-Type': 'application/json' } : {}),
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new ErroGateway('Falha de rede ao chamar a Aurionfy: ' + e.message, -1);
    }
    console.log('[aurionfy] autenticação', nome, '→ HTTP', resp.status);
    if (resp.status !== 401) break;
  }

  const bruto = await resp.text();
  let dados;
  try { dados = JSON.parse(bruto); } catch { dados = { raw: bruto.slice(0, 500) }; }
  if (!resp.ok) {
    const msg = (dados && (dados.message || dados.error)) || 'HTTP ' + resp.status;
    throw new ErroGateway(Array.isArray(msg) ? msg.join('; ') : String(msg), resp.status, dados);
  }
  return dados;
}

/* O número do pedido mostrado ao cliente é "<id da Aurionfy>-<assinatura>".
   A assinatura impede que alguém consulte vendas de outras pessoas trocando o id. */
function assinatura(id) {
  const { secretKey } = chaves();
  return crypto.createHmac('sha256', 'turbogelo-pedido:' + secretKey).update(String(id)).digest('hex').slice(0, 12);
}
const numeroPedido = (id) => String(id) + '-' + assinatura(id);
function idDoPedido(numero) {
  const m = /^(\d{1,20})-([a-f0-9]{12})$/.exec(String(numero || ''));
  if (!m) return null;
  const esperado = assinatura(m[1]);
  return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(m[2])) ? m[1] : null;
}

export { chamar, chaves, ErroGateway, numeroPedido, idDoPedido };
