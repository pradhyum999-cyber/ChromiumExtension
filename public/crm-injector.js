/**
 * This script will be injected directly into the page context
 * and can access the Xrm object in Dynamics CRM
 */

// Make our CrmExtension globally accessible so content script can find it
window.exportToExtension = function(obj) {
  window._CRM_EXTENSION_EXPORTED_OBJECTS = window._CRM_EXTENSION_EXPORTED_OBJECTS || {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      window._CRM_EXTENSION_EXPORTED_OBJECTS[key] = obj[key];
    }
  }
  
  // Also set directly on window for easier access
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      window[key] = obj[key];
    }
  }
};

// Global namespace for our extension with enhanced communication and debugging
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

  // Get form context using all available methods (enhanced with Level Up approach)
  getFormContext: function() {
    try {
      // Detection method using script sources first (inspired by Level Up extension)
      const isCRMBasedOnScripts = Array.from(document.scripts).some(
        (script) =>
          script.src.indexOf('/uclient/scripts') !== -1 ||
          script.src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
          script.src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
      );
      
      if (isCRMBasedOnScripts) {
        CrmDataInjector.log('INFO', 'CRM script sources found in page, higher confidence that this is CRM');
      }
      
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
      
      // Search through all available frames - starting with the ones that might have Xrm objects
      CrmDataInjector.log('INFO', 'Searching through frames for Xrm object');
      
      // Look for frames with names or IDs that are likely to contain CRM forms
      const likelyFrames = [
        'contentIFrame0',
        'contentIFrame1',
        'contentIFrame2',
        'contentIFrame3',
        'areaContentIFrame',
        'gridIFrame',
        'inlineGridIFrame',
        'NavBarGlobalQuickCreate'
      ];
      
      // Try likely frames by name first
      for (let frameName of likelyFrames) {
        try {
          const frame = window.parent.frames[frameName];
          if (frame && frame.Xrm) {
            CrmDataInjector.log('INFO', `Found Xrm in named frame: ${frameName}`);
            if (frame.Xrm.Page && frame.Xrm.Page.data && frame.Xrm.Page.data.entity) {
              CrmDataInjector.log('INFO', `Using form context from named frame: ${frameName}`);
              return frame.Xrm.Page;
            }
          }
        } catch (frameError) {
          // Ignore cross-origin errors
        }
      }
      
      // Try document.getElementById
      for (let frameId of likelyFrames) {
        try {
          const frameElement = document.getElementById(frameId);
          if (frameElement && frameElement.contentWindow && frameElement.contentWindow.Xrm) {
            CrmDataInjector.log('INFO', `Found Xrm in frame by ID: ${frameId}`);
            if (frameElement.contentWindow.Xrm.Page && 
                frameElement.contentWindow.Xrm.Page.data && 
                frameElement.contentWindow.Xrm.Page.data.entity) {
              CrmDataInjector.log('INFO', `Using form context from frame ID: ${frameId}`);
              return frameElement.contentWindow.Xrm.Page;
            }
          }
        } catch (idError) {
          // Ignore cross-origin errors
        }
      }
      
      // Use the recursive approach as a fallback
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
      
      // Try to get the attribute by name
      var attribute = formContext.getAttribute(fieldName);
      
      // If not found, search all attributes - case insensitive
      if (!attribute) {
        CrmDataInjector.log('WARNING', 'Field ' + fieldName + ' not found directly, searching case-insensitive');
        // Get all attributes and search through them
        try {
          if (formContext.data && formContext.data.entity && formContext.data.entity.attributes) {
            var attributes = formContext.data.entity.attributes;
            // Handle collection objects
            if (typeof attributes.forEach === 'function') {
              attributes.forEach(function(attr) {
                var attrName = attr.getName();
                if (attrName && attrName.toLowerCase() === fieldName.toLowerCase()) {
                  attribute = attr;
                  CrmDataInjector.log('INFO', 'Found field ' + fieldName + ' as ' + attrName);
                }
              });
            }
          }
        } catch (searchError) {
          CrmDataInjector.log('ERROR', 'Error searching for field: ' + searchError.message);
        }
        
        // Still not found - fail
        if (!attribute) {
          CrmDataInjector.log('ERROR', 'Field ' + fieldName + ' not found after searching');
          return false;
        }
      }
      
      // Get the attribute type
      var attributeType = attribute.getAttributeType();
      CrmDataInjector.log('INFO', 'Setting field ' + fieldName + ' of type ' + attributeType + ' to: ' + JSON.stringify(value));
      
      // Save original value for validation
      var originalValue = attribute.getValue();
      
      // Handle different attribute types
      switch (attributeType) {
        case 'datetime':
          if (typeof value === 'string') {
            // Handle date strings including shorthand formats
            try {
              // Try direct Date conversion first
              var dateValue = new Date(value);
              
              // Check if we got a valid date
              if (isNaN(dateValue.getTime())) {
                // Try date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
                var datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$|^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
                var match = value.match(datePattern);
                
                if (match) {
                  // Check format: which group matched determines format
                  if (match[1]) {
                    // MM/DD/YYYY or DD/MM/YYYY - use US format as default
                    var month = parseInt(match[1]) - 1;
                    var day = parseInt(match[2]);
                    var year = parseInt(match[3]);
                    dateValue = new Date(year, month, day);
                  } else {
                    // YYYY-MM-DD
                    var year = parseInt(match[4]);
                    var month = parseInt(match[5]) - 1;
                    var day = parseInt(match[6]);
                    dateValue = new Date(year, month, day);
                  }
                } else {
                  // Try relative dates: "today", "tomorrow", "yesterday"
                  var today = new Date();
                  
                  if (value.toLowerCase() === "today") {
                    dateValue = today;
                  } else if (value.toLowerCase() === "tomorrow") {
                    dateValue = new Date(today);
                    dateValue.setDate(today.getDate() + 1);
                  } else if (value.toLowerCase() === "yesterday") {
                    dateValue = new Date(today);
                    dateValue.setDate(today.getDate() - 1);
                  }
                }
              }
              
              // Set the date if valid
              if (!isNaN(dateValue.getTime())) {
                attribute.setValue(dateValue);
              } else {
                CrmDataInjector.log('WARNING', 'Invalid date format: ' + value);
                return false;
              }
            } catch (dateError) {
              CrmDataInjector.log('ERROR', 'Error parsing date: ' + dateError.message);
              return false;
            }
          } else if (value instanceof Date) {
            attribute.setValue(value);
          } else {
            CrmDataInjector.log('WARNING', 'Invalid date value type: ' + typeof value);
            return false;
          }
          break;
        
        case 'picklist':
        case 'optionset':
          if (typeof value === 'number') {
            // Direct numeric value
            attribute.setValue(value);
          } else if (typeof value === 'string' && !isNaN(Number(value))) {
            // Numeric string
            attribute.setValue(Number(value));
          } else if (typeof value === 'string') {
            // Try to find the option by text (case insensitive)
            var options = attribute.getOptions();
            var found = false;
            
            options.forEach(function(option) {
              if (option.text && option.text.toLowerCase() === value.toLowerCase()) {
                attribute.setValue(option.value);
                found = true;
              }
            });
            
            if (!found) {
              // Try partial match as a fallback
              for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.text && option.text.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                  attribute.setValue(option.value);
                  CrmDataInjector.log('INFO', 'Used partial text match for option: ' + option.text);
                  found = true;
                  break;
                }
              }
            }
            
            if (!found) {
              CrmDataInjector.log('WARNING', 'Could not find option matching "' + value + '" for field ' + fieldName);
              return false;
            }
          }
          break;
        
        case 'boolean':
          if (typeof value === 'string') {
            var boolValue = value.toLowerCase();
            if (boolValue === 'true' || boolValue === 'yes' || boolValue === '1' || boolValue === 'on') {
              attribute.setValue(true);
            } else if (boolValue === 'false' || boolValue === 'no' || boolValue === '0' || boolValue === 'off') {
              attribute.setValue(false);
            } else {
              CrmDataInjector.log('WARNING', 'Unrecognized boolean value: ' + value);
              return false;
            }
          } else {
            // Use native Boolean value or conversion
            attribute.setValue(Boolean(value));
          }
          break;
        
        case 'money':
          // Handle various money formats and currencies
          var moneyValue = null;
          
          if (typeof value === 'number') {
            moneyValue = value;
          } else if (typeof value === 'string') {
            // Remove currency symbols and commas, then parse
            var cleanValue = value.replace(/[$€£¥,]/g, '').trim();
            var parsedValue = parseFloat(cleanValue);
            
            if (!isNaN(parsedValue)) {
              moneyValue = parsedValue;
            } else {
              CrmDataInjector.log('WARNING', 'Invalid money format: ' + value);
              return false;
            }
          }
          
          if (moneyValue !== null) {
            attribute.setValue(moneyValue);
          }
          break;
        
        case 'decimal':
        case 'double':
        case 'float':
          // Handle numeric fields with potential formatting
          var numValue = null;
          
          if (typeof value === 'number') {
            numValue = value;
          } else if (typeof value === 'string') {
            // Remove commas and other separators
            var cleanValue = value.replace(/[,]/g, '').trim();
            var parsedValue = parseFloat(cleanValue);
            
            if (!isNaN(parsedValue)) {
              numValue = parsedValue;
            } else {
              CrmDataInjector.log('WARNING', 'Invalid number format: ' + value);
              return false;
            }
          }
          
          if (numValue !== null) {
            attribute.setValue(numValue);
          }
          break;
        
        case 'integer':
          // Handle integer fields
          var intValue = null;
          
          if (typeof value === 'number') {
            intValue = Math.round(value);
          } else if (typeof value === 'string') {
            // Remove commas and other separators
            var cleanValue = value.replace(/[,]/g, '').trim();
            var parsedValue = parseInt(cleanValue, 10);
            
            if (!isNaN(parsedValue)) {
              intValue = parsedValue;
            } else {
              CrmDataInjector.log('WARNING', 'Invalid integer format: ' + value);
              return false;
            }
          }
          
          if (intValue !== null) {
            attribute.setValue(intValue);
          }
          break;
        
        case 'lookup':
          // Handle lookup fields - support both ID and name-based lookup
          if (value && typeof value === 'object' && value.id && value.entityType) {
            // Object with ID and entity type
            var lookupValue = [{
              id: value.id,
              name: value.name || '',
              entityType: value.entityType
            }];
            attribute.setValue(lookupValue);
          } else if (typeof value === 'string' && /^{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}?$/i.test(value)) {
            // Looks like a GUID - need to detect the entity type
            try {
              // Normalize GUID format
              var guid = value.replace(/[{}]/g, '');
              
              // Try to guess entity type from attribute name
              var entityType = '';
              
              // Common naming patterns
              var attributeName = attribute.getName().toLowerCase();
              if (attributeName.endsWith('id')) {
                // Remove "id" suffix and see if it matches common entities
                var baseEntity = attributeName.substr(0, attributeName.length - 2);
                entityType = baseEntity;
              } else if (attributeName.endsWith('customerid')) {
                // Special case for customer fields (account or contact)
                entityType = 'account'; // Default to account
              } else if (attributeName.indexOf('_') > 0) {
                // Pattern: entitytype_fieldname
                entityType = attributeName.split('_')[0];
              }
              
              // Create the lookup value
              var lookupValue = [{
                id: guid,
                name: 'Record', // We don't know the name
                entityType: entityType
              }];
              
              CrmDataInjector.log('INFO', 'Setting lookup value with guessed entity type: ' + entityType);
              attribute.setValue(lookupValue);
            } catch (lookupError) {
              CrmDataInjector.log('ERROR', 'Error setting lookup by GUID: ' + lookupError.message);
              return false;
            }
          } else {
            CrmDataInjector.log('WARNING', 'Invalid lookup value format, expected object or GUID');
            return false;
          }
          break;
        
        case 'multiselectoptionset':
          // Handle multi-select option sets
          try {
            // Support both arrays and comma-separated strings
            var selectedValues = [];
            
            if (Array.isArray(value)) {
              // Array of values - can be numbers or strings
              selectedValues = value.map(function(item) {
                return typeof item === 'string' && !isNaN(Number(item)) ? Number(item) : item;
              });
            } else if (typeof value === 'string') {
              // Try to parse as comma-separated values
              selectedValues = value.split(',').map(function(item) {
                var trimmed = item.trim();
                return !isNaN(Number(trimmed)) ? Number(trimmed) : trimmed;
              });
            }
            
            // If we have string values in the array, try to match by text
            if (selectedValues.some(function(v) { return typeof v === 'string'; })) {
              var options = attribute.getOptions();
              var resolvedValues = [];
              
              // For each selected value, try to find matching option
              selectedValues.forEach(function(val) {
                if (typeof val === 'number') {
                  resolvedValues.push(val);
                } else if (typeof val === 'string') {
                  // Find by text
                  var found = false;
                  
                  for (var i = 0; i < options.length; i++) {
                    var option = options[i];
                    if (option.text && option.text.toLowerCase() === val.toLowerCase()) {
                      resolvedValues.push(option.value);
                      found = true;
                      break;
                    }
                  }
                  
                  if (!found) {
                    CrmDataInjector.log('WARNING', 'Option not found: ' + val);
                  }
                }
              });
              
              if (resolvedValues.length > 0) {
                attribute.setValue(resolvedValues);
              } else {
                CrmDataInjector.log('WARNING', 'No valid options found for multiselect');
                return false;
              }
            } else {
              // All numeric values
              attribute.setValue(selectedValues);
            }
          } catch (multiSelectError) {
            CrmDataInjector.log('ERROR', 'Error setting multiselect: ' + multiSelectError.message);
            return false;
          }
          break;
        
        case 'memo':
        case 'string':
        case 'email':
        case 'url':
        case 'phone':
          // String types - handle different input types
          if (typeof value === 'string') {
            attribute.setValue(value);
          } else if (value === null || value === undefined) {
            attribute.setValue(null);
          } else {
            // Convert to string
            attribute.setValue(String(value));
          }
          break;
        
        default:
          // For any unhandled types, use direct assignment
          attribute.setValue(value);
      }
      
      // Verify that the value was set correctly
      try {
        var newValue = attribute.getValue();
        var success = newValue !== originalValue;
        
        // Special handling for some types
        if (!success && attributeType === 'lookup' && newValue && originalValue) {
          // For lookups, compare IDs
          if (Array.isArray(newValue) && Array.isArray(originalValue)) {
            if (newValue.length !== originalValue.length) {
              success = true;
            } else {
              success = newValue.some(function(nv, i) {
                return nv.id !== originalValue[i].id;
              });
            }
          }
        }
        
        if (!success) {
          CrmDataInjector.log('WARNING', 'Field appears unchanged after setting: ' + fieldName);
        }
        
        return true; // Still consider it a success even if value didn't change
      } catch (verifyError) {
        CrmDataInjector.log('WARNING', 'Error verifying field value: ' + verifyError.message);
        return true; // Assume success if we can't verify
      }
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
            
            // Get more detailed information to help debug
            var pageInfo = {};
            try {
              // Try to gather useful diagnostic info
              pageInfo.url = window.location.href;
              pageInfo.title = document.title;
              pageInfo.scripts = Array.from(document.scripts).map(s => s.src).filter(s => s.includes('/uclient/') || s.includes('/_static/'));
              
              if (formContext) {
                pageInfo.entityName = formContext.data.entity.getEntityName();
                pageInfo.formType = formContext.ui ? formContext.ui.getFormType() : 'Unknown';
                pageInfo.recordId = formContext.data.entity.getId ? formContext.data.entity.getId() : null;
                
                // Try to get control count
                if (formContext.ui && formContext.ui.controls) {
                  try {
                    var controlCount = 0;
                    formContext.ui.controls.forEach(function() { controlCount++; });
                    pageInfo.controlCount = controlCount;
                  } catch (controlError) {
                    pageInfo.controlCount = 'Error: ' + controlError.message;
                  }
                }
              }
            } catch (infoError) {
              pageInfo.error = infoError.message;
            }
            
            window.postMessage({
              type: 'CRM_EXTENSION_RESPONSE',
              command: 'TEST_CONNECTION',
              success: !!formContext,
              entityName: formContext ? formContext.data.entity.getEntityName() : null,
              pageInfo: pageInfo
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

// Export our injector to make it accessible to content scripts
try {
  // Create a global version for the content script to access
  window.CrmExtension = {
    testConnection: function() {
      try {
        var formContext = CrmDataInjector.getFormContext();
        console.log("CrmExtension.testConnection called, formContext:", !!formContext);
        
        // Get more detailed information to help debug
        var pageInfo = {};
        try {
          // Try to gather useful diagnostic info
          pageInfo.url = window.location.href;
          pageInfo.title = document.title;
          pageInfo.hostname = window.location.hostname;
          pageInfo.protocol = window.location.protocol;
          pageInfo.iframes = document.getElementsByTagName('iframe').length;
          pageInfo.scripts = Array.from(document.scripts)
            .map(s => s.src)
            .filter(s => s.includes('/uclient/') || s.includes('/_static/') || s.includes('crm'))
            .slice(0, 5); // Just get first 5 to avoid huge objects
          
          if (typeof Xrm !== 'undefined') {
            pageInfo.hasXrm = true;
            try {
              pageInfo.xrmVersion = Xrm.Page && Xrm.Page.context ? Xrm.Page.context.getVersion() : 'unknown';
            } catch (e) {
              pageInfo.xrmVersionError = e.message;
            }
          }
          
          if (formContext) {
            try {
              pageInfo.entityName = formContext.data.entity.getEntityName();
            } catch (e) { pageInfo.entityNameError = e.message; }
            
            try {
              pageInfo.formType = formContext.ui ? formContext.ui.getFormType() : 'Unknown';
            } catch (e) { pageInfo.formTypeError = e.message; }
            
            try {
              pageInfo.recordId = formContext.data.entity.getId ? formContext.data.entity.getId() : null;
            } catch (e) { pageInfo.recordIdError = e.message; }
          }
        } catch (infoError) {
          pageInfo.error = infoError.message;
        }
        
        // Send using multiple communication channels
        console.log("CrmExtension sending TEST_CONNECTION response with multiple channels");
        
        // Method 1: window.postMessage
        try {
          window.postMessage({
            type: 'CRM_EXTENSION_RESPONSE',
            command: 'TEST_CONNECTION',
            success: !!formContext,
            method: 'CrmExtension_direct',
            xrmFound: typeof Xrm !== 'undefined',
            formContextFound: !!formContext,
            pageInfo: pageInfo
          }, '*');
        } catch (e) {
          console.error("Error sending postMessage response:", e);
        }
        
        // Method 2: Custom event
        try {
          const responseEvent = new CustomEvent('crm_extension_response', {
            detail: {
              type: 'CRM_EXTENSION_RESPONSE',
              command: 'TEST_CONNECTION',
              success: !!formContext,
              method: 'CrmExtension_event',
              xrmFound: typeof Xrm !== 'undefined',
              formContextFound: !!formContext,
              pageInfo: pageInfo
            }
          });
          document.dispatchEvent(responseEvent);
        } catch (e) {
          console.error("Error dispatching custom event:", e);
        }
        
        // Method 3: Global variable as backup
        try {
          window._CRM_EXTENSION_LAST_RESPONSE = {
            type: 'CRM_EXTENSION_RESPONSE',
            command: 'TEST_CONNECTION',
            timestamp: new Date().getTime(),
            success: !!formContext,
            method: 'CrmExtension_global',
            xrmFound: typeof Xrm !== 'undefined',
            formContextFound: !!formContext,
            pageInfo: pageInfo
          };
        } catch (e) {
          console.error("Error setting global response variable:", e);
        }
        
        return !!formContext;
      } catch (e) {
        console.error("Error in CrmExtension.testConnection:", e);
        
        // Still try to send a response even if we failed
        try {
          window.postMessage({
            type: 'CRM_EXTENSION_RESPONSE',
            command: 'TEST_CONNECTION',
            success: false,
            error: e.message
          }, '*');
        } catch (postError) {
          console.error("Failed to send error response:", postError);
        }
        
        return false;
      }
    },
    
    getFields: function() {
      return CrmDataInjector.getFormFields();
    },
    
    fillFields: function(fieldValues) {
      return CrmDataInjector.fillFormFields(fieldValues);
    },
    
    getContext: function() {
      return CrmDataInjector.getFormContext();
    }
  };
  
  // Export it for easier access
  exportToExtension({
    CrmExtension: window.CrmExtension,
    CrmDataInjector: window.CrmDataInjector
  });
  
  console.log("CrmExtension successfully exported to window");
} catch (e) {
  console.error("Error exporting CrmExtension:", e);
}