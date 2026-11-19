/* Escolhe o gateway pela variável GATEWAY na Vercel: "pagou" ou "aurionfy" (padrão). */
import * as aurionfy from './_aurionfy.js';
import * as pagou from './_pagou.js';

export function gateway() {
  return String(process.env.GATEWAY || '').trim().toLowerCase() === 'pagou' ? pagou : aurionfy;
}
