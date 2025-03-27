import { useState, useEffect } from "react";

export default function PerformanceCard() {
  const [metrics, setMetrics] = useState({
    cpuUsage: "3.2%",
    cpuPercentage: 3.2,
    memoryUsage: "24.7 MB",
    memoryPercentage: 12.5,
    networkRequests: "7 / min",
    networkPercentage: 35,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
      <h3 className="font-medium mb-3">Resource Usage</h3>
      
      <div className="space-y-3">
        {/* CPU Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>CPU Usage</span>
            <span>{metrics.cpuUsage}</span>
          </div>
          <div className="w-full bg-neutral-light/50 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${metrics.cpuPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Memory Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Memory Usage</span>
            <span>{metrics.memoryUsage}</span>
          </div>
          <div className="w-full bg-neutral-light/50 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${metrics.memoryPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Network Requests */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Network Requests</span>
            <span>{metrics.networkRequests}</span>
          </div>
          <div className="w-full bg-neutral-light/50 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${metrics.networkPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
