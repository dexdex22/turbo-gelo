import { readFileSync } from 'node:fs';
// Uma única fonte para os valores exibidos e cobrados; nunca usa preço enviado pelo cliente.
const source = readFileSync(new URL('../public/precos.js', import.meta.url), 'utf8');
export const catalog = JSON.parse(source.slice(source.indexOf('=') + 1).replace(/;\s*$/, ''));
export class InputError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
const fail = m => { throw new InputError(m); };
const text = (v, name, max=120, optional=false) => {
  if (typeof v !== 'string') { if(optional && v == null) return ''; fail(`Preencha ${name}.`); }
  const s=v.trim(); if ((!s && !optional) || s.length>max || /[\x00-\x1f]/.test(s)) fail(`Confira ${name}.`); return s;
};
const digits = v => typeof v==='string' ? v.replace(/[.\-()\s+]/g,'') : '';
export function validDocument(s) {
  if (!/^\d{11}$|^\d{14}$/.test(s) || /^(\d)\1+$/.test(s)) return false;
  if(s.length===11) return [9,10].every(n=> {let t=0;for(let i=0;i<n;i++)t+=Number(s[i])*(n+1-i);return Number(s[n])===(t*10%11)%10;});
  return [12,13].every(n=> {let t=0,w=2;for(let i=n-1;i>=0;i--){t+=Number(s[i])*w;w=w===9?2:w+1;}return Number(s[n])===(t%11<2?0:11-t%11);});
}
export function selection(input) {
  const q=Number(input.quantidade); const kit=catalog.kits.find(k=>k.qtd===q);
  if(!kit || !Array.isArray(input.unidades) || input.unidades.length!==q) fail('Volte à loja e selecione seu kit.');
  const unidades=input.unidades.map(u=>{
    if(!u || typeof u!=='object') fail('Confira o modelo do carro.');
    const r={lado:text(u.lado,'o lado'),cor:text(u.cor,'a cor')};
    if(!['Frente','Traseira'].includes(r.lado) || !catalog.cores.lista.some(c=>c.nome===r.cor)) fail('Lado ou cor inválidos.');
    if(u.carro) r.carro=text(u.carro,'o carro',200);
    else {r.marca=text(u.marca,'a marca');r.modelo=text(u.modelo,'o modelo');}
    r.tipo=text(u.tipo,'o tipo',60,true); r.placa=text(u.placa,'a placa personalizada',12,true);
    return r;
  });
  return {quantidade:q,kit:kit.rotulo,unidades};
}
export function quote(input) {
  const selected=selection(input);
  if(!['pix','boleto','credit_card'].includes(input.paymentMethod)) fail('Escolha a forma de pagamento.');
  const shipping=catalog.fretes.find(f=>f.id===input.freight);
  if(!shipping) fail('Escolha o frete.');
  const base=catalog.kits.find(k=>k.qtd===selected.quantidade).centavos;
  const subtotal=input.paymentMethod==='pix'?Math.round(base*(1-catalog.descontoPix)):base;
  return {...selected,paymentMethod:input.paymentMethod,freight:shipping.id,subtotal,shippingFee:shipping.centavos,amount:subtotal+shipping.centavos};
}
export function normalize(input) {
  const q=quote(input), c=input.customer||{}, a=input.address||{};
  const doc=digits(c.document), phone=digits(c.phone);
  if(!validDocument(doc)) fail('Confira o CPF ou CNPJ.');
  if(!/^\d{10,13}$/.test(phone)) fail('Confira o telefone com DDD.');
  const email=text(c.email,'o e-mail',254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Confira o e-mail.');
  const customer={name:text(c.name,'o nome completo'),email,phone,document:{type:doc.length===11?'cpf':'cnpj',number:doc}};
  const address={}; for(const k of ['street','streetNumber','neighborhood','city']) address[k]=text(a[k],k);
  address.complement=text(a.complement,'o complemento',120,true);address.zipCode=digits(a.zipCode); address.country='BR';
  address.state=text(a.state,'o estado',2).toUpperCase();
  if(!/^\d{8}$/.test(address.zipCode) || !'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').includes(address.state)) fail('Confira CEP e estado.');
  if(q.paymentMethod==='credit_card' && Number(input.installments)!==1) fail('Pagamento com cartão disponível em 1 vez.');
  const tracking={};for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck']){if(input.tracking?.[k])tracking[k]=text(input.tracking[k],k,500);}
  return {...q,customer,address,tracking,installments:q.paymentMethod==='credit_card'?1:undefined};
}
export function payload(order, hash, origin) {
  const d=order.details;
  return {amount:d.amount,paymentMethod:d.paymentMethod,customer:d.customer,
    items:[{title:d.kit,unitPrice:d.subtotal,quantity:1,tangible:true,externalRef:`turbogelo-kit-${d.quantidade}`}],
    shipping:{fee:d.shippingFee,address:d.address},externalRef:order.id,
    metadata:JSON.stringify({unidades:d.unidades,frete:d.freight}),tracking:d.tracking,
    postbackUrl:`${origin}/api/checkout/webhook?order=${order.id}`,returnUrl:`${origin}/checkout?order=${order.id}`,
    ...(d.paymentMethod==='credit_card'?{installments:1,card:{hash}}:{})};
}
