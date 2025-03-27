import { useState, useEffect, useCallback } from "react";
import { ExtensionPermission } from "@shared/types";
import { browserAPI, initializeExtensionData } from "@/lib/extensionApi";

export function useExtensionPermissions() {
  const [permissions, setPermissions] = useState<Record<ExtensionPermission, boolean>>({
    storage: true,
    tabs: true,
    cookies: false,
    network: false
  });
  
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        // Initialize data if needed
        await initializeExtensionData();
        
        // Load permissions
        const storedPermissions = await browserAPI.permissions.getAll();
        if (storedPermissions) {
          setPermissions(storedPermissions as Record<ExtensionPermission, boolean>);
        }
      } catch (error) {
        console.error("Error loading permissions:", error);
      }
    };
    
    loadPermissions();
  }, []);
  
  const togglePermission = useCallback(async (permission: ExtensionPermission) => {
    try {
      const updatedPermissions = { ...permissions };
      updatedPermissions[permission] = !updatedPermissions[permission];
      
      await browserAPI.storage.set("permissions", updatedPermissions);
      setPermissions(updatedPermissions);
      
      // Log this action
      await browserAPI.logs.add(
        "INFO", 
        `Permission '${permission}' ${updatedPermissions[permission] ? 'enabled' : 'disabled'}.`
      );
    } catch (error) {
      console.error(`Error toggling permission ${permission}:`, error);
      
      // Log error
      await browserAPI.logs.add(
        "ERROR", 
        `Failed to toggle permission '${permission}': ${error}`
      );
    }
  }, [permissions]);
  
  const requestPermission = useCallback(async (permission: ExtensionPermission) => {
    try {
      // In a real extension, this would show a browser permission prompt
      // For this demo, we'll simulate permission requests
      await browserAPI.logs.add(
        "INFO", 
        `Requesting '${permission}' permission from user.`
      );
      
      // Simulate permission request approval
      setTimeout(async () => {
        const updatedPermissions = { ...permissions };
        updatedPermissions[permission] = true;
        
        await browserAPI.storage.set("permissions", updatedPermissions);
        setPermissions(updatedPermissions);
        
        await browserAPI.logs.add(
          "INFO", 
          `Permission '${permission}' granted by user.`
        );
      }, 1000);
    } catch (error) {
      console.error(`Error requesting permission ${permission}:`, error);
      
      // Log error
      await browserAPI.logs.add(
        "ERROR", 
        `Failed to request permission '${permission}': ${error}`
      );
    }
  }, [permissions]);
  
  return {
    permissions,
    togglePermission,
    requestPermission
  };
}
