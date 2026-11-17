import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,createFetchMock} from 'miniflare';
import {schema,repository} from '../cloudflare/db.mjs';
const origin='https://turbogelo-loja.ecomdex9.workers.dev';
const input=(method='pix')=>({quantidade:2,unidades:[{lado:'Frente',marca:'Fiat',modelo:'Toro',cor:'Preto',placa:'TESTE'},{lado:'Traseira',carro:'Carro personalizado',cor:'Branco'}],paymentMethod:method,freight:'gratis',installments:1,cardHash:'fake-token-for-unit-test-only',customer:{name:'Cliente de Teste',email:'teste@example.com',phone:'11999999999',document:'52998224725'},address:{street:'Rua Teste',streetNumber:'1',neighborhood:'Centro',city:'São Paulo',state:'SP',zipCode:'01001000'}});
async function setup(t,enabled=false){const mock=createFetchMock();mock.disableNetConnect();const mf=new Miniflare({modules:true,scriptPath:new URL('../cloudflare/worker.js',import.meta.url).pathname,compatibilityDate:'2026-01-01',assets:{directory:new URL('../public',import.meta.url).pathname,binding:'ASSETS',routerConfig:{invoke_user_worker_ahead_of_assets:true,has_user_worker:true}},d1Databases:{DB:'test-db'},bindings:{APP_ORIGIN:origin,PAYMENTS_ENABLED:String(enabled),AURIONFY_PUBLIC_KEY:enabled?'pk-test':'',AURIONFY_SECRET_KEY:enabled?'sk-test':''},fetchMock:mock});t.after(()=>mf.dispose());const db=await mf.getD1Database('DB');await db.exec(schema.replaceAll('\n',' '));const config=await mf.dispatchFetch(origin+'/api/checkout/config');const cookie=config.headers.get('set-cookie').split(';')[0];return {mf,db,mock,cookie,config:await config.json(),req:(path,opts={})=>mf.dispatchFetch(origin+path,{...opts,headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json',...opts.headers}})};}
test('Worker real: loja, arquivos e checkout; pagamentos bloqueados sem configuração',async t=>{
 const {req,config}=await setup(t);assert.equal(config.enabled,false);
 for(const path of ['/','/app.js','/checkout','/checkout/payment.js'])assert.equal((await req(path)).status,200);
 for(const path of ['/videos/cooler-in-use.mp4','/videos/cooler-demonstration.mp4']){
  const partial=await req(path,{headers:{Range:'bytes=0-99'}});assert.equal(partial.status,206);assert.equal((await partial.arrayBuffer()).byteLength,100);assert.equal(partial.headers.get('Content-Type'),'video/mp4');
 }
 for(const path of ['/.env','/lib/db.mjs','/package.json'])assert.equal((await req(path)).status,404);
 const quote=await req('/api/checkout/quote',{method:'POST',body:JSON.stringify({...input(),amount:1})});assert.equal((await quote.json()).amount,17541);
 assert.equal((await req('/api/checkout/create',{method:'POST',body:JSON.stringify(input())})).status,503);
 assert.equal((await req('/api/checkout/quote',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'})).status,403);
 assert.equal((await req('/api/checkout/quote',{method:'POST',body:'x'.repeat(33000)})).status,413);
});
for(const method of ['pix','boleto','credit_card'])test(`Worker D1 e gateway simulado: ${method}, duplicidade, isolamento e webhook`,async t=>{
 const {req,mock,db,mf}=await setup(t,true);let calls=0,tx;
 const api=mock.get('https://api.aurionfy.com');api.intercept({path:'/v1/transactions',method:'POST'}).reply(200,async opts=>{
  calls++;const p=await new Response(opts.body).json();assert.equal(p.amount,method==='pix'?17541:19490);assert.equal(p.card?.number,undefined);if(method==='credit_card')assert.equal(p.card.hash,'fake-token-for-unit-test-only');
  tx={id:123,externalRef:p.externalRef,amount:p.amount,currency:'BRL',paymentMethod:method,status:'waiting_payment',paidAmount:0,pix:method==='pix'?{qrcode:'test-pix-payload'}:null,boleto:method==='boleto'?{url:'https://gateway.example/boleto',digitableLine:'123'}:null};return tx;
 });
 const key=crypto.randomUUID(),opts={method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(input(method))};
 const replies=await Promise.all([req('/api/checkout/create',opts),req('/api/checkout/create',opts)]);for(const r of replies)assert.equal(r.status,200);const records=await Promise.all(replies.map(r=>r.json()));assert.equal(calls,1);assert.equal(records[0].orderId,records[1].orderId);
 const settled=await (await req('/api/checkout/create',opts)).json();assert.equal(settled.state,'waiting_payment');if(method==='pix')assert.match(settled.payment.pix.image,/^data:image\/svg\+xml;base64,/);
 const order=await repository(db).get(settled.orderId);assert.equal(JSON.stringify(order.details).includes('fake-token'),false);
 const other=await mf.dispatchFetch(origin+'/api/checkout/config');assert.equal((await req('/api/checkout/status?order='+order.id,{headers:{Cookie:other.headers.get('set-cookie').split(';')[0]}})).status,404);
 api.intercept({path:'/v1/transactions/123',method:'GET'}).reply(200,{...tx,status:'paid',paidAmount:tx.amount});
 const webhook=await req('/api/checkout/webhook?order='+order.id,{method:'POST',headers:{Origin:'https://gateway.example'},body:JSON.stringify({objectId:123,data:{status:'paid'}})});assert.equal(webhook.status,200);
 assert.equal((await (await req('/api/checkout/status?order='+order.id)).json()).state,'paid');mock.assertNoPendingInterceptors();
});
test('Worker D1: falha de rede reserva tentativa; webhook falso não confirma; consulta legítima recupera',async t=>{
 const {req,mock,db}=await setup(t,true),key=crypto.randomUUID(),api=mock.get('https://api.aurionfy.com');
 api.intercept({path:'/v1/transactions',method:'POST'}).replyWithError(Error('timeout'));
 const opts={method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(input())};const a=await(await req('/api/checkout/create',opts)).json();assert.equal(a.state,'unknown');assert.equal((await(await req('/api/checkout/create',opts)).json()).orderId,a.orderId);
 api.intercept({path:'/v1/transactions/999',method:'GET'}).reply(200,{id:999,externalRef:'outro',amount:17541,currency:'BRL',paymentMethod:'pix',status:'paid',paidAmount:17541});
 assert.equal((await req('/api/checkout/webhook?order='+a.orderId,{method:'POST',body:'{"objectId":999}'})).status,503);assert.equal((await repository(db).get(a.orderId)).state,'unknown');
 api.intercept({path:'/v1/transactions/123',method:'GET'}).reply(200,{id:123,externalRef:a.orderId,amount:17541,currency:'BRL',paymentMethod:'pix',status:'paid',paidAmount:17541});
 assert.equal((await req('/api/checkout/webhook?order='+a.orderId,{method:'POST',body:'{"objectId":123}'})).status,200);assert.equal((await repository(db).get(a.orderId)).state,'paid');mock.assertNoPendingInterceptors();
});
