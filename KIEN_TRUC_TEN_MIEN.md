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

## Chuyển đổi & Tách bạch hệ thống — ĐÃ HOÀN TẤT 100%

1. **Hạ Tầng Funnel Bán Hàng (`go.breaths.live`):**
   - Đã tách bạch hoàn toàn sang repository GitHub riêng biệt: `https://github.com/victorChuyen/AI-PROFITLAB.git`.
   - Đã cấu hình và kích hoạt đầy đủ biến môi trường chuẩn trong `wrangler.toml`, `.env`, `.dev.vars`.
   - Toàn bộ link canonical, sitemap, OpenGraph, Webhook SePay và email delivery trỏ 100% về `https://go.breaths.live`.

2. **Trả Lại Tên Miền Phụ Cho Dự Án Gốc (`opc-tnc-platform`):**
   - `ai.breaths.live`: Được giữ nguyên vẹn và xác lập làm Media & Ladipage Hub (`landing_vi.html`, `landing_en.html`, `checkout.html`).
   - `opc.breaths.live`: Được giữ nguyên vẹn làm 3D Virtual Office Simulator Engine (`index.html`, `index_mobile.html`, `/api/*`).
   - Đã chạy script `node scripts/setup_dual_domain_architecture.mjs` trong `d:\OPC-TRAVEL` xác lập lại canonical và sitemap dual-domain chuẩn.
   - Không có bất kỳ xung đột, ghi đè hay xâm lấn nào giữa hai hệ thống.

3. **Tên Miền Gốc (`breaths.live`):**
   - Dành riêng cho WordPress Hub & Content SEO, dẫn link CTA về `go.breaths.live/starter`, `go.breaths.live/tu-van`, và `go.breaths.live/live`.
