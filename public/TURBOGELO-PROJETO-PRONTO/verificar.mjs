import {checkConfig} from './lib/config-check.mjs';
import {database} from './lib/db.mjs';
import {aurionfy} from './lib/gateway.mjs';
const result=checkConfig(process.env);
console.log(result.live?'Modo: pagamentos habilitados.':'Modo: pagamentos desabilitados.');
for(const item of result.pending)console.log('PENDENTE: '+item);
for(const item of result.errors)console.log('ERRO: '+item);
if(result.errors.length||result.pending.length)process.exitCode=1;
else console.log('Campos preenchidos. Isso não confirma a validade das credenciais.');
if(process.argv.includes('--online')&&!process.exitCode){
 const db=database();
 try{
  const r=await db.query("SELECT to_regclass('checkout_orders') AS orders, to_regclass('checkout_limits') AS limits");
  if(!r.rows[0].orders||!r.rows[0].limits)throw Error();
  console.log('OK: banco acessível e tabelas preparadas.');
 }catch{console.log('ERRO: banco inacessível ou tabelas ausentes. Execute npm run db:init no banco correto.');process.exitCode=1;}
 finally{await db.end();}
 try{
  const company=await aurionfy('/company');
  if(company.blocked||company.apiBlocked)throw Error();
  for(const [field,label]of [['isPixAvailable','Pix'],['isBoletoAvailable','Boleto'],['isCreditCardAvailable','Cartão']]){
   const enabled=company.permissions?.[field]===true;console.log(`${enabled?'OK':'PENDENTE'}: ${label} ${enabled?'habilitado':'não confirmado como habilitado'} na conta.`);if(!enabled)process.exitCode=1;
  }
 }catch{console.log('ERRO: não foi possível validar a conta Aurionfy. Confira o novo par de chaves e as permissões.');process.exitCode=1;}
 console.log('Verificação somente de leitura. Nenhuma cobrança foi criada.');
}
