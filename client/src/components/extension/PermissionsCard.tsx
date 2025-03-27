import { Switch } from "@/components/ui/switch";

interface PermissionsCardProps {
  icon: string;
  title: string;
  description: string;
  status: "In Use" | "Pending" | "Disabled";
  metricLabel?: string;
  metricValue?: string;
  permissionDate?: string;
  isEnabled: boolean;
  onToggle: () => void;
  onRequest?: () => void;
  domains?: string[];
}

export default function PermissionsCard({
  icon,
  title,
  description,
  status,
  metricLabel,
  metricValue,
  permissionDate,
  isEnabled,
  onToggle,
  onRequest,
  domains
}: PermissionsCardProps) {
  // Status colors
  const statusColors = {
    "In Use": "bg-secondary/10 text-secondary",
    "Pending": "bg-warning/10 text-warning",
    "Disabled": "bg-accent/10 text-accent"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-3 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className={`material-icons text-warning mr-2`}>{icon}</span>
            <h3 className="font-medium">{title}</h3>
          </div>
          <span className={`text-xs ${statusColors[status]} px-2 py-1 rounded`}>{status}</span>
        </div>
        
        <p className="text-sm text-neutral-dark mb-3">{description}</p>
        
        <div className="text-xs bg-neutral-light/50 p-2 rounded">
          {metricLabel && metricValue && (
            <div className="flex items-center justify-between">
              <span>{metricLabel}</span>
              <span className="text-primary font-medium">{metricValue}</span>
            </div>
          )}
          
          {domains && (
            <div className="flex flex-col">
              <span className="mb-1">Requested domains:</span>
              <div className="flex flex-wrap gap-1">
                {domains.map((domain, index) => (
                  <span key={index} className="bg-white px-2 py-1 rounded border border-neutral-light">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-neutral-light/30 px-4 py-2 text-xs flex justify-between items-center">
        {status === "In Use" ? (
          <span>Permission granted: <span>{permissionDate}</span></span>
        ) : (
          <button className="text-primary" onClick={onRequest}>Request Access</button>
        )}
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
