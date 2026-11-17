import {schema,database,repository} from './lib/db.mjs';
import {service} from './lib/service.mjs';
import {aurionfy} from './lib/gateway.mjs';
const db=database();
try{
 if(process.argv[2]==='init'){await db.query(schema);console.log('Banco preparado.');}
 else if(process.argv[2]==='reconcile'){console.log(await service(repository(db),aurionfy,process.env.APP_ORIGIN).reconcile());}
 else if(process.argv[2]==='link'){const repo=repository(db);const order=await repo.get(process.argv[3]);if(!order)throw Error('Pedido não encontrado');if(!/^\d+$/.test(process.argv[4]||''))throw Error('ID inválido');const result=await service(repo,aurionfy,process.env.APP_ORIGIN).refresh(order,process.argv[4]);console.log({order:result.id,state:result.state});}
 else throw Error('Use init, reconcile ou link ORDER_UUID TRANSACTION_ID.');
}finally{await db.end();}
