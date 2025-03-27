export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isEdge: boolean;
}

// This is a browser extension-specific utility that would normally use
// the browser extension APIs to detect the browser environment
// For this demo, we'll simulate browser detection since we're in a web environment

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";
  let isChrome = false;
  let isEdge = false;

  // Chrome detection
  if (userAgent.indexOf("Chrome") !== -1) {
    const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    if (chromeMatch && chromeMatch.length > 1) {
      browserName = "Chrome";
      browserVersion = chromeMatch[1];
      isChrome = true;

      // Check if actually Edge
      if (userAgent.indexOf("Edg") !== -1) {
        const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
        if (edgeMatch && edgeMatch.length > 1) {
          browserName = "Edge";
          browserVersion = edgeMatch[1];
          isChrome = false;
          isEdge = true;
        }
      }
    }
  }
  // Firefox detection
  else if (userAgent.indexOf("Firefox") !== -1) {
    const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (firefoxMatch && firefoxMatch.length > 1) {
      browserName = "Firefox";
      browserVersion = firefoxMatch[1];
    }
  }
  // Safari detection
  else if (userAgent.indexOf("Safari") !== -1) {
    const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
    if (safariMatch && safariMatch.length > 1) {
      browserName = "Safari";
      browserVersion = safariMatch[1];
    }
  }

  return {
    name: browserName,
    version: browserVersion,
    isChrome,
    isEdge
  };
}
