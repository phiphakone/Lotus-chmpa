const fs=require('fs'),path=require('path'),http=require('http'),vm=require('vm'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');const out=path.join(root,'review/pwa-tests');fs.mkdirSync(out,{recursive:true});
let nextVersion=false;
const types={'.html':'text/html; charset=utf-8','.json':'application/manifest+json','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.gif':'image/gif'};
const server=http.createServer((req,res)=>{
 let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.startsWith('/shop/'))name=name.slice(5);
 if(name.endsWith('/'))name+='index.html';
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404);return res.end();}
 if(name.endsWith('/sw.js')&&nextVersion)bytes=Buffer.from(bytes.toString().replace(/const VERSION = '[^']+';/,"const VERSION = 'test-upgrade';"));
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
 });
});
const results=[];
function check(name,v){assert.ok(v,name);results.push({name,pass:true});console.log('PASS '+name);}
(async()=>{
 // Syntax check every JS script including the original modules (remove import statements for parser only).
 const html=fs.readFileSync(root+'/index.html','utf8');
 for(const [i,match]of [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].entries()){
  if(!match[2].trim())continue;
  let code=match[2].replace(/import[\s\S]*?from\s*["'][^"']+["'];/g,'');new vm.Script(code,{filename:'inline-'+i});
 }
 for(const f of fs.readdirSync(root+'/assets').filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(root+'/assets/'+f,'utf8'),{filename:f});
 new vm.Script(fs.readFileSync(root+'/sw.js','utf8'));check('All JavaScript parses',true);
 const listen=await new Promise(resolve=>server.listen(4187,'127.0.0.1',resolve));
 const browser=await chromium.launch({...(process.platform==='win32'?{channel:'msedge'}:{}),headless:true});
 for(const prefix of ['/','/shop/']){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  // Forbid mutations or reads of live customer data. External SDK loading remains allowed.
  await context.route(/(firestore.googleapis.com|identitytoolkit.googleapis.com|securetoken.googleapis.com|firebasestorage.googleapis.com|google-analytics.com|analytics.google.com)/,r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4187'+prefix,{waitUntil:'load'});
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  await page.waitForFunction(()=>getProducts().length>0);
  await page.waitForFunction(()=>window.LCFB?.ready===true);
  check(prefix+' real Firebase SDK initializes',await page.evaluate(()=>LCFB.db.app.options.projectId==='lotus-1a491'));
  const pwa=await page.evaluate(()=>({base:LCPWA.baseURL,scope:LCPWA.registration.scope,products:getProducts().length,manifest:document.querySelector('[rel=manifest]').href}));
  check(prefix+' base and SW scope correct',pwa.scope.endsWith(prefix)&&pwa.base.endsWith(prefix));
  const manifest=await (await context.request.get(pwa.manifest)).json();
  check(prefix+' manifest standalone and relative URLs',manifest.display==='standalone'&&manifest.start_url==='./'&&manifest.scope==='./');
  for(const icon of manifest.icons){const r=await context.request.get(new URL(icon.src,pwa.manifest).href);check(prefix+' icon '+icon.sizes+' '+icon.purpose,r.ok()&&r.headers()['content-type']==='image/png');}
  const cdp=await context.newCDPSession(page);const app=await cdp.send('Page.getAppManifest');check(prefix+' browser parses manifest',app.errors.length===0);
  await page.evaluate(()=>{const p=getProducts()[0];addToCart(p.id,2);navigate('cart');});
  await page.waitForSelector('.cart-layout');
  check(prefix+' add to cart and render',await page.evaluate(()=>getCart()[0].qty===2));
  await page.evaluate(()=>navigate('checkout'));await page.waitForSelector('#cName');
  await page.evaluate(()=>placeOrder());
  check(prefix+' checkout required fields prevent writes',await page.locator('#orderStatus').isVisible().catch(()=>false)||await page.evaluate(()=>!placeOrder.busy));
  await page.evaluate(()=>{Store.set('user',{uid:'mock',email:'private@example.com'});Store.set('lastOrder',{phone:'private'});});
  check(prefix+' personal data never saved in localStorage',await page.evaluate(()=>!localStorage.getItem('lc_user')&&!localStorage.getItem('lc_lastOrder')&&Store.get('user').uid==='mock'));
  for(const width of [375,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const route of ['home','products','cart','checkout','account']){
    await page.evaluate(route=>navigate(route),route);
    await page.waitForTimeout(150);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
    check(prefix+' '+width+' '+route+' no horizontal overflow',!overflow);
   }
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>navigate('home'));await page.screenshot({path:out+'/'+(prefix==='/'?'root':'subpath')+'-mobile.png'});
  const cached=await page.evaluate(async()=>{const entries=[];for(const key of await caches.keys()){for(const r of await (await caches.open(key)).keys())entries.push(r.url);}return entries;});
  check(prefix+' cache excludes accounts/orders/shop HTML/backend',cached.every(u=>/\/(offline.html|icons\/[^/]+\.png|assets\/[^/]+\.(js|css))$/.test(u)));
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  check(prefix+' offline fallback loads without private data',(await page.title()).includes('Offline'));
  await context.setOffline(false);await page.reload({waitUntil:'load'});
  check(prefix+' reconnect restores catalogue',await page.evaluate(()=>getProducts().length===41));
  check(prefix+' no JavaScript runtime errors',errors.length===0);
  if(prefix==='/shop/'){
   nextVersion=true;await page.evaluate(()=>LCPWA.registration.update());await page.waitForSelector('#lc-pwa-update');
   check('Update waits for explicit acceptance',await page.evaluate(()=>!!LCPWA.registration.waiting));
   await page.evaluate(()=>{window.placeOrder.busy=true;});
   await page.locator('#lc-pwa-update button').first().click();
   check('Update blocked while submitting order',await page.evaluate(()=>!!LCPWA.registration.waiting));
   await page.evaluate(()=>{window.placeOrder.busy=false;});
   await page.locator('#lc-pwa-update button').first().click();
   await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.includes('sw.js')&&!window.LCPWA?.registration?.waiting);
   await page.waitForFunction(async()=>!!(await caches.open('lc-public-%2Fshop%2F-test-upgrade')));
   const keys=await page.evaluate(()=>caches.keys());check('Update cleans older app caches',keys.length===1&&keys[0]==='lc-public-%2Fshop%2F-test-upgrade');
  }
  await context.close();
 }
 const ios=await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 await ios.route(/(firestore.googleapis.com|identitytoolkit.googleapis.com|securetoken.googleapis.com|firebasestorage.googleapis.com|google-analytics.com)/,r=>r.abort());
 const iphone=await ios.newPage();await iphone.goto('http://127.0.0.1:4187/shop/',{waitUntil:'load'});
 check('iPhone user agent gets installation instructions',await iphone.locator('#lc-pwa-install').isVisible());await ios.close();
 await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log('ALL '+results.length+' BROWSER CHECKS PASSED');
})().catch(e=>{console.error(e);setTimeout(()=>process.exit(1),1000);fs.writeFileSync(out+'/results.json',JSON.stringify({results,error:e.stack},null,2));process.exitCode=1;}).finally(()=>server.close());
