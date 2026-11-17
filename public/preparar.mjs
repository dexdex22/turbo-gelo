import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const file=new URL('.env',import.meta.url);
try {
 let content=await readFile(new URL('.env.example',import.meta.url),'utf8');
 content=content.replace('POSTGRES_PASSWORD=',`POSTGRES_PASSWORD=${randomBytes(24).toString('hex')}`)
   .replace('CRON_SECRET=',`CRON_SECRET=${randomBytes(32).toString('hex')}`)
   .replace('APP_ORIGIN=https://sua-loja.example','APP_ORIGIN=http://localhost:3000');
 await writeFile(file,content,{flag:'wx',mode:0o600});
 console.log('Configuração criada em .env. Nenhuma chave de pagamento foi preenchida.');
 console.log('Para prévia local com Docker: docker compose up --build -d');
 console.log('Para publicar: configure APP_ORIGIN, as novas chaves e siga COMECE-AQUI.md.');
}catch(e){if(e.code==='EEXIST')console.log('O arquivo .env já existe e foi preservado.');else{console.error('Não foi possível preparar a configuração. Confira as permissões da pasta.');process.exitCode=1;}}
