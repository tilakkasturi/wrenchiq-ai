/**
 * WrenchIQ Extension — Service Worker (Background)
 *
 * Responsibilities:
 * 1. Open side panel when action icon is clicked
 * 2. Relay messages from content script → side panel
 * 3. Store last-seen phone context per tab so panel can rehydrate on open
 */

// Open side panel when user clicks the toolbar icon
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Enable side panel for all tabs by default
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Message relay: content script → side panel (broadcast to all extension contexts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'WRENCHIQ_OPEN_PANEL') {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.sidePanel.open({ tabId });
    }
    return;
  }
  if (message.type === 'WRENCHIQ_PHONE_DETECTED') {
    // Persist per-tab so side panel can fetch on open
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.storage.session.set({ [`tab_${tabId}_phone`]: message.phone });
    }
    // Broadcast to any open side panel
    chrome.runtime.sendMessage({ type: 'WRENCHIQ_PHONE_UPDATE', phone: message.phone }).catch(() => {});
  }

  if (message.type === 'WRENCHIQ_GET_TAB_PHONE') {
    // Side panel asking "what phone is active on the current tab?"
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.storage.session.get(`tab_${tabId}_phone`, (result) => {
        const phone = result[`tab_${tabId}_phone`] || null;
        chrome.runtime.sendMessage({ type: 'WRENCHIQ_PHONE_UPDATE', phone }).catch(() => {});
      });
    });
  }
});
