// Feature types
export interface ContentScriptFeature {
  enabled: boolean;
  domains: string[];
}

export interface BackgroundServiceFeature {
  enabled: boolean;
  memoryUsage: string;
}

export interface BrowserApiFeature {
  enabled: boolean;
  apis: string[];
  apiCalls: string;
}

export interface BrowserFeatures {
  contentScript: ContentScriptFeature;
  backgroundServices: BackgroundServiceFeature;
  browserApi: BrowserApiFeature;
}

// Permission types
export type ExtensionPermission = 'storage' | 'tabs' | 'cookies' | 'webNavigation' | 'scripting' | 'bookmarks' | 'notifications';

// Log types
export interface LogEntry {
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  timestamp: string;
}

// Performance metrics
export interface PerformanceMetrics {
  cpuUsage: string;
  cpuPercentage: number;
  memoryUsage: string;
  memoryPercentage: number;
  networkRequests: string;
  networkPercentage: number;
}

// Browser information
export interface BrowserInformation {
  name: string;
  version: string;
  isChrome: boolean;
  isEdge: boolean;
}

// Optimization settings
export interface OptimizationSettings {
  backgroundThrottling: boolean;
  cacheManagement: boolean;
  lazyLoading: boolean;
}
