import { useState, useEffect, useCallback } from "react";
import { BrowserFeatures } from "@shared/types";
import { browserAPI, initializeExtensionData } from "@/lib/extensionApi";
import { detectBrowser } from "@/lib/browserDetection";

// Hook for browser detection
export function useBrowserInfo() {
  const [browserInfo, setBrowserInfo] = useState({
    browserName: "Chrome",
    browserVersion: "111.0.5563.64"
  });
  
  const detectBrowserInfo = useCallback(() => {
    const info = detectBrowser();
    setBrowserInfo({
      browserName: info.name,
      browserVersion: info.version
    });
  }, []);
  
  useEffect(() => {
    detectBrowserInfo();
  }, [detectBrowserInfo]);
  
  return {
    ...browserInfo,
    detectBrowser: detectBrowserInfo
  };
}

// Hook for extension features
export function useExtensionFeatures() {
  const [features, setFeatures] = useState<BrowserFeatures>({
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
  });
  
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        // Initialize data if needed
        await initializeExtensionData();
        
        // Load features
        const storedFeatures = await browserAPI.features.getAll();
        if (storedFeatures) {
          setFeatures(storedFeatures);
        }
      } catch (error) {
        console.error("Error loading features:", error);
      }
    };
    
    loadFeatures();
  }, []);
  
  const toggleFeature = useCallback(async (featureKey: keyof BrowserFeatures) => {
    try {
      const updatedFeatures = await browserAPI.features.toggleFeature(featureKey);
      setFeatures({ ...updatedFeatures });
      
      // Log this action
      await browserAPI.logs.add(
        "INFO", 
        `Feature '${featureKey}' ${updatedFeatures[featureKey].enabled ? 'enabled' : 'disabled'}.`
      );
    } catch (error) {
      console.error(`Error toggling feature ${featureKey}:`, error);
      
      // Log error
      await browserAPI.logs.add(
        "ERROR", 
        `Failed to toggle feature '${featureKey}': ${error}`
      );
    }
  }, []);
  
  const updateFeature = useCallback(async <K extends keyof BrowserFeatures>(
    featureKey: K,
    updates: Partial<BrowserFeatures[K]>
  ) => {
    try {
      const updatedFeatures = await browserAPI.features.updateFeature(featureKey, updates);
      setFeatures({ ...updatedFeatures });
      
      // Log this action
      await browserAPI.logs.add(
        "INFO", 
        `Feature '${featureKey}' updated.`
      );
    } catch (error) {
      console.error(`Error updating feature ${featureKey}:`, error);
      
      // Log error
      await browserAPI.logs.add(
        "ERROR", 
        `Failed to update feature '${featureKey}': ${error}`
      );
    }
  }, []);
  
  return {
    features,
    toggleFeature,
    updateFeature
  };
}
