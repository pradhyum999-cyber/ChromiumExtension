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
      // In a real extension, this would use browser.permissions.request
      console.log(`Requesting permission: ${permission}`);
      return new Promise(resolve => {
        setTimeout(() => resolve(true), 500);
      });
    },
    
    check: async (permission: string): Promise<boolean> => {
      // In a real extension, this would use browser.permissions.contains
      const permissions = await browserAPI.storage.get<Record<string, boolean>>("permissions");
      return permissions?.[permission] || false;
    },
    
    getAll: async (): Promise<Record<string, boolean>> => {
      // In a real extension, this would use browser.permissions.getAll
      return await browserAPI.storage.get<Record<string, boolean>>("permissions") || {};
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
      network: false
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
