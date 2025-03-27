// Content script that runs in web pages
// This script is injected into pages that match the patterns in manifest.json

// Function to log events back to the extension with error handling
function logToExtension(level, message) {
  try {
    chrome.runtime.sendMessage({
      action: "addLog",
      level: level,
      message: message
    });
  } catch (error) {
    // Handle "Extension context invalidated" error
    console.log(`Extension logging error: ${error.message}`);
    // Don't rethrow - we want to continue execution even if messaging fails
  }
}

// Dynamics CRM specific functions
const dynamicsCRM = {
  // Check if current page is Dynamics CRM
  isDynamicsCRM() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // Log detailed information for debugging
    console.log('CRM Detection - URL:', url);
    console.log('CRM Detection - Hostname:', hostname);
    
    // Detection method 1: Script sources (inspired by Level Up extension)
    const isCRMBasedOnScripts = Array.from(document.scripts).some(
      (script) =>
        script.src.indexOf('/uclient/scripts') !== -1 ||
        script.src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
        script.src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
    );
    
    if (isCRMBasedOnScripts) {
      console.log('CRM Detection - Found CRM script sources');
      return true;
    }
    
    // Check for the hostname containing dynamics.com
    const isDynamicsDomain = hostname.includes('dynamics.com');
    
    // Special check for org050aaf2f.crm8.dynamics.com pattern
    const isSpecificOrgDomain = hostname.includes('org050aaf2f.crm8.dynamics.com') || 
                               hostname.match(/org[a-zA-Z0-9]+\.crm[0-9]+\.dynamics\.com/);
    
    // Direct check for the exact org050aaf2f URL pattern from your screenshot
    if (hostname === 'org050aaf2f.crm8.dynamics.com') {
      console.log('CRM Detection - Exact org050aaf2f.crm8.dynamics.com domain match!');
      // Return true immediately for this exact domain
      return true;
    }
    
    // Check for Xrm object in window or parent
    let hasXrm = false;
    try {
      hasXrm = typeof Xrm !== 'undefined' || 
              (window.parent && typeof window.parent.Xrm !== 'undefined');
      
      console.log('CRM Detection - Window Xrm:', typeof Xrm !== 'undefined');
      console.log('CRM Detection - Parent Xrm:', window.parent && typeof window.parent.Xrm !== 'undefined');
    } catch (e) {
      console.log('CRM Detection - Error checking Xrm:', e.message);
    }
    
    // Check for common Dynamics CRM URL patterns
    const hasCrmUrlPattern = url.includes('/main.aspx') || 
                           url.includes('pagetype=entityrecord') ||
                           url.includes('etn=contact') ||
                           url.includes('appid=633ed3b2-b807-f011-bae4-002248d4fe57') ||
                           url.match(/crm[0-9]+\.dynamics\.com/) !== null;
    
    // Special handling for org050aaf2f.crm8.dynamics.com/main.aspx... pattern
    if (isSpecificOrgDomain && (url.includes('/main.aspx') || url.includes('pagetype=entityrecord'))) {
      console.log('CRM Detection - Special org domain with main.aspx or entityrecord detected!');
      return true;
    }
    
    // Special handling for the specific URL pattern in your screenshot
    if (url.includes('org050aaf2f.crm8.dynamics.com/main.aspx') && 
        url.includes('appid=633ed3b2-b807-f011-bae4-002248d4fe57') && 
        url.includes('pagetype=entityrecord')) {
      console.log('CRM Detection - Exact URL pattern match from screenshot!');
      return true;
    }
    
    console.log('CRM Detection - isDynamicsDomain:', isDynamicsDomain);
    console.log('CRM Detection - isSpecificOrgDomain:', isSpecificOrgDomain);
    console.log('CRM Detection - hasXrm:', hasXrm);
    console.log('CRM Detection - hasCrmUrlPattern:', hasCrmUrlPattern);
    
    // More permissive detection for CRM8 environments
    if (hostname.includes('.crm8.dynamics.com')) {
      console.log('CRM Detection - CRM8 domain detected, using more permissive checks');
      return true;
    }
    
    return (isDynamicsDomain || isSpecificOrgDomain) && (hasXrm || hasCrmUrlPattern);
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
      if (!formContext) {
        logToExtension("ERROR", "Could not get form context");
        return [];
      }
      
      // Modern Unified Interface
      if (typeof formContext.getAttribute === 'function') {
        try {
          // Get attributes using modern API
          const attributes = formContext.getAttribute();
          if (!attributes || !attributes.forEach) {
            logToExtension("WARNING", "No attributes found on form or attributes not iterable");
            return [];
          }
          
          const fields = [];
          attributes.forEach(attribute => {
            try {
              fields.push({
                name: attribute.getName(),
                type: attribute.getAttributeType(),
                value: attribute.getValue(),
                isDirty: attribute.getIsDirty(),
                isRequired: attribute.getRequiredLevel() === 'required'
              });
            } catch (attributeError) {
              logToExtension("WARNING", `Error processing attribute: ${attributeError.message}`);
            }
          });
          
          return fields;
        } catch (e) {
          logToExtension("ERROR", `Error getting attributes from form context: ${e.message}`);
        }
      }
      
      // Try alternative approaches for different versions of Dynamics CRM
      if (typeof formContext.data !== 'undefined' && 
          typeof formContext.data.entity !== 'undefined' && 
          typeof formContext.data.entity.attributes !== 'undefined') {
        
        try {
          const attributes = formContext.data.entity.attributes;
          const fields = [];
          
          // Handle collection object with get method
          if (typeof attributes.get === 'function') {
            // Try to get all controls to determine available attributes
            const controls = formContext.ui ? formContext.ui.controls : null;
            if (controls && typeof controls.forEach === 'function') {
              controls.forEach(control => {
                try {
                  if (control.getAttribute) {
                    const attribute = control.getAttribute();
                    if (attribute) {
                      fields.push({
                        name: attribute.getName(),
                        type: attribute.getAttributeType ? attribute.getAttributeType() : 'unknown',
                        value: attribute.getValue ? attribute.getValue() : null,
                        isDirty: attribute.getIsDirty ? attribute.getIsDirty() : false,
                        isRequired: attribute.getRequiredLevel ? attribute.getRequiredLevel() === 'required' : false
                      });
                    }
                  }
                } catch (controlError) {
                  logToExtension("WARNING", `Error accessing control attribute: ${controlError.message}`);
                }
              });
            }
          }
          // Handle forEach or each method directly on attributes
          else if (typeof attributes.forEach === 'function') {
            attributes.forEach(attribute => {
              try {
                fields.push({
                  name: attribute.getName(),
                  type: attribute.getAttributeType ? attribute.getAttributeType() : 'unknown',
                  value: attribute.getValue ? attribute.getValue() : null,
                  isDirty: attribute.getIsDirty ? attribute.getIsDirty() : false,
                  isRequired: attribute.getRequiredLevel ? attribute.getRequiredLevel() === 'required' : false
                });
              } catch (attrError) {
                logToExtension("WARNING", `Error processing attribute in collection: ${attrError.message}`);
              }
            });
          }
          
          return fields;
        } catch (e) {
          logToExtension("ERROR", `Error accessing entity attributes: ${e.message}`);
        }
      }
      
      // Last resort - try to get visible controls
      if (formContext.ui && formContext.ui.controls && typeof formContext.ui.controls.forEach === 'function') {
        try {
          const fields = [];
          formContext.ui.controls.forEach(control => {
            try {
              if (control.getName) {
                fields.push({
                  name: control.getName(),
                  type: 'unknown',
                  value: null,
                  isDirty: false,
                  isRequired: false
                });
              }
            } catch (controlError) {
              // Ignore errors for individual controls
            }
          });
          
          return fields;
        } catch (e) {
          logToExtension("ERROR", `Error accessing UI controls: ${e.message}`);
        }
      }
      
      logToExtension("ERROR", "Could not retrieve form fields using any available method");
      return [];
    } catch (e) {
      logToExtension("ERROR", `Error getting Dynamics CRM form fields: ${e.message}`);
      return [];
    }
  },
  
  // Set a field value
  setFieldValue(fieldName, value) {
    try {
      const formContext = this.getFormContext();
      if (!formContext) {
        logToExtension("ERROR", "Form context not available");
        return false;
      }
      
      // Try multiple approaches to get the attribute
      let attribute = null;
      
      // Method 1: Direct getAttribute method
      if (typeof formContext.getAttribute === 'function') {
        try {
          attribute = formContext.getAttribute(fieldName);
        } catch (e) {
          logToExtension("DEBUG", `Could not get attribute using getAttribute: ${e.message}`);
        }
      }
      
      // Method 2: Modern Unified Interface
      if (!attribute && typeof formContext.data !== 'undefined' && 
          typeof formContext.data.entity !== 'undefined' && 
          typeof formContext.data.entity.attributes !== 'undefined' && 
          typeof formContext.data.entity.attributes.get === 'function') {
        try {
          attribute = formContext.data.entity.attributes.get(fieldName);
        } catch (e) {
          logToExtension("DEBUG", `Could not get attribute using entity.attributes.get: ${e.message}`);
        }
      }
      
      // Method 3: Get control first, then attribute (for some CRM versions)
      if (!attribute && formContext.ui && formContext.ui.controls && 
          typeof formContext.ui.controls.get === 'function') {
        try {
          const control = formContext.ui.controls.get(fieldName);
          if (control && typeof control.getAttribute === 'function') {
            attribute = control.getAttribute();
          }
        } catch (e) {
          logToExtension("DEBUG", `Could not get attribute from control: ${e.message}`);
        }
      }
      
      if (!attribute) {
        logToExtension("ERROR", `Field '${fieldName}' not found on form using any method`);
        return false;
      }
      
      // Handle the attribute based on its type
      try {
        // Get attribute type if available
        let attributeType = 'unknown';
        try {
          if (typeof attribute.getAttributeType === 'function') {
            attributeType = attribute.getAttributeType();
          }
        } catch (typeError) {
          // If we can't get the type, we'll try a generic approach
        }
        
        logToExtension("INFO", `Setting field '${fieldName}' of type '${attributeType}' to value: ${JSON.stringify(value)}`);
        
        // Handle special cases based on attribute type
        if (attributeType === 'datetime' && typeof value === 'string') {
          // Convert string dates to Date objects
          try {
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              attribute.setValue(dateValue);
            } else {
              attribute.setValue(value); // Fall back to original value
            }
          } catch (dateError) {
            attribute.setValue(value); // Fall back to original value
          }
        } 
        // Handle picklist/optionset values
        else if (attributeType === 'picklist' || attributeType === 'optionset') {
          // If value is a number, set directly
          if (typeof value === 'number') {
            attribute.setValue(value);
          } 
          // If it's a string that could be a number, convert it
          else if (typeof value === 'string' && !isNaN(Number(value))) {
            attribute.setValue(Number(value));
          }
          // Otherwise try to find the option that matches the string
          else if (typeof value === 'string' && typeof attribute.getOptions === 'function') {
            const options = attribute.getOptions();
            let found = false;
            
            if (options) {
              options.forEach(option => {
                if (option.text && option.text.toLowerCase() === value.toLowerCase()) {
                  attribute.setValue(option.value);
                  found = true;
                }
              });
            }
            
            if (!found) {
              logToExtension("WARNING", `Could not find option matching '${value}' for field '${fieldName}'`);
              return false;
            }
          } else {
            // Default fallback
            attribute.setValue(value);
          }
        }
        // Handle boolean values
        else if (attributeType === 'boolean' && typeof value === 'string') {
          const boolValue = value.toLowerCase() === 'true' || value === '1';
          attribute.setValue(boolValue);
        }
        // Handle all other cases with generic setValue
        else {
          attribute.setValue(value);
        }
        
        logToExtension("INFO", `Successfully set field '${fieldName}' to value: ${JSON.stringify(value)}`);
        return true;
      } catch (valueError) {
        logToExtension("ERROR", `Error setting value for '${fieldName}': ${valueError.message}`);
        return false;
      }
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
    // Check for admin portals that might cause "Extension context invalidated" errors
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // Skip PowerPlatform admin portal and other Microsoft admin sites
    if (hostname.includes('admin.powerplatform.microsoft.com') || 
        url.includes('/environments/environment/') ||
        hostname.includes('admin.microsoft.com') ||
        hostname.includes('portal.azure.com')) {
      console.log("Content script disabled for admin portal:", url);
      return;
    }
    
    const isEnabled = await isContentScriptEnabled();
    
    if (!isEnabled) {
      console.log("Content script is disabled for this domain");
      return;
    }
    
    // Log successful injection
    try {
      logToExtension("INFO", `Content script injected into ${window.location.href}`);
    } catch (error) {
      console.log("Error logging to extension, continuing anyway:", error.message);
    }
    
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
      try {
        console.log("Content script received message:", message.action);
      
      if (message.action === "contentScriptStatus") {
        sendResponse({ 
          status: "running", 
          url: window.location.href,
          features: features
        });
      } else if (message.action === "injectCrmScript") {
        // Handle script injection request
        console.log("Content script received injectCrmScript request");
        injectCrmScript()
          .then(() => {
            console.log("Script injection successful");
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error("Script injection failed:", error);
            sendResponse({ success: false, error: error.message });
          });
          
        return true; // Keep the message channel open for async response
      } else if (message.action === "TEST_CONNECTION") {
        // Handle test connection request
        console.log("Content script received TEST_CONNECTION request");
        
        // First check if we were able to detect Xrm directly
        const directXrm = typeof Xrm !== 'undefined' || 
                        (window.parent && typeof window.parent.Xrm !== 'undefined');
        
        if (directXrm) {
          console.log("Direct Xrm object found, responding success");
          sendResponse({ success: true, method: "direct" });
          return;
        }
        
        // Try to communicate with our injected script
        injectCrmScript()
          .then(() => {
            // Send a message to our injected script
            window.postMessage({
              type: 'CRM_EXTENSION_COMMAND',
              command: 'TEST_CONNECTION'
            }, '*');
            
            // Listen for response
            listenForScriptResponse('TEST_CONNECTION', 3000)
              .then((response) => {
                console.log("Got TEST_CONNECTION response from injected script:", response);
                sendResponse(response);
              })
              .catch((error) => {
                console.error("TEST_CONNECTION response error:", error);
                sendResponse({ success: false, error: error.message });
              });
          })
          .catch((error) => {
            console.error("Failed to inject script for TEST_CONNECTION:", error);
            sendResponse({ success: false, error: error.message });
          });
          
        return true; // Keep the message channel open for async response
      } else if (message.action === "checkCrm") {
        // Check if this is a CRM page
        const isDynamicsDomain = window.location.hostname.includes('dynamics.com');
    const hasXrm = typeof Xrm !== 'undefined' || 
                  (window.parent && typeof window.parent.Xrm !== 'undefined');
    const hasCrmUrlPattern = window.location.href.includes('/main.aspx') || 
                            window.location.href.includes('pagetype=entityrecord');

    // Detailed debugging information to help diagnose detection issues
    console.log('CRM Check - URL:', window.location.href);
    console.log('CRM Check - isDynamicsDomain:', isDynamicsDomain);
    console.log('CRM Check - hasXrm:', hasXrm);
    console.log('CRM Check - hasCrmUrlPattern:', hasCrmUrlPattern);
    
    const isCrm = dynamicsCRM.isDynamicsCRM();
    const hasForm = isCrm && !!dynamicsCRM.getFormContext();
    
    console.log('CRM Check - isCrm:', isCrm);
    console.log('CRM Check - hasForm:', hasForm);

    if (isCrm) {
      try {
        const formContext = dynamicsCRM.getFormContext();
        if (formContext) {
          console.log('CRM Check - Form type:', formContext.ui ? formContext.ui.getFormType() : 'Unknown');
          console.log('CRM Check - Form name:', document.title);
        }
      } catch (e) {
        console.log('CRM Check - Error getting form details:', e.message);
      }
    }
    
    sendResponse({ 
      isCrm: isCrm,
      hasForm: hasForm,
      url: window.location.href,
      isDynamicsDomain: isDynamicsDomain,
      hasXrm: hasXrm,
      hasCrmUrlPattern: hasCrmUrlPattern
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
        console.log("fillForm message received");
        
        if (!dynamicsCRM.isDynamicsCRM()) {
          console.log("Not a Dynamics CRM page according to regular check");
          
          // Try using the injected script approach instead
          injectCrmScript()
            .then(() => {
              const templateData = message.data;
              let fieldsToFill = { ...templateData };
              
              // If contact only, just include contact-related fields
              if (message.contactOnly) {
                const contactFields = [
                  // Personal information
                  'firstname', 'lastname', 'fullname', 'jobtitle', 'parentcustomerid',
                  'telephone1', 'telephone2', 'mobilephone', 'emailaddress1', 'emailaddress2',
                  'websiteurl', 'fax',
                  
                  // Address information
                  'address1_line1', 'address1_line2', 'address1_line3',
                  'address1_city', 'address1_stateorprovince', 'address1_postalcode',
                  'address1_country', 'address1_telephone1',
                  
                  // Secondary address
                  'address2_line1', 'address2_line2', 'address2_city',
                  'address2_stateorprovince', 'address2_postalcode', 'address2_country',
                  
                  // Additional info
                  'birthdate', 'anniversary', 'spousesname', 'familystatuscode',
                  'department', 'description', 'preferredcontactmethodcode'
                ];
                
                fieldsToFill = Object.keys(templateData)
                  .filter(key => contactFields.includes(key))
                  .reduce((obj, key) => {
                    obj[key] = templateData[key];
                    return obj;
                  }, {});
              }
              
              // Send a message to our injected script
              window.postMessage({
                type: 'CRM_EXTENSION_COMMAND',
                command: 'FILL_FORM_FIELDS',
                data: fieldsToFill
              }, '*');
              
              // Listen for response
              listenForScriptResponse('FILL_FORM_FIELDS', 5000)
                .then((response) => {
                  console.log("Got FILL_FORM_FIELDS response from injected script:", response);
                  sendResponse({ 
                    success: response.success,
                    filledCount: Object.keys(fieldsToFill).length,
                    message: response.success ? "Form data populated successfully via injection" : "Failed to populate form data via injection"
                  });
                })
                .catch((error) => {
                  console.error("FILL_FORM_FIELDS response error:", error);
                  sendResponse({ 
                    success: false, 
                    message: "Error in form filling via injection: " + error.message 
                  });
                });
            })
            .catch((error) => {
              console.error("Failed to inject script for fillForm:", error);
              sendResponse({ 
                success: false, 
                message: "Failed to inject script: " + error.message 
              });
            });
            
          return true; // Keep the message channel open for the async response
        }

        // Traditional approach as fallback
        const templateData = message.data;
        let fieldsToFill = { ...templateData };

        // If contact only, just include contact-related fields
        if (message.contactOnly) {
          const contactFields = [
            // Personal information
            'firstname', 'lastname', 'fullname', 'jobtitle', 'parentcustomerid',
            'telephone1', 'telephone2', 'mobilephone', 'emailaddress1', 'emailaddress2',
            'websiteurl', 'fax',
            
            // Address information
            'address1_line1', 'address1_line2', 'address1_line3',
            'address1_city', 'address1_stateorprovince', 'address1_postalcode',
            'address1_country', 'address1_telephone1',
            
            // Secondary address
            'address2_line1', 'address2_line2', 'address2_city',
            'address2_stateorprovince', 'address2_postalcode', 'address2_country',
            
            // Additional info
            'birthdate', 'anniversary', 'spousesname', 'familystatuscode',
            'department', 'description', 'preferredcontactmethodcode'
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
    } catch (error) {
        console.error("Error handling message in content script:", error);
        // Return a graceful error response when possible
        try {
          sendResponse({ 
            success: false, 
            error: "Extension context error: " + error.message 
          });
        } catch (sendError) {
          // Just log if we can't even send the response
          console.error("Could not send response:", sendError);
        }
        return true;
      }
    });
    
  } catch (error) {
    console.error("Error initializing content script:", error);
    logToExtension("ERROR", `Content script initialization failed: ${error.message}`);
  }
}

// Helper to inject our script into the page context
function injectCrmScript() {
  return new Promise((resolve, reject) => {
    try {
      // Check if script is already injected
      if (window.injectedCrmScript) {
        resolve();
        return;
      }
      
      // First check for admin portals that cause context invalidation
      const url = window.location.href;
      const hostname = window.location.hostname;
      
      // Skip PowerPlatform admin portal and other Microsoft admin sites
      if (hostname.includes('admin.powerplatform.microsoft.com') || 
          url.includes('/environments/environment/') ||
          hostname.includes('admin.microsoft.com') ||
          hostname.includes('portal.azure.com')) {
        console.log("Injection skipped for admin portal:", url);
        reject(new Error("Injection skipped for admin portal"));
        return;
      }
      
      // First try the chrome.scripting API (requires scripting permission)
      try {
        if (chrome.scripting) {
          chrome.scripting.executeScript({
            target: { tabId: -1, allFrames: true }, // -1 means current tab
            func: injectScriptTag,
            args: [chrome.runtime.getURL('crm-injector.js')]
          }).then(() => {
            window.injectedCrmScript = true;
            try {
              logToExtension("INFO", "Script injected using chrome.scripting API");
            } catch (logError) {
              console.log("Logging error after injection:", logError.message);
            }
            resolve();
          }).catch(error => {
            console.log("Failed to inject script using chrome.scripting API:", error.message);
            try {
              logToExtension("WARNING", "Failed to inject script using chrome.scripting API: " + error.message);
            } catch (logError) {
              // Ignore logging errors
            }
            // Fall back to script tag method
            injectScriptTag(chrome.runtime.getURL('crm-injector.js'));
            window.injectedCrmScript = true;
            resolve();
          });
        } else {
          // Fallback method using a script tag
          injectScriptTag(chrome.runtime.getURL('crm-injector.js'));
          window.injectedCrmScript = true;
          resolve();
        }
      } catch (runtimeError) {
        console.error("Runtime error during injection:", runtimeError.message);
        // If we get here, it's likely a context invalidation, so reject
        reject(new Error("Extension context error: " + runtimeError.message));
      }
    } catch (e) {
      reject(e);
    }
  });
}

// Function to be executed in the page context to inject a script tag
function injectScriptTag(scriptUrl) {
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.onload = function() {
    this.remove(); // Remove the script tag after loading
  };
  (document.head || document.documentElement).appendChild(script);
}

// Helper to listen for a response from our injected script
function listenForScriptResponse(command, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', responseHandler);
      reject(new Error('Timeout waiting for response'));
    }, timeoutMs);
    
    function responseHandler(event) {
      if (event.data && 
          event.data.type === 'CRM_EXTENSION_RESPONSE' && 
          event.data.command === command) {
        clearTimeout(timeout);
        window.removeEventListener('message', responseHandler);
        resolve(event.data);
      }
    }
    
    window.addEventListener('message', responseHandler);
  });
}

// Listen for Level Up style custom events (used by the Level Up extension)
document.addEventListener('levelup', function(event) {
  try {
    if (event.detail && event.detail.type === 'Page') {
      console.log('Received levelup event:', event.detail);
      
      // Forward to background script with error handling
      try {
        chrome.runtime.sendMessage({
          action: 'LEVELUP_EVENT',
          data: event.detail
        });
      } catch (runtimeError) {
        // Handle "Extension context invalidated" error or other runtime errors
        console.error('Error sending levelup event to extension:', runtimeError.message);
      }
    }
  } catch (e) {
    console.error('Error processing levelup event:', e);
  }
});

// Run the content script initialization
initContentScript();
