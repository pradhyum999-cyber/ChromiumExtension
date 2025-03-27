// Dynamics CRM Form Auto-Fill Extension - Advanced Version with Diagnostics
console.log('Enhanced Dynamics CRM Form Auto-Fill Extension Loaded');

// Diagnostic logging
window.testDiagnostics = {
  startTime: new Date().getTime(),
  logs: [],
  environments: {},
  
  log: function(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp}: ${message}`);
    this.logs.push({ level, timestamp, message });
    
    // Send to extension if available
    try {
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage({
          type: 'CRM_EXTENSION_LOG',
          data: { level, message, timestamp }
        }, '*');
      }
    } catch (e) {
      console.error('Error sending log to extension:', e);
    }
  },
  
  detectEnvironment: function() {
    // Collect environment information
    try {
      this.environments.url = window.location.href;
      this.environments.hostname = window.location.hostname;
      this.environments.path = window.location.pathname;
      this.environments.title = document.title;
      this.environments.hasFrames = window.frames.length > 0;
      this.environments.frameCount = window.frames.length;
      this.environments.hasIFrames = document.getElementsByTagName('iframe').length > 0;
      this.environments.iframeCount = document.getElementsByTagName('iframe').length;
      this.environments.scripts = Array.from(document.scripts).map(s => s.src).filter(s => s.length > 0).slice(0, 10);
      this.environments.hasCrmScripts = Array.from(document.scripts).some(s => 
        s.src.indexOf('/uclient/scripts') !== -1 || 
        s.src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1
      );
      
      // Check for Xrm in this window
      this.environments.hasXrm = typeof Xrm !== 'undefined';
      if (this.environments.hasXrm && Xrm && Xrm.Page) {
        this.environments.hasXrmPage = true;
        if (Xrm.Page.data && Xrm.Page.data.entity) {
          this.environments.hasXrmEntity = true;
          try { 
            this.environments.entityName = Xrm.Page.data.entity.getEntityName();
          } catch(e) {}
        }
      }
      
      // Log the environment info
      this.log('INFO', 'Environment detected: ' + JSON.stringify(this.environments));
    } catch (e) {
      this.log('ERROR', 'Error detecting environment: ' + e.message);
    }
  },
  
  testCrmAccessibility: function() {
    try {
      // Create comprehensive diagnostics for Xrm access
      const diagnostics = {};
      
      // Test 1: Check global Xrm
      try {
        diagnostics.hasXrm = typeof Xrm !== 'undefined';
        if (diagnostics.hasXrm) {
          this.log('INFO', 'Found global Xrm object');
          
          // Check version
          try {
            diagnostics.xrmVersion = Xrm.Page && Xrm.Page.context ? 
                                     Xrm.Page.context.getVersion() : 'Unknown';
            this.log('INFO', `Xrm version: ${diagnostics.xrmVersion}`);
          } catch (e) {
            diagnostics.versionError = e.message;
          }
          
          // Check basic structure
          diagnostics.hasXrmPage = typeof Xrm.Page !== 'undefined';
          
          if (diagnostics.hasXrmPage) {
            diagnostics.hasData = typeof Xrm.Page.data !== 'undefined';
            diagnostics.hasEntity = diagnostics.hasData && typeof Xrm.Page.data.entity !== 'undefined';
            diagnostics.hasUI = typeof Xrm.Page.ui !== 'undefined';
            diagnostics.hasGetFormContext = typeof Xrm.Page.getFormContext === 'function';
            
            if (diagnostics.hasEntity) {
              try {
                diagnostics.entityName = Xrm.Page.data.entity.getEntityName();
                this.log('INFO', `Entity name: ${diagnostics.entityName}`);
              } catch (e) {
                diagnostics.entityNameError = e.message;
              }
            }
          }
        } else {
          this.log('INFO', 'No global Xrm object found, will try alternative detection methods');
        }
      } catch (e) {
        diagnostics.xrmTestError = e.message;
        this.log('ERROR', `Error testing global Xrm: ${e.message}`);
      }
      
      // Test 2: Check for Xrm in parent frame
      try {
        if (window.parent && window.parent !== window) {
          try {
            diagnostics.hasParentXrm = typeof window.parent.Xrm !== 'undefined';
            if (diagnostics.hasParentXrm) {
              this.log('INFO', 'Found Xrm in parent frame');
            }
          } catch (e) {
            diagnostics.parentXrmError = 'Cross-origin access denied';
          }
        }
      } catch (e) {
        diagnostics.parentFrameTestError = e.message;
      }
      
      // Test 3: Check for form context 
      try {
        // Try multiple methods to get form context
        let formContext = null;
        
        if (typeof Xrm !== 'undefined') {
          // Method 1: Modern API
          if (!formContext && Xrm.Page && Xrm.Page.getFormContext) {
            try {
              formContext = Xrm.Page.getFormContext();
              if (formContext) {
                diagnostics.formContextMethod = 'Xrm.Page.getFormContext';
                this.log('INFO', 'Got form context via Xrm.Page.getFormContext()');
              }
            } catch (e) {
              diagnostics.getFormContextError = e.message;
            }
          }
          
          // Method 2: Direct Xrm.Page
          if (!formContext && Xrm.Page && Xrm.Page.data && Xrm.Page.data.entity) {
            formContext = Xrm.Page;
            diagnostics.formContextMethod = 'Xrm.Page';
            this.log('INFO', 'Got form context via Xrm.Page');
          }
        }
        
        diagnostics.hasFormContext = !!formContext;
        if (formContext) {
          // Check form context capabilities
          try {
            diagnostics.canGetAttribute = typeof formContext.getAttribute === 'function';
            if (diagnostics.canGetAttribute) {
              const attrTest = formContext.getAttribute('name') || 
                              formContext.getAttribute('fullname') || 
                              formContext.getAttribute('accountnumber');
              diagnostics.attributeTest = !!attrTest;
            }
          } catch (e) {
            diagnostics.attributeTestError = e.message;
          }
          
          try {
            if (formContext.data && formContext.data.entity) {
              diagnostics.canGetEntityName = typeof formContext.data.entity.getEntityName === 'function';
              if (diagnostics.canGetEntityName) {
                diagnostics.entityName = formContext.data.entity.getEntityName();
              }
            }
          } catch (e) {
            diagnostics.entityNameTestError = e.message;
          }
        } else {
          this.log('WARNING', 'No form context found');
        }
      } catch (e) {
        diagnostics.formContextTestError = e.message;
        this.log('ERROR', `Error testing form context: ${e.message}`);
      }
      
      // Summarize diagnostics
      this.log('INFO', 'CRM diagnostics complete: ' + JSON.stringify(diagnostics));
      this.diagnostics = diagnostics;
      
      return diagnostics;
    } catch (e) {
      this.log('ERROR', `Error in CRM diagnostics: ${e.message}`);
      return { error: e.message };
    }
  }
};

// Sample data templates to inject into CRM forms
const dataTemplates = {
  // Business account template
  businessAccount: {
    accountName: 'Northwind Traders',
    accountNumber: 'NWTR-2023-789',
    industry: 'retail',
    annualRevenue: '7800000',
    phoneNumber: '(555) 987-6543',
    email: 'sales@northwindtraders.com',
    website: 'https://www.northwindtraders.com',
    street: '456 Commerce Avenue',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    country: 'United States',
    description: 'Northwind Traders is a global import/export company specializing in specialty food products from around the world.'
  },
  
  // Healthcare organization template
  healthcareOrg: {
    accountName: 'Mercy Medical Center',
    accountNumber: 'MMC-2023-456',
    industry: 'healthcare',
    annualRevenue: '25000000',
    phoneNumber: '(555) 456-7890',
    email: 'info@mercymedical.org',
    website: 'https://www.mercymedical.org',
    street: '789 Health Avenue',
    city: 'Boston',
    state: 'MA',
    postalCode: '02108',
    country: 'United States',
    description: 'Mercy Medical Center is a nonprofit healthcare organization providing comprehensive medical services to the greater Boston area.'
  }
};

// Add extension UI to the CRM form
function createExtensionInterface() {
  // Create extension panel
  const extensionPanel = document.createElement('div');
  extensionPanel.className = 'extension-panel';
  extensionPanel.style.margin = '30px 0';
  extensionPanel.style.padding = '20px';
  extensionPanel.style.backgroundColor = '#f9f9ff';
  extensionPanel.style.borderRadius = '8px';
  extensionPanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  extensionPanel.style.border = '1px solid #e1e4ff';
  
  // Create header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.marginBottom = '15px';
  
  const icon = document.createElement('div');
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" 
    stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  `;
  icon.style.marginRight = '10px';
  
  const title = document.createElement('h2');
  title.textContent = 'CRM Auto-Fill Tool';
  title.style.margin = '0';
  title.style.color = '#4338ca';
  title.style.fontSize = '18px';
  
  header.appendChild(icon);
  header.appendChild(title);
  extensionPanel.appendChild(header);
  
  // Create description
  const description = document.createElement('p');
  description.textContent = 'Select a data template and click the button to automatically fill in the form fields.';
  description.style.color = '#6b7280';
  description.style.marginBottom = '20px';
  extensionPanel.appendChild(description);
  
  // Create template selector
  const selectorContainer = document.createElement('div');
  selectorContainer.style.marginBottom = '20px';
  
  const selectorLabel = document.createElement('label');
  selectorLabel.textContent = 'Select Template:';
  selectorLabel.style.display = 'block';
  selectorLabel.style.marginBottom = '8px';
  selectorLabel.style.fontWeight = 'bold';
  selectorLabel.style.color = '#4b5563';
  
  const selector = document.createElement('select');
  selector.id = 'template-selector';
  selector.style.width = '100%';
  selector.style.padding = '10px';
  selector.style.borderRadius = '4px';
  selector.style.border = '1px solid #d1d5db';
  selector.style.backgroundColor = 'white';
  
  const option1 = document.createElement('option');
  option1.value = 'businessAccount';
  option1.textContent = 'Business Account';
  
  const option2 = document.createElement('option');
  option2.value = 'healthcareOrg';
  option2.textContent = 'Healthcare Organization';
  
  selector.appendChild(option1);
  selector.appendChild(option2);
  
  selectorContainer.appendChild(selectorLabel);
  selectorContainer.appendChild(selector);
  extensionPanel.appendChild(selectorContainer);
  
  // Create action buttons
  const actionsContainer = document.createElement('div');
  actionsContainer.style.display = 'flex';
  actionsContainer.style.gap = '10px';
  
  // Fill All Fields button
  const btnFillAll = document.createElement('button');
  btnFillAll.textContent = 'Fill All Fields';
  btnFillAll.style.flex = '1';
  btnFillAll.style.padding = '12px';
  btnFillAll.style.backgroundColor = '#4f46e5';
  btnFillAll.style.color = 'white';
  btnFillAll.style.border = 'none';
  btnFillAll.style.borderRadius = '4px';
  btnFillAll.style.cursor = 'pointer';
  btnFillAll.style.fontWeight = 'bold';
  btnFillAll.addEventListener('click', fillAllFields);
  
  // Fill Contact Info button
  const btnFillContact = document.createElement('button');
  btnFillContact.textContent = 'Fill Contact Info Only';
  btnFillContact.style.flex = '1';
  btnFillContact.style.padding = '12px';
  btnFillContact.style.backgroundColor = '#f9fafb';
  btnFillContact.style.color = '#4b5563';
  btnFillContact.style.border = '1px solid #d1d5db';
  btnFillContact.style.borderRadius = '4px';
  btnFillContact.style.cursor = 'pointer';
  btnFillContact.addEventListener('click', fillContactInfo);
  
  actionsContainer.appendChild(btnFillAll);
  actionsContainer.appendChild(btnFillContact);
  extensionPanel.appendChild(actionsContainer);
  
  // Status message area
  const statusArea = document.createElement('div');
  statusArea.id = 'status-message';
  statusArea.style.marginTop = '20px';
  statusArea.style.padding = '10px';
  statusArea.style.borderRadius = '4px';
  statusArea.style.display = 'none';
  extensionPanel.appendChild(statusArea);
  
  // Add the panel to the page
  document.querySelector('.crm-form').appendChild(extensionPanel);
}

// Show status message
function showStatus(message, isSuccess = true) {
  const statusArea = document.getElementById('status-message');
  if (!statusArea) return;
  
  statusArea.textContent = message;
  statusArea.style.display = 'block';
  statusArea.style.backgroundColor = isSuccess ? '#f0fdf4' : '#fef2f2';
  statusArea.style.color = isSuccess ? '#166534' : '#b91c1c';
  statusArea.style.border = `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`;
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    statusArea.style.display = 'none';
  }, 5000);
}

// Get the currently selected template data
function getSelectedTemplateData() {
  const selector = document.getElementById('template-selector');
  if (!selector) return dataTemplates.businessAccount;
  
  const templateKey = selector.value;
  return dataTemplates[templateKey] || dataTemplates.businessAccount;
}

// Fill all fields in the form
function fillAllFields() {
  try {
    const data = getSelectedTemplateData();
    
    // In a real extension, this would use chrome.runtime.sendMessage
    // Simulating the behavior for our test environment
    const fieldCount = fillFormWithData(data);
    
    showStatus(`Successfully filled ${fieldCount} fields with ${getSelectedTemplateName()} data`);
  } catch (error) {
    showStatus(`Error filling fields: ${error.message}`, false);
  }
}

// Fill only contact information fields
function fillContactInfo() {
  try {
    const data = getSelectedTemplateData();
    const contactData = {
      phoneNumber: data.phoneNumber,
      email: data.email,
      website: data.website
    };
    
    // In a real extension, this would use chrome.runtime.sendMessage
    // Simulating the behavior for our test environment
    const fieldCount = fillFormWithData(contactData);
    
    showStatus(`Successfully filled ${fieldCount} contact fields with ${getSelectedTemplateName()} data`);
  } catch (error) {
    showStatus(`Error filling contact fields: ${error.message}`, false);
  }
}

// Helper function to fill form with provided data
function fillFormWithData(data) {
  let filledCount = 0;
  
  Object.entries(data).forEach(([field, value]) => {
    const element = document.getElementById(field);
    if (element) {
      // Using Xrm API if available, otherwise direct DOM manipulation
      if (window.Xrm && window.Xrm.Page && window.Xrm.Page.getAttribute) {
        const attr = window.Xrm.Page.getAttribute(field);
        if (attr) {
          attr.setValue(value);
          filledCount++;
        }
      } else {
        element.value = value;
        filledCount++;
        
        // Trigger change event for form validation
        const event = new Event('change');
        element.dispatchEvent(event);
      }
    }
  });
  
  return filledCount;
}

// Get friendly name of selected template
function getSelectedTemplateName() {
  const selector = document.getElementById('template-selector');
  if (!selector) return "Business Account";
  
  return selector.options[selector.selectedIndex].text;
}

// Initialize the extension interface and run diagnostics
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Run diagnostics first
    window.testDiagnostics.log('INFO', 'Starting CRM extension diagnostics on DOMContentLoaded');
    window.testDiagnostics.detectEnvironment();
    window.testDiagnostics.testCrmAccessibility();
    
    // Try to create UI if appropriate
    createExtensionInterface();
    console.log('CRM Auto-Fill Interface Ready');
    
    // Send diagnostic info to parent if possible
    try {
      window.parent.postMessage({
        type: 'CRM_DIAGNOSTICS_RESULTS',
        data: {
          environments: window.testDiagnostics.environments,
          diagnostics: window.testDiagnostics.diagnostics,
          logs: window.testDiagnostics.logs
        }
      }, '*');
    } catch (e) {
      console.error('Error sending diagnostics to parent:', e);
    }
  } catch (e) {
    console.error('Error in CRM extension initialization:', e);
  }
});

// Initialize immediately if document already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(function() {
    try {
      // Run diagnostics first
      window.testDiagnostics.log('INFO', 'Starting CRM extension diagnostics (immediate)');
      window.testDiagnostics.detectEnvironment();
      window.testDiagnostics.testCrmAccessibility();
      
      // Try to create UI if appropriate
      createExtensionInterface();
      
      // Send diagnostic info to parent if possible
      try {
        window.parent.postMessage({
          type: 'CRM_DIAGNOSTICS_RESULTS',
          data: {
            environments: window.testDiagnostics.environments,
            diagnostics: window.testDiagnostics.diagnostics,
            logs: window.testDiagnostics.logs
          }
        }, '*');
      } catch (e) {
        console.error('Error sending diagnostics to parent:', e);
      }
    } catch (e) {
      console.error('Error in immediate CRM extension initialization:', e);
    }
  }, 0);
}

// Also add a global variable to make it easier to check if our script loaded
window.CRM_EXTENSION_LOADED = true;
window.CRM_EXTENSION_VERSION = '1.2.1';

// Add global diagnostics functions to make debugging easier
window.runCrmDiagnostics = function() {
  try {
    window.testDiagnostics.log('INFO', 'Running on-demand CRM diagnostics');
    const results = window.testDiagnostics.testCrmAccessibility();
    return {
      environments: window.testDiagnostics.environments,
      diagnostics: results,
      logs: window.testDiagnostics.logs
    };
  } catch (e) {
    console.error('Error running on-demand diagnostics:', e);
    return { error: e.message };
  }
};