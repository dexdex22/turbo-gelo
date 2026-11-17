'use strict';
const $=s=>document.querySelector(s), form=$('#payment-form'), money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v/100);
const params=new URLSearchParams(location.search), storageKey='turbogelo-payment-attempt';
let config,chosen,quote,busy=false,attempt,cardSDK,cardSettings,cardInit,iframeValid=false,poll;
function message(s){$('#error').textContent=s;$('#error').hidden=false;$('#error').focus();}
function notice(s){$('#notice').textContent=s;$('#notice').hidden=!s;}
function saved(){try{return JSON.parse(sessionStorage.getItem(storageKey)||'null');}catch{return null;}}
function keep(v){attempt=v;sessionStorage.setItem(storageKey,JSON.stringify(v));}
async function request(path,options={}){const r=await fetch('/api/checkout/'+path,{credentials:'same-origin',cache:'no-store',...options,headers:{'Content-Type':'application/json',...options.headers}});let b;try{b=await r.json();}catch{throw Error('Não foi possível consultar o pagamento.');}if(!r.ok){const e=Error(b.error||'Falha ao consultar pagamento.');e.status=r.status;throw e;}return b;}
function data(){const f=new FormData(form);const unidades=chosen.unidades.map((u,i)=>({...u,placa:f.get('placa'+i)||''}));return {...chosen,unidades,tracking:Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck'].map(k=>[k,params.get(k)||''])),paymentMethod:f.get('paymentMethod'),freight:f.get('freight'),installments:1,customer:Object.fromEntries(['name','email','phone','document'].map(k=>[k,f.get(k)])),address:Object.fromEntries(['street','streetNumber','complement','neighborhood','city','state','zipCode'].map(k=>[k,f.get(k)]))};}
function readSelection(){const quantidade=Number(params.get('quantidade'));if(![1,2].includes(quantidade))throw Error('Selecione seu kit na loja antes de continuar.');return {quantidade,unidades:Array.from({length:quantidade},(_,i)=>Object.fromEntries(['lado','tipo','marca','modelo','carro','cor'].map(k=>[k,params.get(`item${i+1}_${k}`)||''])))};}
function renderSelection(){chosen.unidades.forEach((u,i)=>{const div=document.createElement('div');div.className='unit';const title=document.createElement('strong');title.textContent=`Unidade ${i+1}`;const p=document.createElement('p');p.textContent=[u.lado,u.carro||[u.marca,u.modelo].filter(Boolean).join(' '),u.cor].filter(Boolean).join(' · ');const label=document.createElement('label');label.textContent='Placa personalizada (opcional)';const input=document.createElement('input');input.name='placa'+i;input.maxLength=12;input.placeholder='Texto de até 12 caracteres';label.append(input);div.append(title,p,label);$('#selection').append(div);});}
function renderFreight(){config.catalog.fretes.forEach((f,i)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='freight';input.value=f.id;input.checked=i===0;const strong=document.createElement('strong');strong.textContent=f.nome+' · '+(f.centavos?money(f.centavos):'Grátis');const small=document.createElement('small');small.textContent=f.prazo;label.append(input,strong,small);$('#freight').append(label);});}
async function updateQuote(d=data()){quote=await request('quote',{method:'POST',body:JSON.stringify(d)});$('#kit-name').textContent=quote.kit;$('#subtotal').textContent=money(quote.subtotal);$('#shipping').textContent=quote.shippingFee?money(quote.shippingFee):'Grátis';$('#total').textContent=money(quote.amount);$('#discount').textContent=d.paymentMethod==='pix'?'10% de desconto no produto, já aplicado.':'';$('#pay').textContent=d.paymentMethod==='pix'?'Gerar Pix · '+money(quote.amount):d.paymentMethod==='boleto'?'Gerar boleto · '+money(quote.amount):'Pagar com cartão · '+money(quote.amount);return quote;}
async function initCard(){
 if(cardInit)return cardInit;
 cardInit=(async()=>{
  if(!config.publicKey)throw Error('O cartão ainda não foi configurado pela loja.');
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://api.aurionfy.com/v1/js';s.onload=resolve;s.onerror=()=>reject(Error('Não foi possível carregar o pagamento com cartão.'));document.head.append(s);});
  const helper=window.ShieldHelper;cardSDK=helper?window[helper.getModuleName()]:window.AURIONFY;
  if(!cardSDK)throw Error('O serviço de cartão não ficou disponível.');
  await cardSDK.setPublicKey(config.publicKey);
  const r=await fetch('https://api.aurionfy.com/api/v1/js/get3dsSettings?publicKey='+encodeURIComponent(config.publicKey),{headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('Não foi possível verificar a autenticação do cartão. Escolha Pix ou boleto, ou tente mais tarde.');
  cardSettings=await r.json();
  if(typeof cardSettings.hideCardForm!=='boolean'||!['NONE','IFRAME','REDIRECT','SCRIPT'].includes(cardSettings.threeDSSecurityType))throw Error('Configuração de cartão não reconhecida.');
  if(cardSettings.threeDSSecurity&&!helper)throw Error('Autenticação do cartão indisponível.');
  $('#card-fields').hidden=cardSettings.hideCardForm;
  if(cardSettings.threeDSSecurityType==='IFRAME'){
    const src=new URL(cardSettings.iframeUrl);if(src.protocol!=='https:')throw Error('Formulário do cartão inválido.');
    const iframe=document.createElement('iframe');iframe.id=helper.getIframeId();iframe.src=src.href;iframe.title='Pagamento seguro com cartão';iframe.width='100%';iframe.height='400';iframe.style.border='0';$('#three-ds').append(iframe);
    helper.subscribeIframeFormValidation(v=>{iframeValid=v.hasError===false;});
  }
 })();return cardInit;
}
function cardData(){
 if(cardSettings.hideCardForm)return {number:null,holderName:null,expMonth:null,expYear:null,cvv:null};
 const exp=$('#card-expiry').value.match(/^(\d{2})\/(\d{4})$/),number=$('#card-number').value.replace(/\s/g,''),cvv=$('#card-cvv').value;
 if(!exp||+exp[1]<1||+exp[1]>12||new Date(+exp[2],+exp[1],1)<=new Date()||!/^\d{13,19}$/.test(number)||!/^\d{3,4}$/.test(cvv)||!$('#card-name').value.trim())throw Error('Confira nome, número, validade e código de segurança do cartão.');
 return {number,holderName:$('#card-name').value.trim(),expMonth:+exp[1],expYear:+exp[2],cvv};
}
function clearCard(){['#card-number','#card-cvv','#card-name','#card-expiry'].forEach(id=>$(id).value='');}
const states={creating:['Processando seu pedido','Aguarde a consulta do pagamento. Não envie outra compra.'],unknown:['Estamos conferindo seu pedido','A resposta do pagamento não foi conclusiva. Não faça outra tentativa: fale com a loja usando o número abaixo.'],waiting_payment:['Aguardando pagamento','Seu pedido foi gerado. A confirmação aparecerá aqui após o processamento.'],processing:['Pagamento em análise','Aguarde a confirmação do banco.'],approved:['Pagamento autorizado','Estamos aguardando a confirmação final do processamento.'],paid:['Pagamento confirmado','Recebemos a confirmação do pagamento pela Aurionfy.'],refused:['Pagamento recusado','Fale com a loja para verificar como tentar novamente.'],cancelled:['Pagamento cancelado','Fale com a loja se precisar de ajuda.'],refunded:['Pagamento estornado','O pagamento foi estornado. Consulte os prazos com seu banco.'],chargeback:['Pagamento contestado','Fale com a loja para acompanhar o pedido.'],pre_chargeback:['Pagamento em contestação','Fale com a loja para acompanhar o pedido.'],in_protest:['Pagamento em protesto','Fale com a loja para acompanhar o pedido.']};
function copyBox(text,label){const box=document.createElement('textarea');box.readOnly=true;box.value=text;box.setAttribute('aria-label',label);const btn=document.createElement('button');btn.type='button';btn.className='primary';btn.textContent=label;btn.onclick=async()=>{try{await navigator.clipboard.writeText(text);btn.textContent='Copiado!';}catch{box.focus();box.select();btn.textContent='Selecione e copie o código acima';}};$('#payment-details').append(box,btn);}
function showResult(o){
 clearTimeout(poll);$('.layout').hidden=true;$('.intro').hidden=true;$('#result').hidden=false;
 const [title,text]=states[o.state]||['Consultando pedido','Aguarde a confirmação do pagamento.'];$('#result-title').textContent=title;$('#result-message').textContent=text+(o.refreshFailed?' A consulta mais recente falhou; o status exibido é o último confirmado.':'');$('#order-ref').textContent='Pedido '+o.orderId+' · '+money(o.amount);$('#payment-details').replaceChildren();
 if(o.payment&&['waiting_payment','processing','approved'].includes(o.state)){
  const p=o.payment;
  if(p.pix){const img=document.createElement('img');img.src=p.pix.image;img.alt='QR Code Pix do pedido';$('#payment-details').append(img);copyBox(p.pix.qrcode,'Copiar código Pix');}
  if(p.boleto){if(p.boleto.digitableLine)copyBox(p.boleto.digitableLine,'Copiar linha digitável');if(p.boleto.url){const a=document.createElement('a');a.href=p.boleto.url;a.textContent='Abrir boleto ↗';a.target='_blank';a.rel='noopener noreferrer';a.className='support';$('#payment-details').append(a);}}
  const expiry=p.pix?.expirationDate||p.boleto?.expirationDate;if(expiry){const small=document.createElement('p');small.textContent='Validade informada: '+expiry;$('#payment-details').append(small);}
  if(p.redirectUrl){const a=document.createElement('a');a.href=p.redirectUrl;a.textContent='Continuar autenticação no banco →';a.className='support';$('#payment-details').append(a);}
 }
 if(['paid','refused','cancelled','refunded'].includes(o.state)){const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='Voltar à loja para uma nova compra';b.onclick=()=>{sessionStorage.removeItem(storageKey);location.assign('/');};$('#payment-details').append(b);}
 if(['creating','processing','waiting_payment','approved'].includes(o.state))poll=setTimeout(()=>refresh().catch(()=>{}),15000);
}
async function refresh(){if(!attempt?.orderId)return;$('#refresh').disabled=true;try{showResult(await request('status?order='+encodeURIComponent(attempt.orderId)));}catch(e){$('#result-message').textContent=e.message;notice(e.message);}finally{$('#refresh').disabled=false;}}
$('#refresh').onclick=refresh;
form.addEventListener('change',async e=>{if(!['paymentMethod','freight'].includes(e.target.name)||busy)return;$('#error').hidden=true;$('#pay').disabled=true;try{await updateQuote();const card=data().paymentMethod==='credit_card';$('#card-section').hidden=!card;$('#method-note').textContent=card?'Pagamento à vista no crédito, em 1 vez.':data().paymentMethod==='pix'?'O código Pix será gerado após a confirmação do pedido.':'O boleto será gerado após a confirmação do pedido. A compensação pode levar alguns dias.';if(card&&config.enabled)await initCard();}catch(e){message(e.message);}finally{$('#pay').disabled=!config.enabled;}});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!config.enabled)return;if(!form.reportValidity())return;
 busy=true;const d=data();const controls=[...form.querySelectorAll('input,select')];controls.forEach(c=>c.disabled=true);$('#pay').disabled=true;$('#error').hidden=true;let sent=false;
 try{
  await updateQuote(d);
  if(d.paymentMethod==='credit_card'){
   await initCard();if(cardSettings.threeDSSecurityType==='IFRAME'&&!iframeValid)throw Error('Preencha os dados do cartão no formulário seguro.');
   if(window.ShieldHelper)await window.ShieldHelper.prepareThreeDS({amount:quote.amount,installments:1});
   d.cardHash=await cardSDK.encrypt(cardData());clearCard();
   if(typeof d.cardHash!=='string')throw Error('O serviço não retornou um token de cartão válido.');
  }
  if(!attempt)keep({key:crypto.randomUUID()});
  sent=true;const o=await request('create',{method:'POST',headers:{'Idempotency-Key':attempt.key},body:JSON.stringify(d)});delete d.cardHash;
  keep({...attempt,orderId:o.orderId});showResult(o);$('#result').focus();
  if(d.paymentMethod==='credit_card'&&o.payment&&window.ShieldHelper&&['processing','waiting_payment','approved'].includes(o.state)){
   try{await window.ShieldHelper.finishThreeDS(o.payment,{disableRedirect:false});}catch{$('#result-message').textContent='A autenticação do cartão não foi concluída. Consulte o status ou continue pelo link do banco, se disponível.';}
  }
 }catch(e){
  if(sent && ![400,401,403,409,429].includes(e.status)){
   try{const o=await request('status?key='+encodeURIComponent(attempt.key));keep({...attempt,orderId:o.orderId});showResult(o);}
   catch{message('Não conseguimos confirmar o envio. Mantenha esta página aberta e tente consultar novamente. A mesma tentativa será reutilizada para evitar duplicidade.');}
  }else message(e.message);
 }finally{busy=false;controls.forEach(c=>c.disabled=false);$('#pay').disabled=!config.enabled;}
});
(async()=>{
 try{
  config=await request('config');attempt=saved();
  const order=params.get('order')||attempt?.orderId;
  if(order){keep({...attempt,orderId:order});await refresh();return;}
  if(attempt?.key){try{const o=await request('status?key='+encodeURIComponent(attempt.key));keep({...attempt,orderId:o.orderId});showResult(o);return;}catch(e){if(e.status!==404)throw e;}}
  chosen=readSelection();renderSelection();renderFreight();
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').forEach(s=>{const o=document.createElement('option');o.value=o.textContent=s;form.elements.state.append(o);});
  await updateQuote();$('#pay').disabled=!config.enabled;
  if(!config.enabled)notice('O pagamento ainda está sendo configurado. Você pode conferir os dados, mas nenhuma cobrança será criada.');
 }catch(e){notice(e.message);$('#pay').disabled=true;$('#pay').textContent='Pagamento indisponível';}
})();
