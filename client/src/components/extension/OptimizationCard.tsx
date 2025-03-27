import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function OptimizationCard() {
  const [optimizations, setOptimizations] = useState({
    backgroundThrottling: true,
    cacheManagement: true,
    lazyLoading: false,
  });

  const toggleOptimization = (setting: keyof typeof optimizations) => {
    setOptimizations(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
      <h3 className="font-medium mb-3">Optimization Settings</h3>
      
      <div className="space-y-3">
        {/* Background Throttling */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Background Throttling</h4>
            <p className="text-xs text-neutral-dark">Limit background activity when inactive</p>
          </div>
          <Switch 
            checked={optimizations.backgroundThrottling} 
            onCheckedChange={() => toggleOptimization('backgroundThrottling')}
          />
        </div>
        
        {/* Cache Management */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Cache Management</h4>
            <p className="text-xs text-neutral-dark">Optimize data storage usage</p>
          </div>
          <Switch 
            checked={optimizations.cacheManagement} 
            onCheckedChange={() => toggleOptimization('cacheManagement')}
          />
        </div>
        
        {/* Lazy Loading */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Lazy Loading</h4>
            <p className="text-xs text-neutral-dark">Load resources only when needed</p>
          </div>
          <Switch 
            checked={optimizations.lazyLoading} 
            onCheckedChange={() => toggleOptimization('lazyLoading')}
          />
        </div>
      </div>
    </div>
  );
}
