import { getAccessToken } from 'file:///d:/n8n-selfhost/credentials/travel4you/lib/auth.js';

const SPREADSHEET_ID = '15GD8LcltzQdYQ5_8qP2PCIH9sLrw343ZasBPXg0ugVo';
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function callSheetsAPI(endpoint, method = 'GET', body = null) {
  const token = await getAccessToken();
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${SHEETS_BASE}/${SPREADSHEET_ID}${endpoint}`, options);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Sheets API error [${res.status}]: ${errText}`);
  }
  return await res.json();
}

async function getExistingTabs() {
  const meta = await callSheetsAPI('?fields=sheets.properties');
  return meta.sheets.map(s => s.properties);
}

async function ensureTab(title, color = null) {
  const tabs = await getExistingTabs();
  const existing = tabs.find(t => t.title.toLowerCase() === title.toLowerCase());
  if (existing) {
    console.log(`ℹ️ Tab "${title}" already exists (ID: ${existing.sheetId}).`);
    return existing.sheetId;
  }

  console.log(`➕ Creating tab "${title}"...`);
  const req = {
    addSheet: {
      properties: {
        title,
        gridProperties: { rowCount: 500, columnCount: 20 }
      }
    }
  };
  if (color) {
    req.addSheet.properties.tabColor = color;
  }
  const res = await callSheetsAPI(':batchUpdate', 'POST', { requests: [req] });
  const sheetId = res.replies[0].addSheet.properties.sheetId;
  console.log(`✅ Created tab "${title}" (ID: ${sheetId}).`);
  return sheetId;
}

async function writeRange(range, values) {
  const url = `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  await callSheetsAPI(url, 'PUT', {
    range,
    majorDimension: 'ROWS',
    values
  });
  console.log(`✅ Written ${values.length} rows to ${range}`);
}

async function formatSheetHeader(sheetId, colCount) {
  try {
    await callSheetsAPI(':batchUpdate', 'POST', {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: colCount
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.08, green: 0.12, blue: 0.22 }, // Dark Navy
                textFormat: {
                  foregroundColor: { red: 0.95, green: 0.8, blue: 0.2 }, // Gold/Yellow
                  bold: true,
                  fontSize: 11
                },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
          }
        },
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: {
                frozenRowCount: 1
              }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        }
      ]
    });
    console.log(`🎨 Styled header for tab ID ${sheetId}`);
  } catch (e) {
    console.warn(`⚠️ Format error for sheet ${sheetId}:`, e.message);
  }
}

async function main() {
  console.log('🚀 Bắt đầu chuẩn hóa Google Sheet cho OPC AI PROFITLAB...');
  console.log(`Target Sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);

  // 1. TAB MASTER_CONFIG
  const configSheetId = await ensureTab('MASTER_CONFIG', { red: 0.9, green: 0.7, blue: 0.1 });
  const configData = [
    ['THÔNG SỐ HỆ THỐNG', 'GIÁ TRỊ CẤU HÌNH CHUẨN', 'MỤC ĐÍCH SỬ DỤNG / Ý NGHĨA'],
    ['Tên Thương Hiệu', 'OPC AI PROFITLAB', 'Hệ sinh thái Doanh nghiệp 1 người với 6 Giám đốc AI'],
    ['Founder / Chairman', 'Victor Chuyen (Trần Ngọc Chuyên)', 'Nhà sáng lập & Cố vấn chiến lược 1:1'],
    ['Hotline / Zalo Admin', '0989 890 022', 'Kênh đối soát thủ công & Hỗ trợ VIP 1:1'],
    ['Telegram Admin', '@victorchuyen', 'Kênh liên hệ quốc tế'],
    ['Cổng Thanh Toán', 'Sepay (my.sepay.vn)', 'Tự động quét biến động số dư ngân hàng qua Webhook'],
    ['Ngân Hàng Thụ Hưởng', 'BIDV', 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam'],
    ['Số Tài Khoản (STK)', '96247688688', 'STK nhận tiền chính thức duy nhất'],
    ['Chủ Tài Khoản', 'TRAN NGOC CHUYEN', 'Viết hoa không dấu chuẩn ngân hàng'],
    ['Tiền Tố Mã Đơn', 'DH', 'Định danh giao dịch tự động trên Sepay (Ví dụ: DH839102)'],
    ['Sepay Company API Key', 'A9VGJ5BYQCXS4KGKDO3O7BAGH5CWKIDJY1WEHJRBYXTCNPB3TNU6PNCQIDZQZT2O', 'Tra cứu giao dịch qua REST API'],
    ['Sepay Webhook Secret', 'whsec_zOpJ66gGQGBVaq4IsQULqLXa591V6swd', 'Xác thực tính toàn vẹn Webhook'],
    ['Gói 1: Starter Pack', '500.000 VNĐ', 'Bán đứt trọn đời (Ebook 45 trang, 10 Web Travel4U, 500 Prompts)'],
    ['Gói 2: Order Bump', '250.000 VNĐ', 'Nâng cấp 50 Workflows n8n + 30 Video Scripts Triệu View'],
    ['Gói 3: Starter + Bump', '750.000 VNĐ', 'Combo đầy đủ Starter Pack + Order Bump'],
    ['Gói 4: Coaching 1:1', '7.800.000 VNĐ', 'Sprint 7 Ngày cố vấn 1:1 cùng Chairman Victor Chuyen'],
    ['Link Landing Page', 'https://ai.breaths.live/landing_vi', 'Landing page chính thức tiếng Việt'],
    ['Link Checkout Động', 'https://go.breaths.live/checkout', 'Trang thanh toán VietQR động'],
    ['Link Demo Travel4U', 'https://hanotour.travel4you.app/', 'Hệ thống 10 website vệ tinh du lịch triệu view'],
    ['Link Demo 3D Office', 'https://hanotour.travel4you.app/3d', 'Văn phòng không gian số 3D toàn cầu'],
    ['Link Đặt Lịch Coaching', 'https://cal.com/victorchuyen/coachai', 'Lịch hẹn Sprint 1:1 qua Cal.com'],
    ['Link Kho Drive VIP', 'https://drive.google.com/drive/folders/19a9jQCsh59weRub54wevIAfjJfRIW1Rv?usp=sharing', 'Kho tài nguyên số bàn giao cho học viên'],
    ['Link Nhóm Zalo VIP', 'https://zalo.me/g/opc_vip_profitlab', 'Nhóm hỗ trợ học viên VIP 1:1']
  ];
  await writeRange("'MASTER_CONFIG'!A1:C" + configData.length, configData);
  await formatSheetHeader(configSheetId, 3);

  // 2. TAB ORDERS_MASTER
  const ordersSheetId = await ensureTab('ORDERS_MASTER', { red: 0.1, green: 0.8, blue: 0.3 });
  const ordersHeaders = [
    [
      'Mã Đơn Hàng (Order ID)',
      'Thời Gian Tạo',
      'Họ Và Tên Khách Hàng',
      'Email Nhận File',
      'Số Điện Thoại / Zalo',
      'Gói Sản Phẩm',
      'Số Tiền (VNĐ)',
      'Trạng Thái',
      'Thời Gian Thanh Toán',
      'Email Bàn Giao',
      'Zalo Chăm Sóc',
      'Ghi Chú Nguồn / Chiến Dịch'
    ],
    [
      'DH839102',
      '2026-09-09 18:00:00',
      'Trần Ngọc Chuyên',
      'founder@breaths.live',
      '0989890022',
      'STARTER_500K',
      '500000',
      'PAID',
      '2026-09-09 18:02:15',
      'ĐÃ GỬI TỨC THÌ',
      'ĐÃ GỬI ZALO',
      'Mẫu đơn chuẩn hệ thống'
    ]
  ];
  await writeRange("'ORDERS_MASTER'!A1:L2", ordersHeaders);
  await formatSheetHeader(ordersSheetId, 12);

  // 3. TAB EMAIL_AUTOMATION
  const emailSheetId = await ensureTab('EMAIL_AUTOMATION', { red: 0.2, green: 0.5, blue: 0.9 });
  const emailData = [
    [
      'Thứ Tự (Email #)',
      'Thời Điểm Gửi',
      'Tiêu Đề Email (Subject)',
      'Người Gửi (Sender)',
      'Mục Đích Chiến Lược',
      'Nội Dung Thông Điệp / Kịch Bản',
      'Nút Bấm CTA',
      'Link Nút Bấm (Button URL)',
      'Trạng Thái'
    ],
    [
      'Email 1',
      'Tức thì trong 3s sau khi thanh toán',
      '[XÁC NHẬN] Bàn Giao Bộ Starter VIP — OPC AI PROFITLAB',
      'Victor Chuyen | OPC AI PROFITLAB <victor@breaths.live>',
      'Bàn giao toàn bộ tài nguyên Bộ Starter (500.000đ), mở link Google Drive và hỗ trợ Zalo cá nhân 1:1',
      'Xác nhận nhận đủ 500.000đ qua VietQR BIDV. Bàn giao: Cẩm nang 45 trang, 5 Bộ AI Skills (Chọn ngách, Xây offer, Ra mắt Whop, Kịch bản nội dung, Tối ưu dữ liệu), Sổ bài tập 24 trang, 10 Biểu mẫu & Khung thẩm định FACETS 6/6.',
      '📥 MỞ KHO TÀI LIỆU BỘ STARTER (GOOGLE DRIVE)',
      'https://drive.google.com/drive/folders/19a9jQCsh59weRub54wevIAfjJfRIW1Rv?usp=sharing',
      'ACTIVE'
    ],
    [
      'Email 2',
      'Sau 24 giờ kể từ khi thanh toán',
      '[NGÀY 1] Bạn đã kích hoạt AI Skill đầu tiên chưa? (Hướng dẫn 5 phút)',
      'Victor Chuyen | OPC AI PROFITLAB <victor@breaths.live>',
      'Thúc đẩy Quick Win trong 24h, hướng dẫn mở Skill 01 (Chọn ngách & cơ hội) và kiểm tra chuẩn 6/6 FACETS',
      'Nhắc nhở người học không để tài liệu phủ bụi. Thực hành nhiệm vụ 5 phút sao chép Prompt thực chiến vào trợ lý AI để phân tích 3 ngách thị trường ít cạnh tranh nhất.',
      '🎯 XEM HƯỚNG DẪN SKILL 01',
      'https://ai.breaths.live/starter#bai-mau',
      'ACTIVE'
    ],
    [
      'Email 3',
      'Sau 48 giờ kể từ khi thanh toán',
      '⚡ Ưu đãi nâng cấp độc quyền: Bộ Prompts Độc Quyền & 30 Kịch Bản Video Ngắn Triển Khai Nhanh',
      'Victor Chuyen | OPC AI PROFITLAB <victor@breaths.live>',
      'Upsell gói Order Bump (+250.000đ) tăng tốc kéo khách tự nhiên và ra mắt sản phẩm',
      'Giới thiệu gói tăng tốc kéo khách: Trọn bộ prompts thực chiến mở rộng + 30 kịch bản video ngắn faceless giúp chuẩn bị ra mắt sản phẩm thần tốc. Ưu đãi 250.000đ.',
      '⚡ NÂNG CẤP GÓI ACCELERATOR BUMP 250K',
      'https://ai.breaths.live/starter#bai-mau',
      'ACTIVE'
    ],
    [
      'Email 4',
      'Sau 5 ngày kể từ khi thanh toán',
      '⭐ Bạn muốn Victor Chuyen trực tiếp cài đặt cỗ máy Doanh nghiệp 1 Người cho bạn?',
      'Victor Chuyen | OPC AI PROFITLAB <victor@breaths.live>',
      'Giới thiệu Gói Triển Khai Riêng Done-For-You $297 (7.800.000đ — Giới hạn 99 suất)',
      'Bàn giao trọn gói chìa khóa trao tay: Victor Chuyen cùng Trợ lý AI Lucky trực tiếp thiết kế, cài đặt hạ tầng Cloudflare, kết nối cổng thanh toán SePay và hoàn thiện cỗ máy Doanh nghiệp 1 Người.',
      '👑 KHÁM PHÁ GÓI TRIỂN KHAI RIÊNG $297',
      'https://ai.breaths.live/tu-van',
      'ACTIVE'
    ]
  ];
  await writeRange("'EMAIL_AUTOMATION'!A1:I5", emailData);
  await formatSheetHeader(emailSheetId, 9);

  // 4. TAB ZALO_NURTURE
  const zaloSheetId = await ensureTab('ZALO_NURTURE', { red: 0.1, green: 0.6, blue: 0.95 });
  const zaloData = [
    [
      'Bước (Step #)',
      'Thời Điểm Gửi',
      'Kênh Gửi',
      'Mục Đích',
      'Nội Dung Tin Nhắn Mẫu (Copy/Paste)',
      'Hành Động Yêu Cầu (CTA)',
      'Trạng Thái'
    ],
    [
      'Tin 1',
      'Tức thì khi Sepay khớp lệnh',
      'Zalo Cá Nhân (0989 890 022) / Zalo OA',
      'Xác nhận đơn hàng thành công & bàn giao link',
      '🎉 [XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG]\nChào anh/chị {{customer_name}}, Victor Chuyen xin xác nhận đã nhận thành công {{amount}}đ cho đơn hàng {{order_code}}.\n\nToàn bộ kho tài liệu Bộ Starter VIP đã sẵn sàng:\n📂 Link tải trọn bộ Google Drive: {{drive_vip_link}}\n🌐 Trải nghiệm Prompt AI & 5 Skills: https://ai.breaths.live/starter#bai-mau\n💬 Kênh Zalo hỗ trợ trực tiếp cùng Victor: 0989 890 022\n\nEm đã gửi thêm 1 bản bàn giao chi tiết qua email: {{customer_email}}. Anh/chị kiểm tra hộp thư nhé! Cần hỗ trợ gấp cứ nhắn thẳng Zalo này cho em. 🚀',
      'Bấm vào link Drive & mở file Cẩm nang 45 trang',
      'ACTIVE'
    ],
    [
      'Tin 2',
      'Sau 2 giờ kể từ khi thanh toán',
      'Zalo Cá Nhân (0989 890 022)',
      'Check-in hỏi thăm tình hình tải tài liệu',
      'Anh/chị {{customer_name}} ơi, mình đã mở được file Cẩm nang 45 trang và Sổ bài tập 24 trang về máy chưa ạ?\nTrong thư mục Drive em có để sẵn cấu trúc từng bước rất trực quan. Anh/chị xem qua trước nhé, nếu vướng chỗ nào cứ nhắn em chỉ ngay! 💪',
      'Hỏi phản hồi và hỗ trợ tiếp cận tài liệu',
      'ACTIVE'
    ],
    [
      'Tin 3',
      'Sau 24 giờ kể từ khi thanh toán',
      'Zalo Cá Nhân (0989 890 022)',
      'Kích hoạt hành động & thẩm định ý tưởng với FACETS',
      'Chào {{customer_name}}, anh/chị đã kiểm chứng ý tưởng kinh doanh số của mình bằng Bộ lọc 6/6 FACETS Framework chưa ạ?\nNếu chưa chắc chắn về ngách hoặc muốn thẩm định tiềm năng thị trường, gửi mô tả ý tưởng qua đây em góp ý trực tiếp cho nhé! 🎯',
      'Mời gửi ý tưởng ngách để Victor thẩm định 1:1',
      'ACTIVE'
    ],
    [
      'Tin 4',
      'Sau 4-5 ngày kể từ khi thanh toán',
      'Zalo Cá Nhân (0989 890 022)',
      'Giới thiệu Gói Triển Khai Riêng Done-For-You $297',
      'Chào {{customer_name}}, nếu anh/chị không có thời gian tự cài đặt hạ tầng kỹ thuật và muốn sở hữu trọn gói cỗ máy Doanh nghiệp 1 Người tự động hóa (Hạ tầng Cloudflare, cổng thanh toán SePay, cỗ máy đóng gói sản phẩm số):\n\nAnh/chị xem chi tiết Gói Triển Khai Riêng Done-For-You $297 (7.800.000đ — Giới hạn 99 suất) tại https://ai.breaths.live/tu-van hoặc nhắn em tư vấn riêng nhé! 👑',
      'Xem chi tiết Gói Triển Khai Riêng tại /tu-van',
      'ACTIVE'
    ]
  ];
  await writeRange("'ZALO_NURTURE'!A1:G5", zaloData);
  await formatSheetHeader(zaloSheetId, 7);

  // 5. TAB LEADS
  const leadsSheetId = await ensureTab('LEADS', { red: 0.8, green: 0.2, blue: 0.8 });
  const leadsData = [
    [
      'ID Lead',
      'Thời Gian Đăng Ký',
      'Họ Và Tên',
      'Email',
      'Số Điện Thoại / Zalo',
      'Gói Quan Tâm',
      'Trạng Thái',
      'Ghi Chú Nguồn / Chiến Dịch'
    ]
  ];
  await writeRange("'LEADS'!A1:H1", leadsData);
  await formatSheetHeader(leadsSheetId, 8);

  console.log('\n🎉 HOÀN THÀNH CHUẨN HÓA 5 TAB TRUNG TÂM CHO GOOGLE SHEET OPC AI PROFITLAB!');
}

main().catch(err => {
  console.error('❌ Thất bại:', err);
  process.exit(1);
});
