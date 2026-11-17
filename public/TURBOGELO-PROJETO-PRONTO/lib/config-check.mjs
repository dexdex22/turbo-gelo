export function checkConfig(env){
 const errors=[],pending=[];
 let origin;
 try{origin=new URL(env.APP_ORIGIN);if(origin.origin!==env.APP_ORIGIN||origin.username||origin.password)throw Error();}
 catch{errors.push('APP_ORIGIN: informe apenas a origem, sem caminho ou barra final.');}
 const live=env.PAYMENTS_ENABLED==='true';
 if(origin&&live&&(origin.protocol!=='https:'||origin.hostname.endsWith('.example')||origin.hostname==='localhost'))errors.push('Pagamentos ativos exigem a origem HTTPS real da loja.');
 if(!env.AURIONFY_PUBLIC_KEY?.startsWith('pk_'))pending.push('Nova chave pública da Aurionfy');
 if(!env.AURIONFY_SECRET_KEY?.startsWith('sk_'))pending.push('Nova chave privada da Aurionfy');
 try{const db=new URL(env.DATABASE_URL);if(!['postgres:','postgresql:'].includes(db.protocol)||db.hostname==='host'||!db.password)throw Error();}catch{pending.push('Conexão real com PostgreSQL');}
 if(!env.CRON_SECRET||env.CRON_SECRET.length<32)pending.push('Segredo para o agendador de confirmação');
 if(live&&pending.length)errors.push('Não ative pagamentos antes de concluir as configurações pendentes.');
 return {errors,pending,live};
}
