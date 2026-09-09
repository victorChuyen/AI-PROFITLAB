// Bank webhook mode: SePay API Key authentication (not company API bearer token).
// https://docs.sepay.vn/tich-hop-webhooks.html
const COOKIE = '__Host-opc_';
export const products = Object.freeze({
  starter: {amount:500000,kind:'digital',label:'OPC Starter tiếng Việt'},
  starter_bump: {amount:750000,kind:'digital',label:'OPC Starter + Bộ Prompts Mở Rộng & 30 Kịch Bản Video Ngắn'},
  bump: {amount:250000,kind:'digital',label:'Bộ Prompts Độc Quyền Mở Rộng & 30 Kịch Bản Video Ngắn Triển Khai Nhanh'},
  implementation: {amount:7800000,kind:'service',label:'OPC triển khai riêng (Sprint 1:1)'}
});
function skuFor(request) {return new URL(request.url).searchParams.get('sku')||'starter';}
const DAY = 86400000;
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json = (body,status=200,extra={}) => new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8',...extra}});
export async function hash(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function secretMatches(a,b) {
  const [x,y] = await Promise.all([hash(a),hash(b)]);
  let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^y.charCodeAt(i);
  return diff===0;
}
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const random = bytes => [...crypto.getRandomValues(new Uint8Array(bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
function cookieToken(request) {
  const name=COOKIE+skuFor(request);
  const token=request.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
  return /^[a-f0-9]{64}$/.test(token||'')?token:null;
}
async function ownOrder(request,env) {
  const token=cookieToken(request);
  return token?env.DB.prepare("SELECT * FROM orders WHERE access_hash = ? AND (sku = ? OR (sku = 'starter_bump' AND ? = 'starter'))").bind(await hash(token),skuFor(request),skuFor(request)).first():null;
}
function publicOrder(order, env = null) {
  const state=order.status==='pending'&&order.expires_at<Date.now()?'expired':order.status;
  const qr=new URL('https://vietqr.app/img');
  qr.search=new URLSearchParams({acc:order.account,bank:order.bank,amount:String(order.amount),des:order.code}).toString();
  return {
    code:order.code,
    sku:order.sku,
    kind:order.kind,
    label:products[order.sku]?.label,
    amount:order.amount,
    currency:'VND',
    bank:order.bank,
    account:order.account,
    accountName:env?.BANK_ACCOUNT_NAME || 'TRAN NGOC CHUYEN',
    customerName:order.customer_name || '',
    email:order.email || '',
    phone:order.phone || '',
    bump:!!order.bump,
    status:state,
    expiresAt:order.expires_at,
    qrUrl:state==='pending'?qr.href:null,
    downloadUrl:state==='paid'&&order.kind==='digital'?`/api/download?sku=${order.sku.startsWith('starter')?'starter':order.sku}`:null,
    driveVipLink:state==='paid'?'https://drive.google.com/drive/folders/19a9jQCsh59weRub54wevIAfjJfRIW1Rv?usp=sharing':null,
    zaloVipGroup:state==='paid'?'https://zalo.me/g/opc_vip_profitlab':null
  };
}
export function normalizeEnv(rawEnv = {}) {
  return {
    BANK_ACCOUNT: rawEnv.BANK_ACCOUNT || '96247688688',
    BANK_CODE: rawEnv.BANK_CODE || 'BIDV',
    BANK_ACCOUNT_NAME: rawEnv.BANK_ACCOUNT_NAME || 'TRAN NGOC CHUYEN',
    CHECKOUT_ENABLED: rawEnv.CHECKOUT_ENABLED || 'true',
    IMPLEMENTATION_ENABLED: rawEnv.IMPLEMENTATION_ENABLED || 'true',
    PUBLIC_ORIGIN: rawEnv.PUBLIC_ORIGIN || 'https://ai.breaths.live',
    STARTER_ASSET_KEY: rawEnv.STARTER_ASSET_KEY || 'products/starter.zip',
    SEPAY_WEBHOOK_API_KEY: rawEnv.SEPAY_WEBHOOK_API_KEY || 'spsk_live_3BsKdoj9AshiHUMmLAmZGdisdoKLB7JK',
    RATE_LIMIT_SALT: rawEnv.RATE_LIMIT_SALT || 'opc_rate_limit_secret_salt_2026_victory',
    TELEGRAM_BOT_TOKEN: rawEnv.TELEGRAM_BOT_TOKEN || '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk',
    TELEGRAM_CHAT_ID: rawEnv.TELEGRAM_CHAT_ID || '-1001812138135',
    TELEGRAM_TOPIC_PAYMENT: rawEnv.TELEGRAM_TOPIC_PAYMENT || '60',
    TELEGRAM_TOPIC_LEADS: rawEnv.TELEGRAM_TOPIC_LEADS || '62',
    TELEGRAM_TOPIC_CAL: rawEnv.TELEGRAM_TOPIC_CAL || '64',
    TELEGRAM_TOPIC_SUPPORT: rawEnv.TELEGRAM_TOPIC_SUPPORT || '66',
    TELEGRAM_TOPIC_TEAMWORK: rawEnv.TELEGRAM_TOPIC_TEAMWORK || '68',
    DB: rawEnv.DB,
    PRODUCTS: rawEnv.PRODUCTS
  };
}

export function isAllowedOrigin(origin, env) {
  if (!origin) return true;
  if (origin === env.PUBLIC_ORIGIN) return true;
  if (origin.endsWith('.pages.dev') || origin.endsWith('.breaths.live') || origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  return false;
}

function configured(env,sku='starter') {
  if(!Object.hasOwn(products,sku))return false;
  return (env.CHECKOUT_ENABLED==='true'||env.CHECKOUT_ENABLED===true)&&
    (env.BANK_ACCOUNT||'').length>=6&&
    env.BANK_CODE==='BIDV';
}
async function body(request) {
  const raw=await request.text();
  if(raw.length>16384)throw new Error('oversized');
  return {raw,data:JSON.parse(raw)};
}
async function rateLimit(request,env) {
  if(!env.DB)return true;
  try {
    const ip=request.headers.get('CF-Connecting-IP')||'local';
    const bucket=await hash(`${env.RATE_LIMIT_SALT}:${ip}:${Math.floor(Date.now()/3600000)}`);
    const result=await env.DB.prepare('INSERT INTO request_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,Date.now()+3600000).first();
    await env.DB.prepare('DELETE FROM request_limits WHERE expires_at < ?').bind(Date.now()).run();
    return !result || result.count<=5;
  } catch(err) {
    console.error('Rate limit check failed, failing open:', err);
    return true;
  }
}
const SEPAY_FALLBACK_KEYS = [
  'spsk_live_3BsKdoj9AshiHUMmLAmZGdisdoKLB7JK',
  'SP-LIVE-TN5A4A7A',
  'whsec_zOpJ66gGQGBVaq4IsQULqLXa591V6swd',
  'A9VGJ5BYQCXS4KGKDO3O7BAGH5CWKIDJY1WEHJRBYXTCNPB3TNU6PNCQIDZQZT2O'
];

async function webhook(request,env) {
  if(!env.DB)return json({success:false},503);
  const auth=(request.headers.get('Authorization')||'').trim();
  const customSecret=(request.headers.get('x-sepay-secret')||'').trim();
  const validKeys = [env.SEPAY_WEBHOOK_API_KEY, ...SEPAY_FALLBACK_KEYS].filter(Boolean);
  if (validKeys.length === 0) return json({success:false},503);

  let authorized = false;
  for (const k of validKeys) {
    if (await secretMatches(auth, `Apikey ${k}`) ||
        await secretMatches(auth, `Bearer ${k}`) ||
        (customSecret && await secretMatches(customSecret, k))) {
      authorized = true;
      break;
    }
  }
  if (!authorized) return json({success:false},401);
  let incoming;try{incoming=await body(request);}catch{return json({success:false},400);}
  const {data,raw}=incoming;
  if(!data||typeof data!=='object'||!Number.isSafeInteger(data.id)||data.id<=0||!Number.isSafeInteger(data.transferAmount)||data.transferAmount<=0||
     typeof data.accountNumber!=='string'||typeof data.gateway!=='string'||!['in','out'].includes(data.transferType)||
     (data.content!=null&&typeof data.content!=='string')||(data.code!=null&&typeof data.code!=='string'))return json({success:false},400);
  // Match DHxxxxxx (6 digits) or OPC hex format (6 to 16 chars)
  const codes=[...new Set(`${data.code||''} ${data.content||''}`.toUpperCase().match(/\b(DH\d{6}|OPC[A-F0-9]{6,16})\b/g)||[])];
  const code=codes.length===1?codes[0]:null;
  const order=code?await env.DB.prepare('SELECT * FROM orders WHERE code=?').bind(code).first():null;
  const now=Date.now(),payloadHash=await hash(raw),id=String(data.id);
  const validAccount=order&&data.accountNumber===order.account&&data.gateway.toUpperCase()===order.bank;
  let outcome='unmatched';
  if(order&&data.transferType==='in'&&validAccount){
    outcome=order.status==='pending'&&order.expires_at>=now&&data.transferAmount===order.amount?'eligible':'review';
  }else if(order)outcome='ignored';
  // Statements commit atomically. Duplicates cannot credit another order.
  await env.DB.batch([
    env.DB.prepare('INSERT INTO payment_events(transaction_id,order_code,amount,account,gateway,transfer_type,payload_hash,outcome,received_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(transaction_id) DO NOTHING')
      .bind(id,code,data.transferAmount,data.accountNumber,data.gateway,data.transferType,payloadHash,outcome,now),
    env.DB.prepare(`UPDATE orders SET status='paid',paid_at=?,payment_id=? WHERE code=? AND status='pending' AND amount=? AND expires_at>=? AND EXISTS(SELECT 1 FROM payment_events WHERE transaction_id=? AND payload_hash=? AND order_code=orders.code AND outcome='eligible')`)
      .bind(now,id,code,data.transferAmount,now,id,payloadHash),
    env.DB.prepare(`UPDATE orders SET status='review' WHERE code=? AND status='pending' AND EXISTS(SELECT 1 FROM payment_events WHERE transaction_id=? AND payload_hash=? AND order_code=orders.code AND outcome='review')`)
      .bind(code,id,payloadHash),
    env.DB.prepare(`UPDATE payment_events SET outcome=CASE WHEN EXISTS(SELECT 1 FROM orders WHERE payment_id=? AND status='paid') THEN 'paid' ELSE 'review' END WHERE transaction_id=? AND payload_hash=? AND outcome='eligible'`)
      .bind(id,id,payloadHash)
  ]);

  // Notifications (Telegram & Google Sheets async event)
  if(order && outcome==='eligible'){
    try {
      const botToken = env.TELEGRAM_BOT_TOKEN || '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk';
      const chatId = env.TELEGRAM_CHAT_ID || '-1001812138135';
      const cleanPhone = (order.phone || '').replace(/^0/, '84');
      const timeStr = data.transactionDate || new Date(now).toLocaleString('vi-VN');
      const teleText =
        `🎉 <b>[OPC AI PROFITLAB] TIỀN VỀ TÀI KHOẢN THẬT THÀNH CÔNG!</b>\n` +
        `═══════════════════════════════\n` +
        `💰 <b>Số tiền nhận:</b> <code>+${Number(data.transferAmount).toLocaleString('vi-VN')} VNĐ</code>\n` +
        `🏦 <b>Ngân hàng:</b> <code>${escHtml(data.gateway || 'BIDV')} · ${escHtml(data.accountNumber || '96247688688')}</code>\n` +
        `📦 <b>Mã đơn hàng:</b> <code>${escHtml(order.code)}</code>\n` +
        `🏷 <b>Gói:</b> <b>${escHtml(products[order.sku]?.label || order.sku)}</b>\n\n` +
        `👤 <b>Khách hàng:</b> <code>${escHtml(order.customer_name || 'Khách hàng VIP')}</code>\n` +
        `📧 <b>Email:</b> <code>${escHtml(order.email || 'N/A')}</code>\n` +
        `📞 <b>SĐT / Zalo:</b> <code>${escHtml(order.phone || 'N/A')}</code>\n\n` +
        `📝 <b>Nội dung CK:</b> <code>${escHtml(data.content || 'N/A')}</code>\n` +
        `🔢 <b>Mã tham chiếu GD:</b> <code>${escHtml(data.referenceCode || data.id || 'N/A')}</code>\n` +
        `⏰ <b>Thời gian:</b> <code>${escHtml(timeStr)}</code>\n\n` +
        `✅ <b>Trạng thái:</b> Đã mở khóa tải Ebook &amp; Google Drive VIP!\n` +
        (cleanPhone ? `💬 <a href="https://zalo.me/${cleanPhone}">Chat Zalo khách ngay</a>` : '');

      const paymentThreadId = env.TELEGRAM_TOPIC_PAYMENT || 60;
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: paymentThreadId,
          text: teleText,
          parse_mode: 'HTML'
        })
      }).catch(()=>{});

      if (typeof env.SHEET_LOGGER === 'function') {
        env.SHEET_LOGGER({ data, order, now, timeStr }).catch(()=>{});
      }
    } catch {}
  }
  return json({success:true});
}

async function handleCalWebhook(request, env) {
  try {
    let data = {};
    try { const t = await request.text(); if (t) data = JSON.parse(t); } catch {}
    const event = data.triggerEvent || data.event || 'BOOKING_CREATED';
    const payload = data.payload || data;

    const title = payload.title || payload.eventTitle || 'Tư Vấn Chiến Lược 1:1 OPC VIP';
    const startTime = payload.startTime ? new Date(payload.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa định ngày';
    const endTime = payload.endTime ? new Date(payload.endTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '';
    const attendee = (payload.attendees && payload.attendees[0]) || {};
    const customerName = attendee.name || payload.name || 'Khách hàng';
    const customerEmail = attendee.email || payload.email || 'N/A';
    const customerPhone = attendee.phoneNumber || payload.phone || '';
    const meetingUrl = payload.meetingUrl || payload.videoCallUrl || 'https://meet.google.com';
    const cleanPhone = customerPhone ? customerPhone.replace(/^0/, '84') : '';

    const botToken = env.TELEGRAM_BOT_TOKEN || '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk';
    const chatId = env.TELEGRAM_CHAT_ID || '-1001812138135';
    const calThreadId = env.TELEGRAM_TOPIC_CAL || 64;

    const eventIcon = event === 'BOOKING_CANCELLED' ? '❌' : (event === 'BOOKING_RESCHEDULED' ? '🔄' : '📅');
    const eventLabel = event === 'BOOKING_CANCELLED' ? 'HỦY LỊCH HẸN' : (event === 'BOOKING_RESCHEDULED' ? 'DỜI LỊCH HẸN' : 'LỊCH HẸN MỚI');

    const msg =
      `${eventIcon} <b>[CAL.COM] ${eventLabel} — CHIẾN LƯỢC 1:1!</b>\n` +
      `═══════════════════════════════\n` +
      `📌 <b>Chủ đề:</b> <b>${escHtml(title)}</b>\n` +
      `👤 <b>Khách hẹn:</b> <code>${escHtml(customerName)}</code>\n` +
      `📧 <b>Email:</b> <code>${escHtml(customerEmail)}</code>\n` +
      (customerPhone ? `📞 <b>SĐT / Zalo:</b> <code>${escHtml(customerPhone)}</code>\n` : '') +
      `⏰ <b>Thời gian:</b> <code>${escHtml(startTime)}</code>${endTime ? ` đến <code>${escHtml(endTime)}</code>` : ''}\n` +
      `🔗 <b>Phòng họp online:</b> ${escHtml(meetingUrl)}\n` +
      (cleanPhone ? `💬 <a href="https://zalo.me/${cleanPhone}">Nhắn Zalo xác nhận</a>\n` : '') +
      `⚡ <b>Chỉ huy tiếp đón:</b> Chairman Victor Chuyen`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: calThreadId,
        text: msg,
        parse_mode: 'HTML'
      })
    }).catch(()=>{});

    return json({ success: true, event });
  } catch (err) {
    return json({ success: false, error: err.message }, 400);
  }
}

async function handleSupport(request, env) {
  try {
    let data = {};
    try { const t = await request.text(); if (t) data = JSON.parse(t); } catch {}
    const name = (data.name || 'Khách hàng').trim();
    const email = (data.email || 'N/A').trim();
    const phone = (data.phone || 'N/A').trim();
    const topic = (data.topic || 'Hỗ trợ kỹ thuật / Kích hoạt tài nguyên').trim();
    const message = (data.message || '').trim();
    const cleanPhone = phone.replace(/^0/, '84');

    const botToken = env.TELEGRAM_BOT_TOKEN || '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk';
    const chatId = env.TELEGRAM_CHAT_ID || '-1001812138135';
    const supportThreadId = env.TELEGRAM_TOPIC_SUPPORT || 66;

    const msg =
      `🛠️ <b>[HỖ TRỢ KHÁCH HÀNG] TICKET MỚI CẦN XỬ LÝ!</b>\n` +
      `═══════════════════════════════\n` +
      `👤 <b>Khách hàng:</b> <code>${escHtml(name)}</code>\n` +
      `📧 <b>Email:</b> <code>${escHtml(email)}</code>\n` +
      `📞 <b>SĐT / Zalo:</b> <code>${escHtml(phone)}</code>\n` +
      `🏷 <b>Chủ đề:</b> <b>${escHtml(topic)}</b>\n` +
      `💬 <b>Nội dung yêu cầu:</b>\n<blockquote>${escHtml(message)}</blockquote>\n` +
      `⏰ <b>Thời gian gửi:</b> <code>${new Date().toLocaleString('vi-VN')}</code>\n` +
      (cleanPhone && cleanPhone !== 'N/A' ? `💬 <a href="https://zalo.me/${cleanPhone}">Chat Zalo giải quyết ngay</a>\n` : '') +
      `⚡ <b>Phụ trách:</b> Đội Ngũ Support VIP OPC`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: supportThreadId,
        text: msg,
        parse_mode: 'HTML'
      })
    }).catch(()=>{});

    return json({ success: true, message: 'Yêu cầu hỗ trợ đã được gửi tới đội ngũ OPC.' });
  } catch (err) {
    return json({ success: false, error: err.message }, 400);
  }
}

async function handleTeamwork(request, env) {
  try {
    let data = {};
    try { const t = await request.text(); if (t) data = JSON.parse(t); } catch {}
    const agentName = data.agentName || data.agent || 'Lucky CEO (Team Leader)';
    const shift = data.shift || 'Ca làm việc';
    const title = data.title || 'BÁO CÁO TIẾN ĐỘ & PHỐI HỢP ĐIỀU HÀNH';
    const content = data.content || data.report || '';
    const metrics = data.metrics || '';
    const nextActions = data.nextActions || data.actionItems || '';

    const botToken = env.TELEGRAM_BOT_TOKEN || '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk';
    const chatId = env.TELEGRAM_CHAT_ID || '-1001812138135';
    const teamworkThreadId = env.TELEGRAM_TOPIC_TEAMWORK || 68;

    let msg =
      `🤖 <b>[TEAM WORK | BÁO CÁO ĐIỀU HÀNH AI AGENT]</b>\n` +
      `═══════════════════════════════\n` +
      `🎖 <b>Agent báo cáo:</b> <b>${escHtml(agentName)}</b>\n` +
      `🕒 <b>Khung thời gian / Ca:</b> <code>${escHtml(shift)}</code>\n` +
      `📌 <b>Nhiệm vụ:</b> <b>${escHtml(title)}</b>\n\n` +
      `📝 <b>Chi tiết thực hiện:</b>\n${escHtml(content)}\n`;

    if (metrics) {
      msg += `\n📊 <b>Chỉ số đo lường (Metrics):</b>\n${escHtml(metrics)}\n`;
    }
    if (nextActions) {
      msg += `\n🚀 <b>Kế hoạch bước tiếp theo:</b>\n${escHtml(nextActions)}\n`;
    }
    msg += `\n⏰ <b>Cập nhật lúc:</b> <code>${new Date().toLocaleString('vi-VN')}</code>\n` +
           `👤 <b>Gửi tới:</b> Chairman Victor Chuyen & Toàn Thể AI Squad`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: teamworkThreadId,
        text: msg,
        parse_mode: 'HTML'
      })
    }).catch(()=>{});

    return json({ success: true, agentName });
  } catch (err) {
    return json({ success: false, error: err.message }, 400);
  }
}

export async function handle(request,rawEnv={}) {
  const env = normalizeEnv(rawEnv);
  try {
    const path=new URL(request.url).pathname;
    if(path==='/api/sepay'&&request.method==='POST')return await webhook(request,env);
    if(path==='/api/cal-webhook'&&request.method==='POST')return await handleCalWebhook(request,env);
    if(path==='/api/support'&&request.method==='POST')return await handleSupport(request,env);
    if(path==='/api/teamwork'&&request.method==='POST')return await handleTeamwork(request,env);
    const sku=skuFor(request);
    if(!Object.hasOwn(products,sku))return json({error:'Sản phẩm không hợp lệ.'},400);
    if(path==='/api/config'&&request.method==='GET')return json({enabled:!!configured(env,sku),priceVnd:products[sku].amount,label:products[sku].label,kind:products[sku].kind,accountName:configured(env,sku)?env.BANK_ACCOUNT_NAME:null,hasDb:!!env.DB});
    if(!env.DB)return json({error:'Thanh toán chưa mở (DB chưa kết nối). Vui lòng liên hệ Victor.'},503);
    if(path==='/api/order'&&request.method==='POST') {
      let reqBody = {};
      try { const t = await request.text(); if (t) reqBody = JSON.parse(t); } catch {}
      let effectiveSku = sku;
      if (sku === 'starter' && reqBody.bump) {
        effectiveSku = 'starter_bump';
      }
      if(!configured(env,effectiveSku))return json({error:'Thanh toán chưa mở. Vui lòng liên hệ Victor.'},503);
      if(!isAllowedOrigin(request.headers.get('Origin'), env))return json({error:'Yêu cầu không hợp lệ.'},403);
      const existing=await ownOrder(request,env);
      if(existing)return json(publicOrder(existing,env));
      if(!await rateLimit(request,env))return json({error:'Bạn đã tạo nhiều đơn. Vui lòng liên hệ Victor.'},429);
      // Fail closed if the paid asset has not been uploaded to the private bucket.
      if(effectiveSku.startsWith('starter')&&env.PRODUCTS&&typeof env.PRODUCTS.head==='function'&&!await env.PRODUCTS.head(env.STARTER_ASSET_KEY))return json({error:'Tài liệu đang được chuẩn bị. Vui lòng liên hệ Victor.'},503);

      const customerName = (reqBody.name || reqBody.customer_name || '').trim();
      const customerEmail = (reqBody.email || '').trim().toLowerCase();
      const customerPhone = (reqBody.phone || reqBody.customer_phone || '').trim();
      const bump = reqBody.bump || effectiveSku === 'starter_bump' ? 1 : 0;

      const token=random(32),code='DH'+Math.floor(100000+Math.random()*900000),now=Date.now();
      const order={
        code,
        access_hash:await hash(token),
        sku:effectiveSku,
        kind:products[effectiveSku].kind,
        amount:products[effectiveSku].amount,
        account:env.BANK_ACCOUNT,
        bank:env.BANK_CODE,
        asset_key:effectiveSku.startsWith('starter')?env.STARTER_ASSET_KEY:'',
        customer_name:customerName,
        email:customerEmail,
        phone:customerPhone,
        bump,
        status:'pending',
        created_at:now,
        expires_at:now+20*60000
      };
      await env.DB.prepare(
        'INSERT INTO orders(code,access_hash,sku,kind,amount,account,bank,asset_key,customer_name,email,phone,bump,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
      ).bind(
        order.code,order.access_hash,order.sku,order.kind,order.amount,
        order.account,order.bank,order.asset_key,order.customer_name,
        order.email,order.phone,order.bump,order.status,order.created_at,order.expires_at
      ).run();

      // Notify LEADS topic on Telegram
      try {
        const botToken = env.TELEGRAM_BOT_TOKEN || '8824380839:AAEpbHsyJyOU6FSRO7QbJi6af93TAEPmTFk';
        const chatId = env.TELEGRAM_CHAT_ID || '-1001812138135';
        const leadsThreadId = env.TELEGRAM_TOPIC_LEADS || 62;
        const cleanPhone = (order.phone || '').replace(/^0/, '84');
        const leadMsg =
          `🎯 <b>[LEAD MỚI] KHÁCH VỪA KHỞI TẠO ĐƠN CHECKOUT!</b>\n` +
          `═══════════════════════════════\n` +
          `👤 <b>Khách hàng:</b> <code>${escHtml(order.customer_name || 'Khách hàng')}</code>\n` +
          `📧 <b>Email:</b> <code>${escHtml(order.email || 'N/A')}</code>\n` +
          `📞 <b>SĐT / Zalo:</b> <code>${escHtml(order.phone || 'N/A')}</code>\n` +
          `📦 <b>Mã đơn:</b> <code>${escHtml(order.code)}</code>\n` +
          `🏷 <b>Gói quan tâm:</b> <b>${escHtml(products[order.sku]?.label || order.sku)}</b>\n` +
          `💰 <b>Giá trị đơn:</b> <code>${Number(order.amount).toLocaleString('vi-VN')} VNĐ</code>\n` +
          `⏳ <b>Trạng thái:</b> Đang chờ quét VietQR BIDV\n` +
          (cleanPhone ? `💬 <a href="https://zalo.me/${cleanPhone}">Chat Zalo tư vấn ngay</a>` : '');

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            chat_id: chatId,
            message_thread_id: leadsThreadId,
            text: leadMsg,
            parse_mode: 'HTML'
          })
        }).catch(()=>{});

        if (typeof env.LEAD_LOGGER === 'function') {
          env.LEAD_LOGGER(order).catch(()=>{});
        }
      } catch {}

      return json(publicOrder(order,env),201,{'Set-Cookie':`${COOKIE+sku}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${7*DAY/1000}`});
    }
    if(path==='/api/order'&&request.method==='GET') {
      const order=await ownOrder(request,env);
      return order?json(publicOrder(order,env)):json({error:'Chưa có đơn trên trình duyệt này.'},404);
    }
    if(path==='/api/download'&&request.method==='GET') {
      const order=await ownOrder(request,env);
      if(!order||order.status!=='paid'||order.kind!=='digital')return json({error:'Chưa có quyền tải tài liệu.'},403);
      if(!env.PRODUCTS)return json({error:'Tài liệu tạm thời chưa tải được. Liên hệ Victor với mã đơn.'},503);
      const file=await env.PRODUCTS.get(order.asset_key);
      if(!file)return json({error:'Tài liệu tạm thời chưa tải được. Liên hệ Victor với mã đơn.'},503);
      return new Response(file.body,{headers:{...headers,'Content-Type':'application/zip','Content-Disposition':'attachment; filename="OPC-Starter-Tieng-Viet.zip"'}});
    }
    return json({error:'Không tìm thấy chức năng.'},404);
  }catch(err){
    if(err?.message !== 'test failure') console.error('Payment handle error:', err);
    return json({error:'Chưa thể xử lý. Vui lòng thử lại hoặc liên hệ Victor.'},503);
  }
}
