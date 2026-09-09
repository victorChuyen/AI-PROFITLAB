const BASE = 'http://127.0.0.1:8783';

async function testE2E() {
  console.log('🧪 BẮT ĐẦU TEST E2E THỰC TẾ TRÊN MÁY CHỦ LOCAL (PORT 8783)...\n');

  // 1. Check API Config
  console.log('1️⃣ Kiểm tra /api/config?sku=starter...');
  const cfgRes = await fetch(`${BASE}/api/config?sku=starter`);
  const cfg = await cfgRes.json();
  console.log('   Config trả về:', JSON.stringify(cfg));
  if (!cfg.enabled || cfg.priceVnd !== 500000 || cfg.accountName !== 'TRAN NGOC CHUYEN') {
    throw new Error('Config không khớp mong đợi!');
  }
  console.log('   ✅ Config PASS 100%!\n');

  // 2. Tạo đơn hàng với thông tin Lead + Order Bump
  console.log('2️⃣ Tạo đơn hàng Starter + Order Bump (+250k)...');
  const createRes = await fetch(`${BASE}/api/order?sku=starter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Trần Ngọc Chuyên (Founder)',
      email: 'founder@breaths.live',
      phone: '0989890022',
      bump: true
    })
  });
  const cookie = createRes.headers.get('set-cookie');
  const order = await createRes.json();
  console.log('   Đơn hàng khởi tạo thành công:');
  console.log('   - Mã đơn hàng:', order.code);
  console.log('   - Khách hàng:', order.customerName, '|', order.email, '|', order.phone);
  console.log('   - Số tiền:', order.amount.toLocaleString('vi-VN'), 'VNĐ');
  console.log('   - Ngân hàng:', order.bank, '| STK:', order.account, '| Tên:', order.accountName);
  console.log('   - VietQR URL:', order.qrUrl);
  console.log('   - Trạng thái ban đầu:', order.status);

  if (!order.code.startsWith('DH') || order.amount !== 750000 || order.status !== 'pending') {
    throw new Error('Đơn hàng không đúng thông số!');
  }
  console.log('   ✅ Tạo đơn và VietQR PASS 100%!\n');

  // 3. Giả lập SePay khớp lệnh ngân hàng
  console.log(`3️⃣ Giả lập SePay quét biến động số dư cho mã ${order.code}...`);
  const payRes = await fetch(`${BASE}/api/test-pay?code=${order.code}`);
  const payData = await payRes.json();
  console.log('   Kết quả giả lập SePay:', payData.message);
  if (!payData.success) throw new Error('Giả lập thanh toán lỗi!');
  console.log('   ✅ SePay Webhook khớp lệnh PASS 100%!\n');

  // 4. Kiểm tra lại trạng thái đơn hàng (Polling)
  console.log('4️⃣ Kiểm tra lại trạng thái đơn hàng sau thanh toán...');
  const checkRes = await fetch(`${BASE}/api/order?sku=starter`, {
    headers: { Cookie: cookie }
  });
  const updatedOrder = await checkRes.json();
  console.log('   Trạng thái sau thanh toán:', updatedOrder.status);
  console.log('   - Link tải file ZIP:', updatedOrder.downloadUrl);
  console.log('   - Link Google Drive VIP:', updatedOrder.driveVipLink);
  console.log('   - Link Nhóm Zalo VIP:', updatedOrder.zaloVipGroup);

  if (updatedOrder.status !== 'paid' || !updatedOrder.downloadUrl || !updatedOrder.driveVipLink) {
    throw new Error('Đơn hàng chưa chuyển sang PAID hoặc thiếu link bàn giao!');
  }
  console.log('   ✅ Bàn giao tài nguyên tức thì PASS 100%!\n');

  // 5. Kiểm tra tải file ZIP bản quyền
  console.log('5️⃣ Kiểm tra quyền tải file qua /api/download...');
  const dlRes = await fetch(`${BASE}${updatedOrder.downloadUrl}`, {
    headers: { Cookie: cookie }
  });
  const fileContent = await dlRes.text();
  console.log('   Nội dung file nhận được:', fileContent);
  if (dlRes.status !== 200 || !fileContent.includes('OPC AI PROFITLAB')) {
    throw new Error('Tải file thất bại!');
  }
  console.log('   ✅ Tải file trực tiếp PASS 100%!\n');

  console.log('🎉 TOÀN BỘ QUY TRÌNH E2E TEST THÀNH CÔNG RỰC RỠ 100%!');
}

testE2E().catch(err => {
  console.error('❌ E2E TEST THẤT BẠI:', err);
  process.exit(1);
});
