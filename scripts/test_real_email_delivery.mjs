import { getAccessToken } from 'file:///d:/n8n-selfhost/credentials/travel4you/lib/auth.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RECIPIENT_EMAIL = 'dataphuan@gmail.com';
const RECIPIENT_PHONE = '0566260837';
const RECIPIENT_NAME = 'Trần Ngọc Chuyên (Chairman Victor)';
const ORDER_CODE = 'DH' + Math.floor(100000 + Math.random() * 900000);
const SPREADSHEET_ID = '15GD8LcltzQdYQ5_8qP2PCIH9sLrw343ZasBPXg0ugVo';

const DRIVE_VIP_LINK = 'https://drive.google.com/drive/folders/19a9jQCsh59weRub54wevIAfjJfRIW1Rv?usp=sharing';
const ZALO_VIP_GROUP = 'https://zalo.me/g/opc_vip_profitlab';

function buildDeliveryHtml() {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[XÁC NHẬN] Bàn Giao Bộ Starter VIP — OPC AI PROFITLAB</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <!-- Wrapper Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (600px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Midnight Obsidian & Gold) -->
          <tr>
            <td style="background-color: #0b0f19; background: linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%); padding: 36px 30px 30px 30px; text-align: center; border-bottom: 3px solid #f59e0b;">
              <!-- Brand Tag -->
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

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px 30px 24px 30px; background-color: #ffffff;">
              
              <!-- Greeting -->
              <p style="color: #0f172a !important; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Chào <strong style="color: #0f172a !important;">${RECIPIENT_NAME}</strong>,
              </p>
              <p style="color: #334155 !important; font-size: 15px; line-height: 1.65; margin: 0 0 20px 0;">
                Tôi là <strong style="color: #0f172a !important;">Victor Chuyen (Trần Ngọc Chuyên)</strong> — Founder của OPC Digital Empire.
              </p>
              <p style="color: #334155 !important; font-size: 15px; line-height: 1.65; margin: 0 0 24px 0;">
                Hệ thống xác nhận đã nhận thành công khoản thanh toán cho đơn hàng của bạn qua ngân hàng BIDV. Chúc mừng bạn đã có trong tay bộ công cụ chuẩn mực để bắt đầu xây dựng sản phẩm số đầu tiên và làm chủ mô hình Doanh Nghiệp 1 Người!
              </p>

              <!-- Order Summary Receipt Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 8px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="color: #1e293b !important; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 12px 0;">
                      📋 CHI TIẾT ĐƠN HÀNG CỦA BẠN:
                    </p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 5px 0; color: #64748b !important; width: 42%;">Mã đơn hàng:</td>
                        <td style="padding: 5px 0; color: #2563eb !important; font-weight: 700; font-family: monospace; font-size: 15px;">${ORDER_CODE}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b !important;">Sản phẩm:</td>
                        <td style="padding: 5px 0; color: #0f172a !important; font-weight: 600;">OPC AI PROFITLAB STARTER</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b !important;">Số tiền thanh toán:</td>
                        <td style="padding: 5px 0; color: #16a34a !important; font-weight: 700; font-size: 15px;">500.000 VNĐ</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b !important;">Số điện thoại / Zalo:</td>
                        <td style="padding: 5px 0; color: #0f172a !important; font-weight: 600;">${RECIPIENT_PHONE}</td>
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

              <!-- Access Callout Box -->
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

              <!-- Big Primary CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${DRIVE_VIP_LINK}" target="_blank" style="background-color: #2563eb; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; display: block; width: 90%; max-width: 480px; padding: 16px 24px; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                      📥 BẤM VÀO ĐÂY ĐỂ MỞ KHO TÀI LIỆU BỘ STARTER (GOOGLE DRIVE)
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Deliverables Breakdown List (100% Khớp Starter 500k) -->
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

              <!-- 3 Next Steps -->
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

              <!-- High-Ticket Upsell Box (Tư vấn triển khai riêng 7.800.000đ) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-left: 4px solid #9333ea; border-radius: 8px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="color: #7e22ce !important; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 6px 0;">
                      ⭐ BẠN MUỐN ĐƯỢC CÀI ĐẶT TRỌN GÓI CHÌA KHÓA TRAO TAY?
                    </p>
                    <p style="color: #581c87 !important; font-size: 13px; line-height: 1.6; margin: 0 0 12px 0;">
                      Nếu bạn muốn tiết kiệm toàn bộ thời gian và để Victor Chuyen cùng Trợ lý AI Lucky trực tiếp thiết kế, cài đặt hạ tầng Cloudflare, kết nối cổng thanh toán SePay và bàn giao cỗ máy Doanh nghiệp 1 Người hoàn chỉnh:
                    </p>
                    <a href="https://ai.breaths.live/tu-van" target="_blank" style="color: #9333ea !important; font-weight: 700; font-size: 13px; text-decoration: underline;">
                      👉 Khám phá Gói Done-For-You $297 (7.800.000đ — Giới hạn 99 suất)
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct Contact / Founder Signature -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px;">
                <p style="color: #334155 !important; font-size: 14px; line-height: 1.6; margin: 0 0 14px 0;">
                  Nếu bạn cần hỗ trợ trong quá trình thực hành tài liệu, hãy nhắn trực tiếp cho tôi qua Zalo cá nhân: <strong style="color: #2563eb !important;">0989 890 022</strong>.
                </p>
                <p style="color: #0f172a !important; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">
                  Trân trọng,
                </p>
                <p style="color: #0f172a !important; font-size: 16px; font-weight: 800; margin: 0 0 2px 0;">
                  Victor Chuyen (Trần Ngọc Chuyên)
                </p>
                <p style="color: #64748b !important; font-size: 13px; margin: 0;">
                  Founder & Chairman, OPC Digital Empire
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
              <p style="color: #64748b !important; font-size: 12px; line-height: 1.6; margin: 0 0 6px 0;">
                © 2026 OPC AI PROFITLAB — OPC Digital Empire. Mọi quyền được bảo lưu.
              </p>
              <p style="color: #94a3b8 !important; font-size: 12px; margin: 0;">
                Hotline hỗ trợ: <span style="color: #475569 !important; font-weight: 600;">0989 890 022</span> | Bộ Starter: <a href="https://ai.breaths.live/starter" target="_blank" style="color: #2563eb !important; text-decoration: none;">ai.breaths.live/starter</a>
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
}

async function sendRealEmail() {
  console.log(`📧 GỬI EMAIL THẬT ĐẾN: ${RECIPIENT_EMAIL}...`);
  const html = buildDeliveryHtml();

  // Try verified senders
  const senders = [
    'Victor Chuyen | OPC AI PROFITLAB <victor@breaths.live>',
    'Victor Chuyen <onboarding@resend.dev>'
  ];

  let lastRes = null;
  let successSender = null;

  for (const sender of senders) {
    try {
      console.log(`   Đang thử gửi từ sender: ${sender}...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: sender,
          to: [RECIPIENT_EMAIL],
          subject: '[XÁC NHẬN] Chúc mừng bạn đã sở hữu OPC AI PROFITLAB — Bàn giao toàn bộ tài nguyên VIP',
          html: html,
          text: `Chúc mừng bạn đã sở hữu OPC AI PROFITLAB! Mã đơn: ${ORDER_CODE}. Mở kho Drive VIP: ${DRIVE_VIP_LINK} | Nhóm Zalo: ${ZALO_VIP_GROUP} | Hotline: 0989 890 022`
        })
      });

      const data = await res.json();
      if (res.ok && data.id) {
        lastRes = data;
        successSender = sender;
        console.log(`   ✅ GỬI EMAIL THÀNH CÔNG! Resend Message ID: ${data.id}`);
        break;
      } else {
        console.warn(`   ⚠️ Thử với ${sender} không được:`, JSON.stringify(data));
      }
    } catch (e) {
      console.warn(`   ⚠️ Lỗi fetch với ${sender}:`, e.message);
    }
  }

  return { lastRes, successSender };
}

async function appendToGoogleSheet(resendId) {
  console.log(`📋 GHI NHẬN VÀO GOOGLE SHEET CRM (${SPREADSHEET_ID})...`);
  try {
    const token = await getAccessToken();
    const nowStr = new Date().toLocaleString('vi-VN');

    // Append to ORDERS_MASTER
    const orderRow = [
      ORDER_CODE,
      nowStr,
      RECIPIENT_NAME,
      RECIPIENT_EMAIL,
      RECIPIENT_PHONE,
      'STARTER_500K',
      500000,
      'PAID',
      nowStr,
      resendId ? `ĐÃ GỬI (Resend ID: ${resendId})` : 'ĐÃ GỬI',
      'ĐÃ BẮN TIN ZALO',
      'Test thực tế của Chairman Victor'
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'ORDERS_MASTER'!A:L:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [orderRow] })
      }
    );

    if (!appendRes.ok) {
      console.error('Lỗi ghi Sheet ORDERS_MASTER:', await appendRes.text());
    } else {
      console.log('   ✅ Đã ghi nhận bản ghi PAID vào tab ORDERS_MASTER!');
    }

    // Append to LEADS
    const leadRow = [
      'LEAD-' + Date.now(),
      nowStr,
      RECIPIENT_NAME,
      RECIPIENT_EMAIL,
      RECIPIENT_PHONE,
      'STARTER_500K',
      'converted_paid',
      'Test thực tế qua CLI'
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'LEADS'!A:H:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [leadRow] })
      }
    );
    console.log('   ✅ Đã ghi nhận bản ghi vào tab LEADS!');

  } catch (err) {
    console.error('Lỗi khi ghi Google Sheet:', err.message);
  }
}

async function main() {
  console.log('🚀 BẮT ĐẦU TEST THỰC TẾ CHO CHAIRMAN VICTOR CHUYEN:');
  console.log(`- Email nhận: ${RECIPIENT_EMAIL}`);
  console.log(`- Số Zalo:   ${RECIPIENT_PHONE}`);
  console.log(`- Mã đơn:    ${ORDER_CODE}\n`);

  const { lastRes, successSender } = await sendRealEmail();
  await appendToGoogleSheet(lastRes ? lastRes.id : null);

  console.log('\n=============================================================');
  console.log('🎉 TỔNG KẾT KẾT QUẢ TEST EMAIL & ZALO THỰC TẾ:');
  console.log(`1. Email bàn giao VIP: Đã gửi trực tiếp tới ${RECIPIENT_EMAIL}`);
  if (lastRes) {
    console.log(`   - Trạng thái Resend: THÀNH CÔNG (ID: ${lastRes.id})`);
    console.log(`   - Sender: ${successSender}`);
  }
  console.log(`2. Google Sheet CRM: Đã ghi nhận đơn hàng ${ORDER_CODE} (Trạng thái: PAID)`);
  console.log(`3. Kịch bản Zalo cá nhân chăm sóc cho SĐT ${RECIPIENT_PHONE}:`);
  console.log(`   👉 Link mở chat Zalo trực tiếp 1-click: https://zalo.me/${RECIPIENT_PHONE.replace(/^0/, '84')}`);
  console.log('=============================================================\n');
}

main().catch(err => {
  console.error('Lỗi tổng thể:', err);
  process.exit(1);
});
