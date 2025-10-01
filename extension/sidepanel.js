const summarizeBtn = document.getElementById("summarizeBtn");
const outputEl = document.getElementById("output");

function startCountdown(seconds) {
  let remaining = seconds;
  summarizeBtn.disabled = true;
  summarizeBtn.innerText = `Processing, please wait (${remaining})`;

  const interval = setInterval(() => {
    remaining--;
    summarizeBtn.innerText = `Processing, please wait (${remaining})`;

    if (remaining <= 0) {
      clearInterval(interval);
      summarizeBtn.disabled = false;
      summarizeBtn.innerText = "Summarize Page";
      outputEl.innerText = "Request timed out. Please try again.";
    }
  }, 1000);

  return interval;
}

function sendScrapeMessage(tabId, callback) {
  chrome.tabs.sendMessage(tabId, { action: "scrape_page" }, res => {
    if (chrome.runtime.lastError || !res) {
      // Only log if it's NOT a chrome:// or pdf tab
      chrome.tabs.get(tabId, tab => {
        if (tab.url.startsWith("http")) {
          console.log("[Omega] Injecting content script into:", tab.url);
        }
        chrome.scripting.executeScript(
          { target: { tabId }, files: ["content.js"] },
          () => chrome.tabs.sendMessage(tabId, { action: "scrape_page" }, callback)
        );
      });
    } else {
      callback(res);
    }
  });
}


summarizeBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab?.id) {
      outputEl.innerText = "No active tab found.";
      return;
    }

    sendScrapeMessage(tab.id, res => {
      if (!res || !res.content) {
        outputEl.innerText = "Failed to scrape page text. Refresh and try again.";
        return;
      }

      const pageText = res.content;
      console.log("Page text received:", pageText.slice(0, 200));

      outputEl.innerText = "Processing, please wait...";
      const countdown = startCountdown(30);

      chrome.runtime.sendMessage({ action: "summarize", content: pageText }, response => {
        clearInterval(countdown);
        summarizeBtn.disabled = false;
        summarizeBtn.innerText = "Summarize Page";

        outputEl.innerText = response?.summary || "Failed to summarize.";
      });
    });
  });
});
