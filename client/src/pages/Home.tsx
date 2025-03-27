import { useState } from "react";
import Header from "@/components/extension/Header";
import ConnectionStatus from "@/components/extension/ConnectionStatus";
import TabNavigation from "@/components/extension/TabNavigation";
import FeatureToggleCard from "@/components/extension/FeatureToggleCard";
import PerformanceCard from "@/components/extension/PerformanceCard";
import OptimizationCard from "@/components/extension/OptimizationCard";
import BrowserSpecificCard from "@/components/extension/BrowserSpecificCard";
import PermissionsCard from "@/components/extension/PermissionsCard";
import LogsTab from "@/components/extension/LogsTab";
import Footer from "@/components/extension/Footer";
import { useExtensionFeatures } from "@/hooks/useExtensionFeatures";
import { useExtensionPermissions } from "@/hooks/useExtensionPermissions";
import { Plus } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("features");
  const { features, toggleFeature } = useExtensionFeatures();
  const { permissions, togglePermission, requestPermission } = useExtensionPermissions();

  return (
    <div className="w-[380px] min-h-[580px] flex flex-col bg-background text-neutral-dark">
      <Header />
      <ConnectionStatus />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="p-4 flex-1">
        {/* Features Tab */}
        {activeTab === "features" && (
          <div>
            <h2 className="text-base font-medium mb-4">Extension Features</h2>
            
            <FeatureToggleCard
              title="Content Script"
              description="Inject scripts into web pages"
              isEnabled={features.contentScript.enabled}
              onToggle={() => toggleFeature("contentScript")}
              domains={features.contentScript.domains}
              lastActivated="2 mins ago"
            />
            
            <FeatureToggleCard
              title="Background Services"
              description="Run background tasks"
              isEnabled={features.backgroundServices.enabled}
              onToggle={() => toggleFeature("backgroundServices")}
              serviceInfo="Service Workers"
              serviceStatus="Running"
              metricLabel="Memory usage:"
              metricValue="24.7 MB"
            />
            
            <FeatureToggleCard
              title="Browser API Integration"
              description="Interact with browser features"
              isEnabled={features.browserApi.enabled}
              onToggle={() => toggleFeature("browserApi")}
              apis={features.browserApi.apis}
              metricLabel="API calls:"
              metricValue="147 today"
            />
            
            <button className="w-full bg-neutral-light text-neutral-dark py-2 px-4 rounded flex items-center justify-center hover:bg-neutral-light/80 transition-colors">
              <Plus className="h-4 w-4 mr-1" />
              Add Custom Feature
            </button>
          </div>
        )}
        
        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div>
            <h2 className="text-base font-medium mb-4">Performance Metrics</h2>
            
            <PerformanceCard />
            <OptimizationCard />
            <BrowserSpecificCard />
          </div>
        )}
        
        {/* Permissions Tab */}
        {activeTab === "permissions" && (
          <div>
            <h2 className="text-base font-medium mb-4">Extension Permissions</h2>
            
            <PermissionsCard
              icon="storage"
              title="Storage"
              description="Store and retrieve data locally or sync across devices."
              status="In Use"
              metricLabel="Used storage:"
              metricValue="128 KB / 5 MB"
              permissionDate="Mar 15, 2023"
              isEnabled={permissions.storage}
              onToggle={() => togglePermission("storage")}
            />
            
            <PermissionsCard
              icon="tab"
              title="Tabs"
              description="Create, modify, and rearrange tabs in browser windows."
              status="In Use"
              metricLabel="Tab interactions:"
              metricValue="27 today"
              permissionDate="Mar 15, 2023"
              isEnabled={permissions.tabs}
              onToggle={() => togglePermission("tabs")}
            />
            
            <PermissionsCard
              icon="cookie"
              title="Cookies"
              description="Get and set browser cookies on specific domains."
              status="Pending"
              domains={["example.com", "api.example.com"]}
              isEnabled={permissions.cookies}
              onToggle={() => togglePermission("cookies")}
              onRequest={() => requestPermission("cookies")}
            />
            
            <PermissionsCard
              icon="http"
              title="Network Requests"
              description="Make network requests to specified domains."
              status="Disabled"
              domains={["api.example.com", "cdn.example.com"]}
              isEnabled={permissions.network}
              onToggle={() => togglePermission("network")}
              onRequest={() => requestPermission("network")}
            />
            
            <div className="text-xs text-neutral-dark bg-neutral-light p-3 rounded mt-4">
              <div className="flex items-start">
                <span className="material-icons text-warning text-sm mr-2">info</span>
                <p>Extensions using Manifest V3 require explicit permission grants from users. Keep permissions to a minimum for better user privacy and security.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Logs Tab */}
        {activeTab === "logs" && <LogsTab />}
      </div>
      
      <Footer />
    </div>
  );
}
