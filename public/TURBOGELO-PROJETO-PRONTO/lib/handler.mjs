import {randomBytes,timingSafeEqual} from 'node:crypto';
import {catalog,quote,InputError} from './catalog.mjs';
import {database,repository} from './db.mjs';
import {aurionfy} from './gateway.mjs';
import {digest,uuid,publicOrder,service} from './service.mjs';
export function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body));}
async function body(req){
 if(req.body!==undefined){const b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(JSON.stringify(b).length>32000)throw new InputError('Dados muito grandes.',413);return b;}
 let raw='';for await(const c of req){raw+=c;if(raw.length>32000)throw new InputError('Dados muito grandes.',413);}try{return JSON.parse(raw||'{}');}catch{throw new InputError('Dados inválidos.');}
}
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 try{
  const origin=process.env.APP_ORIGIN;
  if(!origin||(!origin.startsWith('https://')&&!origin.startsWith('http://localhost:')))throw new InputError('Pagamento ainda não configurado. Fale com a loja.',503);
  const u=new URL(req.url,origin),action=u.pathname.split('/').pop();
  if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Método não permitido.'});
  if(req.method==='POST'&&!['webhook','reconcile'].includes(action)&&req.headers.origin!==origin)throw new InputError('Origem inválida.',403);
  const cookies=req.headers.cookie||'';let sid=/(?:^|;\s*)tg_session=([a-f0-9]{64})(?:;|$)/.exec(cookies)?.[1];
  if(action==='config'&&req.method==='GET'){
    if(!sid){sid=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`tg_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${origin.startsWith('https:')?'; Secure':''}`);}
    return json(res,200,{catalog,publicKey:process.env.AURIONFY_PUBLIC_KEY||'',enabled:process.env.PAYMENTS_ENABLED==='true'&&!!process.env.AURIONFY_PUBLIC_KEY&&!!process.env.AURIONFY_SECRET_KEY&&!!process.env.DATABASE_URL});
  }
  if(action==='quote'&&req.method==='POST')return json(res,200,quote(await body(req)));
  if(!process.env.DATABASE_URL)throw new InputError('Pagamento ainda não configurado. Fale com a loja.',503);
  const repo=repository(database()),svc=service(repo,aurionfy,origin);
  if(action==='reconcile'&&req.method==='POST'){
    const secret=process.env.CRON_SECRET;
    if(!secret||secret.length<32||!equal(req.headers.authorization,`Bearer ${secret}`))throw new InputError('Não autorizado.',401);
    return json(res,200,await svc.reconcile());
  }
  if(action==='webhook'&&req.method==='POST'){
    if(!uuid(u.searchParams.get('order')))throw new InputError('Evento inválido.');
    const order=await repo.get(u.searchParams.get('order'));
    if(!order)return json(res,200,{received:true});
    const b=await body(req);
    if(!/^\d+$/.test(String(b.objectId)))throw new InputError('Evento inválido.');
    if(!await repo.limit(`webhook:${order.id}`,12,60))throw new InputError('Aguarde.',429);
    // Ignore event data and URL. Only the fixed authenticated API can confirm payment.
    await svc.refresh(order,String(b.objectId));return json(res,200,{received:true});
  }
  if(!sid)throw new InputError('Reabra o checkout para continuar.',401);
  const owner=digest(sid);
  if(action==='create'&&req.method==='POST'){
    if(process.env.PAYMENTS_ENABLED!=='true'||!process.env.AURIONFY_PUBLIC_KEY||!process.env.AURIONFY_SECRET_KEY)throw new InputError('Pagamento ainda não disponível. Fale com a loja.',503);
    if(!await repo.limit(`create:${owner}`,10,3600))throw new InputError('Muitas tentativas. Aguarde ou fale com a loja.',429);
    // A global ceiling also protects against creating fresh anonymous sessions.
    if(!await repo.limit('create:global',120,60))throw new InputError('Tente novamente em instantes.',429);
    const b=await body(req);return json(res,200,await svc.create(owner,req.headers['idempotency-key'],b));
  }
  if(action==='status'&&req.method==='GET'){
    const id=u.searchParams.get('order'),key=u.searchParams.get('key');if(!uuid(id)&&!uuid(key))throw new InputError('Pedido inválido.');
    let order=uuid(id)?await repo.get(id):await repo.byKey(owner,key);if(!order||order.owner!==owner)throw new InputError('Pedido não encontrado neste navegador.',404);
    if(!await repo.limit(`status:${owner}`,20,60))throw new InputError('Aguarde alguns segundos.',429);
    if(order.transaction_id&&(!order.checked_at||Date.now()-new Date(order.checked_at).getTime()>12000)){
      try{order=await svc.refresh(order);}catch{return json(res,200,{...publicOrder(order),refreshFailed:true});}
    }
    return json(res,200,publicOrder(order));
  }
  return json(res,404,{error:'Rota não encontrada.'});
 }catch(e){return json(res,e instanceof InputError?e.status:503,{error:e instanceof InputError?e.message:'Não foi possível consultar o pagamento agora. Tente consultar o pedido novamente.'});}
}
