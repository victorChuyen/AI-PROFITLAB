'use strict';

let currentSku = new URLSearchParams(location.search).get('sku') || 'starter';
if (!['starter', 'implementation'].includes(currentSku)) currentSku = 'starter';

const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

let poll = null, attempts = 0, busy = false;
let basePrice = currentSku === 'implementation' ? 7800000 : 500000;
const bumpPrice = 250000;
let currentOrder = null;

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store'
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Thanh toán online chưa mở trên địa chỉ này. Vui lòng liên hệ Victor (0989 890 022).');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Chưa thể kiểm tra. Vui lòng thử lại.');
  return data;
}

function copyToClipboard(text, btnElement) {
  const originalText = btnElement.textContent;
  const setCopied = () => {
    btnElement.textContent = '✅ Đã chép!';
    btnElement.classList.add('copied');
    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.classList.remove('copied');
    }, 2000);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(setCopied).catch(() => fallbackCopy(text, setCopied));
  } else {
    fallbackCopy(text, setCopied);
  }
}

function fallbackCopy(text, onSuccess) {
  try {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    onSuccess();
  } catch {}
}

let countdownInterval = null;
function startReservationTimer(durationSeconds) {
  if (countdownInterval) clearInterval(countdownInterval);
  const timerBox = $('payment-countdown-box');
  const timerEl = $('payment-timer');
  if (!timerBox || !timerEl) return;
  timerBox.hidden = false;

  let remaining = durationSeconds;
  const tick = () => {
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      timerEl.textContent = '00:00';
      return;
    }
    const m = Math.floor(remaining / 60).toString().padStart(2, '0');
    const s = (remaining % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
    remaining--;
  };
  tick();
  countdownInterval = setInterval(tick, 1000);
}

function render(order) {
  currentOrder = order;
  $('manual-checkout').hidden = true;
  $('checkout-consent').hidden = true;
  $('bank-order').hidden = false;

  $('order-code').textContent = order.code;
  $('order-amount').textContent = money(order.amount);
  $('order-bank').textContent = `${order.bank} · ${order.account}`;
  if (order.accountName) $('account-name').textContent = order.accountName;

  // Copy button listeners
  $('copy-code-btn').onclick = () => copyToClipboard(order.code, $('copy-code-btn'));
  $('copy-amount-btn').onclick = () => copyToClipboard(String(order.amount), $('copy-amount-btn'));
  $('copy-acc-btn').onclick = () => copyToClipboard(order.account, $('copy-acc-btn'));

  const isExpired = order.status === 'expired' || order.status === 'cancelled';
  const isPaid = order.status === 'paid';
  const isPending = order.status === 'pending';

  const labels = {
    pending: 'Đang chờ bạn hoàn tất thanh toán',
    paid: 'Đã xác nhận thanh toán thành công 🎉',
    expired: 'Mã thanh toán đã hết thời gian chờ',
    review: 'Giao dịch đang được đối soát thủ công',
    refunded: 'Đơn đã hoàn tiền',
    cancelled: 'Đơn đã hủy'
  };
  $('order-state').textContent = labels[order.status] || 'Liên hệ hỗ trợ';

  // Bank QR visibility
  $('bank-qr').hidden = !order.qrUrl || isPaid || isExpired;
  if (order.qrUrl && isPending) {
    $('bank-qr').src = order.qrUrl;
  }

  // Handle Expired State (No dead-end!)
  if (isExpired) {
    if ($('payment-countdown-box')) $('payment-countdown-box').hidden = true;
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    $('order-notice-box').hidden = false;
    $('order-notice-box').innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; color: #fca5a5; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; line-height: 1.5;">
        ⚠️ <b>Mã đơn ${order.code} đã hết hạn thời gian giữ chỗ (20 phút).</b><br>
        Vui lòng bấm nút <b>"Tạo mã thanh toán mới"</b> bên dưới để nhận mã đơn mới.
      </div>
    `;
    $('order-instructions').textContent = 'Mã chuyển khoản trước đó đã hết hạn để đảm bảo an toàn giao dịch.';
    $('btn-renew-order').hidden = false;
    $('check-payment').hidden = true;
    if (poll) { clearInterval(poll); poll = null; }
    return;
  }

  $('order-notice-box').hidden = true;
  $('btn-renew-order').hidden = true;

  if (isPaid) {
    // Show Instant Success Card and hide payment details
    if ($('payment-countdown-box')) $('payment-countdown-box').hidden = true;
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    $('payment-success-card').hidden = false;
    $('order-actions').hidden = true;
    if ($('qr-payment-wrapper')) $('qr-payment-wrapper').hidden = true;
    $('order-state').hidden = true;
    $('order-instructions').hidden = true;
    if ($('success-cust-name')) $('success-cust-name').textContent = order.customerName || 'bạn';
    if ($('success-cust-email')) $('success-cust-email').textContent = order.email || 'hộp thư của bạn';

    if (order.downloadUrl) {
      $('download-product').hidden = false;
      $('download-product').href = order.downloadUrl;
    } else {
      $('download-product').hidden = true;
    }
    if (order.driveVipLink) $('drive-vip-link').href = order.driveVipLink;
    if (order.zaloVipGroup) $('zalo-vip-link').href = order.zaloVipGroup;

    if (poll) { clearInterval(poll); poll = null; }
  } else {
    // Pending State
    startReservationTimer(20 * 60);
    $('payment-success-card').hidden = true;
    $('order-actions').hidden = false;
    if ($('qr-payment-wrapper')) $('qr-payment-wrapper').hidden = false;
    $('order-state').hidden = false;
    $('order-instructions').hidden = false;
    $('check-payment').hidden = false;
    $('order-instructions').textContent = `Chuyển đúng số tiền ${money(order.amount)} và giữ nguyên nội dung ${order.code}. Chúng tôi sẽ xác nhận đơn ngay khi giao dịch được ghi nhận.`;

    // Realtime polling every 3s
    if (!poll) {
      poll = setInterval(() => {
        if (++attempts > 120) { // 6 minutes max
          clearInterval(poll);
          poll = null;
          return;
        }
        check();
      }, 3000);
    }
  }

  $('checkout-message').textContent = '';
}

async function check() {
  if (busy) return;
  busy = true;
  try {
    const data = await api(`/api/order?sku=${encodeURIComponent(currentSku)}`);
    render(data);
  } catch (e) {
    $('checkout-message').textContent = e.message;
  } finally {
    busy = false;
  }
}

$('check-payment').addEventListener('click', check);
$('bank-qr').addEventListener('error', () => { $('qr-error').hidden = false; });

// Renew / Edit Order Handlers
function reopenFormWithPrefill() {
  if (currentOrder) {
    if ($('cust-name') && currentOrder.customerName) $('cust-name').value = currentOrder.customerName;
    if ($('cust-email') && currentOrder.email) $('cust-email').value = currentOrder.email;
    if ($('cust-phone') && currentOrder.phone) $('cust-phone').value = currentOrder.phone;
    if ($('bump-addon') && currentSku === 'starter') $('bump-addon').checked = !!currentOrder.bump;
    updateTotal();
  }
  $('bank-order').hidden = true;
  $('checkout-consent').hidden = false;
  $('checkout-message').textContent = 'Vui lòng kiểm tra lại thông tin và bấm Tạo mã thanh toán để nhận mã mới.';
  if (poll) { clearInterval(poll); poll = null; }
}

$('btn-renew-order').addEventListener('click', reopenFormWithPrefill);
$('btn-edit-order').addEventListener('click', reopenFormWithPrefill);

// Calculate total with Order Bump
function updateTotal() {
  const isBump = $('bump-addon')?.checked && currentSku === 'starter';
  const currentTotal = isBump ? (basePrice + bumpPrice) : basePrice;
  $('summary-total-price').textContent = money(currentTotal);
  $('summary-bump-row').hidden = !isBump;
}

if ($('bump-addon')) {
  $('bump-addon').addEventListener('change', updateTotal);
}

// Create Order Handler
$('create-order').addEventListener('click', async () => {
  const nameInput = $('cust-name');
  const emailInput = $('cust-email');
  const phoneInput = $('cust-phone');
  const confirmBox = $('confirm-purchase');

  const name = (nameInput.value || '').trim();
  const email = (emailInput.value || '').trim();
  const phone = (phoneInput.value || '').trim();

  // Validate form
  if (!name) {
    $('checkout-message').textContent = '⚠️ Vui lòng nhập họ và tên của bạn.';
    nameInput.focus();
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('checkout-message').textContent = '⚠️ Vui lòng nhập email hợp lệ để nhận hướng dẫn truy cập tài liệu.';
    emailInput.focus();
    return;
  }
  if (!phone || phone.replace(/\D/g, '').length < 9) {
    $('checkout-message').textContent = '⚠️ Vui lòng nhập số điện thoại / Zalo để nhận hỗ trợ 1:1.';
    phoneInput.focus();
    return;
  }
  if (!confirmBox.checked) {
    $('checkout-message').textContent = '⚠️ Vui lòng đánh dấu xác nhận điều khoản mua hàng trước khi tiếp tục.';
    confirmBox.focus();
    return;
  }

  const isBump = $('bump-addon')?.checked && currentSku === 'starter';
  $('create-order').disabled = true;
  $('checkout-message').textContent = 'Đang tạo mã thanh toán an toàn…';

  try {
    const orderData = await api(`/api/order?sku=${encodeURIComponent(currentSku)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        bump: isBump
      })
    });
    render(orderData);
  } catch (e) {
    $('checkout-message').textContent = e.message;
  } finally {
    $('create-order').disabled = false;
  }
});

// Package Switcher Handler
function switchSku(newSku) {
  if (newSku === currentSku) return;
  currentSku = newSku;
  const newUrl = new URL(window.location);
  newUrl.searchParams.set('sku', currentSku);
  window.history.pushState({}, '', newUrl);
  initSku();
}

function showManualCheckout() {
  const isImplementation = currentSku === 'implementation';
  const label = isImplementation ? 'gói triển khai riêng' : 'Bộ Starter';
  const price = isImplementation ? '7.800.000đ' : '500.000đ';

  $('checkout-consent').hidden = true;
  $('bank-order').hidden = true;
  $('manual-checkout').hidden = false;
  $('manual-checkout-title').textContent = `Đặt ${label} cùng Victor qua Zalo`;
  $('manual-checkout-copy').textContent = isImplementation
    ? 'Gói triển khai riêng cần thống nhất phạm vi, đầu ra và lịch thực hiện trước khi thanh toán. Nhắn Victor để nhận tư vấn phù hợp.'
    : 'Bạn vẫn có thể đặt mua ngay; Victor sẽ xác nhận đơn, gửi hướng dẫn thanh toán và bàn giao tài liệu.';
  $('manual-checkout-cta').textContent = isImplementation
    ? `Nhắn Victor để trao đổi gói triển khai — ${price}`
    : `Nhắn Victor để đặt Starter — ${price}`;
}

$('tab-starter').addEventListener('click', () => switchSku('starter'));
$('tab-implementation').addEventListener('click', () => switchSku('implementation'));

// Initialization for current SKU
async function initSku() {
  if (poll) { clearInterval(poll); poll = null; }
  attempts = 0;

  // Update tabs UI
  $('tab-starter').classList.toggle('active', currentSku === 'starter');
  $('tab-implementation').classList.toggle('active', currentSku === 'implementation');

  const fallback = {
    starter: ['OPC Starter tiếng Việt (Cẩm nang 45 trang)', 500000],
    implementation: ['OPC triển khai riêng Done-For-You (Sprint 1:1)', 7800000]
  }[currentSku];

  $('checkout-label').textContent = fallback[0];
  basePrice = fallback[1];
  $('checkout-price').textContent = money(basePrice);
  $('summary-pkg-name').textContent = fallback[0];
  $('summary-main-price').textContent = money(basePrice);
  $('summary-total-price').textContent = money(basePrice);

  // Show Order Bump only for Starter Pack
  $('order-bump-card').hidden = currentSku !== 'starter';
  $('service-warning').hidden = currentSku !== 'implementation';
  $('manual-checkout').hidden = true;

  try {
    const cfg = await api(`/api/config?sku=${encodeURIComponent(currentSku)}`);
    basePrice = cfg.priceVnd || basePrice;
    $('checkout-price').textContent = money(basePrice);
    $('summary-main-price').textContent = money(basePrice);
    updateTotal();

    if (cfg.accountName) $('account-name').textContent = cfg.accountName;

    // Existing orders check for this SKU
    try {
      const existing = await api(`/api/order?sku=${encodeURIComponent(currentSku)}&check=1`);
      if (existing && existing.code) {
        render(existing);
        return;
      }
    } catch {
      /* No existing order, show fresh checkout consent */
    }

    if (!cfg.enabled) {
      $('checkout-message').textContent = 'Bạn vẫn có thể đặt mua với hỗ trợ trực tiếp từ Victor.';
      showManualCheckout();
      return;
    }

    $('bank-order').hidden = true;
    $('checkout-consent').hidden = false;
    $('checkout-message').textContent = 'Điền thông tin để nhận mã thanh toán riêng cho đơn hàng của bạn.';
  } catch (e) {
    $('checkout-message').textContent = e.message;
    showManualCheckout();
  }
}

// Initial Run
initSku();
