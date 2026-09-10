# QA go.breaths.live — 10/09/2026

## Kết quả kỹ thuật

| Hạng mục | Kết quả |
|---|---|
| Unit test thanh toán | PASS — 16/16 |
| Static build | PASS |
| Cloudflare Pages Functions compile | PASS |
| Kiểm tra HTML browser | PASS — 18 trang/route, 0 lỗi |
| Asset tham chiếu trong HTML | PASS — 0 asset thiếu |
| `go.breaths.live` | BLOCKED — DNS chưa có bản ghi/hostname chưa phân giải |
| GitHub source root hiện có | BLOCKED — repository `funnel/github-ai-profitlab` chưa có commit |

## Lỗi chặn production

### P0 — Khóa bí mật bị hard-code

Khóa SePay, Telegram, rate-limit salt và các giá trị notification đang xuất hiện trong `wrangler.toml`, `server/payment.js`, `scripts/dev_server.mjs`, `.env.example` và README của bản Signature. Một số khóa còn có fallback trong runtime, vì vậy bỏ biến Cloudflare vẫn có thể khiến production tiếp tục dùng khóa cũ.

**Không deploy, push GitHub hoặc chia sẻ ZIP source trước khi xử lý.** Cần xoay vòng các khóa đã lộ, xóa fallback có giá trị thật, đặt lại dưới Cloudflare Pages Secrets, và chỉ để placeholder vô hại trong `.env.example`/tài liệu.

### P0 — Domain chưa sẵn sàng

`https://go.breaths.live` hiện không phân giải DNS. Không thể nghiệm thu checkout, webhook SePay, canonical hay tracking production trước khi tạo custom domain trong Pages và bản ghi DNS do Cloudflare hướng dẫn.

### P1 — Drift giữa source GitHub và source team mới

So sánh source:

- `funnel/github-ai-profitlab`: 32 tệp, Git chưa có commit.
- `funnel/opc-profitlab-signature-v3/OPC-Signature-v3.1-GitHub-Source`: 107 tệp.
- 75 tệp chỉ có ở bản Signature; 20 tệp chung có nội dung khác, gồm checkout, payment, HTML, CSS, config, headers và schema.

Không được push thư mục GitHub hiện tại rồi kỳ vọng có giao diện/chức năng của bản Signature. Cần chọn bản Signature là source-of-truth, thực hiện secret remediation, sau đó đưa nguyên source sạch vào repository GitHub.

## Những gì đã đạt

- Giá Starter/Implementation, tạo mã đơn, chống giao dịch trùng, sai số tiền, sai ngân hàng/tài khoản, rate limit, order bump và download access đều có test.
- Headers có CSP, `X-Frame-Options`, Referrer Policy và no-store ở checkout.
- Bản build dùng canonical `https://go.breaths.live`.

## Thứ tự để go-live an toàn

1. Xoay vòng SePay API key và Telegram Bot token; không ghi lại giá trị mới vào source hoặc chat.
2. Loại bỏ fallback credentials khỏi runtime và cập nhật `.env.example` thành placeholder.
3. Sao chép source Signature đã làm sạch sang repository GitHub mới; tạo commit đầu tiên.
4. Tạo Cloudflare Pages project từ repo, đặt D1/R2 bindings và Secrets production.
5. Tạo custom domain `go.breaths.live`, đợi DNS active.
6. Chạy preview checkout, webhook test tách biệt và một giao dịch thử đã được Victor xác nhận trước khi mở bán.

## Phạm vi chưa nghiệm thu

- DNS/custom domain production.
- D1/R2 bindings và file sản phẩm private trên Cloudflare.
- SePay webhook thật.
- Giao dịch ngân hàng thật và bàn giao sản phẩm.
