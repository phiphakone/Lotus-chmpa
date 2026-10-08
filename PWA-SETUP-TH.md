# คู่มือเผยแพร่ LOTUS & CHAMPA PWA
ตรวจและปรับปรุงวันที่ 8 ตุลาคม 2026

## GitHub Pages
1. ใช้ repository เดิมถ้ามี หรือสร้าง repository ใหม่ โดยวาง index.html ที่ราก repository พร้อม assets, images, icons และไฟล์ภาพ .jpg ที่รากโครงการ
2. อัปโหลดไฟล์ที่แก้ไขทั้งหมด รวม .github/workflows/pages.yml, manifest.json, sw.js, offline.html และ scripts/prepare-pwa.cjs อย่าอัปโหลด node_modules, โฟลเดอร์ outputs/original หรือไฟล์สำรองจากเครื่อง
3. ใช้สาขา main แล้วเลือก Settings → Pages → Build and deployment → Source: GitHub Actions
4. ไป Actions ตรวจ workflow “Deploy LOTUS & CHAMPA” หาก repository ใช้สาขาอื่น ให้แก้ branches: [main] ใน workflow ให้ตรงสาขา
5. เมื่อสำเร็จ เปิด URL ที่ GitHub Pages แสดง เช่น https://ชื่อบัญชี.github.io/ชื่อrepository/ ใช้ HTTPS เสมอ
6. ทุกครั้งที่ push ระบบคำนวณลายนิ้วมือจาก HTML, JavaScript, CSS และภาพ เพื่อเปลี่ยนเวอร์ชัน Service Worker และเผยแพร่ไฟล์สาธารณะเท่านั้น
7. หากใช้การเผยแพร่จาก branch แทน workflow ต้องรัน node scripts/prepare-pwa.cjs ก่อน commit ทุกครั้ง เพื่อให้การเปลี่ยน HTML/ภาพทำให้เวอร์ชัน PWA เปลี่ยนด้วย แนะนำใช้ workflow ที่ให้มา

เส้นทาง manifest/start_url/scope ใช้ ./ และ Service Worker คำนวณฐานจากตำแหน่ง assets/pwa.js ไม่ต้องกรอกชื่อ repository ในโค้ด รองรับโดเมนส่วนตัวที่ชี้มายังรากเว็บไซต์ด้วย

อ้างอิง: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Firebase ที่เจ้าของโครงการต้องตรวจ
โครงการเดิม: lotus-1a491 ไม่ได้เปลี่ยน apiKey/authDomain/appId หรือย้ายข้อมูล
- Firebase Console → Authentication → Sign-in method: ตรวจว่า Email/Password เปิดอยู่ และ Anonymous เปิดสำหรับการสั่งซื้อแบบไม่สมัครบัญชี
- Google Sign-in ต้องเปิด provider Google หากต้องการใช้ปุ่มนี้
- Authentication → Settings → Authorized domains: เพิ่มเฉพาะ hostname เช่น ชื่อบัญชี.github.io โดยไม่ใส่ https:// หรือ /ชื่อrepository/ และเพิ่มโดเมนส่วนตัวถ้ามี
- localhost/127.0.0.1 ใช้เพื่อทดสอบเท่านั้น ตรวจการอนุญาตโดเมนเองหากทดสอบ Auth จริงบนเครื่อง
- ตรวจ Firestore และ Storage ที่โครงการเดิม รวมถึงค่าใช้บริการ/โควตาและการตั้งค่าของโครงการ

## เผยแพร่ Firestore Rules ด้วยตัวเอง
1. สำรอง Rules ที่ใช้งานจริงจาก Firebase Console ไว้ก่อน ไฟล์ Rules ในเครื่องไม่ใช่หลักฐานว่า Rules บนระบบจริงเหมือนกัน
2. อ่าน firestore.rules ฉบับใหม่และรายงาน AUDIT-PWA-TH.md ให้ครบ โดยเฉพาะข้อจำกัด 5 ประเภทสินค้าต่อคำสั่งซื้อใหม่
3. ที่ Firestore Database → Rules วางเนื้อหาของ firestore.rules และทดสอบใน Rules Playground หรือ Emulator ก่อน Publish
4. ตรวจว่าบัญชี Admin เดิม UID fmkw0LyA8yWYYZBbePmDx3g5JWE2 ยังเป็นของเจ้าของที่ถูกต้อง หรือบัญชี Admin อื่นมีเอกสาร admins/{uid} พร้อม enabled: true ซึ่งต้องสร้างโดยผู้ดูแลที่เชื่อถือได้จาก Console เท่านั้น
5. ลูกค้าอ่านคำสั่งซื้อของ UID ตัวเองเท่านั้น Admin อ่านและเปลี่ยนสถานะได้ ลูกค้าและ Admin ผ่านหน้า Client สร้างสิทธิ์ Admin ให้ตัวเองไม่ได้
6. storage.rules เดิมยังคงไว้ หาก Rules บน Storage ไม่ตรง ให้เจ้าของตรวจและเลือก Publish ด้วยตัวเอง ห้ามใช้ allow read, write: if true
7. ไม่ต้องใช้ Firebase Admin SDK หรือ private key บน Client ไม่ต้องแก้ Netlify Functions
8. เมื่อเว็บไซต์และ Rules พร้อม ให้ตรวจการเข้าสู่ระบบและอ่านคำสั่งซื้อเดิมโดยใช้บัญชีที่มีสิทธิ์ การสร้างคำสั่งซื้อทดสอบบนข้อมูลจริงต้องได้รับอนุญาตจากเจ้าของก่อน

[เอกสารทดสอบ Rules ของ Firebase](https://firebase.google.com/docs/firestore/security/test-rules-emulator)

## ติดตั้งบน Android
เปิด URL HTTPS ด้วย Chrome → รอให้หน้าโหลด → กด “ติดตั้งแอป” เมื่อเบราว์เซอร์แสดง หรือเมนู ⋮ → Install app/ติดตั้งแอป หรือ Add to Home screen → ยืนยัน แล้วเปิดจากไอคอนบนหน้าจอหลัก
การแสดงคำเชิญติดตั้งขึ้นกับเบราว์เซอร์ อุปกรณ์ และประวัติการติดตั้ง จึงอาจไม่ปรากฏทันที

## ติดตั้งบน iPhone/iPad
เปิด URL ด้วย Safari → แชร์ → Add to Home Screen/เพิ่มไปยังหน้าจอโฮม → เปิด Open as Web App หากมีตัวเลือก → Add/เพิ่ม จากนั้นเปิดผ่านไอคอน
iOS ไม่มี beforeinstallprompt แบบ Android จึงมีข้อความแนะนำวิธีติดตั้งแทน

[วิธีเพิ่มเว็บไซต์เป็นแอปของ Apple](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios)

## การใช้งานและอัปเดต
- manifest ตั้ง display: standalone ไอคอน 192/512 และไอคอน Apple 180 ใช้โลโก้เดิม มีไอคอน maskable 512 เพิ่มสำหรับ Android
- เมื่อตรวจพบเวอร์ชันใหม่ จะแสดงปุ่มอัปเดต ให้ทำรายการปัจจุบันให้เสร็จแล้วค่อยกด ปุ่มจะไม่อัปเดตขณะกำลังส่งคำสั่งซื้อ
- ตะกร้ายังอยู่ใน localStorage การรีโหลดไม่ล้างตะกร้า แต่ข้อมูลที่กำลังกรอกในฟอร์มอาจหายเมื่อผู้ใช้ยอมรับการอัปเดต
- Service Worker ไม่เก็บหน้า index.html หรือ Firebase/Auth/Firestore/Storage/Analytics และไม่เก็บบัญชี คำสั่งซื้อ สลิป หรือ QR ธนาคารใน Cache Storage
- แคชเฉพาะ offline.html ไอคอน และไฟล์ CSS/JS สาธารณะที่ชื่ออยู่ในขอบเขต assets เท่านั้น แยกชื่อแคชตามเส้นทางร้าน เพื่อไม่ลบแคชของ repository อื่น
- เมื่อออฟไลน์จะแสดงข้อความให้เชื่อมต่ออินเทอร์เน็ต ร้านค้า การเข้าสู่ระบบ และการทำรายการต้องออนไลน์ ไม่เปิดดูคำสั่งซื้อจากแคช
- โปรไฟล์ที่ใช้แสดงหน้าเว็บและ lastOrder อยู่ในหน่วยความจำ ข้อมูลคำสั่งซื้อจริงยังอยู่ใน Firestore Firebase Auth ยังจัดการ session ของตนตามตัวเลือก Remember me
- ล้างเฉพาะสำเนาเก่าของ lc_user/lc_admin/lc_users/lc_orders/lc_lastOrder จาก browser storage ไม่ลบข้อมูล Firestore สินค้า ตะกร้า หรือคำสั่งซื้อจริง

## ทดสอบซ้ำในเครื่อง
การเปิดเว็บไซต์ไม่ต้องติดตั้ง package แต่ชุดทดสอบใช้ Node.js, Java 21+ สำหรับ Emulator และ Microsoft Edge บน Windows:
```
npm install
npm run test:auth
npm run test:checkout
npm run test:rules
npm run test:browser
```
บน Linux ต้องติดตั้ง Chromium สำหรับ Playwright ด้วย npx playwright install chromium
test:rules ใช้ demo-lotus-orders กับ Firestore/Storage Emulator พอร์ต 8181/9299 เท่านั้น ห้ามเปลี่ยน project เป็นระบบจริง ชุดทดสอบล้างข้อมูลเฉพาะ Emulator ของ demo นี้ ไม่ได้ล้าง lotus-1a491
test:browser ปิดคำขอไปยัง backend จริง และทดสอบบนเว็บเซิร์ฟเวอร์ชั่วคราวที่ 127.0.0.1:4187 ภาพ/ผลอยู่ใน review/pwa-tests

## ข้อจำกัดที่ต้องทราบก่อนเปิดรับชำระเงินจริง
สินค้า บล็อก คูปอง รีวิว และสต็อกยังเก็บในแต่ละเบราว์เซอร์ ราคาที่ส่งจาก Client ยังไม่เทียบกับแคตตาล็อกที่เชื่อถือได้บน Server Rules ตรวจรูปแบบและการคำนวณรวม แต่ป้องกันการแก้ราคา/ส่วนลดใน Client ให้สอดคล้องกันไม่ได้ Admin ต้องตรวจยอดและสลิปเองก่อนยืนยัน ห้ามตีความสถานะ pending ว่าได้รับเงินแล้ว
การสร้างแคตตาล็อกส่วนกลางและคำนวณราคา/สต็อกจาก Backend ต้องทำเป็นขั้นตอนเพิ่มเติมโดยออกแบบการย้ายข้อมูลกับเจ้าของก่อน ไม่ได้ย้ายหรือเขียนข้อมูลเหล่านั้นอัตโนมัติในการปรับ PWA ครั้งนี้
ปุ่มบัตรเครดิตยังเป็น demo และฟอร์มติดต่อเดิมยังไม่ได้ส่งอีเมล
