// Popup script for Sonarr Series Organizer

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const debugBtn = document.getElementById('debugBtn');
const debugInfo = document.getElementById('debugInfo');
const debugLogs = document.getElementById('debugLogs');
const warningBox = document.getElementById('warningBox');

// Update status display
function updateStatus(message) {
  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden');
}

// Check if we're on the correct page
function checkCurrentPage() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "checkPage"}, (response) => {
        if (chrome.runtime.lastError || !response || !response.isCorrectPage) {
          // Not on correct page - show warning
          warningBox.style.display = 'block';
        } else {
          // On correct page - hide warning
          warningBox.style.display = 'none';
        }
      });
    }
  });
}

// Check page on popup open
checkCurrentPage();

// Start automation
startBtn.addEventListener('click', () => {
  startBtn.disabled = true;
  stopBtn.style.display = 'block';
  updateStatus('Starting automation...');

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "startAutomation"}, (response) => {
        if (chrome.runtime.lastError) {
          updateStatus('Error: ' + chrome.runtime.lastError.message);
          startBtn.disabled = false;
          stopBtn.style.display = 'none';
        } else {
          updateStatus('Automation started! Check console for progress.');
        }
      });
    }
  });
});

// Stop automation
stopBtn.addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    if (tabs[0]) {
      // Clear chrome.storage instead of sessionStorage
      await chrome.storage.local.remove(['sonarrSeriesList', 'sonarrCurrentIndex', 'sonarrAutomationActive']);

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          console.log('[Sonarr] Automation stopped by user');
        }
      }, () => {
        updateStatus('Automation stopped!');
        startBtn.disabled = false;
        stopBtn.style.display = 'none';
      });
    }
  });
});

// Toggle debug info
debugBtn.addEventListener('click', () => {
  if (debugInfo.style.display === 'none') {
    // Show debug info
    debugInfo.style.display = 'block';
    debugBtn.textContent = 'Hide Debug Info';

    // Get debug logs from chrome.storage
    chrome.storage.local.get(['sonarrDebugLogs', 'sonarrSeriesList', 'sonarrCurrentIndex', 'sonarrAutomationActive'], (stored) => {
      let logText = `Status: ${stored.sonarrAutomationActive === true ? 'ACTIVE' : 'NOT ACTIVE'}\n`;
      logText += `Series: ${stored.sonarrCurrentIndex !== undefined ? stored.sonarrCurrentIndex : 'N/A'}/${stored.sonarrSeriesList ? stored.sonarrSeriesList.length : 0}\n\n`;
      logText += `Recent logs:\n`;
      logText += `${'='.repeat(40)}\n`;

      if (stored.sonarrDebugLogs && stored.sonarrDebugLogs.length > 0) {
        stored.sonarrDebugLogs.forEach(log => {
          logText += `[${log.time}] ${log.message}\n`;
          if (log.data) {
            logText += `  → ${JSON.stringify(log.data)}\n`;
          }
        });
      } else {
        logText += 'No logs available\n';
      }

      debugLogs.textContent = logText;
    });
  } else {
    // Hide debug info
    debugInfo.style.display = 'none';
    debugBtn.textContent = 'Show Debug Info';
  }
});

// Listen for status updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateStatus") {
    updateStatus(request.message);
  }
});
