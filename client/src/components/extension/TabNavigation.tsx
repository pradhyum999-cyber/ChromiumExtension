import { useState } from "react";

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { id: "features", label: "Features" },
    { id: "performance", label: "Performance" },
    { id: "permissions", label: "Permissions" },
    { id: "logs", label: "Logs" },
  ];

  return (
    <div className="bg-white border-b flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            flex-1 py-3 border-b-2 text-sm
            ${activeTab === tab.id ? "border-primary font-medium text-primary" : "border-transparent text-neutral-dark"}
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
