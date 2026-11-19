/* Escolhe o gateway pela variável GATEWAY na Vercel:
   "mangofy", "pagou" ou "aurionfy" (padrão quando a variável não existe). */
import * as aurionfy from './_aurionfy.js';
import * as pagou from './_pagou.js';
import * as mangofy from './_mangofy.js';

const GATEWAYS = { aurionfy, pagou, mangofy };

export function gateway() {
  return GATEWAYS[String(process.env.GATEWAY || '').trim().toLowerCase()] || aurionfy;
}
