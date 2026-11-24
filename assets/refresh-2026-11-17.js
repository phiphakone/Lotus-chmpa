/* Refresh 17-11-2026: fold Zalo + Facebook into one chat button so it stops covering content. */
(function(){
  var ICON='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/></svg>';
  var CLOSE='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function setup(){
    var fc=document.querySelector('.float-chat');
    if(!fc||fc.dataset.lc) return;
    fc.dataset.lc='1';
    fc.classList.add('lc-chat');
    var b=document.createElement('button');
    b.type='button';b.className='lc-chat-toggle';
    b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Chat: Zalo / Facebook');
    b.innerHTML=ICON;
    fc.appendChild(b);
    function set(open){fc.classList.toggle('open',open);b.setAttribute('aria-expanded',String(open));b.innerHTML=open?CLOSE:ICON;}
    b.addEventListener('click',function(e){e.stopPropagation();set(!fc.classList.contains('open'));});
    document.addEventListener('click',function(e){if(!fc.contains(e.target))set(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();

/* Phone hero: mark when the poster hero is on screen (used to hide the chat bubble over it). */
(function(){
  if(!('IntersectionObserver' in window)) return;
  var watched=null, io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){document.body.classList.toggle('lc-on-hero', e.isIntersecting && e.intersectionRatio>0.35);});
  },{threshold:[0,0.35,0.6]});
  function watch(){
    var h=document.querySelector('.hero, .meal-kit-hero');
    if(h===watched) return;
    if(watched) io.unobserve(watched);
    watched=h;
    if(h) io.observe(h); else document.body.classList.remove('lc-on-hero');
  }
  new MutationObserver(watch).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch); else watch();
})();

/* Homepage only: one screen per section. Each scroll/swipe settles on the next section; dots show where you are. */
(function(){
  var SEL=['main .hero','main .dual-culture','main .home-shelf--lao','main .home-shelf--vietnam','main .home-gallery-section','main .lc-journey','main .lc-journey ~ .section','footer.site-footer'];
  var dots=null, io=null, pages=[];
  function hdr(){var h=document.querySelector('.site-header');document.documentElement.style.setProperty('--hdr',(h?h.offsetHeight:62)+'px');}
  function teardown(){
    document.documentElement.classList.remove('lc-snap');
    pages.forEach(function(p){p.classList.remove('lc-page');});pages=[];
    if(io){io.disconnect();io=null;}
    if(dots){dots.remove();dots=null;}
  }
  function setup(){
    var hero=document.querySelector('main .hero');
    if(!hero||document.body.classList.contains('admin-mode')||!hero.offsetParent){teardown();return;}
    if(document.documentElement.classList.contains('lc-snap') && pages[0]===hero) return;
    teardown();
    pages=SEL.map(function(s){return document.querySelector(s);}).filter(Boolean);
    pages.forEach(function(p){p.classList.add('lc-page');});
    hdr();
    var y0=window.scrollY;
    document.documentElement.classList.add('lc-snap');
    // Turning snapping on lets the browser pick a snap target and glide to it; keep the visitor where they were (the top on first open).
    window.scrollTo({top:y0,behavior:'instant'});
    requestAnimationFrame(function(){window.scrollTo({top:y0,behavior:'instant'});});
    setTimeout(function(){ if(Math.abs(window.scrollY-y0)>4) window.scrollTo({top:y0,behavior:'instant'}); },250);
    dots=document.createElement('nav');dots.className='lc-dots';dots.setAttribute('aria-label','Trang');
    pages.forEach(function(p,i){
      var b=document.createElement('button');b.type='button';b.setAttribute('aria-label',String(i+1));
      b.addEventListener('click',function(){p.scrollIntoView({behavior:'smooth',block:'start'});});
      dots.appendChild(b);
    });
    document.body.appendChild(dots);
    io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){var i=pages.indexOf(e.target);[].forEach.call(dots.children,function(b,k){b.classList.toggle('on',k===i);b.setAttribute('aria-current',k===i?'true':'false');});
          dots.classList.toggle('on-dark',e.target.classList.contains('dual-culture')||e.target.classList.contains('site-footer'));}
      });
    },{threshold:0.55});
    pages.forEach(function(p){io.observe(p);});
  }
  var t;function schedule(){clearTimeout(t);t=setTimeout(setup,120);}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',function(){if(document.documentElement.classList.contains('lc-snap'))hdr();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
})();

/* Products page: tag the header with the country being browsed (lao / vietnam / all) for its background */
(function(){
  function tag(){
    var h=document.querySelector('main .page-hero'); if(!h) return;
    var r=(location.hash.match(/^#\/([a-z-]+)/)||[])[1]||'';
    if(['blog','contact','cart','checkout'].indexOf(r)>-1){ if(h.getAttribute('data-page')!==r) h.setAttribute('data-page',r); } else h.removeAttribute('data-page');
    var m=location.hash.match(/^#\/products(?:\?(.*))?$/); if(!m){h.removeAttribute('data-country');return;}
    var c=new URLSearchParams(m[1]||'').get('country');
    var v=(c==='lao'||c==='vietnam')?c:'all';
    if(h.getAttribute('data-country')!==v) h.setAttribute('data-country',v);
  }
  new MutationObserver(tag).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',tag);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tag);else tag();
})();

/* Always open the site at the top: don't let the browser restore an old scroll position
   (with one-screen snapping it would land on a lower section, e.g. the footer). */
(function(){
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  function toTop(){ window.scrollTo(0,0); }
  toTop();
  window.addEventListener('load',function(){ toTop(); setTimeout(toTop,150); });
  window.addEventListener('pageshow',function(e){ if(e.persisted) toTop(); });
})();
