/* Presentation and accessibility only; no database writes or storage migration. */
(() => {
  'use strict';
  const lex = {
    vi:{menu:'Menu điều hướng',close:'Đóng',search:'Tìm sản phẩm',sort:'Sắp xếp sản phẩm',filter:'Bộ lọc',pause:'Tạm dừng',play:'Tiếp tục',prev:'Ảnh trước',next:'Ảnh tiếp theo',skip:'Đến nội dung chính',fav:'Yêu thích',buy:'Mua ngay'},
    th:{menu:'เมนูนำทาง',close:'ปิด',search:'ค้นหาสินค้า',sort:'เรียงสินค้า',filter:'ตัวกรอง',pause:'หยุดชั่วคราว',play:'เล่นต่อ',prev:'ภาพก่อนหน้า',next:'ภาพถัดไป',skip:'ข้ามไปเนื้อหาหลัก',fav:'รายการโปรด',buy:'ซื้อเลย'},
    en:{menu:'Navigation menu',close:'Close',search:'Search products',sort:'Sort products',filter:'Filters',pause:'Pause',play:'Play',prev:'Previous image',next:'Next image',skip:'Skip to content',fav:'Favorite',buy:'Buy now'},
    lo:{menu:'ເມນູ',close:'ປິດ',search:'ຄົ້ນຫາສິນຄ້າ',sort:'ຈັດລຽງສິນຄ້າ',filter:'ຕົວກອງ',pause:'ຢຸດຊົ່ວຄາວ',play:'ຫຼິ້ນຕໍ່',prev:'ຮູບກ່ອນ',next:'ຮູບຕໍ່ໄປ',skip:'ໄປເນື້ອຫາຫຼັກ',fav:'ລາຍການມັກ',buy:'ຊື້ດຽວນີ້'},
    zh:{menu:'导航菜单',close:'关闭',search:'搜索商品',sort:'商品排序',filter:'筛选',pause:'暂停',play:'继续',prev:'上一张',next:'下一张',skip:'跳到主要内容',fav:'收藏',buy:'立即购买'}
  };
  const word = key => (lex[document.documentElement.lang]||lex.vi)[key];
  const menu = document.getElementById('mobileMenu');
  const main = document.getElementById('main');
  let menuReturn = null, modalReturn = null, activeDialog = null;
  const originalToggle = window.toggleMobileMenu;
  window.toggleMobileMenu = function(){
    const opening = !menu.classList.contains('open');
    if(opening)menuReturn=document.activeElement;
    originalToggle();
    menu.inert=!opening;
    menu.setAttribute('aria-hidden',String(!opening));
    document.body.classList.toggle('menu-open',opening);
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded',String(opening));
    document.querySelectorAll('#site > :not(#mobileMenu):not(#mobileOverlay)').forEach(el=>el.inert=opening);
    if(opening){requestAnimationFrame(()=>menu.querySelector('.head button').focus());}
    else{menuReturn?.focus();}
  };
  document.querySelector('.skip-link')?.addEventListener('click',event=>{
    event.preventDefault();main.focus();main.scrollIntoView({block:'start'});
  });
  function focusables(root){return [...root.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length&&!el.closest('[inert]'));}
  document.addEventListener('keydown',event=>{
    const dialog=menu.classList.contains('open')?menu:activeDialog;
    if(!dialog)return;
    if(event.key==='Escape'){
      event.preventDefault();
      if(dialog===menu)window.toggleMobileMenu();
      else if(dialog.closest('.photo-lightbox-overlay'))window.closePhotoLightbox();
      else window.closeModal();
    }
    if(event.key==='Tab'){
      const items=focusables(dialog),first=items[0],last=items.at(-1);
      if(!first){event.preventDefault();dialog.focus();return;}
      if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
    }
  });
  document.addEventListener('click',event=>{
    const card=event.target.closest('.cat-card,.combo-card,.home-gallery-slide,.about-photo-item');
    if(card&&!card.contains(document.activeElement))card.focus({preventScroll:true});
  },true);
  function enhance(){
    const skip=document.querySelector('.skip-link');if(skip)skip.textContent=word('skip');
    const toggle=document.querySelector('.menu-toggle');if(toggle){toggle.setAttribute('aria-controls','mobileMenu');toggle.setAttribute('aria-expanded',String(menu.classList.contains('open')));toggle.setAttribute('aria-label',word('menu'));}
    menu.setAttribute('aria-label',word('menu'));menu.querySelector('.head button')?.setAttribute('aria-label',word('close'));
    for(const id of ['searchInput','searchInputMobile']){
      const input=document.getElementById(id);if(input){input.setAttribute('aria-label',word('search'));input.closest('.header-search')?.querySelector('button')?.setAttribute('aria-label',word('search'));}
    }
    document.getElementById('shopSort')?.setAttribute('aria-label',word('sort'));
    document.querySelectorAll('.form-field,.form-group').forEach((field,index)=>{
      const label=field.querySelector('label'),input=field.querySelector('input,select,textarea');
      if(label&&input&&!label.contains(input)){if(!input.id)input.id='accessible-field-'+index;label.htmlFor=input.id;}
    });
    const quantity=document.getElementById('pdQty');if(quantity)quantity.setAttribute('aria-label',t('pd.qty','Quantity'));
    document.querySelectorAll('.qty-control input').forEach(input=>input.setAttribute('aria-label',t('pd.qty','Quantity')));
    document.getElementById('couponInput')?.setAttribute('aria-label',t('cart.coupon.placeholder','Coupon code'));
    document.getElementById('adminPassInput')?.setAttribute('aria-label',t('acc.password','Password'));
    document.querySelectorAll('a[target="_blank"]').forEach(a=>a.rel='noopener noreferrer');
    document.querySelectorAll('.test-quote,.announce .dot,.dual-side .symbol').forEach(el=>el.setAttribute('aria-hidden','true'));
    document.querySelectorAll('.nav-list a,#mobileNav a').forEach(a=>{
      const active=a.getAttribute('href')===(location.hash||'#/');a.classList.toggle('active',active);
      if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.cat-card,.combo-card,.home-gallery-slide,.about-photo-item img[onclick],.pd-thumb').forEach(card=>{
      if(!card.hasAttribute('onclick'))return;
      card.setAttribute('role','button');card.tabIndex=0;if(card.matches('.pd-thumb'))card.setAttribute('aria-label',card.querySelector('img')?.alt||'Lotus & Champa');
      if(card.dataset.keyboardBound)return;card.dataset.keyboardBound='1';
      card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();card.click();}});
    });
    document.querySelectorAll('.product-card').forEach(card=>{
      const name=card.querySelector('.product-name')?.textContent.trim();
      card.querySelector('.product-fav')?.setAttribute('aria-label',word('fav')+': '+name);
      const buy=card.querySelector('.btn-buy-now');if(buy){buy.setAttribute('aria-label',word('buy')+': '+name);buy.title=word('buy');let label=buy.querySelector('.buy-now-label');if(!label){label=document.createElement('span');label.className='buy-now-label';buy.append(label);}label.textContent=word('buy');}
    });
    const sidebar=document.getElementById('shopSidebar'),toolbar=document.querySelector('.shop-toolbar');
    if(sidebar&&toolbar){
      let button=toolbar.querySelector('.filter-toggle');
      if(!button){button=document.createElement('button');button.className='filter-toggle';button.type='button';button.setAttribute('aria-controls','shopSidebar');button.setAttribute('aria-expanded','false');toolbar.prepend(button);button.addEventListener('click',()=>{const open=sidebar.classList.toggle('filters-open');button.setAttribute('aria-expanded',String(open));});}
      button.textContent=word('filter');
    }
    const hero=document.getElementById('heroSwiper');
    if(hero){
      let controls=hero.parentElement.querySelector('.carousel-controls');
      if(!controls){controls=document.createElement('div');controls.className='carousel-controls';controls.innerHTML='<button type="button" data-action="prev">←</button><button type="button" class="carousel-pause" data-action="pause"></button><button type="button" data-action="next">→</button>';hero.parentElement.append(controls);
        controls.addEventListener('click',event=>{const action=event.target.closest('button')?.dataset.action,swiper=hero.swiper;if(!swiper)return;if(action==='prev')swiper.slidePrev();if(action==='next')swiper.slideNext();if(action==='pause'){if(swiper.autoplay.running){swiper.autoplay.stop();controls.dataset.paused='true';}else{swiper.autoplay.start();controls.dataset.paused='false';}enhance();}});
      }
      controls.querySelector('[data-action=prev]').setAttribute('aria-label',word('prev'));controls.querySelector('[data-action=next]').setAttribute('aria-label',word('next'));
      const paused=controls.dataset.paused==='true';controls.querySelector('[data-action=pause]').textContent=word(paused?'play':'pause');controls.querySelector('[data-action=pause]').setAttribute('aria-pressed',String(paused));
    }
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){document.querySelectorAll('.swiper').forEach(el=>el.swiper?.autoplay?.stop());if(hero){hero.parentElement.querySelector('.carousel-controls').dataset.paused='true';hero.parentElement.querySelector('.carousel-pause').textContent=word('play');}}
    const gallery=document.getElementById('homeGallerySwiper'),galleryNav=document.querySelector('.home-gallery-nav');
    if(gallery&&galleryNav){
      let pause=galleryNav.querySelector('.gallery-pause');
      if(!pause){pause=document.createElement('button');pause.className='home-gallery-btn gallery-pause';pause.type='button';galleryNav.prepend(pause);pause.addEventListener('click',()=>{const swiper=gallery.swiper;if(!swiper)return;const stopped=swiper.autoplay.running;if(stopped)swiper.autoplay.stop();else swiper.autoplay.start();pause.dataset.paused=String(stopped);pause.setAttribute('aria-pressed',String(stopped));pause.textContent=word(stopped?'play':'pause');});}
      if(matchMedia('(prefers-reduced-motion:reduce)').matches)pause.dataset.paused='true';
      pause.textContent=word(pause.dataset.paused==='true'?'play':'pause');
      gallery.querySelectorAll('.home-gallery-slide').forEach(slide=>slide.setAttribute('aria-label',slide.querySelector('img')?.alt||'Lotus & Champa Gallery'));
    }
    const marquee=document.querySelector('.about-photo-marquee');
    if(marquee&&!marquee.previousElementSibling?.classList.contains('marquee-pause')){
      const pause=document.createElement('button');pause.type='button';pause.className='btn btn-ghost marquee-pause';pause.textContent=word('pause');pause.setAttribute('aria-pressed','false');marquee.before(pause);
      pause.addEventListener('click',()=>{const stopped=marquee.classList.toggle('motion-paused');pause.setAttribute('aria-pressed',String(stopped));pause.textContent=word(stopped?'play':'pause');});
    }
    document.querySelectorAll('img').forEach(img=>{if(!img.hasAttribute('alt'))img.alt='';img.decoding='async';});
    document.querySelectorAll('.main-nav').forEach(nav=>nav.setAttribute('aria-label',word('menu')));
  }
  let queued=false;
  const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;observer.disconnect();enhance();observer.observe(main,{childList:true,subtree:true});});});
  enhance();observer.observe(main,{childList:true,subtree:true});
  document.getElementById('searchInputMobile')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();doSearch(true);}});
  window.addEventListener('hashchange',()=>{
    if(menu.classList.contains('open'))window.toggleMobileMenu();
    requestAnimationFrame(()=>{enhance();if(document.activeElement===document.body||document.activeElement?.closest('#main'))main.focus({preventScroll:true});});
  });
  new MutationObserver(()=>{
    const dialog=document.querySelector('#modalWrap .modal,#modalWrap .photo-lightbox');
    if(dialog){if(dialog!==activeDialog){modalReturn=document.activeElement;activeDialog=dialog;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',dialog.querySelector('h3')?.textContent||'Lotus & Champa');dialog.tabIndex=-1;document.getElementById('site').inert=true;dialog.querySelector('button')?.focus();}}
    else if(activeDialog){activeDialog=null;document.getElementById('site').inert=false;modalReturn?.focus();}
  }).observe(document.getElementById('modalWrap'),{childList:true});
})();
