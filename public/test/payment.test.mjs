import test from 'node:test';
import assert from 'node:assert/strict';
import {newDb} from 'pg-mem';
import {schema,repository} from '../lib/db.mjs';
import {normalize,quote,payload,validDocument} from '../lib/catalog.mjs';
import {service} from '../lib/service.mjs';
import {verify,paymentView} from '../lib/gateway.mjs';
const input=(method='pix')=>({quantidade:2,unidades:[{lado:'Frente',marca:'Fiat',modelo:'Toro',cor:'Preto',placa:'TESTE'},{lado:'Traseira',carro:'Carro personalizado',cor:'Branco'}],paymentMethod:method,freight:'gratis',installments:1,cardHash:'fake-token-for-unit-test-only',customer:{name:'Cliente de Teste',email:'teste@example.com',phone:'11999999999',document:'52998224725'},address:{street:'Rua Teste',streetNumber:'1',neighborhood:'Centro',city:'São Paulo',state:'SP',zipCode:'01001000'}});
async function setup(){const mem=newDb();const {Pool}=mem.adapters.createPg();const db=new Pool();await db.query(schema);return {db,repo:repository(db)};}
function response(p,extras={}){return {id:123,externalRef:p.externalRef,amount:p.amount,currency:'BRL',paymentMethod:p.paymentMethod,status:'waiting_payment',paidAmount:0,...extras};}
test('preços oficiais, desconto Pix e frete calculados no servidor',()=>{
 assert.equal(quote({...input(),amount:1,precoExibido:'R$ 0,01'}).amount,17541);
 assert.equal(quote({...input('boleto'),freight:'sedex'}).amount,21480);
 assert.equal(quote({...input('credit_card'),freight:'sedex'}).amount,21480);
 assert.throws(()=>quote({...input(),quantidade:3}));assert.throws(()=>quote({...input(),freight:'custom'}));
});
test('validação de CPF, quantidade, cor, endereço e parcelas',()=>{
 assert.equal(validDocument('52998224725'),true);assert.equal(validDocument('11111111111'),false);
 assert.throws(()=>normalize({...input(),customer:{...input().customer,document:'123'}}));
 assert.throws(()=>normalize({...input(),address:{...input().address,state:'XX'}}));
 assert.throws(()=>normalize({...input('credit_card'),installments:12}));
 assert.throws(()=>normalize({...input(),unidades:[{...input().unidades[0],cor:'Inexistente'}]}));
});
test('payload preserva personalização, endereço e total; cartão só por hash',()=>{
 const details=normalize(input('credit_card')),p=payload({id:'order',details},'token','https://loja.example');
 assert.equal(p.card.hash,'token');assert.equal(p.card.number,undefined);assert.equal(p.items[0].quantity,1);
 assert.equal(p.items[0].unitPrice+p.shipping.fee,p.amount);assert.equal(JSON.parse(p.metadata).unidades[0].placa,'TESTE');
 assert.equal(p.returnUrl,'https://loja.example/checkout?order=order');
});
for(const method of ['pix','boleto','credit_card'])test(`cria ${method} e consulta sem cobrar novamente`,async()=>{
 const {repo,db}=await setup();let calls=0,last;
 const svc=service(repo,async(path,p)=>{calls++;if(p){last=p;return response(p,{pix:method==='pix'?{qrcode:'test-pix-payload'}:null,boleto:method==='boleto'?{url:'https://gateway.example/boleto',digitableLine:'123'}:null});}return response(last,{status:'paid',paidAmount:last.amount});},'https://loja.example');
 const key='11111111-1111-4111-8111-111111111111';const result=await svc.create('owner',key,input(method));assert.equal(result.state,'waiting_payment');
 assert.equal((await svc.create('owner',key,input(method))).orderId,result.orderId);assert.equal(calls,1);
 const order=await repo.get(result.orderId);assert.equal(JSON.stringify(order.details).includes('fake-token'),false);
 assert.equal((await svc.refresh(order)).state,'paid');assert.equal(calls,2);await db.end();
});
test('concorrência usa reserva atômica, uma única chamada de cobrança',async()=>{
 const {repo,db}=await setup();let calls=0;
 const svc=service(repo,async(_,p)=>{calls++;await new Promise(r=>setTimeout(r,20));return response(p);},'https://loja.example');
 const key='22222222-2222-4222-8222-222222222222';const results=await Promise.all(Array.from({length:5},()=>svc.create('owner',key,input())));
 assert.equal(calls,1);assert.equal(new Set(results.map(r=>r.orderId)).size,1);await db.end();
});
test('timeout não cria nova cobrança e pode ser reconciliado por evento verificado',async()=>{
 const {repo,db}=await setup();let calls=0,last;
 const svc=service(repo,async(path,p)=>{calls++;if(p){last=p;throw Error('timeout');}return response(last,{status:'paid',paidAmount:last.amount});},'https://loja.example');
 const key='33333333-3333-4333-8333-333333333333',a=await svc.create('owner',key,input());
 assert.equal(a.state,'unknown');assert.equal((await svc.create('owner',key,input())).orderId,a.orderId);assert.equal(calls,1);
 assert.equal((await svc.refresh(await repo.get(a.orderId),'123')).state,'paid');await db.end();
});
test('mesma chave com carrinho alterado é rejeitada',async()=>{
 const {repo,db}=await setup();let calls=0;const svc=service(repo,async(_,p)=>{calls++;return response(p);},'https://loja.example');
 const key='44444444-4444-4444-8444-444444444444';await svc.create('owner',key,input());
 await assert.rejects(()=>svc.create('owner',key,{...input(),freight:'sedex'}),/tentativa/);assert.equal(calls,1);await db.end();
});
test('eventos forjados, valor divergente e pagamento parcial não confirmam pedido',()=>{
 const order={id:'abc',details:normalize(input()),transaction_id:'123'},t=response({externalRef:'abc',amount:17541,paymentMethod:'pix'});
 assert.throws(()=>verify(order,{...t,externalRef:'outro'}));assert.throws(()=>verify(order,{...t,amount:1}));
 assert.throws(()=>verify(order,{...t,status:'paid',paidAmount:1}));assert.throws(()=>verify(order,{...t,id:456}));
 assert.throws(()=>verify(order,{...t,currency:'USD'}));assert.equal(verify(order,t).status,'waiting_payment');
});
test('URLs inseguras do boleto e redirecionamento não vão ao navegador',async()=>{
 const p=await paymentView({id:1,status:'waiting_payment',redirectUrl:'javascript:alert(1)',boleto:{url:'http://inseguro',barcode:'123'}});
 assert.equal(p.redirectUrl,null);assert.equal(p.boleto.url,null);assert.equal(p.boleto.digitableLine,'123');
});
