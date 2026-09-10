/**
 * ==============================================================================
 * 🏆 OPC AI PROFITLAB — STANDALONE CRM & EMAIL / ZALO AUTOMATION ENGINE
 * ==============================================================================
 * Founder & Chairman: Victor Chuyen (Trần Ngọc Chuyên - 0989 890 022)
 * AI CEO / Team Leader: Lucky
 * Hệ thống: Google Sheets CRM (ID: 15GD8LcltzQdYQ5_8qP2PCIH9sLrw343ZasBPXg0ugVo)
 * Cổng thanh toán: Sepay Webhook -> VietQR BIDV (96247688688 - TRAN NGOC CHUYEN)
 *
 * HƯỚNG DẪN CÀI ĐẶT 1-CLICK:
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/15GD8LcltzQdYQ5_8qP2PCIH9sLrw343ZasBPXg0ugVo
 * 2. Vào Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa code cũ, dán toàn bộ nội dung file này vào và bấm Lưu (Ctrl + S).
 * 4. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New Deployment) -> Web App:
 *    - Execute as: "Me" (Tôi)
 *    - Who has access: "Anyone" (Bất kỳ ai)
 * 5. Copy Web App URL thu được và dán vào SePay Webhook URL (https://my.sepay.vn).
 * ==============================================================================
 */

var SPREADSHEET_ID = "15GD8LcltzQdYQ5_8qP2PCIH9sLrw343ZasBPXg0ugVo";

// Cấu hình mặc định
var CONFIG = {
  BRAND_NAME: "OPC AI PROFITLAB",
  FOUNDER_NAME: "Victor Chuyen (Trần Ngọc Chuyên)",
  ADMIN_PHONE: "0989 890 022",
  ADMIN_EMAIL: "founder@breaths.live",
  DRIVE_VIP_LINK: "https://drive.google.com/drive/folders/19a9jQCsh59weRub54wevIAfjJfRIW1Rv?usp=sharing",
  ZALO_VIP_GROUP: "https://zalo.me/g/opc_vip_profitlab",
  CAL_COACHING_LINK: "https://cal.com/victorchuyen/coachai",
  WEB_LANDING: "https://go.breaths.live/landing_vi",
  TELEGRAM_BOT_TOKEN: "" // Removed exposed token; rotate it at its provider.
  ,
  TELEGRAM_CHAT_ID: "-1001812138135"
};

/**
 * 🟢 1. TIẾP NHẬN WEBHOOK TỰ ĐỘNG (SEPAY / CLOUDFLARE PAGES)
 */
function doPost(e) {
  // Unsafe legacy payment bridge disabled. Use authenticated CRM receiver instead.
  return jsonResponse({ status: "disabled", message: "Legacy receiver disabled after CRM audit" });
  /* LEGACY IMPLEMENTATION (reference only) */
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Empty payload" });
    }

    var payload = JSON.parse(e.postData.contents);
    // Raw webhook logging removed: payload may contain customer information.

    // A. Xử lý trường hợp tạo đơn PENDING từ Frontend / Cloudflare
    if (payload.action === "order_created") {
      return handleOrderCreated(payload);
    }

    // B. Xử lý Webhook Biến Động Số Dư từ Sepay (Tiền vào BIDV)
    return handleSepayPayment(payload);

  } catch (err) {
    Logger.log("Lỗi doPost: " + err.toString());
    return jsonResponse({ status: "error", error: err.toString() });
  }
}

/**
 * 🟡 2. HEALTH CHECK (doGet)
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(
    "<div style='font-family:Segoe UI,sans-serif;padding:30px;background:#070a14;color:#f8fafc;border-radius:12px;'>" +
    "<h2 style='color:#38bdf8;'>OPC: Legacy receiver đã tắt trong mã nguồn này.</h2>" +
    "<p>Chưa xác nhận tích hợp Zalo hoặc thanh toán đang hoạt động. Xem báo cáo audit CRM Zalo.</p>" +
    "<p>Founder & Chairman: <strong>Victor Chuyen (0989 890 022)</strong></p>" +
    "<p>Thời gian máy chủ: " + new Date().toLocaleString("vi-VN") + "</p>" +
    "</div>"
  );
}

/**
 * 📦 3. GHI NHẬN ĐƠN MỚI TẠO (PENDING)
 */
function handleOrderCreated(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("ORDERS_MASTER");
  if (!sheet) return jsonResponse({ status: "error", message: "Missing ORDERS_MASTER tab" });

  var orderCode = data.orderCode || data.code;
  var name = data.customerName || data.name || "Khách hàng";
  var email = data.email || "";
  var phone = data.phone || "";
  var pkg = data.package || data.sku || "STARTER_500K";
  var amount = data.amount || 500000;
  var nowStr = new Date().toLocaleString("vi-VN");

  sheet.appendRow([
    orderCode,
    nowStr,
    name,
    email,
    phone,
    pkg,
    amount,
    "PENDING",
    "",
    "CHƯA GỬI",
    "CHƯA GỬI",
    data.notes || "Khởi tạo từ checkout.html"
  ]);

  return jsonResponse({ status: "success", orderCode: orderCode });
}

/**
 * 💳 4. XỬ LÝ THANH TOÁN SEPAY & BẮN EMAIL / ZALO GIAO HÀNG
 */
function handleSepayPayment(data) {
  var transferAmount = parseInt(data.transferAmount) || 0;
  var content = String(data.content || "");
  var codeField = String(data.code || "");
  var rawText = (codeField + " " + content).toUpperCase();

  // Bóc tách mã đơn: DHxxxxxx hoặc OPC...
  var match = rawText.match(/\b(DH\d{6}|OPC[A-F0-9]{6,16})\b/);
  var orderCode = match ? match[0] : null;

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("ORDERS_MASTER");
  if (!sheet) return jsonResponse({ status: "error", message: "Missing ORDERS_MASTER" });

  var rows = sheet.getDataRange().getValues();
  var foundRowIndex = -1;
  var targetCustomer = null;

  if (orderCode) {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toUpperCase() === orderCode) {
        foundRowIndex = i + 1; // 1-indexed
        targetCustomer = {
          orderCode: rows[i][0],
          name: rows[i][2],
          email: rows[i][3],
          phone: rows[i][4],
          pkg: rows[i][5],
          amount: rows[i][6]
        };
        break;
      }
    }
  }

  var nowStr = new Date().toLocaleString("vi-VN");

  if (foundRowIndex > 0) {
    // Cập nhật dòng hiện có thành PAID
    sheet.getRange(foundRowIndex, 8).setValue("PAID"); // Cột Trạng thái
    sheet.getRange(foundRowIndex, 9).setValue(nowStr);  // Cột Thời gian TT
  } else {
    // Nếu chưa có đơn trước đó, bóc tách SĐT từ nội dung (DH0989890022 hoặc 09...)
    var phoneMatch = content.match(/0\d{9}/);
    var phone = phoneMatch ? phoneMatch[0] : "";
    orderCode = orderCode || ("DH" + Math.floor(100000 + Math.random() * 900000));
    targetCustomer = {
      orderCode: orderCode,
      name: "Khách hàng VIP",
      email: "",
      phone: phone,
      pkg: transferAmount >= 7000000 ? "COACHING_7800K" : (transferAmount >= 750000 ? "STARTER_BUMP_750K" : "STARTER_500K"),
      amount: transferAmount
    };
    sheet.appendRow([
      orderCode,
      nowStr,
      targetCustomer.name,
      targetCustomer.email,
      targetCustomer.phone,
      targetCustomer.pkg,
      transferAmount,
      "PAID",
      nowStr,
      "CHƯA GỬI",
      "CHƯA GỬI",
      "Sepay tự động khớp: " + content
    ]);
    foundRowIndex = sheet.getLastRow();
  }

  // 📩 BẮN EMAIL 1: GIAO HÀNG TỨC THÌ
  if (targetCustomer && targetCustomer.email) {
    try {
      sendEmail1Delivery(targetCustomer);
      sheet.getRange(foundRowIndex, 10).setValue("ĐÃ GỬI TỨC THÌ");
    } catch (e) {
      Logger.log("Lỗi gửi Email 1: " + e.toString());
      sheet.getRange(foundRowIndex, 10).setValue("LỖI GỬI: " + e.message);
    }
  }

  // 💬 GHI NHẬN TRẠNG THÁI ZALO CHĂM SÓC
  sheet.getRange(foundRowIndex, 11).setValue("SẴN SÀNG CHĂM SÓC");

  return jsonResponse({
    status: "success",
    orderCode: orderCode,
    amount: transferAmount,
    customer: targetCustomer ? targetCustomer.name : "N/A"
  });
}

/**
 * 📧 5. MẪU EMAIL 1: GIAO HÀNG TỨC THÌ (CHUẨN HTML CONDÉ NAST / LUXURY)
 */
function sendEmail1Delivery(cust) {
  var subject = "[XÁC NHẬN] Bàn Giao Bộ Starter VIP — OPC AI PROFITLAB";
  var htmlBody = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[XÁC NHẬN] Bàn Giao Bộ Starter VIP — OPC AI PROFITLAB</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 30px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
            
            <tr>
              <td style="background-color: #0b0f19; background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%); padding: 36px 30px 30px 30px; text-align: center; border-bottom: 3px solid #f59e0b;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto;">
                  <tr>
                    <td style="background-color: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 20px; padding: 4px 16px;">
                      <span style="color: #fbbf24 !important; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; display: inline-block;">
                        🏆 OPC AI PROFITLAB
                      </span>
                    </td>
                  </tr>
                </table>
                <h1 style="color: #ffffff !important; margin: 0 0 8px 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.3;">
                  XÁC NHẬN BÀN GIAO BỘ STARTER VIP
                </h1>
                <p style="color: #94a3b8 !important; margin: 0; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">
                  CẨM NANG 45 TRANG · 5 BỘ AI SKILLS · KHUNG THẨM ĐỊNH FACETS
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px 30px 24px 30px; background-color: #ffffff;">
                <p style="color: #0f172a !important; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Chào <strong style="color: #0f172a !important;">${cust.name}</strong>,
                </p>
                <p style="color: #334155 !important; font-size: 15px; line-height: 1.65; margin: 0 0 20px 0;">
                  Tôi là <strong style="color: #0f172a !important;">Victor Chuyen (Trần Ngọc Chuyên)</strong> — Founder của OPC Digital Empire.
                </p>
                <p style="color: #334155 !important; font-size: 15px; line-height: 1.65; margin: 0 0 24px 0;">
                  Hệ thống xác nhận đã nhận thành công khoản thanh toán cho đơn hàng của bạn qua ngân hàng BIDV. Chúc mừng bạn đã có trong tay bộ công cụ chuẩn mực để bắt đầu xây dựng sản phẩm số đầu tiên và làm chủ mô hình Doanh Nghiệp 1 Người!
                </p>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; margin: 0 0 24px 0;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <p style="color: #1e293b !important; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 12px 0;">
                        📋 CHI TIẾT ĐƠN HÀNG CỦA BẠN:
                      </p>
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                        <tr>
                          <td style="padding: 5px 0; color: #64748b !important; width: 42%;">Mã đơn hàng:</td>
                          <td style="padding: 5px 0; color: #2563eb !important; font-weight: 700; font-family: monospace; font-size: 15px;">${cust.orderCode}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0; color: #64748b !important;">Sản phẩm:</td>
                          <td style="padding: 5px 0; color: #0f172a !important; font-weight: 600;">${cust.pkg || "OPC AI PROFITLAB STARTER"}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0; color: #64748b !important;">Số tiền thanh toán:</td>
                          <td style="padding: 5px 0; color: #16a34a !important; font-weight: 700; font-size: 15px;">${Number(cust.amount || 500000).toLocaleString("vi-VN")} VNĐ</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0; color: #64748b !important;">Số điện thoại / Zalo:</td>
                          <td style="padding: 5px 0; color: #0f172a !important; font-weight: 600;">${cust.phone || "N/A"}</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0; color: #64748b !important;">Cổng thanh toán:</td>
                          <td style="padding: 5px 0; color: #0f172a !important;">VietQR BIDV (96247688688 - TRAN NGOC CHUYEN)</td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0; color: #64748b !important;">Trạng thái:</td>
                          <td style="padding: 5px 0; color: #16a34a !important; font-weight: 700;">✅ ĐÃ XÁC NHẬN THÀNH CÔNG</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; margin: 0 0 24px 0;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <p style="color: #1e40af !important; font-size: 14px; font-weight: 700; margin: 0 0 6px 0;">
                        🔑 TOÀN BỘ TÀI NGUYÊN STARTER ĐÃ ĐƯỢC MỞ KHÓA
                      </p>
                      <p style="color: #1e3a8a !important; font-size: 13px; line-height: 1.5; margin: 0;">
                        Tất cả tài liệu cẩm nang, 5 AI Skills, sổ bài tập và biểu mẫu tiếng Việt đã sẵn sàng trên thư mục Google Drive VIP của bạn.
                      </p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                  <tr>
                    <td align="center">
                      <a href="${CONFIG.DRIVE_VIP_LINK}" target="_blank" style="background-color: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; display: block; width: 90%; max-width: 480px; padding: 16px 24px; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                        📥 BẤM VÀO ĐÂY ĐỂ MỞ KHO TÀI LIỆU BỘ STARTER (GOOGLE DRIVE)
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 22px; margin: 0 0 24px 0;">
                  <h3 style="color: #0f172a !important; font-size: 15px; font-weight: 700; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    📦 TRỌN BỘ QUYỀN LỢI BẠN ĐANG SỞ HỮU:
                  </h3>
                  
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6;">
                    <tr>
                      <td style="padding: 8px 0; vertical-align: top; width: 26px; font-size: 18px;">📘</td>
                      <td style="padding: 8px 0 8px 8px; color: #334155 !important;">
                        <strong style="color: #0f172a !important;">Cẩm Nang Thực Hành 45 Trang (PDF):</strong> Lộ trình chi tiết từng bước từ ý tưởng đến sản phẩm số đầu tiên có thể ra mắt.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; vertical-align: top; width: 26px; font-size: 18px;">🤖</td>
                      <td style="padding: 8px 0 8px 8px; color: #334155 !important;">
                        <strong style="color: #0f172a !important;">Hệ Thống 5 Bộ AI Skills (5 File SKILL.md):</strong>
                        <br><span style="color: #64748b; font-size: 13px;">• Skill 01: Chọn ngách &amp; cơ hội tiềm năng cao</span>
                        <br><span style="color: #64748b; font-size: 13px;">• Skill 02: Xây offer &amp; đóng gói sản phẩm số</span>
                        <br><span style="color: #64748b; font-size: 13px;">• Skill 03: Chuẩn bị ra mắt bùng nổ trên Whop</span>
                        <br><span style="color: #64748b; font-size: 13px;">• Skill 04: Kịch bản nội dung &amp; live trình diễn</span>
                        <br><span style="color: #64748b; font-size: 13px;">• Skill 05: Thu thập dữ liệu &amp; tối ưu doanh thu</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; vertical-align: top; width: 26px; font-size: 18px;">📝</td>
                      <td style="padding: 8px 0 8px 8px; color: #334155 !important;">
                        <strong style="color: #0f172a !important;">Sổ Bài Tập Thực Hành 24 Trang (PDF):</strong> Mẫu điền thực tế giúp bạn giải quyết bài toán: Một khách hàng — Một vấn đề cụ thể.
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; vertical-align: top; width: 26px; font-size: 18px;">💎</td>
                      <td style="padding: 8px 0 8px 8px; color: #334155 !important;">
                        <strong style="color: #0f172a !important;">10 Biểu Mẫu &amp; Bảng Thẩm Định FACETS Framework:</strong> Bộ lọc 6 lăng kính kim cương đảm bảo ý tưởng kinh doanh đạt chuẩn 6/6 (Face, Advantage, Capital, Expertise, Time, Scale).
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="margin: 0 0 24px 0;">
                  <p style="color: #0f172a !important; font-size: 15px; font-weight: 700; margin: 0 0 12px 0;">
                    🚀 3 BƯỚC ĐỂ BẮT ĐẦU NGAY HÔM NAY:
                  </p>
                  <ol style="margin: 0; padding-left: 20px; color: #334155 !important; font-size: 14px; line-height: 1.8;">
                    <li style="margin-bottom: 8px;">Tải file <strong style="color: #0f172a !important;">Cẩm nang 45 trang</strong> và mở <strong style="color: #0f172a !important;">Sổ bài tập</strong> để làm quen với quy trình.</li>
                    <li style="margin-bottom: 8px;">Áp dụng <strong style="color: #0f172a !important;">Khung thẩm định FACETS</strong> để kiểm tra độ khả thi 6/6 của ý tưởng kinh doanh bạn đang ấp ủ.</li>
                    <li style="margin-bottom: 8px;">Kích hoạt <strong style="color: #0f172a !important;">Skill 01</strong> cùng trợ lý AI để chọn ngách thị trường ít cạnh tranh và có nhu cầu chi trả cao nhất.</li>
                  </ol>
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-left: 4px solid #9333ea; border-radius: 8px; margin: 0 0 24px 0;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <p style="color: #7e22ce !important; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 6px 0;">
                        ⭐ BẠN MUỐN ĐƯỢC CÀI ĐẶT TRỌN GÓI CHÌA KHÓA TRAO TAY?
                      </p>
                      <p style="color: #581c87 !important; font-size: 13px; line-height: 1.6; margin: 0 0 12px 0;">
                        Nếu bạn muốn tiết kiệm toàn bộ thời gian và để Victor Chuyen cùng Trợ lý AI Lucky trực tiếp thiết kế, cài đặt hạ tầng Cloudflare, kết nối cổng thanh toán SePay và bàn giao cỗ máy Doanh nghiệp 1 Người hoàn chỉnh:
                      </p>
                      <a href="https://go.breaths.live/tu-van" target="_blank" style="color: #9333ea !important; font-weight: 700; font-size: 13px; text-decoration: underline;">
                        👉 Khám phá Gói Done-For-You $297 (7.800.000đ — Giới hạn 99 suất)
                      </a>
                    </td>
                  </tr>
                </table>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px;">
                  <p style="color: #334155 !important; font-size: 14px; line-height: 1.6; margin: 0 0 14px 0;">
                    Nếu bạn cần hỗ trợ trong quá trình thực hành tài liệu, hãy nhắn trực tiếp cho tôi qua Zalo cá nhân: <strong style="color: #2563eb !important;">${CONFIG.ADMIN_PHONE}</strong>.
                  </p>
                  <p style="color: #0f172a !important; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">
                    Trân trọng,
                  </p>
                  <p style="color: #0f172a !important; font-size: 16px; font-weight: 800; margin: 0 0 2px 0;">
                    ${CONFIG.FOUNDER_NAME}
                  </p>
                  <p style="color: #64748b !important; font-size: 13px; margin: 0;">
                    Founder & Chairman, OPC Digital Empire
                  </p>
                </div>

              </td>
            </tr>

            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
                <p style="color: #64748b !important; font-size: 12px; line-height: 1.6; margin: 0 0 6px 0;">
                  © 2026 OPC AI PROFITLAB — OPC Digital Empire. Mọi quyền được bảo lưu.
                </p>
                <p style="color: #94a3b8 !important; font-size: 12px; margin: 0;">
                  Hotline hỗ trợ: <span style="color: #475569 !important; font-weight: 600;">${CONFIG.ADMIN_PHONE}</span> | Bộ Starter: <a href="https://go.breaths.live/starter" target="_blank" style="color: #2563eb !important; text-decoration: none;">go.breaths.live/starter</a>
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  MailApp.sendEmail({
    to: cust.email,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * ⏰ 6. HÀM CHẠY CRON HÀNG NGÀY: GỬI EMAIL CHĂM SÓC (EMAIL 2, 3, 4)
 * Thiết lập Trigger trong Apps Script chạy mỗi ngày lúc 08:00 AM
 */
function sendDailyNurtureEmails() {
  if (PropertiesService.getScriptProperties().getProperty("LEGACY_EMAIL_ENABLED") !== "true") return;
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("ORDERS_MASTER");
  if (!sheet) return;

  var rows = sheet.getDataRange().getValues();
  var now = new Date().getTime();

  for (var i = 1; i < rows.length; i++) {
    var status = rows[i][7];
    var paidAtStr = rows[i][8];
    var email = rows[i][3];
    var name = rows[i][2];
    var notes = rows[i][11] || "";

    if (status !== "PAID" || !paidAtStr || !email) continue;

    var paidDate = new Date(paidAtStr);
    if (isNaN(paidDate.getTime())) continue;

    var diffHours = (now - paidDate.getTime()) / (1000 * 3600);

    // Email 2: Sau 24h
    if (diffHours >= 24 && diffHours < 48 && notes.indexOf("[EMAIL2_SENT]") === -1) {
      sendEmail2QuickWin(email, name);
      sheet.getRange(i + 1, 12).setValue(notes + " [EMAIL2_SENT]");
    }
    // Email 3: Sau 48h
    else if (diffHours >= 48 && diffHours < 120 && notes.indexOf("[EMAIL3_SENT]") === -1) {
      sendEmail3OrderBump(email, name);
      sheet.getRange(i + 1, 12).setValue(notes + " [EMAIL3_SENT]");
    }
    // Email 4: Sau 120h (5 ngày)
    else if (diffHours >= 120 && notes.indexOf("[EMAIL4_SENT]") === -1) {
      sendEmail4Coaching(email, name);
      sheet.getRange(i + 1, 12).setValue(notes + " [EMAIL4_SENT]");
    }
  }
}

function sendEmail2QuickWin(toEmail, name) {
  var subject = "[NGÀY 1] Bạn đã kích hoạt AI Skill đầu tiên chưa? (Hướng dẫn 5 phút)";
  var body = "Chào " + name + ",\n\nVictor Chuyen đây!\n\nMột sai lầm lớn nhất của 90% những người bắt đầu là: TẢI VỀ RỒI ĐỂ ĐÓ.\nTôi muốn bạn tạo ra kết quả thực tế ngay trong hôm nay!\n\n🎯 NHIỆM VỤ 5 PHÚT HÔM NAY:\n1. Mở file 'Skill 01: Chọn ngách & cơ hội' trong kho tài liệu Starter.\n2. Sao chép Prompt thực chiến vào trợ lý AI (ChatGPT / Gemini / Claude).\n3. Điền bối cảnh và nhận ngay phân tích 3 ngách thị trường ít cạnh tranh nhất.\n\n👉 Mở kho tài liệu Google Drive: " + CONFIG.DRIVE_VIP_LINK + "\n\nĐồng hành cùng bạn,\nVictor Chuyen (0989 890 022)";
  MailApp.sendEmail(toEmail, subject, body);
}

function sendEmail3OrderBump(toEmail, name) {
  var subject = "⚡ Ưu đãi nâng cấp độc quyền: Bộ Prompts Độc Quyền & 30 Kịch Bản Video Ngắn Triển Khai Nhanh";
  var body = "Chào " + name + ",\n\nĐể giúp bạn rút ngắn thời gian chuẩn bị ra mắt sản phẩm và có ngay kịch bản kéo khách tự nhiên, tôi mở quyền nâng cấp gói ACCELERATOR BUMP (Trọn bộ prompts thực chiến mở rộng + 30 kịch bản video ngắn faceless).\n\n💰 Ưu đãi học viên: Chỉ 250.000 VNĐ (Tiết kiệm 80%).\n\n👉 Nâng cấp ngay tại: https://go.breaths.live/starter#bai-mau\n\nTrân trọng,\nVictor Chuyen (0989 890 022)";
  MailApp.sendEmail(toEmail, subject, body);
}

function sendEmail4Coaching(toEmail, name) {
  var subject = "⭐ Bạn muốn Victor Chuyen trực tiếp cài đặt cỗ máy Doanh nghiệp 1 Người cho bạn?";
  var body = "Chào " + name + ",\n\nNếu bạn không có thời gian tự mày mò cài đặt hạ tầng kỹ thuật và muốn sở hữu giải pháp chìa khóa trao tay:\n\nVictor Chuyen cùng Trợ lý AI Lucky có thể trực tiếp thiết kế, cài đặt hạ tầng Cloudflare, kết nối cổng thanh toán SePay và bàn giao cỗ máy Doanh nghiệp 1 Người hoàn chỉnh cho bạn.\n\n👉 Khám phá Gói Triển Khai Riêng Done-For-You $297 (7.800.000đ — Giới hạn 99 suất): https://go.breaths.live/tu-van\n\nHoặc nhắn tin trực tiếp Zalo với tôi: 0989 890 022\n\nVictor Chuyen\nFounder, OPC Digital Empire";
  MailApp.sendEmail(toEmail, subject, body);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
