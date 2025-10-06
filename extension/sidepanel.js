const summarizeBtn = document.getElementById("summarizeBtn");
const outputEl = document.getElementById("output");
const askBtn = document.getElementById("askBtn");
const questionInput = document.getElementById("questionInput");
const answerSection = document.getElementById("answerSection");
const answerText = document.getElementById("answerText");

// 🕒 Countdown during summarization
function startCountdown(seconds) {
  let remaining = seconds;
  summarizeBtn.disabled = true;
  summarizeBtn.innerText = `Processing... (${remaining})`;

  const interval = setInterval(() => {
    remaining--;
    summarizeBtn.innerText = `Processing... (${remaining})`;

    if (remaining <= 0) {
      clearInterval(interval);
      summarizeBtn.disabled = false;
      summarizeBtn.innerText = "Summarize Page";
      outputEl.innerText = "Request timed out. Please try again.";
    }
  }, 1000);

  return interval;
}

// 🧩 Fetch page text
function sendScrapeMessage(tabId, callback) {
  chrome.tabs.sendMessage(tabId, { action: "scrape_page" }, res => {
    if (chrome.runtime.lastError || !res) {
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

// 🧠 Summarize button click
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
      localStorage.setItem("pageText", pageText);
      console.log("[Omega] Page text received:", pageText.slice(0, 200));

      outputEl.innerText = "Processing, please wait...";
      const countdown = startCountdown(30);

      chrome.runtime.sendMessage({ action: "summarize", content: pageText }, response => {
        clearInterval(countdown);
        summarizeBtn.disabled = false;
        summarizeBtn.innerText = "Summarize Page";

        outputEl.innerText = response?.summary || "Failed to summarize.";
        outputEl.scrollTop = outputEl.scrollHeight; // auto-scroll to bottom
      });
    });
  });
});

// 💬 Ask a question
askBtn.addEventListener("click", async () => {
  const question = questionInput.value.trim();
  if (!question) {
    answerText.textContent = "Please enter a question first.";
    answerSection.style.display = "block";
    return;
  }

  askBtn.disabled = true;
  askBtn.textContent = "Thinking...";
  answerText.textContent = "Generating answer...";
  answerSection.style.display = "block";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const pageContext = localStorage.getItem("pageText") || "";

    // 🔹 Backend integration (will work once /ask endpoint is ready)
    const response = await fetch("https://project-omega.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, pageContext, url })
    });

    const data = await response.json();
    answerText.textContent = data.answer || "No response from server.";
  } catch (error) {
    console.error("[Omega] Error in ask feature:", error);
    answerText.textContent = "This is a demo answer (backend not yet live).";
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = "Ask";
    questionInput.value = "";
  }
});
