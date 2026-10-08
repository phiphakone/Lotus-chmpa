# LOTUS & CHAMPA — PWA + GitHub Pages + Firebase

เว็บร้านค้าเดิมพร้อม PWA ใช้ Firebase project lotus-1a491 ไม่ต้อง build เพื่อเปิดหน้าเว็บ

- วิธีเผยแพร่และตั้งค่า: [PWA-SETUP-TH.md](PWA-SETUP-TH.md)
- รายงานผลตรวจและข้อจำกัด: [AUDIT-PWA-TH.md](AUDIT-PWA-TH.md)
- เปิดบนเครื่อง: node preview.cjs แล้วไป http://127.0.0.1:4173/
- GitHub Pages: ใช้ Settings → Pages → Source: GitHub Actions และ workflow ที่ให้ไว้
- Firebase Rules ยังไม่ถูกเผยแพร่ ต้องให้เจ้าของโครงการตรวจและ Publish เอง
- คำสั่งซื้อใหม่สูงสุด 5 ประเภทสินค้า เพื่อให้ตรวจทุกบรรทัดและยอดรวมภายในขีดจำกัด Firestore Rules
- สินค้า บล็อก คูปอง และสต็อกยังอยู่ใน localStorage; โปรดอ่านข้อจำกัดก่อนใช้รับชำระเงินจริง
