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
  // Function to open the CRM test page in a new tab
  const openCRMTestPage = () => {
    window.open('/crm-test.html', '_blank');
  };
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
              title="Web Navigation"
              description="Monitor browser navigation events."
              status="Disabled"
              domains={["api.example.com", "cdn.example.com"]}
              isEnabled={permissions.webNavigation}
              onToggle={() => togglePermission("webNavigation")}
              onRequest={() => requestPermission("webNavigation")}
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
        
        {/* CRM Testing UI */}
        {activeTab === "features" && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Dynamics CRM Integration</h3>
            <p className="text-xs text-gray-600 mb-2">
              Test the extension's ability to inject data into Dynamics CRM forms.
            </p>
            <button
              onClick={openCRMTestPage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-sm flex items-center justify-center"
            >
              <span className="mr-1">Open CRM Test Page</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                <path d="M15 3h6v6"></path>
                <path d="M10 14L21 3"></path>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
