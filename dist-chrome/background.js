/**
 * Webflow Attribute Wizard Helper - Background Script
 */

// This function will be injected into the page to run the script content.
function runScript(scriptContent) {
  try {
    // Using the Function constructor is a safer way to execute dynamic code.
    new Function(scriptContent)();
  } catch (error) {
    console.error('Error executing injected script:', error);
  }
}

// A helper function to inject the script into a given tab.
async function injectScriptIntoTab(tabId) {
  const scriptUrl = 'https://cdn.jsdelivr.net/gh/Developer-Zahid/Webflow-Attribute-Class-Suggestion-Extension@latest/assets/js/script.min.js';
      
  try {
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch script: ${response.statusText}`);
    }
    const scriptContent = await response.text();

    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: runScript,
      args: [scriptContent],
      world: 'MAIN',
    });
  } catch (error) {
    console.error('Error injecting script:', error);
  }
}

// This function will just reload the page.
// It's injected when the extension is disabled to remove the script's effects.
function reloadPage() {
  window.location.reload();
}

// Helper to update the action badge based on the extension's state
async function updateActionState(isEnabled) {
  if (isEnabled) {
    await chrome.action.setBadgeText({ text: '' });
  } else {
    await chrome.action.setBadgeText({ text: 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ color: '#E53E3E' }); // Red
  }
}

// Helper to toggle popup action based on the tab's URL
function togglePopupAction(tab) {
  if (!tab || !tab.url) {
    chrome.action.disable();
    return;
  }
  // This regex ensures the popup is only available in the Webflow Designer
  const isWebflowDesigner = /^https:\/\/webflow\.com\/design\/.*$/.test(tab.url) || /^https:\/\/.*\.design\.webflow\.com\/.*$/.test(tab.url);

  if (isWebflowDesigner) {
    chrome.action.enable(tab.id);
  } else {
    chrome.action.disable(tab.id);
  }
}

// Listen for tab updates to inject the script and toggle popup availability.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  togglePopupAction(tab);

  const { extensionEnabled } = await chrome.storage.local.get({ extensionEnabled: true });
  if (!extensionEnabled) {
    return;
  }

  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      if (hostname.endsWith('.design.webflow.com')) {
        await injectScriptIntoTab(tabId);
      }
    } catch (error) {
      console.log('Could not parse URL, skipping injection.', error);
    }
  }
});

// Listen for when the user switches to a different tab
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        togglePopupAction(tab);
    });
});

// Listen for when the user switches to a different window
chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]) {
                togglePopupAction(tabs[0]);
            } else {
                chrome.action.disable();
            }
        });
    }
});

// Listen for storage changes to dynamically enable/disable the extension.
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.extensionEnabled) {
    const isEnabled = changes.extensionEnabled.newValue;
    updateActionState(isEnabled);
    
    // Find all Webflow designer tabs
    chrome.tabs.query({ url: ["*://webflow.com/*", "*://*.design.webflow.com/*"] }, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          if (isEnabled) {
            // If the extension is enabled, inject the script into active tabs.
            injectScriptIntoTab(tab.id);
          } else {
            // If disabled, reload the page to remove the injected script.
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: reloadPage,
              world: 'MAIN',
            })
            .catch(err => {
              console.error('Error executing reloadPage script:', err);
            });
          }
        }
      }
    });
  }
});

// Set initial state for all components when the extension starts
(async () => {
  const { extensionEnabled } = await chrome.storage.local.get({ extensionEnabled: true });
  await updateActionState(extensionEnabled);
  
  // Query all tabs to set popup state and inject scripts if necessary
  chrome.tabs.query({}, (tabs) => {
    if (!tabs || tabs.length === 0) {
      return;
    }

    for (const tab of tabs) {
      // First, set the popup action state for every tab
      togglePopupAction(tab);

      // If the extension is enabled, check if we need to inject the script
      if (extensionEnabled && tab.id && tab.url) {
        try {
          const url = new URL(tab.url);
          if (url.hostname.endsWith('.design.webflow.com')) {
            injectScriptIntoTab(tab.id);
          }
        } catch (error) {
          // Ignore tabs with invalid URLs
        }
      }
    }
  });


})();