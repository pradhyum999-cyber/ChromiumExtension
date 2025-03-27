/**
 * This script will be injected directly into the page context
 * and can access the Xrm object in Dynamics CRM
 */

// Global namespace for our extension
window.CrmDataInjector = {
  // Utility to log messages that can be seen in the extension popup
  log: function(level, message) {
    try {
      window.postMessage({
        type: 'CRM_EXTENSION_LOG',
        data: { 
          level: level,
          message: message,
          timestamp: new Date().toISOString()
        }
      }, '*');
    } catch (e) {
      console.error('Failed to log message:', e);
    }
  },

  // Get form context using all available methods
  getFormContext: function() {
    try {
      // First try the global Xrm
      if (typeof Xrm !== 'undefined') {
        CrmDataInjector.log('INFO', 'Global Xrm object found');
        
        // Current form in Unified Interface
        if (Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity) {
          CrmDataInjector.log('INFO', 'Using Xrm.Page form context');
          return Xrm.Page;
        }
        
        // Try to get form context via getCurrentForm
        if (Xrm.Page && Xrm.Page.ui && Xrm.Page.ui.formContext) {
          CrmDataInjector.log('INFO', 'Using Xrm.Page.ui.formContext');
          return Xrm.Page.ui.formContext;
        }
        
        // Try Unified Interface method
        if (Xrm.Page && Xrm.Page.getFormContext) {
          CrmDataInjector.log('INFO', 'Using Xrm.Page.getFormContext');
          return Xrm.Page.getFormContext();
        }
        
        // Try App for Outlook context
        if (Xrm.App && Xrm.App.findFormContext) {
          CrmDataInjector.log('INFO', 'Using Xrm.App.findFormContext');
          return Xrm.App.findFormContext();
        }
      }
      
      // Look for Xrm in parent frame
      if (window.parent && window.parent.Xrm) {
        CrmDataInjector.log('INFO', 'Found Xrm in parent frame');
        var parentXrm = window.parent.Xrm;
        
        if (parentXrm.Page && parentXrm.Page.data && parentXrm.Page.data.entity) {
          CrmDataInjector.log('INFO', 'Using parent Xrm.Page form context');
          return parentXrm.Page;
        }
        
        if (parentXrm.Page && parentXrm.Page.ui && parentXrm.Page.ui.formContext) {
          CrmDataInjector.log('INFO', 'Using parent Xrm.Page.ui.formContext');
          return parentXrm.Page.ui.formContext;
        }
      }
      
      // Search through all available frames
      CrmDataInjector.log('INFO', 'Searching through frames for Xrm object');
      var formContext = CrmDataInjector.findXrmInFrames(window);
      if (formContext) {
        return formContext;
      }
      
      CrmDataInjector.log('ERROR', 'Could not find Xrm object or form context in any frame');
      return null;
    } catch (e) {
      CrmDataInjector.log('ERROR', 'Error getting form context: ' + e.message);
      return null;
    }
  },
  
  // Recursively search through frames for Xrm object
  findXrmInFrames: function(windowObj) {
    try {
      // Check current window
      if (windowObj.Xrm) {
        if (windowObj.Xrm.Page && windowObj.Xrm.Page.data && windowObj.Xrm.Page.data.entity) {
          CrmDataInjector.log('INFO', 'Found Xrm in frame');
          return windowObj.Xrm.Page;
        }
      }
      
      // Check child frames
      for (var i = 0; i < windowObj.frames.length; i++) {
        try {
          var frame = windowObj.frames[i];
          // Try to access the frame (may fail due to cross-origin policy)
          if (frame.Xrm) {
            if (frame.Xrm.Page && frame.Xrm.Page.data && frame.Xrm.Page.data.entity) {
              CrmDataInjector.log('INFO', 'Found Xrm in child frame ' + i);
              return frame.Xrm.Page;
            }
          }
          
          // Recursively check child frames
          var childResult = CrmDataInjector.findXrmInFrames(frame);
          if (childResult) {
            return childResult;
          }
        } catch (frameError) {
          // Ignore cross-origin errors
        }
      }
      
      return null;
    } catch (e) {
      CrmDataInjector.log('ERROR', 'Error searching frames: ' + e.message);
      return null;
    }
  },
  
  // Get all form fields
  getFormFields: function() {
    try {
      var formContext = CrmDataInjector.getFormContext();
      if (!formContext) {
        CrmDataInjector.log('ERROR', 'Form context not available');
        return [];
      }
      
      var fields = [];
      var attributes = formContext.data.entity.attributes;
      
      // Handle collection object
      if (attributes && typeof attributes.forEach === 'function') {
        attributes.forEach(function(attribute) {
          try {
            fields.push({
              name: attribute.getName(),
              type: attribute.getAttributeType(),
              value: attribute.getValue(),
              isDirty: attribute.getIsDirty(),
              isRequired: attribute.getRequiredLevel() === 'required'
            });
          } catch (attrError) {
            CrmDataInjector.log('WARNING', 'Error processing attribute: ' + attrError.message);
          }
        });
      }
      
      CrmDataInjector.log('INFO', 'Retrieved ' + fields.length + ' form fields');
      return fields;
    } catch (e) {
      CrmDataInjector.log('ERROR', 'Error getting form fields: ' + e.message);
      return [];
    }
  },
  
  // Set a field value
  setFieldValue: function(fieldName, value) {
    try {
      var formContext = CrmDataInjector.getFormContext();
      if (!formContext) {
        CrmDataInjector.log('ERROR', 'Form context not available');
        return false;
      }
      
      var attribute = formContext.getAttribute(fieldName);
      if (!attribute) {
        CrmDataInjector.log('ERROR', 'Field ' + fieldName + ' not found');
        return false;
      }
      
      var attributeType = attribute.getAttributeType();
      CrmDataInjector.log('INFO', 'Setting field ' + fieldName + ' of type ' + attributeType + ' to: ' + JSON.stringify(value));
      
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
            var options = attribute.getOptions();
            var found = false;
            
            options.forEach(function(option) {
              if (option.text && option.text.toLowerCase() === value.toLowerCase()) {
                attribute.setValue(option.value);
                found = true;
              }
            });
            
            if (!found) {
              CrmDataInjector.log('WARNING', 'Could not find option matching ' + value + ' for field ' + fieldName);
              return false;
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
      
      CrmDataInjector.log('INFO', 'Successfully set field ' + fieldName);
      return true;
    } catch (e) {
      CrmDataInjector.log('ERROR', 'Error setting field ' + fieldName + ': ' + e.message);
      return false;
    }
  },
  
  // Fill multiple fields at once
  fillFormFields: function(fieldValues) {
    try {
      if (!fieldValues || typeof fieldValues !== 'object') {
        CrmDataInjector.log('ERROR', 'Invalid field values object');
        return false;
      }
      
      var successCount = 0;
      var totalFields = Object.keys(fieldValues).length;
      
      for (var field in fieldValues) {
        if (CrmDataInjector.setFieldValue(field, fieldValues[field])) {
          successCount++;
        }
      }
      
      CrmDataInjector.log('INFO', 'Successfully filled ' + successCount + '/' + totalFields + ' fields');
      return successCount > 0;
    } catch (e) {
      CrmDataInjector.log('ERROR', 'Error filling form fields: ' + e.message);
      return false;
    }
  },

  // Initialize and set up message listener
  initialize: function() {
    // Listen for messages from the extension
    window.addEventListener('message', function(event) {
      // Only accept messages from our extension
      if (event.data && event.data.type === 'CRM_EXTENSION_COMMAND') {
        CrmDataInjector.log('INFO', 'Received command: ' + event.data.command);
        
        switch (event.data.command) {
          case 'GET_FORM_FIELDS':
            var fields = CrmDataInjector.getFormFields();
            window.postMessage({
              type: 'CRM_EXTENSION_RESPONSE',
              command: 'GET_FORM_FIELDS',
              data: fields
            }, '*');
            break;
            
          case 'FILL_FORM_FIELDS':
            var result = CrmDataInjector.fillFormFields(event.data.data);
            window.postMessage({
              type: 'CRM_EXTENSION_RESPONSE',
              command: 'FILL_FORM_FIELDS',
              success: result
            }, '*');
            break;
            
          case 'TEST_CONNECTION':
            var formContext = CrmDataInjector.getFormContext();
            window.postMessage({
              type: 'CRM_EXTENSION_RESPONSE',
              command: 'TEST_CONNECTION',
              success: !!formContext,
              entityName: formContext ? formContext.data.entity.getEntityName() : null
            }, '*');
            break;
        }
      }
    });
    
    // Notify that the injector is ready
    CrmDataInjector.log('INFO', 'CRM Data Injector initialized successfully');
    window.postMessage({
      type: 'CRM_EXTENSION_INITIALIZED'
    }, '*');
  }
};

// Initialize when the script loads
CrmDataInjector.initialize();