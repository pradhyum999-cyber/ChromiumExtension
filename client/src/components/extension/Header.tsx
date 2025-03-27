import { Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-primary text-white p-4 flex items-center justify-between">
      <div className="flex items-center">
        <span className="material-icons mr-2">extension</span>
        <h1 className="text-lg font-medium">WebExtension Dashboard</h1>
      </div>
      <div className="flex items-center">
        <button 
          id="settingsBtn" 
          className="p-1 rounded hover:bg-white/10 transition-colors" 
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
