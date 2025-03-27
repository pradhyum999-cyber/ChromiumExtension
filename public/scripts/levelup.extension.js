/**
 * Level Up inspired extension for Dynamics CRM
 * This script is injected into the page for advanced CRM interaction
 */

// Create a self-executing function to avoid global scope pollution
(function() {
  // Main extension object
  const CrmExtension = {
    /**
     * Initialize the extension
     */
    initialize: function() {
      // Check if we're on a CRM page
      const isCrmPage = this.isCrmPage();
      
      if (isCrmPage) {
        console.log('CRM page detected, initializing extension features');
        this.setupEventListeners();
        this.detectCrmEnvironment();
        
        // Notify that we're on a CRM page
        this.notifyExtension('Extension', 'On');
      } else {
        console.log('Not a CRM page');
        this.notifyExtension('Extension', 'Off');
      }
    },
    
    /**
     * Detect if the current page is a Dynamics CRM page
     */
    isCrmPage: function() {
      return Array.from(document.scripts).some(
        (script) =>
          script.src.indexOf('/uclient/scripts') !== -1 ||
          script.src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
          script.src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
      );
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
      // Add form detection on page changes
      window.addEventListener('hashchange', () => {
        setTimeout(() => {
          this.detectCrmEnvironment();
        }, 1000);
      });
      
      // Listen for messages from our script injector
      window.addEventListener('message', (event) => {
        // Only process messages from our injected script
        if (event.data && event.data.type === 'CRM_EXTENSION_COMMAND') {
          this.handleCommand(event.data);
        }
      });
    },
    
    /**
     * Detect CRM environment information
     */
    detectCrmEnvironment: function() {
      try {
        // Find Xrm object
        const xrm = this.findXrm();
        
        if (xrm) {
          // Get form information
          const formContext = this.getFormContext(xrm);
          
          if (formContext) {
            const entityInfo = {
              entityName: formContext.data.entity.getEntityName(),
              id: formContext.data.entity.getId ? formContext.data.entity.getId() : null,
              formType: formContext.ui ? formContext.ui.getFormType() : null
            };
            
            this.notifyExtension('FormDetected', entityInfo);
          }
        }
      } catch (e) {
        console.error('Error detecting CRM environment:', e);
      }
    },
    
    /**
     * Find the Xrm object in any available frame
     */
    findXrm: function() {
      console.log('Finding Xrm object...');
      
      // Method 1: Check window
      if (window.Xrm) {
        console.log('Found Xrm in window');
        return window.Xrm;
      }
      
      // Method 2: Try parent window
      try {
        if (window.parent && window.parent.Xrm) {
          console.log('Found Xrm in parent window');
          return window.parent.Xrm;
        }
      } catch (e) {
        // Cross-origin error
        console.log('Cross-origin error accessing parent:', e.message);
      }

      // Method 3: Look in common frame names
      const frameNames = [
        'contentIFrame0',
        'contentIFrame1',
        'contentIFrame2',
        'contentIFrame3',
        'areaContentIFrame',
        'NavBarGloablQuickCreate',
        'globalQuickCreate_frame',
        'InlineDialog_Iframe',
        'dialogFrm',
        'formContentFrame'
      ];
      
      for (const frameName of frameNames) {
        try {
          // Try by frame name in parent
          if (window.parent && window.parent.frames && window.parent.frames[frameName] && 
              window.parent.frames[frameName].Xrm) {
            console.log(`Found Xrm in parent.frames.${frameName}`);
            return window.parent.frames[frameName].Xrm;
          }
        } catch (e) {
          // Cross-origin error
          console.log(`Cross-origin error accessing parent.frames.${frameName}:`, e.message);
        }
        
        try {
          // Try by element ID
          const frameElement = document.getElementById(frameName);
          if (frameElement && frameElement.contentWindow && frameElement.contentWindow.Xrm) {
            console.log(`Found Xrm in document.getElementById(${frameName}).contentWindow`);
            return frameElement.contentWindow.Xrm;
          }
        } catch (e) {
          console.log(`Error accessing frameElement.contentWindow for ${frameName}:`, e.message);
        }
      }
      
      // Method 4: Traverse all frames recursively (expensive but thorough)
      try {
        // Define recursive frame traversal function
        const findXrmInFrames = (win) => {
          try {
            if (win.Xrm) {
              console.log('Found Xrm in a nested frame');
              return win.Xrm;
            }
            
            // Check each frame in this window
            if (win.frames && win.frames.length > 0) {
              for (let i = 0; i < win.frames.length; i++) {
                try {
                  const frameXrm = findXrmInFrames(win.frames[i]);
                  if (frameXrm) return frameXrm;
                } catch (frameError) {
                  // Cross-origin error, continue to next frame
                }
              }
            }
          } catch (traverseError) {
            // Ignore cross-origin errors
          }
          return null;
        };
        
        // Start traversal from top window
        const topXrm = findXrmInFrames(window.top);
        if (topXrm) return topXrm;
      } catch (e) {
        console.log('Error in recursive frame traversal:', e.message);
      }
      
      // Method 5: Check for global form object (alternative approach)
      try {
        if (typeof form !== 'undefined' && form.context) {
          console.log('Found form.context');
          return {
            Page: form.context
          };
        }
      } catch (e) {
        console.log('Error checking form.context:', e.message);
      }
      
      // Method 6: Last resort - look for global variables with Page properties (could be Xrm)
      try {
        for (const key in window) {
          try {
            if (window[key] && 
                typeof window[key] === 'object' && 
                window[key].Page && 
                typeof window[key].Page === 'object' &&
                typeof window[key].Page.data !== 'undefined') {
              console.log(`Found potential Xrm object in global variable: ${key}`);
              return window[key];
            }
          } catch (propError) {
            // Skip inaccessible properties
          }
        }
      } catch (e) {
        console.log('Error in global variables search:', e.message);
      }
      
      console.log('Could not find Xrm in any frame or global object');
      return null;
    },
    
    /**
     * Get form context from Xrm object
     */
    getFormContext: function(xrm) {
      try {
        if (xrm.Page && xrm.Page.data && xrm.Page.data.entity) {
          return xrm.Page;
        }
        
        if (xrm.Page && xrm.Page.ui && xrm.Page.ui.formContext) {
          return xrm.Page.ui.formContext;
        }
        
        if (xrm.Page && xrm.Page.getFormContext) {
          return xrm.Page.getFormContext();
        }
        
        if (xrm.Form && xrm.Form.data && xrm.Form.data.entity) {
          return xrm.Form;
        }
        
        return null;
      } catch (e) {
        console.error('Error getting form context:', e);
        return null;
      }
    },
    
    /**
     * Handle commands from the extension
     */
    handleCommand: function(command) {
      switch (command.command) {
        case 'GET_FORM_FIELDS':
          this.getFormFields(command);
          break;
          
        case 'FILL_FORM_FIELDS':
          this.fillFormFields(command.data);
          break;
          
        case 'TEST_CONNECTION':
          this.testConnection();
          break;
          
        default:
          console.log('Unknown command:', command);
      }
    },
    
    /**
     * Get all form fields
     */
    getFormFields: function(command) {
      try {
        const xrm = this.findXrm();
        if (!xrm) {
          this.sendResponse('GET_FORM_FIELDS', { success: false, error: 'Xrm not found' });
          return;
        }
        
        const formContext = this.getFormContext(xrm);
        if (!formContext) {
          this.sendResponse('GET_FORM_FIELDS', { success: false, error: 'Form context not found' });
          return;
        }
        
        const fields = [];
        
        // Get attributes from form
        formContext.data.entity.attributes.forEach((attribute) => {
          try {
            fields.push({
              name: attribute.getName(),
              type: attribute.getAttributeType(),
              value: attribute.getValue(),
              isDirty: attribute.getIsDirty(),
              isRequired: attribute.getRequiredLevel() === 'required'
            });
          } catch (e) {
            console.error('Error processing attribute:', e);
          }
        });
        
        this.sendResponse('GET_FORM_FIELDS', { success: true, fields: fields });
      } catch (e) {
        console.error('Error getting form fields:', e);
        this.sendResponse('GET_FORM_FIELDS', { success: false, error: e.message });
      }
    },
    
    /**
     * Fill form fields with provided values
     */
    fillFormFields: function(fieldValues) {
      try {
        const xrm = this.findXrm();
        if (!xrm) {
          this.sendResponse('FILL_FORM_FIELDS', { success: false, error: 'Xrm not found' });
          return;
        }
        
        const formContext = this.getFormContext(xrm);
        if (!formContext) {
          this.sendResponse('FILL_FORM_FIELDS', { success: false, error: 'Form context not found' });
          return;
        }
        
        let successCount = 0;
        const totalFields = Object.keys(fieldValues).length;
        
        for (const fieldName in fieldValues) {
          try {
            const attribute = formContext.getAttribute(fieldName);
            if (!attribute) {
              console.warn(`Field not found: ${fieldName}`);
              continue;
            }
            
            const value = fieldValues[fieldName];
            const attributeType = attribute.getAttributeType();
            
            // Handle different attribute types
            switch (attributeType) {
              case 'datetime':
                if (typeof value === 'string') {
                  attribute.setValue(new Date(value));
                } else {
                  attribute.setValue(value);
                }
                break;
                
              case 'picklist':
              case 'optionset':
                if (typeof value === 'number') {
                  attribute.setValue(value);
                } else if (typeof value === 'string' && !isNaN(Number(value))) {
                  attribute.setValue(Number(value));
                } else if (typeof value === 'string') {
                  // Try to find the option by text
                  const options = attribute.getOptions();
                  let found = false;
                  
                  options.forEach((option) => {
                    if (option.text && option.text.toLowerCase() === value.toLowerCase()) {
                      attribute.setValue(option.value);
                      found = true;
                    }
                  });
                  
                  if (!found) {
                    console.warn(`Could not find option matching ${value} for field ${fieldName}`);
                    continue;
                  }
                }
                break;
                
              case 'boolean':
                if (typeof value === 'string') {
                  attribute.setValue(value.toLowerCase() === 'true' || value === '1');
                } else {
                  attribute.setValue(value);
                }
                break;
                
              default:
                attribute.setValue(value);
            }
            
            successCount++;
          } catch (e) {
            console.error(`Error setting field ${fieldName}:`, e);
          }
        }
        
        this.sendResponse('FILL_FORM_FIELDS', { success: true, filledCount: successCount, totalFields: totalFields });
      } catch (e) {
        console.error('Error filling form fields:', e);
        this.sendResponse('FILL_FORM_FIELDS', { success: false, error: e.message });
      }
    },
    
    /**
     * Test connection to CRM
     */
    testConnection: function() {
      try {
        // Gather diagnostic information about the page
        const diagnostics = {
          url: window.location.href,
          title: document.title,
          hostname: window.location.hostname,
          isCrmPage: this.isCrmPage(),
          hasCrmScripts: Array.from(document.scripts).some(s => 
            s.src.indexOf('/uclient/scripts') !== -1 || 
            s.src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
            s.src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
          ),
          frameCount: window.frames ? window.frames.length : 0,
          iframeCount: document.getElementsByTagName('iframe').length,
          crmScripts: Array.from(document.scripts).map(s => s.src).filter(s => 
            s.includes('/uclient/') || 
            s.includes('/_static/') || 
            s.includes('crm') || 
            s.includes('dynamics')
          ).slice(0, 10) // Limit to 10 scripts to avoid response size issues
        };
        
        // Check for Xrm object and handle the case where there's a partial match
        const xrm = this.findXrm();
        if (!xrm) {
          // No Xrm object found at all
          console.log('No Xrm object found in any frame or global object');
          this.sendResponse('TEST_CONNECTION', { 
            success: false, 
            error: 'Xrm not found',
            diagnostics: diagnostics,
            message: 'Could not find Dynamics CRM Xrm object. This page might not be a CRM form.'
          });
          return;
        }
        
        // We have an Xrm object but let's see if we can get the form context
        const formContext = this.getFormContext(xrm);
        
        // Create page info object for diagnostic info
        const pageInfo = {
          ...diagnostics,
          xrmFound: !!xrm,
          xrmProperties: this.safeGetXrmProperties(xrm)
        };
        
        if (!formContext) {
          // We found Xrm but no form context
          this.sendResponse('TEST_CONNECTION', { 
            success: true,  // Return success even with partial connection
            partial: true,  // Indicate this is a partial match
            message: 'Found Xrm object but no form context. You may be on a CRM page but not on a form.',
            pageInfo: pageInfo
          });
          return;
        }
        
        // Try to get entity information if we have a form context
        try {
          if (formContext.data && formContext.data.entity) {
            try { pageInfo.entityName = formContext.data.entity.getEntityName(); } catch (e) {}
            try { pageInfo.recordId = formContext.data.entity.getId ? formContext.data.entity.getId() : null; } catch (e) {}
          }
          
          if (formContext.ui) {
            try { pageInfo.formType = formContext.ui.getFormType(); } catch (e) {}
            try { pageInfo.formName = formContext.ui.formSelector ? formContext.ui.formSelector.getCurrentItem().getLabel() : null; } catch (e) {}
          }
        } catch (e) {
          pageInfo.entityError = e.message;
        }
        
        // Success - we have Xrm and form context
        this.sendResponse('TEST_CONNECTION', { 
          success: true, 
          entityName: pageInfo.entityName || 'Unknown',
          pageInfo: pageInfo,
          message: 'Successfully connected to Dynamics CRM form'
        });
      } catch (e) {
        console.error('Error testing connection:', e);
        this.sendResponse('TEST_CONNECTION', { 
          success: false, 
          error: e.message,
          stack: e.stack
        });
      }
    },
    
    /**
     * Safely get Xrm properties for diagnostics
     */
    safeGetXrmProperties: function(xrm) {
      const properties = {};
      
      // Safely check properties without crashing
      try { properties.hasPage = !!xrm.Page; } catch (e) {}
      try { properties.hasForm = !!xrm.Form; } catch (e) {}
      try { properties.hasGetCurrentForm = typeof xrm.getCurrentForm === 'function'; } catch (e) {}
      try { properties.hasContext = !!xrm.context; } catch (e) {}
      try { properties.hasUi = !!(xrm.Page && xrm.Page.ui); } catch (e) {}
      try { properties.hasData = !!(xrm.Page && xrm.Page.data); } catch (e) {}
      try { properties.hasAttributes = !!(xrm.Page && xrm.Page.data && xrm.Page.data.entity && xrm.Page.data.entity.attributes); } catch (e) {}
      
      // Try to get version information
      try { 
        if (xrm.context && xrm.context.getVersion) {
          properties.version = xrm.context.getVersion();
        }
      } catch (e) {}
      
      // Try to get client information
      try {
        if (xrm.context && xrm.context.client && xrm.context.client.getClient) {
          properties.client = xrm.context.client.getClient();
        }
      } catch (e) {}
      
      return properties;
    },
    
    /**
     * Send response back to extension
     */
    sendResponse: function(command, data) {
      console.log(`Level Up sending response for ${command}:`, data);
      
      // Method 1: Use window.postMessage
      try {
        window.postMessage({
          type: 'CRM_EXTENSION_RESPONSE',
          command: command,
          ...data
        }, '*');
      } catch (e) {
        console.error('Error sending response via postMessage:', e);
      }
      
      // Method 2: Use custom event as backup (similar to notifyExtension)
      try {
        const responseEvent = new CustomEvent('crm_extension_response', {
          detail: {
            type: 'CRM_EXTENSION_RESPONSE',
            command: command,
            ...data
          }
        });
        document.dispatchEvent(responseEvent);
      } catch (e) {
        console.error('Error sending response via custom event:', e);
      }
      
      // Method 3: Set a global variable that can be checked
      try {
        window._CRM_EXTENSION_LAST_RESPONSE = {
          type: 'CRM_EXTENSION_RESPONSE',
          command: command,
          timestamp: new Date().getTime(),
          ...data
        };
      } catch (e) {
        console.error('Error setting global response variable:', e);
      }
    },
    
    /**
     * Notify extension of events
     */
    notifyExtension: function(category, content) {
      const extensionMessage = {
        type: 'Page',
        category: category,
        content: content
      };
      
      const levelUpEvent = new CustomEvent('levelup', {
        detail: extensionMessage
      });
      
      document.dispatchEvent(levelUpEvent);
    }
  };
  
  // Initialize the extension
  CrmExtension.initialize();
})();