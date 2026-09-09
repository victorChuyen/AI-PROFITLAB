# OPC Signature v3

Thiết kế mới, độc lập với các funnel hiện có. Tham khảo cấu trúc offer/event của Monetise: lời chào bán trực diện, trình diễn sản phẩm, offer cụ thể, giải đáp và CTA thống nhất; không sao chép thương hiệu, testimonial hoặc bảo đảm thu nhập.

Khách: người Việt mới xây sản phẩm số; nhánh riêng cho khách thuê Victor triển khai. Mục tiêu: hiểu sản phẩm và chọn bước tiếp theo.

## Hệ thiết kế

- Nền xanh mực #101729; giấy trắng #F7F8FC; tím OPC #7356D8; chữ #182039; accent vàng dịu #F1CA7A.
- Font hệ thống Segoe UI hỗ trợ tiếng Việt, tiêu đề đậm, khoảng âm vừa phải. Không phụ thuộc font CDN.
- Hero lớn, hình ảnh hai người đồng hành; phần sản phẩm dùng bố cục tài liệu thật kiểu trang sách. Tránh lặp card đồng dạng.
- Khung nội dung tối đa 1180px; gutter 24px desktop, 20px mobile. Nhịp khoảng trắng 8/16/24/40/64/96.
- CTA tím trên nền sáng, vàng dịu trên nền tối; một CTA chính mỗi section. Border radius 10px cho nút, 20px cho khung hình.
- Không animation tự chạy; hiệu ứng chỉ hover/focus. Tôn trọng reduced-motion.
- Desktop hai cột; mobile một cột, menu native details, target >=44px.

## Phạm vi hoạt động

Frontend static: home, starter, live, tu-van. Demo skill chạy local; form tư vấn tạo bản brief để khách sao chép và chủ động gửi Zalo, không giả vờ đã nhận lead. Không lưu thông tin khách trong localStorage. Checkout chỉ bật sau cấu hình URL thật và xác nhận kiểm tra; mặc định liên hệ Victor để đặt Starter. Không dùng ZIP trả phí trong public assets.
