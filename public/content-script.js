// Content script that runs in web pages
// This script is injected into pages that match the patterns in manifest.json

// Function to log events back to the extension
function logToExtension(level, message) {
  chrome.runtime.sendMessage({
    action: "addLog",
    level: level,
    message: message
  });
}

// Check if the content script should be enabled on this domain
function isContentScriptEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['features'], (result) => {
      if (result.features && result.features.contentScript) {
        resolve(result.features.contentScript.enabled);
      } else {
        resolve(true); // Default to enabled if not set
      }
    });
  });
}

// Initialize content script
async function initContentScript() {
  try {
    const isEnabled = await isContentScriptEnabled();
    
    if (!isEnabled) {
      console.log("Content script is disabled for this domain");
      return;
    }
    
    // Log successful injection
    logToExtension("INFO", `Content script injected into ${window.location.href}`);
    
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "contentScriptStatus") {
        sendResponse({ status: "running", url: window.location.href });
      }
      return true;
    });
    
  } catch (error) {
    console.error("Error initializing content script:", error);
    logToExtension("ERROR", `Content script initialization failed: ${error.message}`);
  }
}

// Run the content script initialization
initContentScript();
