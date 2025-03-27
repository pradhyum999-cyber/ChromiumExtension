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

// Detect browser features that might be available to the content script
function detectBrowserFeatures() {
  const features = {
    clipboard: !!navigator.clipboard,
    geolocation: !!navigator.geolocation,
    notifications: !!("Notification" in window),
    storage: !!window.localStorage,
    webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    })(),
    webWorkers: !!window.Worker,
    serviceWorkers: !!navigator.serviceWorker
  };
  
  return features;
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
    
    // Detect browser features
    const features = detectBrowserFeatures();
    logToExtension("INFO", `Browser features detected: ${Object.keys(features).filter(k => features[k]).join(', ')}`);
    
    // Listen for navigation events within the page (SPA detection)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        logToExtension("INFO", `Navigation detected within page: ${location.href}`);
      }
    });
    
    observer.observe(document, { subtree: true, childList: true });
    
    // Report page performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.performance && window.performance.timing) {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domReadyTime = perfData.domComplete - perfData.domLoading;
          
          logToExtension("INFO", `Page load time: ${pageLoadTime}ms, DOM ready: ${domReadyTime}ms`);
        }
      }, 0);
    });
    
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "contentScriptStatus") {
        sendResponse({ 
          status: "running", 
          url: window.location.href,
          features: features
        });
      } else if (message.action === "getPageMetrics") {
        // Get page metrics on demand
        const metrics = {
          title: document.title,
          url: window.location.href,
          links: document.links.length,
          images: document.images.length,
          scripts: document.scripts.length,
          iframes: document.getElementsByTagName('iframe').length
        };
        sendResponse(metrics);
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
