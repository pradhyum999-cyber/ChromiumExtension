// This script handles the popup UI interactions for the Dynamics CRM extension

document.addEventListener('DOMContentLoaded', function() {
  // Get UI elements
  const templateSelector = document.getElementById('template-selector');
  const fillAllButton = document.getElementById('fill-all');
  const fillContactButton = document.getElementById('fill-contact');
  const statusElement = document.getElementById('status');
  
  // Template data for different entity types
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
    },
    contact: {
      // Core contact fields
      firstname: "John",
      lastname: "Doe",
      fullname: "John Doe",
      jobtitle: "Sales Manager",
      emailaddress1: "john.doe@example.com",
      telephone1: "555-123-4567",
      mobilephone: "555-987-6543",
      address1_line1: "123 Main Street",
      address1_city: "Seattle",
      address1_stateorprovince: "WA",
      address1_postalcode: "98101",
      address1_country: "United States",
      birthdate: new Date(1980, 5, 15).toISOString(),
      description: "Contact created via CRM Data Extension"
    }
  };
  
  // Check if we're in a CRM page by querying active tabs
  function checkForCrmPage(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      if (!activeTab) {
        updateStatus("No active tab found", true);
        callback(false);
        return;
      }

      // Show URL of the active tab
      console.log("Checking tab:", activeTab.url);
      
      // Check if we can inject into this page
      chrome.tabs.sendMessage(activeTab.id, { action: "checkCrm" }, function(response) {
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message;
          console.log("Extension error:", errorMessage);
          updateStatus("Cannot communicate with page", true, 
            `Error: ${errorMessage}\nURL: ${activeTab.url}\nMake sure content scripts can run on this page.`);
          callback(false);
          return;
        }
        
        if (!response) {
          updateStatus("No response from content script", true, 
            `URL: ${activeTab.url}\nPossible reasons:\n- Content script not injected\n- Page is not compatible`);
          callback(false);
          return;
        }
        
        console.log("CRM check response:", response);
        
        // Show detailed debugging information
        const details = {
          url: response.url || activeTab.url,
          isDynamicsDomain: response.isDynamicsDomain,
          hasXrm: response.hasXrm,
          hasCrmUrlPattern: response.hasCrmUrlPattern,
          isCrm: response.isCrm,
          hasForm: response.hasForm
        };
        
        if (!response.isCrm) {
          updateStatus("Not a Dynamics CRM page", true, 
            `The page doesn't appear to be a Dynamics CRM form. Debug info:\n${JSON.stringify(details, null, 2)}`);
          callback(false);
          return;
        }
        
        if (!response.hasForm) {
          updateStatus("No form detected in CRM", true, 
            `Detected a CRM page, but no form is available. Debug info:\n${JSON.stringify(details, null, 2)}`);
          callback(false, activeTab.id);
          return;
        }
        
        updateStatus("Ready to fill form data in Dynamics CRM", false, 
          `CRM detected and form is available. Debug info:\n${JSON.stringify(details, null, 2)}`);
        callback(true, activeTab.id);
      });
    });
  }
  
  // Update status message
  function updateStatus(message, isError = false, details = null) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? "#e74c3c" : "#7f8c8d";
    
    // If detailed debugging info is provided, show it in a smaller font below
    if (details) {
      let detailsDiv = document.getElementById('status-details');
      if (!detailsDiv) {
        detailsDiv = document.createElement('div');
        detailsDiv.id = 'status-details';
        detailsDiv.style.fontSize = '10px';
        detailsDiv.style.marginTop = '10px';
        detailsDiv.style.color = '#7f8c8d';
        detailsDiv.style.whiteSpace = 'pre-wrap';
        detailsDiv.style.wordBreak = 'break-all';
        statusElement.parentNode.appendChild(detailsDiv);
      }
      
      detailsDiv.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
    } else {
      const detailsDiv = document.getElementById('status-details');
      if (detailsDiv) {
        detailsDiv.remove();
      }
    }
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
