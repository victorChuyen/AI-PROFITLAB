'use strict';

/* ══════════════════════════════════════
   OPC AI PROFITLAB — App v4.0
   Scroll Animations, Interactions & CRO
   ══════════════════════════════════════ */

const config = window.OPC_SITE || {};

// ── External checkout URL override ──
if (config.checkoutVerified === true && typeof config.checkoutUrl === 'string') {
  try {
    const url = new URL(config.checkoutUrl);
    if (url.protocol === 'https:') {
      document.querySelectorAll('[data-starter]').forEach(a => {
        a.href = url.href;
        a.textContent = 'Đến trang thanh toán →';
      });
      document.querySelectorAll('[data-purchase-note]').forEach(el => {
        el.textContent = 'Kiểm tra sản phẩm, giá và thông tin nhận tài liệu tại trang thanh toán trước khi xác nhận.';
      });
    }
  } catch { /* Keep the working contact route when configuration is invalid. */ }
}

// ── Live schedule text override ──
if (config.liveScheduleText && document.querySelector('#live-schedule')) {
  document.querySelector('#live-schedule').textContent = config.liveScheduleText;
}


/* ══════════════════════════════════════
   SCROLL REVEAL ANIMATIONS
   ══════════════════════════════════════ */
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    reveals.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}


/* ══════════════════════════════════════
   NUMBER COUNTER ANIMATION
   ══════════════════════════════════════ */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'), 10);
      observer.unobserve(el);

      if (prefersReduced) {
        el.textContent = target;
        return;
      }

      let current = 0;
      const duration = 1200;
      const start = performance.now();

      function animate(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.round(eased * target);
        el.textContent = current;
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}


/* ══════════════════════════════════════
   MOBILE STICKY CTA
   ══════════════════════════════════════ */
function initStickyCTA() {
  const sticky = document.getElementById('sticky-cta');
  if (!sticky) return;

  let lastScroll = 0;
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const show = scrollY > 500;
      sticky.classList.toggle('visible', show);
      lastScroll = scrollY;
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ══════════════════════════════════════
   COPY TO CLIPBOARD (enhanced)
   ══════════════════════════════════════ */
async function copyText(fieldId, statusId) {
  const field = document.getElementById(fieldId);
  const status = document.getElementById(statusId);
  try {
    await navigator.clipboard.writeText(field.value);
    status.textContent = '✅ Đã sao chép. Bạn có thể dán nội dung vào cuộc trò chuyện.';
    // Flash success
    field.style.borderColor = '#22c55e';
    setTimeout(() => { field.style.borderColor = ''; }, 2000);
  } catch {
    field.focus();
    field.select();
    status.textContent = '📋 Nội dung đã được chọn. Dùng lệnh Sao chép trên thiết bị của bạn.';
  }
}


/* ══════════════════════════════════════
   PROMPT GENERATOR
   ══════════════════════════════════════ */
document.querySelector('#make-prompt')?.addEventListener('click', () => {
  const input = document.querySelector('#idea');
  const value = input.value.trim();

  if (!value) {
    document.querySelector('#prompt-status').textContent =
      '⚠️ Hãy nhập nhóm khách hàng và vấn đề bạn muốn giải quyết.';
    input.focus();
    return;
  }

  document.querySelector('#prompt-result').value =
    `Hãy giúp tôi kiểm chứng ý tưởng sau: ${value}\n\n` +
    `1. Hỏi tôi những bối cảnh còn thiếu.\n` +
    `2. Nêu một nhóm khách hàng cụ thể và vấn đề cần kiểm chứng.\n` +
    `3. Đề xuất 5 câu hỏi phỏng vấn không dẫn dắt.\n` +
    `4. Gợi ý một sản phẩm số tối thiểu và đầu ra khách nhận được.\n` +
    `5. Phân biệt giả định với bằng chứng; không bịa dữ liệu thị trường hoặc doanh thu.\n\n` +
    `Trả lời bằng tiếng Việt, ngắn gọn, có checklist bước tiếp theo.`;

  document.querySelector('#prompt-area').hidden = false;
  document.querySelector('#prompt-status').textContent =
    '✅ Câu lệnh đã sẵn sàng. Hãy kiểm tra và thêm bối cảnh trước khi dùng.';

  // Smooth scroll to result
  document.querySelector('#prompt-area').scrollIntoView({
    behavior: 'smooth', block: 'center'
  });
});

document.querySelector('#copy-prompt')?.addEventListener('click', () => {
  copyText('prompt-result', 'prompt-status');
});


/* ══════════════════════════════════════
   BRIEF FORM (Consultation)
   ══════════════════════════════════════ */
document.querySelector('#brief-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const clean = key => String(data.get(key) || '').trim();

  if (!clean('project') || !clean('audience') || !clean('goal')) {
    document.querySelector('#brief-status').textContent =
      '⚠️ Vui lòng điền nội dung cụ thể vào ba trường bắt buộc.';
    return;
  }

  document.querySelector('#brief-result').value =
    `Chào Victor, tôi muốn trao đổi dự án:\n\n` +
    `Dự án: ${clean('project')}\n` +
    `Khách hàng: ${clean('audience')}\n` +
    `Đầu ra cần có: ${clean('goal')}\n` +
    `Ngân sách dự kiến: ${clean('budget')}\n` +
    `Thời gian mong muốn: ${clean('timeline') || 'Cần trao đổi'}\n\n` +
    `Nhờ Victor cùng làm rõ phạm vi, chi phí và các mốc bàn giao trước khi triển khai.`;

  document.querySelector('#brief-output').hidden = false;
  document.querySelector('#brief-status').textContent =
    '✅ Đã tạo bản yêu cầu trên thiết bị. Chưa gửi cho Victor.';

  document.querySelector('#brief-output').scrollIntoView({
    behavior: 'smooth', block: 'center'
  });
});

document.querySelector('#copy-brief')?.addEventListener('click', () => {
  copyText('brief-result', 'brief-status');
});


/* ══════════════════════════════════════
   HEADER SCROLL EFFECT
   ══════════════════════════════════════ */
function initHeaderEffect() {
  const header = document.querySelector('.header');
  if (!header) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.style.background = window.scrollY > 50
        ? 'rgba(10, 14, 26, 0.95)'
        : 'rgba(10, 14, 26, 0.85)';
      ticking = false;
    });
  }, { passive: true });
}


/* ══════════════════════════════════════
   MOBILE MENU — Auto close on navigation
   ══════════════════════════════════════ */
function initMobileMenu() {
  const menu = document.querySelector('.mobile-menu');
  if (!menu) return;

  menu.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
      menu.removeAttribute('open');
    });
  });
}


/* ══════════════════════════════════════
   FACETS CHECKLIST INTERACTIVE LOGIC
   ══════════════════════════════════════ */
function initFacetsChecklist() {
  const checkboxes = document.querySelectorAll('.facets-check');
  const countEl = document.querySelector('#facets-count');
  const successBox = document.querySelector('#facets-success-msg');
  if (!checkboxes.length || !countEl) return;

  function update() {
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    countEl.textContent = checked;
    if (successBox) {
      successBox.hidden = (checked !== 6);
    }
  }

  checkboxes.forEach(cb => {
    cb.addEventListener('change', update);
  });
}


/* ══════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initRevealAnimations();
  initCounters();
  initStickyCTA();
  initHeaderEffect();
  initMobileMenu();
  initFacetsChecklist();
});
