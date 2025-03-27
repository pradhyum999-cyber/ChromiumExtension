/**
 * Utility functions for CRM Data Injector
 */
export class Utility {
  /**
   * Injects a script into the page
   * @param {string} scriptUrl URL of the script to inject
   */
  static injectScript(scriptUrl) {
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.setAttribute('src', scriptUrl);
    document.body.appendChild(scriptTag);
  }

  /**
   * Enables or disables the extension icon
   * @param {boolean} isEnable Whether the extension should be enabled
   */
  static enableExtension(isEnable) {
    chrome.runtime.sendMessage({
      type: 'Page',
      content: isEnable ? 'On' : 'Off',
      category: 'Extension',
    });
  }

  /**
   * Sends a message to the extension
   * @param {any} message Message content
   * @param {string} category Message category
   */
  static messageExtension(message, category) {
    const extensionMessage = {
      type: 'Page',
      category: category,
      content: message,
    };

    const levelUpEvent = new CustomEvent('levelup', {
      detail: extensionMessage,
    });
    levelUpEvent.initEvent('levelup', false, false);
    document.dispatchEvent(levelUpEvent);
  }

  /**
   * Detects if the current page is a Dynamics CRM page
   * @returns {boolean} Whether the page is a Dynamics CRM page
   */
  static isCrmPage() {
    return Array.from(document.scripts).some(
      (script) =>
        script.src.indexOf('/uclient/scripts') !== -1 ||
        script.src.indexOf('/_static/_common/scripts/PageLoader.js') !== -1 ||
        script.src.indexOf('/_static/_common/scripts/crminternalutility.js') !== -1
    );
  }

  /**
   * Copies a value to the clipboard
   * @param {string} valueToCopy Value to copy
   */
  static copy(valueToCopy) {
    const t = document.createElement('input');
    t.setAttribute('id', 'copy');
    t.setAttribute('value', valueToCopy);
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }

  /**
   * Finds the Xrm object in all available frames
   * @param {Window} windowObj Window to search in
   * @returns {object|null} Xrm object or null if not found
   */
  static findXrmInFrames(windowObj) {
    try {
      // Check current window
      if (windowObj.Xrm) {
        return windowObj.Xrm;
      }
      
      // Check specific frames that are likely to contain Xrm
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
      
      // Try frames by name
      for (const frameName of likelyFrames) {
        try {
          const frame = windowObj.frames[frameName];
          if (frame && frame.Xrm) {
            return frame.Xrm;
          }
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
      
      // Try frames by ID
      for (const frameId of likelyFrames) {
        try {
          const frameElement = document.getElementById(frameId);
          if (frameElement && frameElement.contentWindow && frameElement.contentWindow.Xrm) {
            return frameElement.contentWindow.Xrm;
          }
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
      
      // Check all frames
      for (let i = 0; i < windowObj.frames.length; i++) {
        try {
          const frame = windowObj.frames[i];
          if (frame.Xrm) {
            return frame.Xrm;
          }
          
          // Recursively check child frames
          const childResult = Utility.findXrmInFrames(frame);
          if (childResult) {
            return childResult;
          }
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
      
      return null;
    } catch (e) {
      console.error('Error searching for Xrm in frames:', e);
      return null;
    }
  }
}