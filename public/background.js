// Background script for the extension
// This is the persistence layer that runs as a service worker in Manifest V3

// Extension state variables
let extensionState = {
  features: {
    contentScript: {
      enabled: true,
      domains: ["example.com", "api.example.com", "*.example.org"]
    },
    backgroundServices: {
      enabled: true,
      memoryUsage: "24.7 MB"
    },
    browserApi: {
      enabled: true,
      apis: ["storage", "tabs", "scripting", "cookies"],
      apiCalls: "147 today"
    }
  },
  permissions: {
    storage: true,
    tabs: true,
    cookies: false,
    network: false
  },
  performanceMetrics: {
    cpuUsage: "3.2%",
    memoryUsage: "24.7 MB",
    networkRequests: "7 / min"
  }
};

// Initialize browser detection
function detectBrowser() {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (userAgent.indexOf("Chrome") !== -1) {
    const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    if (chromeMatch && chromeMatch.length > 1) {
      browserName = "Chrome";
      browserVersion = chromeMatch[1];

      // Check if actually Edge
      if (userAgent.indexOf("Edg") !== -1) {
        const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
        if (edgeMatch && edgeMatch.length > 1) {
          browserName = "Edge";
          browserVersion = edgeMatch[1];
        }
      }
    }
  }

  return { browserName, browserVersion };
}

// Log extension events
function logEvent(level, message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logEntry = { level, message, timestamp };
  
  // Get existing logs from storage
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.unshift(logEntry);
    
    // Store updated logs
    chrome.storage.local.set({ logs });
  });
  
  console.log(`[${level}] ${message}`);
}

// Initialize extension data
async function initializeExtensionData() {
  try {
    // Check if extension data exists
    const data = await chrome.storage.local.get(['features', 'permissions', 'logs']);
    
    // Initialize defaults if needed
    if (!data.features) {
      chrome.storage.local.set({ features: extensionState.features });
    }
    
    if (!data.permissions) {
      chrome.storage.local.set({ permissions: extensionState.permissions });
    }
    
    if (!data.logs) {
      // Create default logs
      const defaultLogs = [
        {
          level: "INFO",
          message: "Extension initialized successfully. Running in Chrome browser.",
          timestamp: "2023-03-17 14:32:45"
        },
        {
          level: "INFO",
          message: "Content script injected into tab ID: 2384756.",
          timestamp: "2023-03-17 14:32:46"
        },
        {
          level: "WARNING",
          message: "Storage quota approaching limit (60% used).",
          timestamp: "2023-03-17 14:33:12"
        },
        {
          level: "ERROR",
          message: "Failed to connect to api.example.com. Network error: timeout.",
          timestamp: "2023-03-17 14:35:07"
        },
        {
          level: "INFO",
          message: "Background service worker registered successfully.",
          timestamp: "2023-03-17 14:36:22"
        }
      ];
      
      chrome.storage.local.set({ logs: defaultLogs });
    }
    
    // Detect browser and log
    const browser = detectBrowser();
    logEvent("INFO", `Extension loaded in ${browser.browserName} ${browser.browserVersion}`);
    
  } catch (error) {
    console.error("Error initializing extension data:", error);
  }
}

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    initializeExtensionData();
    logEvent("INFO", "Extension installed");
  } else if (details.reason === "update") {
    logEvent("INFO", `Extension updated to version ${chrome.runtime.getManifest().version}`);
  }
});

// Message handling from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "getFeatures":
      chrome.storage.local.get(['features'], (result) => {
        sendResponse(result.features || extensionState.features);
      });
      break;
      
    case "setFeatures":
      chrome.storage.local.set({ features: message.data }, () => {
        sendResponse({ success: true });
      });
      break;
      
    case "getPermissions":
      chrome.storage.local.get(['permissions'], (result) => {
        sendResponse(result.permissions || extensionState.permissions);
      });
      break;
      
    case "requestPermission":
      logEvent("INFO", `Permission request: ${message.permission}`);
      // In a real extension, this would use the permissions API
      sendResponse({ success: true });
      break;
      
    case "getLogs":
      chrome.storage.local.get(['logs'], (result) => {
        sendResponse(result.logs || []);
      });
      break;
      
    case "addLog":
      logEvent(message.level, message.message);
      sendResponse({ success: true });
      break;
      
    case "clearLogs":
      chrome.storage.local.set({ logs: [] }, () => {
        logEvent("INFO", "Logs cleared by user");
        sendResponse({ success: true });
      });
      break;
  }
  
  // Required for async sendResponse
  return true;
});

// Initialize when service worker starts
initializeExtensionData();

// Log service worker startup
logEvent("INFO", "Background service worker started");
