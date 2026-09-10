# Kiến trúc đã chốt — Chairman Victor (Cập nhật 10/09/2026)

## go.breaths.live — Tên miền hệ thống bán hàng chính thức (Signature v3.1)

- Funnel OPC Signature v3.1: Trang chủ, Starter (500.000 VND / $19), Live, Triển khai riêng (7.800.000 VND / $297), Checkout VietQR BIDV SePay.
- Pages Functions: `/api/config`, `/api/order`, `/api/sepay`, `/api/download`.
- Webhook SePay: `https://go.breaths.live/api/sepay`.
- SITE_ORIGIN và PUBLIC_ORIGIN: `https://go.breaths.live`.
- D1: đơn hàng và nhật ký đối soát. R2 private: ZIP trả phí.
- Quyết định chiến lược: Trả lại 2 subdomain `ai.breaths.live` và `opc.breaths.live` nguyên vẹn cho dự án cũ (`opc-tnc-platform`). Không xâm lấn, không ghi đè.


## breaths.live — WordPress và SEO

Theo chỉ đạo mới, tên miền chính dành cho WordPress viết bài SEO và các trang bán hàng bổ sung. Chưa cài đặt hoặc sửa WordPress/DNS trong lượt này.

Trang bài viết đặt CTA đúng nhu cầu:

- Tự thực hành → `https://go.breaths.live/starter`.
- Thuê triển khai → `https://go.breaths.live/tu-van`.
- Xem video → `https://go.breaths.live/live`.

Không nhân đôi nội dung landing nguyên văn trên WordPress. Bài SEO giải quyết câu hỏi cụ thể, link sang offer phù hợp. Trang bán hàng riêng trên WordPress cần nội dung và canonical riêng; nếu bán cùng sản phẩm thì dùng cùng hệ mã đơn/đối soát, không tạo thêm một sổ thanh toán rời rạc.

## Chuyển đổi dự án hiện có

Read-only xác nhận ai.breaths.live hiện thuộc Pages project **opc-tnc-platform**, production branch **main**, Git Provider **No**. `opc.breaths.live` cũng thuộc dự án này: deploy production vào cùng project sẽ thay cả hai hostname. Chưa có chỉ đạo đổi vai trò opc.breaths.live; cần tách ai.breaths.live sang project mới nếu phải giữ nguyên site ở opc.breaths.live.

Cloudflare không cho chuyển trực tiếp project Direct Upload sang Git integration. Hai cách:

1. Giữ project và deploy từ GitHub Actions qua Wrangler — cần chấp nhận tác động cả hai hostname hiện gắn vào project.
2. Tạo project Git mới cho Signature, thử preview, rồi chuyển riêng custom domain ai.breaths.live sang project mới — giữ nguyên project cũ cho opc.breaths.live. Đây là phương án đề xuất để tách hệ thống.

Nguồn: [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Không đổi A/CNAME của tên miền chính khi triển khai funnel; DNS WordPress và custom domain Pages là hai cấu hình riêng. Chưa push repo, đổi DNS hoặc thay deployment production. Cần URL repo, tên chủ tài khoản ngân hàng và secrets mới được đặt trực tiếp trong Cloudflare để hoàn tất.
