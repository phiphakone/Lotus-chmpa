const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),vm=require('vm');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),results=[];
const check=(name,ok)=>{assert.ok(ok,name);results.push(name);console.log('PASS '+name);};
const data=new Map(),pages=[];let rejectNext=false;
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,bytes)=>{
  if(err){res.writeHead(404);return res.end();}
  if(file.endsWith('index.html')) bytes=Buffer.from(bytes.toString().replace(/<script type="module">[\s\S]*?<\/script>/,'').replace(/<script[^>]+src="https:[^>]*><\/script>/g,''));
  res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});res.end(bytes);
 });
});
let browser;
async function broadcast(){for(const p of pages)await p.evaluate(rows=>window.__catalogSnapshot(rows),[...data]);}
(async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const [i,m]of [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(m[2].trim())new vm.Script(m[2].replace(/import[\s\S]*?from\s*["'][^"']+["'];/g,''),{filename:'inline-'+i});
 new vm.Script(fs.readFileSync(path.join(root,'assets/catalog.js'),'utf8'));
 check('all modified JavaScript parses',true);
 await new Promise(r=>server.listen(4188,'127.0.0.1',r));
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:960},serviceWorkers:'block'});
 await context.route('**/*',route=>{if(new URL(route.request().url()).hostname==='127.0.0.1')return route.continue();return route.abort();});
 await context.exposeFunction('__saveProduct',async(id,value)=>{
  if(rejectNext){rejectNext=false;throw new Error('permission-denied');}
  data.set(id,value);await broadcast();
 });
 async function makePage(admin){
  const page=await context.newPage();pages.push(page);
  await page.addInitScript(({admin})=>{
   window.__snapshotRows=[];
   window.__catalogSnapshot=rows=>{window.__snapshotRows=rows;window.__listener?.({metadata:{hasPendingWrites:false,fromCache:false},forEach:fn=>rows.forEach(([id,data])=>fn({id,data:()=>data}))});};
   window.LCSession={uid:'admin',isAdmin:admin};
   window.LCFB={ready:true,auth:{currentUser:admin?{uid:'admin'}:null},db:{},
    collection:(db,name)=>name,doc:(db,col,id)=>col+'/'+id,serverTimestamp:()=>new Date().toISOString(),
    onSnapshot:(ref,options,callback,error)=>{if(ref!=='products')return ()=>{};window.__listener=callback;window.__listenerError=error;setTimeout(()=>window.__catalogSnapshot(window.__snapshotRows),0);return ()=>{window.__listener=null;};},
    getDoc:async ref=>({exists:()=>ref==='catalogSettings/media',data:()=>({cloudName:'test-shop'})}),
    setDoc:async(ref,data)=>{if(ref.startsWith('products/'))await window.__saveProduct(ref.slice(9),data);},
    query:x=>x,where:()=>{},orderBy:()=>{}
   };
   window.cloudinary={createMediaLibrary:(options,callbacks)=>{window.__mediaOptions=options;window.__mediaCallbacks=callbacks;return {show:()=>{window.__mediaShown=true;},hide:()=>{window.__mediaShown=false;}};}};
  },{admin});
  await page.goto('http://127.0.0.1:4188/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.LCCatalog&&!!window.__listener);
  await page.evaluate(rows=>window.__catalogSnapshot(rows),[...data]);
  return page;
 }
 const admin=await makePage(true),customer=await makePage(false);
 await admin.evaluate(()=>{CURRENT_LANG='vi';navigate('admin/products');});
 const id=await admin.evaluate(()=>getProducts()[0].id);
 await customer.evaluate(id=>navigate('product/'+id),id);
 await admin.evaluate(id=>adminEditProduct(id),id);
 check('admin form has upload button and zero values preserved',await admin.locator('#catalog-pick').isVisible()&&await admin.locator('#ed-oldPrice').inputValue()!=='');
 await admin.locator('#catalog-pick').click();
 await admin.waitForFunction(()=>window.__mediaShown);
 check('Cloudinary opens authenticated Media Library without upload secrets',await admin.evaluate(()=>__mediaOptions.cloud_name==='test-shop'&&__mediaOptions.multiple===false&&!__mediaOptions.api_secret&&!__mediaOptions.upload_preset));
 const image='https://res.cloudinary.com/test-shop/image/upload/v123/tea-new.jpg';
 await admin.evaluate(image=>__mediaCallbacks.insertHandler({assets:[{resource_type:'image',type:'upload',format:'jpg',bytes:2000,secure_url:image}]}),image);
 check('selected image preview updates before saving',await admin.locator('#ed-image').inputValue()===image&&await admin.locator('#catalog-preview').getAttribute('src')===image);
 check('customer does not see an unpublished image',await customer.locator('#pdMain').getAttribute('src')!==image);
 await admin.locator('#catalog-save').click();
 await admin.waitForSelector('#catalog-form',{state:'detached'});
 check('customer already viewing product receives new image',await customer.locator('#pdMain').getAttribute('src')===image);
 await customer.reload({waitUntil:'domcontentloaded'});await customer.waitForFunction(()=>!!window.__listener);
 await customer.evaluate(rows=>__catalogSnapshot(rows),[...data]);
 check('new visit receives saved image',await customer.locator('#pdMain').getAttribute('src')===image);
 await admin.evaluate(id=>adminEditProduct(id),id);
 await admin.locator('#ed-image').fill('https://example.com/not-published.jpg');rejectNext=true;
 await admin.locator('#catalog-save').click();
 await admin.waitForFunction(()=>document.getElementById('catalog-save-status')?.textContent.length>0);
 check('failed save preserves form and public image',await admin.locator('#ed-image').inputValue()==='https://example.com/not-published.jpg'&&await customer.locator('#pdMain').getAttribute('src')===image);
 await admin.evaluate(()=>closeModal());
 await admin.evaluate(id=>adminEditProduct(id),id);
 data.set(id,{...data.get(id),name:'Changed on another device'});await broadcast();
 await admin.locator('#ed-name').fill('Stale edit');await admin.locator('#catalog-save').click();
 check('concurrent edit is detected before overwrite',data.get(id).name==='Changed on another device'&&await admin.locator('#catalog-form').isVisible());
 await admin.evaluate(()=>closeModal());
 await admin.evaluate(()=>adminEditProduct());
 await admin.locator('#ed-name').fill('Tea "quoted" & special');
 await admin.locator('#ed-price').fill('120000');await admin.locator('#ed-stock').fill('5');
 await admin.locator('#ed-image').fill(image);await admin.locator('#catalog-save').click();await admin.waitForSelector('#catalog-form',{state:'detached'});
 const added=[...data].find(([,d])=>d.name==='Tea "quoted" & special')[0];
 check('new product is visible in another client',await customer.evaluate(id=>!!getProduct(id),added));
 await customer.evaluate(id=>navigate('product/'+id),added);
 check('quotes and ampersands render safely as text',await customer.locator('#pdMain').getAttribute('alt')==='Tea "quoted" & special');
 admin.once('dialog',dialog=>dialog.accept());await admin.evaluate(id=>adminDeleteProduct(id),added);
 check('hide syncs to customer and preserves a restorable record',await customer.evaluate(id=>!getProduct(id),added)&&data.get(added).deleted);
 await admin.evaluate(id=>LCCatalog.restore(id),added);
 check('restore syncs to customer',await customer.evaluate(id=>!!getProduct(id),added));
 await customer.evaluate(()=>adminEditProduct());
 check('non-admin cannot open editor',await customer.locator('#catalog-form').count()===0);
 await admin.evaluate(()=>navigate('checkout'));await admin.waitForTimeout(100);
 await admin.evaluate(()=>document.getElementById('main').insertAdjacentHTML('beforeend','<input id="test-draft" value="keep my draft">'));
 data.set(id,{...data.get(id),image:'https://example.com/updated.jpg'});await broadcast();
 check('live update preserves checkout input',await admin.locator('#test-draft').inputValue()==='keep my draft');
 await admin.evaluate(()=>navigate('admin/products'));await admin.evaluate(id=>adminEditProduct(id),id);
 await admin.locator('#ed-image').fill('javascript:alert(1)');await admin.evaluate(()=>LCCatalog.save());
 check('unsafe image scheme is rejected',data.get(id).image==='https://example.com/updated.jpg');
 await admin.evaluate(()=>closeModal());
 await admin.evaluate(id=>adminEditProduct(id),id);
 await admin.locator('#catalog-pick').click();await admin.waitForFunction(()=>window.__mediaShown);
 await admin.evaluate(()=>{window.LCSession.isAdmin=false;window.dispatchEvent(new Event('lc-auth-reset'));});
 check('logout closes editor and image picker',await admin.locator('#catalog-form').count()===0&&await admin.evaluate(()=>!__mediaShown));
 await admin.evaluate(()=>{window.LCSession={uid:'admin',isAdmin:true};});
 await admin.evaluate(id=>adminEditProduct(id),id);
 await admin.setViewportSize({width:390,height:844});
 fs.mkdirSync(path.join(root,'review/catalog'),{recursive:true});
 await admin.screenshot({path:path.join(root,'review/catalog/editor-mobile.png'),fullPage:true});
 check('editor fits mobile viewport',await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 fs.mkdirSync(path.join(root,'review/catalog'),{recursive:true});
 await admin.locator('#toastWrap').evaluate(el=>el.replaceChildren());
 await admin.screenshot({path:path.join(root,'review/catalog/editor-mobile.png')});
 await admin.setViewportSize({width:1280,height:960});await admin.screenshot({path:path.join(root,'review/catalog/editor-desktop.png')});
 await admin.evaluate(()=>closeModal());
 await admin.evaluate(()=>__listenerError({code:'permission-denied'}));
 check('missing deployed rules show actionable failure',await admin.locator('#adminShell').innerText().then(x=>x.includes('Chưa kết nối')));
 await admin.locator('button[onclick="LCCatalog.retry()"]').click();await admin.waitForFunction(()=>!!window.__listener);
 await admin.evaluate(rows=>__catalogSnapshot(rows),[...data]);
 check('retry reconnects catalogue',await admin.locator('#adminShell').innerText().then(x=>x.includes('Đã kết nối')));
 fs.writeFileSync(path.join(root,'review/catalog/results.json'),JSON.stringify({passed:results.length,checks:results},null,2));
 console.log('ALL '+results.length+' CATALOGUE CHECKS PASSED');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
