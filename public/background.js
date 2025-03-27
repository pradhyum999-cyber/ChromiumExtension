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
    webNavigation: false,
    scripting: false,
    bookmarks: false,
    notifications: false
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
  // Log message received (except for high-frequency messages)
  if (message.action !== "getLogs" && message.action !== "getFeatures" && message.action !== "getPermissions") {
    console.log("Message received:", message.action, message);
  }
  
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
      
      // Handle permission request using the permissions API
      try {
        if (message.permission === 'storage') {
          // Storage is already granted as a required permission
          sendResponse({ success: true, alreadyGranted: true });
        } else {
          // Request the permission from the user
          chrome.permissions.request(
            { 
              permissions: [message.permission] 
            },
            (granted) => {
              if (granted) {
                logEvent("INFO", `Permission granted: ${message.permission}`);
                
                // Update permission status in storage
                chrome.storage.local.get(['permissions'], (result) => {
                  const permissions = result.permissions || extensionState.permissions;
                  permissions[message.permission] = true;
                  chrome.storage.local.set({ permissions });
                });
                
                sendResponse({ success: true, granted: true });
              } else {
                logEvent("WARNING", `Permission denied: ${message.permission}`);
                sendResponse({ success: false, granted: false });
              }
            }
          );
        }
      } catch (error) {
        logEvent("ERROR", `Error requesting permission ${message.permission}: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
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
      
    case "getPageMetrics":
      // Forward the request to the active tab's content script
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
            sendResponse({ success: false, error: "No active tab found" });
            return;
          }
          
          const activeTab = tabs[0];
          
          // Send message to content script
          chrome.tabs.sendMessage(activeTab.id, { action: "getPageMetrics" }, (response) => {
            if (chrome.runtime.lastError) {
              // Content script might not be injected
              logEvent("WARNING", `Failed to get page metrics: ${chrome.runtime.lastError.message}`);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              logEvent("INFO", `Retrieved page metrics from tab ${activeTab.id}`);
              sendResponse({ success: true, metrics: response });
            }
          });
        });
      } catch (error) {
        logEvent("ERROR", `Error getting page metrics: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case "executeScript":
      try {
        // Check if we have scripting permission
        chrome.permissions.contains({ permissions: ['scripting'] }, (hasPermission) => {
          if (!hasPermission) {
            logEvent("WARNING", "Cannot execute script: scripting permission not granted");
            sendResponse({ success: false, error: "Scripting permission not granted" });
            return;
          }
          
          // Execute script in active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
              sendResponse({ success: false, error: "No active tab found" });
              return;
            }
            
            const tabId = tabs[0].id;
            
            // Execute the script
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              function: message.scriptFunction || (() => {
                // Default script function
                console.log('Default script executed by extension');
                return { success: true, message: "Script executed" };
              })
            }, (results) => {
              if (chrome.runtime.lastError) {
                logEvent("ERROR", `Script execution failed: ${chrome.runtime.lastError.message}`);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else if (results && results[0]) {
                logEvent("INFO", `Script executed in tab ${tabId}`);
                sendResponse({ success: true, result: results[0].result });
              } else {
                sendResponse({ success: false, error: "Unknown error executing script" });
              }
            });
          });
        });
      } catch (error) {
        logEvent("ERROR", `Error executing script: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case "togglePermission":
      const permissionName = message.permission;
      
      if (permissionName === 'storage') {
        // Storage is required and cannot be toggled
        sendResponse({ success: false, message: "Cannot toggle required permission" });
        return true;
      }
      
      try {
        // Check current status
        chrome.storage.local.get(['permissions'], (result) => {
          const permissions = result.permissions || extensionState.permissions;
          const currentStatus = permissions[permissionName];
          
          if (currentStatus) {
            // Permission is on, try to remove it
            chrome.permissions.remove({
              permissions: [permissionName]
            }, (removed) => {
              if (removed) {
                // Update the stored status
                permissions[permissionName] = false;
                chrome.storage.local.set({ permissions });
                logEvent("INFO", `Permission removed: ${permissionName}`);
                sendResponse({ success: true, status: false });
              } else {
                logEvent("WARNING", `Failed to remove permission: ${permissionName}`);
                sendResponse({ success: false, message: "Failed to remove permission" });
              }
            });
          } else {
            // Permission is off, request it
            chrome.permissions.request({
              permissions: [permissionName]
            }, (granted) => {
              if (granted) {
                // Update the stored status
                permissions[permissionName] = true;
                chrome.storage.local.set({ permissions });
                logEvent("INFO", `Permission granted: ${permissionName}`);
                sendResponse({ success: true, status: true });
              } else {
                logEvent("WARNING", `Permission request denied: ${permissionName}`);
                sendResponse({ success: false, message: "Permission request denied" });
              }
            });
          }
        });
      } catch (error) {
        logEvent("ERROR", `Error toggling permission ${permissionName}: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case "checkDynamicsCRM":
      // Check if the active tab is a Dynamics CRM page
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
            sendResponse({ success: false, error: "No active tab found" });
            return;
          }
          
          const activeTab = tabs[0];
          // Send message to content script
          chrome.tabs.sendMessage(activeTab.id, { action: "checkDynamicsCRM" }, (response) => {
            if (chrome.runtime.lastError) {
              logEvent("WARNING", `Failed to check if Dynamics CRM: ${chrome.runtime.lastError.message}`);
              sendResponse({ success: false, error: chrome.runtime.lastError.message, isDynamicsCRM: false });
            } else {
              sendResponse({ success: true, ...response });
            }
          });
        });
      } catch (error) {
        logEvent("ERROR", `Error checking Dynamics CRM: ${error.message}`);
        sendResponse({ success: false, error: error.message, isDynamicsCRM: false });
      }
      break;
      
    case "getDynamicsCRMFields":
      // Get form fields from Dynamics CRM page
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
            sendResponse({ success: false, error: "No active tab found" });
            return;
          }
          
          const activeTab = tabs[0];
          // Send message to content script
          chrome.tabs.sendMessage(activeTab.id, { action: "getDynamicsCRMFields" }, (response) => {
            if (chrome.runtime.lastError) {
              logEvent("WARNING", `Failed to get Dynamics CRM fields: ${chrome.runtime.lastError.message}`);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              logEvent("INFO", `Retrieved ${response.fields ? response.fields.length : 0} Dynamics CRM fields`);
              sendResponse({ success: true, ...response });
            }
          });
        });
      } catch (error) {
        logEvent("ERROR", `Error getting Dynamics CRM fields: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case "setDynamicsCRMField":
      // Set a field value in Dynamics CRM
      try {
        if (!message.fieldName || message.value === undefined) {
          sendResponse({ success: false, error: "Field name and value are required" });
          return true;
        }
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
            sendResponse({ success: false, error: "No active tab found" });
            return;
          }
          
          const activeTab = tabs[0];
          // Send message to content script
          chrome.tabs.sendMessage(activeTab.id, { 
            action: "setDynamicsCRMField",
            fieldName: message.fieldName,
            value: message.value
          }, (response) => {
            if (chrome.runtime.lastError) {
              logEvent("WARNING", `Failed to set Dynamics CRM field: ${chrome.runtime.lastError.message}`);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              if (response.success) {
                logEvent("INFO", `Set Dynamics CRM field "${message.fieldName}" to "${message.value}"`);
              } else {
                logEvent("WARNING", `Failed to set Dynamics CRM field "${message.fieldName}"`);
              }
              sendResponse({ success: response.success, ...response });
            }
          });
        });
      } catch (error) {
        logEvent("ERROR", `Error setting Dynamics CRM field: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case "fillDynamicsCRMForm":
      // Fill multiple fields in Dynamics CRM
      try {
        if (!message.values || typeof message.values !== 'object') {
          sendResponse({ success: false, error: "Field values object is required" });
          return true;
        }
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length === 0) {
            sendResponse({ success: false, error: "No active tab found" });
            return;
          }
          
          const activeTab = tabs[0];
          // Send message to content script
          chrome.tabs.sendMessage(activeTab.id, { 
            action: "fillDynamicsCRMForm",
            values: message.values
          }, (response) => {
            if (chrome.runtime.lastError) {
              logEvent("WARNING", `Failed to fill Dynamics CRM form: ${chrome.runtime.lastError.message}`);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              if (response.success) {
                logEvent("INFO", `Filled ${response.filledCount} fields in Dynamics CRM form`);
                // Show notification of success
                try {
                  chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Dynamics CRM Form Updated',
                    message: `Successfully filled ${response.filledCount} fields in the form`
                  });
                } catch (e) {
                  console.log("Could not show notification:", e);
                }
              } else {
                logEvent("WARNING", `Failed to fill Dynamics CRM form`);
              }
              sendResponse({ success: response.success, ...response });
            }
          });
        });
      } catch (error) {
        logEvent("ERROR", `Error filling Dynamics CRM form: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      }
      break;
  }
  
  // Required for async sendResponse
  return true;
});

// Additional event listeners for optional permissions

// Tab events (if tabs permission is granted)
try {
  chrome.tabs.onCreated.addListener((tab) => {
    logEvent("INFO", `New tab created: ${tab.id}`);
  });
  
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      logEvent("INFO", `Tab ${tabId} loaded: ${tab.url.substring(0, 50)}...`);
    }
  });
} catch (e) {
  // Tabs permission not granted
  console.log("Tabs permission not granted:", e);
}

// Web navigation events (if webNavigation permission is granted)
try {
  chrome.webNavigation.onCompleted.addListener((details) => {
    logEvent("INFO", `Navigation completed in tab ${details.tabId}`);
  });
} catch (e) {
  // WebNavigation permission not granted
  console.log("WebNavigation permission not granted:", e);
}

// Notification event handlers (if notifications permission is granted)
try {
  chrome.notifications.onClicked.addListener((notificationId) => {
    logEvent("INFO", `Notification clicked: ${notificationId}`);
  });
} catch (e) {
  // Notifications permission not granted
  console.log("Notifications permission not granted:", e);
}

// Bookmarks event handlers (if bookmarks permission is granted)
try {
  chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    logEvent("INFO", `Bookmark created: ${bookmark.title}`);
  });
} catch (e) {
  // Bookmarks permission not granted
  console.log("Bookmarks permission not granted:", e);
}

// Scripting permission handlers (if scripting permission is granted)
try {
  // Function to execute script in active tab
  const executeScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        try {
          // Execute a script in the active tab
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: () => {
              // This runs in the context of the tab
              console.log('Script executed by extension in page context!');
              
              // Change page background color slightly to indicate script execution
              // This is just a visual demonstration that can be removed
              const originalColor = document.body.style.backgroundColor;
              document.body.style.backgroundColor = '#f8f9fa';
              
              // Restore original color after 1 second
              setTimeout(() => {
                document.body.style.backgroundColor = originalColor;
              }, 1000);
              
              return {
                title: document.title,
                url: window.location.href,
                timestamp: new Date().toISOString()
              };
            }
          }, (results) => {
            if (chrome.runtime.lastError) {
              logEvent("ERROR", `Script execution failed: ${chrome.runtime.lastError.message}`);
            } else if (results && results[0]) {
              logEvent("INFO", `Script executed in tab ${tabId}: ${results[0].result.title}`);
              
              // Show a notification if notifications permission is granted
              try {
                chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'icons/icon48.png',
                  title: 'Script Executed',
                  message: `Script successfully ran in: ${results[0].result.title}`,
                  priority: 1
                });
              } catch (notificationError) {
                console.log("Notification could not be shown:", notificationError);
              }
            }
          });
        } catch (error) {
          logEvent("ERROR", `Failed to execute script: ${error.message}`);
        }
      }
    });
  };
  
  // Add a command listener for keyboard shortcut (if defined in manifest)
  chrome.commands.onCommand.addListener((command) => {
    if (command === "execute-script") {
      executeScript();
    }
  });
  
} catch (e) {
  // Scripting permission not granted
  console.log("Scripting permission not granted:", e);
}

// Initialize when service worker starts
initializeExtensionData();

// Log service worker startup
logEvent("INFO", "Background service worker started");
