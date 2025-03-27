import { Utility } from './common.utility.js';

/**
 * Main application class for the extension
 */
class App {
  /**
   * Constructor
   */
  constructor() {
    this.isCRMPage = Utility.isCrmPage();
  }

  /**
   * Start the application
   */
  start() {
    this.hookupEventListeners();
    
    if (this.isCRMPage) {
      // Inject our custom scripts when on a CRM page
      Utility.injectScript(chrome.runtime.getURL('crm-injector.js'));
      
      // Enable the extension
      Utility.enableExtension(true);
      
      console.log('CRM page detected, extension enabled');
    } else {
      Utility.enableExtension(false);
      console.log('Not a CRM page, extension disabled');
    }
  }

  /**
   * Set up event listeners
   */
  hookupEventListeners() {
    // Listen for custom levelup events
    document.addEventListener('levelup', (event) => {
      if (event.detail && event.detail.type === 'Page') {
        // Forward the event to the background script
        chrome.runtime.sendMessage(event.detail);
      }
    });

    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'INJECT_SCRIPT') {
        // Force script injection
        Utility.injectScript(chrome.runtime.getURL('crm-injector.js'));
        sendResponse({ success: true });
      }
    });
  }
}

// Initialize the application
new App().start();