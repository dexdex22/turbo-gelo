import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../public/',import.meta.url);
test('loja original renderiza dois vídeos, catálogo completo e mídia local',()=>{
 const dom=new JSDOM(readFileSync(new URL('index.html',root),'utf8'),{url:'https://turbogelo.online/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.matchMedia=()=>({matches:false,addEventListener(){},addListener(){}});w.IntersectionObserver=class {observe(){} disconnect(){}};w.scrollTo=()=>{};
 for(const name of ['precos.js','carros.catalogo.js','produto.config.js','checkout.js','app.js']) w.eval(readFileSync(new URL(name,root),'utf8'));
 assert.equal(Object.keys(w.TURBOGELO_CARROS).length,50);
 assert.equal(Object.values(w.TURBOGELO_CARROS).flat().length,1112);
 assert.equal(w.document.querySelectorAll('video').length,2);
 const missing=[];
 for(const el of w.document.querySelectorAll('img[src],source[src],script[src],link[href]')){
  const src=el.getAttribute('src')||el.getAttribute('href');
  if(!src||/^(https?:|data:|#)/.test(src))continue;
  const url=new URL(src,'https://turbogelo.online/');
  if(!existsSync(new URL('.'+url.pathname,root)))missing.push(url.pathname);
 }
 assert.deepEqual(missing,[]);
 assert.equal(w.PRODUTO.seo.urlCanonica,'https://turbogelo.online/');
 dom.window.close();
});
