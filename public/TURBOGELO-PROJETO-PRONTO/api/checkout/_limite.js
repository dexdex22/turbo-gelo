/* Limite de tentativas de pagamento com cartão, contra "teste de cartão" (carding).
   Fica na memória da função: não é perfeito (cada instância da Vercel tem a sua
   contagem), mas freia ataques simples. Para proteção total, crie também uma regra
   de "Rate Limit" no Firewall da Vercel para /api/checkout/create.          */
const POR_IP = { max: 5, janela: 15 * 60 * 1000 };   // 5 tentativas por IP a cada 15 min
const GERAL = { max: 40, janela: 10 * 60 * 1000 };   // 40 tentativas por instância a cada 10 min
const tentativas = new Map();
let gerais = [];

function recentes(lista, janela, agora) { return lista.filter((t) => agora - t < janela); }

/* Devolve true se a tentativa pode seguir (e a registra). */
export function liberarCartao(ip) {
  const agora = Date.now();
  gerais = recentes(gerais, GERAL.janela, agora);
  const chave = ip || 'sem-ip';
  const doIp = recentes(tentativas.get(chave) || [], POR_IP.janela, agora);
  if (doIp.length >= POR_IP.max || gerais.length >= GERAL.max) {
    tentativas.set(chave, doIp);
    return false;
  }
  doIp.push(agora); gerais.push(agora);
  tentativas.set(chave, doIp);
  if (tentativas.size > 5000) tentativas.clear();  // não deixa a memória crescer sem fim
  return true;
}
