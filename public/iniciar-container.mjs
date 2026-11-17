import {schema} from './lib/db.mjs';
import pg from 'pg';
import {checkConfig} from './lib/config-check.mjs';
const result=checkConfig(process.env);
if(result.errors.length){for(const e of result.errors)console.error(e);process.exit(1);}
const db=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:8000});
try{await db.query(schema);console.log('Banco de pedidos preparado.');}
catch{console.error('Não foi possível preparar o banco de pedidos.');process.exitCode=1;}
finally{await db.end();}
if(process.exitCode)process.exit(process.exitCode);
// The server uses its own pool; initialization pool above is intentionally local.
await import('./server.mjs');
