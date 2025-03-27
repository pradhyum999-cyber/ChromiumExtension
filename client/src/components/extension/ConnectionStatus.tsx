import { CheckCircle } from "lucide-react";
import { useBrowserInfo } from "@/hooks/useExtensionFeatures";

export default function ConnectionStatus() {
  const { browserName, browserVersion } = useBrowserInfo();

  return (
    <div className="px-4 py-2 bg-neutral-light flex items-center justify-between">
      <div className="flex items-center">
        <CheckCircle className="text-secondary h-4 w-4 mr-1" />
        <span className="text-sm">Connected</span>
      </div>
      <div className="text-xs flex items-center">
        <span className="bg-secondary/10 text-secondary px-2 py-1 rounded">{browserName}</span>
        <span className="ml-2 text-neutral-dark">v3.0.1</span>
      </div>
    </div>
  );
}
