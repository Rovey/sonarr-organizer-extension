// Background service worker for Sonarr Series Organizer

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startAutomation") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startAutomation"});
      }
    });
    sendResponse({status: "started"});
  }
  return true;
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateStatus") {
    // Forward status updates to popup if it's open
    chrome.runtime.sendMessage(request).catch(() => {
      // Popup might not be open, ignore error
    });
  }
  return true;
});
