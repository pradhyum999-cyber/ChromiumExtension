import { useState } from "react";
import Header from "@/components/extension/Header";
import Footer from "@/components/extension/Footer";
import { useExtensionPermissions } from "@/hooks/useExtensionPermissions";

export default function Home() {
  // Function to open the CRM test page in a new tab
  const openCRMTestPage = () => {
    window.open('/crm-test.html', '_blank');
  };
  
  const { permissions, requestPermission } = useExtensionPermissions();

  return (
    <div className="w-[380px] min-h-[580px] flex flex-col bg-background text-neutral-dark">
      <Header />
      
      <div className="p-4 flex-1">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700 mb-2">Dynamics CRM Helper</h1>
          <p className="text-sm text-gray-600">
            Automate data entry in Dynamics CRM forms
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">How to Use</h2>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
            <li>Open any Dynamics CRM form in your browser</li>
            <li>Click the extension icon in your browser toolbar</li>
            <li>Select the data template you want to use</li>
            <li>Click "Fill Form" to populate the CRM fields</li>
          </ol>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Required Permissions</h2>
          <div className="text-sm text-gray-700 space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 p-1 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <p className="font-medium">Access to Dynamics CRM domains</p>
                <p className="text-xs text-gray-500">Allows the extension to interact with Dynamics CRM forms</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 p-1 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div>
                <p className="font-medium">Scripting</p>
                <p className="text-xs text-gray-500">Needed to fill form fields in Dynamics CRM</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => requestPermission("scripting")}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            Grant Permissions
          </button>
        </div>
        
        {/* CRM Testing UI */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-5 text-white">
          <h2 className="text-xl font-bold mb-3">Test Environment</h2>
          <p className="text-sm mb-4 opacity-90">
            Try our simulated Dynamics CRM environment to test the form filling functionality.
          </p>
          <button
            onClick={openCRMTestPage}
            className="w-full bg-white text-blue-700 hover:bg-blue-50 py-2.5 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
          >
            <span className="mr-2">Open CRM Test Page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
              <path d="M15 3h6v6"></path>
              <path d="M10 14L21 3"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
