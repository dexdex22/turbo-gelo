import QRCode from 'qrcode';
export async function aurionfy(path, body) {
  const {AURIONFY_PUBLIC_KEY:pk,AURIONFY_SECRET_KEY:sk}=process.env;
  if(!pk||!sk) throw Error('Gateway not configured');
  const res=await fetch(`https://api.aurionfy.com/v1${path}`,{method:body?'POST':'GET',
    headers:{Accept:'application/json','Content-Type':'application/json',Authorization:`Basic ${Buffer.from(`${pk}:${sk}`).toString('base64')}`},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000),redirect:'error'});
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
    pix:pix?{qrcode:pix,image:await QRCode.toDataURL(pix,{width:280,margin:2}),expirationDate:t.pix.expirationDate}:null,
    boleto:t.boleto?{url:safeUrl(t.boleto.url),digitableLine:t.boleto.digitableLine||t.boleto.barcode||'',expirationDate:t.boleto.expirationDate}:null};
}
