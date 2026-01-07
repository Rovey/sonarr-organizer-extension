// Content script for Sonarr Series Organizer
let isRunning = false;
let currentSeriesIndex = 0;
let seriesLinks = [];
let debugLogs = [];

// Utility function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Debug logging
function debug(message, data = null) {
  const timestamp = new Date().toISOString().substr(11, 12);
  const logMsg = `[${timestamp}] ${message}`;
  console.log(`[Sonarr Debug] ${logMsg}`, data || '');
  debugLogs.push({ time: timestamp, message, data });

  // Keep only last 50 logs
  if (debugLogs.length > 50) {
    debugLogs.shift();
  }

  // Store in chrome.storage for debugging (persists across navigations)
  try {
    chrome.storage.local.set({ 'sonarrDebugLogs': debugLogs.slice(-20) }).catch(() => {});
  } catch (e) {
    // Ignore storage errors
  }
}

// Update status
function updateStatus(message) {
  debug(`STATUS: ${message}`);
  chrome.runtime.sendMessage({
    action: "updateStatus",
    message: message
  }).catch(() => {});
}

// Get all series links from the main page
function getAllSeriesLinks() {
  const links = document.querySelectorAll('a.SeriesIndexPoster-link-PqaaO[href^="/series/"]');
  return Array.from(links).map(link => link.getAttribute('href'));
}

// Click Preview Rename button
async function clickPreviewRename() {
  debug("Looking for Preview Rename button...");
  updateStatus("Looking for Preview Rename button...");

  // Wait for button to be available
  for (let i = 0; i < 20; i++) {
    const allButtons = document.querySelectorAll('button');
    debug(`Attempt ${i + 1}/20: Found ${allButtons.length} buttons`);

    const previewButton = Array.from(allButtons).find(btn => {
      return btn.textContent.includes('Preview Rename');
    });

    if (previewButton) {
      debug("Found Preview Rename button!", {
        text: previewButton.textContent,
        classes: previewButton.className
      });
      updateStatus("Clicking Preview Rename...");
      previewButton.click();
      await wait(1500);
      return true;
    }

    // Log some button texts for debugging
    if (i === 0 || i === 5 || i === 10) {
      const buttonTexts = Array.from(allButtons).slice(0, 10).map(b => b.textContent.trim().substring(0, 30));
      debug(`Sample button texts:`, buttonTexts);
    }

    await wait(500);
  }

  debug("Preview Rename button not found after 20 attempts!");
  updateStatus("Preview Rename button not found!");
  return false;
}

// Click Organize button in modal
async function clickOrganize() {
  debug("Looking for Organize button...");
  updateStatus("Looking for Organize button...");

  // Wait for modal and organize button
  for (let i = 0; i < 20; i++) {
    const allButtons = document.querySelectorAll('button');
    debug(`Attempt ${i + 1}/20: Found ${allButtons.length} buttons in modal`);

    const organizeButton = Array.from(allButtons).find(btn => {
      const hasOrganize = btn.textContent.includes('Organize');
      const hasPrimaryClass = btn.classList.contains('Button-primary-MZWFG') ||
                             btn.classList.contains('Button-button-paJ9a');
      return hasOrganize && hasPrimaryClass;
    });

    if (organizeButton) {
      debug("Found Organize button!", {
        text: organizeButton.textContent,
        classes: organizeButton.className
      });
      updateStatus("Clicking Organize...");
      organizeButton.click();
      await wait(2000);
      return true;
    }

    // Log button texts for debugging
    if (i === 0 || i === 5 || i === 10) {
      const buttonTexts = Array.from(allButtons)
        .filter(b => b.textContent.includes('Organize') || b.classList.contains('Button-primary'))
        .map(b => ({ text: b.textContent.trim().substring(0, 30), classes: b.className }));
      debug(`Organize-related buttons:`, buttonTexts);
    }

    await wait(500);
  }

  debug("Organize button not found after 20 attempts!");
  updateStatus("Organize button not found!");
  return false;
}

// Wait for organize to complete
async function waitForOrganizeComplete() {
  debug("Waiting for organize to complete...");
  updateStatus("Waiting for organize to complete...");

  // Wait a bit for the organize operation to complete
  await wait(3000);

  // Check if we need to close any modal
  const closeButton = document.querySelector('[aria-label="Close Modal"]') ||
                      document.querySelector('.Modal-closeButton-NrCWi') ||
                      document.querySelector('button.Modal-closeButton');

  debug("Close button found?", closeButton !== null);

  if (closeButton) {
    debug("Closing modal");
    closeButton.click();
    await wait(500);
  } else {
    debug("No close button found, modal may have auto-closed");
  }
}

// Process current series page (assumes we're already on the page)
async function processCurrentSeriesPage() {
  try {
    debug("Starting to process current series page");
    debug("Current URL", window.location.href);

    // Click Preview Rename
    const previewClicked = await clickPreviewRename();
    if (!previewClicked) {
      updateStatus("Failed to click Preview Rename, skipping...");
      return false;
    }

    // Click Organize
    const organizeClicked = await clickOrganize();
    if (!organizeClicked) {
      updateStatus("Failed to click Organize, skipping...");
      return false;
    }

    // Wait for organize to complete
    await waitForOrganizeComplete();

    updateStatus("Series processed successfully!");
    return true;

  } catch (error) {
    debug(`Error processing series: ${error.message}`);
    updateStatus(`Error processing series: ${error.message}`);
    return false;
  }
}

// Main automation function
async function startAutomation() {
  if (isRunning) {
    debug("Automation already running, ignoring start request");
    updateStatus("Automation already running!");
    return;
  }

  isRunning = true;
  debug("=== START AUTOMATION ===");
  updateStatus("Starting automation...");

  // Check if we're on the series index page
  // Sonarr's series index is at the root path "/" not "/series"
  const isIndexPage = document.querySelector('.SeriesIndex-contentBodyContainer-ZorRq');
  const isRootPath = window.location.pathname === '/' || window.location.pathname === '';
  const isOnIndexPage = isIndexPage !== null && isRootPath;

  debug("Is index page?", {
    hasIndexContainer: isIndexPage !== null,
    isRootPath: isRootPath,
    pathname: window.location.pathname,
    finalDecision: isOnIndexPage
  });

  if (isOnIndexPage) {
    debug("On index page - initializing automation");

    // We're on the index page, get all series
    seriesLinks = getAllSeriesLinks();
    debug("Found series links", seriesLinks.length);
    updateStatus(`Found ${seriesLinks.length} series to process`);

    if (seriesLinks.length === 0) {
      updateStatus("No series found!");
      isRunning = false;
      return;
    }

    // Store the series list and index in chrome.storage (persists across navigations)
    await chrome.storage.local.set({
      'sonarrSeriesList': seriesLinks,
      'sonarrCurrentIndex': 0,
      'sonarrAutomationActive': true
    });
    debug("Stored series list in chrome.storage");

    // Navigate to first series
    const firstSeries = seriesLinks[0];
    debug("Navigating to first series", firstSeries);
    updateStatus(`Navigating to series 1/${seriesLinks.length}: ${firstSeries}`);

    window.location.href = firstSeries;
    // Script will stop here due to navigation

  } else {
    debug("Not on index page - checking for active automation");

    // Check if we have an active automation session
    const stored = await chrome.storage.local.get(['sonarrSeriesList', 'sonarrCurrentIndex', 'sonarrAutomationActive']);

    debug("Stored series list exists?", stored.sonarrSeriesList !== undefined);
    debug("Stored index", stored.sonarrCurrentIndex);
    debug("Automation active?", stored.sonarrAutomationActive);

    if (stored.sonarrSeriesList && stored.sonarrCurrentIndex !== undefined && stored.sonarrAutomationActive === true) {
      seriesLinks = stored.sonarrSeriesList;
      currentSeriesIndex = stored.sonarrCurrentIndex;

      debug(`Processing series ${currentSeriesIndex + 1}/${seriesLinks.length}`);
      updateStatus(`Processing series ${currentSeriesIndex + 1}/${seriesLinks.length}`);

      // Process current series page (we're already on it)
      const success = await processCurrentSeriesPage();
      debug("Processing result", success);

      // Move to next series
      currentSeriesIndex++;
      await chrome.storage.local.set({ 'sonarrCurrentIndex': currentSeriesIndex });

      if (currentSeriesIndex < seriesLinks.length) {
        // Continue with next series
        const nextSeries = seriesLinks[currentSeriesIndex];
        debug("Moving to next series", nextSeries);
        updateStatus(`Moving to series ${currentSeriesIndex + 1}/${seriesLinks.length}...`);
        await wait(1000);
        window.location.href = nextSeries;
        // Script will stop here due to navigation
      } else {
        // All done
        debug("All series processed!");
        updateStatus("All series processed! Returning to index...");
        await chrome.storage.local.remove(['sonarrSeriesList', 'sonarrCurrentIndex', 'sonarrAutomationActive']);
        await wait(2000);
        // Navigate back to root (/) where the series index is
        window.location.href = '/';
        isRunning = false;
      }
    } else {
      debug("No active automation session found");
      updateStatus("No active automation. Please start from the series index page.");
      isRunning = false;
    }
  }
}

// Check if we're on the correct page (series index)
function isOnCorrectPage() {
  const isIndexPage = document.querySelector('.SeriesIndex-contentBodyContainer-ZorRq');
  const isRootPath = window.location.pathname === '/' || window.location.pathname === '';
  return isIndexPage !== null && isRootPath;
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startAutomation") {
    startAutomation();
    sendResponse({status: "started"});
  } else if (request.action === "checkPage") {
    sendResponse({isCorrectPage: isOnCorrectPage()});
  }
  return true;
});

// Check if we should auto-continue on page load
window.addEventListener('load', async () => {
  debug("=== PAGE LOADED ===");
  debug("Current URL", window.location.href);

  await wait(1500); // Give page time to fully render

  const stored = await chrome.storage.local.get(['sonarrSeriesList', 'sonarrCurrentIndex', 'sonarrAutomationActive']);

  debug("Auto-continue check", {
    hasSeriesList: stored.sonarrSeriesList !== undefined,
    index: stored.sonarrCurrentIndex,
    active: stored.sonarrAutomationActive,
    isRunning: isRunning
  });

  if (stored.sonarrSeriesList && stored.sonarrCurrentIndex !== undefined && stored.sonarrAutomationActive === true && !isRunning) {
    // Auto-continue automation
    debug("Auto-continuing automation...");
    updateStatus("Auto-continuing automation...");
    startAutomation();
  } else {
    debug("Not auto-continuing", {
      reason: !stored.sonarrSeriesList ? "no series list" :
              stored.sonarrCurrentIndex === undefined ? "no index" :
              stored.sonarrAutomationActive !== true ? "not active" :
              isRunning ? "already running" : "unknown"
    });
  }
});

// Add a way to view debug logs via console command
window.getSonarrDebugLogs = async function() {
  console.table(debugLogs);
  const stored = await chrome.storage.local.get(['sonarrDebugLogs']);
  if (stored.sonarrDebugLogs) {
    console.log("Stored logs:", stored.sonarrDebugLogs);
  }
  return debugLogs;
};

// Log when script loads
debug("Content script loaded", {
  url: window.location.href,
  time: new Date().toISOString()
});
