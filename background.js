// background.js — service worker for Bright Standard extension
// Currently minimal — handles future message passing between popup and content scripts

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Bright Standard] Extension installed')
})

// Future: handle cached scores, auth token relay, badge count
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('teacherspayteachers.com/Product/')) {
    // Badge shows BS is active on this TPT page
    chrome.action.setBadgeText({ text: '✓', tabId })
    chrome.action.setBadgeBackgroundColor({ color: '#3D7A52', tabId })
  } else if (changeInfo.status === 'complete') {
    chrome.action.setBadgeText({ text: '', tabId })
  }
})
