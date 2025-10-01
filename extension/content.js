function getPageText() {
  let raw = document.body ? document.body.innerText : "";
  return raw.replace(/[\u0000-\u001F\u007F]/g, " "); // clean control chars
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scrape_page") {
    const text = getPageText();
    console.log("[Omega][Content] Scraped text length:", text.length);
    sendResponse({ content: text });
  }
});
