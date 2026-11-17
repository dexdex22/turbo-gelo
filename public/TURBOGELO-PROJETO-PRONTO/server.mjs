import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import handler from './lib/handler.mjs';
const root=fileURLToPath(new URL('./public/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.startsWith('/api/checkout/'))return await handler(req,res);
 const name=pathname==='/checkout'||pathname==='/checkout/'?'/checkout/index.html':pathname==='/'?'/index.html':decodeURIComponent(pathname);
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root)||name.split('/').some(s=>s.startsWith('.')))throw Error();
 if(!(await stat(file)).isFile())throw Error();
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(name.startsWith('/checkout/')){res.setHeader('Cache-Control','no-store');res.setHeader('X-Frame-Options','DENY');}
 res.end(await readFile(file));
 }catch{res.statusCode=404;res.end('Não encontrado.');}
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Loja em http://localhost:'+(process.env.PORT||3000)));
