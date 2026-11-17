import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {catalog,quote} from '../lib/catalog.mjs';
const html=readFileSync(new URL('../public/checkout/index.html',import.meta.url),'utf8'),js=readFileSync(new URL('../public/checkout/payment.js',import.meta.url),'utf8');
const pause=()=>new Promise(r=>setTimeout(r,20));
async function page({enabled=false,method='pix',storage,createError=false}={}){
 const dom=new JSDOM(html,{url:'https://loja.example/checkout?quantidade=1&item1_lado=Frente&item1_marca=Fiat&item1_modelo=Toro&item1_cor=Preto',runScripts:'outside-only'}),w=dom.window,calls=[];
 if(storage)w.sessionStorage.setItem('turbogelo-payment-attempt',JSON.stringify(storage));
 w.fetch=async(url,opt={})=>{calls.push({url,opt});let result;
  if(url.endsWith('/config'))result={catalog,publicKey:'pk_test',enabled};
  else if(url.endsWith('/quote'))result=quote(JSON.parse(opt.body));
  else if(url.endsWith('/create')){if(createError)throw Error('connection lost');result={orderId:'11111111-1111-4111-8111-111111111111',state:'waiting_payment',amount:13041,payment:method==='boleto'?{boleto:{url:'https://boleto.example/file',digitableLine:'123'}}:{pix:{qrcode:'fake-pix',image:'data:image/png;base64,',expirationDate:'2026-12-01'}}};}
  else if(url.includes('/status?'))result={orderId:'11111111-1111-4111-8111-111111111111',state:'unknown',amount:13041};
  else throw Error('Unexpected route '+url);
  return {ok:true,json:async()=>result};
 };
 w.eval(js);await pause();return {dom,w,calls};
}
function fill(w){const f=w.document.querySelector('form');for(const [k,v]of Object.entries({name:'Cliente Teste',email:'teste@example.com',phone:'11999999999',document:'52998224725',street:'Rua Teste',streetNumber:'1',neighborhood:'Centro',city:'São Paulo',state:'SP',zipCode:'01001000'}))f.elements.namedItem(k).value=v;return f;}
test('checkout desabilitado não permite cobrança e mostra preços corretos',async()=>{const {dom,w,calls}=await page();assert.equal(w.document.querySelector('#pay').disabled,true);assert.match(w.document.querySelector('#total').textContent,/130,41/);assert.match(w.document.querySelector('#notice').textContent,/nenhuma cobrança/);assert.equal(calls.some(x=>x.url.endsWith('/create')),false);dom.window.close();});
for(const method of ['pix','boleto'])test(`interface de ${method} mostra código e bloqueia duplo envio`,async()=>{const {dom,w,calls}=await page({enabled:true,method});const f=fill(w);f.querySelector(`[value=${method}]`).checked=true;f.dispatchEvent(new w.Event('submit',{cancelable:true}));f.dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();assert.equal(calls.filter(x=>x.url.endsWith('/create')).length,1);assert.equal(w.document.querySelector('#result').hidden,false);assert.equal(w.document.querySelector('textarea').value,method==='pix'?'fake-pix':'123');const body=JSON.parse(calls.find(x=>x.url.endsWith('/create')).opt.body);assert.equal(body.customer.document,'52998224725');assert.equal(body.card,undefined);dom.window.close();});
test('falha de rede recupera tentativa existente sem reenviar cobrança',async()=>{const {dom,w,calls}=await page({enabled:true,createError:true});fill(w).dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();assert.match(w.document.querySelector('#result-title').textContent,/conferindo/);assert.equal(calls.filter(x=>x.url.endsWith('/create')).length,1);assert(calls.some(x=>x.url.includes('status?key=')));dom.window.close();});
test('recarregar checkout com pedido existente só consulta status',async()=>{const {dom,w,calls}=await page({enabled:true,storage:{key:'some-key',orderId:'11111111-1111-4111-8111-111111111111'}});assert.match(w.document.querySelector('#result-title').textContent,/conferindo/);assert.equal(calls.some(x=>x.url.endsWith('/create')),false);dom.window.close();});
test('cartão tokeniza no navegador e envia só hash; prepara e finaliza 3DS',async()=>{
 const {dom,w,calls}=await page({enabled:true});const f=fill(w),events=[];
 const oldFetch=w.fetch;w.fetch=async(url,opt={})=>{
  if(url.includes('get3dsSettings'))return {ok:true,json:async()=>({hideCardForm:false,threeDSSecurity:false,threeDSSecurityType:'NONE'})};
  if(url.endsWith('/create')){calls.push({url,opt});return {ok:true,json:async()=>({orderId:'11111111-1111-4111-8111-111111111111',state:'processing',amount:14490,payment:{id:123,status:'processing',amount:14490,paymentMethod:'credit_card'}})};}
  return oldFetch(url,opt);
 };
 w.AURIONFY={setPublicKey:async pk=>events.push(['key',pk]),encrypt:async c=>{events.push(['encrypt',c.expMonth]);return 'tokenized-card-test';}};
 w.ShieldHelper={getModuleName:()=> 'AURIONFY',prepareThreeDS:async d=>events.push(['prepare',d.amount]),finishThreeDS:async t=>events.push(['finish',t.id])};
 const append=w.document.head.append.bind(w.document.head);w.document.head.append=(...els)=>{append(...els);for(const el of els)if(el.tagName==='SCRIPT')queueMicrotask(()=>el.onload());};
 const radio=f.querySelector('[value=credit_card]');radio.checked=true;radio.dispatchEvent(new w.Event('change',{bubbles:true}));await pause();
 w.document.querySelector('#card-number').value='4111111111111111';w.document.querySelector('#card-name').value='TESTE';w.document.querySelector('#card-cvv').value='123';w.document.querySelector('#card-expiry').value='12/2035';
 f.dispatchEvent(new w.Event('submit',{cancelable:true}));await pause();
 const sent=calls.find(c=>c.url.endsWith('/create'));assert(sent);assert.equal(JSON.parse(sent.opt.body).cardHash,'tokenized-card-test');assert(!sent.opt.body.includes('4111111111111111'));assert(!JSON.stringify(w.sessionStorage).includes('4111111111111111'));
 assert.deepEqual(events.map(x=>x[0]),['key','prepare','encrypt','finish']);assert.equal(events[1][1],14490);assert.equal(w.document.querySelector('#card-cvv').value,'');dom.window.close();
});
