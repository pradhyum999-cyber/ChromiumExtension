// Test script for Dynamics CRM form injection
console.log('CRM Form Injection Test Script Loaded');

// Sample data to inject into the CRM form
const sampleData = {
  singleField: {
    fieldName: 'accountName',
    value: 'Northwind Traders'
  },
  contactInfo: {
    phoneNumber: '(555) 987-6543',
    email: 'sales@northwindtraders.com',
    website: 'https://www.northwindtraders.com'
  },
  addressInfo: {
    street: '456 Commerce Avenue',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    country: 'United States'
  },
  completeAccount: {
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
    description: 'Northwind Traders is a global import/export company specializing in specialty food products from around the world. They maintain distribution centers in major cities across North America and Europe.'
  }
};

// Add extension-specific test buttons to the page
function addExtensionTests() {
  // Create extension test panel
  const extensionPanel = document.createElement('div');
  extensionPanel.className = 'extension-panel';
  extensionPanel.style.marginTop = '30px';
  extensionPanel.style.backgroundColor = '#e6f7ff';
  extensionPanel.style.borderColor = '#91d5ff';
  
  // Create title
  const title = document.createElement('div');
  title.className = 'extension-title';
  title.textContent = '🧪 Extension API Test Panel';
  extensionPanel.appendChild(title);
  
  // Create description
  const description = document.createElement('p');
  description.textContent = 'These buttons test the browser extension API for CRM form injection. They demonstrate how the extension API can be used by developers.';
  extensionPanel.appendChild(description);
  
  // Create buttons container
  const controls = document.createElement('div');
  controls.className = 'extension-controls';
  extensionPanel.appendChild(controls);
  
  // Test button 1: Check if page is CRM
  const btnCheckCRM = document.createElement('button');
  btnCheckCRM.className = 'extension-button';
  btnCheckCRM.style.backgroundColor = '#1890ff';
  btnCheckCRM.textContent = 'Check CRM Status';
  btnCheckCRM.addEventListener('click', testCheckCRMPage);
  controls.appendChild(btnCheckCRM);
  
  // Test button 2: Get form fields
  const btnGetFields = document.createElement('button');
  btnGetFields.className = 'extension-button';
  btnGetFields.style.backgroundColor = '#52c41a';
  btnGetFields.textContent = 'Get Form Fields';
  btnGetFields.addEventListener('click', testGetFormFields);
  controls.appendChild(btnGetFields);
  
  // Test button 3: Set single field
  const btnSetField = document.createElement('button');
  btnSetField.className = 'extension-button';
  btnSetField.style.backgroundColor = '#fa8c16';
  btnSetField.textContent = 'Set Company Name';
  btnSetField.addEventListener('click', testSetSingleField);
  controls.appendChild(btnSetField);
  
  // Test button 4: Fill contact info
  const btnFillContact = document.createElement('button');
  btnFillContact.className = 'extension-button';
  btnFillContact.style.backgroundColor = '#eb2f96';
  btnFillContact.textContent = 'Fill Contact Info';
  btnFillContact.addEventListener('click', testFillContactInfo);
  controls.appendChild(btnFillContact);
  
  // Test button 5: Fill all fields
  const btnFillAll = document.createElement('button');
  btnFillAll.className = 'extension-button';
  btnFillAll.style.backgroundColor = '#722ed1';
  btnFillAll.textContent = 'Fill Complete Account';
  btnFillAll.addEventListener('click', testFillAllFields);
  controls.appendChild(btnFillAll);
  
  // Add the panel to the page
  document.querySelector('.crm-form').appendChild(extensionPanel);
  
  // Create status panel for displaying results
  const statusPanel = document.createElement('div');
  statusPanel.id = 'extension-status';
  statusPanel.style.marginTop = '20px';
  statusPanel.style.padding = '15px';
  statusPanel.style.backgroundColor = '#f5f5f5';
  statusPanel.style.borderRadius = '4px';
  statusPanel.style.display = 'none';
  document.querySelector('.crm-form').appendChild(statusPanel);
}

// Show status message
function showStatus(message, isSuccess = true) {
  const statusPanel = document.getElementById('extension-status');
  statusPanel.textContent = message;
  statusPanel.style.display = 'block';
  statusPanel.style.backgroundColor = isSuccess ? '#f6ffed' : '#fff2f0';
  statusPanel.style.border = `1px solid ${isSuccess ? '#b7eb8f' : '#ffccc7'}`;
  statusPanel.style.color = isSuccess ? '#52c41a' : '#f5222d';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    statusPanel.style.display = 'none';
  }, 5000);
}

// Test functions
async function testCheckCRMPage() {
  try {
    // Use the browser extension API to check if this is a CRM page
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: "checkDynamicsCRM" }, function(response) {
        if (response && response.success) {
          showStatus(`CRM Status: isDynamicsCRM=${response.isDynamicsCRM}, hasForm=${response.hasForm}`);
        } else {
          showStatus(`Error checking CRM status: ${response?.error || 'Unknown error'}`, false);
        }
      });
    } else {
      // Simulate response in development environment
      showStatus(`CRM Status: isDynamicsCRM=true, hasForm=true (simulated)`);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, false);
  }
}

async function testGetFormFields() {
  try {
    // Use the browser extension API to get form fields
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: "getDynamicsCRMFields" }, function(response) {
        if (response && response.success) {
          const fieldCount = response.fields?.length || 0;
          showStatus(`Found ${fieldCount} form fields on the page`);
          console.log('Form fields:', response.fields);
        } else {
          showStatus(`Error getting form fields: ${response?.error || 'Unknown error'}`, false);
        }
      });
    } else {
      // Simulate response in development environment
      const fields = document.querySelectorAll('input, select, textarea');
      showStatus(`Found ${fields.length} form fields on the page (simulated)`);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, false);
  }
}

async function testSetSingleField() {
  try {
    // Use the browser extension API to set a single field
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ 
        action: "setDynamicsCRMField",
        fieldName: sampleData.singleField.fieldName,
        value: sampleData.singleField.value
      }, function(response) {
        if (response && response.success) {
          showStatus(`Successfully set field '${sampleData.singleField.fieldName}' to '${sampleData.singleField.value}'`);
        } else {
          showStatus(`Error setting field: ${response?.error || 'Unknown error'}`, false);
        }
      });
    } else {
      // Simulate response in development environment
      document.getElementById(sampleData.singleField.fieldName).value = sampleData.singleField.value;
      showStatus(`Successfully set field '${sampleData.singleField.fieldName}' to '${sampleData.singleField.value}' (simulated)`);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, false);
  }
}

async function testFillContactInfo() {
  try {
    // Use the browser extension API to fill contact info fields
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ 
        action: "fillDynamicsCRMForm",
        values: sampleData.contactInfo
      }, function(response) {
        if (response && response.success) {
          showStatus(`Successfully filled ${Object.keys(sampleData.contactInfo).length} contact fields`);
        } else {
          showStatus(`Error filling contact fields: ${response?.error || 'Unknown error'}`, false);
        }
      });
    } else {
      // Simulate response in development environment
      Object.entries(sampleData.contactInfo).forEach(([field, value]) => {
        const element = document.getElementById(field);
        if (element) element.value = value;
      });
      showStatus(`Successfully filled ${Object.keys(sampleData.contactInfo).length} contact fields (simulated)`);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, false);
  }
}

async function testFillAllFields() {
  try {
    // Use the browser extension API to fill all fields
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ 
        action: "fillDynamicsCRMForm",
        values: sampleData.completeAccount
      }, function(response) {
        if (response && response.success) {
          showStatus(`Successfully filled ${Object.keys(sampleData.completeAccount).length} account fields`);
        } else {
          showStatus(`Error filling account fields: ${response?.error || 'Unknown error'}`, false);
        }
      });
    } else {
      // Simulate response in development environment
      Object.entries(sampleData.completeAccount).forEach(([field, value]) => {
        const element = document.getElementById(field);
        if (element) element.value = value;
      });
      showStatus(`Successfully filled ${Object.keys(sampleData.completeAccount).length} account fields (simulated)`);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, false);
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add extension test buttons to the page
  addExtensionTests();
  console.log('CRM Form Injection Test Interface Ready');
});

// Add the extension tests immediately if document already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(addExtensionTests, 0);
}