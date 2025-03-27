// Dynamics CRM Form Auto-Fill Extension
console.log('Dynamics CRM Form Auto-Fill Extension Loaded');

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

// Initialize the extension interface
document.addEventListener('DOMContentLoaded', function() {
  createExtensionInterface();
  console.log('CRM Auto-Fill Interface Ready');
});

// Initialize immediately if document already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(createExtensionInterface, 0);
}