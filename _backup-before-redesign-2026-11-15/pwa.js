(() => {
'use strict';
const base=new URL('../',document.currentScript.src);
window.LCPWA={baseURL:base.href,registration:null};
let installEvent,updateRegistration,acceptedUpdate=false;
const messages={
vi:['Cài ứng dụng','Có phiên bản mới','Cập nhật','iPhone: Safari → Chia sẻ → Thêm vào Màn hình chính.'],
th:['ติดตั้งแอป','มีเวอร์ชันใหม่','อัปเดต','iPhone: Safari → แชร์ → เพิ่มไปยังหน้าจอโฮม'],
en:['Install app','New version available','Update','iPhone: Safari → Share → Add to Home Screen.'],
lo:['ຕິດຕັ້ງແອັບ','ມີເວີຊັນໃໝ່','ອັບເດດ','iPhone: Safari → Share → Add to Home Screen.'],
zh:['安装应用','新版本可用','更新','iPhone：Safari → 分享 → 添加到主屏幕。']
};
const words=()=>messages[document.documentElement.lang]||messages.vi;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function panel(id,text,action,label){
 let el=document.getElementById(id);if(el)return el;
 el=document.createElement('div');el.id=id;el.setAttribute('role','status');
 el.style.cssText='position:fixed;bottom:80px;left:16px;z-index:10001;max-width:calc(100vw - 32px);background:#1B2A4E;color:white;border-radius:12px;padding:12px;box-shadow:0 4px 20px #0003;font:14px system-ui;display:flex;gap:10px;align-items:center';
 const span=document.createElement('span');span.textContent=text;el.append(span);
 if(action){const btn=document.createElement('button');btn.textContent=label;btn.style.cssText='border:0;border-radius:6px;padding:9px;background:#C9A961;color:#0F1B33;cursor:pointer';btn.onclick=action;el.append(btn);}
 const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Close');close.style.cssText='background:none;border:0;color:white;font-size:22px;cursor:pointer';close.onclick=()=>el.remove();el.append(close);document.body.append(el);return el;
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();installEvent=event;
 if(!standalone())panel('lc-pwa-install',words()[0],async()=>{const prompt=installEvent;if(!prompt)return;await prompt.prompt();await prompt.userChoice;installEvent=null;document.getElementById('lc-pwa-install')?.remove();},words()[0]);
});
window.addEventListener('appinstalled',()=>{installEvent=null;document.getElementById('lc-pwa-install')?.remove();});
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(ios&&!standalone())panel('lc-pwa-install',words()[3]);
function offerUpdate(reg){
 if(!reg.waiting||!navigator.serviceWorker.controller)return;
 updateRegistration=reg;
 panel('lc-pwa-update',words()[1],()=>{
  // Never reload during a pending checkout.
  if(window.placeOrder?.busy||document.querySelector('#placeOrderBtn:disabled'))return;
  const worker=updateRegistration.waiting;if(worker){acceptedUpdate=true;worker.postMessage({type:'SKIP_WAITING'});}
 },words()[2]);
}
if(!('serviceWorker'in navigator)||!window.isSecureContext)return;
navigator.serviceWorker.addEventListener('controllerchange',()=>{if(acceptedUpdate)location.reload();});
window.addEventListener('load',async()=>{
 try{
  const reg=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname,updateViaCache:'none'});
  window.LCPWA.registration=reg;offerUpdate(reg);
  reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')offerUpdate(reg);});});
  const update=()=>{if(navigator.onLine)reg.update().catch(()=>{});};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});window.addEventListener('online',update);setInterval(update,60*60*1000);update();
 }catch(error){console.warn('[PWA] Registration unavailable:',error.message);}
});
})();