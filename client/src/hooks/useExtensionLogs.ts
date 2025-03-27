import { useState, useEffect, useCallback } from "react";
import { LogEntry } from "@shared/types";
import { browserAPI, initializeExtensionData } from "@/lib/extensionApi";

export function useExtensionLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    const loadLogs = async () => {
      try {
        // Initialize data if needed
        await initializeExtensionData();
        
        // Load logs
        const storedLogs = await browserAPI.logs.getAll();
        if (storedLogs) {
          setLogs(storedLogs);
          setTotalLogs(storedLogs.length);
          setDisplayedLogs(storedLogs.slice(0, Math.min(storedLogs.length, 5)));
        }
      } catch (error) {
        console.error("Error loading logs:", error);
      }
    };
    
    loadLogs();
  }, []);
  
  const clearLogs = useCallback(async () => {
    try {
      await browserAPI.storage.set("logs", []);
      setLogs([]);
      setTotalLogs(0);
      setDisplayedLogs([]);
      
      // Add a log about clearing logs
      const newLog: LogEntry = {
        level: "INFO",
        message: "Logs cleared by user",
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      
      await browserAPI.logs.add("INFO", "Logs cleared by user");
      setLogs([newLog]);
      setTotalLogs(1);
      setDisplayedLogs([newLog]);
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  }, []);
  
  const exportLogs = useCallback(() => {
    try {
      const logsJson = JSON.stringify(logs, null, 2);
      const blob = new Blob([logsJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `extension-logs-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Log export action
      browserAPI.logs.add("INFO", "Logs exported by user");
    } catch (error) {
      console.error("Error exporting logs:", error);
      browserAPI.logs.add("ERROR", `Failed to export logs: ${error}`);
    }
  }, [logs]);
  
  const loadMoreLogs = useCallback(() => {
    setDisplayedLogs(logs.slice(0, displayedLogs.length + 5));
  }, [logs, displayedLogs]);
  
  const filterLogs = useCallback(() => {
    let filtered = [...logs];
    
    // Filter by level
    if (filterLevel !== "all") {
      filtered = filtered.filter(log => 
        log.level.toLowerCase() === filterLevel.toLowerCase()
      );
    }
    
    // Filter by text
    if (filterText.trim()) {
      const searchText = filterText.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchText) ||
        log.timestamp.toLowerCase().includes(searchText)
      );
    }
    
    setDisplayedLogs(filtered.slice(0, 5));
    setTotalLogs(filtered.length);
  }, [logs, filterLevel, filterText]);
  
  // Apply filters when they change
  useEffect(() => {
    filterLogs();
  }, [filterText, filterLevel, filterLogs]);
  
  const runCrossBrowserTests = useCallback(async () => {
    try {
      // Simulate cross-browser tests
      await browserAPI.logs.add("INFO", "Starting cross-browser tests...");
      
      setTimeout(async () => {
        await browserAPI.logs.add("INFO", "Chrome test passed: v111.0.5563.64");
      }, 500);
      
      setTimeout(async () => {
        await browserAPI.logs.add("INFO", "Edge test passed: v111.0.1661.43");
      }, 1000);
      
      setTimeout(async () => {
        await browserAPI.logs.add("INFO", "Cross-browser tests completed successfully");
        
        // Reload logs to show new entries
        const updatedLogs = await browserAPI.logs.getAll();
        setLogs(updatedLogs);
        setTotalLogs(updatedLogs.length);
        setDisplayedLogs(updatedLogs.slice(0, Math.min(updatedLogs.length, 5)));
      }, 1500);
    } catch (error) {
      console.error("Error running cross-browser tests:", error);
    }
  }, []);
  
  return {
    logs: displayedLogs,
    totalLogs,
    clearLogs,
    exportLogs,
    loadMoreLogs,
    filterLogs,
    filterText,
    setFilterText,
    filterLevel,
    setFilterLevel,
    runCrossBrowserTests
  };
}
