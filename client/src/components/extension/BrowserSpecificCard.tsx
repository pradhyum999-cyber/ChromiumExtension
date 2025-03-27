import { useState } from "react";
import { useBrowserInfo } from "@/hooks/useExtensionFeatures";

export default function BrowserSpecificCard() {
  const [selectedBrowser, setSelectedBrowser] = useState("chrome");
  const { browserName, browserVersion, detectBrowser } = useBrowserInfo();

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
      <div className="p-4">
        <h3 className="font-medium mb-2">Browser-Specific Optimizations</h3>
        
        <div className="flex border rounded-lg overflow-hidden">
          <button 
            className={`flex-1 py-2 text-sm ${selectedBrowser === 'chrome' ? 'bg-primary text-white' : 'bg-white text-neutral-dark'}`}
            onClick={() => setSelectedBrowser('chrome')}
          >
            Chrome
          </button>
          <button 
            className={`flex-1 py-2 text-sm ${selectedBrowser === 'edge' ? 'bg-primary text-white' : 'bg-white text-neutral-dark'}`}
            onClick={() => setSelectedBrowser('edge')}
          >
            Edge
          </button>
        </div>
        
        <div className="mt-3 text-sm">
          {selectedBrowser === 'chrome' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span>Event Page Model</span>
                <span className="text-secondary">Enabled</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span>Chrome Storage Sync</span>
                <span className="text-secondary">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Chrome Identity API</span>
                <span className="text-accent">Disabled</span>
              </div>
            </>
          )}
          
          {selectedBrowser === 'edge' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span>Edge Extension API</span>
                <span className="text-secondary">Enabled</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span>EdgeHTML Compatibility</span>
                <span className="text-secondary">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Microsoft Account Integration</span>
                <span className="text-accent">Disabled</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-neutral-light/30 px-4 py-2 text-xs flex justify-between items-center">
        <span>{browserName} version: <span>{browserVersion}</span></span>
        <button className="text-primary" onClick={detectBrowser}>Re-detect browser</button>
      </div>
    </div>
  );
}
