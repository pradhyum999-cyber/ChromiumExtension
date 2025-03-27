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
      // Check window
      if (window.Xrm) {
        return window.Xrm;
      }
      
      // Try parent
      try {
        if (window.parent && window.parent.Xrm) {
          return window.parent.Xrm;
        }
      } catch (e) {
        // Cross-origin error
      }
      
      // Look in common frame names
      const frameNames = [
        'contentIFrame0',
        'contentIFrame1',
        'contentIFrame2',
        'contentIFrame3',
        'areaContentIFrame'
      ];
      
      for (const frameName of frameNames) {
        try {
          // Try by frame name
          if (window.parent.frames[frameName] && window.parent.frames[frameName].Xrm) {
            return window.parent.frames[frameName].Xrm;
          }
          
          // Try by element ID
          const frameElement = document.getElementById(frameName);
          if (frameElement && frameElement.contentWindow && frameElement.contentWindow.Xrm) {
            return frameElement.contentWindow.Xrm;
          }
        } catch (e) {
          // Cross-origin error
        }
      }
      
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
        const xrm = this.findXrm();
        if (!xrm) {
          this.sendResponse('TEST_CONNECTION', { success: false, error: 'Xrm not found' });
          return;
        }
        
        const formContext = this.getFormContext(xrm);
        if (!formContext) {
          this.sendResponse('TEST_CONNECTION', { success: false, error: 'Form context not found' });
          return;
        }
        
        const pageInfo = {
          url: window.location.href,
          title: document.title,
          scripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('/uclient/') || s.includes('/_static/'))
        };
        
        try {
          pageInfo.entityName = formContext.data.entity.getEntityName();
          pageInfo.formType = formContext.ui ? formContext.ui.getFormType() : 'Unknown';
          pageInfo.recordId = formContext.data.entity.getId ? formContext.data.entity.getId() : null;
        } catch (e) {
          pageInfo.error = e.message;
        }
        
        this.sendResponse('TEST_CONNECTION', { 
          success: true, 
          entityName: pageInfo.entityName,
          pageInfo: pageInfo 
        });
      } catch (e) {
        console.error('Error testing connection:', e);
        this.sendResponse('TEST_CONNECTION', { success: false, error: e.message });
      }
    },
    
    /**
     * Send response back to extension
     */
    sendResponse: function(command, data) {
      window.postMessage({
        type: 'CRM_EXTENSION_RESPONSE',
        command: command,
        ...data
      }, '*');
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