/**
 * Main application class for the extension
 */
class App {
  /**
   * Constructor
   */
  constructor() {
    this.isCRMPage = Array.from(document.scripts).some(
      (script) =>
        script.src.indexOf('/uclient/scripts') !== -1 ||
        script.src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
        script.src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
    );
  }

  /**
   * Start the application
   */
  start() {
    this.hookupEventListeners();
    
    if (this.isCRMPage) {
      // Inject our custom scripts when on a CRM page
      const scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'text/javascript');
      scriptTag.setAttribute('src', chrome.runtime.getURL('crm-injector.js'));
      document.body.appendChild(scriptTag);
      
      // Enable the extension
      chrome.runtime.sendMessage({
        type: 'Page',
        content: 'On',
        category: 'Extension',
      });
      
      console.log('CRM page detected, extension enabled');
    } else {
      chrome.runtime.sendMessage({
        type: 'Page',
        content: 'Off',
        category: 'Extension',
      });
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
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.setAttribute('src', chrome.runtime.getURL('crm-injector.js'));
        document.body.appendChild(scriptTag);
        sendResponse({ success: true });
      }
    });
  }
}

// Initialize the application
new App().start();