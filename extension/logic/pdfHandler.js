// Ensure worker is set
if (typeof pdfjsLib !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("libs/pdf.worker.js");
}

async function extractPdfText(url) {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    console.log("[Omega][PDF Handler] Extracted length:", fullText.length);
    return fullText;
  } catch (err) {
    console.error("[Omega][PDF Handler] Error extracting PDF:", err);
    return "";
  }
}

// Hook into content.js messaging
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extract_pdf") {
    extractPdfText(msg.url).then(text => sendResponse({ content: text }));
    return true;
  }
});
