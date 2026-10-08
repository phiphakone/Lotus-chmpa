/* Account screens and order tracking. Uses the website's existing Firebase session. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy = {
    welcome:['Chào mừng trở lại','Welcome back','ยินดีต้อนรับกลับ','ຍິນດີຕ້ອນຮັບກັບຄືນ','欢迎回来'],
    subtitle:['Một nơi lưu giữ những điều bạn yêu.','A home for the things you love.','พื้นที่สำหรับสิ่งที่คุณรัก','ບ່ອນເກັບສິ່ງທີ່ທ່ານຮັກ','收藏您所喜爱的美好。'],
    join:['Tạo tài khoản','Create an account','สร้างบัญชี','ສ້າງບັນຊີ','创建账户'],
    joinSub:['Cùng khám phá câu chuyện thủ công Việt – Lào.','Discover the craft of Vietnam and Laos.','ค้นพบงานฝีมือเวียดนามและลาว','ຄົ້ນພົບຫັດຖະກຳຫວຽດນາມ ແລະ ລາວ','探索越南与老挝的手工艺。'],
    home:['Về cửa hàng','Back to shop','กลับไปที่ร้าน','ກັບໄປຮ້ານ','返回商店'],
    remember:['Ghi nhớ đăng nhập','Remember me','จดจำการเข้าสู่ระบบ','ຈື່ການເຂົ້າລະບົບ','记住我'],
    forgot:['Quên mật khẩu?','Forgot password?','ลืมรหัสผ่าน?','ລືມລະຫັດຜ່ານ?','忘记密码？'],
    reset:['Đặt lại mật khẩu','Reset password','รีเซ็ตรหัสผ่าน','ຕັ້ງລະຫັດຜ່ານໃໝ່','重置密码'],
    resetSub:['Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.','Enter your account email to request a reset link.','กรอกอีเมลบัญชีเพื่อรับลิงก์รีเซ็ตรหัสผ่าน','ປ້ອນອີເມວເພື່ອຮັບລິ້ງຕັ້ງລະຫັດຜ່ານ','输入账户邮箱以获取重置链接。'],
    send:['Gửi liên kết','Send reset link','ส่งลิงก์','ສົ່ງລິ້ງ','发送链接'],
    sent:['Nếu email có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu. Kiểm tra cả thư rác nhé.','If an account exists, a reset link will arrive. Please check spam too.','หากมีบัญชีนี้ คุณจะได้รับลิงก์ โปรดตรวจสอบอีเมลขยะด้วย','ຖ້າມີບັນຊີ ທ່ານຈະໄດ້ຮັບລິ້ງ ກະລຸນາກວດເບິ່ງຈົດໝາຍຂະຫຍະ','如果该邮箱已注册，您将收到重置链接，请检查垃圾邮件。'],
    confirm:['Nhập lại mật khẩu','Confirm password','ยืนยันรหัสผ่าน','ຢືນຢັນລະຫັດຜ່ານ','确认密码'],
    mismatch:['Hai mật khẩu chưa khớp.','Passwords do not match.','รหัสผ่านไม่ตรงกัน','ລະຫັດຜ່ານບໍ່ກົງກັນ','两次密码不一致。'],
    or:['hoặc tiếp tục với','or continue with','หรือดำเนินการต่อด้วย','ຫຼື ສືບຕໍ່ດ້ວຍ','或继续使用'],
    google:['Tiếp tục với Google','Continue with Google','ดำเนินการต่อด้วย Google','ສືບຕໍ່ດ້ວຍ Google','使用 Google 继续'],
    newHere:['Chưa có tài khoản?','New here?','ยังไม่มีบัญชี?','ຍັງບໍ່ມີບັນຊີ?','还没有账户？'],
    haveAccount:['Đã có tài khoản?','Already have an account?','มีบัญชีแล้ว?','ມີບັນຊີແລ້ວ?','已有账户？'],
    show:['Hiện mật khẩu','Show password','แสดงรหัสผ่าน','ສະແດງລະຫັດຜ່ານ','显示密码'],
    hide:['Ẩn mật khẩu','Hide password','ซ่อนรหัสผ่าน','ເຊື່ອງລະຫັດຜ່ານ','隐藏密码'],
    loading:['Đang xử lý…','Working…','กำลังดำเนินการ…','ກຳລັງດຳເນີນການ…','处理中…'],
    connecting:['Chưa kết nối được Firebase. Vui lòng tải lại trang.','Firebase is unavailable. Please reload.','เชื่อมต่อ Firebase ไม่ได้ กรุณาโหลดหน้าใหม่','ເຊື່ອມຕໍ່ Firebase ບໍ່ໄດ້ ກະລຸນາໂຫຼດໃໝ່','无法连接 Firebase，请刷新。'],
    failed:['Không thực hiện được. Vui lòng thử lại.','Unable to continue. Please try again.','ดำเนินการไม่ได้ กรุณาลองอีกครั้ง','ດຳເນີນການບໍ່ໄດ້ ກະລຸນາລອງໃໝ່','操作失败，请重试。'],
    credentials:['Email hoặc mật khẩu chưa đúng.','Email or password is incorrect.','อีเมลหรือรหัสผ่านไม่ถูกต้อง','ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກ','邮箱或密码不正确。'],
    emailUsed:['Email đã có tài khoản. Hãy đăng nhập.','This email already has an account. Sign in instead.','อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบ','ອີເມວນີ້ມີບັນຊີແລ້ວ ກະລຸນາເຂົ້າລະບົບ','该邮箱已注册，请登录。'],
    googleSetup:['Cần bật Google trong Firebase Authentication và thêm tên miền website vào Authorized domains.','Enable Google in Firebase Authentication and add the website to Authorized domains.','เปิด Google ใน Firebase Authentication และเพิ่มโดเมนเว็บไซต์ใน Authorized domains','ເປີດ Google ໃນ Firebase Authentication ແລະ ເພີ່ມໂດເມນເວັບໄຊ','请在 Firebase Authentication 启用 Google 并添加授权域名。'],
    popup:['Cửa sổ Google đã đóng hoặc bị chặn. Vui lòng thử lại.','Google popup closed or blocked. Please try again.','หน้าต่าง Google ปิดหรือถูกบล็อก กรุณาลองใหม่','ໜ້າຕ່າງ Google ປິດ ຫຼື ຖືກບລັອກ','Google 窗口已关闭或被阻止，请重试。'],
    journey:['Hành trình đơn hàng','Your order journey','ติดตามคำสั่งซื้อ','ຕິດຕາມຄຳສັ່ງຊື້','订单进度'],
    journeySub:['Theo dõi từng bước, từ cửa hàng đến tay bạn.','Follow each step, from our shop to your door.','ติดตามทุกขั้นตอนจากร้านถึงมือคุณ','ຕິດຕາມທຸກຂັ້ນຕອນຈາກຮ້ານເຖິງມືທ່ານ','查看从商店到您手中的每一步。'],
    placed:['Đã nhận đơn','Order received','รับคำสั่งซื้อแล้ว','ໄດ້ຮັບຄຳສັ່ງຊື້','已收到订单'],
    confirmed:['Đã xác nhận','Confirmed','ยืนยันแล้ว','ຢືນຢັນແລ້ວ','已确认'],
    shipped:['Đang giao hàng','Shipped','กำลังจัดส่ง','ກຳລັງຈັດສົ່ງ','配送中'],
    completed:['Hoàn thành','Completed','สำเร็จ','ສຳເລັດ','已完成'],
    cancelled:['Đơn hàng đã hủy','Order cancelled','ยกเลิกคำสั่งซื้อแล้ว','ຍົກເລີກຄຳສັ່ງຊື້ແລ້ວ','订单已取消'],
    pending:['Chờ xác nhận','Awaiting confirmation','รอยืนยัน','ລໍຖ້າຢືນຢັນ','等待确认'],
    waiting:['Chờ cập nhật','Awaiting update','รออัปเดต','ລໍຖ້າອັບເດດ','等待更新'],
    done:['Đã hoàn tất bước này','Step completed','ขั้นตอนเสร็จแล้ว','ຂັ້ນຕອນສຳເລັດແລ້ວ','此步骤已完成'],
    current:['Trạng thái hiện tại','Current status','สถานะปัจจุบัน','ສະຖານະປັດຈຸບັນ','当前状态'],
    note:['Trạng thái cập nhật khi cửa hàng xử lý đơn. Đây không phải vị trí GPS trực tiếp.','Status updates as the shop processes your order. This is not live GPS tracking.','สถานะอัปเดตเมื่อร้านดำเนินการ ไม่ใช่ตำแหน่ง GPS แบบสด','ສະຖານະອັບເດດເມື່ອຮ້ານດຳເນີນການ ບໍ່ແມ່ນ GPS ສົດ','状态随商店处理更新，并非实时 GPS。'],
    details:['Thông tin đơn hàng','Order details','รายละเอียดคำสั่งซื้อ','ລາຍລະອຽດຄຳສັ່ງຊື້','订单详情'],
    view:['Xem chi tiết','View details','ดูรายละเอียด','ເບິ່ງລາຍລະອຽດ','查看详情'],
    unavailable:['Chưa xem được đơn hàng. Hãy đăng nhập đúng tài khoản đặt hàng và thử lại.','Order unavailable. Sign in with the account that placed it and try again.','ไม่สามารถดูคำสั่งซื้อได้ โปรดเข้าสู่บัญชีที่สั่งซื้อแล้วลองใหม่','ເບິ່ງຄຳສັ່ງຊື້ບໍ່ໄດ້ ກະລຸນາເຂົ້າບັນຊີທີ່ສັ່ງຊື້','无法查看订单，请使用下单账户登录后重试。'],
    orderError:['Không tải được đơn hàng. Kiểm tra kết nối hoặc quyền truy cập Firebase.','Unable to load orders. Check your connection or Firebase access.','โหลดคำสั่งซื้อไม่ได้ ตรวจสอบการเชื่อมต่อหรือสิทธิ์ Firebase','ໂຫຼດຄຳສັ່ງຊື້ບໍ່ໄດ້ ກວດເບິ່ງການເຊື່ອມຕໍ່ ຫຼື ສິດ Firebase','无法加载订单，请检查网络或 Firebase 权限。']
  };
  const words = key => copy[key]?.[Math.max(0,['vi','en','th','lo','zh'].indexOf(CURRENT_LANG))] || key;
  const icon = name => `<svg class="ux-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',eye:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',back:'<path d="M19 12H5m5-5-5 5 5 5"/>',check:'<path d="m5 12 4 4L19 6"/>',box:'<path d="m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5v5"/>',flower:'<path d="M12 21C5 19 1 14 3 8c5 0 8 4 9 8 1-4 4-8 9-8 2 6-2 11-9 13Zm0-5C8 12 8 6 12 2c4 4 4 10 0 14Z"/>'})[name] || ''}</svg>`;
  const googleIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.7Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3a10 10 0 0 0 0 9.2l3.4-2.7Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7C7.2 7.8 9.4 6 12 6Z"/></svg>';
  function field(name,label,type,autocomplete){
    const password=type==='password';
    return `<div class="ux-field"><label for="ux-${name}">${escape(label)}</label><div class="ux-input-wrap">${icon(password?'lock':type==='email'?'mail':'user')}<input id="ux-${name}" name="${name}" type="${type}" autocomplete="${autocomplete}" required ${password&&autocomplete==='new-password'?'minlength="6"':''} ${type==='text'?'maxlength="100"':''}>${password?`<button class="ux-toggle" type="button" data-password="ux-${name}" aria-label="${escape(words('show'))}" aria-pressed="false">${icon('eye')}</button>`:''}</div></div>`;
  }
  function authScreen(){
    const view=parseHash().params.view, mode=view==='register'?'register':view==='reset'?'reset':'login';
    const register=mode==='register', reset=mode==='reset';
    return `<section class="ux-auth ${register?'ux-auth-register':''}"><div class="ux-auth-top"><a class="ux-brand" href="#/"><img src="images/logo.jpg" alt=""><span><strong>Lotus & Champa</strong><small>Vietnam · Laos</small></span></a><a class="ux-back" href="#/">${icon('back')}${words('home')}</a></div><div class="ux-auth-stage"><div class="ux-auth-orbit" aria-hidden="true"></div><div class="ux-auth-frame"><div class="ux-auth-card"><div class="ux-auth-mark">${icon(reset?'lock':'flower')}</div><div class="ux-auth-heading"><h1>${words(reset?'reset':register?'join':'welcome')}</h1><p>${words(reset?'resetSub':register?'joinSub':'subtitle')}</p></div><form id="uxAuthForm" data-mode="${mode}"><div class="ux-auth-message" role="status" aria-live="polite"></div>${register?field('name',t('acc.name'),'text','name'):''}${field('email','Email','email','email')}${reset?'':field('password',t('acc.password'),'password',register?'new-password':'current-password')}${register?field('confirm',words('confirm'),'password','new-password'):''}${reset?'':`<div class="ux-auth-row"><label class="ux-check"><input type="checkbox" name="remember" checked>${words('remember')}</label>${register?'':`<a href="#/account?view=reset">${words('forgot')}</a>`}</div>`}<button type="submit" class="ux-submit">${reset?words('send'):register?t('acc.register'):t('acc.login')}${icon('arrow')}</button>${reset?'':`<div class="ux-separator">${words('or')}</div><button type="button" class="ux-google">${googleIcon}${words('google')}</button>`}</form><p class="ux-auth-switch">${register||reset?`${reset?'':words('haveAccount')} <a href="#/account">${t('acc.login')}</a>`:`${words('newHere')} <a href="#/account?view=register">${t('acc.register')}</a>`}</p></div></div></div><div class="ux-auth-footer">${icon('flower')} Lotus & Champa · Vietnam & Laos</div></section>`;
  }
  function message(form,text,success=false){const el=form.querySelector('.ux-auth-message');el.textContent=text;el.dataset.state=success?'success':'error';}
  function errorText(error){
    const code=error?.code||'';
    if(/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code))return words('credentials');
    if(/email-already-in-use|credential-already-in-use|account-exists-with-different-credential/.test(code))return words('emailUsed');
    if(/operation-not-allowed|unauthorized-domain/.test(code))return words('googleSetup');
    if(/popup/.test(code))return words('popup');
    return words('failed')+(code?' ('+code+')':'');
  }
  async function submit(form,google=false){
    if(form.dataset.busy)return;
    const mode=form.dataset.mode,data=new FormData(form),fb=window.LCFB;
    message(form,'');
    if(!fb?.ready){message(form,words('connecting'));return;}
    if(!google&&mode==='register'&&data.get('password')!==data.get('confirm')){message(form,words('mismatch'));return;}
    const controls=[...form.querySelectorAll('button')],button=google?form.querySelector('.ux-google'):form.querySelector('.ux-submit'),old=button.innerHTML;
    form.dataset.busy='1';controls.forEach(el=>el.disabled=true);button.textContent=words('loading');
    try{
      if(mode==='reset'&&!google){await fb.lcResetPassword(String(data.get('email')).trim());message(form,words('sent'),true);return;}
      await fb.lcSetPersistence(data.get('remember')==='on');
      if(google){await fb.lcGoogleLogin();}
      else{
        const args={email:String(data.get('email')).trim(),password:String(data.get('password')),name:String(data.get('name')||'').trim()};
        const profile=await (mode==='register'?fb.lcRegister(args):fb.lcLogin(args));
        await fb.lcRefreshSession();
        Store.set('user',profile);
      }
      if(parseHash().page==='account'){location.hash='#/account';router();}
    }catch(error){if(mode==='reset'&&error.code==='auth/user-not-found')message(form,words('sent'),true);else message(form,errorText(error));}
    finally{delete form.dataset.busy;controls.forEach(el=>el.disabled=false);button.innerHTML=old;}
  }
  window.attachAccountEvents=function(){
    const form=document.getElementById('uxAuthForm');if(!form)return;
    form.addEventListener('submit',event=>{event.preventDefault();submit(form);});
    form.querySelector('.ux-google')?.addEventListener('click',()=>submit(form,true));
    form.querySelectorAll('[data-password]').forEach(button=>button.addEventListener('click',()=>{
      const input=document.getElementById(button.dataset.password),show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',words(show?'hide':'show'));
    }));
    if(matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches){
      const frame=document.querySelector('.ux-auth-frame');
      frame.addEventListener('pointermove',event=>{const r=frame.getBoundingClientRect();frame.style.transform=`rotateX(${-(event.clientY-r.top-r.height/2)/150}deg) rotateY(${(event.clientX-r.left-r.width/2)/150}deg)`;});
      frame.addEventListener('pointerleave',()=>frame.style.transform='');
    }
  };
  const date = value => {const d=value?.toDate?.()||new Date(value);return value&&!isNaN(d)?d.toLocaleString({vi:'vi-VN',en:'en-GB',th:'th-TH',lo:'lo-LA',zh:'zh-CN'}[CURRENT_LANG]||'vi-VN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';};
  const status = order => `<span class="ux-status" data-state="${escape(order.status)}">${escape(words(['pending','confirmed','shipped','completed','cancelled'].includes(order.status)?order.status:'waiting'))}</span>`;
  function tracking(order){
    if(order.status==='cancelled')return `<div class="ux-cancelled">${words('cancelled')}</div><p class="ux-track-note">${escape(date(order.createdAt))} · ${words('placed')}</p>`;
    const stages=['pending','confirmed','shipped','completed'],active=stages.indexOf(order.status);
    return `<ol class="ux-tracking" aria-label="${words('journey')}">${stages.map((key,i)=>`<li class="ux-track-step ${i<=active?'ux-step-done':''} ${i<active?'ux-step-linked':''} ${i===active?'ux-step-current':''}" ${i===active?'aria-current="step"':''}><span class="ux-step-dot">${i<=active?icon('check'):''}</span><div class="ux-step-copy"><strong>${words(i===0?'placed':key)}</strong><p>${i===0?escape(date(order.createdAt)):words(i===active?'current':i<active?'done':'waiting')}</p></div></li>`).join('')}</ol><p class="ux-track-note">${words('note')}</p>`;
  }
  window.renderAccount=function(){
    const user=Store.get('user',null);if(!user)return authScreen();
    subscribeOrdersIfNeeded();
    const orders=getOrders().filter(order=>order.ownerUid===window.LCFB?.auth?.currentUser?.uid);
    const favorites=getProducts().filter(p=>Store.get('favs',[]).includes(p.id));
    return `<div class="container ux-account"><div class="ux-account-heading"><div><p class="ux-eyebrow">Lotus & Champa</p><h1>${t('acc.greeting')} ${escape(user.name||'')}</h1><p>${words('journeySub')}</p></div></div><div class="ux-account-grid"><aside class="ux-profile"><div class="ux-avatar">${escape((user.name||'L').charAt(0).toUpperCase())}</div><strong>${escape(user.name)}</strong><p>${escape(user.email||user.phone)}</p><a href="#/products">${icon('box')}${words('home')}</a><button onclick="logoutUser()">${icon('back')}${t('acc.logout')}</button></aside><div><section class="ux-panel"><div class="ux-panel-head"><h2>${t('acc.history')}</h2><span class="ux-count">${orders.length}</span></div>${window._fbOrdersError?`<div class="ux-empty" role="status">${words('orderError')}</div>`:window._fbOrdersLoading?`<div class="ux-empty" role="status">${words('loading')}</div>`:orders.length?orders.map((order,i)=>`<details class="ux-order" ${i===0?'open':''}><summary><div><div class="ux-order-id">#${escape(order.id.slice(0,12))}</div><div class="ux-order-date">${escape(date(order.createdAt))}</div></div><div class="ux-order-total">${fmtPrice(order.total)}<small>${status(order)}</small></div></summary>${tracking(order)}<a class="btn btn-ghost" href="#/order-success?id=${encodeURIComponent(order.id)}">${words('view')} ${icon('arrow')}</a></details>`).join(''):`<div class="ux-empty">${icon('box')}${t('acc.noOrders')}<br><a class="btn btn-ghost" href="#/products">${words('home')}</a></div>`}</section><section class="ux-panel"><div class="ux-panel-head"><h2>${t('acc.favs')}</h2><span class="ux-count">${favorites.length}</span></div>${favorites.length?`<div class="ux-favorites">${favorites.map(productCard).join('')}</div>`:`<div class="ux-empty">${t('acc.noFavs')}</div>`}</section></div></div></div>`;
  };
  function orderContent(id){
    const uid=window.LCFB?.auth?.currentUser?.uid;
    const cached=Store.get('lastOrder',null);
    const order=getOrders().find(o=>o.id===id&&(o.ownerUid===uid||isFirebaseAdmin())) || (uid&&cached?.id===id&&cached.ownerUid===uid?cached:null);
    if(!order)return `<div class="ux-panel ux-empty" role="status">${words(window._fbOrdersError?'orderError':window._fbOrdersLoading&&uid?'loading':'unavailable')}</div>`;
    const rows=[[t('co.success.customer'),order.name||order.customer?.name],[t('co.success.phone'),order.phone||order.customer?.phone],[t('co.success.address'),order.address||order.customer?.addr]];
    return `<div class="ux-success-grid"><section class="ux-panel"><div class="ux-success-label"><strong>#${escape(order.id)}</strong>${status(order)}</div>${tracking(order)}${window._fbOrdersError?`<p role="status">${words('orderError')}</p>`:''}</section><section class="ux-panel"><h2>${words('details')}</h2><dl class="ux-details">${rows.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value||'—')}</dd></div>`).join('')}<div><dt>${t('co.success.totalLine')}</dt><dd>${fmtPrice(order.total)}</dd></div></dl></section></div>`;
  }
  window.renderOrderSuccess=function(id){subscribeOrdersIfNeeded();return `<section class="ux-success"><div class="ux-success-top">${icon('box')}<p class="ux-eyebrow">Lotus & Champa</p><h1>${words('journey')}</h1><p>${words('journeySub')}</p></div><div id="uxOrderContent">${orderContent(id)}</div><div class="ux-success-actions"><a class="btn btn-primary" href="#/account">${t('acc.title')}</a><a class="btn btn-ghost" href="#/products">${t('co.success.continue')}</a></div></section>`;};
  window.uxRefreshOrderTracking=function(){const target=document.getElementById('uxOrderContent');if(target)target.innerHTML=orderContent(parseHash().params.id);};
  window.addEventListener('lcfb-ready',()=>{if(['account','order-success'].includes(parseHash().page)){subscribeOrdersIfNeeded();router();}});
  router();
})();
