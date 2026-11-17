import handler from './handler.mjs';
import {repository} from './db.mjs';
import {service} from './service.mjs';
import {aurionfy} from './gateway.mjs';
async function parseBody(request){if(request.method!=='POST')return undefined;let size=0;const chunks=[];const reader=request.body?.getReader();if(!reader)return {};while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32000){await reader.cancel();throw Error('BODY_LIMIT');}chunks.push(value);}const merged=new Uint8Array(size);let i=0;for(const c of chunks){merged.set(c,i);i+=c.length;}return JSON.parse(new TextDecoder().decode(merged)||'{}');}
function normalizedEnv(env){return {...env,APP_ORIGIN:env.APP_ORIGIN||env.ORIGEM_DO_APLICATIVO,AURIONFY_PUBLIC_KEY:env.AURIONFY_PUBLIC_KEY||env.AURIONFY_CHAVE_PUBLICA||env['AURIONFY_CHAVE_PÚBLICA'],AURIONFY_SECRET_KEY:env.AURIONFY_SECRET_KEY||env.AURIONFY_CHAVE_SEGREDO};}
export default {
 async fetch(request,env){
  env=normalizedEnv(env);
  const u=new URL(request.url);
  if(u.pathname.startsWith('/api/checkout/')){
   // Same origin cookies and POST checks; APP_ORIGIN pins payment callback URLs.
   const origin=env.APP_ORIGIN||u.origin;
   if(origin!==u.origin)return new Response('Use o endereço principal da loja.',{status:403});
   let body;try{body=await parseBody(request);}catch(e){return Response.json({error:e.message==='BODY_LIMIT'?'Dados muito grandes.':'Dados inválidos.'},{status:e.message==='BODY_LIMIT'?413:400});}
   const headers=new Headers();let output='';const res={statusCode:200,setHeader:(k,v)=>headers.set(k,v),end:v=>{output=v;}};
   await handler({url:request.url,method:request.method,headers:Object.fromEntries(request.headers),body},res,{...env,APP_ORIGIN:origin});
   return new Response(output,{status:res.statusCode,headers});
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Método não permitido.',{status:405});
  const response=await env.ASSETS.fetch(request);
  // Support seeking even when the assets implementation returns a full video.
  const range=request.headers.get('Range');
  if(request.method==='GET'&&u.pathname.startsWith('/videos/')&&range&&response.status===200){
   const match=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(match&&(match[1]||match[2])){
    const data=await response.arrayBuffer(),size=data.byteLength;
    const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
    const end=match[1]&&match[2]?Math.min(Number(match[2]),size-1):size-1;
    const headers=new Headers(response.headers);headers.set('Accept-Ranges','bytes');
    if(!Number.isSafeInteger(start)||start>=size||start>end){headers.set('Content-Range',`bytes */${size}`);headers.delete('Content-Length');return new Response(null,{status:416,headers});}
    headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));
    return new Response(data.slice(start,end+1),{status:206,headers});
   }
  }
  return response;
 },
 async scheduled(event,env,ctx){env=normalizedEnv(env);if(!env.DB)return;const repo=repository(env.DB);await repo.cleanup();if(env.APP_ORIGIN&&env.AURIONFY_PUBLIC_KEY&&env.AURIONFY_SECRET_KEY)await service(repo,(p,b)=>aurionfy(env,p,b),env.APP_ORIGIN).reconcile();}
};
