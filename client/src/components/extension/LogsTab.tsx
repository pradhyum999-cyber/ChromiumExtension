import { useState } from "react";
import { Trash, Download, Search, RefreshCw } from "lucide-react";
import { useExtensionLogs } from "@/hooks/useExtensionLogs";

export default function LogsTab() {
  const { 
    logs, 
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
  } = useExtensionLogs();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-medium">Extension Logs</h2>
        <div className="flex space-x-2">
          <button 
            className="text-xs bg-neutral-light px-2 py-1 rounded flex items-center" 
            onClick={clearLogs}
          >
            <Trash className="h-3 w-3 mr-1" />
            Clear
          </button>
          <button 
            className="text-xs bg-neutral-light px-2 py-1 rounded flex items-center" 
            onClick={exportLogs}
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* Log Filter */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1.5 h-4 w-4 text-neutral-dark" />
          <input 
            type="text" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter logs..." 
            className="pl-8 pr-3 py-1 w-full border border-neutral-light rounded text-sm"
          />
        </div>
        <select 
          className="border border-neutral-light rounded px-2 py-1 text-sm"
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="all">All levels</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
      
      {/* Log Entries */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
        <div className="max-h-64 overflow-y-auto font-mono text-xs">
          {logs.map((log, index) => (
            <div key={index} className="border-b border-neutral-light p-3 hover:bg-neutral-light/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className={`material-icons text-sm ${
                    log.level === 'INFO' ? 'text-secondary' : 
                    log.level === 'WARNING' ? 'text-warning' : 'text-accent'
                  } mr-1`}>
                    {log.level === 'INFO' ? 'info' : 
                     log.level === 'WARNING' ? 'warning' : 'error'}
                  </span>
                  <span className="font-medium">{log.level}</span>
                </div>
                <span className="text-neutral-dark">{log.timestamp}</span>
              </div>
              <p className="mt-1 break-all">{log.message}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-neutral-light/30 px-4 py-2 text-xs flex justify-between items-center">
          <span>Showing <span>{logs.length}</span> of <span>{totalLogs}</span> logs</span>
          <button className="text-primary" onClick={loadMoreLogs}>Load more</button>
        </div>
      </div>
      
      {/* Cross-Browser Testing */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="font-medium mb-3">Cross-Browser Testing</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-1">check_circle</span>
              <span>Chrome</span>
            </div>
            <span>v111.0.5563.64</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="material-icons text-secondary mr-1">check_circle</span>
              <span>Edge</span>
            </div>
            <span>v111.0.1661.43</span>
          </div>
          
          <button 
            className="w-full mt-2 bg-primary text-white py-1.5 px-3 rounded text-sm flex items-center justify-center"
            onClick={runCrossBrowserTests}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Run Cross-Browser Tests
          </button>
        </div>
      </div>
    </div>
  );
}
