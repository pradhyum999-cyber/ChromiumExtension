// Content script that runs in web pages
// This script is injected into pages that match the patterns in manifest.json

// Function to log events back to the extension
function logToExtension(level, message) {
  chrome.runtime.sendMessage({
    action: "addLog",
    level: level,
    message: message
  });
}

// Dynamics CRM specific functions
const dynamicsCRM = {
  // Check if current page is Dynamics CRM
  isDynamicsCRM() {
    // Check for the hostname containing dynamics.com
    const isDynamicsDomain = window.location.hostname.includes('dynamics.com');
    
    // Check for Xrm object in window or parent
    const hasXrm = typeof Xrm !== 'undefined' || 
                  (window.parent && typeof window.parent.Xrm !== 'undefined');
    
    // Check for common Dynamics CRM URL patterns
    const hasCrmUrlPattern = window.location.href.includes('/main.aspx') || 
                            window.location.href.includes('pagetype=entityrecord');
    
    return isDynamicsDomain && (hasXrm || hasCrmUrlPattern);
  },
  
  // Get form context if available
  getFormContext() {
    try {
      // Try different approaches to get Xrm
      let xrm = null;
      
      // Check in window
      if (typeof window.Xrm !== 'undefined') {
        xrm = window.Xrm;
      } 
      // Check in parent window (iframe scenario)
      else if (window.parent && typeof window.parent.Xrm !== 'undefined') {
        xrm = window.parent.Xrm;
      }
      // Check for any global variable that might contain Xrm
      else {
        for (const key in window) {
          if (window[key] && typeof window[key].Page !== 'undefined') {
            xrm = window[key];
            break;
          }
        }
      }
      
      if (!xrm) {
        logToExtension("WARNING", "Could not find Xrm object in page");
        return null;
      }
      
      // Modern Xrm API (Unified Interface)
      if (xrm.Page && xrm.Page.getAttribute) {
        return xrm.Page;
      }
      
      // For Unified Interface, try to get the current form context
      if (xrm.Form && xrm.Form.getAttribute) {
        return xrm.Form;
      }
      
      if (xrm.Page && xrm.Page.ui && xrm.Page.ui.getFormType) {
        return xrm.Page;
      }
      
      // Legacy approach 
      if (xrm.Page && xrm.Page.getControl) {
        return xrm.Page;
      }
      
      // Try to get the form context from the current form
      if (xrm.getCurrentForm) {
        const formContext = xrm.getCurrentForm();
        if (formContext && formContext.getAttribute) {
          return formContext;
        }
      }
      
      logToExtension("WARNING", "Found Xrm object but could not get form context");
      return null;
    } catch (e) {
      logToExtension("ERROR", `Error getting Dynamics CRM form context: ${e.message}`);
      return null;
    }
  },
  
  // Get all available form fields
  getFormFields() {
    try {
      const formContext = this.getFormContext();
      if (!formContext || !formContext.getAttribute) {
        return [];
      }
      
      const attributes = formContext.getAttribute();
      if (!attributes || !attributes.forEach) {
        return [];
      }
      
      const fields = [];
      attributes.forEach(attribute => {
        fields.push({
          name: attribute.getName(),
          type: attribute.getAttributeType(),
          value: attribute.getValue(),
          isDirty: attribute.getIsDirty(),
          isRequired: attribute.getRequiredLevel() === 'required'
        });
      });
      
      return fields;
    } catch (e) {
      logToExtension("ERROR", `Error getting Dynamics CRM form fields: ${e.message}`);
      return [];
    }
  },
  
  // Set a field value
  setFieldValue(fieldName, value) {
    try {
      const formContext = this.getFormContext();
      if (!formContext || !formContext.getAttribute) {
        logToExtension("ERROR", "Form context not available");
        return false;
      }
      
      const attribute = formContext.getAttribute(fieldName);
      if (!attribute) {
        logToExtension("ERROR", `Field '${fieldName}' not found on form`);
        return false;
      }
      
      attribute.setValue(value);
      logToExtension("INFO", `Set field '${fieldName}' to value: ${value}`);
      return true;
    } catch (e) {
      logToExtension("ERROR", `Error setting field '${fieldName}': ${e.message}`);
      return false;
    }
  },
  
  // Fill multiple fields at once
  fillFormFields(fieldValues) {
    if (!fieldValues || typeof fieldValues !== 'object') {
      logToExtension("ERROR", "Invalid field values object");
      return false;
    }
    
    try {
      let successCount = 0;
      const totalFields = Object.keys(fieldValues).length;
      
      for (const [field, value] of Object.entries(fieldValues)) {
        if (this.setFieldValue(field, value)) {
          successCount++;
        }
      }
      
      logToExtension("INFO", `Successfully filled ${successCount}/${totalFields} fields on the form`);
      return successCount > 0;
    } catch (e) {
      logToExtension("ERROR", `Error filling form fields: ${e.message}`);
      return false;
    }
  }
};

// Check if the content script should be enabled on this domain
function isContentScriptEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['features'], (result) => {
      if (result.features && result.features.contentScript) {
        resolve(result.features.contentScript.enabled);
      } else {
        resolve(true); // Default to enabled if not set
      }
    });
  });
}

// Detect browser features that might be available to the content script
function detectBrowserFeatures() {
  const features = {
    clipboard: !!navigator.clipboard,
    geolocation: !!navigator.geolocation,
    notifications: !!("Notification" in window),
    storage: !!window.localStorage,
    webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    })(),
    webWorkers: !!window.Worker,
    serviceWorkers: !!navigator.serviceWorker
  };
  
  return features;
}

// Initialize content script
async function initContentScript() {
  try {
    const isEnabled = await isContentScriptEnabled();
    
    if (!isEnabled) {
      console.log("Content script is disabled for this domain");
      return;
    }
    
    // Log successful injection
    logToExtension("INFO", `Content script injected into ${window.location.href}`);
    
    // Detect browser features
    const features = detectBrowserFeatures();
    logToExtension("INFO", `Browser features detected: ${Object.keys(features).filter(k => features[k]).join(', ')}`);
    
    // Listen for navigation events within the page (SPA detection)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        logToExtension("INFO", `Navigation detected within page: ${location.href}`);
      }
    });
    
    observer.observe(document, { subtree: true, childList: true });
    
    // Report page performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.performance && window.performance.timing) {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const domReadyTime = perfData.domComplete - perfData.domLoading;
          
          logToExtension("INFO", `Page load time: ${pageLoadTime}ms, DOM ready: ${domReadyTime}ms`);
        }
      }, 0);
    });
    
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "contentScriptStatus") {
        sendResponse({ 
          status: "running", 
          url: window.location.href,
          features: features
        });
      } else if (message.action === "checkCrm") {
        // Check if this is a CRM page
        const isCrm = dynamicsCRM.isDynamicsCRM();
        sendResponse({ 
          isCrm: isCrm,
          hasForm: isCrm && !!dynamicsCRM.getFormContext()
        });
      } else if (message.action === "getPageMetrics") {
        // Get page metrics on demand
        const metrics = {
          title: document.title,
          url: window.location.href,
          links: document.links.length,
          images: document.images.length,
          scripts: document.scripts.length,
          iframes: document.getElementsByTagName('iframe').length
        };
        sendResponse(metrics);
      } else if (message.action === "checkDynamicsCRM") {
        const isDynamicsCRM = dynamicsCRM.isDynamicsCRM();
        sendResponse({ 
          isDynamicsCRM: isDynamicsCRM,
          hasForm: isDynamicsCRM && !!dynamicsCRM.getFormContext()
        });
      } else if (message.action === "getDynamicsCRMFields") {
        if (!dynamicsCRM.isDynamicsCRM()) {
          sendResponse({ success: false, error: "Not a Dynamics CRM page" });
          return true;
        }
        
        const fields = dynamicsCRM.getFormFields();
        sendResponse({ 
          success: true, 
          fields: fields,
          formName: document.title
        });
      } else if (message.action === "setDynamicsCRMField") {
        if (!dynamicsCRM.isDynamicsCRM()) {
          sendResponse({ success: false, error: "Not a Dynamics CRM page" });
          return true;
        }
        
        const success = dynamicsCRM.setFieldValue(message.fieldName, message.value);
        sendResponse({ 
          success: success, 
          fieldName: message.fieldName,
          value: message.value
        });
      } else if (message.action === "fillForm") {
        if (!dynamicsCRM.isDynamicsCRM()) {
          sendResponse({ success: false, message: "Not a Dynamics CRM page" });
          return true;
        }

        const templateData = message.data;
        let fieldsToFill = { ...templateData };

        // If contact only, just include contact-related fields
        if (message.contactOnly) {
          const contactFields = [
            'telephone1', 'emailaddress1', 'websiteurl', 
            'address1_line1', 'address1_city', 'address1_stateorprovince',
            'address1_postalcode'
          ];
          
          fieldsToFill = Object.keys(templateData)
            .filter(key => contactFields.includes(key))
            .reduce((obj, key) => {
              obj[key] = templateData[key];
              return obj;
            }, {});
        }
        
        const success = dynamicsCRM.fillFormFields(fieldsToFill);
        sendResponse({ 
          success: success,
          filledCount: Object.keys(fieldsToFill).length,
          message: success ? "Form data populated successfully" : "Failed to populate form data"
        });
      } else if (message.action === "fillDynamicsCRMForm") {
        if (!dynamicsCRM.isDynamicsCRM()) {
          sendResponse({ success: false, error: "Not a Dynamics CRM page" });
          return true;
        }
        
        const success = dynamicsCRM.fillFormFields(message.values);
        sendResponse({ 
          success: success,
          filledCount: Object.keys(message.values || {}).length
        });
      }
      return true;
    });
    
  } catch (error) {
    console.error("Error initializing content script:", error);
    logToExtension("ERROR", `Content script initialization failed: ${error.message}`);
  }
}

// Run the content script initialization
initContentScript();
