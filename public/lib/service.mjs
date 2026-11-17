import {createHash,randomUUID} from 'node:crypto';
import {InputError,normalize,payload} from './catalog.mjs';
import {verify,paymentView} from './gateway.mjs';
export const digest=x=>createHash('sha256').update(x).digest('hex');
export const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function publicOrder(o){return {orderId:o.id,state:o.state,payment:o.payment||null,amount:o.details.amount};}
export function service(repo, gateway, origin) {return {
 async create(owner,key,input){
  if(!uuid(key)) throw new InputError('Identificador de tentativa inválido.');
  const details=normalize(input),fingerprint=digest(JSON.stringify(details));
  const existing=await repo.byKey(owner,key);
  if(existing){if(existing.fingerprint!==fingerprint)throw new InputError('Esta tentativa já foi enviada. Consulte o pedido antes de tentar novamente.',409);return publicOrder(existing);}
  let hash;
  if(details.paymentMethod==='credit_card') {
    hash=input.cardHash;
    if(typeof hash!=='string'||hash.length<8||hash.length>10000)throw new InputError('Não foi possível validar o cartão.');
  }
  // Atomic reservation survives retries, concurrent requests and process crashes.
  const order=await repo.reserve({id:randomUUID(),owner,key,fingerprint,details});
  if(!order){const saved=await repo.byKey(owner,key);if(saved.fingerprint!==fingerprint)throw new InputError('Tentativa já utilizada.',409);return publicOrder(saved);}
  try {
    const t=verify(order,await gateway('/transactions',payload(order,hash,origin)));
    return publicOrder(await repo.save(order.id,t,await paymentView(t)));
  }catch{
    // Aurionfy does not document idempotency. Never retry an uncertain POST.
    await repo.unknown(order.id);return publicOrder(await repo.get(order.id));
  }
 },
 async refresh(order, transactionId=order.transaction_id){
  if(!transactionId||!/^\d+$/.test(String(transactionId)))return order;
  const t=verify(order,await gateway(`/transactions/${transactionId}`));
  return repo.save(order.id,t,await paymentView(t));
 },
 async reconcile(){let updated=0,failed=0;for(const order of await repo.pending()){try{await this.refresh(order);updated++;}catch{failed++;}}return {updated,failed};}
};}
