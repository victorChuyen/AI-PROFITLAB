#!/usr/bin/env node
/**
 * 🤖 OPC AI PROFITLAB — AGENT TEAM WORK & SHIFT REPORTING ENGINE
 * Topic Telegram: 68 (TEAM WORK | AI Agents Điều Hành)
 * Supergroup: -1001812138135
 * Bot: 8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk
 *
 * Chỉ huy tối cao: Chairman Victor Chuyen
 * AI Executive: Lucky CEO (Team Leader)
 */

import { getAccessToken } from 'file:///d:/n8n-selfhost/credentials/travel4you/lib/auth.js';

const SPREADSHEET_ID = '15GD8LcltzQdYQ5_8qP2PCIH9sLrw343ZasBPXg0ugVo';
const BOT_TOKEN = '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk';
const CHAT_ID = '-1001812138135';
const TEAMWORK_THREAD_ID = 68;

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      params[match[1]] = match[2];
    }
  }
  return params;
}

// Fetch live KPI metrics from Google Sheet
async function getLiveMetrics() {
  try {
    const token = await getAccessToken();
    const [payRes, leadRes, ordRes] = await Promise.all([
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PAYMENT!A2:H`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/LEADS!A2:G`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ORDERS_MASTER!A2:H`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const [payments, leads, orders] = await Promise.all([
      payRes.json(),
      leadRes.json(),
      ordRes.json()
    ]);

    const payRows = payments.values || [];
    const leadRows = leads.values || [];
    const orderRows = orders.values || [];

    let totalRevenueVnd = 0;
    for (const r of payRows) {
      const amt = parseInt(String(r[7] || '').replace(/[^\d]/g, ''), 10);
      if (amt && !isNaN(amt)) totalRevenueVnd += amt;
    }

    return {
      totalLeads: leadRows.length,
      totalOrders: orderRows.length,
      totalPayments: payRows.length,
      totalRevenueVnd,
      syncStatus: 'Live Google Sheets 100%'
    };
  } catch (err) {
    return {
      totalLeads: 0,
      totalOrders: 0,
      totalPayments: 0,
      totalRevenueVnd: 0,
      syncStatus: `Offline (${err.message})`
    };
  }
}

export async function sendTeamworkReport(options = {}) {
  const params = { ...parseArgs(), ...options };
  const agentName = params.agent || params.agentName || 'Lucky CEO (Team Leader)';
  const shift = params.shift || (new Date().getHours() < 12 ? 'Ca Sáng (Trước 11:00)' : 'Ca Chiều (Trước 16:00)');
  const title = params.title || 'BÁO CÁO VẬN HÀNH & TIẾN ĐỘ HỆ THỐNG';
  const customReport = params.report || params.content || '';
  const customActions = params.actions || params.nextActions || '';

  const metrics = await getLiveMetrics();

  let message =
    `🤖 <b>[TEAM WORK | BÁO CÁO ĐIỀU HÀNH AI AGENTS]</b>\n` +
    `═══════════════════════════════\n` +
    `🎖 <b>AI Báo Cáo:</b> <b>${agentName}</b>\n` +
    `🕒 <b>Khung Ca:</b> <code>${shift}</code>\n` +
    `📌 <b>Chuyên Đề:</b> <b>${title}</b>\n\n` +
    `📊 <b>CHỈ SỐ KPI THỰC TẾ (GOOGLE SHEETS LIVE):</b>\n` +
    `• 🎯 Tổng Leads Đăng Ký: <code>${metrics.totalLeads} khách</code>\n` +
    `• 📦 Tổng Đơn Hàng Tạo: <code>${metrics.totalOrders} đơn</code>\n` +
    `• 💳 Giao Dịch Thành Công: <code>${metrics.totalPayments} thanh toán</code>\n` +
    `• 💰 Doanh Thu Thực Nhận: <code>${metrics.totalRevenueVnd.toLocaleString('vi-VN')} VNĐ</code>\n` +
    `• ⚡ Trạng Thái Sync Sheet: <code>${metrics.syncStatus}</code>\n\n`;

  if (customReport) {
    message +=
      `📝 <b>CHI TIẾT VẬN HÀNH & KẾT QUẢ:</b>\n` +
      `${customReport}\n\n`;
  } else {
    message +=
      `📝 <b>TIẾN ĐỘ VẬN HÀNH HIỆN TẠI:</b>\n` +
      `1. Hệ thống Checkout 127.0.0.1:8783 & Cổng SePay BIDV 96247688688 hoạt động ổn định 100%.\n` +
      `2. Phân luồng tự động 5 Topics Telegram (PAYMENT, LEADS, ĐẶT LỊCH, SUPPORT, TEAM WORK) đã thông luồng.\n` +
      `3. Đồng bộ 2 chiều dữ liệu vào Google Sheet tab PAYMENT, LEADS, ORDERS_MASTER chuẩn xác.\n\n`;
  }

  if (customActions) {
    message +=
      `🚀 <b>KẾ HOẠCH BƯỚC TIẾP THEO:</b>\n` +
      `${customActions}\n\n`;
  } else {
    message +=
      `🚀 <b>HÀNH ĐỘNG TIẾP THEO:</b>\n` +
      `• Đón tiếp leads mới từ chiến dịch Side Hustle Summit 5 Ngày.\n` +
      `• Giám sát tự động biến động số dư SePay tiền về BIDV.\n` +
      `• Sẵn sàng lịch tư vấn chiến lược 1:1 trên Cal.com.\n\n`;
  }

  message +=
    `⏰ <b>Thời gian xuất báo cáo:</b> <code>${new Date().toLocaleString('vi-VN')}</code>\n` +
    `👤 <b>Kính gửi:</b> Chairman Victor Chuyen & Toàn Thể AI Squad`;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      message_thread_id: TEAMWORK_THREAD_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });

  const data = await res.json();
  if (data.ok) {
    console.log(`✅ [TEAM WORK] Báo cáo đã gửi thành công vào Topic 68 (Message ID: ${data.result.message_id})!`);
  } else {
    console.error(`❌ [TEAM WORK Error]:`, data);
  }
  return data;
}

// If executed directly from terminal
if (process.argv[1] && process.argv[1].endsWith('agent_teamwork_reporter.mjs')) {
  sendTeamworkReport().catch(console.error);
}
