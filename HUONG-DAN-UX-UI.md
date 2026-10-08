# Bản giao diện mới — 06/10/2026

Đã làm: đăng nhập nền tím, đăng ký nền ảnh thổ cẩm, tài khoản và tiến trình đơn hàng. Không làm OTP.

## Đưa lên GitHub

Đưa **nội dung bên trong thư mục này** lên nơi đang xuất bản website: `index.html`, toàn bộ `assets/`, `images/`, các ảnh JPG ở ngoài và `.nojekyll`. Giữ đúng cấu trúc, không chỉ đưa mỗi HTML. Các file rules và hướng dẫn có thể lưu cùng để quản lý phiên bản, nhưng tải lên GitHub không tự publish Firebase Rules.

Xem trang tài khoản tại `#/account`, đăng ký tại `#/account?view=register`. Tiến trình đơn xuất hiện sau khi đặt hàng và trong mục Tài khoản. Bản này chưa được đẩy lên GitHub.

## Firebase

Giữ dự án `lotus-1a491` và quyền admin hiện tại. Email/mật khẩu sử dụng Firebase Authentication, không đặt mật khẩu trực tiếp trong HTML. Chức năng quên mật khẩu gửi liên kết qua email; không phải OTP.

Nếu muốn dùng nút Google: vào Firebase Console → Authentication → Sign-in method → Google → Enable, chọn email hỗ trợ rồi Save. Trong Settings → Authorized domains thêm `phiphakone.github.io` nếu chưa có. Email/Password và Anonymous vẫn cần bật cho tài khoản và đặt hàng khách. Không cần đổi Rules chỉ vì thay giao diện.

Đăng ký từ phiên khách giữ UID qua liên kết tài khoản. Nếu email/Google đã có tài khoản, hãy đăng nhập tài khoản đó; đơn đã đặt bằng UID khách không tự chuyển sang tài khoản khác.

Tiến trình lấy trạng thái thực từ đơn: chờ xác nhận → xác nhận → đang giao → hoàn thành; có trạng thái hủy riêng. Không tạo ngày giao giả và không định vị GPS.

## Kiểm tra

Đã kiểm tra cú pháp các script và giao diện Edge headless ở 1440px/390px; các luồng đăng nhập lỗi, ghi nhớ phiên, đăng ký, đặt lại mật khẩu, thông báo Google chưa bật, tiến trình đơn, dữ liệu không tồn tại, thoát ra trang chủ và tràn ngang. Các thao tác Firebase được mô phỏng khi kiểm thử, không tạo đơn hoặc gửi email thật. Cần thử tài khoản thật sau khi đăng website và bật các provider cần dùng.

Giao diện được chuyển sang HTML/CSS/JavaScript phù hợp web sẵn có từ các mẫu trong `ux-ui`. Không cần cài React. Mẫu Auth 3 được dựng độc lập theo mô tả; không cài mã nguồn React Bits Pro trả phí.

Tài liệu cấu hình Google: https://firebase.google.com/docs/auth/web/google-signin
