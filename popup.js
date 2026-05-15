// popup.js — detects whether user is on a TPT product page
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url ?? ''
  const onTPT = url.includes('teacherspayteachers.com/Product/')

  document.getElementById('on-tpt-view').style.display  = onTPT ? 'block' : 'none'
  document.getElementById('not-tpt-view').style.display = onTPT ? 'none'  : 'block'

  if (onTPT) {
    const bsUrl = `https://thebrightstandard.com/hub?q=${encodeURIComponent(
      new URL(url).pathname.split('/').pop()?.replace(/-/g, ' ') ?? ''
    )}`
    document.getElementById('view-bs-btn').href = bsUrl
  }
})
