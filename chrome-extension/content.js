/**
 * WrenchIQ Extension — Content Script
 *
 * Runs in the context of every page the user visits.
 * Scans for phone numbers in the visible DOM and reports the best candidate
 * to the background service worker.
 *
 * Strategy:
 * - Look for elements that match SMS-platform conventions (thread header,
 *   contact name area, data attributes) first.
 * - Fall back to a regex scan of visible text.
 * - Debounce on DOM mutations so we don't spam on every keystroke.
 */

const PHONE_RE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

// Selectors used by common web SMS platforms (extend as needed)
const PRIORITY_SELECTORS = [
  '[data-phone]',
  '[data-contact-phone]',
  '.contact-phone',
  '.thread-phone',
  '.conversation-header',
  '.sms-recipient',
  '.customer-phone',
  'h1', 'h2', 'h3',   // most SMS UIs show the contact name/number in a heading
];

let lastReportedPhone = null;

function extractPhone() {
  // 1. Priority selectors
  for (const sel of PRIORITY_SELECTORS) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const text = el.innerText || el.textContent || el.getAttribute('data-phone') || '';
    const match = text.match(PHONE_RE);
    if (match) return match[0];
  }

  // 2. Full-page text scan (limited to first 5000 chars for performance)
  const bodyText = document.body?.innerText?.slice(0, 5000) || '';
  const allMatches = bodyText.match(PHONE_RE);
  return allMatches ? allMatches[0] : null;
}

function report(phone) {
  if (!phone || phone === lastReportedPhone) return;
  lastReportedPhone = phone;
  chrome.runtime.sendMessage({ type: 'WRENCHIQ_PHONE_DETECTED', phone });
}

// Initial scan
report(extractPhone());

// Watch for DOM changes (SPA navigation, thread switching)
const observer = new MutationObserver(() => {
  report(extractPhone());
});

observer.observe(document.body, { childList: true, subtree: true });

// Listen for explicit phone trigger from the page (SMS vendors can emit this)
window.addEventListener('wrenchiq:phone', (e) => {
  if (e.detail?.phone) report(e.detail.phone);
});

// Listen for open-panel request from the page button
window.addEventListener('wrenchiq:open-panel', () => {
  chrome.runtime.sendMessage({ type: 'WRENCHIQ_OPEN_PANEL' });
});
