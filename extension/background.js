async function summarizeContent(content) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000); // 35s max

  try {
    const response = await fetch("https://project-omega.onrender.com/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { summary: `Backend error: ${response.status}` };
    }

    const data = await response.json();
    console.log("[Omega] Raw backend result:", data);
    return data;

  } catch (err) {
    return { summary: `Request failed: ${err.message}` };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "summarize") {
    summarizeContent(msg.content).then(result => {
      sendResponse(result); // always { summary: ... }
    });
    return true;
  }
});
