import QRCode from 'qrcode/lib/core/qrcode.js';
async function qrImage(text){const {modules:m}=QRCode.create(text),n=m.size;let path='';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(m.get(y,x))path+='M'+(x+2)+' '+(y+2)+'h1v1h-1z';return 'data:image/svg+xml;base64,'+btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges"><path fill="white" d="M0 0h'+(n+4)+'v'+(n+4)+'H0z"/><path d="'+path+'"/></svg>');}
export async function aurionfy(env,path, body) {
  const {AURIONFY_PUBLIC_KEY:pk,AURIONFY_SECRET_KEY:sk}=env;
  if(!pk||!sk) throw Error('Gateway not configured');
  const res=await fetch(`https://api.aurionfy.com/v1${path}`,{method:body?'POST':'GET',
    headers:{Accept:'application/json','Content-Type':'application/json',Authorization:`Basic ${btoa(`${pk}:${sk}`)}`},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000),redirect:'manual'});
  if(!res.ok) throw Error(`Gateway HTTP ${res.status}`); // Never log body, credentials, hash or PII.
  return res.json();
}
export function verify(order,t) {
  if(!t || !/^\d+$/.test(String(t.id)) || t.externalRef!==order.id || t.amount!==order.details.amount ||
    t.paymentMethod!==order.details.paymentMethod || t.currency!=='BRL' ||
    (order.transaction_id && String(t.id)!==order.transaction_id)) throw Error('Transaction mismatch');
  if(!['processing','waiting_payment','approved','refused','in_protest','pre_chargeback','refunded','paid','cancelled','chargeback'].includes(t.status)) throw Error('Unknown status');
  if(t.status==='paid' && (!Number.isInteger(t.paidAmount)||t.paidAmount<order.details.amount)) throw Error('Payment amount mismatch');
  return t;
}
const safeUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
export async function paymentView(t) {
  const pix=typeof t.pix?.qrcode==='string'&&t.pix.qrcode.length<8192?t.pix.qrcode:null;
  return {id:t.id,status:t.status,paymentMethod:t.paymentMethod,amount:t.amount,paidAmount:t.paidAmount,
    secureId:t.secureId,secureUrl:t.secureUrl,redirectUrl:safeUrl(t.redirectUrl),
    pix:pix?{qrcode:pix,image:await qrImage(pix),expirationDate:t.pix.expirationDate}:null,
    boleto:t.boleto?{url:safeUrl(t.boleto.url),digitableLine:t.boleto.digitableLine||t.boleto.barcode||'',expirationDate:t.boleto.expirationDate}:null};
}
