const botToken = '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk';
const chatId = '-1001812138135';

const topicsToCreate = [
  { name: '💳 PAYMENT | Tiền Về SePay', color: 0x8EEE98, desc: 'Nơi thông báo tiền về tài khoản BIDV 96247688688 theo thời gian thực từ SePay.' },
  { name: '🎯 LEADS | Đơn Khởi Tạo & CRM', color: 0xFFD67E, desc: 'Ghi nhận mọi khách hàng điền form checkout.html và lưu danh bạ CRM.' },
  { name: '📅 ĐẶT LỊCH | Cal.com VIP', color: 0x6FB9F0, desc: 'Lịch hẹn tư vấn chiến lược 1:1 Starter 500k & VIP 7.8M.' },
  { name: '🛠️ SUPPORT | Chăm Sóc Khách Hàng', color: 0xCB86DB, desc: 'Hỗ trợ kỹ thuật, kích hoạt VIP Drive, giải đáp thắc mắc khách hàng.' },
  { name: '🤖 TEAM WORK | AI Agents Điều Hành', color: 0xFB6F5F, desc: 'Khu vực Chairman Victor & các AI Agent (Lucky, Codex, etc.) tương tác, báo cáo ca và nhận chỉ thị.' }
];

async function main() {
  console.log('🚀 Khởi tạo các Topic chuyên biệt trên Telegram Supergroup:', chatId);
  const created = {};

  for (const t of topicsToCreate) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/createForumTopic`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          name: t.name,
          icon_color: t.color
        })
      });
      const data = await res.json();
      console.log(`Topic [${t.name}]:`, data);

      if (data.ok) {
        const threadId = data.result.message_thread_id;
        created[t.name] = threadId;

        // Send opening greeting message inside the topic
        const sendUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(sendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_thread_id: threadId,
            text: `🎯 *CHÀO MỪNG ĐẾN VỚI TOPIC: ${t.name}*\n\n📌 *Mục đích:* ${t.desc}\n👤 *Chỉ huy:* Chairman Victor Chuyen\n🤖 *AI Điều hành:* Lucky CEO\n⚡ *Trạng thái:* Sẵn sàng tự động hóa 100%!`,
            parse_mode: 'Markdown'
          })
        });
      }
    } catch (err) {
      console.error(`Lỗi tạo topic ${t.name}:`, err.message);
    }
  }

  console.log('\n✅ KẾT QUẢ TẠO TOPIC THÀNH CÔNG:');
  console.log(JSON.stringify(created, null, 2));
}

main().catch(console.error);
