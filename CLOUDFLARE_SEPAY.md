# GitHub → Cloudflare Pages → SePay

Trạng thái: bản tích hợp local, đã có mã nguồn + kiểm tra, chưa push/deploy, chưa nhận giao dịch thật. Hai giá được Victor chốt: Starter 500.000 VND; triển khai riêng 7.800.000 VND. Giá cố định phía server trong `server/payment.js`; dữ liệu giá từ trình duyệt không được sử dụng khi tạo đơn.

## 1. Repository và cấu hình build

Thư mục hiện tại không nằm trong Git repository đã nhận diện. Cần xác nhận repo đang nối Pages trước khi push. Không lấy toàn bộ `E:/challenge 5 day` làm repo website.

Nếu repo chỉ chứa bản mới: đưa các file trong thư mục Signature v3 vào repo, ngoại trừ file bị .gitignore bỏ qua. Giữ `functions/`, `server/`, `migrations/`, `scripts/`, `public/`, `package.json` cùng cấp. Với monorepo, chọn thư mục Signature v3 làm Root directory.

Cloudflare Pages build:

| Trường | Giá trị |
|---|---|
| Framework | None |
| Build command | `npm run build` |
| Build output | `dist` |
| Root directory | Thư mục chứa package.json của bản này |
| SITE_ORIGIN | URL HTTPS chính thức, không có dấu / cuối |
| INDEXABLE | `false` trong lúc thử |
| PRODUCTION_BRANCH | Tên branch production thật của repo |

Build online dùng Node, không chạy `build.py`: file Python là công cụ biên tập local có đường dẫn ảnh Windows. HTML trong public đã sinh sẵn và được commit. Chạy lại build.py local khi sửa nội dung, rồi commit public. Không chạy `scripts/update-commerce-copy.py` lần nữa; đó là script chuyển nội dung một lần.

Không dùng ZIP static cũ để triển khai SePay. Chỉ upload static bằng dashboard không thay thế được build Pages Functions từ repo.

Nguồn: [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/).

## 2. D1 và R2

Tạo D1 dành riêng cho hệ bán hàng, áp dụng `migrations/0001_orders.sql` vào database mới. Bind database vào Pages với tên **DB**. Bản migration này chưa chạy production; không chạy đè vào database khác đang vận hành.

Tạo bucket R2 riêng, **không bật public access**. Bind với tên **PRODUCTS**. Upload ZIP Starter tiếng Việt đã kiểm tra vào key ví dụ `products/starter-vi-v2.zip`. Đặt `STARTER_ASSET_KEY` trùng key đó. Website không public URL tới bucket; `/api/download` kiểm tra cookie của đơn và trạng thái paid mỗi lần tải.

Preview dùng DB, bucket và webhook key riêng, không nối preview vào database hoặc tài liệu production. Pages Functions cần redeploy sau thay binding/secret theo cấu hình của nền tảng.

Nguồn: [Bindings D1/R2/Secrets](https://developers.cloudflare.com/pages/functions/bindings/).

## 3. Biến runtime và secrets

Trong Pages Settings → Variables and Secrets/Bindings, đặt đúng môi trường:

| Tên | Giá trị / mục đích |
|---|---|
| CHECKOUT_ENABLED | `false` đến khi hoàn tất cấu hình và kiểm tra |
| IMPLEMENTATION_ENABLED | `false` đến khi phạm vi dịch vụ 7.800.000đ được khóa |
| PUBLIC_ORIGIN | HTTPS origin thực tế, ví dụ domain funnel đã chọn, không dấu / cuối |
| BANK_ACCOUNT | `96247688688` theo tài khoản Victor cung cấp |
| BANK_CODE | `BIDV` |
| BANK_ACCOUNT_NAME | Tên chủ tài khoản chính xác, chưa được cung cấp; phải đối chiếu trong ngân hàng |
| STARTER_ASSET_KEY | Key ZIP trả phí trong R2 |
| SEPAY_WEBHOOK_API_KEY | **Secret mới** cho phương thức API Key của webhook |
| RATE_LIMIT_SALT | **Secret ngẫu nhiên mới**, ít nhất 24 ký tự |

Không lưu khóa thật vào bảng này, GitHub, public/config.js hoặc file ZIP. Company API token và webhook secret từng gửi trong chat cần được thu hồi/thay mới ở phía dịch vụ. Không cần Company API token để nhận webhook trong tích hợp hiện tại; trang companyapi là trang quản lý API, không phải checkout khách hàng.

## 4. Tạo webhook SePay

Trên SePay, chọn webhook:

1. Sự kiện: tiền vào.
2. Tài khoản: đúng BIDV nhận thanh toán.
3. URL: `https://<domain-funnel>/api/sepay`.
4. Xác thực: **API Key**; khóa phải khớp Secret `SEPAY_WEBHOOK_API_KEY` trong Pages.
5. Nếu dùng lọc mã, tiền tố mã đơn là `OPC`.

Mã hiện tại xác thực `Authorization: Apikey <secret>`, không triển khai HMAC. Không chọn HMAC trên dashboard rồi dùng cấu hình API Key ở code. Không suy ra phương thức xác thực từ tên biến BANK_WEBHOOK_SECRET hoặc tiền tố khóa.

SePay gửi accountNumber, gateway, transferType, transferAmount, code/content và id. Code đối chiếu đúng tài khoản/bank/số tiền/mã đơn, chống trùng bằng transaction_id UNIQUE và cập nhật trong transaction D1. Phải xem payload thử để xác định accountNumber là tài khoản đã cho hay tài khoản nền, đặc biệt nếu dùng tài khoản ảo/subAccount. Không tự nới quy tắc để chấp nhận sai tài khoản.

Nguồn: [SePay webhook](https://docs.sepay.vn/tich-hop-webhooks.html), [D1 batch transaction](https://developers.cloudflare.com/d1/worker-api/d1-database/).

## 5. Hành trình hiện có

Starter → trang checkout VND → đồng ý điều kiện → POST tạo đơn → QR VietQR → webhook xác nhận → cookie cùng trình duyệt cho tải R2.

Triển khai riêng → 7.800.000đ → chỉ mở thanh toán sau chốt phạm vi → xác nhận → khách gửi mã đơn cho Victor để onboarding. Gói dịch vụ không mở tải ZIP Starter tự động.

QR tạo từ endpoint VietQR do Victor cung cấp, với amount và des do server tạo. Phải quét thử và đối chiếu người nhận/số tiền/nội dung trước khi mở nhận tiền. Không xem việc hiển thị QR là chứng cứ đã thanh toán.

Phiên chờ 20 phút, cookie riêng mỗi loại sản phẩm có thời hạn 7 ngày. Khách đổi máy/mất cookie cần Victor hỗ trợ sau đối soát; chưa có đăng nhập hoặc gửi email khôi phục. Lưu mã đơn. Một cookie giữ một đơn mỗi loại; đơn hết hạn cần hỗ trợ, không tự tạo liên tục làm mất quyền đơn cũ.

Giao dịch lệch số tiền, quá hạn, không khớp mã được giữ ở bảng payment_events để đối soát, không tự cấp file. Không tự cộng dồn chuyển khoản hoặc hoàn tiền. Refund thực hiện ở ngân hàng/cổng theo quy trình vận hành; trạng thái `refunded` trong orders thu hồi quyền tải về sau, không thể thu hồi file đã tải.

## 6. Nghiệm thu trước launch

- Test đúng origin, hai giá, tên chủ tài khoản và QR trên điện thoại.
- Test webhook SePay thật ở môi trường tách biệt; synthetic test chỉ kiểm tra kết nối/code, không xác minh tiền thật.
- Thử giao dịch thật do Victor chủ động thực hiện sau khi đã chốt cấu hình. Không có giao dịch thật được thực hiện trong lượt này.
- Sai key, outbound, sai bank/account, thiếu/thừa tiền, giao dịch trùng, mã không có hoặc mơ hồ, đến muộn đều không tự cấp quyền.
- Kiểm tra file ZIP trong R2 tải được sau paid, không tải được trước paid hoặc sau refunded.
- Kiểm tra log webhook thất bại và bảng payment_events outcome review/unmatched hằng ngày trong giai đoạn đầu. Chưa có email cảnh báo tự động hoặc dashboard quản trị.
- Tạo backup, người phụ trách tra soát, thông tin người bán, phạm vi dịch vụ/hỗ trợ/hoàn tiền trước bật CHECKOUT_ENABLED.

Kiểm tra local: `npm test`, `npm run build`; `wrangler pages functions build --outdir .wrangler/compiled` để kiểm tra compile Functions. QA browser: `python verify.py` kiểm tra static, không chứng minh thanh toán chạy thật.

## 7. Những địa chỉ đang có dự án

Read-only kiểm tra Pages cho thấy ai.breaths.live và opc.breaths.live đang thuộc opc-tnc-platform; app.breaths.live thuộc worldmonitor-live; edu.breaths.live thuộc coachai-breaths-live. Có dự án breaths-live nối Git nhưng chưa xác định repo nào anh muốn cập nhật. Không đổi DNS hoặc ghi đè các dự án đó tự động.

Cloudflare Pages/D1/R2 là kiến trúc Cloudflare, không có cam kết máy chủ chỉ nằm tại Việt Nam. Điều này thay lựa chọn hosting Việt Nam trước đó theo thông tin triển khai mới của Victor.
