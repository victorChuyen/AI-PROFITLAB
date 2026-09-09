import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { handle, products } from '../server/payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = 8783;

// Initialize SQLite DB
const sqlite = new DatabaseSync(':memory:');
const schema = fs.readFileSync(path.join(ROOT, 'migrations', '0001_orders.sql'), 'utf8');
sqlite.exec(schema);

const prepare = sql => ({
  bind(...args) {
    return {
      first: async () => sqlite.prepare(sql).get(...args) || null,
      run: async () => sqlite.prepare(sql).run(...args),
      _run: () => sqlite.prepare(sql).run(...args)
    };
  }
});

const DB = {
  prepare,
  async batch(stmts) {
    sqlite.exec('BEGIN');
    try {
      const r = stmts.map(s => s._run());
      sqlite.exec('COMMIT');
      return r;
    } catch (e) {
      sqlite.exec('ROLLBACK');
      throw e;
    }
  }
};

import { getAccessToken } from 'file:///d:/n8n-selfhost/credentials/travel4you/lib/auth.js';

const SPREADSHEET_ID = '15GD8LcltzQdYQ5_8qP2PCIH9sLrw343ZasBPXg0ugVo';

async function appendLeadToSheet(order) {
  try {
    const token = await getAccessToken();
    const nowStr = new Date().toLocaleString('vi-VN');

    // 1. Ghi vào Tab LEADS
    const leadRow = [
      order.code,
      nowStr,
      order.customer_name || 'Khách hàng',
      order.email || '',
      order.phone || '',
      products[order.sku]?.label || order.sku,
      'Chờ quét VietQR',
      'Khởi tạo từ checkout.html'
    ];
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/LEADS!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'LEADS!A:H',
        majorDimension: 'ROWS',
        values: [leadRow]
      })
    });

    // 2. Ghi vào Tab ORDERS_MASTER
    const orderRow = [
      order.code,
      nowStr,
      order.customer_name || 'Khách hàng',
      order.email || '',
      order.phone || '',
      products[order.sku]?.label || order.sku,
      order.amount,
      'PENDING',
      '',
      'CHƯA GỬI',
      'CHƯA GỬI',
      'Khởi tạo từ checkout.html'
    ];
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ORDERS_MASTER!A:L:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'ORDERS_MASTER!A:L',
        majorDimension: 'ROWS',
        values: [orderRow]
      })
    });

    console.log(`🎯 [Google Sheet] Đã ghi Lead & Order ${order.code} (${order.customer_name}) vào tab LEADS và ORDERS_MASTER!`);
  } catch (err) {
    console.error('❌ [Google Sheet Lead Error]:', err.message);
  }
}

async function appendPaymentToSheet({ data, order, now, timeStr }) {
  try {
    const token = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/PAYMENT!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    const row = [
      data.gateway || 'BIDV',                                    // A: Ngân hàng
      timeStr || new Date().toLocaleString('vi-VN'),             // B: Ngày giao dịch
      data.accountNumber || '96247688688',                      // C: Số tài khoản
      data.subAccount || '',                                    // D: Tài khoản phụ
      order.code,                                               // E: Code TT
      data.content || '',                                       // F: Nội dung thanh toán
      data.transferType || 'in',                                // G: Loại
      data.transferAmount || order.amount,                      // H: Số tiền
      data.referenceCode || String(data.id || ''),              // I: Mã tham chiếu
      data.accumulated ? String(data.accumulated) : ''          // J: Lũy kế
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'PAYMENT!A:J',
        majorDimension: 'ROWS',
        values: [row]
      })
    });
    const result = await res.json();
    console.log(`📊 [Google Sheet] Đã ghi đơn ${order.code} vào tab PAYMENT:`, result.updates?.updatedRange || 'OK');

    // Cập nhật trạng thái PAID trên tab ORDERS_MASTER
    try {
      const ordersRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ORDERS_MASTER!A:A`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      const rows = ordersData.values || [];
      const matchIdx = rows.findIndex(r => r[0] && r[0].trim().toUpperCase() === order.code.trim().toUpperCase());
      if (matchIdx >= 0) {
        const rowNum = matchIdx + 1; // 1-based index
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ORDERS_MASTER!H${rowNum}:K${rowNum}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: `ORDERS_MASTER!H${rowNum}:K${rowNum}`,
            majorDimension: 'ROWS',
            values: [['PAID', timeStr || new Date().toLocaleString('vi-VN'), 'SẴN SÀNG', 'SẴN SÀNG']]
          })
        });
        console.log(`✅ [Google Sheet] Đã cập nhật dòng ${rowNum} trên ORDERS_MASTER thành PAID cho đơn ${order.code}!`);
      }
    } catch (e) {
      console.error('Lỗi cập nhật ORDERS_MASTER:', e.message);
    }
  } catch (err) {
    console.error('❌ [Google Sheet Logger Error]:', err.message);
  }
}

const env = {
  DB,
  PRODUCTS: {
    head: async () => ({ size: 1024 }),
    get: async () => ({ body: Buffer.from('OPC AI PROFITLAB - VIP RESOURCE PACKAGE (.ZIP)') })
  },
  STARTER_ASSET_KEY: 'products/starter.zip',
  CHECKOUT_ENABLED: 'true',
  IMPLEMENTATION_ENABLED: 'true',
  PUBLIC_ORIGIN: `http://127.0.0.1:${PORT}`,
  BANK_ACCOUNT: '96247688688',
  BANK_CODE: 'BIDV',
  BANK_ACCOUNT_NAME: 'TRAN NGOC CHUYEN',
  SEPAY_WEBHOOK_API_KEY: 'spsk_live_3BsKdoj9AshiHUMmLAmZGdisdoKLB7JK',
  RATE_LIMIT_SALT: 'test-local-rate-limit-salt-12345678',
  TELEGRAM_BOT_TOKEN: '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk',
  TELEGRAM_CHAT_ID: '-1001812138135',
  TELEGRAM_TOPIC_PAYMENT: 60,
  TELEGRAM_TOPIC_LEADS: 62,
  TELEGRAM_TOPIC_CAL: 64,
  TELEGRAM_TOPIC_SUPPORT: 66,
  TELEGRAM_TOPIC_TEAMWORK: 68,
  LEAD_LOGGER: appendLeadToSheet,
  SHEET_LOGGER: appendPaymentToSheet
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.zip': 'application/zip'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = urlObj.pathname;

  // 1. SIMULATE PAYMENT TESTING ENDPOINT
  if (pathname === '/api/test-pay') {
    const code = urlObj.searchParams.get('code');
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Cần truyền tham số ?code=DHxxxxxx' }));
      return;
    }

    const order = sqlite.prepare('SELECT * FROM orders WHERE code = ?').get(code);
    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Không tìm thấy đơn với mã: ${code}` }));
      return;
    }

    // Call Sepay webhook handler internally
    const webhookPayload = {
      id: Math.floor(Math.random() * 1000000) + 1,
      gateway: 'BIDV',
      accountNumber: '96247688688',
      transferType: 'in',
      transferAmount: order.amount,
      content: `${order.code} chuyen tien thanh toan`,
      code: order.code
    };

    const simReq = new Request(`http://127.0.0.1:${PORT}/api/sepay`, {
      method: 'POST',
      headers: {
        'Authorization': `Apikey ${env.SEPAY_WEBHOOK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const simRes = await handle(simReq, env);
    const simData = await simRes.json();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: `Đã giả lập SePay chuyển thành công ${order.amount.toLocaleString('vi-VN')}đ cho đơn ${order.code}!`,
      orderCode: order.code,
      result: simData
    }));
    return;
  }

  // 2. API ENDPOINTS -> server/payment.js
  if (pathname.startsWith('/api/')) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks);

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
      if (!headers.has('Origin')) {
        headers.set('Origin', `http://127.0.0.1:${PORT}`);
      }

      const webReq = new Request(urlObj.href, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : rawBody
      });

      const webRes = await handle(webReq, env);

      const resHeaders = {};
      webRes.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          resHeaders['Set-Cookie'] = val;
        } else {
          resHeaders[key] = val;
        }
      });

      res.writeHead(webRes.status, resHeaders);
      const arrayBuffer = await webRes.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
      return;
    } catch (err) {
      console.error('Server API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // 3. STATIC FILES SERVING (CLEAN URLS)
  let cleanPath = pathname;
  if (cleanPath.endsWith('/')) cleanPath += 'index.html';

  let filePath = path.join(PUBLIC_DIR, cleanPath);

  // If request doesn't have extension, check if corresponding .html exists
  if (!path.extname(filePath)) {
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 — Không tìm thấy trang</h1><p><a href="/checkout">Đến trang checkout</a></p>');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 OPC AI PROFITLAB FULL DEV SERVER ĐANG CHẠY!`);
  console.log(`👉 Checkout Starter:        http://127.0.0.1:${PORT}/checkout?sku=starter`);
  console.log(`👉 Checkout Coaching 1:1:   http://127.0.0.1:${PORT}/checkout?sku=implementation`);
  console.log(`👉 Giả lập thanh toán test: http://127.0.0.1:${PORT}/api/test-pay?code=DHxxxxxx`);
  console.log(`======================================================\n`);
});
