// This script handles the popup UI interactions for the Dynamics CRM extension

document.addEventListener('DOMContentLoaded', function() {
  // Get UI elements
  const templateSelector = document.getElementById('template-selector');
  const fillAllButton = document.getElementById('fill-all');
  const fillContactButton = document.getElementById('fill-contact');
  const statusElement = document.getElementById('status');
  
  // Template data for different business types
  const templates = {
    business: {
      name: "Contoso Ltd",
      address1_line1: "123 Business Ave",
      address1_city: "Seattle",
      address1_stateorprovince: "WA",
      address1_postalcode: "98052",
      telephone1: "425-555-0100",
      emailaddress1: "info@contoso.com",
      websiteurl: "https://www.contoso.com",
      revenue: 1500000,
      numberofemployees: 250,
      description: "Contoso Ltd is a fictional business that provides enterprise solutions."
    },
    healthcare: {
      name: "Northwind Healthcare",
      address1_line1: "789 Medical Center Blvd",
      address1_city: "Portland",
      address1_stateorprovince: "OR",
      address1_postalcode: "97201",
      telephone1: "503-555-0199",
      emailaddress1: "contact@northwindhealthcare.org",
      websiteurl: "https://www.northwindhealthcare.org",
      revenue: 12500000,
      numberofemployees: 1250,
      description: "Northwind Healthcare is a comprehensive healthcare provider serving the Pacific Northwest."
    }
  };
  
  // Check if we're in a CRM page by querying active tabs
  function checkForCrmPage(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      if (!activeTab) {
        callback(false);
        return;
      }

      // Check if we can inject into this page
      chrome.tabs.sendMessage(activeTab.id, { action: "checkCrm" }, function(response) {
        if (chrome.runtime.lastError || !response || !response.isCrm) {
          callback(false);
          return;
        }
        callback(true, activeTab.id);
      });
    });
  }
  
  // Update status message
  function updateStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? "#e74c3c" : "#7f8c8d";
  }
  
  // Fill form data in active tab
  function fillFormData(templateType, contactOnly = false) {
    checkForCrmPage(function(isCrm, tabId) {
      if (!isCrm) {
        updateStatus("Not a Dynamics CRM page. Please navigate to a CRM form.", true);
        return;
      }
      
      const selectedTemplate = templates[templateType];
      if (!selectedTemplate) {
        updateStatus("Template not found.", true);
        return;
      }
      
      // Send data to content script
      chrome.tabs.sendMessage(tabId, { 
        action: "fillForm",
        data: selectedTemplate,
        contactOnly: contactOnly
      }, function(response) {
        if (chrome.runtime.lastError) {
          updateStatus("Error: " + chrome.runtime.lastError.message, true);
          return;
        }
        
        if (response && response.success) {
          updateStatus("Form filled successfully with " + templateType + " template.");
        } else {
          updateStatus("Failed to fill form: " + (response ? response.message : "Unknown error"), true);
        }
      });
    });
  }
  
  // Handle fill all button click
  fillAllButton.addEventListener('click', function() {
    const templateType = templateSelector.value;
    updateStatus("Filling all fields...");
    fillFormData(templateType, false);
  });
  
  // Handle fill contact button click
  fillContactButton.addEventListener('click', function() {
    const templateType = templateSelector.value;
    updateStatus("Filling contact information...");
    fillFormData(templateType, true);
  });
  
  // Initial status check
  checkForCrmPage(function(isCrm) {
    if (!isCrm) {
      updateStatus("Not a Dynamics CRM page. Please navigate to a CRM form.", true);
    } else {
      updateStatus("Ready to fill form data in Dynamics CRM.");
    }
  });
});
