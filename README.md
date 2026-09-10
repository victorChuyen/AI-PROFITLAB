# 🏆 OPC AI PROFITLAB (SIGNATURE V3.1) — CLOUDFLARE PAGES & SEPAY ENGINE
> **Hệ Thống Phễu Bán Hàng Tự Động Hóa & CRM Đa Kênh Cho Doanh Nghiệp 1 Người**  
> **Chỉ huy tối cao:** Chairman Victor Chuyen (Founder)  
> **Điều hành kỹ thuật:** AI CEO Lucky (Team Leader) & Codex  
> **Cập nhật:** 2026-09-09 (Sẵn sàng Go Live & Deploy Cloudflare Pages)

---

## ⚡ 1. KIẾN TRÚC TOÀN DIỆN CỦA HỆ THỐNG

```
                          [KHÁCH HÀNG TRUY CẬP]
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
Trang Chủ (index.html)     Bộ Starter 45 Trang          Tư Vấn 1:1 VIP ($297)
(Mô hình Doanh nghiệp 1N)   (starter.html - 500k)        (tu-van.html - 7.8M)
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
                         TRANG THANH TOÁN CHECKOUT
                             (checkout.html)
                                    │
                      POST /api/order (Tạo đơn)
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
      [GOOGLE SHEETS CRM]                       [TELEGRAM SUPERGROUP]
  Tab LEADS & ORDERS_MASTER                    🎯 Topic 62: LEADS (CRM)
  (Ghi nhận lead tức thì)                     (Bắn alert + Link Zalo 1-click)
                                    │
                          QUÉT VIETQR BIDV
                         (96247688688 - SePay)
                                    │
                     Webhook POST /api/sepay
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
   [XÁC NHẬN TIỀN VỀ THẬT]                     [TELEGRAM SUPERGROUP]
  - D1 Transaction Update                     💳 Topic 60: PAYMENT
  - Tab PAYMENT (Ghi sổ tiền)                (Báo tiền về tài khoản thật)
  - Tab ORDERS_MASTER -> PAID
  - Mở khóa Download R2 Private
  - Bàn giao Drive VIP & Zalo VIP
```

---

## 🚀 2. BẢNG PHÂN BỔ 5 TOPIC TELEGRAM ĐIỀU HÀNH
**Nhóm Telegram Supergroup:** `🎓OPC TNC | Điều Hành` (ID: `-1001812138135`)  
**Bot:** `@opcprofitlab_bot` (`8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk`)

| Topic Telegram | Thread ID | Chức Năng | Kích Hoạt |
|---|:---:|---|---|
| **💳 PAYMENT \| Tiền Về SePay** | `60` | Báo biến động số dư tiền về BIDV 96247688688, đối soát đơn hàng. | Webhook SePay `/api/sepay` |
| **🎯 LEADS \| Đơn Khởi Tạo & CRM** | `62` | Bắt lead điền form checkout kèm số điện thoại và link chat Zalo ngay. | Form `/api/order` |
| **📅 ĐẶT LỊCH \| Cal.com VIP** | `64` | Tiếp nhận lịch hẹn tư vấn 1:1 VIP ($297 / 7.8M) kèm link Google Meet. | Webhook `/api/cal-webhook` |
| **🛠️ SUPPORT \| Chăm Sóc Khách Hàng** | `66` | Hỗ trợ kỹ thuật, kích hoạt Google Drive VIP trọn đời, xử lý sự cố. | Form `/api/support` |
| **🤖 TEAM WORK \| AI Agents Điều Hành** | `68` | AI Squad báo cáo ca (trước 11:00 & 16:00), đồng bộ KPI từ Google Sheets. | CLI `agent_teamwork_reporter.mjs` |

---

## 🛠️ 3. CÁC BƯỚC ĐẨY CODE LÊN GITHUB (GIT SETUP)

Mở Terminal tại thư mục `E:\challenge 5 day\funnel\opc-profitlab-signature-v3\OPC-Signature-v3.1-GitHub-Source` và chạy:

```bash
# 1. Khởi tạo Git repository
git init

# 2. Thêm tất cả tài nguyên (đã cấu hình sẵn .gitignore loại trừ file rác)
git add .

# 3. Commit phiên bản hoàn chỉnh
git commit -m "feat: complete OPC ProfitLab v3.1 with 5 Telegram Topics & SePay BIDV"

# 4. Đặt nhánh chính là main
git branch -M main

# 5. Nối với GitHub repository của bạn (thay URL bằng repo của bạn)
git remote add origin https://github.com/<username>/opc-profitlab-signature.git

# 6. Đẩy toàn bộ source code lên GitHub
git push -u origin main
```

---

## ☁️ 4. HƯỚNG DẪN TRIỂN KHAI CLOUDFLARE PAGES (1-CLICK DEPLOY)

### Bước 1: Tạo Project trên Cloudflare Pages
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com) -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Chọn Repository GitHub vừa tạo.

### Bước 2: Cấu hình Build Settings
| Cấu hình | Giá trị |
|---|---|
| **Framework preset** | `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (hoặc đường dẫn thư mục chứa `package.json`) |

### Bước 3: Gắn D1 Database & R2 Bucket (Bindings)
1. **D1 Database:** Vào **Settings** -> **Functions** -> **D1 Database bindings** -> Thêm binding:
   - Variable name: `DB`
   - D1 database: Chọn DB của bạn (chạy file `migrations/0001_orders.sql` trước).
2. **R2 Bucket:** Vào **Settings** -> **Functions** -> **R2 Bucket bindings** -> Thêm binding:
   - Variable name: `PRODUCTS`
   - R2 bucket: Chọn bucket riêng tư (upload file `starter.zip` vào đường dẫn `products/starter.zip`).

### Bước 4: Thêm Biến Môi Trường (Environment Variables)
Tại **Settings** -> **Variables and Secrets**, thêm các biến sau (tham khảo mẫu tại `.env.example`):
- `BANK_ACCOUNT`: `96247688688`
- `BANK_CODE`: `BIDV`
- `BANK_ACCOUNT_NAME`: `TRAN NGOC CHUYEN`
- `CHECKOUT_ENABLED`: `true`
- `IMPLEMENTATION_ENABLED`: `true`
- `PUBLIC_ORIGIN`: `https://go.breaths.live` (hoặc custom domain của bạn)
- `STARTER_ASSET_KEY`: `products/starter.zip`
- `SEPAY_WEBHOOK_API_KEY`: `spsk_live_3BsKdoj9AshiHUMmLAmZGdisdoKLB7JK`
- `TELEGRAM_BOT_TOKEN`: `8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk`
- `TELEGRAM_CHAT_ID`: `-1001812138135`
- `TELEGRAM_TOPIC_PAYMENT`: `60`
- `TELEGRAM_TOPIC_LEADS`: `62`
- `TELEGRAM_TOPIC_CAL`: `64`
- `TELEGRAM_TOPIC_SUPPORT`: `66`
- `TELEGRAM_TOPIC_TEAMWORK`: `68`

### Bước 5: Cấu hình Webhook trên SePay
Truy cập [my.sepay.vn](https://my.sepay.vn):
- URL Webhook: `https://<your-domain>/api/sepay`
- Phương thức: **API Key**
- API Key: `spsk_live_3BsKdoj9AshiHUMmLAmZGdisdoKLB7JK`
- Tài khoản nhận: BIDV `96247688688`

---

## 🧪 5. KIỂM THỬ TRƯỚC KHI BÀN GIAO (PRE-FLIGHT AUDIT)
- ✅ `npm test`: **16/16 PASS (100%)** — Kiểm thử backend, SePay webhook, SQLite orders, D1 atomic batch rollback.
- ✅ `python verify.py`: **18/18 Viewport checks PASS (0 failures)** — Kiểm thử giao diện Playwright Chromium, 0 ảnh lỗi, 0 tràn ngang, đúng chuẩn 1 thẻ `<h1>`.
- ✅ `npm run build`: Static compilation thành công vào thư mục `dist/`.
- ✅ Đã loại bỏ hoàn toàn các từ khóa bản quyền bên thứ ba (Iman Gadzhi / Consulting.com), định vị độc quyền **OPC AI PROFITLAB (Khung Chiến Lược FACETS)**.
