/* Cache public static files only. Never cache Firebase, auth, orders, slips or shop HTML. */
const VERSION = 'c3d2306d1c5b74f9';
const BASE=new URL('./',self.location.href);
const CACHE_PREFIX='lc-public-'+encodeURIComponent(BASE.pathname)+'-';
const CACHE=CACHE_PREFIX+VERSION;
const STATIC=['offline.html','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC.map(f=>new URL(f,BASE).href)))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(CACHE_PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||url.search||request.headers.has('Authorization'))return;
 const relative=url.pathname.slice(BASE.pathname.length);
 if(request.mode==='navigate'){
  if(relative!==''&&relative!=='index.html')return;
  event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match(new URL('offline.html',BASE).href)));return;
 }
 if(!STATIC.includes(relative)&&!/^assets\/[a-z0-9-]+\.(css|js)$/.test(relative))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request,{cache:'no-cache'});
   if(response.ok&&response.type==='basic'&&!response.headers.get('Cache-Control')?.includes('no-store'))await cache.put(request,response.clone());
   return response;
  }catch(error){const cached=await cache.match(request);if(cached)return cached;throw error;}
 })());
});