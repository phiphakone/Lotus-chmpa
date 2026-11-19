/* Shared catalogue: published seed + Firestore overrides. No browser-only product writes.
   Cloudinary Media Library authenticates uploads with the owner's Cloudinary login.
   No API secret, unsigned upload preset, billing upgrade or Storage bucket is needed. */
(() => {
  'use strict';
  const state = { rows:new Map(), ready:false, error:'', unsubscribe:null, config:null, edit:null, busy:false, widget:null };
  const fields = ['name','country','cat','price','oldPrice','stock','origin','desc','story','image'];
  const revision = row => row ? JSON.stringify([...fields,'deleted'].map(key=>row[key])) : 'null';
  const copy = {
    vi: {
      loading:'Đang kết nối danh mục chung…', live:'Đã kết nối. Thay đổi đã lưu sẽ hiển thị cho mọi khách hàng.',
      failed:'Chưa kết nối được danh mục chung. Kiểm tra mạng và quy tắc Firestore rồi thử lại.', retry:'Thử lại',
      image:'Ảnh chính', url:'Liên kết ảnh (HTTPS)', choose:'Tải lên / chọn ảnh',
      imageHelp:'Chọn ảnh trong thư viện rồi nhấn Insert. Nhấn Lưu bên dưới để cập nhật trên website.',
      setup:'Kết nối thư viện ảnh', cloud:'Cloud name của Cloudinary', cloudHelp:'Nhập Cloud name trong bảng điều khiển Cloudinary của bạn. Không nhập mật khẩu hoặc API Secret.',
      loginHelp:'Đăng nhập tài khoản Cloudinary của bạn khi thư viện yêu cầu. Chỉ dùng gói Free.',
      save:'Lưu cho mọi khách hàng', saving:'Đang lưu…', saved:'Đã lưu trên website cho mọi khách hàng.',
      invalid:'Kiểm tra tên, giá, tồn kho và liên kết ảnh. Ảnh phải là liên kết HTTPS trực tiếp; không dùng HTML.',
      denied:'Bạn cần đăng nhập bằng tài khoản quản trị.', offline:'Cần kết nối mạng để lưu thay đổi.',
      saveFailed:'Chưa lưu được. Nội dung vẫn còn để bạn thử lại. Kiểm tra mạng và quyền Firestore.',
      pickFailed:'Không mở được thư viện. Bạn có thể mở Cloudinary, tải ảnh lên và dán liên kết ảnh HTTPS vào đây.',
      pickInvalid:'Chọn một ảnh công khai JPG, PNG, WebP hoặc GIF, tối đa 8 MB.',
      pending:'Ảnh đã chọn. Nhấn Lưu để khách hàng thấy ảnh mới.', configSaved:'Đã kết nối thư viện ảnh.',
      needsSetup:'Kết nối thư viện ảnh trước khi tải ảnh từ thiết bị.', hide:'Ẩn sản phẩm này khỏi website?',
      hidden:'Đã ẩn sản phẩm trên website.', conflict:'Sản phẩm đã thay đổi ở nơi khác. Đóng và mở lại để lấy bản mới nhất.',
      notReady:'Chờ danh mục kết nối thành công trước khi chỉnh sửa.',
      hiddenTitle:'Sản phẩm đã ẩn', restore:'Hiện lại', restored:'Đã hiện lại sản phẩm.'
    },
    th: {
      loading:'กำลังเชื่อมต่อรายการสินค้าส่วนกลาง…', live:'เชื่อมต่อแล้ว ข้อมูลที่บันทึกจะแสดงให้ลูกค้าทุกคนเห็น',
      failed:'ยังเชื่อมต่อรายการสินค้าไม่ได้ โปรดตรวจอินเทอร์เน็ตและกฎ Firestore แล้วลองอีกครั้ง', retry:'ลองอีกครั้ง',
      image:'รูปหลัก', url:'ลิงก์รูปภาพ (HTTPS)', choose:'อัปโหลด / เลือกรูป',
      imageHelp:'เลือกรูปในคลังแล้วกด Insert จากนั้นกดบันทึกด้านล่างเพื่ออัปเดตเว็บไซต์',
      setup:'เชื่อมต่อคลังรูป', cloud:'Cloud name ของ Cloudinary', cloudHelp:'ใส่ Cloud name จากหน้าจัดการ Cloudinary ของคุณ ไม่ต้องใส่รหัสผ่านหรือ API Secret',
      loginHelp:'ล็อกอินบัญชี Cloudinary ของคุณเมื่อคลังรูปขอ ใช้แผน Free เท่านั้น',
      save:'บันทึกให้ลูกค้าทุกคนเห็น', saving:'กำลังบันทึก…', saved:'บันทึกลงเว็บไซต์ให้ลูกค้าทุกคนเห็นแล้ว',
      invalid:'ตรวจชื่อ ราคา สต็อก และลิงก์รูป ต้องเป็นลิงก์รูป HTTPS โดยตรง และไม่ใส่ HTML',
      denied:'กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแล', offline:'ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อบันทึก',
      saveFailed:'ยังบันทึกไม่สำเร็จ ข้อมูลในฟอร์มยังอยู่ โปรดตรวจการเชื่อมต่อและสิทธิ์ Firestore แล้วลองใหม่',
      pickFailed:'เปิดคลังรูปไม่ได้ คุณสามารถเปิด Cloudinary อัปโหลดรูป แล้ววางลิงก์รูป HTTPS ที่นี่ได้',
      pickInvalid:'เลือกรูปสาธารณะ JPG, PNG, WebP หรือ GIF ไม่เกิน 8 MB',
      pending:'เลือกรูปแล้ว กดบันทึกเพื่อให้ลูกค้าเห็นรูปใหม่', configSaved:'เชื่อมต่อคลังรูปแล้ว',
      needsSetup:'เชื่อมต่อคลังรูปก่อนอัปโหลดจากอุปกรณ์', hide:'ซ่อนสินค้านี้จากเว็บไซต์หรือไม่?',
      hidden:'ซ่อนสินค้าจากเว็บไซต์แล้ว', conflict:'สินค้านี้ถูกแก้ไขจากที่อื่น โปรดปิดแล้วเปิดใหม่เพื่อโหลดข้อมูลล่าสุด',
      notReady:'โปรดรอให้เชื่อมต่อรายการสินค้าสำเร็จก่อนแก้ไข',
      hiddenTitle:'สินค้าที่ซ่อนไว้', restore:'แสดงอีกครั้ง', restored:'แสดงสินค้าอีกครั้งแล้ว'
    },
    en: {
      loading:'Connecting to the shared catalogue…', live:'Connected. Saved changes are visible to all customers.',
      failed:'Cannot connect to the catalogue. Check your connection and Firestore rules, then retry.', retry:'Retry',
      image:'Main image', url:'Image link (HTTPS)', choose:'Upload / choose image',
      imageHelp:'Choose an image in the library, press Insert, then Save below to publish it on the website.',
      setup:'Connect image library', cloud:'Cloudinary cloud name', cloudHelp:'Enter the cloud name from your Cloudinary dashboard. Do not enter a password or API Secret.',
      loginHelp:'Sign into your Cloudinary account when prompted by the library. Use the Free plan.',
      save:'Save for all customers', saving:'Saving…', saved:'Saved on the website for all customers.',
      invalid:'Check the name, prices, stock and image link. Use a direct HTTPS image link; HTML is not allowed.',
      denied:'Sign in as an administrator.', offline:'Connect to the internet before saving.',
      saveFailed:'Not saved. Your form is still here. Check your connection and Firestore permissions, then retry.',
      pickFailed:'The library could not open. You can upload in Cloudinary and paste the HTTPS image link here.',
      pickInvalid:'Choose a public JPG, PNG, WebP or GIF image, at most 8 MB.',
      pending:'Image selected. Save to show it to customers.', configSaved:'Image library connected.',
      needsSetup:'Connect your image library before uploading from your device.', hide:'Hide this product from the website?',
      hidden:'Product hidden from the website.', conflict:'This product changed elsewhere. Close and reopen it to load the latest version.',
      notReady:'Wait for the catalogue to connect before editing.',
      hiddenTitle:'Hidden products', restore:'Restore', restored:'Product restored.'
    }
  };
  const msg = key => (copy[CURRENT_LANG] || copy.en)[key];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validId = id => /^[a-zA-Z0-9_-]{1,100}$/.test(id);
  const validImage = url => typeof url === 'string' && url.length <= 2000 &&
    (/^https:\/\/[^\s"'<>\\`]+$/.test(url) || /^images\/[a-zA-Z0-9_./-]+$/.test(url));
  function valid(data) {
    return data && typeof data.name === 'string' && data.name.trim().length > 0 && data.name.length <= 300 &&
      ['lao','vietnam'].includes(data.country) && ['handcraft','specialty','health'].includes(data.cat) &&
      ['price','oldPrice'].every(k => Number.isFinite(data[k]) && data[k] >= 0 && data[k] <= 1e11) && data.price > 0 &&
      Number.isInteger(data.stock) && data.stock >= 0 && data.stock <= 999999 &&
      ['name','origin','desc','story'].every(k => typeof data[k] === 'string' && !/[<>]/.test(data[k])) &&
      data.origin.length <= 300 && data.desc.length <= 10000 && data.story.length <= 20000 && validImage(data.image) && typeof data.deleted === 'boolean';
  }
  function rawProduct(id) {
    const seed = SEED_PRODUCTS.find(p => p.id === id);
    const row = state.rows.get(id);
    if (!seed && !row) return null;
    const p = {...(seed || {id,badges:['New'],badgeStyle:'badge-gold',rating:0,ratingCount:0,sales:0,images:[],tags:[],use:'',target:''})};
    if (row) {
      for (const field of fields) if (field !== 'image') p[field] = row[field];
      p.images = [row.image]; p.fallback = row.image; p.deleted = row.deleted;
      p._editedFields = ['name','origin','desc','story'].filter(k => !seed || row[k] !== seed[k]);
    }
    return p;
  }
  function products() {
    const ids = [...new Set([...SEED_PRODUCTS.map(p=>p.id), ...state.rows.keys()])];
    return ids.map(rawProduct).filter(p=>p && !p.deleted);
  }
  function showError(key) { toast(msg(key),'error'); }
  function guard() {
    if (!isFirebaseAdmin()) { showError('denied'); return false; }
    if (!navigator.onLine) { showError('offline'); return false; }
    if (!state.ready || state.error) { showError('notReady'); return false; }
    return true;
  }
  function refresh() {
    const route = parseHash();
    // Preserve entered checkout/account/contact data; modal is outside the routed container.
    if (['home','products','product'].includes(route.page) || (route.page === 'admin' && (!route.sub || route.sub === 'products'))) {
      const y = window.scrollY; router(); window.scrollTo(0,y);
    }
    window.dispatchEvent(new Event('lc-catalog-changed'));
  }
  function start() {
    if (!window.LCFB?.ready || state.unsubscribe) return;
    const fb = window.LCFB;
    state.error = '';
    state.unsubscribe = fb.onSnapshot(fb.collection(fb.db,'products'), {includeMetadataChanges:true}, snapshot => {
      // A queued local write is not a successful publication. Wait for server acknowledgement.
      if (snapshot.metadata?.hasPendingWrites || snapshot.metadata?.fromCache) return;
      const rows = new Map();
      snapshot.forEach(item => { const data = item.data(); if (validId(item.id) && valid(data)) rows.set(item.id,data); });
      const changed = JSON.stringify([...rows]) !== JSON.stringify([...state.rows]);
      const first = !state.ready;
      state.rows = rows; state.ready = true; state.error = '';
      if (changed || first) refresh();
    }, error => {
      state.error = error.code || 'unavailable'; state.ready = false;
      state.unsubscribe = null; refresh();
    });
  }
  function retry() {
    state.unsubscribe?.(); state.unsubscribe = null; state.ready = false; state.error = ''; start(); refresh();
  }
  function statusHTML() {
    const hidden = [...state.rows].filter(([,p])=>p.deleted);
    return `<div class="admin-card" style="padding:16px;margin-bottom:16px">
      <p role="status">${escape(msg(state.error?'failed':state.ready?'live':'loading'))}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
        <button class="btn btn-ghost btn-sm" onclick="LCCatalog.configure()">${escape(msg('setup'))}</button>
        ${state.error?`<button class="btn btn-ghost btn-sm" onclick="LCCatalog.retry()">${escape(msg('retry'))}</button>`:''}
      </div>
      ${hidden.length?`<details style="margin-top:12px"><summary>${escape(msg('hiddenTitle'))} (${hidden.length})</summary>${hidden.map(([id,p])=>`<p>${escape(p.name)} <button class="btn btn-ghost btn-sm" onclick="LCCatalog.restore('${id}')">${escape(msg('restore'))}</button></p>`).join('')}</details>`:''}
    </div>`;
  }
  function edit(id) {
    if (!guard() || state.busy) return;
    const p = id ? rawProduct(id) : {id:'p-'+crypto.randomUUID(),name:'',country:'vietnam',cat:'specialty',price:0,oldPrice:0,stock:0,origin:'',desc:'',story:'',images:[]};
    if (!p || p.deleted) return;
    state.edit = { id:p.id, revision:revision(state.rows.get(p.id)), isNew:!id };
    const input = (key,type='text',max=300) => `<div class="form-field"><label for="ed-${key}">${t('admin.field.'+({oldPrice:'oldprice'}[key]||key))}</label><input id="ed-${key}" type="${type}" ${type==='number'?'min="0" step="1"':`maxlength="${max}"`} value="${escape(p[key] ?? (type==='number'?0:''))}" ${key==='origin'?'':'required'}></div>`;
    openModal(`<div class="modal-head"><h3>${t(id?'admin.modal.edit':'admin.modal.add')} ${t('admin.modal.product')}</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <form id="catalog-form" class="modal-body"><fieldset id="catalog-fields" style="border:0;padding:0;margin:0;min-width:0"><div class="form-grid">
        ${input('name')}
        <div class="form-field"><label for="ed-country">${t('admin.field.country')}</label><select id="ed-country"><option value="lao" ${p.country==='lao'?'selected':''}>${t('country.lao')}</option><option value="vietnam" ${p.country==='vietnam'?'selected':''}>${t('country.vn')}</option></select></div>
        <div class="form-field"><label for="ed-cat">${t('admin.field.cat')}</label><select id="ed-cat">${['handcraft','specialty','health'].map(cat=>`<option value="${cat}" ${p.cat===cat?'selected':''}>${t('cat.'+cat)}</option>`).join('')}</select></div>
        ${input('price','number')}${input('oldPrice','number')}${input('stock','number')}${input('origin')}
        <div class="form-field full"><label for="ed-desc">${t('admin.field.desc')}</label><textarea id="ed-desc" maxlength="10000" rows="3">${escape(p.desc)}</textarea></div>
        <div class="form-field full"><label for="ed-story">${t('admin.field.story')}</label><textarea id="ed-story" maxlength="20000" rows="3">${escape(p.story)}</textarea></div>
        <div class="form-field full"><label for="ed-image">${escape(msg('url'))}</label><input id="ed-image" maxlength="2000" value="${escape(p.images?.[0] || p.fallback || '')}" required>
          <img id="catalog-preview" alt="${escape(msg('image'))}" style="width:100%;max-height:220px;object-fit:contain;margin:12px 0" ${p.images?.[0]||p.fallback?`src="${escape(imgUrl(p))}"`:'hidden'}>
          <button type="button" id="catalog-pick" class="btn btn-ghost" onclick="LCCatalog.choose()">${escape(msg('choose'))}</button>
          <p style="font-size:.85rem;margin-top:8px">${escape(msg('imageHelp'))}</p>
          <p id="catalog-image-status" role="status" style="font-size:.85rem"></p>
        </div></div>
        <p id="catalog-save-status" role="alert" style="margin:12px 0"></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-ghost" onclick="closeModal()">${t('common.cancel')}</button><button id="catalog-save" type="submit" class="btn btn-gold">${escape(msg('save'))}</button></div>
      </fieldset></form>`);
    const form = document.getElementById('catalog-form');
    form.addEventListener('submit', event => { event.preventDefault(); save(); });
    document.getElementById('ed-image').addEventListener('input', preview);
  }
  function preview() {
    const input = document.getElementById('ed-image'), image = document.getElementById('catalog-preview');
    if (!input || !image) return;
    const url = input.value.trim(); image.hidden = !validImage(url);
    if (!image.hidden) image.src = url; else image.removeAttribute('src');
  }
  async function save() {
    if (!guard() || state.busy || !state.edit) return;
    const edit = state.edit, form = document.getElementById('catalog-form');
    if (!form) return;
    const data = {deleted:false};
    for (const key of fields) { const value = document.getElementById('ed-'+key).value.trim(); data[key] = ['price','oldPrice','stock'].includes(key) ? Number(value) : value; }
    if (!valid(data)) { showError('invalid'); return; }
    if (edit.revision !== revision(state.rows.get(edit.id))) { showError('conflict'); return; }
    state.busy = true; document.getElementById('catalog-fields').disabled = true;
    const button = document.getElementById('catalog-save'); button.textContent = msg('saving');
    try {
      const fb = window.LCFB;
      await fb.setDoc(fb.doc(fb.db,'products',edit.id), {...data,updatedAt:fb.serverTimestamp()});
      // setDoc resolves only after the server accepts the write.
      state.rows.set(edit.id,data);
      if (state.edit === edit && document.getElementById('catalog-form') === form) {state.edit=null;state.picker=null;state.widget?.hide();originalClose();}
      toast(msg('saved')); refresh();
    } catch (_) {
      const status = form.querySelector('#catalog-save-status'); if (status) status.textContent = msg('saveFailed');
    } finally {
      state.busy = false;
      const fieldset = form.querySelector('fieldset'); if (fieldset) fieldset.disabled = false;
      button.textContent = msg('save');
    }
  }
  async function setHidden(id, deleted) {
    if (!guard() || state.busy || !validId(id)) return;
    const p = rawProduct(id); if (!p || (deleted && !confirm(msg('hide')))) return;
    const data = {deleted};
    for (const key of fields) data[key] = key === 'image' ? (p.images?.[0] || p.fallback) : (p[key] ?? (['price','oldPrice','stock'].includes(key)?0:''));
    if (!valid(data)) { showError('invalid'); return; }
    state.busy = true;
    try {
      const fb = window.LCFB; await fb.setDoc(fb.doc(fb.db,'products',id),{...data,updatedAt:fb.serverTimestamp()});
      state.rows.set(id,data); toast(msg(deleted?'hidden':'restored')); refresh();
    } catch (_) { showError('saveFailed'); } finally { state.busy = false; }
  }
  async function loadConfig() {
    if (state.config) return state.config;
    const fb = window.LCFB, snap = await fb.getDoc(fb.doc(fb.db,'catalogSettings','media'));
    const data = snap.exists() ? snap.data() : null;
    if (data && /^[a-z0-9_-]{1,100}$/.test(data.cloudName)) state.config = {cloudName:data.cloudName};
    return state.config;
  }
  async function configure() {
    if (!guard() || state.busy) return;
    try { await loadConfig(); } catch (_) { showError('saveFailed'); return; }
    openModal(`<div class="modal-head"><h3>${escape(msg('setup'))}</h3><button class="modal-close" onclick="closeModal()">✕</button></div><form id="catalog-config" class="modal-body">
      <div class="form-field"><label for="catalog-cloud">${escape(msg('cloud'))}</label><input id="catalog-cloud" required pattern="[a-z0-9_-]{1,100}" maxlength="100" value="${escape(state.config?.cloudName || '')}"></div>
      <p style="margin:12px 0">${escape(msg('cloudHelp'))}</p><p style="margin:12px 0">${escape(msg('loginHelp'))}</p>
      <a href="https://console.cloudinary.com/" target="_blank" rel="noopener noreferrer">Cloudinary ↗</a>
      <p id="catalog-config-status" role="alert"></p><button type="submit" class="btn btn-gold" style="margin-top:16px">${t('common.save')}</button></form>`);
    const form = document.getElementById('catalog-config');
    form.onsubmit = async event => {
      event.preventDefault(); if (!guard() || state.busy) return;
      const cloudName = document.getElementById('catalog-cloud').value.trim(); if (!/^[a-z0-9_-]{1,100}$/.test(cloudName)) return;
      const button = form.querySelector('button'); state.busy = true; button.disabled = true;
      try {
        const fb = window.LCFB; await fb.setDoc(fb.doc(fb.db,'catalogSettings','media'),{cloudName});
        state.config = {cloudName}; state.widget?.hide(); state.widget = null;
        originalClose(); toast(msg('configSaved'));
      } catch (_) { form.querySelector('#catalog-config-status').textContent = msg('saveFailed'); }
      finally { state.busy = false; button.disabled = false; }
    };
  }
  let widgetScript;
  function loadWidget() {
    if (window.cloudinary?.createMediaLibrary) return Promise.resolve();
    if (!widgetScript) widgetScript = new Promise((resolve,reject) => {
      const script = document.createElement('script'); script.src = 'https://media-library.cloudinary.com/global/all.js';
      const timeout = setTimeout(()=>{script.remove();widgetScript=null;reject(new Error('timeout'));},20000);
      script.onload = () => {clearTimeout(timeout);resolve();};
      script.onerror = () => {clearTimeout(timeout);script.remove();widgetScript=null;reject(new Error('script'));};
      document.head.appendChild(script);
    });
    return widgetScript;
  }
  async function choose() {
    if (!guard() || state.busy) return;
    const form = document.getElementById('catalog-form'), edit = state.edit;
    const button = document.getElementById('catalog-pick'); if (!form || !button) return;
    button.disabled = true;
    try {
      const config = await loadConfig();
      if (!config) { form.querySelector('#catalog-image-status').textContent = msg('needsSetup'); return; }
      await loadWidget();
      if (document.getElementById('catalog-form') !== form || state.edit !== edit || !isFirebaseAdmin()) return;
      if (!state.widget) state.widget = window.cloudinary.createMediaLibrary({cloud_name:config.cloudName,multiple:false}, {
        insertHandler: data => {
          const current = state.picker;
          if (!current || state.edit !== current.edit || document.getElementById('catalog-form') !== current.form || !isFirebaseAdmin() || state.busy) return;
          const asset = data.assets?.[0];
          if (!asset || asset.resource_type !== 'image' || asset.type !== 'upload' || !['jpg','jpeg','png','webp','gif'].includes(asset.format) || asset.bytes > 8*1024*1024 || !validImage(asset.secure_url) || !asset.secure_url.startsWith('https://res.cloudinary.com/'+state.config.cloudName+'/image/upload/')) { showError('pickInvalid'); return; }
          // Versioned URLs ensure a changed image does not reuse the old browser cache key.
          document.getElementById('ed-image').value = asset.secure_url;
          preview(); current.form.querySelector('#catalog-image-status').textContent = msg('pending');
        }
      });
      state.picker = {form,edit}; state.widget.show();
    } catch (_) { form.querySelector('#catalog-image-status').textContent = msg('pickFailed'); }
    finally { button.disabled = false; }
  }
  window.LCCatalog = {products,escape,statusHTML,retry,edit,save,choose,configure,restore:id=>setHidden(id,false),hide:id=>setHidden(id,true)};
  window.adminEditProduct = edit; window.adminSaveProduct = save; window.adminDeleteProduct = id=>setHidden(id,true);
  const originalClose = window.closeModal;
  window.closeModal = () => { if (state.busy) return; state.widget?.hide(); state.edit = null; state.picker = null; originalClose(); };
  window.addEventListener('lc-auth-reset', () => { state.config=null; state.picker=null; state.widget?.hide(); state.widget=null; if (state.edit) {state.edit=null; originalClose();} });
  window.addEventListener('lcfb-ready', start);
  window.addEventListener('online', () => {if (!state.unsubscribe) retry();});
  start();
})();
