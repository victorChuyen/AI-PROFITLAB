from pathlib import Path
root=Path(__file__).resolve().parents[1]
path=root/'build.py'
text=path.read_text(encoding='utf-8').replace('https://breaths.live','https://go.breaths.live').replace('· breaths.live','· go.breaths.live')
text=text.replace("('' if file=='index.html' else file)","('' if file=='index.html' else file.removesuffix('.html'))")
policy='<h2>Thanh toán và quyền tải</h2><p>Khi thanh toán online được mở, hệ thống lưu mã đơn, sản phẩm, số tiền, thời điểm và trạng thái đối soát trên Cloudflare. Cookie bảo mật dùng để nhận diện đơn trên trình duyệt này trong 7 ngày. Mã QR sử dụng dịch vụ VietQR; giao dịch được xác nhận qua SePay. Không nhập thông tin thẻ hoặc mật khẩu ngân hàng trên trang.</p><p>Cookie không phải tài khoản đăng nhập. Khi đổi thiết bị hoặc mất cookie, liên hệ Victor kèm mã đơn để được hỗ trợ sau đối soát. Gói triển khai riêng cần thống nhất phạm vi bằng văn bản trước khi trả tiền.</p>'
text=text.replace('<h2>Trao đổi và hỗ trợ</h2>',policy+'<h2>Trao đổi và hỗ trợ</h2>')
path.write_text(text,encoding='utf-8')
