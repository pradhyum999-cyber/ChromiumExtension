// This script handles the popup UI interactions for the Dynamics CRM extension

document.addEventListener('DOMContentLoaded', function() {
  // Get UI elements
  const templateSelector = document.getElementById('template-selector');
  const fillAllButton = document.getElementById('fill-all');
  const fillContactButton = document.getElementById('fill-contact');
  const forceInjectionButton = document.getElementById('force-injection');
  const statusElement = document.getElementById('status');
  const debugInfoElement = document.getElementById('debug-info');
  
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
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];
        if (!activeTab) {
          updateStatus("No active tab found", true);
          callback(false);
          return;
        }

        // Show URL of the active tab
        console.log("Checking tab:", activeTab.url);
        updateStatus("Detecting Dynamics CRM...", false);
        
        // First check basic URL patterns for quick filtering
        const url = activeTab.url;
        const isDynamicsDomain = url.includes('dynamics.com') || 
                                url.includes('.crm.') || 
                                url.includes('crm2.dynamics.com') || 
                                url.includes('crm4.dynamics.com') || 
                                url.includes('crm8.dynamics.com');
        
        // Use retry mechanism for more reliable detection
        const detectWithRetry = function(retryCount = 0, maxRetries = 3) {
          console.log(`CRM detection attempt ${retryCount + 1}/${maxRetries}`);
          
          // Try TEST_CONNECTION first (more robust but newer)
          chrome.tabs.sendMessage(activeTab.id, { action: "TEST_CONNECTION" }, function(testResponse) {
            // If we got a response and it was successful, use that
            if (!chrome.runtime.lastError && testResponse && testResponse.success) {
              console.log("TEST_CONNECTION successful:", testResponse);
              updateStatus("CRM detected via advanced method", false, 
                `CRM detection successful using ${testResponse.method || 'direct'} method.`);
              callback(true, activeTab.id);
              return;
            }
            
            // If TEST_CONNECTION failed, fallback to the standard checkCrm
            chrome.tabs.sendMessage(activeTab.id, { action: "checkCrm" }, function(response) {
              if (chrome.runtime.lastError) {
                const errorMessage = chrome.runtime.lastError.message;
                console.log("Extension error:", errorMessage);
                
                // If we have retries left, try again
                if (retryCount < maxRetries - 1) {
                  updateStatus(`Retrying CRM detection (${retryCount + 1}/${maxRetries})...`, false);
                  setTimeout(function() {
                    detectWithRetry(retryCount + 1, maxRetries);
                  }, 1000 * (retryCount + 1)); // Increasing delay
                  return;
                }
                
                // Last resort - check URL patterns
                if (isDynamicsDomain && (url.includes('/main.aspx') || url.includes('pagetype=entityrecord'))) {
                  updateStatus("Likely a CRM page based on URL, but can't connect", true, 
                    `Error: ${errorMessage}\nURL: ${activeTab.url}\nThe page appears to be CRM, but content script can't connect.`);
                } else {
                  updateStatus("Cannot communicate with page", true, 
                    `Error: ${errorMessage}\nURL: ${activeTab.url}\nMake sure content scripts can run on this page.`);
                }
                
                callback(false);
                return;
              }
              
              if (!response) {
                // If we have retries left, try again
                if (retryCount < maxRetries - 1) {
                  setTimeout(function() {
                    detectWithRetry(retryCount + 1, maxRetries);
                  }, 1000 * (retryCount + 1)); // Increasing delay
                  return;
                }
                
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
                // If we have retries left and there's a chance it's CRM, try again
                if (retryCount < maxRetries - 1 && (isDynamicsDomain || response.isDynamicsDomain)) {
                  updateStatus(`CRM not detected yet, retrying (${retryCount + 1}/${maxRetries})...`, false);
                  setTimeout(function() {
                    detectWithRetry(retryCount + 1, maxRetries);
                  }, 1000 * (retryCount + 1)); // Increasing delay
                  return;
                }
                
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
        };
        
        // Start detection with retry mechanism
        detectWithRetry();
      });
    } catch (error) {
      console.error("Error in checkForCrmPage:", error);
      updateStatus("Error checking for CRM page: " + error.message, true);
      if (typeof callback === 'function') callback(false);
    }
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
  
  // Handle force injection button click
  forceInjectionButton.addEventListener('click', function() {
    debugInfoElement.textContent = "Attempting to force script injection...";
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        debugInfoElement.textContent = "ERROR: No active tab found";
        return;
      }
      
      const activeTab = tabs[0];
      
      // First try injecting the Level Up approach with Sdk.Soap
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id, allFrames: true },
        files: ['scripts/Sdk.Soap.min.js', 'scripts/levelup.extension.js']
      }, function(levelUpResult) {
        if (chrome.runtime.lastError) {
          debugInfoElement.textContent += "\nLevel Up injection error: " + chrome.runtime.lastError.message;
          
          // Try the standard injector as second approach
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id, allFrames: true },
            files: ['crm-injector.js']
          }, function(injectorResult) {
            if (chrome.runtime.lastError) {
              debugInfoElement.textContent += "\nStandard injector error: " + chrome.runtime.lastError.message;
              
              // Next try injecting with the background script
              chrome.runtime.sendMessage({ 
                action: "injectCrmScript"
              }, function(response) {
                if (chrome.runtime.lastError) {
                  debugInfoElement.textContent += "\nBackground script error: " + chrome.runtime.lastError.message;
                  return;
                }
                
                debugInfoElement.textContent += "\nBackground script response: " + JSON.stringify(response);
              });
              return;
            }
            
            debugInfoElement.textContent += "\nStandard injector success!";
          });
          return;
        }
        
        debugInfoElement.textContent += "\nLevel Up injection successful!";
        
        // Now test the connection to verify it worked
        setTimeout(() => {
          chrome.tabs.sendMessage(activeTab.id, { 
            action: "TEST_CONNECTION" 
          }, function(testResponse) {
            if (chrome.runtime.lastError) {
              debugInfoElement.textContent += "\nTest connection error: " + chrome.runtime.lastError.message;
              return;
            }
            
            debugInfoElement.textContent += "\nTest connection response: " + JSON.stringify(testResponse);
            
            if (testResponse && testResponse.success) {
              debugInfoElement.textContent += "\n✅ CONNECTION SUCCESSFUL!";
              updateStatus("Script injection successful!", false);
            } else {
              debugInfoElement.textContent += "\n❌ CONNECTION FAILED";
              updateStatus("Script injection failed", true);
            }
          });
        }, 1000); // Give the injection a second to complete
      });
    });
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
