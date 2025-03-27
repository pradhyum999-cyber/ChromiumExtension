import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface FeatureToggleCardProps {
  title: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
  domains?: string[];
  lastActivated?: string;
  serviceInfo?: string;
  serviceStatus?: string;
  apis?: string[];
  metricLabel?: string;
  metricValue?: string;
}

export default function FeatureToggleCard({
  title,
  description,
  isEnabled,
  onToggle,
  domains,
  lastActivated,
  serviceInfo,
  serviceStatus,
  apis,
  metricLabel,
  metricValue
}: FeatureToggleCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-neutral-dark mt-1">{description}</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={onToggle} />
        </div>
        
        {domains && (
          <div className="mt-3 text-xs bg-neutral-light/50 p-2 rounded">
            <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-1">
              <span>Domains</span>
              <span className="text-secondary">{domains.length} active</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {domains.map((domain, index) => (
                <span key={index} className="bg-white px-2 py-1 rounded border border-neutral-light">
                  {domain}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {serviceInfo && serviceStatus && (
          <div className="mt-3 text-xs bg-neutral-light/50 p-2 rounded">
            <div className="flex items-center justify-between">
              <span>{serviceInfo}</span>
              <span className="text-secondary">{serviceStatus}</span>
            </div>
          </div>
        )}
        
        {apis && (
          <div className="mt-3 text-xs bg-neutral-light/50 p-2 rounded">
            <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-1">
              <span>APIs</span>
              <span className="text-secondary">{apis.length} active</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {apis.map((api, index) => (
                <span key={index} className="bg-white px-2 py-1 rounded border border-neutral-light">
                  {api}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-neutral-light/30 px-4 py-2 text-xs flex justify-between items-center">
        <span>{metricLabel || "Last activated:"} <span>{metricValue || lastActivated}</span></span>
        <button className="text-primary flex items-center">
          Configure
          <ChevronRight className="h-3 w-3 ml-1" />
        </button>
      </div>
    </div>
  );
}
