export const catalog={"versao":2,"unidadeCentavos":14490,"descontoPix":0.1,"limiteCentavos":30000,"kits":[{"qtd":1,"rotulo":"1 Unidade TURBOGELO","centavos":14490,"por":"R$ 144,90","pix":"R$ 130,41","comparacao":null},{"qtd":2,"rotulo":"2 Unidades TURBOGELO","centavos":19490,"por":"R$ 194,90","pix":"R$ 175,41","comparacao":"2 separadas: R$ 289,80 · Kit com 2: R$ 194,90 · Economize R$ 94,90"}],"cores":{"lista":[{"nome":"Branco","hex":"#F4F5F2"},{"nome":"Preto","hex":"#151515"},{"nome":"Prata","hex":"#C3C6CA"},{"nome":"Cinza","hex":"#6E7278"},{"nome":"Azul","hex":"#1F4FA3"},{"nome":"Vermelho","hex":"#C2262E"},{"nome":"Verde","hex":"#2F6B3F"},{"nome":"Bege","hex":"#D9C8A5"},{"nome":"Marrom","hex":"#6A4428"}],"indisponiveis":{},"fotos":{},"confirmada":false},"fretes":[{"id":"gratis","nome":"Frete Grátis","prazo":"Entrega em 5 a 7 dias","centavos":0,"preco":"Grátis"},{"id":"sedex","nome":"SEDEX","prazo":"Entrega em 2 a 5 dias","centavos":1990,"preco":"R$ 19,90"}]};
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
