// This script loads the built React app into the extension popup
// It serves as a bridge between the extension's background script and the UI

document.addEventListener('DOMContentLoaded', async function() {
  // Load React build into popup
  const reactAppScript = document.createElement('script');
  reactAppScript.src = 'public/index.js';
  document.body.appendChild(reactAppScript);

  // Setup message passing to background script
  window.extensionBridge = {
    // Get features from background
    getFeatures: () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getFeatures" }, (response) => {
          resolve(response);
        });
      });
    },
    
    // Update features in background
    setFeatures: (features) => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "setFeatures", data: features }, (response) => {
          resolve(response);
        });
      });
    },
    
    // Get permissions from background
    getPermissions: () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getPermissions" }, (response) => {
          resolve(response);
        });
      });
    },
    
    // Request a permission
    requestPermission: (permission) => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "requestPermission", permission }, (response) => {
          resolve(response);
        });
      });
    },
    
    // Get logs from background
    getLogs: () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getLogs" }, (response) => {
          resolve(response);
        });
      });
    },
    
    // Add a log entry
    addLog: (level, message) => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "addLog", level, message }, (response) => {
          resolve(response);
        });
      });
    },
    
    // Clear logs
    clearLogs: () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "clearLogs" }, (response) => {
          resolve(response);
        });
      });
    },
    
    // Get browser info
    getBrowserInfo: () => {
      return new Promise((resolve) => {
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
        
        resolve({ browserName, browserVersion });
      });
    }
  };

  // Make bridge accessible to React app
  window.extensionBridgeReady = true;
  
  // Dispatch event that bridge is ready
  const event = new CustomEvent('extensionBridgeReady');
  document.dispatchEvent(event);
});
