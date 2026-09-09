# QA ảnh OPC — 09/09/2026

Nguồn: `E:/challenge 5 day/funnel/assets/img`. Đã xem trực tiếp 11 file. Đánh giá tính phù hợp với offer và frontend Signature v3 hiện hành, không đánh giá doanh thu hay hiệu quả quảng cáo từ hình ảnh.

## Kết quả và quyết định sử dụng

| File | Kết luận | Vị trí / việc cần làm |
|---|---|---|
| `logo-opc.png` | Dùng được cho nhận diện. Ảnh lớn, nhiều khoảng trống, không thích hợp làm icon rất nhỏ. | Đã thêm vào footer 5 trang, tải lazy, giữ nguyên ảnh gốc và cho mở ảnh đầy đủ. Giữ navigation hiện tại dễ đọc. |
| `4 BƯỚC ĐƠN GIẢN.png` | Có cấu trúc tốt để giải thích quy trình; chưa dùng nguyên ảnh để bán. | Quá nhiều chữ ở chiều ngang mobile. Sửa “chỉ trong 48 giờ”, “thu nhập bền vững/thụ động”, “loại bỏ hoàn toàn việc phỏng đoán” và giao file tức thì; bốn giai đoạn không đồng nghĩa bốn skills. Tách nội dung thành text HTML hoặc thiết kế bản dọc. |
| `4-STEP-OPC.png` | Bản tiếng Anh gọn hơn nhưng vẫn có lời hứa chưa được kiểm chứng. | Hợp bản tiếng Anh sau khi sửa 48 hours, instant file delivery và consistent organic traffic 24/7. Chuyển heading thành quy trình xây sản phẩm thay vì mặc định doanh nghiệp tự động. |
| `OPC-START-19$.png` | Hình ảnh nổi bật, giá $19 phù hợp. Danh mục quyền lợi chưa khớp gói đang đóng. | Thay “OPC Second Brain Framework” và “3D Office Framework” bằng sổ bài tập 24 trang, 10 biểu mẫu, ví dụ thực hành; chỉ giữ quyền lợi khác nếu thực sự có trong gói. Thay “ý tưởng hôm nay, thu nhập ngày mai” bằng “ý tưởng hôm nay, bắt đầu xây hôm nay”. Sau sửa đặt ở phần quyền lợi Starter, không thay toàn bộ nội dung bằng một ảnh. |
| `VN-OPC-297.png` | Dành cho dịch vụ riêng, không trộn với Starter. Chưa dùng nguyên ảnh trong v3. | Giá $297, một buổi có workflow hoạt động, recording, checklist 7 ngày và quy trình sau thanh toán là phạm vi cụ thể cần chốt. Sửa typo “Checklis” thành “Checklist”. Những phát biểu live build đã chạy cần dẫn tới demo thật. |
| `live.png` | Phù hợp truyền thông sự kiện sau khi khóa thông tin. | Chốt ngày giờ cụ thể thay “next week”, điều kiện giveaway, giá trị 5 triệu VND và nội dung người tham dự nhận. Cần bản mobile ít chữ hơn. Không công khai lịch/quà như cam kết khi chưa chốt. |
| `banner-free.png` | Chưa dùng để làm bằng chứng hoặc banner quà trong v3. | Dashboard hiển thị doanh thu AED, 98%, 24 dự án, 48 giờ; chưa xác minh là dữ liệu thật. Nếu là concept phải ghi rõ minh họa ngay trong thiết kế và bỏ các số dễ gây hiểu nhầm. Cần kiểm tra tài nguyên miễn phí và địa chỉ opc.breaths.live trước khi quảng bá. |
| `qr-telegram-opctnc.png` | Không phải ảnh QR. | Là screenshot Telegram kèm tab/trình duyệt và hội thoại. Không dùng làm QR hoặc hình bán hàng. Cần tạo QR từ URL kênh thật và quét thử trên điện thoại. |
| `vsl-thumb-vi.jpg` | Có thể làm thumbnail nhỏ cho nội dung giới thiệu 1:1 đúng ngữ cảnh. Chưa thêm vào v3. | Chỉ 480×360, nhiều chữ; không kéo rộng làm hero. Nội dung “đồng hành 1:1” không phải quyền lợi Starter. Cần xác nhận hình khớp video trước khi gắn. |
| `vsl-thumb-en.jpg` | Tương tự thumbnail nhỏ, không hợp nội dung Starter tiếng Việt. | 480×360, chứa “Setup AI in just 1 session” và “Free demo”; cần khớp dịch vụ thật. |
| `favicon.gif` | Không dùng. | Nội dung Commission Money Machine, khác thương hiệu OPC. Giữ favicon SVG của v3. |

## Đã thay đổi

- Chỉ sao chép logo đã QA vào `public/assets/opc-brand-original.png`; nguồn ảnh không bị thay đổi.
- Footer 5 trang dùng ảnh thật, có alt text, kích thước, lazy loading và link mở đầy đủ.
- Cập nhật build.py để build lại vẫn giữ thay đổi.
- Các banner còn lại được giữ nguyên ở nguồn; chưa đưa vào public hay ZIP triển khai mới.

## Nhận xét kỹ thuật

Các poster mới có chữ nhỏ dày đặc, phần lớn khoảng 1,5–2,3 MB mỗi ảnh. Đưa tất cả vào một landing page sẽ tăng tải nhiều MB và chữ khó đọc ở mobile. Sau khi chốt copy, nên xuất bản web nhẹ hơn và bản dọc dành cho điện thoại. Không nén/sửa ảnh gốc trong lượt này.

Logo hiện là bản gốc khoảng 2,1 MB, chỉ tải lazy ở footer; vẫn nên xuất thêm bản web nhẹ trước chiến dịch traffic lớn. Các chữ hoặc con số bên trong ảnh cũng là nội dung công khai của trang, không thể sửa chỉ bằng alt text hay dòng chú thích bên ngoài.
