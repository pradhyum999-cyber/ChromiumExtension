import { BrowserFeatures, ExtensionPermission, LogEntry } from "@shared/types";

// This file provides an abstraction layer for browser extension APIs
// In a real extension, these functions would use the WebExtensions API
// For this demo version, we'll mock the functionality for demonstration purposes

// Browser abstraction
export const browserAPI = {
  // Storage API abstraction
  storage: {
    get: async <T>(key: string): Promise<T | null> => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error("Error getting data from storage:", error);
        return null;
      }
    },
    
    set: async <T>(key: string, value: T): Promise<boolean> => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error("Error setting data to storage:", error);
        return false;
      }
    },
    
    remove: async (key: string): Promise<boolean> => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error("Error removing data from storage:", error);
        return false;
      }
    }
  },
  
  // Permissions API abstraction
  permissions: {
    request: async (permission: string): Promise<boolean> => {
      console.log(`Requesting permission: ${permission}`);
      
      // Check if we're in an extension environment
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "requestPermission", permission },
            (response) => {
              console.log("Request permission response:", response);
              if (response && response.success) {
                resolve(true);
              } else {
                console.error("Permission request failed:", response?.message || "User denied permission");
                resolve(false);
              }
            }
          );
        });
      } else {
        // Fallback for development environment
        return new Promise(resolve => {
          setTimeout(() => resolve(true), 500);
        });
      }
    },
    
    check: async (permission: string): Promise<boolean> => {
      // In extension environment, check with real permissions API
      if (typeof chrome !== 'undefined' && chrome.permissions) {
        return new Promise((resolve) => {
          chrome.permissions.contains(
            { permissions: [permission] },
            (result) => {
              resolve(result);
            }
          );
        });
      } else {
        // Fallback for development environment
        const permissions = await browserAPI.storage.get<Record<string, boolean>>("permissions");
        return permissions?.[permission] || false;
      }
    },
    
    getAll: async (): Promise<Record<string, boolean>> => {
      // In extension environment, use real permissions API
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "getPermissions" },
            (response) => {
              if (response) {
                resolve(response);
              } else {
                // Fallback to local storage if messaging fails
                browserAPI.storage.get<Record<string, boolean>>("permissions")
                  .then(perms => resolve(perms || {}));
              }
            }
          );
        });
      } else {
        // Fallback for development environment
        return await browserAPI.storage.get<Record<string, boolean>>("permissions") || {};
      }
    },
    
    toggle: async (permission: string): Promise<boolean> => {
      console.log(`Toggling permission: ${permission}`);
      
      // In extension environment, use messaging API
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { action: "togglePermission", permission },
            (response) => {
              console.log("Toggle permission response:", response);
              if (response && response.success) {
                resolve(true);
              } else {
                console.error("Permission toggle failed:", response?.message || "Unknown error");
                resolve(false);
              }
            }
          );
        });
      } else {
        // Fallback for development environment
        const permissions = await browserAPI.storage.get<Record<string, boolean>>("permissions") || {};
        permissions[permission] = !permissions[permission];
        return await browserAPI.storage.set("permissions", permissions);
      }
    }
  },
  
  // Features API abstraction
  features: {
    getAll: async (): Promise<BrowserFeatures> => {
      // Get stored features or return defaults
      const features = await browserAPI.storage.get<BrowserFeatures>("features");
      if (features) return features;
      
      // Default features
      const defaultFeatures: BrowserFeatures = {
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
      };
      
      await browserAPI.storage.set("features", defaultFeatures);
      return defaultFeatures;
    },
    
    toggleFeature: async (featureKey: keyof BrowserFeatures): Promise<BrowserFeatures> => {
      const features = await browserAPI.features.getAll();
      if (features[featureKey]) {
        features[featureKey].enabled = !features[featureKey].enabled;
        await browserAPI.storage.set("features", features);
      }
      return features;
    },
    
    updateFeature: async <K extends keyof BrowserFeatures>(
      featureKey: K, 
      updates: Partial<BrowserFeatures[K]>
    ): Promise<BrowserFeatures> => {
      const features = await browserAPI.features.getAll();
      if (features[featureKey]) {
        features[featureKey] = { ...features[featureKey], ...updates };
        await browserAPI.storage.set("features", features);
      }
      return features;
    }
  },
  
  // Logs API abstraction
  logs: {
    getAll: async (): Promise<LogEntry[]> => {
      const logs = await browserAPI.storage.get<LogEntry[]>("logs");
      return logs || [];
    },
    
    add: async (level: "INFO" | "WARNING" | "ERROR", message: string): Promise<LogEntry[]> => {
      const logs = await browserAPI.logs.getAll();
      const newLog: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      
      logs.unshift(newLog);
      await browserAPI.storage.set("logs", logs);
      return logs;
    },
    
    clear: async (): Promise<boolean> => {
      return await browserAPI.storage.set("logs", []);
    }
  },
  
  // Notifications API abstraction
  notifications: {
    create: async (title: string, message: string, type: 'basic' | 'image' | 'list' | 'progress' = 'basic'): Promise<boolean> => {
      console.log(`Showing notification: ${title} - ${message}`);
      
      // If in extension environment
      if (typeof chrome !== 'undefined' && chrome.notifications) {
        return new Promise((resolve) => {
          chrome.notifications.create({
            type,
            iconUrl: 'icons/icon48.png',
            title,
            message,
            priority: 1
          }, (notificationId) => {
            if (chrome.runtime.lastError) {
              console.error("Error showing notification:", chrome.runtime.lastError);
              resolve(false);
            } else {
              // Log notification
              browserAPI.logs.add("INFO", `Notification shown: ${title}`);
              resolve(true);
            }
          });
        });
      } else {
        // Fallback for development environment
        console.log(`Notification (mock): ${title} - ${message}`);
        
        // Show a browser notification if supported
        if ("Notification" in window) {
          try {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification(title, { body: message });
              }
            });
          } catch (error) {
            console.error("Error showing browser notification:", error);
          }
        }
        
        await browserAPI.logs.add("INFO", `Notification shown (mock): ${title}`);
        return true;
      }
    },
    
    clear: async (notificationId?: string): Promise<boolean> => {
      if (typeof chrome !== 'undefined' && chrome.notifications) {
        return new Promise((resolve) => {
          if (notificationId) {
            chrome.notifications.clear(notificationId, (wasCleared) => {
              resolve(wasCleared);
            });
          } else {
            // No ID provided, we can't clear all notifications with the API
            resolve(false);
          }
        });
      } else {
        // Nothing to do in development environment
        return true;
      }
    }
  }
};

// Function to execute a script in the active tab
export const executeScript = async (scriptFunction?: () => any): Promise<any> => {
  console.log('Executing script in active tab');
  
  // Check if we're in extension environment
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "executeScript", scriptFunction },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (response && response.success) {
            resolve(response.result);
          } else {
            reject(response?.error || 'Unknown error executing script');
          }
        }
      );
    });
  } else {
    // Fallback for development environment
    console.log('Not in extension environment, mocking script execution');
    return {
      title: 'Mock Page Title',
      url: 'https://example.com',
      success: true,
      message: 'Script execution simulated in development environment'
    };
  }
};

// Initialize default data if not present
export const initializeExtensionData = async () => {
  // Initialize features
  if (!(await browserAPI.storage.get("features"))) {
    const defaultFeatures: BrowserFeatures = {
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
    };
    await browserAPI.storage.set("features", defaultFeatures);
  }
  
  // Initialize permissions
  if (!(await browserAPI.storage.get("permissions"))) {
    const defaultPermissions: Record<ExtensionPermission, boolean> = {
      storage: true,
      tabs: true,
      cookies: false,
      webNavigation: false,
      scripting: false,
      bookmarks: false,
      notifications: false
    };
    await browserAPI.storage.set("permissions", defaultPermissions);
  }
  
  // Initialize logs
  if (!(await browserAPI.storage.get("logs"))) {
    const defaultLogs: LogEntry[] = [
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
    await browserAPI.storage.set("logs", defaultLogs);
  }
};
